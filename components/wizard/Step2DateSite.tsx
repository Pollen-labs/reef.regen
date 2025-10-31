"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useAttestationWizard } from "@/lib/wizard/attestationWizardStore";
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
      <button onClick={() => setMode('single')} className={`px-5 py-2 flex items-center gap-2 ${dateMode==='single' ? 'bg-orange text-black font-bold' : 'bg-white/10 text-white'}`}>
        {dateMode==='single' ? <i className="f7-icons text-lg">checkmark_alt_circle_fill</i> : <i className="f7-icons text-lg">circle</i>}
        On a specific date
      </button>
      <button onClick={() => setMode('range')} className={`px-5 py-2 flex items-center gap-2 ${dateMode==='range' ? 'bg-orange text-black font-bold' : 'bg-white/10 text-white'}`}>
        {dateMode==='range' ? <i className="f7-icons text-lg">checkmark_alt_circle_fill</i> : <i className="f7-icons text-lg">circle</i>}
        On a duration
      </button>
    </div>
  );
}

function SingleDate() {
  const { actionDate, setPatch } = useAttestationWizard();
  return (
    <div className="relative w-full max-w-[640px]">
      <input
        type="date"
        className="w-full bg-vulcan-700/70 text-white placeholder-white/50 rounded-2xl px-4 py-3 pr-12 outline outline-1 outline-vulcan-600"
        value={actionDate || ''}
        onChange={(e) => setPatch({ actionDate: e.target.value })}
        placeholder="Select date"
      />
      <i className="f7-icons absolute right-3 top-1/2 -translate-y-1/2 text-white/70">calendar</i>
    </div>
  );
}

function RangeDate() {
  const { actionStart, actionEnd, setPatch } = useAttestationWizard();
  const minEnd = actionStart || undefined;
  return (
    <div className="flex gap-3 items-center">
      <div className="relative w-full max-w-[320px]">
        <input type="date" className="w-full bg-vulcan-700/70 text-white rounded-2xl px-4 py-3 pr-12 outline outline-1 outline-vulcan-600" value={actionStart || ''} onChange={(e) => setPatch({ actionStart: e.target.value })} />
        <i className="f7-icons absolute right-3 top-1/2 -translate-y-1/2 text-white/70">calendar</i>
      </div>
      <span className="text-white/60">~</span>
      <div className="relative w-full max-w-[320px]">
        <input type="date" className="w-full bg-vulcan-700/70 text-white rounded-2xl px-4 py-3 pr-12 outline outline-1 outline-vulcan-600" value={actionEnd || ''} min={minEnd} onChange={(e) => setPatch({ actionEnd: e.target.value })} />
        <i className="f7-icons absolute right-3 top-1/2 -translate-y-1/2 text-white/70">calendar</i>
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

      <section className="grid gap-4 items-start">
        <h3 className="text-vulcan-300 text-2xl font-black">Action date</h3>
        <DateModeToggle />
        {dateMode === 'single' ? <SingleDate /> : <RangeDate />}
      </section>

      <section className="grid gap-4 items-start">
        <h3 className="text-vulcan-300 text-2xl font-black">Site</h3>
        <p className="text-white/80">Select/add a the site where the regen action took place</p>
        <button
          className="relative w-full max-w-[640px] text-left bg-vulcan-700/70 text-white/80 rounded-2xl px-4 py-3 pr-12 outline outline-1 outline-vulcan-600"
          onClick={() => setOpenCreate(true)}
        >
          Add a site
          <i className="f7-icons absolute right-3 top-1/2 -translate-y-1/2 text-white/70">map</i>
        </button>
        {loading ? (
          <div className="text-white/70">Loading sites…</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sites.map((s) => {
              const selected = siteId === s.id;
              return (
                <label key={s.id} className={`rounded-2xl p-4 flex gap-3 items-start cursor-pointer outline outline-1 ${selected ? 'bg-orange text-black outline-orange' : 'bg-white/10 text-white outline-white/10'}`}>
                  <input type="radio" name="site" className="mt-1" checked={selected} onChange={() => onSelectSite(s)} />
                  <div className="flex-1">
                    <div className="font-bold text-lg">{s.name}</div>
                    <div className={selected ? 'text-black/80' : 'text-white/70'}>{s.siteType || '—'}</div>
                    <div className={selected ? 'text-black/80' : 'text-white/50'}>
                      Depth: {s.depthM ?? '—'}m · Area: {s.areaM2 ?? '—'}m²
                    </div>
                  </div>
                  <button type="button" className="px-2 py-1 rounded-lg hover:bg-black/10" onClick={(e) => { e.preventDefault(); setEditSite(s); }}>
                    <i className="f7-icons">pencil</i>
                  </button>
                </label>
              );
            })}
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
