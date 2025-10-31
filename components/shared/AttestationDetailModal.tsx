"use client";
import type { Attestation } from "@/types/map";

const EAS_EXPLORER_URL = process.env.NEXT_PUBLIC_EAS_EXPLORER_URL || 'https://optimism-sepolia.easscan.org';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.filebase.io';

export default function AttestationDetailModal({ attestation, onClose }: {
  attestation: Attestation | null;
  onClose: () => void;
}) {
  if (!attestation) return null;
  const siteType = attestation.siteType ?? "-";
  const locStr = attestation.lat != null && attestation.lng != null ? `${attestation.lat.toFixed(5)}, ${attestation.lng.toFixed(5)}` : "-";
  const depthStr = attestation.depthM != null ? `${attestation.depthM} meter` : "-";
  const areaStr = attestation.surfaceAreaM2 != null ? `${attestation.surfaceAreaM2} meter²` : "-";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-3xl rounded-3xl bg-vulcan-900 text-white shadow-2xl outline outline-1 outline-vulcan-500 max-h-[85vh] flex flex-col overflow-hidden">
        <button aria-label="Close" onClick={onClose} className="absolute right-3 top-3 rounded-xl px-3 py-2 hover:bg-white/10">✕</button>
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-vulcan-600 scrollbar-track-vulcan-800/50 hover:scrollbar-thumb-vulcan-500">
          {/* Header */}
          <div className="space-y-1">
            <div className="text-vulcan-100 text-lg">
              Submitted on <span className="font-bold">{new Date(attestation.submittedAt).toLocaleDateString()}</span>{attestation.orgName ? ' by' : ''}
            </div>
            {attestation.orgName && (
              <div className="text-white text-3xl font-black tracking-tight">{attestation.orgName}</div>
            )}
          </div>

          {/* Action types */}
          <div className="space-y-2">
            <div className="text-vulcan-400 text-lg">Regen actions included</div>
            <div className="flex flex-wrap gap-2">
              {attestation.actionTypes?.length ? attestation.actionTypes.map((t) => (
                <span key={t} className="h-8 px-3 py-1 bg-flamingo-300 rounded-lg inline-flex items-center">
                  <span className="text-vulcan-900 text-lg font-bold leading-6">{t}</span>
                </span>
              )) : <span className="text-lg text-white/70">-</span>}
            </div>
          </div>

          {/* Site and date rows */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-vulcan-400 text-lg">At site</div>
              <div className="text-vulcan-100 text-lg font-bold">{attestation.siteName ?? '-'}</div>
            </div>
            <div>
              <div className="text-vulcan-400 text-lg">Actions took place on</div>
              <div className="text-vulcan-100 text-lg font-bold">
                {attestation.actionDate ? new Date(attestation.actionDate).toLocaleDateString() : '-'}
                {attestation.actionEndDate ? ` ~ ${new Date(attestation.actionEndDate).toLocaleDateString()}` : ''}
              </div>
            </div>
          </div>

          {/* Site type and location */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-vulcan-400 text-lg">Site type</div>
              <div className="text-vulcan-100 text-lg font-bold">{siteType}</div>
            </div>
            <div>
              <div className="text-vulcan-400 text-lg">Location</div>
              <div className="text-vulcan-100 text-lg font-bold">{locStr}</div>
            </div>
          </div>

          {/* Depth and surface area */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-vulcan-400 text-lg">Depth</div>
              <div className="text-white text-lg font-bold">{depthStr}</div>
            </div>
            <div>
              <div className="text-vulcan-400 text-lg">Surface area</div>
              <div className="text-white text-lg font-bold">{areaStr}</div>
            </div>
          </div>

          {/* Action summary */}
          <div className="space-y-2">
            <div className="text-vulcan-400 text-lg">Action summary</div>
            <div className="text-vulcan-100 text-lg font-bold leading-6">
              {attestation.summary || '-'}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-vulcan-400 text-lg">Total corals involved</div>
              <div className="text-white text-lg font-bold">{totalCorals ?? '-'}</div>
            </div>
            <div>
              <div className="text-vulcan-400 text-lg">Species diversity</div>
              <div className="text-white text-lg font-bold">{speciesDiversity}</div>
            </div>
          </div>

          {/* Species with counts */}
          <div className="space-y-2">
            <div className="text-vulcan-400 text-lg">Species include</div>
            <div className="flex flex-wrap gap-2">
              {attestation.speciesWithCount?.length ? (
                attestation.speciesWithCount.map((s) => (
                  <span key={`${s.name}-${s.count ?? 'n'}`} className="h-8 px-3 py-1 bg-ribbon-300 rounded-lg inline-flex items-center gap-2">
                    <span className="text-vulcan-900 text-lg font-bold leading-6">{s.name}</span>
                    {s.count != null && <span className="text-vulcan-900 text-lg font-bold leading-6">{s.count}</span>}
                  </span>
                ))
              ) : (
                <span className="text-lg text-white/70">-</span>
              )}
            </div>
          </div>

          {/* Contributors */}
          {attestation.contributors?.length ? (
            <div>
              <div className="text-vulcan-400 text-lg">With the following contributors</div>
              <div className="text-white text-lg font-bold">{attestation.contributors.join(', ')}</div>
            </div>
          ) : null}

          {/* Media */}
          {(fileName || fileViewUrl) && (
            <div className="px-6 py-4 bg-vulcan-800 rounded-3xl">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-vulcan-400 text-base">Additional media</div>
                  <div className="text-vulcan-200 text-base font-bold">{fileName ?? fileViewUrl}</div>
                </div>
                {fileViewUrl && (
                  <a className="text-flamingo-200 text-base font-bold" href={fileViewUrl} target="_blank" rel="noopener noreferrer">View</a>
                )}
              </div>
            </div>
          )}

          {/* EAS UID */}
          {attestation.easUid && (
            <div className="px-6 py-4 bg-vulcan-800 rounded-3xl">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-vulcan-400 text-base">Attestation UID</div>
                  <div className="text-vulcan-200 text-base font-bold break-all">{attestation.easUid}</div>
                </div>
                <a className="text-flamingo-200 text-base font-bold" href={`${EAS_EXPLORER_URL}/attestation/view/${attestation.easUid}`} target="_blank" rel="noopener noreferrer">View on EAS</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
