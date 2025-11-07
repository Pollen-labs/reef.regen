"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StaticSiteMap from "@/components/profile/StaticSiteMap";

type EmbedData = {
  profile: { id: string; handle: string; name?: string | null };
  sites: { id: string; name: string; type?: string; coords: [number, number]; attestationCount?: number }[];
};

export default function EmbedProfileMap() {
  const params = useParams<{ handle: string }>();
  const handle = params?.handle as string;
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

  // Construct base URL using NEXT_PUBLIC_APP_URL for shareable permalinks
  const appBase = (process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : ''))
    .toString()
    .replace(/\/$/, "");

  const onClickSite = (siteId: string) => {
    const url = `${appBase}/map?site=${encodeURIComponent(siteId)}`;
    // Open in new tab - more reliable for cross-origin iframes
    window.open(url, '_blank');
  };

  if (loading) return <div className="min-h-screen bg-black text-white grid place-items-center" style={{ height: 400 }}>Loading…</div>;
  if (!data) return <div className="min-h-screen bg-black" style={{ height: 400 }} />;

  return (
    <div className="w-full bg-black min-h-screen">
      <StaticSiteMap sites={data.sites} height={400} onSiteClick={onClickSite} className="w-full rounded-none overflow-hidden" />
      <div className="w-full px-4 py-2 bg-black/70 text-white text-xs flex items-center justify-between">
        <span>Powered by <a href={appBase} target="_blank" rel="noopener noreferrer" className="font-bold underline">Reef.Regen</a></span>
        <a href={`${appBase}/profile/${encodeURIComponent(handle)}`} target="_blank" rel="noopener noreferrer" className="underline">View full profile</a>
      </div>
    </div>
  );
}
