"use client";

type Props = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
};

export function LeaveWarningModal({ open, onStay, onLeave }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onStay} />
      <div className="relative z-10 w-[472px] p-8 bg-vulcan-900 rounded-3xl outline outline-1 outline-offset-[-1px] outline-vulcan-200 inline-flex flex-col items-center gap-6 text-center">
        <div className="w-56 h-64 bg-flamingo-100 rounded-lg" />
        <div className="w-full flex flex-col items-center gap-2">
          <div className="text-white text-5xl font-black leading-[52px]">Hold on</div>
          <div className="text-vulcan-100 text-2xl font-light leading-9">
            Leaving the submission now will LOST all the data you entered.
            <br />Are you sure to leave?
          </div>
        </div>
        <div className="w-full flex flex-col items-stretch gap-4">
          <button
            className="w-full px-6 py-2 bg-orange rounded-2xl text-white text-xl font-bold leading-8"
            onClick={onStay}
          >
            Back to edit
          </button>
          <button
            className="w-full px-6 py-2 rounded-2xl outline outline-4 outline-offset-[-4px] outline-orange text-white text-xl font-bold leading-8"
            onClick={onLeave}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

