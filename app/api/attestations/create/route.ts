import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Body = {
  profile_id?: string;
  wallet_address?: string; // optional lookup
  site_id?: string; // preferred for v0.4
  // legacy fallbacks (if site_id not provided)
  location_lat?: number;
  location_lng?: number;
  // shared fields
  action_date: string; // YYYY-MM-DD or "YYYY-MM-DD ~ YYYY-MM-DD"
  summary?: string | null;
  contributor_name?: string[]; // names/handles
  file_cid?: string | null;
  file_gateway_url?: string | null;
  file_name?: string | null;
  show_on_map?: boolean;
  // joins
  reef_regen_action_names?: string[]; // matches regen_type.name
  species_names?: string[]; // matches taxa.scientific_name
};

function parseActionDate(input: string): { start: string; end: string | null } | null {
  const s = (input || "").trim();
  if (!s) return null;
  if (s.includes("~")) {
    const [a, b] = s.split("~").map((x) => x.trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return null;
    return { start: a, end: b };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return { start: s, end: null };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // resolve profile_id
  let profileId = body.profile_id || "";
  if (!profileId && body.wallet_address) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .filter("wallet_address", "ilike", body.wallet_address)
      .maybeSingle();
    if (error && error.code !== "PGRST116") return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.id) return NextResponse.json({ error: "Profile not found for wallet" }, { status: 400 });
    profileId = data.id;
  }
  if (!profileId) return NextResponse.json({ error: "profile_id is required" }, { status: 400 });

  // resolve site_id
  let siteId = body.site_id || "";
  if (!siteId && body.location_lat != null && body.location_lng != null) {
    // Try match an existing site for this profile by exact lon/lat
    const { data: site, error: sErr } = await supabaseAdmin
      .from("site")
      .select("site_id")
      .eq("profile_id", profileId)
      .eq("lat", body.location_lat)
      .eq("lon", body.location_lng)
      .maybeSingle();
    if (sErr && sErr.code !== "PGRST116") return NextResponse.json({ error: sErr.message }, { status: 500 });
    if (site?.site_id) siteId = site.site_id as string;
  }
  if (!siteId) return NextResponse.json({ error: "site_id is required (select a Site)" }, { status: 400 });

  // parse dates
  const dates = parseActionDate(body.action_date);
  if (!dates) return NextResponse.json({ error: "action_date must be YYYY-MM-DD or 'YYYY-MM-DD ~ YYYY-MM-DD'" }, { status: 400 });

  const contributors = body.contributor_name ?? [];
  const ipfs_cid = body.file_cid ?? null;
  const file_gateway_url = body.file_gateway_url ?? null;
  const file_name = body.file_name ?? null;
  const show_on_map = body.show_on_map ?? true;

  const insert = {
    profile_id: profileId,
    site_id: siteId,
    action_start_date: dates.start,
    action_end_date: dates.end,
    summary: body.summary ?? null,
    contributors,
    ipfs_cid,
    file_gateway_url,
    file_name,
    show_on_map,
  } as const;

  const { data: inserted, error } = await supabaseAdmin
    .from("attestation")
    .insert(insert)
    .select("attestation_id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const attestationId = inserted.attestation_id as string;

  // 1) Attach regen actions by name → ids
  const actionNames = Array.from(new Set((body.reef_regen_action_names || []).map((s) => s.trim()).filter(Boolean)));
  if (actionNames.length) {
    const { data: types, error: terr } = await supabaseAdmin
      .from("regen_type")
      .select("regen_type_id, name")
      .in("name", actionNames);
    if (terr) return NextResponse.json({ error: terr.message }, { status: 500 });
    const ids = Array.from(new Set((types || []).map((r: any) => r.regen_type_id as number)));
    if (ids.length) {
      const rows = ids.map((id) => ({ attestation_id: attestationId, regen_type_id: id }));
      const { error: insErr } = await supabaseAdmin.from("attestation_regen_type").insert(rows);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  // 2) Attach taxa by scientific_name → ids
  const speciesNames = Array.from(new Set((body.species_names || []).map((s) => s.trim()).filter(Boolean)));
  if (speciesNames.length) {
    const { data: taxa, error: taxErr } = await supabaseAdmin
      .from("taxa")
      .select("taxa_id, scientific_name")
      .in("scientific_name", speciesNames);
    if (taxErr) return NextResponse.json({ error: taxErr.message }, { status: 500 });
    const ids = Array.from(new Set((taxa || []).map((r: any) => r.taxa_id as number)));
    if (ids.length) {
      const rows = ids.map((id) => ({ attestation_id: attestationId, taxa_id: id, count: null as number | null }));
      const { error: insErr2 } = await supabaseAdmin.from("attestation_taxa").insert(rows);
      if (insErr2) return NextResponse.json({ error: insErr2.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, attestationId });
}
