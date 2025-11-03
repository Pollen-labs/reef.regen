import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(_req: Request, ctx: { params: Promise<{ handle: string }> }) {
  const { handle } = await ctx.params;
  if (!handle) return NextResponse.json({ error: "Missing handle" }, { status: 400 });

  // Minimal profile by handle
  const { data: prof, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select("id, handle, org_name")
    .ilike("handle", handle)
    .maybeSingle();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!prof) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Sites for this profile
  const { data: sites, error: sErr } = await supabaseAdmin
    .from("site")
    .select("site_id, site_name, lon, lat, site_type:site_type_id(name)")
    .eq("profile_id", prof.id);
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  const payload = {
    profile: {
      id: prof.id as string,
      handle: prof.handle as string,
      name: (prof.org_name as string | null) || null,
    },
    sites: (sites || []).map((s: any) => ({
      id: s.site_id as string,
      name: s.site_name as string,
      type: (s.site_type?.name as string) || undefined,
      coords: [Number(s.lon), Number(s.lat)] as [number, number],
    })),
  };

  return NextResponse.json(payload);
}

