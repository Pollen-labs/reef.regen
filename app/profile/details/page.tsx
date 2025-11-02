"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { WalletConnect } from "@/components/WalletConnect";

export default function ProfileDetailsPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect") || "/";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({ description: "", website: "" });

  function normalizeUrl(input: string): string {
    const v = (input || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v; // already has scheme
    if (v.startsWith("//")) return `https:${v}`; // protocol-relative
    return `https://${v}`; // default to https
  }

  const canSave = useMemo(() => isConnected && !!address && !saving, [isConnected, address, saving]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !address) return;
    setSaving(true);
    setError(null);
    try {
      const websiteNormalized = values.website ? normalizeUrl(values.website) : "";
      const res = await fetch("/api/profiles/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          description: values.description.trim() || null,
          website: websiteNormalized || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
      router.replace(redirectTo as Route);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  function onSkip() {
    router.replace(redirectTo as Route);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="w-full max-w-screen-xl mx-auto px-6 lg:px-24 pt-16 pb-52">
        <div className="max-w-[600px] mx-auto">
        {!isConnected ? (
          <div className="grid gap-4">
            <h1 className="text-white text-4xl font-black">Complete your profile</h1>
            <p className="text-white/70">Connect your embedded wallet to continue.</p>
            <WalletConnect />
          </div>
        ) : (
          <form onSubmit={onSave} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-white text-5xl md:text-7xl font-black leading-tight">Complete your profile</h1>
              <p className="text-vulcan-400 text-xl md:text-2xl font-light leading-9">
                Each user on Reef.Regen has a public-facing profile to showcase their regeneration actions.
                Add a description and link you’d like to share with the public.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-vulcan-500 text-lg font-bold leading-6">Description</label>
              <textarea
                id="description"
                name="description"
                rows={6}
                className="w-full p-4 bg-vulcan-700 rounded-lg text-white placeholder-vulcan-400 text-2xl font-light leading-9 focus:outline-none focus:ring-2 focus:ring-orange"
                placeholder="Tell us about your organization’s work..."
                value={values.description}
                onChange={(e) => setValues((s) => ({ ...s, description: e.target.value }))}
                disabled={saving}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="website" className="text-vulcan-500 text-lg font-bold leading-6">Website</label>
              <input
                id="website"
                name="website"
                type="url"
                className="w-full p-4 bg-vulcan-700 rounded-lg text-white placeholder-vulcan-400 text-2xl font-light leading-9 focus:outline-none focus:ring-2 focus:ring-orange"
                placeholder="https://www.example.com"
                value={values.website}
                onChange={(e) => setValues((s) => ({ ...s, website: e.target.value }))}
                onBlur={(e) => setValues((s) => ({ ...s, website: normalizeUrl(e.target.value) }))}
                disabled={saving}
              />
            </div>

            <div className="flex gap-6">
              <button
                type="button"
                onClick={onSkip}
                className="flex-1 px-6 py-2 rounded-2xl border-2 border-vulcan-500 text-white text-xl font-bold leading-8"
              >
                Do it later
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className="flex-1 px-6 py-2 bg-orange rounded-2xl text-white text-xl font-bold leading-8 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save & Continue"}
              </button>
            </div>
            {error && <div className="text-red-300 text-sm">{error}</div>}
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
