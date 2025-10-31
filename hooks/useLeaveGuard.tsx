"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { hasUnsavedWork, useAttestationWizard } from "@/lib/wizard/attestationWizardStore";
import { LeaveWarningModal } from "@/components/wizard/LeaveWarningModal";

type Ctx = {
  confirm: (onConfirm: () => void) => void;
  shouldBlock: boolean;
};

const GuardCtx = createContext<Ctx | null>(null);

export function LeaveGuardProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<null | (() => void)>(null);
  // subscribe to wizard state to detect edits
  useAttestationWizard();
  const shouldBlock = useMemo(() => hasUnsavedWork(), []); // hasUnsavedWork reads directly from store

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

