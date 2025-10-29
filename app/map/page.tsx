"use client";

import { useState, useEffect } from "react";
import MapView from "@/components/map/MapView";
import type { LocationPoint } from "@/types/map";

/**
 * Map Page — Full-screen interactive map experience
 *
 * Shows all reef restoration locations with interactive pins.
 * Click a pin to view location details in LocationPane (Phase 3A).
 */
export default function MapPage() {
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real attestation data from API
    async function fetchAttestations() {
      try {
        const res = await fetch("/api/attestations/public");
        const geojson = await res.json();

        if (geojson?.features) {
          // Convert GeoJSON features to LocationPoint[]
          // Group by location (lat/lng) and count attestations per location
          const locationMap = new Map<string, LocationPoint>();

          geojson.features.forEach((feature: any) => {
            const [lng, lat] = feature.geometry.coordinates;
            const locationKey = `${lat.toFixed(4)},${lng.toFixed(4)}`; // Group nearby points

            const existing = locationMap.get(locationKey);
            if (existing) {
              // Increment count for this location
              existing.attestationCount++;
            } else {
              // Create new location point
              locationMap.set(locationKey, {
                id: feature.properties.uid || locationKey,
                name: feature.properties.orgName || "Unknown Location",
                lat,
                lng,
                attestationCount: 1,
              });
            }
          });

          setPoints(Array.from(locationMap.values()));
        }
      } catch (error) {
        console.error("Failed to fetch attestations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAttestations();
  }, []);

  if (loading) {
    return (
      <div className="absolute inset-0 bg-vulcan-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <MapView
        points={points}
        activeId={activeLocationId || undefined}
        onSelect={(id) => setActiveLocationId(id)}
        onDeselect={() => setActiveLocationId(null)}
      />
      {/* LocationPane will be added in Phase 3A */}
      {/* AttestationDetailModal will be added in Phase 3B */}
    </div>
  );
}
