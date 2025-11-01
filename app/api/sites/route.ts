import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Body = {
  wallet_address: string;
  name: string;
  type: string | number; // label or code
  depth_m: number;
  area_m2: number;
  location: [number, number]; // [lon, lat]
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<Body>;
  const addr = (body.wallet_address || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return NextResponse.json({ error: "Invalid wallet_address" }, { status: 400 });
  const name = (body.name || "").trim();
  const type = body.type;
  const depth_m = body.depth_m === null || body.depth_m === undefined || body.depth_m === '' ? null : Number(body.depth_m);
  const area_m2 = body.area_m2 === null || body.area_m2 === undefined || body.area_m2 === '' ? null : Number(body.area_m2);
  const loc = body.location;
  if (!name || !type || !Array.isArray(loc) || loc.length !== 2) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const lon = Number(loc[0]);
  const lat = Number(loc[1]);

  // Resolve site_type_id
  let site_type_id: number | null = null;
  if (typeof type === "number") site_type_id = type;
  else {
    const { data: st, error: stErr } = await supabaseAdmin
      .from("site_type")
      .select("site_type_id")
      .ilike("name", String(type))
      .maybeSingle();
    if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 });
    site_type_id = (st?.site_type_id as number | null) ?? null;
  }
  if (site_type_id == null) return NextResponse.json({ error: "Unknown site type" }, { status: 400 });

  const { data: newId, error } = await supabaseAdmin.rpc("create_site_for_wallet", {
    wallet_addr: addr,
    site_name: name,
    site_type_id,
    lon,
    lat,
    depth_m,
    surface_area_m2: area_m2,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch created row for response
  const { data, error: gErr } = await supabaseAdmin
    .from("site")
    .select("site_id, site_name, lon, lat, depth_m, surface_area_m2, site_type:site_type_id(name)")
    .eq("site_id", newId)
    .maybeSingle();
  if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Create succeeded but row not found" }, { status: 500 });
  const typeName = (data as any)?.site_type?.name as string | undefined;
  const res = {
    id: data.site_id as string,
    name: data.site_name as string,
    type: typeName || String(site_type_id),
    depthM: (data.depth_m as number | null) ?? null,
    areaM2: (data.surface_area_m2 as number | null) ?? null,
    coords: [Number(data.lon), Number(data.lat)] as [number, number],
  };
  return NextResponse.json(res, { status: 201 });
}
