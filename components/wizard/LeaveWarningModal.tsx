"use client";

import { useAttestationWizard } from "@/lib/wizard/attestationWizardStore";

type Props = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void; // navigate away without discarding
};

export function LeaveWarningModal({ open, onStay, onLeave }: Props) {
  const wizard = useAttestationWizard();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onStay} />
      <div className="relative z-10 w-[472px] max-w-[90vw] p-8 bg-vulcan-900 rounded-3xl outline outline-1 outline-offset-[-1px] outline-vulcan-600 inline-flex flex-col items-center gap-6 text-center">
        <div className="w-full flex flex-col items-center gap-2">
          <div className="text-white text-h4 font-black ">Hold on</div>
          <div className="text-vulcan-100 text-xl font-medium leading-9">
            You have an in‑progress submission. If you leave now, your draft may be lost.
            <br />What would you like to do?
          </div>
        </div>
        <div className="w-full flex flex-col items-stretch gap-3">
          <button
            className="w-full px-6 py-2 bg-orange rounded-2xl text-white text-xl font-bold leading-8"
            onClick={onStay}
          >
            Keep editing
          </button>
          <button
            className="w-full px-6 py-2 rounded-2xl outline outline-4 outline-offset-[-4px] outline-vulcan-500 text-white text-xl font-bold leading-8"
            onClick={() => { try { wizard.resetAndPurge(); } catch {} onLeave(); }}
          >
            Discard draft and leave
          </button>
        </div>
      </div>
    </div>
  );
}
