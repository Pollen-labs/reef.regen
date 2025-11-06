"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useWeb3Auth, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import RevealPrivateKeyModal from "@/components/security/RevealPrivateKeyModal";
import { env } from "@/lib/env";
import { SiteModal } from "@/components/wizard/SiteModal";
import IdentifierBar from "@/components/ui/IdentifierBar";


type Profile = {
  profile_name: string | null;
  description: string | null;
  website: string | null;
  handle: string;
  wallet_address: string;
};

type SiteItem = {
  id: string;
  name: string;
  lon: number | string;
  lat: number | string;
  depthM: number | null;
  areaM2: number | null;
  siteType?: string;
};

export default function ProfileSettingPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { disconnect: disconnectWeb3Auth } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const web3Ctx = (useWeb3Auth() as any) || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [orgName, setOrgName] = useState("");
  const [desc, setDesc] = useState("");
  const [website, setWebsite] = useState("");
  const [handle, setHandle] = useState("");
  const [handleOk, setHandleOk] = useState<boolean | null>(null);
  const [handleMsg, setHandleMsg] = useState<string | null>(null);

  const [sites, setSites] = useState<SiteItem[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editSite, setEditSite] = useState<SiteItem | null>(null);

  // Load current profile and sites
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConnected || !address) return;
      setLoading(true);
      setError(null);
      try {
        const me = await fetch(`/api/profile/me?address=${address}`);
        const json = await me.json();
        if (!me.ok) throw new Error(json?.error || `Failed to load profile (${me.status})`);
        if (cancelled) return;
        const p: Profile = json.profile;
        setProfile(p);
        setOrgName(p.profile_name || "");
        setDesc(p.description || "");
        setWebsite(p.website || "");
        setHandle(p.handle || "");

        const sres = await fetch(`/api/sites/by-wallet?address=${address}`);
        const sjson = await sres.json().catch(() => ({}));
        if (sres.ok && Array.isArray(sjson.items)) setSites(sjson.items as SiteItem[]);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [address, isConnected]);

  // Debounced handle check
  useEffect(() => {
    const v = handle.trim().toLowerCase();
    if (!v || v === (profile?.handle || "").toLowerCase()) {
      setHandleOk(null);
      setHandleMsg(null);
      return;
    }
    if (!/^[a-z0-9-]{3,32}$/.test(v)) {
      setHandleOk(false);
      setHandleMsg("Handle must be 3–32 chars, lowercase, a-z, 0-9, -");
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/profile/check-handle?handle=${encodeURIComponent(v)}`);
        const j = await r.json();
        if (j?.available) {
          setHandleOk(true);
          setHandleMsg("Handle available");
        } else {
          setHandleOk(false);
          setHandleMsg(j?.reason === "invalid" ? "Invalid handle" : "Handle already taken");
        }
      } catch {
        setHandleOk(null);
        setHandleMsg(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [handle, profile?.handle]);

  const dirty = useMemo(() => {
    if (!profile) return false;
    return (
      (orgName || "") !== (profile.profile_name || "") ||
      (desc || "") !== (profile.description || "") ||
      (website || "") !== (profile.website || "") ||
      (handle || "") !== (profile.handle || "")
    );
  }, [profile, orgName, desc, website, handle]);

  const websiteValid = useMemo(() => {
    return !website || /^https?:\/\//i.test(website);
  }, [website]);

  const canSave = useMemo(() => {
    return isConnected && !!address && dirty && !saving && websiteValid && (handleOk !== false);
  }, [isConnected, address, dirty, saving, websiteValid, handleOk]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !address) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          profile_name: orgName.trim(),
          description: desc.trim(),
          website: website.trim() || null,
          handle: handle.trim().toLowerCase(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Save failed (${res.status})`);
      setSuccess("Profile updated successfully.");
      // Refresh baseline
      setProfile((p) => p ? ({ ...p, profile_name: orgName.trim() || null, description: desc.trim() || null, website: (website.trim() || null), handle: handle.trim().toLowerCase() }) : p);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    if (!profile) return;
    setOrgName(profile.profile_name || "");
    setDesc(profile.description || "");
    setWebsite(profile.website || "");
    setHandle(profile.handle || "");
    setError(null);
    setSuccess(null);
  }

  async function refreshSites() {
    if (!address) return;
    const r = await fetch(`/api/sites/by-wallet?address=${address}`);
    const j = await r.json().catch(() => ({}));
    if (r.ok && Array.isArray(j.items)) setSites(j.items as SiteItem[]);
  }

  function truncate(addr?: string) {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-5)}` : "";
  }

  const displayAddress = useMemo(() => {
    return (isConnected && address) ? address : (profile?.wallet_address || "");
  }, [isConnected, address, profile?.wallet_address]);

  const [revealOpen, setRevealOpen] = useState(false);

  // Show Wallet section only when using embedded OpenLogin (social/email)
  const showWalletSection = useMemo(() => {
    // Most reliable signal: Web3Auth user has an email (social/email logins)
    if ((userInfo as any)?.email) return true;
    // Otherwise, check adapter name if available
    const adapter = String(web3Ctx?.web3Auth?.connectedAdapterName || web3Ctx?.connectedAdapterName || "").toLowerCase();
    if (adapter) return adapter === "openlogin";
    // Final fallback: presence of typeOfLogin also indicates OpenLogin
    const t = (userInfo as any)?.typeOfLogin;
    return !!t;
  }, [userInfo, web3Ctx?.web3Auth?.connectedAdapterName, web3Ctx?.connectedAdapterName]);

  async function onLogout() {
    try {
      await disconnectWeb3Auth();
    } catch {}
    disconnect();
    if (typeof window !== 'undefined') {
      try { localStorage.clear(); } catch {}
      window.location.href = "/";
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Breadcrumb bar to match Profile main page */}
      <nav aria-label="Breadcrumb" className="w-full">
        <div className="w-full max-w-[1440px] mx-auto px-0 lg:px-24 mb-2 md:mb-4 flex items-center justify-between">
          <div className="text-vulcan-500 text-lg font-bold">
            {profile?.handle ? (
              <a href={`/profile/${profile.handle}`} className="hover:text-white/90">Profile</a>
            ) : (
              <span>Profile</span>
            )}
            <span> / Setting</span>
          </div>
          <div className="flex items-center gap-6" />
        </div>
      </nav>

      <div className="w-full max-w-[1440px] mx-auto px-0 lg:px-24 py-6 mb-12">

        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div className="text-red-300">{error}</div>
        ) : (
          <div className="w-full max-w-[600px] mx-auto">
            {/* Basic Information */}
            <h2 className="text-h4 font-black mb-6">Basic information</h2>
            <form onSubmit={onSave} className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-base font-bold text-vulcan-400">Organization name</span>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Enter organization name" required />
              </label>
              <label className="grid gap-2">
                <span className="text-base font-bold text-vulcan-400">Description</span>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={6} placeholder="Tell us about your organization (max 500 chars)" maxLength={500} />
              </label>
              <label className="grid gap-2">
                <span className="text-base font-bold text-vulcan-400">Website</span>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.org" />
                {!websiteValid && <span className="text-xs text-red-300">Website must start with http:// or https://</span>}
              </label>
              <label className="grid gap-2">
                <span className="text-base font-bold text-vulcan-400">Handle</span>
                <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="reef-123" />
                {handleMsg && (
                  <span className={`text-xs ${handleOk ? 'text-green-300' : 'text-red-300'}`}>{handleMsg}</span>
                )}
              </label>
              <div className="flex gap-3 mt-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={!dirty}>Cancel</Button>
                <Button type="submit" disabled={!canSave}>{saving ? "Saving…" : "Save"}</Button>
                {success && <span className="self-center text-green-300 text-sm">{success}</span>}
              </div>
            </form>

            {/* Sites */}
            <h2 className="text-h4 font-black mt-16 mb-3">Sites</h2>
            <div className="grid gap-3">
              {sites.map((s) => (
                <div
                  key={s.id}
                  className="rr-option-card rr-option-card-default cursor-default"
                  aria-label={`Site ${s.name}`}
                >
                  <div className="flex-1 text-left">
                    <div className="text-xl font-bold">{s.name}</div>
                    <div className="text-black/70">Site type: {s.siteType || '—'}</div>
                    <div className="text-black/70">Depth: {s.depthM ?? '—'}m · Area: {s.areaM2 ?? '—'}m²</div>
                  </div>
                  <button type="button" className="p-1 -mr-1"
                    onClick={(e) => { e.stopPropagation(); setEditSite(s); }}
                    aria-label="Edit site"
                  >
                    <i className="f7-icons text-2xl text-black/70">pencil_circle</i>
                  </button>
                </div>
              ))}
              <button
                className="relative rr-input text-left max-w-[600px] text-white/80"
                onClick={() => setOpenCreate(true)}
              >
                Add a site
                <i className="f7-icons rr-input-icon">map</i>
              </button>
              {sites.length === 0 && (
                <div className="text-vulcan-400">No sites yet. Use the button above to add your first site.</div>
              )}
            </div>

            {/* Wallet & Security (only for OpenLogin users) */}
            {showWalletSection && (
              <>
                <h2 className="text-h4 font-black mt-16 mb-3">Wallet</h2>
                <div className="grid gap-4 mb-12">
                  <IdentifierBar
                    label="Wallet address"
                    value={displayAddress}
                    copyable
                    shorten
                    actionLabel="Explorer"
                    external
                    onAction={() => {
                      const url = `${env.blockExplorerAddressPrefix}${displayAddress}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  />
                  <div>
                    <Button type="button" variant="outline" onClick={() => setRevealOpen(true)}>Reveal private key</Button>
                  </div>
                </div>
              </>
            )}

            { /* session */ }
            <h4 className="text-h6 font-black mt-16 mb-3">Connection</h4>
            <div className="mt-2">
                <Button type="button" variant="outlineOrange" size="lg" onClick={onLogout}>Log out</Button>
            </div>
          </div>
        )}
      </div>

      {/* Site modals */}
      {openCreate && address && (
        <SiteModal
          open={openCreate}
          mode="create"
          walletAddress={address}
          onClose={() => setOpenCreate(false)}
          onSaved={() => { setOpenCreate(false); refreshSites(); }}
        />
      )}
      {editSite && (
        <SiteModal
          open={!!editSite}
          mode="edit"
          initial={{ id: editSite.id, name: editSite.name, type: editSite.siteType || "", depthM: editSite.depthM ?? ('' as any), areaM2: editSite.areaM2 ?? ('' as any), coords: [Number(editSite.lon), Number(editSite.lat)] as [number, number] }}
          onClose={() => setEditSite(null)}
          onSaved={() => { setEditSite(null); refreshSites(); }}
        />
      )}
      {revealOpen && (
        <RevealPrivateKeyModal open={revealOpen} onClose={() => setRevealOpen(false)} />
      )}
    </div>
  );
}
