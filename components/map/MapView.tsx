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
  const pulseRafRef = useRef<number | null>(null);
  const pulseStartRef = useRef<number>(0);
  // Keep latest points for when map loads later
  const pointsRef = useRef(points);
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

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

  // Keep latest callbacks in refs to avoid re-binding map events
  const onSelectRef = useRef(onSelect);
  const onDeselectRef = useRef(onDeselect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    onDeselectRef.current = onDeselect;
  }, [onDeselect]);

  // Initialize map once
  useEffect(() => {
    let destroyed = false;
    (async () => {
      const [{ default: maplibregl }] = await Promise.all([
        import("maplibre-gl"),
      ]);
      if (destroyed) return;

      // Inject MapLibre CSS via CDN once
      const linkId = "maplibre-css";
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css";
        document.head.appendChild(link);
      }

      const map = new maplibregl.Map({
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

          const token = process.env.NEXT_PUBLIC_OPENMAPTILES_KEY;
          
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

      // Controls
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));

      map.on("load", () => {
        // Initial empty source (data will be set by points effect)
        if (!map.getSource("locations")) {
          map.addSource("locations", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
        }
        if (!map.getLayer("location-pins")) {
          map.addLayer({
            id: "location-pins",
            type: "circle",
            source: "locations",
            paint: {
              "circle-radius": ["case", ["==", ["get", "id"], ""], 10, 6],
              // Back to fixed brand orange for all pins
              "circle-color": "#FF7F5C",
              "circle-stroke-width": 1,
              "circle-stroke-color": "#3C3D50", // vulcan-800
            },
          });
        }

        // Add pulsing selection ring layer (initially hidden via filter)
        if (!map.getLayer("location-pulse")) {
          map.addLayer({
            id: "location-pulse",
            type: "circle",
            source: "locations",
            // Initially no feature matches this ID
            filter: ["==", ["get", "id"], ""],
            paint: {
              "circle-radius": 14, // ring radius around selected dot
              "circle-color": "rgba(0,0,0,0)",
              "circle-opacity": 0, // ensure fill invisible
              "circle-stroke-color": "rgba(255,255,255,0.6)", // white 60%
              "circle-stroke-width": 3,
              "circle-stroke-opacity": 0.6,
            },
          });
        }

        // Set initial data using the latest points
        const source = map.getSource("locations");
        if (source) {
          const geojson = {
            type: "FeatureCollection",
            features: pointsRef.current.map((point) => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: [point.lng, point.lat] },
              properties: {
                id: point.id,
                name: point.name,
                attestationCount: point.attestationCount,
                color: (point as any).colorHex || undefined,
              },
            })),
          } as const;
          try {
            (source as any).setData(geojson);
          } catch {}
        }

        // Click handler for pins
        map.on("click", "location-pins", (e: any) => {
          e.originalEvent.stopPropagation();
          const feature = e?.features?.[0];
          if (!feature) return;
          const locationId = feature.properties.id;
          onSelectRef.current(locationId);
        });

        // Click handler for background: deselect if not on a pin
        map.on("click", (e: any) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ["location-pins"] });
          if (features.length === 0) {
            onDeselectRef.current();
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
  }, []);

  // Update source data when points change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("locations");
    if (!source) return;

    const geojson = {
      type: "FeatureCollection",
      features: points.map((point) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [point.lng, point.lat] },
        properties: {
          id: point.id,
          name: point.name,
          attestationCount: point.attestationCount,
          color: point.colorHex || undefined,
        },
      })),
    };

    try {
      (source as any).setData(geojson);
    } catch {}
  }, [points]);

  // Update styling for active selection without recreating map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.getLayer("location-pins")) return;

    const radiusExpr = [
      "case",
      ["==", ["get", "id"], activeId || ""],
      10,
      6,
    ];

    try {
      map.setPaintProperty("location-pins", "circle-radius", radiusExpr as any);
      // Ensure stroke remains vulcan-800, 1px (color handled per-feature)
      map.setPaintProperty("location-pins", "circle-stroke-color", "#3C3D50");
      map.setPaintProperty("location-pins", "circle-stroke-width", 1 as any);
    } catch {}
  }, [activeId]);

  // Manage pulsing ring animation for the selected feature
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("location-pulse")) return;

    // Update filter to match the active feature
    const idToShow = activeId || "";
    try {
      map.setFilter("location-pulse", ["==", ["get", "id"], idToShow]);
    } catch {}

    // Stop any previous animation
    if (pulseRafRef.current) {
      cancelAnimationFrame(pulseRafRef.current);
      pulseRafRef.current = null;
    }

    if (!activeId) {
      // Hide stroke if no active selection
      try {
        map.setPaintProperty("location-pulse", "circle-stroke-opacity", 0);
      } catch {}
      return;
    }

    pulseStartRef.current = performance.now();

    const animate = (now: number) => {
      const t = (now - pulseStartRef.current) / 1000; // seconds
      // Opacity pulses between 0.3 and 0.6 (peak at 0.6)
      const opacity = 0.45 + 0.15 * Math.sin(t * 2 * Math.PI * 1.2);
      // Keep radius steady to meet spec; tweak slightly for subtle breathing
      const radius = 14 + 0.5 * Math.sin(t * 2 * Math.PI * 1.2);
      try {
        map.setPaintProperty("location-pulse", "circle-stroke-opacity", Math.max(0.3, Math.min(0.6, opacity)));
        map.setPaintProperty("location-pulse", "circle-radius", radius as any);
      } catch {}
      pulseRafRef.current = requestAnimationFrame(animate);
    };

    pulseRafRef.current = requestAnimationFrame(animate);

    return () => {
      if (pulseRafRef.current) {
        cancelAnimationFrame(pulseRafRef.current);
        pulseRafRef.current = null;
      }
    };
  }, [activeId]);

  return (
    <div className="absolute inset-0 bg-vulcan-900 overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
