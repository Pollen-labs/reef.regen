"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { attestationSchema } from "@/lib/validation";
import { useAccount, usePublicClient } from "wagmi";
import { useWeb3Auth } from "@web3auth/modal/react";
import { env } from "@/lib/env";
import { EAS, SchemaEncoder, ZERO_BYTES32, NO_EXPIRATION } from "@ethereum-attestation-service/eas-sdk";
import { EAS_GET_NONCE_ABI } from "@/lib/eas";
import { ethers } from "ethers";

const formSchema = attestationSchema;

export function AttestationForm() {
  const { address } = useAccount();
  const { isConnected: isEmbeddedConnected, provider: embeddedProvider } = useWeb3Auth();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { txHash?: string; uid?: string; error?: string }>(null);
  const [errors, setErrors] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugEvents, setDebugEvents] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<"idle"|"uploading"|"success"|"error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [values, setValues] = useState({
    // EAS v0.4 fields (UI-sourced)
    organizationName: "",
    reefRegenActionsCsv: "", // legacy input; superseded by multi-select below
    reefRegenActions: [] as string[],
    siteName: "",
    siteType: "",
    selectedSiteId: "",
    // DB fields (legacy)
    regenType: "other" as "transplantation" | "nursery" | "other",
    actionDate: (() => {
      const d = new Date();
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    })(),
    lat: "",
    lng: "",
    depth: "",
    surfaceArea: "",
    speciesCsv: "",
    summary: "",
    contributorsCsv: "",
    speciesSelected: [] as string[],
    speciesQuery: "",
    fileCid: "",
    fileUrl: "",

    // EAS fields
    schemaUid: env.defaultSchemaUid || "",
    recipient: "",
    nonce: "",
    deadline: Math.floor(Date.now() / 1000) + 60 * 10
  });

  const publicClient = usePublicClient();
  const [regenOptions, setRegenOptions] = useState<{ id: number; name: string }[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string; lon: number|string; lat: number|string; depthM: number|null; areaM2: number|null; siteType?: string }[]>([]);
  const [speciesOptions, setSpeciesOptions] = useState<{ id: number; name: string; common: string|null; label: string }[]>([]);

  const canSubmit = useMemo(() => {
    // Require Embedded Wallet connection for signing & relaying
    return isEmbeddedConnected && !!embeddedProvider && !!values.recipient && !!values.schemaUid;
  }, [isEmbeddedConnected, embeddedProvider, values.recipient, values.schemaUid]);

  function addDebug(msg: string) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    setDebugEvents((prev) => [line, ...prev].slice(0, 100));
  }

  // Build EAS encoded data for the deployed schema (v0.4)
  const LOCATION_TYPE = "coordinate-decimal/lon-lat" as const;
  const SRS = "EPSG:4326" as const;
  const schemaString = "string organizationName,string[] reefRegenAction,string actionDate,string siteName,string siteType,string[] location,string locationType,string srs,uint256 siteDepthM,uint256 siteAreaSqM,string actionSummary,string[] biodiversity,string[] contributors,string fileName,string ipfsCID";
  const encodedData = useMemo(() => {
    try {
      const encoder = new SchemaEncoder(schemaString);
      const actions = (values.reefRegenActions.length ? values.reefRegenActions : values.reefRegenActionsCsv.split(",").map(s => s.trim()).filter(Boolean));
      const biodiversity = (values.speciesSelected.length
        ? values.speciesSelected
        : values.speciesCsv.split(",").map(s => s.trim()).filter(Boolean));
      const contributors = values.contributorsCsv.split(",").map(s => s.trim()).filter(Boolean);
      const location = [values.lng, values.lat].filter(v => v !== ""); // [lon, lat]
      const depthInt = values.depth === "" ? 0n : BigInt(Math.round(Number(values.depth)));
      const areaInt = values.surfaceArea === "" ? 0n : BigInt(Math.round(Number(values.surfaceArea)));
      const fileName = selectedFile?.name || "";
      const ipfsCID = values.fileCid || "";
      return encoder.encodeData([
        { name: "organizationName", type: "string", value: values.organizationName },
        { name: "reefRegenAction", type: "string[]", value: actions as any },
        { name: "actionDate", type: "string", value: values.actionDate || "" },
        { name: "siteName", type: "string", value: values.siteName },
        { name: "siteType", type: "string", value: values.siteType },
        { name: "location", type: "string[]", value: location as any },
        { name: "locationType", type: "string", value: LOCATION_TYPE },
        { name: "srs", type: "string", value: SRS },
        { name: "siteDepthM", type: "uint256", value: depthInt },
        { name: "siteAreaSqM", type: "uint256", value: areaInt },
        { name: "actionSummary", type: "string", value: values.summary },
        { name: "biodiversity", type: "string[]", value: biodiversity as any },
        { name: "contributors", type: "string[]", value: contributors as any },
        { name: "fileName", type: "string", value: fileName },
        { name: "ipfsCID", type: "string", value: ipfsCID },
      ]);
    } catch {
      return "0x";
    }
  }, [values.organizationName, values.reefRegenActionsCsv, values.reefRegenActions, values.actionDate, values.siteName, values.siteType, values.lat, values.lng, values.depth, values.surfaceArea, values.speciesCsv, values.speciesSelected, values.summary, values.contributorsCsv, values.fileCid, selectedFile?.name]);

  function buildEncodedDataLocal(v: typeof values) {
    const encoder = new SchemaEncoder(schemaString);
    const actions = (v.reefRegenActions.length ? v.reefRegenActions : v.reefRegenActionsCsv.split(",").map(s => s.trim()).filter(Boolean));
    const biodiversity = (v.speciesSelected.length
      ? v.speciesSelected
      : v.speciesCsv.split(",").map(s => s.trim()).filter(Boolean));
    const contributors = v.contributorsCsv.split(",").map(s => s.trim()).filter(Boolean);
    const location = [v.lng, v.lat].filter(x => x !== ""); // [lon, lat]
    const depthInt = v.depth === "" ? 0n : BigInt(Math.round(Number(v.depth)));
    const areaInt = v.surfaceArea === "" ? 0n : BigInt(Math.round(Number(v.surfaceArea)));
    const fileName = selectedFile?.name || "";
    const ipfsCID = v.fileCid || "";
    return encoder.encodeData([
      { name: "organizationName", type: "string", value: v.organizationName },
      { name: "reefRegenAction", type: "string[]", value: actions as any },
      { name: "actionDate", type: "string", value: v.actionDate || "" },
      { name: "siteName", type: "string", value: v.siteName },
      { name: "siteType", type: "string", value: v.siteType },
      { name: "location", type: "string[]", value: location as any },
      { name: "locationType", type: "string", value: LOCATION_TYPE },
      { name: "srs", type: "string", value: SRS },
      { name: "siteDepthM", type: "uint256", value: depthInt },
      { name: "siteAreaSqM", type: "uint256", value: areaInt },
      { name: "actionSummary", type: "string", value: v.summary },
      { name: "biodiversity", type: "string[]", value: biodiversity as any },
      { name: "contributors", type: "string[]", value: contributors as any },
      { name: "fileName", type: "string", value: fileName },
      { name: "ipfsCID", type: "string", value: ipfsCID },
    ]);
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setSelectedFile(f);
    setUploadStatus("idle");
    setUploadError(null);
    // reset any previous CID/URL
    setValues((s) => ({ ...s, fileCid: "", fileUrl: "" }));
    addDebug(f ? `File selected: ${f.name} (${f.type || "unknown"}, ${f.size} bytes)` : "File cleared");
  }

  // Prefill recipient with connected address if empty
  useEffect(() => {
    if (address && !values.recipient) {
      setValues((s) => ({ ...s, recipient: address }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Prefill organization name from profile handle if available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!address || values.organizationName) return;
        const res = await fetch(`/api/profiles/by-wallet?address=${address}`);
        const json = await res.json();
        if (!cancelled && res.ok && (json?.name || json?.orgName || json?.handle) && !values.organizationName) {
          setValues((s) => ({ ...s, organizationName: (json.name || json.orgName || json.handle) as string }));
        }
      } catch {}
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Load regen types options
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/regen-types`);
        const json = await res.json();
        if (!cancelled && res.ok) setRegenOptions((json.items || []) as any);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Load user's sites and populate dropdown; also set lat/lng when selection changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!address) return;
        const res = await fetch(`/api/sites/by-wallet?address=${address}`);
        const json = await res.json();
        if (!cancelled && res.ok) setSites((json.items || []) as any);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [address]);

  // Query taxa search options (debounced on speciesQuery)
  useEffect(() => {
    let cancelled = false;
    const h = setTimeout(async () => {
      try {
        const q = values.speciesQuery.trim();
        if (q.length < 2) { if (!cancelled) setSpeciesOptions([]); return; }
        const res = await fetch(`/api/taxa/search?q=${encodeURIComponent(q)}&limit=20`);
        const json = await res.json();
        if (!cancelled && res.ok) setSpeciesOptions((json.items || []) as any);
      } catch {}
    }, 250);
    return () => { cancelled = true; clearTimeout(h); };
  }, [values.speciesQuery]);

  function onSelectRegenOptions(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setValues((s) => ({ ...s, reefRegenActions: selected }));
  }

  function onSelectSite(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setValues((s) => ({ ...s, selectedSiteId: id }));
    const site = sites.find((x) => x.id === id);
    if (site) {
      setValues((s) => ({
        ...s,
        siteName: site.name,
        siteType: site.siteType || s.siteType,
        // ensure string values for encoder
        lat: String(site.lat ?? ""),
        lng: String(site.lon ?? ""),
        depth: site.depthM != null ? String(site.depthM) : s.depth,
        surfaceArea: site.areaM2 != null ? String(site.areaM2) : s.surfaceArea,
      }));
    }
  }

  function addSpecies(name: string) {
    setValues((s) => ({
      ...s,
      speciesSelected: s.speciesSelected.includes(name) ? s.speciesSelected : [...s.speciesSelected, name],
      speciesQuery: "",
    }));
    setSpeciesOptions([]);
  }

  function removeSpecies(name: string) {
    setValues((s) => ({ ...s, speciesSelected: s.speciesSelected.filter((n) => n !== name) }));
  }

  // Fetch and display current chain nonce for attester
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!publicClient || !address) return;
        const chainNonce = (await publicClient.readContract({
          address: env.easAddress as `0x${string}`,
          abi: EAS_GET_NONCE_ABI as any,
          functionName: "getNonce",
          args: [address]
        })) as unknown as bigint;
        if (!cancelled) setValues((s) => ({ ...s, nonce: String(chainNonce) }));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient, address]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors(null);
    setResult(null);
    addDebug(`Env: chainId=${env.chainId}, easAddress=${env.easAddress}`);
    if (!env.easAddress || !/^0x[0-9a-fA-F]{40}$/.test(env.easAddress)) {
      setErrors("EAS address is not configured or invalid. Set NEXT_PUBLIC_EAS_ADDRESS to the EAS contract on your chain.");
      return;
    }
    // Ensure recipient defaults to connected address if missing
    const candidate = { ...values, recipient: values.recipient || (address ?? "") };
    const parsed = formSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }
    try {
      setSubmitting(true);
      // Only use Embedded Wallet provider from Web3Auth
      if (!isEmbeddedConnected || !embeddedProvider) {
        throw new Error("Embedded wallet not connected. Use 'Connect Embedded Wallet' first.");
      }
      let ethersProvider = new ethers.BrowserProvider(embeddedProvider as any);
      let signer = await ethersProvider.getSigner();
      let attesterAddr: string;

      // Preflight: confirm chain + contract code exists
      try {
        const net = await ethersProvider.getNetwork();
        const rawChainId = await (embeddedProvider as any).request?.({ method: "eth_chainId" }).catch(() => null);
        addDebug(`Network check: ethers.chainId=${net.chainId.toString()} raw=${String(rawChainId)}`);
        if (Number(net.chainId) !== Number(env.chainId)) {
          addDebug(`Wrong network. Connected=${net.chainId.toString()} expected=${env.chainId}. Attempting wallet_switchEthereumChain…`);
          const targetHex = "0x" + Number(env.chainId).toString(16);
          try {
            await (embeddedProvider as any).request?.({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: targetHex }],
            });
          } catch (swErr: any) {
            const msg = swErr?.message || String(swErr || "");
            addDebug(`Switch failed: ${msg}`);
            // If chain not added, try adding
            if ((swErr?.code === 4902) || /unrecognized|not added|4902/i.test(msg)) {
              try {
                await (embeddedProvider as any).request?.({
                  method: "wallet_addEthereumChain",
                  params: [{
                    chainId: targetHex,
                    chainName: "OP Sepolia",
                    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
                    rpcUrls: ["https://optimism-sepolia.blockpi.network/v1/rpc/public"],
                    blockExplorerUrls: ["https://sepolia-optimism.etherscan.io"],
                  }],
                });
                await (embeddedProvider as any).request?.({
                  method: "wallet_switchEthereumChain",
                  params: [{ chainId: targetHex }],
                });
              } catch (addErr: any) {
                addDebug(`Add chain failed: ${addErr?.message || String(addErr)}`);
              }
            }
          }
          // Re-instantiate provider & signer after (possible) chain change
          ethersProvider = new ethers.BrowserProvider(embeddedProvider as any);
          signer = await ethersProvider.getSigner();
          const net2 = await ethersProvider.getNetwork().catch((e:any)=>{ addDebug(`getNetwork after switch error: ${e?.message||String(e)}`); return null; });
          if (!net2 || Number(net2.chainId) !== Number(env.chainId)) {
            setErrors(`Wrong network. Connected chainId=${net2 ? net2.chainId.toString() : "(unknown)"} but expected ${env.chainId}.`);
            setSubmitting(false);
            return;
          }
          addDebug(`After switch: ethers.chainId=${net2.chainId.toString()}`);
        }
        const code = await ethersProvider.getCode(env.easAddress);
        addDebug(`Code at EAS address length=${code?.length || 0}`);
        if (!code || code === "0x") {
          setErrors(`No contract code at EAS address ${env.easAddress} on chain ${env.chainId}.`);
          setSubmitting(false);
          return;
        }
      } catch (preErr: any) {
        addDebug(`Preflight error: ${preErr?.message || String(preErr)}`);
      }

      attesterAddr = await signer.getAddress();

      const eas = new EAS(env.easAddress);
      eas.connect(signer as any);

      // Ensure on-chain nonce matches what we sign with
      let chainNonce: bigint;
      try {
        chainNonce = await eas.getNonce(attesterAddr);
      } catch (err: any) {
        const msg = "Failed to read nonce from EAS. Check NEXT_PUBLIC_EAS_ADDRESS and network (chainId 11155420).";
        addDebug(`${msg} Error: ${err?.message || String(err)}`);
        setErrors(msg);
        setSubmitting(false);
        return;
      }
      addDebug(`Connected ${attesterAddr}; chain nonce=${chainNonce.toString()}`);

      // Upload selected file now (pre-sign) if needed
      let cidLocal = values.fileCid || "";
      let urlLocal = values.fileUrl || "";
      if (selectedFile && !cidLocal) {
        setProgress("Uploading file to IPFS…");
        setUploadStatus("uploading");
        setUploadError(null);
        try {
          const form = new FormData();
          form.append("file", selectedFile);
          const resUp = await fetch("/api/storage/upload", { method: "POST", body: form });
          const upJson = await resUp.json();
          if (!resUp.ok) throw new Error(upJson.error || `Upload failed (${resUp.status})`);
          cidLocal = upJson.cid || "";
          urlLocal = upJson.url || "";
          // also store to state for preview/debug
          setValues((s) => ({ ...s, fileCid: cidLocal, fileUrl: urlLocal }));
          setUploadStatus("success");
          addDebug(`Upload ok; cid=${cidLocal}`);
        } catch (e: any) {
          setUploadStatus("error");
          setUploadError(e?.message || String(e));
          addDebug(`Upload error: ${e?.message || String(e)}`);
          throw e;
        }
      }

      // Encode data for schema (include CID if present)
      const dataHex = buildEncodedDataLocal({ ...values, fileCid: cidLocal });
      addDebug(`Encoded bytes length=${dataHex.length}`);

      // Compute a safe future deadline (>= now + 10 min)
      const nowSec = Math.floor(Date.now() / 1000);
      const desired = parsed.data.deadline || 0;
      const safeDeadlineSec = Math.max(desired, nowSec + 10 * 60);
      addDebug(`Deadline(s)=${safeDeadlineSec}`);

      // Upsert profile + create a draft attestation only if DB fields are valid (optional)
      let profileId: string | null = null;
      let attestationId: string | null = null;
      try {
        const latNum = Number(values.lat);
        const lngNum = Number(values.lng);
        const coordsOk = !Number.isNaN(latNum) && !Number.isNaN(lngNum) && values.lat !== "" && values.lng !== "";
        const hasDb = Boolean(values.actionDate && coordsOk);
        if (hasDb) {
          const up = await fetch("/api/profiles/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet_address: attesterAddr })
          });
          const upJson = await up.json();
          if (up.ok && upJson.profileId) profileId = upJson.profileId as string;
          addDebug(`Profile upsert ${up.ok ? "ok" : "fail"}; profileId=${profileId || ""}`);
          if (profileId) {
            const depthNum = values.depth === "" ? null : Number(values.depth);
            const areaNum = values.surfaceArea === "" ? null : Number(values.surfaceArea);
            const speciesCsvArr = values.speciesCsv
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            const species = Array.from(new Set([...(values.speciesSelected || []), ...speciesCsvArr]));
            const contributor_name = values.contributorsCsv
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            const crt = await fetch("/api/attestations/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                profile_id: profileId,
                action_date: values.actionDate,
                site_id: values.selectedSiteId || undefined,
                summary: values.summary || null,
                contributor_name,
                file_cid: cidLocal || null,
                file_gateway_url: urlLocal || null,
                file_name: selectedFile?.name || null,
                reef_regen_action_names: values.reefRegenActions,
                species_names: Array.from(new Set([...(values.speciesSelected || []), ...species]))
              })
            });
            const crtJson = await crt.json();
            if (crt.ok && crtJson.attestationId) attestationId = crtJson.attestationId as string;
            addDebug(`Draft create ${crt.ok ? "ok" : "fail"}; attestationId=${attestationId || ""}`);
            // Ensure IPFS fields persisted immediately on the draft row
            if (attestationId) {
              try {
                const updates: any = { attestation_id: attestationId };
                if (cidLocal) updates.file_cid = cidLocal;
                if (urlLocal) updates.file_gateway_url = urlLocal;
                if (selectedFile?.name) updates.file_name = selectedFile.name;
                const resSet = await fetch("/api/attestations/set-file", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updates),
                });
                addDebug(`Draft file set ${resSet.ok ? "ok" : "fail"}`);
              } catch {}
            }
          }
        }
      } catch {
        // Non-fatal: continue relay even if DB draft fails
      }

      // Sign delegated attestation via SDK
      setProgress("Awaiting wallet signature…");
      const delegated = await (await eas.getDelegated()).signDelegatedAttestation({
        schema: parsed.data.schemaUid as `0x${string}`,
        recipient: parsed.data.recipient as `0x${string}`,
        expirationTime: NO_EXPIRATION as unknown as bigint,
        revocable: true,
        refUID: ZERO_BYTES32 as `0x${string}`,
        data: dataHex as `0x${string}`,
        value: 0n,
        deadline: BigInt(safeDeadlineSec),
        nonce: chainNonce,
      }, signer as any);
      addDebug(`Signed delegated attestation (schema=${parsed.data.schemaUid})`);

      // Build a plain JSON-friendly payload that explicitly carries deadline/nonce as numbers/strings
      const delegatedPayload = {
        ...delegated,
        message: {
          ...delegated.message,
          deadline: BigInt(safeDeadlineSec),
          nonce: chainNonce,
        },
      } as any;

      const payload = {
        attester: attesterAddr as `0x${string}`,
        delegatedAttestation: delegatedPayload,
      };

      setProgress("Submitting transaction…");
      const res = await fetch("/api/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // JSON.stringify cannot serialize BigInt. Convert all bigint values to strings.
        body: JSON.stringify(payload, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Relay failed (${res.status})`);
      // Worker returns { uid }; edge function returned { txHash }
      setResult({ txHash: json.txHash, uid: json.uid });
      setProgress("Completed.");
      addDebug(`Relay ok: txHash=${json.txHash || ""}, uid=${json.uid || ""}`);

      // If we created a draft, store UID now
      if (attestationId && json.uid) {
        try {
          await fetch("/api/attestations/set-uid", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attestation_id: attestationId, uid: json.uid })
          });
          addDebug("DB updated with UID");
        } catch {}
      }

      // Ensure file CID/URL are persisted in DB even if we didn't create a draft earlier
      if (json.uid) {
        try {
          const updates: any = { uid: json.uid as string };
          if (values.fileCid) updates.file_cid = values.fileCid;
          if (values.fileUrl) updates.file_gateway_url = values.fileUrl;
          if (selectedFile?.name) updates.file_name = selectedFile.name;
          await fetch("/api/attestations/set-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
          addDebug("DB updated with file CID/URL");
        } catch {}
      }
    } catch (err: any) {
      setResult({ error: err?.message || String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  function update<K extends keyof typeof values>(key: K, v: string) {
    setValues((s) => ({ ...s, [key]: key === "deadline" ? Number(v) : v } as any));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <fieldset className="border border-vulcan-300 rounded-lg p-6">
        <legend className="body-lg font-semibold text-black px-2">Attestation Details</legend>
        {/* Organization name is sourced from the user's profile (org_name) during onboarding.
            We no longer show an editable field here to avoid duplication. */}
        <label className="block body-sm font-medium text-vulcan-700 mt-4">
          Reef Regen Actions
          <select
            multiple
            value={values.reefRegenActions}
            onChange={onSelectRegenOptions}
            className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500 h-32"
          >
            {regenOptions.map((o) => (
              <option key={o.id} value={o.name}>{o.name}</option>
            ))}
          </select>
          <span className="body-xs text-vulcan-500">Hold Cmd/Ctrl to select multiple</span>
        </label>
        <label className="block body-sm font-medium text-vulcan-700 mt-4">
          Action Date
          <input
            type="date"
            value={values.actionDate}
            onChange={(e) => update("actionDate", e.target.value)}
            required
            className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
          />
        </label>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="block body-sm font-medium text-vulcan-700">
            Site
            <select
              value={values.selectedSiteId}
              onChange={onSelectSite}
              className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
            >
              <option value="">Select a site…</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block body-sm font-medium text-vulcan-700">
              Site Name
              <input value={values.siteName} readOnly className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base bg-vulcan-50 text-vulcan-600" />
            </label>
            <label className="block body-sm font-medium text-vulcan-700">
              Site Type
              <input value={values.siteType} readOnly className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base bg-vulcan-50 text-vulcan-600" />
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="block body-sm font-medium text-vulcan-700">
            Latitude
            <input value={values.lat} readOnly className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base bg-vulcan-50 text-vulcan-600" />
          </label>
          <label className="block body-sm font-medium text-vulcan-700">
            Longitude
            <input value={values.lng} readOnly className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base bg-vulcan-50 text-vulcan-600" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="block body-sm font-medium text-vulcan-700">
            Depth (m)
            <input
              inputMode="decimal"
              value={values.depth}
              onChange={(e) => update("depth", e.target.value)}
              placeholder="optional"
              className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
            />
          </label>
          <label className="block body-sm font-medium text-vulcan-700">
            Surface Area (m²)
            <input
              inputMode="decimal"
              value={values.surfaceArea}
              onChange={(e) => update("surfaceArea", e.target.value)}
              placeholder="optional"
              className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
            />
          </label>
        </div>
        <div className="grid gap-2 mt-4">
          <label className="block body-sm font-medium text-vulcan-700">Biodiversity (search + select)</label>
          <input
            value={values.speciesQuery}
            onChange={(e) => setValues((s) => ({ ...s, speciesQuery: e.target.value }))}
            placeholder="Search taxa by scientific or common name…"
            className="w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
          />
          {!!speciesOptions.length && (
            <div className="border border-vulcan-200 rounded-md max-h-40 overflow-auto bg-white">
              {speciesOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => addSpecies(opt.name)}
                  className="w-full text-left px-3 py-2 hover:bg-vulcan-50 body-sm text-black"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {!!values.speciesSelected.length && (
            <div className="flex flex-wrap gap-2 mt-1">
              {values.speciesSelected.map((n) => (
                <span key={n} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-vulcan-100 text-vulcan-700 body-xs">
                  {n}
                  <button type="button" onClick={() => removeSpecies(n)} className="ml-1 text-vulcan-600 hover:text-black">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="body-xs text-vulcan-500">Optional fallback: comma separated</div>
          <input
            value={values.speciesCsv}
            onChange={(e) => update("speciesCsv", e.target.value)}
            placeholder="Elkhorn coral, Brain coral"
            className="w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
          />
        </div>
        <label className="block body-sm font-medium text-vulcan-700 mt-4">
          Summary
          <textarea
            value={values.summary}
            onChange={(e) => update("summary", e.target.value)}
            placeholder="Short description"
            rows={3}
            className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
          />
        </label>
        <label className="block body-sm font-medium text-vulcan-700 mt-4">
          Contributors (comma separated)
          <input
            value={values.contributorsCsv}
            onChange={(e) => update("contributorsCsv", e.target.value)}
            placeholder="Alice, Bob"
            className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
          />
        </label>
        <label className="block body-sm font-medium text-vulcan-700 mt-4">
          Evidence File (optional)
          <input type="file" onChange={onFileSelected} className="mt-1 w-full body-sm text-vulcan-700" />
          {(values.fileCid || values.fileUrl) && (
            <div className="mt-2 body-xs text-vulcan-600 bg-vulcan-50 p-2 rounded">
              {values.fileCid && <div>CID: {values.fileCid}</div>}
              {values.fileUrl && (
                <div>
                  <a href={values.fileUrl} target="_blank" rel="noreferrer" className="text-ribbon-600 hover:text-ribbon-700 underline">View file</a>
                </div>
              )}
            </div>
          )}
        </label>
      </fieldset>

      <fieldset className="border border-vulcan-300 rounded-lg p-6">
        <legend className="body-lg font-semibold text-black px-2">EAS Delegation</legend>
      <div className="body-sm text-vulcan-500 mb-3">
        Env default schema: {env.defaultSchemaUid || "(none)"}
      </div>
      {/* Removed inline wallet connect buttons; use the global WalletConnect component instead */}
      <label className="block body-sm font-medium text-vulcan-700">
        Schema UID
        <input
          value={values.schemaUid}
          onChange={(e) => update("schemaUid", e.target.value)}
          placeholder="0x…"
          required
          readOnly={Boolean(env.defaultSchemaUid)}
          className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500 read-only:bg-vulcan-50 read-only:text-vulcan-600"
        />
      </label>
      <label className="block body-sm font-medium text-vulcan-700 mt-4">
        Recipient Address
        <input
          value={values.recipient}
          onChange={(e) => update("recipient", e.target.value)}
          placeholder="0x…"
          required
          className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
        />
      </label>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="block body-sm font-medium text-vulcan-700">
            Site Name
            <input value={values.siteName} readOnly className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base bg-vulcan-50 text-vulcan-600" />
          </label>
          <label className="block body-sm font-medium text-vulcan-700">
            Site Type
            <input value={values.siteType} readOnly className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base bg-vulcan-50 text-vulcan-600" />
          </label>
        </div>
      <div className="mt-4">
        <p className="body-sm font-medium text-vulcan-700 mb-1">Encoded data (auto):</p>
        <pre className="whitespace-pre-wrap break-all bg-vulcan-50 p-3 rounded-lg body-xs text-vulcan-700 font-mono">
          {encodedData}
        </pre>
      </div>
      <label className="block body-sm font-medium text-vulcan-700 mt-4">
        Nonce (auto from chain)
        <input value={values.nonce} readOnly className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base bg-vulcan-50 text-vulcan-600" />
      </label>
      <label className="block body-sm font-medium text-vulcan-700 mt-4">
        Deadline (unix seconds)
        <input
          type="number"
          value={values.deadline}
          onChange={(e) => update("deadline", e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
        />
      </label>
      </fieldset>
      {progress && (
        <div className="body-sm text-ribbon-700 bg-ribbon-50 p-4 rounded-lg border border-ribbon-200">{progress}</div>
      )}
      <details open={debugOpen} onToggle={(e) => setDebugOpen((e.target as HTMLDetailsElement).open)} className="border border-vulcan-200 rounded-lg p-4">
        <summary className="body-sm font-semibold text-vulcan-700 cursor-pointer">Debug</summary>
        <div className="body-xs grid gap-2 mt-3">
          <div className="text-vulcan-600">Upload status: {uploadStatus}{uploadError ? ` — ${uploadError}` : ""}</div>
          {(values.fileCid || values.fileUrl) && (
            <div className="text-vulcan-600">
              {values.fileCid && <div>CID: {values.fileCid}</div>}
              {values.fileUrl && <div>URL: {values.fileUrl}</div>}
            </div>
          )}
          <div className="text-vulcan-700 font-medium">Events:</div>
          <pre className="whitespace-pre-wrap break-words bg-vulcan-50 p-3 rounded max-h-40 overflow-auto font-mono text-vulcan-600">
            {debugEvents.join("\n") || "(no events yet)"}
          </pre>
        </div>
      </details>
      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="w-full px-6 py-3 bg-flamingo-400 text-white body-base font-semibold rounded-lg hover:bg-flamingo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting…" : "Sign & Relay"}
      </button>
      {errors && <div className="body-sm text-flamingo-600 bg-flamingo-50 p-4 rounded-lg border border-flamingo-200">{errors}</div>}
      {result?.txHash && (
        <div className="body-sm text-aquamarine-800 bg-aquamarine-50 p-4 rounded-lg border border-aquamarine-200">
          <p className="font-semibold mb-1">Submitted. Tx Hash: {result.txHash}</p>
          <a
            href={`https://optimism-sepolia.easscan.org/tx/${result.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-aquamarine-600 hover:text-aquamarine-700 underline"
          >
            View in EAS Explorer
          </a>
        </div>
      )}
      {result?.uid && (
        <div className="body-sm text-aquamarine-800 bg-aquamarine-50 p-4 rounded-lg border border-aquamarine-200">
          <p className="font-semibold mb-1">Attestation UID: {result.uid}</p>
          <a
            href={`https://optimism-sepolia.easscan.org/attestation/view/${result.uid}`}
            target="_blank"
            rel="noreferrer"
            className="text-aquamarine-600 hover:text-aquamarine-700 underline"
          >
            View Attestation
          </a>
        </div>
      )}
      {result?.error && <div className="body-sm text-flamingo-600 bg-flamingo-50 p-4 rounded-lg border border-flamingo-200">{result.error}</div>}
    </form>
  );
}
