import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("handle, org_name")
    .filter("wallet_address", "ilike", address)
    .maybeSingle();
  if (error && error.code !== "PGRST116") return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: true, handle: null, name: null });
  const orgName = (data as any).org_name as string | null;
  const handle = (data as any).handle as string | null;
  return NextResponse.json({ ok: true, handle, orgName, name: orgName || handle || null });
}
