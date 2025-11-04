"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { hasUnsavedWork, useAttestationWizard } from "@/lib/wizard/attestationWizardStore";
import { LeaveWarningModal } from "@/components/wizard/LeaveWarningModal";

type Ctx = {
  confirm: (onConfirm: () => void) => void;
  shouldBlock: boolean;
};

const GuardCtx = createContext<Ctx | null>(null);

export function LeaveGuardProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<null | (() => void)>(null);
  // Subscribe to wizard state; recompute block condition on every render
  const snapshot = useAttestationWizard();
  const pathname = usePathname();
  const p = pathname || "";
  const inWizardSteps = p.startsWith("/submit/steps/") || p === "/submit/review";
  const shouldBlock = inWizardSteps && hasUnsavedWork(snapshot);

  const confirm = useCallback((fn: () => void) => {
    if (shouldBlock) {
      setPending(() => fn);
    } else {
      fn();
    }
  }, [shouldBlock]);

  const onStay = useCallback(() => setPending(null), []);
  const onLeave = useCallback(() => {
    const act = pending;
    setPending(null);
    act?.();
  }, [pending]);

  return (
    <GuardCtx.Provider value={{ confirm, shouldBlock }}>
      {children}
      <LeaveWarningModal open={!!pending} onStay={onStay} onLeave={onLeave} />
    </GuardCtx.Provider>
  );
}

export function useLeaveGuard() {
  const ctx = useContext(GuardCtx);
  if (!ctx) throw new Error("useLeaveGuard must be used within LeaveGuardProvider");
  return ctx;
}
