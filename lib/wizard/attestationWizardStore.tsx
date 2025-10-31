"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

  // EAS
  schemaUid?: string; recipient?: string; deadline?: number;

  // meta
  currentStep: number; totalSteps: number; version: number;
  lastSavedAt?: number;
};

type WizardActions = {
  setPatch: (patch: Partial<WizardState>) => void;
  reset: () => void;
};

const STORAGE_KEY = "reefregen.attestation.wizard.v1";

export const WizardDefaults: WizardState = {
  organizationName: "",
  reefRegenActions: [],
  biodiversity: [],
  currentStep: 1,
  totalSteps: 5,
  version: 1,
};

export const useAttestationWizard = create<WizardState & WizardActions>()(
  persist(
    (set, get) => ({
      ...WizardDefaults,
      setPatch: (patch: Partial<WizardState>) => set({ ...patch, lastSavedAt: Date.now() }),
      reset: () => set({ ...WizardDefaults, lastSavedAt: Date.now() }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => s,
    }
  )
);

export function hasUnsavedWork(snapshot?: WizardState) {
  const s = snapshot ?? useAttestationWizard.getState() ?? WizardDefaults;
  if (s.currentStep > 1) return true;
  if (s.reefRegenActions.length > 0) return true;
  if (s.organizationName.trim().length > 0) return true;
  if ((s.summary || "").trim().length > 0) return true;
  return false;
}

// Backwards-compat no-op provider
export function AttestationWizardProvider({ children }: { children: React.ReactNode }) {
  return children as any;
}
