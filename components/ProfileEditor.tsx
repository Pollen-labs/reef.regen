"use client";

import { useAccount } from "wagmi";
import { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";

type Props = {
  walletAddress: string;
  orgName: string;
  website: string | null;
  description: string | null;
};

export function ProfileEditor({ walletAddress, orgName, website, description }: Props) {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const canEdit = useMemo(() => {
    if (!isConnected || !address) return false;
    return address.toLowerCase() === walletAddress.toLowerCase();
  }, [address, isConnected, walletAddress]);

  const [values, setValues] = useState({
    org_name: orgName || "",
    website: website || "",
    description: description || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setValues({
      org_name: orgName || "",
      website: website || "",
      description: description || "",
    });
  }, [orgName, website, description]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profiles/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: walletAddress,
          org_name: values.org_name,
          website: values.website || null,
          description: values.description || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Save failed (${res.status})`);
      setMessage("Saved");
      router.refresh();
    } catch (err: any) {
      setMessage(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) return null;

  return (
    <form onSubmit={onSave} className="w-full max-w-[720px] mx-auto grid gap-4 border border-white/10 rounded-xl p-6 bg-white/5 text-white">
      <h3 className="text-xl font-bold">Edit Profile</h3>
      <label className="grid gap-2">
        <span className="text-sm text-white/70">Organization Name</span>
        <Input value={values.org_name} onChange={(e) => setValues((s) => ({ ...s, org_name: e.target.value }))} placeholder="Organization or researcher name" required />
      </label>
      <label className="grid gap-2">
        <span className="text-sm text-white/70">Website</span>
        <Input value={values.website} onChange={(e) => setValues((s) => ({ ...s, website: e.target.value }))} placeholder="https://example.org" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm text-white/70">Description</span>
        <textarea
          className="rr-input min-h-[120px]"
          value={values.description}
          onChange={(e) => setValues((s) => ({ ...s, description: e.target.value }))}
          rows={3}
          placeholder="Brief description"
        />
      </label>
      <div className="pt-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </div>
      {message && <div className="text-white/80">{message}</div>}
    </form>
  );
}
