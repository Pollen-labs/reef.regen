"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import IdentifierBar from "@/components/ui/IdentifierBar";
import ShareButtons from "@/components/shared/ShareButtons";
import { useEffect } from "react";
import { useAttestationWizard } from "@/lib/wizard/attestationWizardStore";

function SuccessInner() {
  const params = useSearchParams();
  const router = useRouter();
  const wizard = useAttestationWizard();
  const uid = params.get("uid") || "";
  const att = params.get("att") || "";
  const site = params.get("site") || "";
  const base = process.env.NEXT_PUBLIC_EAS_EXPLORER_URL || "https://optimism-sepolia.easscan.org";
  const attUrl = uid ? `${base.replace(/\/$/, "")}/attestation/view/${uid}` : base;
  const appBase = (process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : ''))
    .toString()
    .replace(/\/$/, "");
  const qp = new URLSearchParams();
  if (site) qp.set('site', site);
  if (att) qp.set('att', att);
  const shareUrl = `${appBase}/map${qp.toString() ? `?${qp.toString()}` : ''}`;

  // Extra safety: clear any leftover wizard state on success
  useEffect(() => {
    try { wizard.resetAndPurge(); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-[1100px] mx-auto py-10 md:py-24 px-0 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-[520px_1fr] gap-8 items-center">
        {/* Image */}
        <div className="rounded-3xl overflow-hidden aspect-[1/1] md:h-[480px] md:aspect-auto flex items-center justify-center">
          <img
            src="/assets/img-submit-success.svg"
            alt="Submission success"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Text column */}
        <div className="flex flex-col gap-6">
          <h1
            className="text-white text-5xl md:text-7xl font-black text-balance"
            style={{ textWrap: 'balance' as any }}
          >
            Submission is completed!
          </h1>
          <div className="text-vulcan-200 text-2xl font-light leading-9">All your data is submitted to the blockchain.</div>

          {uid && (
            <IdentifierBar
              label="EAS UID"
              value={uid}
              actionLabel="View"
              onAction={() => window.open(attUrl, '_blank')}
              copyable
              shorten
              external
            />
          )}

          <div className="flex items-end mt-6 gap-6 flex-wrap">
            <div className="flex flex-col gap-2 flex-none">
              <div className="text-vulcan-200 text-xl font-light leading-9">Share on social</div>
              <ShareButtons
                variant="icons"
                url={shareUrl}
                text="I have attested my coral restoration action on the Reef.Regen"
              />
            </div>
            <button
              type="button"
              onClick={() => { try { wizard.resetAndPurge(); } catch {}; router.replace('/submit/steps/1'); }}
              className="px-6 py-3 bg-orange rounded-2xl text-white font-bold w-full md:flex-1 md:ml-auto"
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
