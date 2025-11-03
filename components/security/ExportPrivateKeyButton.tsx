"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useWeb3Auth, useWeb3AuthConnect } from "@web3auth/modal/react";

export default function ExportPrivateKeyButton({ label }: { label?: string }) {
  const { provider, web3Auth } = useWeb3Auth() as any;
  const { connect, loading: connecting } = useWeb3AuthConnect();

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hexPrivKey, setHexPrivKey] = useState<string | null>(null);

  async function tryProgrammableExport(prov: any): Promise<string> {
    // Try known method names exposed for headless key export
    const candidates = [
      "private_key",
      "eth_private_key",
      "wallet_exportPrivateKey",
      "wallet_getPrivateKey",
    ];
    let lastErr: any = null;
    for (const method of candidates) {
      try {
        // eslint-disable-next-line no-console
        console.debug("[ExportKey] trying method", method);
        const v = await prov.request?.({ method });
        if (typeof v === "string" && /^0x[0-9a-fA-F]{64}$/.test(v)) return v;
        if (v && typeof v?.privateKey === "string" && /^0x[0-9a-fA-F]{64}$/.test(v.privateKey)) return v.privateKey;
        if (v && typeof v?.privKey === "string" && /^0x[0-9a-fA-F]{64}$/.test(v.privKey)) return v.privKey;
      } catch (e: any) {
        lastErr = e;
        // eslint-disable-next-line no-console
        console.warn("[ExportKey] method failed", method, e);
      }
    }
    if (lastErr) throw lastErr;
    throw new Error("Programmable key export method not available on provider.");
  }

  function triggerFileDownload(filename: string, content: string) {
    try {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }

  const onClick = async () => {
    setError(null);
    setHexPrivKey(null);
    setExporting(true);
    try {
      let prov = provider;
      if (!prov) {
        // Ensure a session exists to access the embedded wallet provider
        try { await connect(); } catch {}
        prov = web3Auth?.provider || null;
      }
      if (!prov) throw new Error("Embedded wallet not available. Sign in first.");

      const keyHex = await tryProgrammableExport(prov);
      setHexPrivKey(keyHex);

      // Try to copy to clipboard
      try { await navigator.clipboard.writeText(keyHex); } catch {}

      // Offer a file download as well
      triggerFileDownload("reef_private_key.txt", `${keyHex}\n`);
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (/not supported|unsupported|does not exist|not available|Method not found/i.test(msg)) {
        setError("Programmable key export is unavailable. Enable it in your Embedded Wallet project and allowlist this origin, then sign out and back in.");
      } else if (/permission|denied|unauthorized/i.test(msg)) {
        setError("Access denied by wallet. Confirm programmatic export is enabled and try again.");
      } else {
        setError(msg);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onClick} disabled={exporting || connecting}>
          {exporting || connecting ? "Exporting…" : (label || "Export private key")}
        </Button>
        {hexPrivKey && <span className="text-green-300 text-sm">Exported and copied</span>}
      </div>
      {hexPrivKey && (
        <div className="text-xs text-vulcan-400 break-all">
          <span className="font-bold text-white/80">Private key (hex): </span>
          <span className="select-all">{hexPrivKey}</span>
        </div>
      )}
      {error && <div className="text-red-300 text-sm">{error}</div>}
      <div className="text-xs text-vulcan-500">Keep this key secret. Anyone with it can control your wallet.</div>
    </div>
  );
}

