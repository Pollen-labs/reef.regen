import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("site_type")
    .select("site_type_id, name")
    .order("site_type_id", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const items = (data || []).map((r: any) => ({ code: r.site_type_id, label: r.name }));
  return NextResponse.json({ ok: true, items });
}

