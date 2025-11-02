import { NextRequest, NextResponse } from "next/server";

// Simple proxy that resolves a handle by wallet, then returns the same payload as /api/profile/[handle]
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  // Resolve handle by wallet
  const origin = new URL(req.url).origin;
  const res = await fetch(`${origin}/api/profiles/by-wallet?address=${address}`);
  const json = await res.json().catch(() => ({} as any));
  const handle = json?.handle as string | undefined;
  if (!handle) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Proxy to handle endpoint
  const prox = await fetch(`${origin}/api/profile/${encodeURIComponent(handle)}`);
  const body = await prox.json().catch(() => ({}));
  return new NextResponse(JSON.stringify(body), { status: prox.status, headers: { "Content-Type": "application/json" } });
}
