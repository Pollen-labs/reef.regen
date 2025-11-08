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
  const multiPopoverRef = useRef<HTMLDivElement | null>(null);
  // Multi-select popover for overlapping pins at identical coordinates
  const [multi, setMulti] = useState<
    | null
    | {
        x: number;
        y: number;
        items: { id: string; name: string; orgName?: string | null; attestationCount: number }[];
      }
  >(null);
  const [multiPosition, setMultiPosition] = useState<{ left: number; top: number } | null>(null);
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

      // Mobile: focus on east coast of America, Desktop: default (Africa)
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const initialCenter: [number, number] = isMobile ? [-75, 38] : [0, 15]; // Mobile: east coast US, Desktop: Africa
      const initialZoom = isMobile ? 2.5 : 1.6; // Slightly closer zoom for mobile

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: "/map/styles/dark_matter.json",
        center: initialCenter,
        zoom: initialZoom,
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

  // Calculate popover position to keep it within viewport bounds
  useEffect(() => {
    if (!multi || !containerRef.current) {
      setMultiPosition(null);
      return;
    }

    const padding = 12;
    const offset = 12;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    // Estimate popover dimensions (will be refined after render)
    const estimatedWidth = isMobile ? Math.min(320, containerRef.current.offsetWidth - padding * 2) : 320;
    const itemHeight = 60; // approximate height per item
    const estimatedHeight = Math.min(multi.items.length * itemHeight, isMobile ? 400 : 500);
    
    // Get container dimensions (multi.x and multi.y are already relative to container)
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    
    // On mobile: prefer centering horizontally, on desktop: prefer near tap point
    let left: number;
    let top: number;
    
    if (isMobile) {
      // Mobile: center horizontally, position vertically near tap point
      left = Math.max(padding, (containerWidth - estimatedWidth) / 2);
      top = multi.y + offset;
      
      // If tap is in upper half, show below; if lower half, show above
      if (multi.y < containerHeight / 2) {
        top = multi.y + offset;
      } else {
        top = multi.y - estimatedHeight - offset;
      }
    } else {
      // Desktop: prefer bottom-right of click point
      left = multi.x + offset;
      top = multi.y + offset;
    }
    
    // Edge checking and adjustment
    if (!isMobile) {
      // Desktop: check right edge - flip to left side if needed
      if (left + estimatedWidth > containerWidth - padding) {
        // Try left side of click point
        const leftSide = multi.x - estimatedWidth - offset;
        if (leftSide >= padding) {
          left = leftSide;
        } else {
          // Can't fit on left either, align to right edge
          left = Math.max(padding, containerWidth - estimatedWidth - padding);
        }
      }
    }
    
    // Check bottom edge - move up if needed (both mobile and desktop)
    if (top + estimatedHeight > containerHeight - padding) {
      // Try above the click point
      const above = multi.y - estimatedHeight - offset;
      if (above >= padding) {
        top = above;
      } else {
        // Can't fit above, align to bottom edge
        top = Math.max(padding, containerHeight - estimatedHeight - padding);
      }
    }
    
    // Check top edge - move down if needed
    if (top < padding) {
      top = padding;
    }
    
    // Final bounds check - ensure within container
    left = Math.max(padding, Math.min(left, containerWidth - estimatedWidth - padding));
    top = Math.max(padding, Math.min(top, containerHeight - estimatedHeight - padding));
    
    setMultiPosition({ left, top });
    
    // Refine position after popover renders (measure actual size)
    const refinePosition = () => {
      if (!multiPopoverRef.current || !containerRef.current) return;
      
      const popoverRect = multiPopoverRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Convert popover position to container-relative coordinates
      const popoverLeft = popoverRect.left - containerRect.left;
      const popoverTop = popoverRect.top - containerRect.top;
      const popoverWidth = popoverRect.width;
      const popoverHeight = popoverRect.height;
      
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      let refinedLeft = popoverLeft;
      let refinedTop = popoverTop;
      
      // Only adjust if actually going off-screen
      const isMobileRefine = typeof window !== 'undefined' && window.innerWidth < 768;
      
      if (!isMobileRefine) {
        // Desktop: check right edge
        if (popoverLeft + popoverWidth > containerWidth - padding) {
          // Try left side of tap point
          const leftSide = multi.x - popoverWidth - offset;
          if (leftSide >= padding) {
            refinedLeft = leftSide;
          } else {
            refinedLeft = containerWidth - popoverWidth - padding;
          }
        }
      } else {
        // Mobile: keep centered horizontally
        refinedLeft = Math.max(padding, (containerWidth - popoverWidth) / 2);
      }
      
      if (popoverTop + popoverHeight > containerHeight - padding) {
        // Try above tap point
        const above = multi.y - popoverHeight - offset;
        if (above >= padding) {
          refinedTop = above;
        } else {
          refinedTop = containerHeight - popoverHeight - padding;
        }
      }
      
      if (popoverTop < padding) {
        refinedTop = padding;
      }
      
      // Final bounds check
      refinedLeft = Math.max(padding, Math.min(refinedLeft, containerWidth - popoverWidth - padding));
      refinedTop = Math.max(padding, Math.min(refinedTop, containerHeight - popoverHeight - padding));
      
      // Only update if position changed significantly (more than 5px to avoid micro-adjustments)
      if (Math.abs(refinedLeft - popoverLeft) > 5 || Math.abs(refinedTop - popoverTop) > 5) {
        setMultiPosition({ left: refinedLeft, top: refinedTop });
      }
    };
    
    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(() => {
      requestAnimationFrame(refinePosition);
    });
  }, [multi]);

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
      {multi && multiPosition && (
        <div
          ref={multiPopoverRef}
          className="absolute z-20 max-w-[80vw] sm:max-w-xs"
          style={{ 
            left: `${multiPosition.left}px`, 
            top: `${multiPosition.top}px`,
            transition: 'none' // Prevent animation when position updates
          }}
        >
          <div className="rounded-2xl bg-vulcan-900/90 outline outline-1 outline-white/10 shadow-xl overflow-hidden">
            <ul className="divide-y divide-white/10 max-h-[60vh] overflow-y-auto">
              {multi.items.map((it) => (
                <li key={it.id}>
                  <button
                    onClick={() => { onSelectRef.current(it.id); setMulti(null); }}
                    className="w-full text-left px-4 py-3 block hover:bg-white/5 active:bg-white/10"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-2 inline-block h-2 w-2 rounded-full shrink-0 ${it.attestationCount > 0 ? 'bg-orange' : 'bg-vulcan-500'}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
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
