"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { useAccount } from "wagmi";

export default function ExportPrivateKeyButton({ label }: { label?: string }) {
  const { provider, web3Auth } = useWeb3Auth() as any;
  const { connect, loading: connecting } = useWeb3AuthConnect();
  const { userInfo } = useWeb3AuthUser();
  const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hexPrivKey, setHexPrivKey] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [diag, setDiag] = useState<null | {
    origin: string;
    chainId?: string | number | null;
    address?: string | null;
    methods: Array<{ method: string; ok: boolean; value?: string; errorCode?: any; errorMessage?: string; raw?: string }>;
  }>(null);

  async function tryProgrammableExport(prov: any): Promise<string> {
    function normalizePrivKey(input: any): string | null {
      const pick = (val: any) => {
        if (typeof val !== 'string') return null;
        const s = val.trim().replace(/^"|"$/g, "");
        if (/^0x[0-9a-fA-F]{64}$/.test(s)) return s;
        if (/^[0-9a-fA-F]{64}$/.test(s)) return `0x${s}`;
        return null;
      };
      if (typeof input === 'string') return pick(input);
      if (input && typeof input === 'object') {
        return pick((input as any).privateKey || (input as any).privKey || "");
      }
      return null;
    }
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
        const norm = normalizePrivKey(v);
        if (norm) return norm;
      } catch (e: any) {
        lastErr = e;
        // eslint-disable-next-line no-console
        console.warn("[ExportKey] method failed", method, e);
      }
    }
    if (lastErr) throw lastErr;
    throw new Error("Programmable key export method not available on provider.");
  }

  async function runDiagnostics(prov: any) {
    const origin = typeof window !== "undefined" ? window.location.origin : "(ssr)";
    const methods = ["private_key", "eth_private_key", "wallet_exportPrivateKey", "wallet_getPrivateKey"];
    const results: Array<{ method: string; ok: boolean; value?: string; errorCode?: any; errorMessage?: string; raw?: string }> = [];
    let chainId: string | number | null = null;
    let address: string | null = null;
    try { chainId = await prov.request?.({ method: "eth_chainId" }); } catch {}
    try {
      const accts = await prov.request?.({ method: "eth_accounts" });
      if (Array.isArray(accts) && accts[0]) address = accts[0];
    } catch {}
    for (const m of methods) {
      try {
        const v = await prov.request?.({ method: m }).catch(async (e:any) => {
          if (m === 'private_key') {
            try { return await prov.request?.({ method: m, params: [] }); } catch {}
            try { return await prov.request?.({ method: m, params: [{ format: 'hex' }] }); } catch {}
            try { return await prov.request?.({ method: m, params: [{ reason: 'export' }] }); } catch {}
          }
          throw e;
        });
        const str = typeof v === "string" ? v : (v?.privateKey || v?.privKey || "");
        const rawStr = typeof str === "string" ? str : "";
        const s = rawStr.trim().replace(/^"|"$/g, "");
        const ok = /^0x[0-9a-fA-F]{64}$/.test(s) || /^[0-9a-fA-F]{64}$/.test(s);
        let raw: string | undefined;
        try { raw = JSON.stringify(v)?.slice(0, 160); } catch { raw = undefined; }
        const view = ok
          ? (s.startsWith('0x') ? `${s.slice(0, 6)}…${s.slice(-4)}` : `${s.slice(0, 3)}…${s.slice(-4)} (no 0x)`)
          : (rawStr ? "(non-hex)" : "");
        results.push({ method: m, ok, value: view, errorCode: undefined, errorMessage: undefined, raw });
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error(`[ExportKey][diag] ${m} error`, e);
        results.push({ method: m, ok: false, errorCode: e?.code, errorMessage: e?.message || String(e) });
      }
    }
    setDiag({ origin, chainId, address, methods: results });
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
      // eslint-disable-next-line no-console
      console.error("[ExportKey] export failed", e);
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

  const connectedAddr = useMemo(() => {
    const maybe = (userInfo as any)?.wallets?.[0]?.address || null;
    return maybe || null;
  }, [userInfo]);

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onClick} disabled={exporting || connecting}>
          {exporting || connecting ? "Exporting…" : (label || "Export private key")}
        </Button>
        {hexPrivKey && <span className="text-green-300 text-sm">Exported and copied</span>}
        <button type="button" className="text-xs text-vulcan-400 underline" onClick={async () => {
          setDebugOpen((v) => !v);
          try {
            let prov = provider || web3Auth?.provider || null;
            if (!prov && typeof connect === 'function') { try { await connect(); prov = web3Auth?.provider || null; } catch {} }
            if (prov) await runDiagnostics(prov);
          } catch {}
        }}>
          {debugOpen ? 'Hide debug' : 'Show debug'}
        </button>
      </div>
      {hexPrivKey && (
        <div className="text-xs text-vulcan-400 break-all">
          <span className="font-bold text-white/80">Private key (hex): </span>
          <span className="select-all">{hexPrivKey}</span>
        </div>
      )}
      {error && <div className="text-red-300 text-sm">{error}</div>}
      <div className="text-xs text-vulcan-500">Keep this key secret. Anyone with it can control your wallet.</div>

      {debugOpen && (
        <div className="mt-2 p-2 rounded-lg bg-vulcan-900/50 text-xs text-vulcan-300">
          <div>Origin: <span className="text-white/80">{typeof window !== 'undefined' ? window.location.origin : '(ssr)'}</span></div>
          <div>User (wagmi): <span className="text-white/80">{isWagmiConnected ? (wagmiAddress || '(unknown)') : '(not connected)'}</span></div>
          <div>User (web3auth): <span className="text-white/80">{connectedAddr || '(unknown)'}</span></div>
          {userInfo?.email && (
            <div>Email: <span className="text-white/80">{userInfo.email}</span></div>
          )}
          <div>Provider chainId: <span className="text-white/80">{diag?.chainId ?? '(unknown)'}</span></div>
          <div className="mt-1">Method checks:</div>
          <ul className="list-disc ml-4">
            {(diag?.methods || []).map((r) => (
              <li key={r.method}>
                <span className="text-white/80">{r.method}</span>: {r.ok ? <span className="text-green-300">ok</span> : <span className="text-red-300">fail</span>}
                {r.value ? <span> · {r.value}</span> : null}
                {!r.ok && (r.errorMessage ? <span> · {r.errorMessage}</span> : null)}
                {r.raw ? <div className="mt-0.5 text-white/50">raw: {r.raw}</div> : null}
              </li>
            ))}
          </ul>
          <div className="mt-1">
            <button
              type="button"
              className="px-2 py-1 rounded bg-vulcan-800 text-white"
              onClick={async () => {
                try { await navigator.clipboard.writeText(JSON.stringify(diag, null, 2)); } catch {}
              }}
            >
              Copy debug JSON
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="px-2 py-1 rounded bg-vulcan-800 text-white"
              onClick={async () => {
                try {
                  const prov = provider || web3Auth?.provider;
                  if (!prov) return;
                  await prov.request?.({ method: 'eth_requestAccounts' });
                  await runDiagnostics(prov);
                } catch (e) {
                  // ignore
                }
              }}
            >
              Request accounts & recheck
            </button>
          </div>
          <div className="mt-1">Tip: Ensure “Programmatic/Headless Key Export” is enabled for this project and this exact origin is allowlisted. Sign out and back in after changes.</div>
        </div>
      )}
    </div>
  );
}
