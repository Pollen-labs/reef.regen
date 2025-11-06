import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ActionsBreakdown = { name: string; count: number; category?: string }[];
type CategoryBreakdown = { name: string; count: number }[];
type SiteTypeBreakdown = { name: string; count: number }[];

async function getProfileByHandle(handle: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, org_name, description, website, wallet_address, handle")
    .ilike("handle", handle)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ handle: string }> }) {
  const { handle } = await ctx.params;
  if (!handle) return NextResponse.json({ error: "Missing handle" }, { status: 400 });

  const profile = await getProfileByHandle(handle);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const profileId = profile.id as string;

  // Stats: totals
  const [attTotal, sitesRows, actionsUsedRows, regenTypesRows, speciesRows] = await Promise.all([
    supabaseAdmin.from("attestation").select("attestation_id", { count: "exact", head: true }).eq("profile_id", profileId),
    supabaseAdmin.from("site").select("site_id, site_type:site_type_id(name)").eq("profile_id", profileId),
    // Per-action usage via join to attestation (filter by profile)
    supabaseAdmin
      .from("attestation_regen_type")
      .select("regen_type:regen_type_id(regen_type_id,name), attestation!inner(profile_id)")
      .eq("attestation.profile_id", profileId),
    // All possible actions (for zero fill)
    supabaseAdmin.from("regen_type").select("regen_type_id,name,category").order("name", { ascending: true }),
    // Distinct species scientific names via attestation link
    supabaseAdmin
      .from("attestation_taxa")
      .select("taxa:taxa_id(scientific_name), attestation!inner(profile_id)")
      .eq("attestation.profile_id", profileId),
  ]);

  if (attTotal.error) return NextResponse.json({ error: attTotal.error.message }, { status: 500 });
  if (sitesRows.error) return NextResponse.json({ error: sitesRows.error.message }, { status: 500 });
  if (actionsUsedRows.error) return NextResponse.json({ error: actionsUsedRows.error.message }, { status: 500 });
  if (regenTypesRows.error) return NextResponse.json({ error: regenTypesRows.error.message }, { status: 500 });
  if (speciesRows.error) return NextResponse.json({ error: speciesRows.error.message }, { status: 500 });

  const sites = (sitesRows.data || []) as any[];
  const allActions = (regenTypesRows.data || []) as { regen_type_id: number; name: string; category: string }[];

  // Actions breakdown: count by regen_type_id then map to full list (zero fill)
  const usedCounts = new Map<number, number>();
  for (const row of (actionsUsedRows.data || []) as any[]) {
    const rt = row.regen_type as { regen_type_id: number; name: string } | null;
    if (!rt) continue;
    usedCounts.set(rt.regen_type_id, (usedCounts.get(rt.regen_type_id) || 0) + 1);
  }
  const actions_breakdown: ActionsBreakdown = allActions.map((rt) => ({ name: rt.name, count: usedCounts.get(rt.regen_type_id) || 0, category: rt.category }));

  // Aggregate by category for legend display
  const catMap = new Map<string, number>();
  for (const rt of allActions) {
    const inc = usedCounts.get(rt.regen_type_id) || 0;
    const key = rt.category;
    catMap.set(key, (catMap.get(key) || 0) + inc);
  }
  const order = [
    'Asexual Propagation',
    'Sexual Propagation',
    'Substratum Enhancement',
  ];
  const actions_category_breakdown: CategoryBreakdown = Array.from(catMap.entries())
    .filter(([_n, c]) => (c || 0) > 0)
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([name, count]) => ({ name, count }));

  // Site types donut and Sites total
  const siteTypeCounts = new Map<string, number>();
  for (const s of sites) {
    const name = (s.site_type?.name as string) || "Unknown";
    siteTypeCounts.set(name, (siteTypeCounts.get(name) || 0) + 1);
  }
  const site_types_breakdown: SiteTypeBreakdown = Array.from(siteTypeCounts.entries()).map(([name, count]) => ({ name, count }));

  // Distinct species names
  const speciesSet = new Set<string>();
  for (const r of (speciesRows.data || []) as any[]) {
    const name = r.taxa?.scientific_name as string | undefined;
    if (name) speciesSet.add(name);
  }
  const species = Array.from(speciesSet).sort((a, b) => a.localeCompare(b));

  // Sites list with coords and type
  const { data: siteList, error: siteErr } = await supabaseAdmin
    .from("site")
    .select("site_id, site_name, lon, lat, site_type:site_type_id(name)")
    .eq("profile_id", profileId);
  if (siteErr) return NextResponse.json({ error: siteErr.message }, { status: 500 });
  const sitesPayload = (siteList || []).map((s: any) => ({
    id: s.site_id as string,
    name: s.site_name as string,
    type: (s.site_type?.name as string) || undefined,
    coords: [Number(s.lon), Number(s.lat)] as [number, number],
  }));

  // Attestations table rows: date, actions, site name
  const { data: attRows, error: attErr } = await supabaseAdmin
    .from("attestation")
    .select("attestation_id, action_start_date, action_end_date, site:site_id(site_name), profile_id")
    .eq("profile_id", profileId)
    .order("action_start_date", { ascending: false });
  if (attErr) return NextResponse.json({ error: attErr.message }, { status: 500 });

  // For action names, join via view attestation_min_v
  const attIds = (attRows || []).map((a: any) => a.attestation_id as string);
  let actionTypesByAtt = new Map<string, string[]>();
  if (attIds.length) {
    const { data: mins, error: minErr } = await supabaseAdmin
      .from("attestation_min_v")
      .select("attestation_id, action_types")
      .in("attestation_id", attIds);
    if (minErr) return NextResponse.json({ error: minErr.message }, { status: 500 });
    for (const m of mins || []) {
      actionTypesByAtt.set(m.attestation_id as string, (m.action_types as string[]) || []);
    }
  }

  const attestations = (attRows || []).map((a: any) => ({
    id: a.attestation_id as string,
    date: a.action_start_date as string,
    endDate: (a.action_end_date as string | null) || null,
    actions: actionTypesByAtt.get(a.attestation_id) || [],
    site: (a.site?.site_name as string) || undefined,
  }));

  // Build monthly timeline of total actions (start..end inclusive)
  function ym(d: Date) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  function* monthsBetween(start: Date, end: Date) {
    const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    while (cur <= last) {
      yield new Date(cur);
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
  }
  const monthly = new Map<string, number>();
  for (const a of attestations) {
    const start = a.date ? new Date(a.date) : null;
    const end = a.endDate ? new Date(a.endDate) : start;
    if (!start || !end) continue;
    const val = Math.max(1, (a.actions || []).length);
    for (const m of monthsBetween(start, end)) {
      const k = ym(m);
      monthly.set(k, (monthly.get(k) || 0) + val);
    }
  }
  // Ensure last 6 months are present with zero-fill
  function ymStr(d: Date) { return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; }
  const endRef = new Date();
  endRef.setUTCDate(1);
  const months6: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(endRef.getUTCFullYear(), endRef.getUTCMonth() - i, 1));
    months6.push(ymStr(d));
  }
  const timeline_monthly = months6.map((m) => ({ month: m, value: monthly.get(m) || 0 }));

  const payload = {
    profile: {
      id: profile.id,
      profile_name: profile.org_name as string | null, // spec label; maps to org_name
      description: (profile.description as string | null) || null,
      website: (profile.website as string | null) || null,
      wallet_address: profile.wallet_address as string,
      handle: profile.handle as string,
    },
    stats: {
      actions_total: Array.from(usedCounts.values()).reduce((a, b) => a + b, 0),
      sites_total: sites.length,
      species_total: species.length,
      attestations_total: attTotal.count || 0,
    },
    actions_breakdown,
    actions_category_breakdown,
    site_types_breakdown,
    sites: sitesPayload,
    species,
    attestations,
    timeline_monthly,
  };

  return NextResponse.json(payload);
}
