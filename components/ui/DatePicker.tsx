"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value?: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
};

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromYmd(s?: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map((n) => Number(n));
  if (!y || !m || !d) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

export default function DatePicker({ value, onChange, placeholder = "mm/dd/yyyy", className }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const selected = useMemo(() => fromYmd(value), [value]);
  const [view, setView] = useState<Date>(() => selected || new Date());

  useEffect(() => {
    if (selected) setView(selected);
  }, [selected]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onResizeScroll() {
      if (!open) return;
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const margin = 8;
      const below = vh - rect.bottom - margin;
      const above = rect.top - margin;
      const openUp = below < 260 && above > below;
      const maxHpx = Math.min(openUp ? above : below, Math.round(vh * 0.7));
      setPanelStyle(openUp ? { bottom: `calc(100% + ${margin}px)`, maxHeight: `${maxHpx}px` } : { top: `calc(100% + ${margin}px)`, maxHeight: `${maxHpx}px` });
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      window.addEventListener("resize", onResizeScroll);
      window.addEventListener("scroll", onResizeScroll, true);
      onResizeScroll();
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("resize", onResizeScroll);
      window.removeEventListener("scroll", onResizeScroll, true);
    };
  }, [open]);

  const monthStart = useMemo(() => new Date(view.getFullYear(), view.getMonth(), 1), [view]);
  const daysInMonth = useMemo(() => new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate(), [view]);
  const startWeekday = monthStart.getDay(); // 0=Sun
  const weeks: Array<Array<Date | null>> = [];
  {
    let w: Array<Date | null> = Array(startWeekday).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      w.push(new Date(view.getFullYear(), view.getMonth(), day));
      if (w.length === 7) { weeks.push(w); w = []; }
    }
    if (w.length) { while (w.length < 7) w.push(null); weeks.push(w); }
  }

  function select(d: Date) {
    onChange(ymd(d));
    setOpen(false);
  }

  const label = selected ? selected.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : placeholder;

  return (
    <div className={`relative ${className || ''}`}>
      <button ref={triggerRef} type="button" className="rr-input pr-12 text-left w-full" onClick={() => setOpen((s) => !s)}>
        {selected ? label : <span className="text-white/60">{placeholder}</span>}
      </button>
      <button type="button" className="rr-input-icon" aria-label="Open calendar" onClick={() => setOpen(true)}>
        <i className="f7-icons">calendar</i>
      </button>
      {open && (
        <div ref={panelRef} className="absolute z-50 w-[320px] rounded-2xl bg-vulcan-900 text-white outline outline-1 outline-vulcan-600 shadow-xl p-3" style={panelStyle}>
          <div className="flex items-center justify-between mb-2">
            <button type="button" className="px-2 py-1 rounded-lg hover:bg-white/10" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}><i className="f7-icons">chevron_left</i></button>
            <div className="font-bold">
              {view.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
            </div>
            <button type="button" className="px-2 py-1 rounded-lg hover:bg-white/10" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}><i className="f7-icons">chevron_right</i></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-white/70 text-sm mb-1">
            {['S','M','T','W','T','F','S'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((d, idx) => {
              const isSel = d && selected && ymd(d) === ymd(selected);
              return (
                <button key={idx} type="button" disabled={!d} onClick={() => d && select(d)}
                  className={`h-9 rounded-full flex items-center justify-center ${!d ? 'opacity-0' : isSel ? 'bg-orange text-white font-bold' : 'hover:bg-white/10'}`}
                >
                  {d?.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
