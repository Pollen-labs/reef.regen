"use client";
import { useEffect, useRef, useState } from "react";
import type { Attestation, Location } from "@/types/map";
import dynamic from "next/dynamic";
import { classesForRegen } from "@/lib/style/regenColors";
// Site type styled as text (no chip)
import Tag from "@/components/ui/Tag";
import { formatDateShort } from "@/lib/format/date";

/**
 * LocationPane — Left drawer showing location details
 *
 * Appears when user clicks a map pin. Shows:
 * - Location name and coordinates
 * - Regen actions breakdown with donut chart placeholders
 * - Species diversity (or "No species recorded" placeholder)
 * - List of attestations
 *
 * Props:
 * - location: Location data or null
 * - onClose: Callback to close the pane
 * - onOpenAttestation: Callback when attestation is clicked
 */
export default function LocationPane({
  location,
  onClose: _onClose, // Reserved for future close button
  onOpenAttestation,
  onLoadMore,
}: {
  location: Location | null;
  onClose: () => void;
  onOpenAttestation: (att: Attestation) => void;
  onLoadMore?: () => void;
}) {
  if (!location) return null;

  const totalActions = location.actionsBreakdown.reduce((s, a) => s + a.count, 0);
  const chartData = location.actionsBreakdown.map((a) => {
    const c = classesForRegen(a.label);
    return { ...a, color: c.hex };
  });
  const hasSpecies = location.species && location.species.length > 0;
  const depthStr = location.depthM != null ? `${location.depthM}m` : "-";
  const areaStr = location.surfaceAreaM2 != null ? `${location.surfaceAreaM2}m²` : "-";

  // Bottom-sheet height (mobile only)
  const [isMdUp, setIsMdUp] = useState(false);
  const [sheetH, setSheetH] = useState<number | null>(null);
  const startY = useRef(0);
  const startH = useRef(0);
  const dragging = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const set = () => setIsMdUp(mq.matches);
    set();
    mq.addEventListener?.('change', set);
    return () => mq.removeEventListener?.('change', set);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const init = () => setSheetH(Math.round(window.innerHeight * 0.6));
    init();
    const onResize = () => {
      // Keep the same ratio on rotate/resize
      const current = sheetH ?? Math.round(window.innerHeight * 0.6);
      const pct = Math.max(0.3, Math.min(0.92, current / (window.innerHeight || 1)));
      setSheetH(Math.round(window.innerHeight * pct));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup: ensure drag listeners are removed on unmount
  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
        dragCleanupRef.current = null;
      }
    };
  }, []);

  const onDragStart = (e: React.PointerEvent) => {
    if (isMdUp) return; // desktop not draggable
    e.preventDefault();
    e.stopPropagation();
    
    // Clean up any existing drag listeners
    if (dragCleanupRef.current) {
      dragCleanupRef.current();
    }
    
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = sheetH || Math.round(window.innerHeight * 0.6);
    
    // Prevent text selection and scrolling while dragging
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
    
    // Add global listeners for better tracking
    const handleMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      const dy = e.clientY - startY.current;
      const raw = startH.current - dy; // drag up increases height
      const minH = Math.round((window.innerHeight || 1) * 0.2);
      const maxH = Math.round((window.innerHeight || 1) * 0.8);
      const next = Math.max(minH, Math.min(maxH, raw));
      setSheetH(next);
    };
    
    const handleEnd = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
      dragCleanupRef.current = null;
    };
    
    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
    
    // Store cleanup function
    dragCleanupRef.current = handleEnd;
  };
  
  const onDragMove = (e: React.PointerEvent) => {
    // This is now handled by global listeners, but keep for compatibility
    if (!dragging.current || isMdUp) return;
    e.preventDefault();
  };
  
  const onDragEnd = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.style.userSelect = '';
    document.body.style.touchAction = '';
  };

  const mobileStyle = !isMdUp && sheetH ? { height: `${sheetH}px` } : undefined;

  return (
    <aside
      className="absolute z-30 text-white transition-transform duration-300 ease-out overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-vulcan-600 scrollbar-track-vulcan-800/50 hover:scrollbar-thumb-vulcan-500
                 left-0 right-0 bottom-0 top-auto h-[60svh] w-full px-4 pt-0 pb-3.5 bg-black/70 backdrop-blur-[8px] rounded-t-3xl
                 md:left-0 md:top-0 md:bottom-auto md:right-auto md:h-full md:w-[420px] md:px-4 md:py-3.5 md:rounded-none"
      style={mobileStyle}
      role="complementary"
      aria-label={`Location details for ${location.name}`}
    >
      {/* Mobile drag handle (sticky) */}
      <div
        className="md:hidden sticky top-0 z-10 -mx-4 px-4 py-4 bg-black/70 backdrop-blur-[8px] rounded-t-3xl cursor-row-resize touch-none select-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div className="mx-auto h-1.5 w-16 rounded-full bg-white/40" aria-hidden />
      </div>
      <div className="flex flex-col gap-2 mt-1 md:mt-0">
        {/* Header Card */}
        <section className="p-6 bg-vulcan-900 rounded-3xl flex flex-col gap-2">
        <div className="text-lg font-light text-vulcan-400">Site name</div>
          <h2 className="text-h4 font-black text-white">
            {location.name}
          </h2>
          {location.orgName && (
            <div>
              <div className="text-lg font-light text-vulcan-400">Organization</div>
              <div className="text-2xl font-bold">{location.orgName}</div>
            </div>
          )}
        </section>

        {/* Regen actions Card */}
        <section className="p-6 bg-vulcan-900 rounded-3xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="w-36 min-w-0">
              <div className="text-h4 font-black">
                {totalActions}
              </div>
              <div className="text-lg text-vulcan-400 font-bold">
                Regen actions
              </div>
            </div>
            {/* Donut chart (lazy) */}
            <div className="shrink-0 w-24 justify-right">
              <LazyDonut data={chartData} />
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            {location.actionsBreakdown.map((a) => {
              const c = classesForRegen(a.label);
              return (
                <div key={a.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-5 w-2 rounded ${c.bg}`} />
                    <span className="text-base font-light truncate">{a.label}</span>
                  </div>
                  <span className="text-base font-bold">{a.count}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Species diversity Card */}
        <section className="p-6 bg-vulcan-900 rounded-3xl flex flex-col gap-4">
          <div>
            <div className="text-h4 font-black">
              {hasSpecies ? location.species.length : 0}
            </div>
            <div className="text-lg text-vulcan-400 font-bold">
              Species diversity
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {hasSpecies ? (
              location.species.map((s) => (
                <Tag key={s} label={s} size="md" bgClass="bg-ribbon-300" textClass="text-vulcan-950" />
              ))
            ) : (
              <span className="h-8 px-3 py-1 rounded-lg bg-gray-200 inline-flex items-center">
                <span className="text-lg font-bold text-vulcan-900">
                  No species recorded
                </span>
              </span>
            )}
          </div>
        </section>

        {/* Site details Card */}
        <section className="p-6 bg-vulcan-900 rounded-3xl flex flex-col gap-2">
          <h3 className="text-h5 font-black text-white">
            {location.siteType || '-'}
          </h3>
          <div className="text-lg text-vulcan-400 font-bold">Site type</div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-2xl font-black">{depthStr}</div>
              <div className="text-lg text-vulcan-400 font-bold">Depth</div>
            </div>
            <div>
              <div className="text-2xl font-black">{areaStr}</div>
              <div className="text-lg text-vulcan-400 font-bold">Surface area</div>
            </div>
          </div>
        </section>

        {/* Attestations block (header + rows merged) */}
        <section className="bg-vulcan-900 rounded-3xl overflow-hidden">
          <div className="p-6">
            <div className="text-h4 font-black">{location.attestationCount}</div>
            <div className="text-lg text-vulcan-400 font-bold">Attestations</div>
          </div>
          <ul>
            {[...location.attestations]
              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .map((a) => (
                <li key={a.id} className="border-t border-vulcan-700/60">
                  <button
                    onClick={() => onOpenAttestation(a as Attestation)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-vulcan-700/80"
                  >
                    <span className="text-lg font-light text-vulcan-300">
                      {formatDateShort(a.submittedAt)}
                    </span>
                    <span className="h-5 w-5 grid place-items-center text-flamingo-200">
                      <i className="f7-icons text-2xl">ellipsis</i>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
          {onLoadMore && location.attestations.length < (location.attestationCount || 0) && (
            <div className="border-t border-vulcan-700/60 p-4 grid place-items-center">
              <button
                onClick={onLoadMore}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-base font-bold"
              >
                Load more
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Decorative vertical bar at far right of pane */}
      <div
        className="absolute right-0 top-1 w-2 h-64 bg-vulcan-900 rounded-lg"
        aria-hidden
      />

      {/* Close hint for keyboard users */}
      <span className="sr-only">
        Press Escape or click outside the pane to close
      </span>
    </aside>
  );
}

// Lazy Chart wrapper with idle rendering and skeleton fallback
const DonutChart = dynamic(() => import("@/components/shared/charts/DonutChartJS"), { ssr: false });

function LazyDonut({ data }: { data: { label: string; count: number; color: string }[] }) {
  const [ready, setReady] = require("react").useState(false);
  require("react").useEffect(() => {
    const idle = (cb: () => void) => (
      (window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb, { timeout: 500 }) : setTimeout(cb, 200)
    );
    const id = idle(() => setReady(true));
    return () => {
      if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  return (
    <div className="relative w-full aspect-square">
      {ready ? (
        <DonutChart data={data as any} tooltipMode="count" className="absolute inset-0" />
      ) : (
        <div className="absolute inset-0 m-auto rounded-full bg-vulcan-700/60 animate-pulse" aria-hidden />
      )}
    </div>
  );
}
