"use client";

import { useEffect, useRef } from "react";
import type { ResourceType, RequestParameters } from "maplibre-gl";
import type { LocationPoint } from "@/types/map";

/**
 * MapView — Full-screen interactive map
 *
 * Features:
 * - Full-screen canvas under TopNav, resizes with viewport
 * - Dark map theme (dark_matter)
 * - Interactive pins in flamingo-400 color
 * - Click pin → onSelect callback
 * - ESC key → deselect
 * - Selected pin highlighted
 *
 * Props:
 * - points: LocationPoint[] — Array of location markers to display
 * - activeId?: string — Currently selected location ID
 * - onSelect: (id: string) => void — Callback when pin is clicked
 * - onDeselect: () => void — Callback to clear selection
 */
export default function MapView({
  points,
  activeId,
  onSelect,
  onDeselect,
}: {
  points: LocationPoint[];
  activeId?: string;
  onSelect: (id: string) => void;
  onDeselect: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  // ESC key to deselect
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeId) {
        onDeselect();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeId, onDeselect]);

  useEffect(() => {
    let maplib: any;
    let map: any;
    let destroyed = false;

    (async () => {
      const [{ default: maplibregl }] = await Promise.all([
        import("maplibre-gl"),
      ]);
      if (destroyed) return;

      // Inject MapLibre CSS via CDN
      const linkId = "maplibre-css";
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css";
        document.head.appendChild(link);
      }

      maplib = maplibregl;

      // Initialize map with dark theme
      map = new maplibregl.Map({
        container: containerRef.current!,
        style: "/map/styles/dark_matter.json",
        center: [0, 15],
        zoom: 1.6,
        attributionControl: true,
        transformRequest: (
          u: string | RequestParameters,
          _resourceType?: ResourceType
        ): RequestParameters => {
          const url = typeof u === "string" ? u : (u?.url as string | undefined) || "";
          if (!url) return typeof u === "string" ? { url: u } : (u as RequestParameters);

          // Handle MapTiler API key if needed
          const token = process.env.NEXT_PUBLIC_MAPTILER_KEY;
          if (!token) return { url };

          const needsKey = url.includes("api.maptiler.com") || url.includes("tilehosting.com");
          if (!needsKey) return { url };

          if (url.includes("key=")) {
            return { url: url.replace(/key=[^&]*/i, `key=${token}`) };
          }
          const sep = url.includes("?") ? "&" : "?";
          return { url: `${url}${sep}key=${token}` };
        },
      });

      mapRef.current = map;

      // Add navigation controls
      map.addControl(new maplib.NavigationControl({ visualizePitch: true }));

      map.on("load", () => {

        // Convert LocationPoint[] to GeoJSON
        const geojson = {
          type: "FeatureCollection",
          features: points.map((point) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [point.lng, point.lat],
            },
            properties: {
              id: point.id,
              name: point.name,
              attestationCount: point.attestationCount,
            },
          })),
        };

        // Add source
        if (!map.getSource("locations")) {
          map.addSource("locations", {
            type: "geojson",
            data: geojson,
          });
        }

        // Add layer with flamingo-400 color (#FF7F5C per Tailwind config)
        if (!map.getLayer("location-pins")) {
          map.addLayer({
            id: "location-pins",
            type: "circle",
            source: "locations",
            paint: {
              "circle-radius": [
                "case",
                ["==", ["get", "id"], activeId || ""],
                10, // Highlighted size
                6,  // Default size
              ],
              "circle-color": "#FF7F5C", // flamingo-400
              "circle-stroke-width": 2,
              "circle-stroke-color": [
                "case",
                ["==", ["get", "id"], activeId || ""],
                "#FFFFFF", // White stroke when selected
                "rgba(255, 127, 92, 0.4)", // Flamingo with opacity
              ],
            },
          });
        }

        // Click handler for pins
        map.on("click", "location-pins", (e: any) => {
          e.originalEvent.stopPropagation(); // Prevent map click
          const feature = e?.features?.[0];
          if (!feature) return;
          const locationId = feature.properties.id;
          onSelect(locationId);
        });

        // Click handler for map background (deselect)
        map.on("click", (e: any) => {
          // Only deselect if clicking empty map (not on a pin)
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["location-pins"],
          });
          if (features.length === 0 && activeId) {
            onDeselect();
          }
        });

        // Cursor pointer on hover
        map.on("mouseenter", "location-pins", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "location-pins", () => {
          map.getCanvas().style.cursor = "";
        });
      });
    })();

    return () => {
      destroyed = true;
      try {
        mapRef.current?.remove();
      } catch {}
    };
  }, [points, activeId, onSelect, onDeselect]);

  return (
    <div className="absolute inset-0 bg-vulcan-900 overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
