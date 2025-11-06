"use client";

type Props = {
  backVisible?: boolean;
  backDisabled?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  centerLabel?: string;
  centerLabelMobile?: string; // optional: mobile-optimized label (e.g., without saved time)
};

import Button from "@/components/ui/Button";

export function WizardFooter({
  backVisible = true,
  backDisabled,
  nextLabel,
  nextDisabled,
  onBack,
  onNext,
  centerLabel,
  centerLabelMobile,
}: Props) {
  return (
    <div className="sticky bottom-2 left-0 right-0 pt-0 md:pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[960px] mx-auto rounded-3xl backdrop-blur-md bg-vulcan-800/70 outline outline-1 outline-vulcan-700/70 px-4 md:px-6 py-4 md:py-6">
        {/* Center label on its own line */}
        {centerLabel && (
          <div className="md:hidden text-vulcan-400 text-base font-light leading-6 text-center mb-3">
            {centerLabelMobile || centerLabel}
          </div>
        )}
        {/* Buttons row */}
        <div className="grid grid-cols-2 gap-3 items-center md:flex md:items-center md:justify-between">
          <div className="md:w-40 md:flex-shrink-0">
            {backVisible ? (
              <Button
                type="button"
                disabled={backDisabled}
                onClick={onBack}
                variant="outline"
                size="md"
                className="w-full md:w-40 h-14 md:h-12 text-xl font-black"
              >
                Back
              </Button>
            ) : (
              <div />
            )}
          </div>
          {centerLabel && (
            <div className="hidden md:block flex-1 text-vulcan-400 text-lg font-light leading-6 text-center">
              {centerLabel}
            </div>
          )}
          <div className="md:w-40 md:flex-shrink-0">
            <Button
              type="button"
              disabled={nextDisabled}
              onClick={onNext}
              variant="solid"
              size="md"
              className="w-full md:w-40 h-14 md:h-12 text-xl font-black"
            >
              {nextLabel || "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
