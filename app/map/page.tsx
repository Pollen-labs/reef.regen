"use client";

import { useState, useEffect } from "react";
import MapView from "@/components/map/MapView";
import LocationPane from "@/components/map/LocationPane";
import type { LocationPoint, Location, Attestation } from "@/types/map";

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

  // Fetch location details when a pin is selected
  useEffect(() => {
    if (!activeLocationId) {
      setSelectedLocation(null);
      setLocationLoading(false);
      return;
    }

    // Find the point data for this location
    const point = points.find((p) => p.id === activeLocationId);
    if (!point) {
      setSelectedLocation(null);
      setLocationLoading(false);
      return;
    }

    // Set loading state and fetch
    setLocationLoading(true);

    const pointLat = point.lat;
    const pointLng = point.lng;

    async function fetchLocationDetails() {
      try {
        const res = await fetch(
          `/api/attestations/by-location?lat=${pointLat}&lng=${pointLng}`
        );
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

  const handleOpenAttestation = (attestation: Attestation) => {
    // TODO: Phase 3B - Open AttestationDetailModal
    console.log("Open attestation:", attestation);
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

      {/* AttestationDetailModal will be added in Phase 3B */}
    </div>
  );
}
