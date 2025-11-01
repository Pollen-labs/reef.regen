"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Props = {
  afterSave?: () => void;
};

export function OnboardingPrompt({ afterSave }: Props) {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConnected || !address) {
        setShouldShow(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/profiles/by-wallet?address=${address}`);
        const json = await res.json().catch(() => ({}));
        if (!cancelled) {
          const hasOrg = !!(json?.orgName && String(json.orgName).trim().length > 0);
          setShouldShow(!hasOrg);
          // seed with fallback if present
          const seed = (json?.orgName || json?.handle || "") as string;
          setOrgName(seed);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load profile");
          setShouldShow(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  const canSave = useMemo(() => {
    return isConnected && !!address && orgName.trim().length > 0 && !saving;
  }, [isConnected, address, orgName, saving]);

  async function onSave(e: React.FormEvent) {
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
      setShouldShow(false);
      afterSave?.();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!isConnected || !shouldShow) return null;

  return (
    <form onSubmit={onSave} className="w-full max-w-[960px] mx-auto border border-white/10 rounded-xl p-4 md:p-6 bg-white/5">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-white text-xl font-bold">Set your organization name</h3>
          <p className="text-white/70 text-sm">Used on blockchain attestations and your public profile.</p>
        </div>
        <label className="grid gap-2">
          <span className="text-white/80 text-sm font-semibold">Organization name</span>
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g., Coral Guardians" disabled={loading || saving} />
        </label>
        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={!canSave}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {error && <div className="text-red-300 text-sm">{error}</div>}
        </div>
      </div>
    </form>
  );
}
