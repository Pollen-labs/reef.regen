import type { Metadata } from "next";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children as any;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const sp = await searchParams;
  const site = (sp?.site as string) || "";
  const att = (sp?.att as string) || "";
  const baseStr = (process.env.NEXT_PUBLIC_APP_URL || "").toString() || undefined;
  const base = baseStr ? new URL(baseStr) : undefined;
  const og = new URL("/opengraph/map", base || new URL("http://localhost"));
  if (site) og.searchParams.set("site", site);
  if (att) og.searchParams.set("att", att);

  const urlPath = site || att ? `/map?${new URLSearchParams({ ...(site ? { site } : {}), ...(att ? { att } : {}) }).toString()}` : "/map";

  return {
    metadataBase: base,
    title: "Coral restoration action · Reef.Regen",
    description: "See this action on Reef.Regen.",
    openGraph: {
      type: "website",
      url: urlPath,
      images: [{ url: og.toString(), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [og.toString()],
    },
  };
}

