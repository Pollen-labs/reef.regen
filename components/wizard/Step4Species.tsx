"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Input from "@/components/ui/Input";
import { useAttestationWizard, SpeciesEntry } from "@/lib/wizard/attestationWizardStore";

type SearchItem = { id: string; name: string; label?: string | null };

export function Step4Species() {
  const { species = [], setPatch } = useAttestationWizard();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [highlight, setHighlight] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced search (require >=5 characters)
  useEffect(() => {
    if (q.trim().length < 5) {
      setItems([]);
      setOpen(false);
      setHighlight(-1);
      return;
    }
    setLoading(true);
    setOpen(true);
    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;
    const h = setTimeout(async () => {
      try {
        const res = await fetch(`/api/taxa/search?q=${encodeURIComponent(q)}&limit=20`, { signal: ctrl.signal });
        const json = await res.json().catch(() => ({}));
        const arr = Array.isArray(json.items) ? json.items : [];
        const mapped: SearchItem[] = arr.map((r: any) => ({ id: String(r.id ?? r.taxa_id ?? r.taxaId), name: String(r.name ?? r.scientific_name), label: r.label ?? null }));
        setItems(mapped);
        setHighlight(mapped.length ? 0 : -1);
      } catch (e) {
        if ((e as any).name !== 'AbortError') {
          setItems([]);
          setHighlight(-1);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(h);
      ctrl.abort();
    };
  }, [q]);

  const selectedItem = useMemo(() => (highlight >= 0 ? items[highlight] : undefined), [items, highlight]);

  const onAdd = useCallback(() => {
    if (!selectedItem) return;
    // limit guard
    if (species.length >= 200) return;
    const id = selectedItem.id;
    const existingIdx = species.findIndex((s) => s.taxonId === id);
    if (existingIdx >= 0) {
      // dedupe: flash and scroll
      const row = document.getElementById(`species-row-${id}`);
      if (row) {
        row.scrollIntoView({ block: 'center' });
        row.classList.add('ring-2', 'ring-orange');
        setTimeout(() => row.classList.remove('ring-2', 'ring-orange'), 600);
      }
      return;
    }
    const entry: SpeciesEntry = { taxonId: id, scientificName: selectedItem.name, count: null };
    setPatch({ species: [...species, entry] });
    // clear search; close list
    setQ("");
    setItems([]);
    setOpen(false);
    setHighlight(-1);
    // focus the new count input shortly after render
    setTimeout(() => {
      const el = document.getElementById(`species-count-${id}`) as HTMLInputElement | null;
      el?.focus();
    }, 50);
  }, [selectedItem, setPatch, species]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      if (q.trim().length >= 5) setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (items.length ? (h + 1) % items.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (items.length ? (h - 1 + items.length) % items.length : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedItem) onAdd();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const onChangeCount = (id: string, value: string) => {
    // keep only digits
    const cleaned = value.replace(/[^0-9]/g, "");
    const num = cleaned === "" ? null : Math.min(1_000_000, Number(cleaned));
    const next = species.map((s) => (s.taxonId === id ? { ...s, count: num } : s));
    setPatch({ species: next });
  };

  const onRemove = (id: string) => {
    setPatch({ species: species.filter((s) => s.taxonId !== id) });
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="w-full max-w-[960px] flex flex-col items-center gap-3 mx-auto">
        <div className="text-center text-white text-5xl md:text-7xl font-black leading-[1.04]">Now, the science part</div>
        <div className="text-center text-vulcan-100 text-2xl font-light leading-9">Providing biodiversity information to the public is essential for education</div>
      </div>

      <section className="grid gap-3 items-center text-center w-full max-w-[600px] mx-auto">
        <h3 className="text-vulcan-700 text-2xl font-black">Species name</h3>
        <div className="flex gap-3 items-center w-full pb-4">
          <div className="rr-dropdown flex-1">
            <Input
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="species-listbox"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search species (min 5 letters)"
              className=""
            />
            {q.trim().length > 0 && q.trim().length < 5 && (
              <div className="mt-1 text-left text-white/60 text-xs">Type at least 5 characters to search.</div>
            )}
            {open && (
              <ul
                id="species-listbox"
                role="listbox"
                ref={listRef}
                className="rr-dropdown-panel scrollbar-thin overscroll-contain"
              >
                {loading && !items.length && (
                  <li className="rr-dropdown-item">Searching…</li>
                )}
                {!loading && items.length === 0 && (
                  <li className="rr-dropdown-item">No matches. Try a different name.</li>
                )}
                {items.map((it, idx) => (
                  <li
                    key={it.id}
                    role="option"
                    aria-selected={highlight === idx}
                    className={`rr-dropdown-item ${highlight === idx ? 'rr-dropdown-item-selected' : ''}`}
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => { e.preventDefault(); }}
                    onClick={() => { setHighlight(idx); setQ(it.name); setOpen(false); }}
                  >
                    {it.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={!selectedItem || species.length >= 200}
            className="px-6 py-3 rounded-2xl outline outline-4 outline-offset-[-4px] outline-vulcan-500 text-white disabled:opacity-50"
          >
            Add to the list
          </button>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_200px_48px] gap-1 items-center mt-1">
        <div className="rr-input bg-vulcan-700/70 text-white/80 font-semibold text-left min-h-[48px] flex items-center">Species name</div>
          <div className="rr-input bg-vulcan-700/70 text-white/80 font-semibold text-left min-h-[48px] flex items-center">Counts <span className="text-sm text-white/50 pl-1"> (Optional)</span></div>
          <div className="rr-input bg-vulcan-700/70 min-h-[48px]" aria-hidden="true" />
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-1 pb-12">
          {species.length === 0 && (
            <div className="text-white/60 text-sm mt-2">Add a species using the search above</div>
          )}
          {species.map((s) => (
            <div key={s.taxonId} id={`species-row-${s.taxonId}`} className="grid grid-cols-[1fr_200px_48px] gap-1 items-center">
              <div className="rr-input bg-ribbon-300 text-vulcan-950 font-semibold truncate text-left" title={s.scientificName}>{s.scientificName}</div>
              <Input
                id={`species-count-${s.taxonId}`}
                inputMode="numeric"
                pattern="[0-9]*"
                value={s.count ?? ""}
                onChange={(e) => onChangeCount(s.taxonId, e.target.value)}
                placeholder=""
              />
              <button
                type="button"
                aria-label={`Remove ${s.scientificName}`}
                className="rr-input flex items-center justify-center"
                onClick={() => onRemove(s.taxonId)}
              >
                <i className="f7-icons">trash</i>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
