"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import type { Route } from "next";

export default function ProfileDetailsStep() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = decodeURIComponent(search.get("redirect") || "/");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [website, setWebsite] = useState("");

  // Prefill from existing profile if present
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConnected || !address) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/profile/me?address=${address}`);
        const json = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && json?.profile) {
          setDesc(json.profile.description || "");
          setWebsite(json.profile.website || "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isConnected, address]);

  const websiteValid = useMemo(() => {
    return !website || /^https?:\/\//i.test(website);
  }, [website]);

  const canSave = useMemo(() => {
    const hasAny = (desc.trim().length > 0) || (website.trim().length > 0);
    return isConnected && !!address && !saving && websiteValid && hasAny;
  }, [isConnected, address, saving, websiteValid, desc, website]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !address) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: address, description: desc.trim() || null, website: website.trim() || null }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Save failed (${res.status})`);
      // Prefer router.replace; fall back to hard navigation to avoid being blocked by intermediate state
      try {
        router.replace(redirectTo as Route);
        // If the router doesn't navigate (rare), force it after a short delay
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname !== redirectTo) {
            window.location.href = redirectTo;
          }
        }, 50);
      } catch {
        if (typeof window !== 'undefined') window.location.href = redirectTo;
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  function onSkip() {
    try {
      router.replace(redirectTo as Route);
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== redirectTo) {
          window.location.href = redirectTo;
        }
      }, 50);
    } catch {
      if (typeof window !== 'undefined') window.location.href = redirectTo;
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="w-full max-w-screen-xl mx-auto px-6 lg:px-24 pt-16 pb-52">
        <div className="w-full max-w-[600px] mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h1 className="text-white text-5xl md:text-7xl font-black leading-tight">Shine your profile</h1>
              <p className="text-vulcan-400 text-xl md:text-2xl font-light leading-9">
                Each user on Reef.Regen has a public-facing profile to showcase the regen actions. Add a description and link you’d like to share with the public.
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              <label className="grid gap-2">
                <span className="text-base font-bold text-vulcan-400">Description</span>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={6} placeholder="Tell us about your organization (optional)" maxLength={800} disabled={loading || saving} />
              </label>
              <label className="grid gap-2">
                <span className="text-base font-bold text-vulcan-400">Website</span>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.org" disabled={loading || saving} />
                {!websiteValid && <span className="text-xs text-red-300">Website must start with http:// or https://</span>}
              </label>

              {error && <div className="text-red-300 text-sm">{error}</div>}

              <div className="flex gap-3 mt-2">
                <Button type="button" variant="outline" onClick={onSkip}>Do it later</Button>
                <Button type="submit" disabled={!canSave}>{saving ? "Saving…" : "Save & Continue"}</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
