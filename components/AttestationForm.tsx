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
    // DB fields
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
    fileCid: "",
    fileUrl: "",

    // EAS fields
    schemaUid: env.defaultSchemaUid || "",
    recipient: "",
    nonce: "",
    deadline: Math.floor(Date.now() / 1000) + 60 * 10
  });

  const publicClient = usePublicClient();

  const canSubmit = useMemo(() => {
    // Require Embedded Wallet connection for signing & relaying
    return isEmbeddedConnected && !!embeddedProvider && !!values.recipient && !!values.schemaUid;
  }, [isEmbeddedConnected, embeddedProvider, values.recipient, values.schemaUid]);

  function addDebug(msg: string) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    setDebugEvents((prev) => [line, ...prev].slice(0, 100));
  }

  // Build EAS encoded data for the deployed schema (v0.3 includes fileCID)
  const schemaString = "string regenType,string[] regenLocation,string regenDate,uint256 depthScaled,uint256 surfaceAreaScaled,string[] species,string summary,string[] contributors,string fileCID";
  const encodedData = useMemo(() => {
    try {
      const encoder = new SchemaEncoder(schemaString);
      const dateStr = values.actionDate
        ? (() => { const [y,m,d] = values.actionDate.split("-"); return `${m}-${d}-${y}`; })()
        : "";
      const depthScaled = values.depth === "" ? 0n : BigInt(Math.round(Number(values.depth) * 100));
      const areaScaled = values.surfaceArea === "" ? 0n : BigInt(Math.round(Number(values.surfaceArea) * 100));
      const species = values.speciesCsv.split(",").map(s => s.trim()).filter(Boolean);
      const contributors = values.contributorsCsv.split(",").map(s => s.trim()).filter(Boolean);
      const regenLocation = [values.lat, values.lng].filter(v => v !== "");
      const fileCidNorm = values.fileCid || "";
      return encoder.encodeData([
        { name: "regenType", type: "string", value: values.regenType },
        { name: "regenLocation", type: "string[]", value: regenLocation as any },
        { name: "regenDate", type: "string", value: dateStr },
        { name: "depthScaled", type: "uint256", value: depthScaled },
        { name: "surfaceAreaScaled", type: "uint256", value: areaScaled },
        { name: "species", type: "string[]", value: species as any },
        { name: "summary", type: "string", value: values.summary },
        { name: "contributors", type: "string[]", value: contributors as any },
        { name: "fileCID", type: "string", value: fileCidNorm },
      ]);
    } catch {
      return "0x";
    }
  }, [values.regenType, values.actionDate, values.lat, values.lng, values.depth, values.surfaceArea, values.speciesCsv, values.summary, values.contributorsCsv, values.fileCid]);

  function buildEncodedDataLocal(v: typeof values) {
    const encoder = new SchemaEncoder(schemaString);
    const dateStr = v.actionDate ? (() => { const [y,m,d] = v.actionDate.split("-"); return `${m}-${d}-${y}`; })() : "";
    const depthScaled = v.depth === "" ? 0n : BigInt(Math.round(Number(v.depth) * 100));
    const areaScaled = v.surfaceArea === "" ? 0n : BigInt(Math.round(Number(v.surfaceArea) * 100));
    const species = v.speciesCsv.split(",").map(s => s.trim()).filter(Boolean);
    const contributors = v.contributorsCsv.split(",").map(s => s.trim()).filter(Boolean);
    const regenLocation = [v.lat, v.lng].filter(x => x !== "");
    const fileCidNorm = v.fileCid || "";
    return encoder.encodeData([
      { name: "regenType", type: "string", value: v.regenType },
      { name: "regenLocation", type: "string[]", value: regenLocation as any },
      { name: "regenDate", type: "string", value: dateStr },
      { name: "depthScaled", type: "uint256", value: depthScaled },
      { name: "surfaceAreaScaled", type: "uint256", value: areaScaled },
      { name: "species", type: "string[]", value: species as any },
      { name: "summary", type: "string", value: v.summary },
      { name: "contributors", type: "string[]", value: contributors as any },
      { name: "fileCID", type: "string", value: fileCidNorm },
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
            const species = values.speciesCsv
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            const contributor_name = values.contributorsCsv
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            const crt = await fetch("/api/attestations/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                profile_id: profileId,
                regen_type: values.regenType,
                action_date: values.actionDate,
                location_lat: latNum,
                location_lng: lngNum,
                depth: depthNum,
                surface_area: areaNum,
                species,
                summary: values.summary || null,
                contributor_name,
                file_cid: cidLocal || null,
                file_gateway_url: urlLocal || null,
              })
            });
            const crtJson = await crt.json();
            if (crt.ok && crtJson.attestationId) attestationId = crtJson.attestationId as string;
            addDebug(`Draft create ${crt.ok ? "ok" : "fail"}; attestationId=${attestationId || ""}`);
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
      if (json.uid && (values.fileCid || values.fileUrl)) {
        try {
          await fetch("/api/attestations/set-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: json.uid as string,
              file_cid: values.fileCid || null,
              file_gateway_url: values.fileUrl || null,
            }),
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
        <legend className="body-lg font-semibold text-black px-2">Attestation Details (DB)</legend>
        <label className="block body-sm font-medium text-vulcan-700">
          Regeneration Type
          <select value={values.regenType} onChange={(e) => update("regenType", e.target.value)} className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500">
            <option value="transplantation">transplantation</option>
            <option value="nursery">nursery</option>
            <option value="other">other</option>
          </select>
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
            Latitude
            <input
              inputMode="decimal"
              value={values.lat}
              onChange={(e) => update("lat", e.target.value)}
              placeholder="e.g. 25.0343"
              required
              className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
            />
          </label>
          <label className="block body-sm font-medium text-vulcan-700">
            Longitude
            <input
              inputMode="decimal"
              value={values.lng}
              onChange={(e) => update("lng", e.target.value)}
              placeholder="e.g. -77.3963"
              required
              className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
            />
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
        <label className="block body-sm font-medium text-vulcan-700 mt-4">
          Species (comma separated)
          <input
            value={values.speciesCsv}
            onChange={(e) => update("speciesCsv", e.target.value)}
            placeholder="Elkhorn coral, Brain coral"
            className="mt-1 w-full px-3 py-2 border border-vulcan-300 rounded-lg body-base text-black focus:outline-none focus:ring-2 focus:ring-ribbon-500"
          />
        </label>
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
