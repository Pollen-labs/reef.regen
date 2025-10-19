"use client";

import { useEffect } from "react";
import type { Route } from "next";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { WalletConnect } from "@/components/WalletConnect";

export default function ConnectPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConnected || !address) return;
      try {
        const res = await fetch(`/api/profiles/by-wallet?address=${address}`);
        const json = await res.json().catch(() => ({}));
        const handle = json?.handle as string | null;
        const href = (handle ? `/profile/${handle}` : "/attest") as Route;
        if (!cancelled) router.replace(href);
      } catch {
        if (!cancelled) router.replace("/attest" as Route);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isConnected, address, router]);

  if (isConnected) {
    return (
      <div style={{ padding: 24 }}>
        <p>Redirecting…</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16, padding: 24, maxWidth: 400, margin: "0 auto" }}>
      <h1>Connect Your Wallet</h1>
      <p style={{ color: "#666" }}>
        Connect with the Embedded Wallet to start creating attestations.
      </p>
      <WalletConnect />
    </div>
  );
}
