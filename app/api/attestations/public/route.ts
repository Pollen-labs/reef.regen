import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { classesForSiteType } from "@/lib/style/siteTypeColors";

// Returns one feature per Site from the v0.4 view `site_points_v`
export async function GET() {
  // Prefer selecting site type name if available in the view; fallback otherwise
  let data: any[] | null = null;
  let error: any = null;
  try {
    const res = await supabaseAdmin
      .from("site_points_v")
      .select("site_id, site_name, lat, lon, attestation_count, site_type_name")
      .limit(5000);
    data = res.data as any[];
    error = res.error as any;
    if (error) throw error;
  } catch (_e) {
    const res2 = await supabaseAdmin
      .from("site_points_v")
      .select("site_id, site_name, lat, lon, attestation_count")
      .limit(5000);
    data = res2.data as any[];
    error = res2.error as any;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const features = (data || []).map((r: any) => {
    const siteType: string | null = (r.site_type_name ?? null) as any;
    const colorHex = siteType ? classesForSiteType(siteType).hex : undefined;
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.lon, r.lat] },
      properties: {
        uid: r.site_id, // used by frontend as id
        orgName: r.site_name,
        count: r.attestation_count,
        siteType,
        colorHex,
      },
    } as const;
  });

  return NextResponse.json({ type: "FeatureCollection", features });
}
