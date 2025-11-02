"use client";
import { useEffect, useMemo, useState } from "react";
import DonutChart from "@/components/shared/DonutChart";
import Tag from "@/components/ui/Tag";
import StaticSiteMap from "@/components/profile/StaticSiteMap";
import { classesForRegen } from "@/lib/style/regenColors";
import BubbleChart from "@/components/shared/BubbleChart";
import { useAccount } from "wagmi";
import { useParams } from "next/navigation";

type Api = {
  profile: { id: string; profile_name: string | null; description: string | null; website: string | null; wallet_address: string; handle: string };
  stats: { actions_total: number; sites_total: number; species_total: number; attestations_total: number };
  actions_breakdown: { name: string; count: number }[];
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
    return (data?.actions_breakdown || []).map((a) => {
      const c = classesForRegen(a.name);
      return { label: a.name, count: a.count, color: c.hex };
    });
  }, [data]);

  const siteTypes = data?.site_types_breakdown || [];
  const siteBubbles = useMemo(() => {
    const palette = ["#F6A17B", "#96B5FA", "#59FCCE", "#F4EA50", "#DDB2FF", "#FADAFD"];
    return siteTypes.map((s, i) => ({ label: s.name, count: s.count, color: palette[i % palette.length] }));
  }, [siteTypes]);

  const truncateWallet = (w?: string) => (w ? `${w.slice(0, 6)}...${w.slice(-5)}` : "");
  const formatMDY = (iso: string) => {
    const d = new Date(iso);
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  // Compute ownership every render to keep hook order stable
  const isOwner = useMemo(() => {
    const w = data?.profile?.wallet_address || "";
    return !!address && !!w && address.toLowerCase() === w.toLowerCase();
  }, [address, data?.profile?.wallet_address]);

  if (loading) return <div className="w-full max-w-screen-xl mx-auto px-6 lg:px-24 py-12 text-white">Loading profile…</div>;
  if (error) return <div className="w-full max-w-screen-xl mx-auto px-6 lg:px-24 py-12 text-red-300">{error}</div>;
  if (!data) return null;

  const p = data.profile;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Local page header: breadcrumb + gear spot */}
      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-24 pt-4 pb-8 flex items-center justify-between">
        <div className="text-vulcan-500 text-lg font-bold">Account / Dashboard</div>
        <div className="flex items-center gap-6">
          {isOwner && (
            <a
              href="/profile/details"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/5"
              title="Edit profile"
            >
              <i className="f7-icons text-2xl">gear</i>
            </a>
          )}
        </div>
      </div>

      {/* Full-width background section */}
      <div className="w-full bg-vulcan-900">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-24 py-10 flex justify-between items-start gap-8">
        {/* Left column: profile header */}
        <div className="w-full max-w-96 flex flex-col gap-6">
          <h1 className="text-orange text-5xl md:text-7xl font-black leading-tight">{p.profile_name || p.handle}</h1>
          <div className="flex flex-col gap-2">
            <div className="text-vulcan-400 text-lg font-light">About</div>
            <div className="text-vulcan-100 text-lg font-light whitespace-pre-line">{p.description || ""}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-vulcan-400 text-lg font-light">Website</div>
            {p.website ? (
              <a href={p.website} target="_blank" rel="noreferrer" className="text-vulcan-100 text-lg font-bold underline break-all">{p.website}</a>
            ) : (
              <div className="text-vulcan-500 text-lg">—</div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-vulcan-400 text-lg font-light">Wallet address</div>
            <div className="text-vulcan-100 text-lg font-bold font-mono">{truncateWallet(p.wallet_address)}</div>
          </div>
        </div>

        {/* Right column: stats + charts + map */}
        <div className="flex-1 flex flex-col gap-3 min-w-[680px]">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Regen actions", value: data.stats.actions_total },
              { label: "Sites", value: data.stats.sites_total },
              { label: "Species", value: data.stats.species_total },
              { label: "Attestations", value: data.stats.attestations_total },
            ].map((s) => (
              <div key={s.label} className="p-6 bg-vulcan-800 rounded-3xl flex flex-col">
                <div className="text-5xl font-black">{s.value}</div>
                <div className="text-vulcan-400 text-lg font-bold">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts + Map */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Actions donut */}
            <div className="flex flex-col gap-2">
              <div className="px-8 py-6 bg-vulcan-800 rounded-3xl flex flex-col items-center gap-6">
                <div className="w-full text-vulcan-500 text-lg font-bold">Regen actions</div>
                <div className="flex flex-col items-center gap-6 w-full">
                  <DonutChart data={actionsChart} size={160} strokeWidth={28} />
                  <div className="w-full flex flex-col gap-2">
                    {(data.actions_breakdown || []).map((a) => {
                      const c = classesForRegen(a.name);
                      return (
                        <div key={a.name} className="w-full flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-5 w-2 rounded ${c.bg}`} />
                            <span className="text-white text-lg font-light truncate">{a.name}</span>
                          </div>
                          <span className="text-white text-lg font-bold">{a.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Map + Site types bubble chart */}
            <div className="flex flex-col gap-3">
              <div className="h-80 bg-vulcan-800 rounded-3xl overflow-hidden">
                <StaticSiteMap sites={data.sites} height={320} />
              </div>
              <div className="p-8 bg-vulcan-800 rounded-3xl">
                <div className="text-vulcan-500 text-lg font-bold mb-3">Regen site types</div>
                <BubbleChart data={siteBubbles} />
              </div>
            </div>
          </div>

          {/* Embed panel placeholder (owner-only later) */}
          <div className="px-6 py-4 bg-vulcan-900 rounded-3xl">
            <div className="text-vulcan-200 text-lg font-light">Embed the map data onto your site</div>
            <div className="text-vulcan-200 text-lg font-bold">Show code</div>
          </div>

          {/* Biodiversity */}
          <div className="pt-6">
            <div className="text-vulcan-500 text-lg font-bold mb-2">Biodiversity</div>
            <div className="flex flex-wrap gap-2">
              {(data.species || []).map((s) => (
                <Tag key={s} label={s} size="md" bgClass="bg-ribbon-300" textClass="text-vulcan-900" />
              ))}
            </div>
          </div>

          {/* Attestations table */}
          <div className="pt-8">
            <div className="text-vulcan-500 text-lg font-bold mb-2">Attestations</div>
            <div className="flex items-center gap-1 mb-1">
              <div className="w-36 h-10 px-3 py-1 bg-vulcan-800 rounded-lg flex items-center"><div className="text-vulcan-400 text-lg font-bold">Attest date</div></div>
              <div className="flex-1 h-10 px-3 py-1 bg-vulcan-800 rounded-lg flex items-center"><div className="text-vulcan-400 text-lg font-bold">Regen actions</div></div>
              <div className="w-44 h-10 px-3 py-1 bg-vulcan-800 rounded-lg flex items-center"><div className="text-vulcan-400 text-lg font-bold">Site name</div></div>
              <div className="w-10 h-10 px-3 py-1 bg-vulcan-800 rounded-lg" />
            </div>
            {(data.attestations || []).map((a) => (
              <div key={a.id} className="flex items-center gap-1 mb-1">
                <div className="w-36 h-10 px-3 py-1 bg-vulcan-800 rounded-lg flex items-center"><div className="text-vulcan-200 text-lg font-light">{formatMDY(a.date)}</div></div>
                <div className="flex-1 h-10 px-3 py-1 bg-vulcan-800 rounded-lg flex items-center"><div className="text-vulcan-200 text-lg font-bold truncate">{a.actions.join(", ")}</div></div>
                <div className="w-44 h-10 px-3 py-1 bg-vulcan-800 rounded-lg flex items-center"><div className="text-vulcan-200 text-lg font-bold">{a.site || ""}</div></div>
                <div className="w-10 h-10 bg-vulcan-800 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
