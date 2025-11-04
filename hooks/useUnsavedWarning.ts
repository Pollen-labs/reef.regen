"use client";

import { useEffect } from "react";
import { hasUnsavedWork } from "@/lib/wizard/attestationWizardStore";

export function useUnsavedWarning(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedWork()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);
}

