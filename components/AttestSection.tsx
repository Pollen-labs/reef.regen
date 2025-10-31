"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter, usePathname } from "next/navigation";
import type { Route } from "next";
import { AttestationForm } from "@/components/AttestationForm";

export function AttestSection() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();

  // If connected and missing org_name, redirect to setup with return path
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConnected || !address) return;
      try {
        const res = await fetch(`/api/profiles/by-wallet?address=${address}`);
        const json = await res.json().catch(() => ({}));
        if (!cancelled) {
          const hasOrg = !!(json?.orgName && String(json.orgName).trim().length > 0);
          if (!hasOrg) {
            const ret = encodeURIComponent(pathname || "/attest");
            router.push((`/profile/setup?redirect=${ret}`) as Route);
            return;
          }
          // Ensure form picks up latest prefill
          setRefreshKey((k) => k + 1);
        }
      } catch {
        // ignore fetch errors here; form still renders and may prefill later
      }
    })();
    return () => { cancelled = true; };
  }, [isConnected, address, pathname, router]);
  return (
    <>
      <section>
        <h2>Create Delegated Attestation</h2>
        <AttestationForm key={refreshKey} />
      </section>
    </>
  );
}
