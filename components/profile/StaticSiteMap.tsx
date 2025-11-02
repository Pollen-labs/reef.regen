"use client";
import { useEffect, useRef } from "react";

type Site = { id: string; name: string; type?: string; coords: [number, number] };

export default function StaticSiteMap({ sites, height = 320, className }: { sites: Site[]; height?: number; className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let destroyed = false;
    (async () => {
      const [{ default: maplibregl }] = await Promise.all([import("maplibre-gl")]);
      if (destroyed) return;

      // Inject MapLibre CSS once
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
        interactive: false,
        attributionControl: false,
        transformRequest: (u: any) => {
          const url = typeof u === "string" ? u : (u?.url as string | undefined) || "";
          if (!url) return typeof u === "string" ? { url: u } : (u as any);
          const token = process.env.NEXT_PUBLIC_MAPTILER_KEY;
          if (!token) return { url };
          const needsKey = url.includes("api.maptiler.com") || url.includes("tilehosting.com");
          if (!needsKey) return { url };
          if (url.includes("key=")) return { url: url.replace(/key=[^&]*/i, `key=${token}`) };
          const sep = url.includes("?") ? "&" : "?";
          return { url: `${url}${sep}key=${token}` };
        },
      });
      mapRef.current = map;

      map.on("load", () => {
        if (!map.getSource("sites")) {
          map.addSource("sites", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
        }
        if (!map.getLayer("site-points")) {
          map.addLayer({
            id: "site-points",
            type: "circle",
            source: "sites",
            paint: {
              "circle-radius": 5,
              "circle-color": "#FF7F5C", // brand orange
              "circle-stroke-width": 1,
              "circle-stroke-color": "#3C3D50", // vulcan-800
            },
          });
        }

        // Initial data + fit bounds
        const fc = toFeatureCollection(sites);
        (map.getSource("sites") as any)?.setData(fc);
        fitToSites(map, fc);
      });
    })();
    return () => {
      destroyed = true;
      try { mapRef.current?.remove(); } catch {}
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("sites")) return;
    const fc = toFeatureCollection(sites);
    try { (map.getSource("sites") as any).setData(fc); } catch {}
    fitToSites(map, fc);
  }, [sites]);

  const cls = className || "w-full rounded-3xl overflow-hidden";
  return <div ref={containerRef} className={cls} style={{ height, minHeight: height }} />;
}

function toFeatureCollection(sites: Site[]) {
  return {
    type: "FeatureCollection",
    features: (sites || []).map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: s.coords },
      properties: { id: s.id, name: s.name },
    })),
  } as const;
}

function fitToSites(map: any, fc: any) {
  const n = fc.features.length;
  if (!n) return;
  if (n === 1) {
    const [lng, lat] = fc.features[0].geometry.coordinates as [number, number];
    try {
      map.jumpTo({ center: [lng, lat], zoom: 6 });
    } catch {}
    return;
  }
  let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
  for (const f of fc.features) {
    const [lng, lat] = f.geometry.coordinates as [number, number];
    if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
  }
  const sw = [minLng, minLat] as [number, number];
  const ne = [maxLng, maxLat] as [number, number];
  try { map.fitBounds([sw, ne], { padding: 32, maxZoom: 6, duration: 0 }); } catch {}
}
