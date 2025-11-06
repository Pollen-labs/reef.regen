"use client";
import type { Attestation } from "@/types/map";
import Tag from "@/components/ui/Tag";
import IdentifierBar from "@/components/ui/IdentifierBar";
import { classesForRegen } from "@/lib/style/regenColors";
import { formatDateShort, formatDateRangeShort } from "@/lib/format/date";

const EAS_EXPLORER_URL = process.env.NEXT_PUBLIC_EAS_EXPLORER_URL || 'https://optimism-sepolia.easscan.org';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.filebase.io';

export default function AttestationDetailModal({ attestation, onClose, overlayClassName }: {
  attestation: Attestation | null;
  onClose: () => void;
  overlayClassName?: string; // optional: customize overlay styles
}) {
  if (!attestation) return null;

  // Close on ESC for convenience
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    require('react').useEffect(() => {
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
  } catch {}
  const siteType = attestation.siteType ?? "-";
  const locStr = attestation.lat != null && attestation.lng != null ? `${attestation.lat.toFixed(5)}, ${attestation.lng.toFixed(5)}` : "-";
  const depthStr = attestation.depthM != null ? `${attestation.depthM} meter` : "-";
  const areaStr = attestation.surfaceAreaM2 != null ? `${attestation.surfaceAreaM2} meter²` : "-";
  const depthStrShort = attestation.depthM != null ? `${attestation.depthM}m` : "-";
  const areaStrShort = attestation.surfaceAreaM2 != null ? `${attestation.surfaceAreaM2} m²` : "-";
  const speciesDiversity = attestation.speciesDiversity ?? (attestation.species?.length || 0);
  const totalCorals = attestation.totalCorals ?? null;
  const fileName = attestation.fileName || (attestation.fileUrl ? decodeURIComponent(attestation.fileUrl.split('/').pop() || '') : undefined);

  // Construct IPFS URL from CID if available, otherwise use fileUrl
  // Remove trailing slash from gateway URL if present
  const gatewayBase = IPFS_GATEWAY.endsWith('/') ? IPFS_GATEWAY.slice(0, -1) : IPFS_GATEWAY;
  const fileViewUrl = attestation.fileCid
    ? `${gatewayBase}/ipfs/${attestation.fileCid}`
    : attestation.fileUrl;
  return (
    <div
      className={[
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]",
        overlayClassName || "",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-vulcan-900 text-white shadow-2xl outline outline-1 outline-vulcan-500 max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Static header with close button */}
        <div className="flex items-center justify-end p-3 bg-vulcan-900">
          <button
            aria-label="Close"
            onClick={onClose}
            className="h-10 w-10 grid place-items-center rounded-full bg-white text-black hover:opacity-90"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-7 overflow-y-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-vulcan-600 scrollbar-track-vulcan-800/50 hover:scrollbar-thumb-vulcan-500">
          {/* Header */}
          <div className="space-y-1">
            <div className="text-vulcan-200 text-base">
              Submitted on <span className="font-black">{formatDateShort(attestation.submittedAt)}</span>{attestation.orgName ? ' by' : ''}
            </div>
            {attestation.orgName && (
              <div className="text-white text-3xl font-black tracking-tight">{attestation.orgName}</div>
            )}
          </div>

          {/* Action types */}
          <div className="space-y-3">
            <div className="text-vulcan-400 text-lg">Regen actions included</div>
            <div className="flex flex-wrap gap-1">
              {attestation.actionTypes?.length ? (
                attestation.actionTypes.map((t) => {
                  const c = classesForRegen(t);
                  return <Tag key={t} label={t} bgClass={c.bg} textClass={c.text} />;
                })
              ) : (
                <span className="text-lg text-white/70">-</span>
              )}
            </div>
          </div>

          {/* Context rows — Row1: date (full width), Row2: site + type, Row3: location + depth/area */}
          {/* Row 1: Date */}
          <div className="mb-6">
            <div className="text-vulcan-400 text-lg">Actions took place on (UTC)</div>
            <div className="text-white text-xl font-black">
              {formatDateRangeShort(attestation.actionDate, attestation.actionEndDate)}
            </div>
          </div>

          {/* Row 2: Site name | Site type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="text-vulcan-400 text-lg">At site</div>
              <div className="text-white text-xl font-black">{attestation.siteName ?? '-'}</div>
            </div>
            <div>
              <div className="text-vulcan-400 text-lg">Site type</div>
              <div className="text-white text-xl font-black">{siteType}</div>
            </div>
          </div>

          {/* Row 3: Location | Depth/Surface area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="text-vulcan-400 text-lg">Location</div>
              <div className="text-white text-xl font-black">{locStr}</div>
            </div>
            <div>
              <div className="text-vulcan-400 text-lg">Depth / Surface area</div>
              <div className="text-white text-xl font-black">{depthStrShort} / {areaStrShort}</div>
            </div>
          </div>

          {/* Action summary */}
          <div className="space-y-2">
            <div className="text-vulcan-400 text-lg">Action summary</div>
            <div className="text-vulcan-100 text-xl font-bold leading-6">
              {attestation.summary || '-'}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-vulcan-400 text-lg">Total corals involved</div>
              <div className="text-white text-xl font-black">{totalCorals ?? '-'}</div>
            </div>
            <div>
              <div className="text-vulcan-400 text-lg">Species diversity</div>
              <div className="text-white text-xl font-black">{speciesDiversity}</div>
            </div>
          </div>

          {/* Species with counts */}
          <div className="space-y-2">
            <div className="text-vulcan-400 text-lg">Species include</div>
            <div className="flex flex-wrap gap-1">
              {attestation.speciesWithCount?.length ? (
                attestation.speciesWithCount.map((s) => {
                  const label = s.count != null ? `${s.count} x ${s.name}` : s.name;
                  return (
                    <Tag
                      key={`${s.name}-${s.count ?? 'n'}`}
                      label={label}
                      size="md"
                      bgClass="bg-ribbon-300"
                      textClass="text-vulcan-950"
                    />
                  );
                })
              ) : (
                <span className="text-lg text-white/70">-</span>
              )}
            </div>
          </div>

          {/* Contributors */}
          {attestation.contributors?.length ? (
            <div>
              <div className="text-vulcan-400 text-lg">With the following contributors</div>
              <div className="text-white text-xl font-black">{attestation.contributors.join(', ')}</div>
            </div>
          ) : null}

          {/* Internal ID (owner-only; provided by parent) */}
          {attestation && (attestation as any).internalId ? (
            <div>
              <div className="text-vulcan-400 text-lg">Internal ID</div>
              <div className="text-white text-xl font-black">{(attestation as any).internalId}</div>
            </div>
          ) : null}

          {/* Media */}
          {(fileName || fileViewUrl) && (
            <IdentifierBar
              label="Additional media"
              value={fileViewUrl || fileName || ''}
              actionLabel="View"
              external
              shorten
              onAction={() => { if (fileViewUrl) window.open(fileViewUrl, '_blank', 'noopener,noreferrer'); }}
              className="bg-vulcan-800 outline outline-1 outline-vulcan-700/70"
            />
          )}

          {/* EAS UID */}
          {attestation.easUid && (
            <IdentifierBar
              label="Attestation UID"
              value={attestation.easUid}
              actionLabel="View on EAS"
              external
              copyable
              shorten
              onAction={() => window.open(`${EAS_EXPLORER_URL}/attestation/view/${attestation.easUid}`, '_blank', 'noopener,noreferrer')}
              className="bg-vulcan-800 outline outline-1 outline-vulcan-700/70"
            />
          )}
        </div>
      </div>
    </div>
  );
}
