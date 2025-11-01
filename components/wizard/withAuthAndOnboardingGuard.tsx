"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import { SignInRequired } from "@/components/wizard/SignInRequired";

// Simple in-memory cache to avoid refetch flashes between step navigations
const orgPresenceCache: Record<string, boolean> = {};

export function withAuthAndOnboardingGuard<P>(Component: (props: P) => JSX.Element) {
  return function Guarded(props: P) {
    const { isConnected, address, status } = useAccount();
    const pathname = usePathname();
    const [hasOrg, setHasOrg] = useState<boolean | null>(null);

    // Fetch org presence only when connected
    useEffect(() => {
      let cancelled = false;
      (async () => {
        if (!isConnected || !address) {
          setHasOrg(null);
          return;
        }
        // Use cached value immediately to prevent UI flash
        if (orgPresenceCache[address] !== undefined) {
          setHasOrg(orgPresenceCache[address]);
        }
        try {
          const res = await fetch(`/api/profiles/by-wallet?address=${address}`);
          const json = await res.json().catch(() => ({}));
          if (!cancelled) {
            const ok = !!(json?.orgName && String(json.orgName).trim().length > 0);
            setHasOrg(ok);
            orgPresenceCache[address] = ok;
          }
        } catch {
          if (!cancelled) setHasOrg(false);
        }
      })();
      return () => { cancelled = true; };
    }, [isConnected, address]);

    const loading = (status === "connecting" || status === "reconnecting") || (isConnected && !!address && hasOrg === null);

    const canProceed = useMemo(() => {
      return isConnected && !!address && hasOrg === true;
    }, [isConnected, address, hasOrg]);

    // While loading/initializing, avoid rendering the sign-in screen to prevent flashes
    if (loading && !canProceed) return null;

    if (!canProceed) {
      return <SignInRequired returnTo={pathname || "/submit/steps/1"} />;
    }
    // Cast to any to avoid generic IntrinsicAttributes friction in HOC
    const C: any = Component as any;
    return <C {...(props as any)} />;
  };
}
