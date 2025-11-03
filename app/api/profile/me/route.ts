import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Return minimal profile payload for the connected wallet without making nested HTTP calls
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, org_name, description, website, wallet_address, handle")
    .filter("wallet_address", "ilike", address)
    .maybeSingle();
  if (error && (error as any).code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const profile = {
    id: data.id,
    profile_name: (data as any).org_name as string | null,
    description: (data as any).description as string | null,
    website: (data as any).website as string | null,
    wallet_address: (data as any).wallet_address as string,
    handle: (data as any).handle as string,
  };

  return NextResponse.json({ profile });
}
