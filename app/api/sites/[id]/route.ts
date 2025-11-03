import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/sites/:id → returns Location JSON from RPC get_site_detail
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await ctx.params;
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
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await ctx.params;
  if (!siteId) return NextResponse.json({ error: "Missing site id" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as any;
  const name = (body.name || "").trim();
  const hasTypeField = Object.prototype.hasOwnProperty.call(body, "type");
  const type = body.type;
  const depth_m = body.depth_m != null ? Number(body.depth_m) : null;
  const area_m2 = body.area_m2 != null ? Number(body.area_m2) : null;
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  // Resolve site_type_id. If type is omitted, keep existing.
  let site_type_id: number | null = null;
  if (hasTypeField && (type === undefined || type === null || String(type).trim() === "")) {
    // Explicit empty provided — treat as error to avoid wiping accidentally
    return NextResponse.json({ error: "Invalid site type" }, { status: 400 });
  }
  if (hasTypeField) {
    if (typeof type === "number") site_type_id = type;
    else {
      const { data: st, error: stErr } = await supabaseAdmin
        .from("site_type")
        .select("site_type_id")
        .ilike("name", String(type))
        .maybeSingle();
      if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 });
      site_type_id = (st?.site_type_id as number | null) ?? null;
      if (site_type_id == null) return NextResponse.json({ error: "Unknown site type" }, { status: 400 });
    }
  } else {
    // Load existing to preserve type
    const { data: existing, error: gErr } = await supabaseAdmin
      .from("site")
      .select("site_type_id")
      .eq("site_id", siteId)
      .maybeSingle();
    if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });
    site_type_id = (existing?.site_type_id as number | null) ?? null;
  }

  const { error } = await supabaseAdmin
    .from("site")
    .update({
      site_name: name,
      site_type_id,
      depth_m,
      surface_area_m2: area_m2,
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
