"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type DropdownOption = { label: string; value: string | number };

type Props = {
  options: DropdownOption[];
  value?: string | number;
  onChange: (value: string | number, option: DropdownOption) => void;
  placeholder?: string;
  className?: string;
};

export default function Dropdown({ options, value, onChange, placeholder = "Select…", className }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const selected = useMemo(() => options.find((o) => o.value === value) || null, [options, value]);

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
      const openUp = below < 220 && above > below; // prefer above if below space < ~220px
      const maxHpx = Math.min(openUp ? above : below, Math.round(vh * 0.7));
      setPanelStyle(
        openUp
          ? { bottom: `calc(100% + ${margin}px)`, maxHeight: `${Math.max(180, maxHpx)}px` }
          : { top: `calc(100% + ${margin}px)`, maxHeight: `${Math.max(180, maxHpx)}px` }
      );
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

  function handleSelect(opt: DropdownOption) {
    onChange(opt.value, opt);
    setOpen(false);
  }

  return (
    <div className={`rr-dropdown ${className || ""}`}>
      <button ref={triggerRef} type="button" className="rr-dropdown-trigger text-left" onClick={() => setOpen((s) => !s)}>
        {selected ? selected.label : <span className="text-white/60">{placeholder}</span>}
      </button>
      <i className="f7-icons rr-dropdown-chevron">chevron_down</i>
      {open && (
        <div ref={panelRef} className="rr-dropdown-panel scrollbar-thin overscroll-contain" style={panelStyle}>
          {options.map((o) => {
            const isSel = o.value === value;
            return (
              <button
                type="button"
                key={String(o.value)}
                className={`rr-dropdown-item ${isSel ? "rr-dropdown-item-selected" : ""}`}
                onClick={() => handleSelect(o)}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
