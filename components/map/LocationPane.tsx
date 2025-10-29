"use client";
import type { Attestation, Location } from "@/types/map";
import DonutChart from "./DonutChart";

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
  const hasSpecies = location.species && location.species.length > 0;

  return (
    <aside
      className="absolute left-0 top-0 z-10 h-full w-96 md:w-[420px] px-4 py-3.5 bg-vulcan-800/70 backdrop-blur-[3px] text-white overflow-y-auto transition-transform duration-300 ease-out scrollbar-thin scrollbar-thumb-vulcan-600 scrollbar-track-vulcan-800/50 hover:scrollbar-thumb-vulcan-500"
      role="complementary"
      aria-label={`Location details for ${location.name}`}
    >
      <div className="flex flex-col gap-2">
        {/* Header Card */}
        <section className="p-6 bg-vulcan-900 rounded-3xl flex flex-col gap-3">
          <div>
            <div className="text-lg font-light text-vulcan-400">
              This location is claimed by
            </div>
            <h2 className="text-[32px] leading-[36px] font-black text-white">
              {location.name}
            </h2>
          </div>
          <div>
            <div className="text-lg font-light text-vulcan-400">Coordinate</div>
            <div className="text-xl font-bold">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </div>
          </div>
        </section>

        {/* Regen actions Card */}
        <section className="p-6 bg-vulcan-900 rounded-3xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="w-40">
              <div className="text-[52px] leading-[52px] font-black">
                {totalActions}
              </div>
              <div className="text-lg text-vulcan-400 font-bold">
                Regen actions
              </div>
            </div>
            {/* Donut chart */}
            <DonutChart data={location.actionsBreakdown} size={96} strokeWidth={16} />
          </div>

          <div className="flex flex-col gap-1">
            {location.actionsBreakdown.map((a) => (
              <div key={a.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-5 w-2.5 rounded"
                    style={{ backgroundColor: a.color }}
                  />
                  <span className="text-lg font-light truncate">{a.label}</span>
                </div>
                <span className="text-lg font-bold">{a.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Species diversity Card */}
        <section className="p-6 bg-vulcan-900 rounded-3xl flex flex-col gap-4">
          <div>
            <div className="text-[52px] leading-[52px] font-black">
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

        {/* Attestations header */}
        <section className="p-6 bg-vulcan-900 rounded-t-3xl flex flex-col gap-4">
          <div>
            <div className="text-[52px] leading-[52px] font-black">
              {location.attestations.length}
            </div>
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
                  <span className="h-5 w-5 relative">
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block h-[3.35px] w-4 bg-flamingo-200" />
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
