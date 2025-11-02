import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/profiles/att-internal?address=0x...
// Returns owner-only internal identifiers for attestations belonging to the profile with this wallet.
// Shape: { items: [{ id, internalId }] }
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const { data: prof, error: perr } = await supabaseAdmin
    .from("profiles")
    .select("id, wallet_address")
    .ilike("wallet_address", address)
    .maybeSingle();
  if (perr && perr.code !== "PGRST116") return NextResponse.json({ error: perr.message }, { status: 500 });
  if (!prof) return NextResponse.json({ items: [] });

  const { data: rows, error: aerr } = await supabaseAdmin
    .from("attestation")
    .select("attestation_id, internal_identifier, action_start_date")
    .eq("profile_id", prof.id)
    .order("action_start_date", { ascending: false });
  if (aerr) return NextResponse.json({ error: aerr.message }, { status: 500 });

  const items = (rows || []).map((r: any) => ({ id: r.attestation_id as string, internalId: (r.internal_identifier as string | null) || null }));
  return NextResponse.json({ items });
}

