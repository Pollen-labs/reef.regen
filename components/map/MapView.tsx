"use client";

import { useEffect, useRef, useState } from "react";
import type { ResourceType, RequestParameters } from "maplibre-gl";
import type { LocationPoint } from "@/types/map";
import { MAP_COLORS } from "@/lib/style/mapColors";

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
  // Multi-select popover for overlapping pins at identical coordinates
  const [multi, setMulti] = useState<
    | null
    | {
        x: number;
        y: number;
        items: { id: string; name: string; orgName?: string | null; attestationCount: number }[];
      }
  >(null);
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
        minZoom: 2, // avoid world repeating at z0
        pitch: 0,
        dragRotate: false,
        pitchWithRotate: false,
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

      // Controls: show +/− zoom, hide compass (rotation disabled)
      map.addControl(new maplibregl.NavigationControl({ showZoom: true, showCompass: false, visualizePitch: false }));

      // Extra safety: disable rotate interactions from all inputs
      try {
        map.dragRotate.disable();
        if (map.touchZoomRotate && map.touchZoomRotate.disableRotation) {
          map.touchZoomRotate.disableRotation();
        }
      } catch {}

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
              // Use design system colors via MAP_COLORS
              "circle-color": [
                "case",
                [">", ["get", "attestationCount"], 0],
                MAP_COLORS.pin.hasData,
                MAP_COLORS.pin.noData
              ],
              "circle-stroke-width": 1,
              "circle-stroke-color": MAP_COLORS.stroke,
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

        // Temporary pulse for multi-select hint (non-animated)
        if (!map.getLayer("location-pulse-temp")) {
          map.addLayer({
            id: "location-pulse-temp",
            type: "circle",
            source: "locations",
            filter: ["==", ["get", "id"], ""],
            paint: {
              "circle-radius": 14,
              "circle-color": "rgba(0,0,0,0)",
              "circle-opacity": 0,
              "circle-stroke-color": "rgba(255,255,255,0.45)",
              "circle-stroke-width": 3,
              "circle-stroke-opacity": 0.45,
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
                orgName: (point as any).orgName ?? undefined,
                attestationCount: point.attestationCount,
                color: (point as any).colorHex || undefined,
              },
            })),
          } as const;
          try {
            (source as any).setData(geojson);
          } catch {}
        }

        // Click handler for pins — disambiguate overlapping points
        map.on("click", "location-pins", (e: any) => {
          e.originalEvent.stopPropagation();
          // Query all pins near the click using a small bounding box (radius not in type)
          const pad = 6;
          const bbox: [[number, number], [number, number]] = [
            [e.point.x - pad, e.point.y - pad],
            [e.point.x + pad, e.point.y + pad],
          ];
          const features = map.queryRenderedFeatures(bbox, { layers: ["location-pins"] }) as any[];
          const itemsMap = new Map<string, { id: string; name: string; orgName?: string | null; attestationCount: number }>();
          for (const f of features) {
            const props = f?.properties || {};
            if (!props?.id) continue;
            if (!itemsMap.has(props.id)) {
              itemsMap.set(props.id, {
                id: String(props.id),
                name: String(props.name || "Unknown Site"),
                orgName: props.orgName ? String(props.orgName) : undefined,
                attestationCount: Number(props.attestationCount || 0),
              });
            }
          }
          const items = Array.from(itemsMap.values());

          if (items.length <= 1) {
            // Single item → select directly
            const feature = features?.[0];
            const locationId = feature?.properties?.id;
            if (locationId) onSelectRef.current(locationId);
            setMulti(null);
            return;
          }

          // Multiple items → show disambiguation list near click
          setMulti({ x: e.point.x, y: e.point.y, items });
          try {
            map.setFilter("location-pulse-temp", ["==", ["get", "id"], items[0].id]);
          } catch {}
        });

        // Click handler for background: deselect if not on a pin
        map.on("click", (e: any) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ["location-pins"] });
          if (features.length === 0) {
            onDeselectRef.current();
            setMulti(null);
            try { map.setFilter("location-pulse-temp", ["==", ["get", "id"], ""]); } catch {}
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
          orgName: (point as any).orgName ?? undefined,
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
      {multi && (
        <div
          className="absolute z-20 max-w-[80vw] sm:max-w-xs"
          style={{ left: multi.x + 12, top: multi.y + 12 }}
        >
          <div className="rounded-2xl bg-vulcan-900/90 outline outline-1 outline-white/10 shadow-xl overflow-hidden">
            <ul className="divide-y divide-white/10">
              {multi.items.map((it) => (
                <li key={it.id}>
                  <button
                    onClick={() => { onSelectRef.current(it.id); setMulti(null); }}
                    className="w-full text-left px-4 py-3 block hover:bg-white/5"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-2 inline-block h-2 w-2 rounded-full ${it.attestationCount > 0 ? 'bg-orange' : 'bg-vulcan-500'}`}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <div className={`text-base font-bold leading-7 truncate ${it.attestationCount > 0 ? 'text-orange' : 'text-vulcan-400'}`}>{it.name}</div>
                        {it.orgName && (
                          <div className="text-sm text-vulcan-300 truncate">by {it.orgName}</div>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
