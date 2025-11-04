"use client";

type Props = {
  backVisible?: boolean;
  backDisabled?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  centerLabel?: string;
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
}: Props) {
  return (
    <div className="sticky bottom-2 left-0 right-0 pt-0 md:pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[960px] mx-auto rounded-3xl backdrop-blur-md bg-vulcan-800/70 outline outline-1 outline-vulcan-700/70 px-4 md:px-6 py-6 flex items-center justify-between gap-3">
        <div className="w-40">
          {backVisible && (
            <div className="hidden md:block">
              <Button
                type="button"
                disabled={backDisabled}
                onClick={onBack}
                variant="outline"
                size="md"
                className="w-40"
              >
                Back
              </Button>
            </div>
          )}
        </div>
        <div className="text-vulcan-400 text-sm font-light leading-6 text-center flex-1">
          {centerLabel}
        </div>
        <div className="w-40 flex items-center justify-end">
          <Button
            type="button"
            disabled={nextDisabled}
            onClick={onNext}
            variant="solid"
            size="md"
            className="w-40"
          >
            {nextLabel || "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
