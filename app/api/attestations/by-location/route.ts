import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Location } from "@/types/map";

/**
 * GET /api/attestations/by-location
 *
 * Fetches all attestations for a specific location (lat/lng).
 * Returns aggregated location data for the LocationPane component.
 *
 * Query params:
 * - lat: latitude (rounded to 4 decimals)
 * - lng: longitude (rounded to 4 decimals)
 *
 * TODO - Backend Updates Needed:
 * ----------------------------------
 * 1. Add action_date field to attestations table
 * 2. Add summary/description field for attestation details
 * 3. Add contributors field (array of contributor names)
 * 4. Improve species data collection (currently empty)
 * 5. Add coral_count, depth fields for detailed metrics
 * 6. Consider adding location_name field or separate locations table
 * 7. Add donut chart data aggregation (by action type with colors)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing lat or lng parameters" },
      { status: 400 }
    );
  }

  try {
    // Query attestations near this location (tolerance of ~11m)
    // Using bounding box for performance
    const tolerance = 0.0001; // ~11 meters
    const { data: attestations, error } = await supabaseAdmin
      .from("attestations")
      .select("*")
      .gte("location_lat", lat - tolerance)
      .lte("location_lat", lat + tolerance)
      .gte("location_lng", lng - tolerance)
      .lte("location_lng", lng + tolerance)
      .eq("show_on_map", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!attestations || attestations.length === 0) {
      return NextResponse.json(
        { error: "No attestations found at this location" },
        { status: 404 }
      );
    }

    // Get profile data for org names
    const profileIds = Array.from(
      new Set(attestations.map((a) => a.profile_id).filter(Boolean))
    );

    let profiles: Record<string, { handle: string; org_name: string | null }> = {};
    if (profileIds.length) {
      const { data: profs, error: pErr } = await supabaseAdmin
        .from("profiles")
        .select("id, handle, org_name")
        .in("id", profileIds);

      if (!pErr && profs) {
        for (const p of profs) {
          profiles[p.id as string] = {
            handle: p.handle as string,
            org_name: (p.org_name as string) || null,
          };
        }
      }
    }

    // Aggregate regen_type breakdown
    const regenTypeCounts: Record<string, number> = {};
    attestations.forEach((att) => {
      const type = att.regen_type || "other";
      regenTypeCounts[type] = (regenTypeCounts[type] || 0) + 1;
    });

    // Map regen types to colors (matching design system)
    const typeColorMap: Record<string, string> = {
      transplantation: "#F034ED", // magenta-300
      nursery: "#4DCEAE",          // aquamarine-200
      other: "#9CA3AF",            // gray-400
    };

    const actionsBreakdown = Object.entries(regenTypeCounts).map(([label, count]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      count,
      color: typeColorMap[label] || "#9CA3AF",
    }));

    // Get first profile for location name (all attestations at same location)
    const firstProfile = profiles[attestations[0].profile_id];
    const locationName = firstProfile?.org_name || "Unknown Location";

    // Format attestations for the UI
    const formattedAttestations = attestations.map((att) => {
      const profile = profiles[att.profile_id];

      return {
        id: att.uid || att.id,
        uid: att.uid,
        title: profile?.org_name || "Reef Restoration Project", // TODO: Add title field to DB
        submittedAt: att.created_at,
        actionDate: att.created_at, // TODO: Add action_date field to DB
        actionTypes: [att.regen_type || "other"],
        summary: null, // TODO: Add summary field to DB
        coralCount: null, // TODO: Add coral_count field to DB
        depth: null, // TODO: Add depth field to DB
        species: att.species || [],
        contributors: [], // TODO: Add contributors field to DB
        fileName: null, // TODO: Extract from file_gateway_url
        fileUrl: att.file_gateway_url || null,
        easUid: att.uid,
        locationId: `${lat.toFixed(4)}_${lng.toFixed(4)}`,
      };
    });

    // Aggregate all species (currently empty in most cases)
    // TODO: Backend should populate species field during attestation creation
    const allSpecies = Array.from(
      new Set(
        attestations
          .flatMap((att) => att.species || [])
          .filter(Boolean)
      )
    );

    const location: Location = {
      id: `${lat.toFixed(4)}_${lng.toFixed(4)}`,
      name: locationName,
      lat,
      lng,
      attestationCount: attestations.length,
      actionsBreakdown,
      species: allSpecies,
      attestations: formattedAttestations,
    };

    return NextResponse.json({ location });
  } catch (error: any) {
    console.error("Error fetching location attestations:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
