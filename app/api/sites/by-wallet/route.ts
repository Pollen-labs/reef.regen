import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const { data: prof, error: perr } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .filter("wallet_address", "ilike", address)
    .maybeSingle();
  if (perr && perr.code !== "PGRST116") return NextResponse.json({ error: perr.message }, { status: 500 });
  if (!prof?.id) return NextResponse.json({ ok: true, items: [] });

  const { data, error } = await supabaseAdmin
    .from("site")
    .select("site_id, site_name, lon, lat, depth_m, surface_area_m2, site_type:site_type_id(name)")
    .eq("profile_id", prof.id)
    .order("site_name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data || []).map((r: any) => ({
    id: r.site_id as string,
    name: r.site_name as string,
    lon: r.lon as string | number,
    lat: r.lat as string | number,
    depthM: (r.depth_m as number | null) ?? null,
    areaM2: (r.surface_area_m2 as number | null) ?? null,
    siteType: (r.site_type?.name as string | undefined) || undefined,
  }));
  return NextResponse.json({ ok: true, items });
}

