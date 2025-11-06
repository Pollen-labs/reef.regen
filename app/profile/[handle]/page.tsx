"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import DonutChartJS from "@/components/shared/charts/DonutChartJS";
import Tag from "@/components/ui/Tag";
import AttestationDetailModal from "@/components/shared/AttestationDetailModal";
import { formatDateShort } from "@/lib/format/date";
import StaticSiteMap from "@/components/profile/StaticSiteMap";
import { classesForRegen } from "@/lib/style/regenColors";
import StackedBarChartJS from "@/components/shared/charts/StackedBarChartJS";
import { useAccount } from "wagmi";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { env } from "@/lib/env";

type Api = {
  profile: { id: string; profile_name: string | null; description: string | null; website: string | null; wallet_address: string; handle: string };
  stats: { actions_total: number; sites_total: number; species_total: number; attestations_total: number };
  actions_breakdown: { name: string; count: number; category?: string }[];
  actions_category_breakdown: { name: string; count: number }[];
  site_types_breakdown: { name: string; count: number }[];
  sites: { id: string; name: string; type?: string; coords: [number, number] }[];
  species: string[];
  attestations: { id: string; date: string; actions: string[]; site?: string }[];
};

export default function ProfilePage() {
  const params = useParams<{ handle: string }>();
  const handle = params?.handle as string;
  const [data, setData] = useState<Api | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const [activeAtt, setActiveAtt] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [internalById, setInternalById] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(handle)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
        if (!cancelled) setData(json as Api);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [handle]);

  const actionsChart = useMemo(() => {
    // Show only non-zero action types in the donut to reduce clutter
    return (data?.actions_breakdown || [])
      .filter((a) => a.count > 0)
      .map((a) => {
        const c = classesForRegen(a.name);
        return { label: a.name, count: a.count, color: c.hex, category: a.category } as {
          label: string; count: number; color: string; category?: string
        };
      });
  }, [data]);

  const siteTypes = data?.site_types_breakdown || [];
  const siteBarSegments = useMemo(() => {
    const palette = ["#F6A17B", "#96B5FA", "#59FCCE", "#F4EA50", "#DDB2FF", "#FADAFD"];
    return siteTypes.map((s, i) => ({ label: s.name, value: s.count, color: palette[i % palette.length] }));
  }, [siteTypes]);

  const truncateWallet = (w?: string) => (w ? `${w.slice(0, 6)}...${w.slice(-5)}` : "");
  const formatMDY = (iso: string) => {
    const d = new Date(iso);
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  // Measure left donut card height to sync the right column (map + bubbles)
  const leftCardRef = useRef<HTMLDivElement | null>(null);
  const [leftHeight, setLeftHeight] = useState<number | null>(null);
  useEffect(() => {
    const el = leftCardRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = Math.round(entry.contentRect.height);
        if (!Number.isNaN(h)) setLeftHeight(h);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Compute ownership every render to keep hook order stable
  const isOwner = useMemo(() => {
    const w = data?.profile?.wallet_address || "";
    return !!address && !!w && address.toLowerCase() === w.toLowerCase();
  }, [address, data?.profile?.wallet_address]);

  // Fetch owner-only internal IDs and merge (do not leak in public payload)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isOwner || !address || !data?.attestations?.length) return;
      try {
        const res = await fetch(`/api/profiles/att-internal?address=${address}`);
        const json = await res.json();
        if (!cancelled && res.ok && json?.items) {
          const map: Record<string, string | null> = {};
          for (const it of json.items as any[]) map[it.id] = it.internalId;
          setInternalById(map);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [isOwner, address, data?.attestations?.length]);

  if (loading) return <div className="w-full max-w-screen-xl mx-auto px-6 lg:px-24 py-12 text-white">Loading profile…</div>;
  if (error) return <div className="w-full max-w-screen-xl mx-auto px-6 lg:px-24 py-12 text-red-300">{error}</div>;
  if (!data) return null;

  const p = data.profile;

  async function openAttestation(id: string) {
    try {
      const res = await fetch(`/api/attestations/${id}`);
      const json = await res.json();
      if (res.ok) {
        const internalId = internalById[id] || null;
        const att = internalId ? { ...json.attestation, internalId } : json.attestation;
        setActiveAtt(att);
        setModalOpen(true);
      }
    } catch {}
  }

  const gapPx = 6; // matches gap-1.5
  const panelPx = 168; // merged bottom panel inside the map card

  return (
    <div className="min-h-screen text-white">
      {/* Breadcrumb bar */}
      <nav aria-label="Breadcrumb" className="w-full">
        <div className="w-full max-w-[1440px] mx-auto px-2 lg:px-24  mb-4 flex items-center justify-between">
          <div className="text-vulcan-500 text-lg font-bold">Profile</div>
          <div className="flex items-center gap-6">
            {isOwner && (
              <a
                href="/profile/setting"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/5"
                title="Edit profile"
                aria-label="Edit profile"
              >
                <i className="f7-icons text-3xl">gear_alt</i>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Full-width background section */}
      <div className="w-full">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-24  flex justify-between items-start gap-8">
        {/* Left column: profile header */}
        <div className="w-full max-w-96 flex flex-col gap-6">
          <h1 className="text-orange text-5xl md:text-7xl font-black leading-tight">{p.profile_name || p.handle}</h1>
          <div className="flex flex-col gap-1">
            <div className="text-vulcan-400 text-base font-bold">About</div>
            <div className="text-vulcan-100 text-lg font-light whitespace-pre-line">{p.description || ""}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-vulcan-400 text-base font-bold">Website</div>
            {p.website ? (
              <div className="flex items-center gap-1">
                <a
                  href={p.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-vulcan-100 text-lg font-bold break-all"
                >
                  {p.website}
                </a>
                <a
                  href={p.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
                  aria-label="Open website"
                  title="Open website"
                >
                  <i className="f7-icons text-xl">arrow_up_right</i>
                </a>
              </div>
            ) : (
              <div className="text-vulcan-500 text-lg">—</div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-vulcan-400 text-base font-bold">Wallet address</div>
            {(() => {
              let cs = p.wallet_address || "";
              try { if (cs) cs = ethers.getAddress(cs); } catch {}
              const short = truncateWallet(cs);
              const href = cs ? `${env.easExplorerAddressPrefix}${cs}` : "#";
              return (
                <div className="flex items-center gap-1">
                  <div className="text-vulcan-100 text-lg font-bold font-mono" title={cs}>{short}</div>
                  {cs && (
                    <a
                      href={href}
                      target="_blank" rel="noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
                      aria-label="Open address on EAS explorer"
                      title="Open on EAS explorer"
                    >
                      <i className="f7-icons text-xl">arrow_up_right</i>
                    </a>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right column: stats + charts + map */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-[680px]">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {[
              { label: "Regen actions", value: data.stats.actions_total },
              { label: "Sites", value: data.stats.sites_total },
              { label: "Species", value: data.stats.species_total },
              { label: "Attestations", value: data.stats.attestations_total },
            ].map((s) => (
              <div key={s.label} className="p-6 bg-vulcan-800 rounded-3xl flex flex-col">
                <div className="text-h4 font-black">{s.value}</div>
                <div className="text-vulcan-400 text-lg font-bold">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts + Map */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-1.5">
            {/* Actions donut */}
            <div ref={leftCardRef} className="flex flex-col gap-2">
              <div className="px-6 py-8 bg-vulcan-800 rounded-3xl flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-6 w-full">
                  <DonutChartJS data={actionsChart} tooltipMode="count" />
                  {/* Category legend with summed totals */}
                  <div className="w-full flex flex-col gap-1">
                    {(data.actions_category_breakdown || []).map((g) => (
                      <div key={g.name} className="w-full flex items-center justify-between">
                        <span className="text-vulcan-300 text-lg font-light">{g.name}</span>
                        <span className="text-white text-xl font-black">{g.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Map + Site types merged card */}
            <div className="bg-vulcan-800 rounded-3xl overflow-hidden" style={leftHeight ? { height: leftHeight } : undefined}>
              {/* Map area */}
              <div style={{ height: Math.max(320, (leftHeight ?? 0) - panelPx) }}>
                <StaticSiteMap
                  sites={data.sites}
                  height={Math.max(320, (leftHeight ?? 0) - panelPx)}
                  className="w-full rounded-t-3xl overflow-hidden"
                />
              </div>
              {/* Bottom panel with stacked bar + legend */}
              <div className="bg-vulcan-900/70 backdrop-blur-[1px] px-4 pt-3 pb-1">
                <StackedBarChartJS
                  segments={siteBarSegments}
                  height={32}
                  barRadius={40}
                  barThickness={20}
                  padding={4}
                  tooltipMode="count"
                  legendInside={false}
                />
              </div>
            </div>
          </div>

          {isOwner && (
            <EmbedPanel handle={p.handle} />
          )}

          {/* Biodiversity */}
          <div className="pt-6">
            <div className="text-vulcan-500 text-lg font-bold mb-2">Biodiversity</div>
            <div className="flex flex-wrap gap-1">
              {(data.species || []).map((s) => (
                <Tag key={s} label={s} size="md" bgClass="bg-ribbon-300" textClass="text-vulcan-900" />
              ))}
            </div>
          </div>

          {/* Attestations table */}
          <div className="pt-8 pb-24">
            <div className="text-vulcan-500 text-lg font-bold mb-2">Attestations</div>
            {(() => {
              const colsOwner = "20% 45% 20% 10% 5%";
              const colsPublic = "20% 50% 20% 5%";
              const gridCols = isOwner ? colsOwner : colsPublic;
              const header = (
                <div className="mb-1 grid gap-1" style={{ gridTemplateColumns: gridCols }}>
                  <div className="h-10 px-3 bg-vulcan-800 rounded-lg flex items-center">
                    <div className="text-vulcan-400 text-lg font-bold">Action date</div>
                  </div>
                  <div className="h-10 px-3 bg-vulcan-800 rounded-lg flex items-center">
                    <div className="text-vulcan-400 text-lg font-bold">Regen actions</div>
                  </div>
                  <div className="h-10 px-3 bg-vulcan-800 rounded-lg flex items-center">
                    <div className="text-vulcan-400 text-lg font-bold">Site name</div>
                  </div>
                  {isOwner && (
                    <div className="h-10 px-3 bg-vulcan-800 rounded-lg flex items-center">
                      <div className="text-vulcan-400 text-lg font-bold">ID</div>
                    </div>
                  )}
                  <div className="h-10 px-3 bg-vulcan-800 rounded-lg" />
                </div>
              );
              const rows = (data.attestations || []).map((a) => (
                <button
                  key={a.id}
                  onClick={() => openAttestation(a.id)}
                  aria-label={`Open attestation ${formatDateShort(a.date)}`}
                  className="group w-full grid gap-1 mb-1 rounded-lg text-left cursor-pointer transition-colors hover:bg-vulcan-700/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <div className="h-10 px-3 bg-vulcan-800 rounded-lg flex items-center whitespace-nowrap transition-colors group-hover:bg-vulcan-700">
                    <div className="text-vulcan-200 text-lg font-light">{formatDateShort(a.date)}</div>
                  </div>
                  <div className="h-10 px-3 bg-vulcan-800 rounded-lg flex items-center transition-colors group-hover:bg-vulcan-700">
                    <div className="text-vulcan-200 text-lg font-bold truncate" title={a.actions.join(", ")}>{a.actions.join(", ")}</div>
                  </div>
                  <div className="h-10 px-3 bg-vulcan-800 rounded-lg flex items-center transition-colors group-hover:bg-vulcan-700">
                    <div className="text-vulcan-200 text-lg font-bold truncate" title={a.site || ''}>{a.site || ''}</div>
                  </div>
                  {isOwner && (
                    <div className="h-10 px-3 bg-vulcan-800 rounded-lg flex items-center transition-colors group-hover:bg-vulcan-700">
                      <div className="text-vulcan-200 text-lg font-light truncate" title={internalById[a.id] || ''}>{internalById[a.id] || '-'}</div>
                    </div>
                  )}
                  <div className="h-10 bg-vulcan-800 rounded-lg grid place-items-center text-flamingo-200 transition-colors group-hover:bg-vulcan-700">
                    <i className="f7-icons text-2xl">ellipsis</i>
                  </div>
                </button>
              ));
              return (
                <>
                  {header}
                  {rows}
                </>
              );
            })()}
          </div>

          {modalOpen && (
            <AttestationDetailModal attestation={activeAtt} onClose={() => setModalOpen(false)} />
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

function EmbedPanel({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(400);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const src = `${origin}/embed/profile/${handle}`;
  const code = `<iframe src="${src}" width="100%" height="${height}" frameborder="0" allowfullscreen></iframe>`;

  async function copy() {
    try { await navigator.clipboard.writeText(code); } catch {}
  }

  return (
    <div className="px-6 py-4 bg-vulcan-900 rounded-3xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-vulcan-200 text-lg font-light">Embed your public site map.</div>
          <div className="text-vulcan-200 text-sm">Clicks open Reef.Regen in a new tab.</div>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="px-4 py-2 rounded-xl bg-vulcan-800 text-white text-sm font-bold">
          {open ? 'Hide code' : 'Show code'}
        </button>
      </div>
      {open && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <label className="text-sm text-vulcan-300">Height</label>
            <select value={height} onChange={(e) => setHeight(Number(e.target.value))} className="bg-vulcan-800 text-white rounded-lg px-2 py-1">
              <option value={320}>320</option>
              <option value={400}>400</option>
              <option value={520}>520</option>
              <option value={640}>640</option>
            </select>
          </div>
          <textarea readOnly value={code} className="w-full h-28 bg-vulcan-800 text-white rounded-xl p-3 font-mono text-xs" />
          <div className="flex gap-2">
            <button onClick={copy} className="px-4 py-2 rounded-xl bg-orange text-black font-bold">Copy</button>
            <a href={src} target="_blank" className="px-4 py-2 rounded-xl bg-vulcan-800 text-white">Preview</a>
          </div>
        </div>
      )}
    </div>
  );
}
