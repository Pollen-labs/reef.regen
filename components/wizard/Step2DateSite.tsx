"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useAttestationWizard } from "@/lib/wizard/attestationWizardStore";
import { useRef } from "react";
import { SiteModal } from "@/components/wizard/SiteModal";

type SiteItem = {
  id: string;
  name: string;
  siteType?: string;
  depthM: number | null;
  areaM2: number | null;
  lon?: number | string;
  lat?: number | string;
};

function DateModeToggle() {
  const { dateMode = 'single', setPatch } = useAttestationWizard();
  const setMode = (m: 'single' | 'range') => {
    setPatch(m === 'single'
      ? { dateMode: 'single', actionStart: undefined, actionEnd: undefined }
      : { dateMode: 'range', actionDate: undefined }
    );
  };
  return (
    <div className="inline-flex rounded-2xl overflow-hidden outline outline-1 outline-vulcan-700">
      <button onClick={() => setMode('single')} className={`px-5 py-2 flex items-center gap-2 ${dateMode==='single' ? 'bg-orange text-white font-bold' : 'bg-vulcan-700/70 text-white'}`}>
        <i className="f7-icons text-lg">{dateMode==='single' ? 'checkmark_alt_circle_fill' : 'circle'}</i>
        On a specific date
      </button>
      <button onClick={() => setMode('range')} className={`px-5 py-2 flex items-center gap-2 ${dateMode==='range' ? 'bg-orange text-white font-bold' : 'bg-vulcan-700/70 text-white'}`}>
        <i className="f7-icons text-lg">{dateMode==='range' ? 'checkmark_alt_circle_fill' : 'circle'}</i>
        On a duration
      </button>
    </div>
  );
}

function SingleDate() {
  const { actionDate, setPatch } = useAttestationWizard();
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div className="relative w-full max-w-[640px]">
      <input ref={ref} type="date" className="rr-input pr-12" value={actionDate || ''} onChange={(e) => setPatch({ actionDate: e.target.value })} placeholder="mm/dd/yyyy" />
      <button type="button" className="rr-input-icon" aria-label="Open date picker" onClick={() => (ref.current as any)?.showPicker?.() || ref.current?.focus()}>
        <i className="f7-icons">calendar</i>
      </button>
    </div>
  );
}

function RangeDate() {
  const { actionStart, actionEnd, setPatch } = useAttestationWizard();
  const minEnd = actionStart || undefined;
  const startRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="flex gap-3 items-center">
      <div className="relative w-full max-w-[320px]">
        <input ref={startRef} type="date" className="rr-input pr-12" value={actionStart || ''} onChange={(e) => setPatch({ actionStart: e.target.value })} placeholder="Start" />
        <button type="button" className="rr-input-icon" aria-label="Open start date picker" onClick={() => (startRef.current as any)?.showPicker?.() || startRef.current?.focus()}>
          <i className="f7-icons">calendar</i>
        </button>
      </div>
      <span className="text-white/60">~</span>
      <div className="relative w-full max-w-[320px]">
        <input ref={endRef} type="date" className="rr-input pr-12" value={actionEnd || ''} min={minEnd} onChange={(e) => setPatch({ actionEnd: e.target.value })} placeholder="End" />
        <button type="button" className="rr-input-icon" aria-label="Open end date picker" onClick={() => (endRef.current as any)?.showPicker?.() || endRef.current?.focus()}>
          <i className="f7-icons">calendar</i>
        </button>
      </div>
    </div>
  );
}

