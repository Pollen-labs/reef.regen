import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type SpeciesRow = { taxon_id: string | number; count?: number | null };

type Body = {
  profile_id?: string;
  wallet_address?: string;
  site_id?: string;
  action_date?: string; // YYYY-MM-DD or "YYYY-MM-DD ~ YYYY-MM-DD"
  summary?: string | null;
  contributors?: string[];
  reef_regen_action_names?: string[];
  species?: SpeciesRow[];
  file?: { cid: string; gateway_url: string; name?: string };
  eas_uid?: string; // required
  internal_id?: string | null;
};

function parseActionDate(input?: string | null): { start: string; end: string | null } | null {
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
  const eas = (body.eas_uid || "").trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(eas)) return NextResponse.json({ error: "Invalid eas_uid" }, { status: 400 });

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

  const siteId = (body.site_id || "").trim();
  if (!siteId) return NextResponse.json({ error: "site_id is required" }, { status: 400 });

  const dates = parseActionDate(body.action_date);
  if (!dates) return NextResponse.json({ error: "action_date must be YYYY-MM-DD or 'YYYY-MM-DD ~ YYYY-MM-DD'" }, { status: 400 });

  const contributors = Array.isArray(body.contributors) ? body.contributors : [];
  const file_cid = body.file?.cid ?? null;
  const file_gateway_url = body.file?.gateway_url ?? null;
  const file_name = body.file?.name ?? null;

  // Insert attestation
  const insert = {
    profile_id: profileId,
    site_id: siteId,
    action_start_date: dates.start,
    action_end_date: dates.end,
    summary: body.summary ?? null,
    contributors,
    ipfs_cid: file_cid,
    file_gateway_url,
    file_name,
    eas_attestation_uid: eas,
    show_on_map: true,
    internal_identifier: (body.internal_id || null) as string | null,
  } as const;

  const { data: inserted, error } = await supabaseAdmin
    .from("attestation")
    .insert(insert)
    .select("attestation_id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const attestationId = inserted.attestation_id as string;

  // 1) Attach regen actions by name → ids
  const actionNames = Array.from(new Set((body.reef_regen_action_names || []).map((s) => String(s).trim()).filter(Boolean)));
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

  // 2) Attach taxa with counts, using provided taxon_id
  const speciesRows = Array.isArray(body.species) ? body.species : [];
  if (speciesRows.length) {
    // Normalize and limit to 200
    const rows = speciesRows.slice(0, 200).map((r) => ({
      attestation_id: attestationId,
      taxa_id: Number(r.taxon_id),
      count: r.count == null ? null : Number(r.count),
    }));
    const { error: sErr } = await supabaseAdmin.from("attestation_taxa").insert(rows);
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, attestationId }, { status: 201 });
}
