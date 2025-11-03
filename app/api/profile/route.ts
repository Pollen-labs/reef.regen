import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ensureUniqueHandle } from "@/lib/profile/handle";

// PATCH /api/profile
// Body: { wallet_address, profile_name?, description?, website?, handle? }
export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as any;
  const addr = (body.wallet_address || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return NextResponse.json({ error: "Invalid wallet_address" }, { status: 400 });

  // Find existing profile by wallet
  const { data: prof, error: findErr } = await supabaseAdmin
    .from("profiles")
    .select("id, handle")
    .filter("wallet_address", "ilike", addr)
    .maybeSingle();
  if (findErr && (findErr as any).code !== "PGRST116") return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!prof?.id) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const updates: Record<string, any> = {};
  if (body.profile_name != null) updates.org_name = body.profile_name; // map spec field
  if (body.description != null) updates.description = body.description;
  if (body.website != null) updates.website = body.website;
  if (body.handle) updates.handle = await ensureUniqueHandle(body.handle, prof.id);

  if (Object.keys(updates).length === 0) return NextResponse.json({ success: true });

  const { error: upErr } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", prof.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

