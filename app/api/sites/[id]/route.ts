import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/sites/:id → returns Location JSON from RPC get_site_detail
export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const siteId = ctx.params.id;
  if (!siteId) return NextResponse.json({ error: "Missing site id" }, { status: 400 });

  const { data, error } = await supabaseAdmin.rpc("get_site_detail", {
    site_uuid: siteId,
    recent_count: 5,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  return NextResponse.json({ location: data });
}

// PATCH /api/sites/:id — update basic fields (no coordinate edits)
export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const siteId = ctx.params.id;
  if (!siteId) return NextResponse.json({ error: "Missing site id" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as any;
  const name = (body.name || "").trim();
  const type = body.type;
  const depth_m = body.depth_m != null ? Number(body.depth_m) : null;
  const area_m2 = body.area_m2 != null ? Number(body.area_m2) : null;
  if (!name || !type) return NextResponse.json({ error: "Missing name/type" }, { status: 400 });

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

  const { error } = await supabaseAdmin.rpc("update_site_basic", {
    site_uuid: siteId,
    site_name: name,
    site_type_id,
    depth_m,
    surface_area_m2: area_m2,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
