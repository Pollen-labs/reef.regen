import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toBaseHandle } from "@/lib/profile/handle";

// GET /api/profile/check-handle?handle=x
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handleRaw = (searchParams.get("handle") || "").trim();
  if (!handleRaw) return NextResponse.json({ error: "Missing handle" }, { status: 400 });
  const handle = toBaseHandle(handleRaw);
  if (!/^[a-z0-9-]{3,32}$/.test(handle)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("handle", handle)
    .maybeSingle();
  if (error && (error as any).code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const available = !data;
  return NextResponse.json({ available });
}

