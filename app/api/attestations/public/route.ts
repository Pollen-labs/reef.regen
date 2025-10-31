import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Returns one feature per Site from the v0.4 view `site_points_v`
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("site_points_v")
    .select("site_id, site_name, lat, lon, attestation_count")
    .limit(5000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const features = (data || []).map((r) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [r.lon, r.lat] },
    properties: {
      uid: r.site_id, // used by frontend as id
      orgName: r.site_name,
      count: r.attestation_count,
    },
  }));

  return NextResponse.json({ type: "FeatureCollection", features });
}
