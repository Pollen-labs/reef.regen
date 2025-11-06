"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SpeciesEntry = {
  taxonId: string;
  scientificName: string;
  count?: number | null;
};

export type WizardState = {
  organizationName: string;
  reefRegenActions: string[];
  // Step 2 dates
  dateMode?: 'single' | 'range';
  actionDate?: string;        // YYYY-MM-DD (single)
  actionStart?: string;       // range start
  actionEnd?: string;         // range end
  // Step 2 site (denormalized for display + submit)
  siteId?: string; siteName?: string; siteType?: string;
  siteDepthM?: number; siteAreaM2?: number;
  siteCoords?: [number, number]; // [lon, lat]
  biodiversity: string[]; speciesCsv?: string;
  summary?: string; contributorsCsv?: string;
  fileCid?: string; fileUrl?: string; fileName?: string;
  fileSize?: number | null; fileType?: string | null;
  // Volatile (not persisted):
  fileBlob?: File | null;
  // Step 4 species
  species?: SpeciesEntry[];
  // Step 5 contributors
  contributors?: string[];
  contributorsInput?: string;
  // Review / submit
  internalId?: string;
  submitting?: boolean;
  submitPhase?: 'idle' | 'upload' | 'sign' | 'relay' | 'done' | 'failed';
  submitError?: string | null;

  // EAS
  schemaUid?: string; recipient?: string; deadline?: number;

  // meta
  currentStep: number; totalSteps: number; version: number;
  lastSavedAt?: number;
};

type WizardActions = {
  setPatch: (patch: Partial<WizardState>) => void;
  reset: () => void;
  resetAndPurge: () => void;
};

const STORAGE_KEY = "reefregen.attestation.wizard.v1";

export const WizardDefaults: WizardState = {
  organizationName: "",
  reefRegenActions: [],
  biodiversity: [],
  currentStep: 1,
  totalSteps: 5,
  version: 1,
  species: [],
  contributors: [],
  submitting: false,
  submitPhase: 'idle',
  submitError: null,
};

export const useAttestationWizard = create<WizardState & WizardActions>()(
  persist(
    (set, get) => ({
      ...WizardDefaults,
      setPatch: (patch: Partial<WizardState>) => set({ ...patch, lastSavedAt: Date.now() }),
      reset: () => set({ ...WizardDefaults, lastSavedAt: Date.now() }),
      // Clear state and also remove the persisted key to avoid stale re-hydration across routes
      resetAndPurge: () => {
        set({ ...WizardDefaults, lastSavedAt: Date.now() });
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Never persist the File object; keep only metadata
      partialize: (s) => {
        const { fileBlob, ...rest } = s as WizardState;
        return rest as any;
      },
    }
  )
);

export function hasUnsavedWork(snapshot?: WizardState) {
  const s = snapshot ?? useAttestationWizard.getState() ?? WizardDefaults;
  if (s.currentStep > 1) return true;
  if (s.reefRegenActions.length > 0) return true;
  if (s.organizationName.trim().length > 0) return true;
  if ((s.summary || "").trim().length > 0) return true;
  if ((s.actionDate || s.actionStart || s.actionEnd)) return true;
  if (s.siteId || s.siteName || s.siteType) return true;
  if ((s.siteDepthM || 0) > 0 || (s.siteAreaM2 || 0) > 0) return true;
  if (s.species && s.species.length > 0) return true;
  if (s.contributors && s.contributors.length > 0) return true;
  if ((s.fileCid || s.fileUrl || s.fileName)) return true;
  return false;
}

// Backwards-compat no-op provider
export function AttestationWizardProvider({ children }: { children: React.ReactNode }) {
  return children as any;
}
