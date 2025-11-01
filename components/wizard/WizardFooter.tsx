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
            <button
              type="button"
              disabled={backDisabled}
              onClick={onBack}
              className="w-40 px-6 py-2 rounded-2xl outline outline-4 outline-offset-[-4px] outline-vulcan-500 text-white disabled:opacity-50 hidden md:inline-flex items-center justify-center"
            >
              Back
            </button>
          )}
        </div>
        <div className="text-vulcan-400 text-sm font-light leading-6 text-center flex-1">
          {centerLabel}
        </div>
        <div className="w-40 flex items-center justify-end">
          <button
            type="button"
            disabled={nextDisabled}
            onClick={onNext}
            className="w-40 px-6 py-2 bg-orange rounded-2xl text-white font-bold disabled:opacity-50"
          >
            {nextLabel || "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
