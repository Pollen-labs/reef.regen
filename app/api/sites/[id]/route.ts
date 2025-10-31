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

