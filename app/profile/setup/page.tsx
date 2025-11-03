"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { WalletConnect } from "@/components/WalletConnect";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { Route } from "next";

export default function ProfileSetupPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect") || "/";
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");

  // If connected and already has org_name, skip to intended destination
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConnected || !address) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/profiles/by-wallet?address=${address}`);
        const json = await res.json().catch(() => ({}));
        if (!cancelled) {
          const hasOrg = !!(json?.orgName && String(json.orgName).trim().length > 0);
          const seed = (json?.orgName || json?.handle || "") as string;
          if (seed) setOrgName(seed);
          if (hasOrg) {
            router.replace(redirectTo as Route);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, isConnected, router, redirectTo]);

  const canSave = useMemo(() => isConnected && !!address && orgName.trim().length > 0 && !saving, [isConnected, address, orgName, saving]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !address) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profiles/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: address, org_name: orgName.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
      const nextUrl = `/profile/setup/details?redirect=${encodeURIComponent(redirectTo)}` as Route;
      router.replace(nextUrl);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="w-full max-w-screen-xl mx-auto px-6 lg:px-24 pt-16 pb-52">
      <div className="max-w-[600px] mx-auto">
        {!isConnected ? (
          <div className="grid gap-4">
            <h1 className="text-white text-5xl md:text-7xl font-black leading-tight">Welcome to
                <br className="hidden md:block" /> Reef.Regen
              </h1>
            <p className="text-vulcan-400 text-xl md:text-2xl font-light leading-9">Sign in to set up your profile.</p>
            <WalletConnect />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-white text-5xl md:text-7xl font-black leading-tight">Welcome to
                <br className="hidden md:block" /> Reef.Regen
              </h1>
              <p className="text-vulcan-400 text-xl md:text-2xl font-light leading-9">
                We want to be sure your organization or personal name is written correctly on the blockchain.
                Please enter the organization you represent — or simply your name.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="org_name" className="text-vulcan-500 text-lg font-bold leading-6">
                Org/Profile name <span className="font-normal">(we will use this for the attestation on blockchain)</span>
              </label>
              <Input id="org_name" name="org_name" size="lg" value={orgName} onChange={(e) => setOrgName(e.target.value)} required placeholder="Enter name here" disabled={loading || saving} />
            </div>

            <div className="flex gap-6">
              <Button type="submit" disabled={!canSave} className="flex-1" size="lg">{saving ? "Saving…" : "Next"}</Button>
            </div>
            {error && <div className="text-red-300 text-sm">{error}</div>}
          </form>
        )}
      </div>
      </div>
    </div>
  );
}
