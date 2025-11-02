import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(_req: Request, ctx: { params: Promise<{ handle: string }> }) {
  const { handle } = await ctx.params;
  if (!handle) return NextResponse.json({ error: "Missing handle" }, { status: 400 });

  const { data: prof, error: perr } = await supabaseAdmin
    .from("profiles")
    .select("id, org_name, handle")
    .ilike("handle", handle)
    .maybeSingle();
  if (perr) return NextResponse.json({ error: perr.message }, { status: 500 });
  if (!prof) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const profileId = prof.id as string;

  // Actions breakdown for donut (include zeros)
  const [{ data: allActions, error: aerr }, { data: usedRows, error: uerr }] = await Promise.all([
    supabaseAdmin.from("regen_type").select("regen_type_id,name").order("name"),
    supabaseAdmin
      .from("attestation_regen_type")
      .select("regen_type:regen_type_id(regen_type_id), attestation!inner(profile_id)")
      .eq("attestation.profile_id", profileId),
  ]);
  if (aerr) return NextResponse.json({ error: aerr.message }, { status: 500 });
  if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 });
  const usedCounts = new Map<number, number>();
  for (const r of usedRows || []) {
    const id = (r as any)?.regen_type?.regen_type_id as number | undefined;
    if (typeof id === "number") usedCounts.set(id, (usedCounts.get(id) || 0) + 1);
  }
  const actions = (allActions || []).map((rt: any) => ({ name: rt.name as string, count: usedCounts.get(rt.regen_type_id) || 0 }));

  // Sites for map
  const { data: sites, error: serr } = await supabaseAdmin
    .from("site")
    .select("site_id, site_name, lon, lat, site_type:site_type_id(name)")
    .eq("profile_id", profileId);
  if (serr) return NextResponse.json({ error: serr.message }, { status: 500 });
  const sitesPayload = (sites || []).map((s: any) => ({
    id: s.site_id as string,
    name: s.site_name as string,
    type: (s.site_type?.name as string) || undefined,
    coords: [Number(s.lon), Number(s.lat)] as [number, number],
  }));

  // Site type donut
  const siteTypeCounts = new Map<string, number>();
  for (const s of sitesPayload) siteTypeCounts.set(s.type || "Unknown", (siteTypeCounts.get(s.type || "Unknown") || 0) + 1);
  const siteTypes = Array.from(siteTypeCounts.entries()).map(([name, count]) => ({ name, count }));

  return NextResponse.json({
    profile: { id: prof.id, name: prof.org_name as string | null, handle: prof.handle as string },
    actions_breakdown: actions,
    site_types_breakdown: siteTypes,
    sites: sitesPayload,
  });
}

