"use client";

import { useState } from "react";
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

  // Mock data - will be replaced with real API calls
  const mockPoints: LocationPoint[] = [
    {
      id: "loc1",
      name: "Bali Reef Restoration",
      lat: -8.4095,
      lng: 115.1889,
      attestationCount: 4,
    },
    {
      id: "loc2",
      name: "Great Barrier Reef Project",
      lat: -18.2871,
      lng: 147.6992,
      attestationCount: 12,
    },
    {
      id: "loc3",
      name: "Caribbean Coral Gardens",
      lat: 18.2208,
      lng: -66.5901,
      attestationCount: 7,
    },
  ];

  return (
    <div className="absolute inset-0">
      <MapView
        points={mockPoints}
        activeId={activeLocationId || undefined}
        onSelect={(id) => setActiveLocationId(id)}
        onDeselect={() => setActiveLocationId(null)}
      />
      {/* LocationPane will be added in Phase 3A */}
      {/* AttestationDetailModal will be added in Phase 3B */}
    </div>
  );
}
