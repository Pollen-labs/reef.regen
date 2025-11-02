"use client";
import type { Attestation, Location } from "@/types/map";
import DonutChart from "@/components/shared/DonutChart";
import { classesForRegen } from "@/lib/style/regenColors";
// Site type styled as text (no chip)

/**
 * LocationPane — Left drawer showing location details
 *
 * Appears when user clicks a map pin. Shows:
 * - Location name and coordinates
 * - Regen actions breakdown with donut chart placeholders
 * - Species diversity (or "No species recorded" placeholder)
 * - List of attestations
 *
 * Props:
 * - location: Location data or null
 * - onClose: Callback to close the pane
 * - onOpenAttestation: Callback when attestation is clicked
 */
export default function LocationPane({
  location,
  onClose: _onClose, // Reserved for future close button
  onOpenAttestation,
}: {
  location: Location | null;
  onClose: () => void;
  onOpenAttestation: (att: Attestation) => void;
}) {
  if (!location) return null;

  const totalActions = location.actionsBreakdown.reduce((s, a) => s + a.count, 0);
  const chartData = location.actionsBreakdown.map((a) => {
    const c = classesForRegen(a.label);
    return { ...a, color: c.hex };
  });
  const hasSpecies = location.species && location.species.length > 0;
  const depthStr = location.depthM != null ? `${location.depthM}m` : "-";
  const areaStr = location.surfaceAreaM2 != null ? `${location.surfaceAreaM2}m²` : "-";

  return (
    <aside
      className="absolute left-0 top-0 z-10 h-full w-96 md:w-[420px] px-4 py-3.5 bg-black/70 backdrop-blur-[3px] text-white overflow-y-auto transition-transform duration-300 ease-out scrollbar-thin scrollbar-thumb-vulcan-600 scrollbar-track-vulcan-800/50 hover:scrollbar-thumb-vulcan-500"
      role="complementary"
      aria-label={`Location details for ${location.name}`}
    >
      <div className="flex flex-col gap-2">
        {/* Header Card */}
        <section className="p-6 bg-vulcan-900 rounded-3xl flex flex-col gap-2">
          <h2 className="text-h4 font-black text-white">
            {location.name}
          </h2>
          {location.orgName && (
            <div>
              <div className="text-lg font-light text-vulcan-400">Organization</div>
              <div className="text-2xl font-bold">{location.orgName}</div>
            </div>
          )}
        </section>

        {/* Regen actions Card */}
        <section className="p-6 bg-vulcan-900 rounded-3xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="w-40">
              <div className="text-h4 font-black">
                {totalActions}
              </div>
              <div className="text-lg text-vulcan-400 font-bold">
                Regen actions
              </div>
            </div>
            {/* Donut chart */}
            <DonutChart data={chartData} size={96} strokeWidth={24} />
          </div>

          <div className="flex flex-col gap-1">
            {location.actionsBreakdown.map((a) => {
              const c = classesForRegen(a.label);
              return (
                <div key={a.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-5 w-2.5 rounded ${c.bg}`} />
                    <span className="text-lg font-light truncate">{a.label}</span>
                  </div>
                  <span className="text-lg font-bold">{a.count}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Species diversity Card */}
        <section className="p-6 bg-vulcan-900 rounded-3xl flex flex-col gap-4">
          <div>
            <div className="text-h4 font-black">
              {hasSpecies ? location.species.length : 0}
            </div>
            <div className="text-lg text-vulcan-400 font-bold">
              Species diversity
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasSpecies ? (
              location.species.map((s) => (
                <span
                  key={s}
                  className="h-8 px-3 py-1 rounded-lg bg-ribbon-300 inline-flex items-center"
                >
                  <span className="text-lg font-bold text-vulcan-900">{s}</span>
                </span>
              ))
            ) : (
              <span className="h-8 px-3 py-1 rounded-lg bg-gray-200 inline-flex items-center">
                <span className="text-lg font-bold text-vulcan-900">
                  No species recorded
                </span>
              </span>
            )}
          </div>
        </section>

        {/* Site details Card */}
        <section className="p-6 bg-vulcan-900 rounded-3xl flex flex-col gap-2">
          <h3 className="text-h5 font-black text-white">
            {location.siteType || '-'}
          </h3>
          <div className="text-lg text-vulcan-400 font-bold">Site type</div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-2xl font-black">{depthStr}</div>
              <div className="text-lg text-vulcan-400 font-bold">Depth</div>
            </div>
            <div>
              <div className="text-2xl font-black">{areaStr}</div>
              <div className="text-lg text-vulcan-400 font-bold">Surface area</div>
            </div>
          </div>
        </section>

        {/* Attestations header */}
        <section className="p-6 bg-vulcan-900 rounded-t-3xl flex flex-col gap-1">
          <div>
            <div className="text-h4 font-black">{location.attestationCount}</div>
            <div className="text-lg text-vulcan-400 font-bold">Attestations</div>
          </div>
        </section>

        {/* Attestation rows */}
        <ul className="overflow-hidden rounded-b-3xl">
          {location.attestations.map((a, idx) => {
            const isLast = idx === location.attestations.length - 1;
            return (
              <li key={a.id}>
                <button
                  onClick={() => onOpenAttestation(a as Attestation)}
                  className={`w-full px-5 py-4 flex items-center justify-between text-left bg-vulcan-900 hover:bg-vulcan-700/80 ${
                    isLast ? "rounded-b-3xl" : ""
                  }`}
                >
                  <span className="text-lg font-light text-vulcan-300">
                    {new Date(a.submittedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="h-5 w-5 grid place-items-center text-flamingo-200">
                    <i className="f7-icons text-2xl">ellipsis</i>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Decorative vertical bar at far right of pane */}
      <div
        className="absolute right-0 top-1 w-2 h-64 bg-vulcan-900 rounded-lg"
        aria-hidden
      />

      {/* Close hint for keyboard users */}
      <span className="sr-only">
        Press Escape or click outside the pane to close
      </span>
    </aside>
  );
}
