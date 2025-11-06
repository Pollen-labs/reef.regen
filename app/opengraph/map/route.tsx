import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

type Payload = { orgName: string; createdAtMs: number };

function getBaseUrl(req: Request): string {
  const envBase = (process.env.NEXT_PUBLIC_APP_URL || "").toString().replace(/\/$/, "");
  if (envBase) return envBase;
  try {
    const url = new URL(req.url);
    const proto = (url.protocol || "https:");
    const host = url.host;
    return `${proto}//${host}`;
  } catch {
    return "";
  }
}

function pickStickerByTime(createdAtMs: number) {
  const STICKERS = [
    "sticker-a.png",
    "sticker-b.png",
    "sticker-c.png",
    "sticker-d.png",
  ];
  const BUCKET_MS = 10 * 60 * 1000;
  const bucket = Math.floor(createdAtMs / BUCKET_MS);
  return STICKERS[bucket % STICKERS.length];
}

async function getPublicSharePayload(base: string, site?: string | null, att?: string | null): Promise<Payload> {
  // Prefer attestation for precise createdAt and org
  if (att) {
    try {
      const res = await fetch(`${base}/api/attestations/${encodeURIComponent(att)}`, { cache: "no-store" });
      const j = await res.json();
      const org = j?.attestation?.orgName || "Reef.Regen";
      const createdAt = j?.attestation?.submittedAt || new Date().toISOString();
      return { orgName: String(org), createdAtMs: Date.parse(createdAt) || Date.now() };
    } catch {}
  }

  // Fallback: site detail (orgName may be included by backend)
  if (site) {
    try {
      const res = await fetch(`${base}/api/sites/${encodeURIComponent(site)}?recent=1`, { cache: "no-store" });
      const j = await res.json();
      const org = j?.location?.orgName || j?.location?.ownerName || "Reef.Regen";
      const createdAt = j?.location?.attestations?.[0]?.submittedAt || new Date().toISOString();
      return { orgName: String(org), createdAtMs: Date.parse(createdAt) || Date.now() };
    } catch {}
  }

  return { orgName: "Reef.Regen", createdAtMs: Date.now() };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const site = searchParams.get("site");
  const att = searchParams.get("att");
  const base = getBaseUrl(req);

  const payload = await getPublicSharePayload(base, site, att);
  const sticker = pickStickerByTime(payload.createdAtMs);
  const logo = `${base}/og/logo.png`;
  const stickerUrl = `${base}/og/stickers/${sticker}`;

  // Layout tuned to your template
  const BG = "#15171e"; // Black
  const PANEL = "#222533"; // Right block
  const VULCAN_200 = "#c7c9d3"; // approximate

  return new ImageResponse(
    (
      <div style={{ position: "relative", width: 1200, height: 630, background: BG, color: "#fff" }}>
        {/* Left column wrapper */}
        <div
          style={{
            position: "absolute",
            left: 65,
            top: 60,
            width: 552,
            height: 510,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
            <img src={logo} width={180} height={72} alt="Reef.Regen" />
          </div>

          {/* Copy block */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ color: VULCAN_200, fontSize: 28, fontWeight: 300, lineHeight: 1.25 }}>
              Coral restoration action by
            </div>
            <div
              style={{
                color: "#e6e7ee",
                fontSize: 64,
                fontWeight: 900,
                lineHeight: 1.05,
                // Ensure wrapping inside the 552px column
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {payload.orgName}
            </div>
          </div>
        </div>

        {/* Right sticker panel */}
        <div
          style={{
            position: "absolute",
            left: 643,
            top: 57,
            width: 500,
            height: 500,
            borderRadius: 24,
            background: PANEL,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img src={stickerUrl} width={400} height={400} alt="sticker" />
        </div>
      </div>
    ),
    size as any
  );
}
