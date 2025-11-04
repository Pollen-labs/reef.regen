"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import IdentifierBar from "@/components/ui/IdentifierBar";
import { useEffect } from "react";
import { useAttestationWizard } from "@/lib/wizard/attestationWizardStore";

function SuccessInner() {
  const params = useSearchParams();
  const router = useRouter();
  const wizard = useAttestationWizard();
  const uid = params.get("uid") || "";
  const base = process.env.NEXT_PUBLIC_EAS_EXPLORER_URL || "https://optimism-sepolia.easscan.org";
  const attUrl = uid ? `${base.replace(/\/$/, "")}/attestation/view/${uid}` : base;

  // Extra safety: clear any leftover wizard state on success
  useEffect(() => {
    try { wizard.reset(); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-[1100px] mx-auto py-24 px-6 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-[520px_1fr] gap-8 items-center">
        {/* Image placeholder */}
        <div className="rounded-3xl bg-vulcan-600/40 aspect-[4/3] md:h-[380px] md:aspect-auto" />

        {/* Text column */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="text-white text-5xl md:text-7xl font-black leading-[1.04]">Submission is</div>
            <div className="text-white text-5xl md:text-7xl font-black leading-[1.04]">completed!</div>
          </div>
          <div className="text-vulcan-200 text-2xl font-light leading-9">All your data is submitted to the blockchain.</div>

          {uid && (
            <IdentifierBar
              label="EAS Identifier"
              value={uid}
              actionLabel="View"
              onAction={() => window.open(attUrl, '_blank')}
              copyable
              shorten
              external
            />
          )}

          <div className="flex items-center gap-4 mt-2">
            <button
              type="button"
              onClick={() => router.replace('/map')}
              className="px-6 py-3 rounded-2xl outline outline-4 outline-offset-[-4px] outline-vulcan-500 text-white"
            >
              See on the map
            </button>
            <button
              type="button"
              onClick={() => router.replace('/submit/steps/1')}
              className="px-6 py-3 bg-orange rounded-2xl text-white font-bold"
            >
              Submit another one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmitSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}
