import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/attestations/:id → attestation detail (aligned to Attestation type)
export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("attestation")
    .select(
      "attestation_id, site_id, profile_id, created_at, action_start_date, action_end_date, summary, contributors, ipfs_cid, file_gateway_url, file_name, eas_attestation_uid"
    )
    .eq("attestation_id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: agg, error: aerr } = await supabaseAdmin
    .from("attestation_min_v")
    .select("action_types, species")
    .eq("attestation_id", id)
    .maybeSingle();
  if (aerr) return NextResponse.json({ error: aerr.message }, { status: 500 });

  const { data: site, error: serr } = await supabaseAdmin
    .from("site")
    .select("site_name, lon, lat, depth_m, surface_area_m2, site_type:site_type_id(name)")
    .eq("site_id", data.site_id)
    .maybeSingle();
  if (serr) return NextResponse.json({ error: serr.message }, { status: 500 });

  const { data: prof, error: perr } = await supabaseAdmin
    .from("profiles")
    .select("org_name")
    .eq("id", data.profile_id)
    .maybeSingle();
  if (perr) return NextResponse.json({ error: perr.message }, { status: 500 });

  const { data: spc, error: scerr } = await supabaseAdmin
    .from("attestation_taxa")
    .select("count, taxa:taxa_id(scientific_name)")
    .eq("attestation_id", id);
  if (scerr) return NextResponse.json({ error: scerr.message }, { status: 500 });
  const speciesWithCount = (spc || []).map((r: any) => ({ name: r.taxa?.scientific_name as string, count: r.count as number | null }));
  const totalCorals = speciesWithCount.reduce((s: number, r: any) => s + (r.count || 0), 0);
  const speciesDiversity = speciesWithCount.filter((r) => !!r.name).length || ((agg?.species as any[])?.length ?? null);

  const resolveFileName = (url?: string | null): string | undefined => {
    if (!url) return undefined;
    const noQuery = url.split('?')[0];
    const last = noQuery.split('/').filter(Boolean).pop();
    return last ? decodeURIComponent(last) : undefined;
  };

  const att = {
    id: data.attestation_id,
    title: data.summary || undefined,
    submittedAt: data.created_at as string,
    actionDate: data.action_start_date as string,
    actionEndDate: (data.action_end_date as string) ?? null,
    actionTypes: (agg?.action_types as string[]) || [],
    summary: data.summary || undefined,
    species: (agg?.species as string[]) || [],
    speciesWithCount,
    totalCorals,
    speciesDiversity,
    orgName: prof?.org_name || undefined,
    siteName: site?.site_name || undefined,
    siteType: (site as any)?.site_type?.name || undefined,
    lat: site?.lat ?? undefined,
    lng: site?.lon ?? undefined,
    depthM: site?.depth_m ?? null,
    surfaceAreaM2: site?.surface_area_m2 ?? null,
    contributors: (data.contributors as string[] | null) || undefined,
    fileCid: (data.ipfs_cid as string | null) || undefined,
    fileUrl: (data.file_gateway_url as string | null) || undefined,
    fileName: ((data as any).file_name as string | null) || resolveFileName(data.file_gateway_url as string | null),
    easUid: (data.eas_attestation_uid as string | null) || undefined,
    locationId: data.site_id as string,
  };

  return NextResponse.json({ attestation: att });
}
