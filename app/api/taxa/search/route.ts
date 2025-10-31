import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);
  if (q.length < 2) return NextResponse.json({ ok: true, items: [] });

  const { data, error } = await supabaseAdmin
    .from("taxa")
    .select("taxa_id, scientific_name, common_name")
    .or(`scientific_name.ilike.%${q}%,common_name.ilike.%${q}%`)
    .order("scientific_name", { ascending: true })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data || []).map((r: any) => ({
    id: r.taxa_id as number,
    name: r.scientific_name as string,
    common: (r.common_name as string | null) || null,
    label: r.common_name ? `${r.scientific_name} (${r.common_name})` : r.scientific_name,
  }));
  return NextResponse.json({ ok: true, items });
}

