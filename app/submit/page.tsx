"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { SignInRequired } from "@/components/wizard/SignInRequired";

export default function SubmitEntryPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConnected || !address) return; // show sign-in required below
      try {
        const res = await fetch(`/api/profiles/by-wallet?address=${address}`);
        const json = await res.json().catch(() => ({}));
        const hasOrg = !!(json?.orgName && String(json.orgName).trim().length > 0);
        if (hasOrg && !cancelled) router.replace(`/submit/steps/1`);
      } catch {
        // stay on page and show CTA
      }
    })();
    return () => { cancelled = true; };
  }, [isConnected, address, router]);

  return <SignInRequired returnTo="/submit/steps/1" />;
}

