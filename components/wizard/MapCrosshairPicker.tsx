"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import Button from "@/components/ui/Button";

type Props = {
  initial?: [number, number]; // [lon, lat]
  onPick?: (coords: [number, number]) => void;
  interactive?: boolean; // default true; when false, disable map interactions
  zoom?: number; // optional initial zoom override
  showPick?: boolean; // default true; when false, hide "Use this location" button
};

export function MapCrosshairPicker({ initial, onPick, interactive = true, zoom, showPick = true }: Props) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Capture starting values once so subsequent prop changes don't re-center or re-zoom the map.
  const [startCenter] = useState<[number, number]>(initial ?? [100, 10]);
  const [startZoom] = useState<number>(zoom ?? (initial ? 9 : 3));
  const [center, setCenter] = useState<[number, number]>(startCenter);
  const [picked, setPicked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let map: maplibregl.Map | null = null;
    const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL || "/map/styles/dark_matter.json";
    const init = async () => {
      try {
        // Prefetch style JSON to fail fast if path is wrong
        const styleResp = await fetch(styleUrl, { cache: "no-store" });
        if (!styleResp.ok) throw new Error(`Style ${styleUrl} ${styleResp.status}`);
        const style = await styleResp.json();
        // Inject MapTiler/OpenMapTiles key if the style contains the public placeholder
        const key = process.env.NEXT_PUBLIC_OPENMAPTILES_KEY;
        if (key) {
          try {
            const src = (style?.sources?.openmaptiles?.url || '') as string;
            if (src.includes('get_your_own_')) {
              style.sources.openmaptiles.url = src.replace(/key=[^&]+/, `key=${key}`);
            }
            if (typeof style.glyphs === 'string' && style.glyphs.includes('get_your_own_')) {
              style.glyphs = (style.glyphs as string).replace(/key=[^&]+/, `key=${key}`);
            }
          } catch {}
        } else {
          console.warn('Missing NEXT_PUBLIC_OPENMAPTILES_KEY; map tiles may fail to load.');
        }
        map = new maplibregl.Map({
          container: containerRef.current!,
          style,
          center: startCenter,
          zoom: startZoom,
          minZoom: 2,
          pitch: 0,
          bearing: 0,
          dragRotate: false,
          attributionControl: false,
          pixelRatio: Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
          renderWorldCopies: false,
        });
      } catch (e) {
        // Fallback to demo style
        try {
          map = new maplibregl.Map({
            container: containerRef.current!,
            style: "https://demotiles.maplibre.org/style.json",
            center: startCenter,
            zoom: startZoom,
            minZoom: 2,
            pitch: 0,
            bearing: 0,
            dragRotate: false,
            attributionControl: false,
            pixelRatio: Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
            renderWorldCopies: false,
          });
        } catch (err) {
          setFailed(true);
          setLoading(false);
          return;
        }
      }
      mapRef.current = map!;

      map!.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      // Disable default scroll-zoom and implement a center-based zoom to avoid cursor focal point
      const wheelHandler = (e: WheelEvent) => {
        if (!interactive) return;
        e.preventDefault();
        const z = map!.getZoom();
        const delta = (e.deltaY < 0 ? 0.25 : -0.25);
        const next = Math.max(2, Math.min(20, z + delta));
        // Zoom around the cursor position so users can navigate by pointing
        const rect = containerRef.current!.getBoundingClientRect();
        const px: [number, number] = [e.clientX - rect.left, e.clientY - rect.top];
        const around = map!.unproject(px as any);
        map!.easeTo({ zoom: next, around, duration: 200 });
      };
      map!.scrollZoom.disable();
      containerRef.current!.addEventListener('wheel', wheelHandler, { passive: false });
      if (!interactive) {
        map!.dragPan.disable();
        map!.boxZoom.disable();
        map!.keyboard.disable();
        map!.doubleClickZoom.disable();
        map!.touchZoomRotate.disable();
      }

      const update = () => {
        const c = map!.getCenter();
        setCenter([+c.lng.toFixed(6), +c.lat.toFixed(6)]);
        // Any move should invalidate previous explicit pick
        setPicked(false);
      };
      map!.on("load", () => { setLoading(false); update(); });
      map!.on("move", update);
      map!.on("error", () => { setFailed(true); setLoading(false); });
    };
    init();
    return () => {
      try { containerRef.current?.removeEventListener('wheel', wheelHandler as any); } catch {}
      if (map) map.remove();
    };
  }, []);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-64 w-full rounded-2xl overflow-hidden bg-vulcan-800" />
      {/* Crosshair overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-orange">
        <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
          <circle cx="24" cy="24" r="3" fill="currentColor" />
          <path d="M24 4v10M24 34v10M4 24h10M34 24h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      {(loading || failed) && (
        <div className="absolute inset-0 grid place-items-center text-white/60 text-sm bg-gradient-to-b from-transparent to-black/20">
          {failed ? "Map failed to load. You can still pick your current center." : "Loading map…"}
        </div>
      )}
      <div className="mt-3 text-sm text-white/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <code>{center[0]}, {center[1]}</code> <span className="ml-2">[lon, lat]</span>
        </div>
        {showPick && onPick && (
          <Button
            variant="outline"
            size="md"
            className="inline-flex items-center gap-3"
            onClick={() => {
              const c = mapRef.current?.getCenter();
              const coords: [number, number] = c ? [Number(c.lng.toFixed(6)), Number(c.lat.toFixed(6))] : center;
              onPick(coords);
              setPicked(true);
            }}
          >
            <span className="font-black">{picked ? 'Location is set' : 'Set this location'}</span>
            <span className={`h-6 w-6 grid place-items-center rounded-full `}>
              <i className={`f7-icons text-base ${picked ? ' text-green-400' : ' text-white/40'}`}>checkmark_alt_circle_fill</i>
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
