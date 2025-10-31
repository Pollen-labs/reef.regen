"use client";

import { useState, useEffect } from "react";
import MapView from "@/components/map/MapView";
import LocationPane from "@/components/map/LocationPane";
import type { LocationPoint, Location, Attestation } from "@/types/map";
import AttestationDetailModal from "@/components/shared/AttestationDetailModal";

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
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeAtt, setActiveAtt] = useState<Attestation | null>(null);

  useEffect(() => {
    // Fetch sites from backend view (one feature per site)
    async function fetchSites() {
      try {
        const res = await fetch("/api/attestations/public");
        const geojson = await res.json();

        if (geojson?.features) {
          const pts: LocationPoint[] = geojson.features.map((feature: any) => {
            const [lng, lat] = feature.geometry.coordinates;
            return {
              id: feature.properties.uid, // site_id
              name: feature.properties.orgName || "Unknown Site",
              lat,
              lng,
              attestationCount: feature.properties.count ?? 0,
            } as LocationPoint;
          });
          setPoints(pts);
        }
      } catch (error) {
        console.error("Failed to fetch sites for map:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSites();
  }, []);

  // Fetch location details when a pin is selected
  useEffect(() => {
    if (!activeLocationId) {
      setSelectedLocation(null);
      setLocationLoading(false);
      return;
    }

    // Fetch site detail by site_id
    setLocationLoading(true);
    async function fetchLocationDetails() {
      try {
        const res = await fetch(`/api/sites/${activeLocationId}`);
        const data = await res.json();

        if (data.location) {
          setSelectedLocation(data.location);
        } else {
          setSelectedLocation(null);
        }
      } catch (error) {
        console.error("Failed to fetch location details:", error);
        setSelectedLocation(null);
      } finally {
        setLocationLoading(false);
      }
    }

    fetchLocationDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLocationId]); // Only depend on activeLocationId, not points

  if (loading) {
    return (
      <div className="absolute inset-0 bg-vulcan-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading map...</div>
      </div>
    );
  }

  const handleClosePane = () => {
    setActiveLocationId(null);
    setSelectedLocation(null);
  };

  const handleOpenAttestation = async (attestation: Attestation) => {
    try {
      const res = await fetch(`/api/attestations/${attestation.id}`);
      const data = await res.json();
      if (data.attestation) setActiveAtt(data.attestation as Attestation);
      else setActiveAtt(attestation); // fallback to list item
    } catch (e) {
      setActiveAtt(attestation);
    }
  };

  return (
    <div className="absolute inset-0">
      <MapView
        points={points}
        activeId={activeLocationId || undefined}
        onSelect={(id) => setActiveLocationId(id)}
        onDeselect={handleClosePane}
      />

      {/* LocationPane - with slide animation */}
      {locationLoading && (
        <aside className="absolute left-0 top-0 z-10 h-full w-96 md:w-[420px] px-4 py-3.5 bg-vulcan-800/70 backdrop-blur-[3px] text-white overflow-y-auto animate-slide-in-left">
          <div className="flex items-center justify-center h-full">
            <div className="text-xl">Loading location...</div>
          </div>
        </aside>
      )}
      {!locationLoading && selectedLocation && (
        <LocationPane
          location={selectedLocation}
          onClose={handleClosePane}
          onOpenAttestation={handleOpenAttestation}
        />
      )}

      <AttestationDetailModal attestation={activeAtt} onClose={() => setActiveAtt(null)} />
    </div>
  );
}
