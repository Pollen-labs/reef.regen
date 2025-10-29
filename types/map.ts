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
};

export type Location = LocationPoint & {
  actionsBreakdown: { label: string; count: number; color: string }[]; // donut
  species: string[];   // names
  attestations: Pick<Attestation, "id" | "title" | "submittedAt">[];
};

export type Attestation = {
  id: string;
  title?: string;
  submittedAt: string;  // ISO
  actionDate?: string;  // ISO
  actionTypes: string[];
  summary?: string;
  coralCount?: number;
  depth?: string;       // e.g., "5 meter"
  species: string[];
  contributors?: string[];
  fileName?: string;
  fileUrl?: string;     // IPFS gateway URL
  easUid?: string;      // on-chain UID
  locationId: string;
};