export function Step2DateSite() {
  const { address } = useAccount();
  const { dateMode = 'single', actionDate, actionStart, actionEnd, siteId, setPatch } = useAttestationWizard();
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [editSite, setEditSite] = useState<SiteItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!address) return;
      setLoading(true);
      try {
        const r = await fetch(`/api/sites/by-wallet?address=${address}`);
        const j = await r.json().catch(() => ({}));
        if (!cancelled) setSites(Array.isArray(j.items) ? j.items : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  const validDate = useMemo(() => {
    if (dateMode === 'single') return !!actionDate;
    if (!actionStart || !actionEnd) return false;
    return actionStart <= actionEnd;
  }, [dateMode, actionDate, actionStart, actionEnd]);

  const onSelectSite = (s: SiteItem) => {
    setPatch({
      siteId: s.id,
      siteName: s.name,
      siteType: s.siteType,
      siteDepthM: s.depthM ?? undefined,
      siteAreaM2: s.areaM2 ?? undefined,
      siteCoords: s.lon != null && s.lat != null ? [Number(s.lon), Number(s.lat)] : undefined,
    });
  };

  const onCreated = (s: any) => {
    const item: SiteItem = {
      id: s.id,
      name: s.name,
      siteType: String(s.type),
      depthM: s.depthM,
      areaM2: s.areaM2,
      lon: s.coords?.[0],
      lat: s.coords?.[1],
    };
    setSites((prev) => [item, ...prev]);
    onSelectSite(item);
  };

  const disabledNext = !validDate || !siteId;

  return (
    <div className="flex flex-col gap-12">
      <div className="w-full max-w-[728px] mx-auto flex flex-col items-center gap-4">
        <div className="text-center text-white text-5xl md:text-7xl font-black leading-[1.04]">When & Where did this happen?</div>
      </div>

      <section className="grid gap-4 items-center text-center">
        <h3 className="text-vulcan-700 text-2xl font-black">Action date</h3>
        <DateModeToggle />
        {dateMode === 'single' ? <SingleDate /> : <RangeDate />}
      </section>

      <section className="grid gap-4 items-center text-center">
        <h3 className="text-vulcan-700 text-2xl font-black">Site</h3>
        <p className="text-white/80">Select/add a the site where the regen action took place</p>
        {loading ? (
          <div className="text-white/70">Loading sites…</div>
        ) : (
          <div className="w-full flex flex-col items-center gap-3">
            {sites.map((s) => {
              const selected = siteId === s.id;
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  className={`rr-option-card ${selected ? 'rr-option-card-selected' : 'rr-option-card-default'}`}
                  onClick={() => onSelectSite(s)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectSite(s); }}
                >
                  <i className="f7-icons text-2xl">{selected ? 'checkmark_alt_circle_fill' : 'circle'}</i>
                  <div className="flex-1 text-left">
                    <div className="font-bold">{s.name}</div>
                    <div className={selected ? 'text-white/90' : 'text-white/70'}>{s.siteType || '—'}</div>
                    <div className={selected ? 'text-white/90' : 'text-white/50'}>Depth: {s.depthM ?? '—'}m · Area: {s.areaM2 ?? '—'}m²</div>
                  </div>
                  <button type="button" className="px-1 py-1 rounded-full" onClick={(e) => { e.stopPropagation(); setEditSite(s); }} aria-label="Edit site">
                    <span className={`inline-grid place-items-center w-8 h-8 rounded-full ${selected ? 'outline outline-2 outline-white' : 'outline outline-2 outline-white/70'}`}>
                      <i className={`f7-icons ${selected ? 'text-white' : 'text-white/80'}`}>pencil</i>
                    </span>
                  </button>
                </div>
              );
            })}
            <button
              className="relative rr-input text-left max-w-[640px] text-white/80"
              onClick={() => setOpenCreate(true)}
            >
              Add a site
              <i className="f7-icons rr-input-icon">map</i>
            </button>
          </div>
        )}
      </section>

      <SiteModal open={openCreate} mode="create" walletAddress={address!} onClose={() => setOpenCreate(false)} onSaved={onCreated} />
      {editSite && (
        <SiteModal
          open={!!editSite}
          mode="edit"
          initial={{ id: editSite.id, name: editSite.name, type: editSite.siteType || '', depthM: editSite.depthM || 0, areaM2: editSite.areaM2 || 0, coords: (editSite.lon!=null&&editSite.lat!=null)? [Number(editSite.lon), Number(editSite.lat)] : undefined }}
          onClose={() => setEditSite(null)}
          onSaved={(s) => {
            setSites((prev) => prev.map((p) => (p.id === s.id ? { ...p, name: s.name, siteType: String(s.type), depthM: s.depthM, areaM2: s.areaM2 } : p)));
            if (siteId === s.id) onSelectSite({ ...editSite!, name: s.name, siteType: String(s.type), depthM: s.depthM, areaM2: s.areaM2 });
          }}
        />
      )}

      {/* Hidden control to expose next disabled flag via DOM if needed */}
      <input type="hidden" data-next-disabled={String(disabledNext)} />
    </div>
  );
}
