"use client";
import { useEffect, useMemo, useState } from "react";
import StaticSiteMap from "@/components/profile/StaticSiteMap";

type EmbedData = {
  profile: { id: string; handle: string; name?: string | null };
  sites: { id: string; name: string; type?: string; coords: [number, number] }[];
};

export default function EmbedProfileMap({ params }: { params: { handle: string } }) {
  const { handle } = params;
  const [data, setData] = useState<EmbedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(handle)}/embed`);
        const json = await res.json();
        if (!cancelled && res.ok) setData(json as any);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [handle]);

  const onClickSite = (siteId: string) => {
    const url = `/map?site=${encodeURIComponent(siteId)}`;
    try {
      window.top?.location.assign(url);
    } catch {
      window.location.assign(url);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white grid place-items-center" style={{ height: 400 }}>Loading…</div>;
  if (!data) return <div className="min-h-screen bg-black" style={{ height: 400 }} />;

  return (
    <div className="w-full bg-black min-h-screen">
      <StaticSiteMap sites={data.sites as any} height={400} onSiteClick={onClickSite} className="w-full rounded-none overflow-hidden" />
      <div className="w-full px-4 py-2 bg-black/70 text-white text-xs flex items-center justify-between">
        <span>Powered by <a href="/" target="_top" className="font-bold underline">Reef.Regen</a></span>
        <a href={`/profile/${encodeURIComponent(handle)}`} target="_top" className="underline">View full profile</a>
      </div>
    </div>
  );
}
