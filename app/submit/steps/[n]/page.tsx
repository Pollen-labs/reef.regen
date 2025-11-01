"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { withAuthAndOnboardingGuard } from "@/components/wizard/withAuthAndOnboardingGuard";
import { useAttestationWizard } from "@/lib/wizard/attestationWizardStore";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { WizardFooter } from "@/components/wizard/WizardFooter";
import { Step1Actions } from "@/components/wizard/Step1Actions";
import { Step2DateSite } from "@/components/wizard/Step2DateSite";
import { Step3SummaryFile } from "@/components/wizard/Step3SummaryFile";
import { Step4Species } from "@/components/wizard/Step4Species";
import { Step5Contributors } from "@/components/wizard/Step5Contributors";
import { useUnsavedWarning } from "@/hooks/useUnsavedWarning";
import { useLeaveGuard } from "@/hooks/useLeaveGuard";

function StepContent() {
  const params = useParams<{ n: string }>();
  const router = useRouter();
  const { currentStep, totalSteps, setPatch, reefRegenActions, dateMode, actionDate, actionStart, actionEnd, siteId, lastSavedAt } = useAttestationWizard();
  const { confirm } = useLeaveGuard();
  const stepNum = useMemo(() => {
    const n = Number(params?.n);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(n, totalSteps);
  }, [params, totalSteps]);

  // warn on tab close while in-progress
  useUnsavedWarning(true);

  // Intercept browser back to confirm leaving the wizard
  useEffect(() => {
    const handler = () => {
      // immediately restore the current history entry, then confirm
      history.pushState(null, "", window.location.href);
      confirm(() => history.back());
    };
    // create a new history entry to intercept back
    history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [confirm]);

  // Keep the store's currentStep in sync with the route param
  useEffect(() => {
    if (currentStep !== stepNum) setPatch({ currentStep: stepNum });
  }, [currentStep, stepNum, setPatch]);

  const goNext = () => {
    const next = Math.min(totalSteps, stepNum + 1);
    setPatch({ currentStep: next });
    router.replace(`/submit/steps/${next}`);
  };
  const goBack = () => {
    const prev = Math.max(1, stepNum - 1);
    setPatch({ currentStep: prev });
    router.replace(`/submit/steps/${prev}`);
  };

  const isFirst = stepNum === 1;
  const isLast = stepNum === totalSteps;

  const step2Valid = useMemo(() => {
    if (dateMode === 'range') {
      if (!actionStart || !actionEnd) return false;
      if (actionStart > actionEnd) return false;
    } else {
      if (!actionDate) return false;
    }
    return !!siteId;
  }, [dateMode, actionDate, actionStart, actionEnd, siteId]);

  const savedLabel = useMemo(() => {
    if (!lastSavedAt) return "";
    const d = new Date(lastSavedAt);
    const hhmm = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Saved locally • ${hhmm}`;
  }, [lastSavedAt]);

  const stepTitle = useMemo(() => {
    switch (stepNum) {
      case 1: return "Regen actions";
      case 2: return "When & Where";
      case 3: return "Summary & Attachment";
      case 4: return "Species";
      case 5: return "Contributors";
      default: return "";
    }
  }, [stepNum]);

  return (
    <div className="w-full max-w-[960px] mx-auto py-4 px-4 md:px-2 pb-40">
      <ProgressBar />
      <div className="py-4">
        {stepNum === 1 && (
          <div className="flex flex-col items-center gap-12">
            <div className="w-full max-w-[960px] flex flex-col items-center gap-4">
              <div className="text-center text-white text-5xl md:text-7xl font-black leading-[1.04]">What regen action are we submitting today?</div>
              <div className="text-center text-vulcan-100 text-2xl font-light leading-9">You can select multiple actions that you have done</div>
            </div>
            <Step1Actions />
          </div>
        )}
        {stepNum === 2 && <Step2DateSite />}
        {stepNum === 3 && <Step3SummaryFile />}
        {stepNum === 4 && <Step4Species />}
        {stepNum === 5 && <Step5Contributors />}
        {stepNum > 5 && (
          <div className="text-white/70">Step {stepNum} content coming next.</div>
        )}
      </div>
      <WizardFooter
        backVisible={!isFirst}
        onBack={goBack}
        onNext={goNext}
        nextLabel={isLast ? (stepNum === totalSteps ? "Review" : "Next") : "Next"}
        nextDisabled={isFirst ? reefRegenActions.length === 0 : stepNum === 2 ? !step2Valid : false}
        centerLabel={`Step ${stepNum} of ${totalSteps} : ${stepTitle}${savedLabel ? ` • ${savedLabel}` : ''}`}
      />
    </div>
  );
}

export default withAuthAndOnboardingGuard(StepContent);
