"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAttestationWizard } from "@/lib/wizard/attestationWizardStore";
import Input from "@/components/ui/Input";
import { formatActionDate } from "@/lib/wizard/mapToPayload";
import { env } from "@/lib/env";
import { SchemaEncoder, ZERO_BYTES32, NO_EXPIRATION, EAS } from "@ethereum-attestation-service/eas-sdk";
import { EAS_GET_NONCE_ABI } from "@/lib/eas";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { formatDateRangeShort } from "@/lib/format/date";
import { useWeb3Auth } from "@web3auth/modal/react";
import { ethers } from "ethers";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import { classesForRegen } from "@/lib/style/regenColors";
import { classesForSiteType } from "@/lib/style/siteTypeColors";

export default function ReviewPage() {
  const router = useRouter();
  const s = useAttestationWizard();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [localError, setLocalError] = useState<string | null>(null);
  const { provider: embeddedProvider } = useWeb3Auth();

  const dateText = useMemo(() => {
    if (s.dateMode === 'range') return formatDateRangeShort(s.actionStart, s.actionEnd);
    return formatDateRangeShort(s.actionDate, null);
  }, [s.dateMode, s.actionDate, s.actionStart, s.actionEnd]);

  const [internalExists, setInternalExists] = useState(false);
  useEffect(() => {
    let active = true;
    const id = setTimeout(async () => {
      if (!s.internalId || !address) { if (active) setInternalExists(false); return; }
      try {
        const res = await fetch(`/api/attestations/check-internal?address=${address}&value=${encodeURIComponent(s.internalId)}`);
        const json = await res.json().catch(() => ({}));
        if (active) setInternalExists(!!json.exists);
      } catch { if (active) setInternalExists(false); }
    }, 300);
    return () => { active = false; clearTimeout(id); };
  }, [s.internalId, address]);

  const goEdit = (step: number) => router.replace(`/submit/steps/${step}`);

  // Hydrate organization name from profile if missing
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!address) return;
        if ((s.organizationName || '').trim().length > 0) return;
        const res = await fetch(`/api/profiles/by-wallet?address=${address}`);
        const json = await res.json().catch(() => ({}));
        const name = (json?.orgName || json?.name || json?.handle || '').toString().trim();
        if (!cancelled && name) s.setPatch({ organizationName: name });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [address, s]);

  async function handleSubmit() {
    setLocalError(null);
    // basic guards
    if (!isConnected || !address || !walletClient) {
      setLocalError("Connect your wallet to submit.");
      return;
    }
    if (internalExists) {
      setLocalError("Internal ID already used for this account. Choose another.");
      return;
    }
    if (!publicClient) {
      setLocalError("Network client not ready. Please refresh and try again.");
      return;
    }
    if (!s.siteId) { goEdit(2); return; }
    if (!formatActionDate(s)) { goEdit(2); return; }

    // Lock UI
    s.setPatch({ submitting: true, submitPhase: 'upload', submitError: null });
    const beforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);

    try {
      // Ensure wallet is on the expected chain; try to switch automatically
      const currentChainId = await publicClient.getChainId();
      if (currentChainId !== env.chainId) {
        try {
          await walletClient.switchChain({ id: env.chainId });
        } catch (e: any) {
          throw new Error(`Wrong network. Please switch to chain ${env.chainId} (OP Sepolia) in your wallet and try again.`);
        }
      }

      // 1) Upload file if any (track locally to avoid stale state reads)
      let cidLocal = s.fileCid || "";
      let urlLocal = s.fileUrl || "";
      if (s.fileBlob && !cidLocal) {
        const form = new FormData();
        form.append("file", s.fileBlob);
        if (s.fileName) form.append("name", s.fileName);
        const res = await fetch('/api/upload/ipfs', { method: 'POST', body: form });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
        cidLocal = String(json.cid || "");
        urlLocal = String(json.url || "");
        s.setPatch({ fileCid: cidLocal, fileUrl: urlLocal });
      }

      // 2) Preflight EAS address + build encoded data
      s.setPatch({ submitPhase: 'sign' });
      if (!env.easAddress || !/^0x[0-9a-fA-F]{40}$/.test(env.easAddress)) {
        throw new Error("EAS address is not configured. Set NEXT_PUBLIC_EAS_ADDRESS.");
      }
      const code = await publicClient.getBytecode({ address: env.easAddress as `0x${string}` });
      if (!code || code === '0x') {
        throw new Error(`No contract code at EAS address ${env.easAddress} on chain ${env.chainId}.`);
      }
      const schemaUid = (s.schemaUid || env.defaultSchemaUid) as `0x${string}`;
      if (!schemaUid) throw new Error('Schema UID is not configured. Set NEXT_PUBLIC_DEFAULT_SCHEMA_UID or choose one.');
      const recipient = (s.recipient || address) as `0x${string}`;
      const schemaString = "string organizationName,string[] reefRegenAction,string actionDate,string siteName,string siteType,string[] location,string locationType,string srs,uint256 siteDepthM,uint256 siteAreaSqM,string actionSummary,string[] biodiversity,string[] contributors,string fileName,string ipfsCID";
      const encoder = new SchemaEncoder(schemaString);
      const location = (s.siteCoords || []).map(String);
      const dataHex = encoder.encodeData([
        { name: 'organizationName', type: 'string', value: s.organizationName || '' },
        { name: 'reefRegenAction', type: 'string[]', value: (s.reefRegenActions || []) as any },
        { name: 'actionDate', type: 'string', value: formatActionDate(s) || '' },
        { name: 'siteName', type: 'string', value: s.siteName || '' },
        { name: 'siteType', type: 'string', value: s.siteType || '' },
        { name: 'location', type: 'string[]', value: (location as any) },
        { name: 'locationType', type: 'string', value: 'coordinate-decimal/lon-lat' },
        { name: 'srs', type: 'string', value: 'EPSG:4326' },
        { name: 'siteDepthM', type: 'uint256', value: BigInt(Math.round(Number(s.siteDepthM || 0))) },
        { name: 'siteAreaSqM', type: 'uint256', value: BigInt(Math.round(Number(s.siteAreaM2 || 0))) },
        { name: 'actionSummary', type: 'string', value: s.summary || '' },
        { name: 'biodiversity', type: 'string[]', value: ((s.species || []).map(x => x.scientificName) as any) },
        { name: 'contributors', type: 'string[]', value: ((s.contributors || []) as any) },
        { name: 'fileName', type: 'string', value: s.fileName || '' },
        { name: 'ipfsCID', type: 'string', value: cidLocal || '' },
      ]) as `0x${string}`;

      // 3) Use EAS SDK with an ethers Signer (mirrors AttestationForm)
      // Build an ethers.js Signer from embedded provider (preferred) or wagmi walletClient
      let signer: ethers.Signer | null = null;
      if (embeddedProvider) {
        const bp = new ethers.BrowserProvider(embeddedProvider as any);
        signer = await bp.getSigner();
      } else if (walletClient) {
        const eip1193 = { request: (args: any) => walletClient!.request(args) } as any;
        const bp = new ethers.BrowserProvider(eip1193);
        signer = await bp.getSigner();
      }
      if (!signer) throw new Error('No wallet signer available');
      const attesterAddr = await signer.getAddress();
      const eas = new EAS(env.easAddress as `0x${string}`);
      eas.connect(signer as any);
      const nonce = await eas.getNonce(attesterAddr);
      const nowSec = Math.floor(Date.now() / 1000);
      const deadline = BigInt(nowSec + 30 * 60); // extend TTL to 30 minutes to avoid slow-network expiries
      const delegated = await (await eas.getDelegated()).signDelegatedAttestation({
        schema: schemaUid,
        recipient,
        expirationTime: NO_EXPIRATION as unknown as bigint,
        revocable: true,
        refUID: ZERO_BYTES32 as `0x${string}`,
        data: dataHex,
        value: 0n,
        deadline,
        nonce,
      }, signer as any);

      // Align with AttestationForm: override message.deadline/nonce explicitly
      const delegatedPayload = {
        ...delegated,
        message: {
          ...delegated.message,
          deadline,
          nonce,
        },
      } as any;

      // Optional: small console debug to compare seconds
      try { console.debug('[ReviewSubmit] nowSec', nowSec, 'deadlineSec', String(deadline)); } catch {}

      // 4) Relay via worker; capture raw response on failure
      s.setPatch({ submitPhase: 'relay' });
      const payload = { attester: attesterAddr, delegatedAttestation: delegatedPayload };
      const resRelay = await fetch('/api/relay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)) });
      let jRelay: any = null;
      let rawText: string | null = null;
      try { jRelay = await resRelay.json(); } catch { rawText = await resRelay.text(); }
      if (!resRelay.ok || !jRelay?.uid) {
        const detail = jRelay?.error || rawText || `status ${resRelay.status}`;
        throw new Error(`Relay failed: ${detail}`);
      }
      const easUID = jRelay.uid as string;

      // 5) Finalize in DB
      const species = (s.species || []).map((x) => ({ taxon_id: x.taxonId, count: x.count ?? null }));
      const finalizeBody: any = {
        wallet_address: address,
        site_id: s.siteId,
        action_date: formatActionDate(s),
        summary: s.summary || null,
        contributors: s.contributors || [],
        reef_regen_action_names: s.reefRegenActions || [],
        species,
        eas_uid: easUID,
        internal_id: s.internalId || null,
      };
      if (cidLocal && urlLocal) finalizeBody.file = { cid: cidLocal, gateway_url: urlLocal, name: s.fileName };
      const resF = await fetch('/api/attestations/finalize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalizeBody) });
      const jF = await resF.json().catch(() => ({}));
      if (!resF.ok) throw new Error(jF?.error || `Finalize failed (${resF.status})`);

      // done
      s.reset();
      router.replace(`/submit/success?uid=${encodeURIComponent(easUID)}`);
    } catch (err: any) {
      console.error('Submit failed', err);
      s.setPatch({ submitError: err?.message || String(err), submitPhase: 'failed', submitting: false });
      setLocalError(err?.message || String(err));
    } finally {
      window.removeEventListener("beforeunload", beforeUnload);
    }
  }

  return (
    <div className="w-full max-w-[9600px] mx-auto py-6 px-4 md:px-2 pb-40">
      <div className="w-full max-w-[800px] flex flex-col items-center gap-3 mx-auto mb-6">
        <div className="text-center text-white text-5xl md:text-7xl font-black leading-[1.04]">Review your submission</div>
        <div className="text-center text-vulcan-100 text-2xl font-light leading-9">Please review your submission throughly as it is about to be submitted to the blockchain and will be permanent and uneditable by nature.</div>
      </div>

      <div className="flex flex-col gap-2 max-w-[600px] mx-auto">
        {/* Actions */}
        <section className="rounded-2xl bg-vulcan-800/60 outline outline-1 outline-vulcan-700/70 p-4 relative py-6">
          <div className="text-vulcan-300 text-base mb-4">Regen action(s)</div>
          <button aria-label="Edit actions" onClick={() => goEdit(1)} className="absolute right-3 top-3 text-white/70 hover:text-white"><i className="f7-icons">pencil_circle</i></button>
          <div className="flex flex-wrap gap-1">
            {(s.reefRegenActions || []).map((a) => {
              const c = classesForRegen(a);
              return <Tag key={a} label={a} size="md" bgClass={c.bg} textClass={c.text} />;
            })}
            {(!s.reefRegenActions || s.reefRegenActions.length === 0) && <div className="text-white/60">—</div>}
          </div>
        </section>

        {/* Date & Site — Row1: Date; Row2: Site | Type; Row3: Location | Depth/Area */}
        <section className="rounded-2xl bg-vulcan-800/60 outline outline-1 outline-vulcan-700/70 p-4 relative py-6">
          <button aria-label="Edit date & site" onClick={() => goEdit(2)} className="absolute right-3 top-3 text-white/70 hover:text-white"><i className="f7-icons">pencil_circle</i></button>

          {/* Row 1: Action date (full width) */}
          <div className="mb-4">
            <div className="text-vulcan-300 text-base mb-1">Action date</div>
            <div className="text-white text-xl font-black">{dateText || '—'}</div>
          </div>

          {/* Row 2: Site name | Site type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white/90 mb-2">
            <div>
              <div className="text-vulcan-300 text-base mb-1">At site</div>
              <div className="text-white text-xl font-black">{s.siteName || '—'}</div>
            </div>
            <div>
              <div className="text-vulcan-300 text-base mb-1">Site type</div>
              <div className="text-white text-xl font-black">
                {s.siteType ? s.siteType : '—'}
              </div>
            </div>
          </div>

          {/* Row 3: Location | Depth / Surface area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white/90">
            <div>
              <div className="text-vulcan-300 text-base mb-1">Location</div>
              <div className="text-white text-xl font-black">{s.siteCoords ? `${Number(s.siteCoords[1]).toFixed(6)}, ${Number(s.siteCoords[0]).toFixed(6)}` : '—'}</div>
            </div>
            <div>
              <div className="text-vulcan-300 text-base mb-1">Depth / Surface area</div>
              <div className="text-white text-xl font-black">{s.siteDepthM ?? '—'} m / {s.siteAreaM2 ?? '—'} m²</div>
            </div>
          </div>
        </section>

        {/* Summary & Attachment */}
        <section className="rounded-2xl bg-vulcan-800/60 outline outline-1 outline-vulcan-700/70 p-4 relative py-6">
          <button aria-label="Edit summary" onClick={() => goEdit(3)} className="absolute right-3 top-3 text-white/70 hover:text-white"><i className="f7-icons">pencil_circle</i></button>
          <div className="space-y-8">
            <div>
              <div className="text-vulcan-300 text-base mb-1">Summary</div>
              <div className="text-white/90 whitespace-pre-wrap text-lg font-bold">{s.summary || '—'}</div>
            </div>
            <div>
              <div className="text-vulcan-300 text-base mb-1">Attachment</div>
              <div className="text-white/90 text-base font-bold">{s.fileName || '—'}</div>
            </div>
          </div>
        </section>

        {/* Species */}
        <section className="rounded-2xl bg-vulcan-800/60 outline outline-1 outline-vulcan-700/70 p-4 relative py-6">
          <div className="text-vulcan-300 text-base mb-2">Coral Species</div>
          <button aria-label="Edit species" onClick={() => goEdit(4)} className="absolute right-3 top-3 text-white/70 hover:text-white"><i className="f7-icons">pencil_circle</i></button>
          <div className="flex flex-wrap gap-1">
            {(s.species || []).map((sp) => (
              <Tag key={sp.taxonId} label={`${sp.scientificName}${sp.count != null ? ` ${sp.count}` : ''}`} size="md" bgClass="bg-ribbon-300" textClass="text-vulcan-950" />
            ))}
            {(!s.species || s.species.length === 0) && <div className="text-white/60">—</div>}
          </div>
        </section>

        {/* Contributors */}
        <section className="rounded-2xl bg-vulcan-800/60 outline outline-1 outline-vulcan-700/70 p-4 relative py-6">
          <div className="text-vulcan-300 text-base mb-2">Contributors</div>
          <button aria-label="Edit contributors" onClick={() => goEdit(5)} className="absolute right-3 top-3 text-white/70 hover:text-white"><i className="f7-icons">pencil_circle</i></button>
          <div className="text-vulcan-100 text-lg font-bold">{(s.contributors || []).join(", ") || '—'}</div>
        </section>

        {/* Submitting as */}
        <section className="rounded-2xl bg-vulcan-800/60 outline outline-1 outline-vulcan-700/70 p-4 py-6">
          <div className="text-vulcan-300 text-base mb-2">You are submitting this attestation as</div>
          <div className="text-white text-xl font-black">{s.organizationName || '—'}</div>
        </section>

        {/* Internal ID */}
        <section className="rounded-2xl bg-transparent p-4 text-center">
          <div className="text-vulcan-700 text-2xl font-black mb-2">Internal ID</div>
          <div className="text-white/80 max-w-[800px] text-base mx-auto mb-4">For your convenience we’ve included this field to facilitate the matching to your internal documentation. You can for example include a project or spreadsheet/database row identifier.</div>
          <div className="max-w-[800px] mx-auto">
            <Input
              value={s.internalId || ''}
              onChange={(e) => {
                const v = e.target.value.slice(0, 40).replace(/[^A-Za-z0-9_\- ]+/g, '');
                s.setPatch({ internalId: v });
              }}
              placeholder="CORAL-113"
            />
            {internalExists && (
              <div className="mt-2 text-flamingo-300 text-sm">This internal ID is already used for your account.</div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="sticky bottom-2 left-0 right-0 pt-0 md:pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="w-full max-w-[960px] mx-auto rounded-3xl backdrop-blur-md bg-vulcan-800/70 outline outline-1 outline-vulcan-700/70 px-4 md:px-6 py-6 flex items-center justify-between gap-3">
          <div className="w-40 hidden md:block">
            <Button variant="outline" size="md" onClick={() => router.replace('/submit/steps/5')} className="w-40">Back</Button>
          </div>
          <div className="text-vulcan-400 text-sm font-light leading-6 text-center flex-1">Review & Submit</div>
          <div className="w-60 flex items-center justify-end">
            <Button type="button" disabled={s.submitting} onClick={handleSubmit} variant="solid" size="md" className="w-40">
              {s.submitting ? 'Submitting…' : 'Confirm submission'}
            </Button>
          </div>
        </div>
      </div>

      {localError && (
        <div className="mt-4 text-flamingo-300">{localError}</div>
      )}

      {s.submitting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-[560px] mx-auto rounded-2xl bg-vulcan-800 outline outline-1 outline-vulcan-700/70 p-6 text-center text-white">
            <div className="text-2xl font-bold mb-2">Submitting… Please keep this tab open.</div>
            <div className="text-white/70 mb-4">
              {s.submitPhase === 'upload' && 'Uploading your file to IPFS…'}
              {s.submitPhase === 'sign' && 'Requesting attestation signature…'}
              {s.submitPhase === 'relay' && 'Broadcasting to network…'}
              {s.submitPhase === 'failed' && 'Submission failed.'}
            </div>
            <div className="w-full h-2 bg-vulcan-700 rounded-full overflow-hidden">
              <div className={`h-full bg-orange transition-all duration-500 ${s.submitPhase==='upload'?'w-1/3': s.submitPhase==='sign'?'w-2/3': s.submitPhase==='relay'?'w-full':'w-0'}`}></div>
            </div>
            {s.submitError && <div className="text-flamingo-300 mt-3">{s.submitError}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
