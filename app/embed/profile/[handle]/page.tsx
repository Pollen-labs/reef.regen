"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StaticSiteMap from "@/components/profile/StaticSiteMap";

type EmbedData = {
  profile: { id: string; handle: string; name?: string | null };
  sites: { id: string; name: string; type?: string; coords: [number, number] }[];
};

export default function EmbedProfileMap() {
  const params = useParams<{ handle: string }>();
  const handle = (params?.handle as string) || "";
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

  if (loading) return <div style={{ width: "100%", height: 400, background: "#0B0C10", color: "white", display: "grid", placeItems: "center" }}>Loading…</div>;
  if (!data) return <div style={{ width: "100%", height: 400, background: "#0B0C10" }} />;

  return (
    <div style={{ width: "100%", background: "#0B0C10" }}>
      <StaticSiteMap sites={data.sites as any} height={400} onSiteClick={onClickSite} className="w-full rounded-none overflow-hidden" />
      <div className="w-full px-4 py-2 bg-black/60 text-white text-xs flex items-center justify-between">
        <span>Powered by <a href="/" target="_top" className="font-bold underline">Reef.Regen</a></span>
        <a href={`/profile/${encodeURIComponent(handle)}`} target="_top" className="underline">View full profile</a>
      </div>
    </div>
  );
}
