import { WizardState } from "@/lib/wizard/attestationWizardStore";

export function formatActionDate(s: WizardState): string | null {
  const { dateMode = 'single', actionDate, actionStart, actionEnd } = s;
  if (dateMode === 'range') {
    if (!actionStart || !actionEnd) return null;
    return `${actionStart} ~ ${actionEnd}`;
  }
  if (!actionDate) return null;
  return actionDate;
}

export function buildEasPayload(s: WizardState) {
  const actionDate = formatActionDate(s);
  return {
    organizationName: s.organizationName || "",
    reefRegenAction: s.reefRegenActions || [],
    actionDate: actionDate || "",
    siteName: s.siteName || "",
    siteType: s.siteType || "",
    location: s.siteCoords ? [String(s.siteCoords[0]), String(s.siteCoords[1])] : ["", ""],
    siteDepthM: s.siteDepthM ?? 0,
    siteAreaSqM: s.siteAreaM2 ?? 0,
    actionSummary: s.summary || "",
    biodiversity: (s.species || []).map((x) => x.scientificName),
    contributors: s.contributors || [],
    fileName: s.fileName || "",
    ipfsCID: s.fileCid || "",
  };
}

export function buildFinalizeBody(s: WizardState, walletAddress: string) {
  const action_date = formatActionDate(s);
  const file = s.fileCid && s.fileUrl ? { cid: s.fileCid, gateway_url: s.fileUrl, name: s.fileName || undefined } : undefined;
  return {
    wallet_address: walletAddress,
    site_id: s.siteId,
    action_date,
    summary: s.summary || null,
    contributors: s.contributors || [],
    reef_regen_action_names: s.reefRegenActions || [],
    species: (s.species || []).map((x) => ({ taxon_id: x.taxonId, count: x.count ?? null })),
    file,
    internal_id: s.internalId || undefined,
  };
}

