import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("regen_type")
    .select("regen_type_id, name, category, description")
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    ok: true,
    items: (data || []).map((r: any) => ({
      id: r.regen_type_id,
      name: r.name,
      category: r.category,
      description: r.description,
    })),
  });
}
