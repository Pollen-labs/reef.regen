/**
 * Client-side Type Contracts for Map Sprint
 *
 * These TypeScript shapes define the UI boundary between components and data.
 * They allow us to build/stub components now and swap in real data later
 * without changing component code.
 */

export type LocationPoint = {
  id: string;               // location_id
  name: string;             // org/location display
  lat: number;
  lng: number;
  attestationCount: number; // for marker badge (optional)
  siteType?: string | null;
  colorHex?: string;        // site-type color for pin
};

export type Location = LocationPoint & {
  actionsBreakdown: { label: string; count: number; color: string }[]; // donut
  species: string[];   // names
  attestations: Pick<Attestation, "id" | "title" | "submittedAt">[];
  orgName?: string;
  siteType?: string;
  depthM?: number | null;
  surfaceAreaM2?: number | null;
};

export type Attestation = {
  id: string;
  title?: string;
  submittedAt: string;  // ISO
  actionDate?: string;  // ISO
  actionEndDate?: string | null;
  actionTypes: string[];
  summary?: string;
  coralCount?: number;
  depth?: string;       // e.g., "5 meter"
  species: string[];
  // Extended detail fields for modal
  speciesWithCount?: { name: string; count: number | null }[];
  totalCorals?: number | null;
  speciesDiversity?: number | null;
  orgName?: string;
  siteName?: string;
  siteType?: string;
  lat?: number;
  lng?: number;
  depthM?: number | null;
  surfaceAreaM2?: number | null;
  contributors?: string[];
  fileName?: string;
  fileCid?: string;     // IPFS CID from database
  fileUrl?: string;     // IPFS gateway URL (deprecated, prefer constructing from fileCid)
  easUid?: string;      // on-chain UID
  locationId: string;
};
