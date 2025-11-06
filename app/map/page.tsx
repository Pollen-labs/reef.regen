"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import MapView from "@/components/map/MapView";
import LocationPane from "@/components/map/LocationPane";
import type { LocationPoint, Location, Attestation } from "@/types/map";
import AttestationDetailModal from "@/components/shared/AttestationDetailModal";
import { classesForSiteType } from "@/lib/style/siteTypeColors";

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
  const [attLimit, setAttLimit] = useState<number>(20);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Derived helpers for reading/updating query params
  const currentSiteFromUrl = searchParams?.get("site") || null;
  const currentAttFromUrl = searchParams?.get("att") || null;

  // Keep selection in sync with `?site=` shareable URL param
  useEffect(() => {
    if (currentSiteFromUrl !== (activeLocationId || null)) {
      setActiveLocationId(currentSiteFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSiteFromUrl]);

  // Open attestation modal from URL (?att=uid). Also sync location pane.
  useEffect(() => {
    const attId = currentAttFromUrl;
    if (!attId) return;
    if (activeAtt?.id === attId) return;

    (async () => {
      try {
        const res = await fetch(`/api/attestations/${attId}`);
        const data = await res.json();
        if (data?.attestation) {
          const att: Attestation = data.attestation as Attestation;
          setActiveAtt(att);
          // Ensure the LocationPane is showing the attestation's site
          if (att.locationId && att.locationId !== activeLocationId) {
            setActiveLocationId(att.locationId);
            try {
              const next = new URLSearchParams(searchParams?.toString() || "");
              next.set("site", att.locationId);
              next.set("att", att.id);
              router.replace(`${pathname}?${next.toString()}`);
            } catch {}
          }
        }
      } catch (e) {
        // noop — leave modal closed on error
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAttFromUrl]);

  // Reset limit whenever a new location is activated
  useEffect(() => {
    if (activeLocationId) setAttLimit(20);
  }, [activeLocationId]);

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
              name: feature.properties.siteName || feature.properties.orgName || "Unknown Site",
              orgName: feature.properties.orgName || null,
              lat,
              lng,
              attestationCount: feature.properties.count ?? 0,
              siteType: feature.properties.siteType || null,
              colorHex: feature.properties.colorHex || undefined,
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
        const res = await fetch(`/api/sites/${activeLocationId}?recent=${attLimit}`);
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
  }, [activeLocationId, attLimit]); // refetch when limit grows

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
    setAttLimit(20);

    // Remove `site` from URL for clean state
    try {
      const next = new URLSearchParams(searchParams?.toString() || "");
      next.delete("site");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    } catch {}
  };

  const handleLoadMoreAttestations = () => {
    if (!selectedLocation) return;
    if (selectedLocation.attestations.length >= (selectedLocation.attestationCount || 0)) return;
    setAttLimit((n) => Math.min(n + 20, 200));
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

    // Update URL (?att=) and include ?site= if known for shareability
    try {
      const next = new URLSearchParams(searchParams?.toString() || "");
      next.set("att", attestation.id);
      const siteId = activeLocationId || (attestation as any).locationId;
      if (siteId) next.set("site", siteId);
      router.replace(`${pathname}?${next.toString()}`);
    } catch {}
  };

  const handleCloseAttestationModal = () => {
    setActiveAtt(null);
    // Remove att from URL
    try {
      const next = new URLSearchParams(searchParams?.toString() || "");
      next.delete("att");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    } catch {}
  };

  return (
    <div
      className="absolute left-0 right-0 bottom-0"
      style={{ top: 'var(--topnav-height, 96px)' }}
    >
      <MapView
        points={points}
        activeId={activeLocationId || undefined}
        onSelect={(id) => {
          setActiveLocationId(id);
          // Update URL for shareable deep link to this site
          try {
            const next = new URLSearchParams(searchParams?.toString() || "");
            next.set("site", id);
            router.replace(`${pathname}?${next.toString()}`);
          } catch {}
        }}
        onDeselect={handleClosePane}
      />

      {/* LocationPane - with slide animation */}
      {locationLoading && (
        <aside className="absolute z-30 text-white overflow-y-auto animate-slide-in-left scrollbar-thin
                            left-0 right-0 bottom-0 top-auto h-[60svh] w-full px-4 py-3.5 bg-black/70 backdrop-blur-[8px] rounded-t-3xl
                            md:left-0 md:top-0 md:bottom-auto md:right-auto md:h-full md:w-[420px] md:rounded-none">
          <div className="md:hidden w-full grid place-items-center mb-2">
            <div className="h-1.5 w-12 rounded-full bg-white/20" aria-hidden />
          </div>
          <div className="flex flex-col gap-2">
            {/* Header Skeleton */}
            <section className="p-6 bg-vulcan-900 rounded-3xl animate-pulse">
              <div className="h-10 w-3/4 bg-vulcan-700/60 rounded" />
              <div className="mt-3 h-4 w-1/3 bg-vulcan-700/50 rounded" />
              <div className="mt-1 h-6 w-1/2 bg-vulcan-700/60 rounded" />
            </section>
            {/* Regen Skeleton */}
            <section className="p-6 bg-vulcan-900 rounded-3xl animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 bg-vulcan-700/60 rounded" />
                <div className="h-24 w-24 bg-vulcan-700/50 rounded-full" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 w-full bg-vulcan-700/40 rounded" />
                <div className="h-4 w-5/6 bg-vulcan-700/40 rounded" />
                <div className="h-4 w-4/6 bg-vulcan-700/40 rounded" />
              </div>
            </section>
            {/* Species Skeleton */}
            <section className="p-6 bg-vulcan-900 rounded-3xl animate-pulse">
              <div className="h-6 w-24 bg-vulcan-700/50 rounded" />
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-8 w-24 bg-vulcan-700/40 rounded-lg" />
                ))}
              </div>
            </section>
            {/* Attestations Skeleton */}
            <section className="bg-vulcan-900 rounded-3xl overflow-hidden animate-pulse">
              <div className="p-6">
                <div className="h-8 w-12 bg-vulcan-700/60 rounded" />
                <div className="mt-2 h-4 w-32 bg-vulcan-700/40 rounded" />
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-t border-vulcan-700/60">
                  <div className="h-12 w-full bg-vulcan-800/60" />
                </div>
              ))}
            </section>
          </div>
        </aside>
      )}
      {!locationLoading && selectedLocation && (
        <LocationPane
          location={selectedLocation}
          onClose={handleClosePane}
          onOpenAttestation={handleOpenAttestation}
          onLoadMore={handleLoadMoreAttestations}
        />
      )}

      <AttestationDetailModal attestation={activeAtt} onClose={handleCloseAttestationModal} />
    </div>
  );
}
