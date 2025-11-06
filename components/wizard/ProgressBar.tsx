"use client";

import { useAttestationWizard } from "@/lib/wizard/attestationWizardStore";

export function ProgressBar() {
  const { currentStep, totalSteps } = useAttestationWizard();
  const segments = Array.from({ length: totalSteps }, (_, i) => i + 1);
  return (
    <div className="w-full flex justify-center" aria-label={`Step ${currentStep} of ${totalSteps}`}>
      <div className="w-full max-w-[600px] flex gap-3 py-2">
        {segments.map((n) => {
          const state = n < currentStep ? 'completed' : n === currentStep ? 'active' : 'upcoming';
          const cls = state === 'completed'
            ? 'bg-flamingo-200'
            : state === 'active'
              ? 'bg-flamingo-300'
              : 'bg-vulcan-700';
          return (
            <div
              key={n}
              className={`h-2 flex-1 rounded-full ${cls}`}
              aria-current={n === currentStep ? 'step' : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
