"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useWeb3Auth, useWeb3AuthConnect } from "@web3auth/modal/react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function RevealPrivateKeyModal({ open, onClose }: Props) {
  const { provider, web3Auth } = useWeb3Auth() as any;
  const { connect, loading } = useWeb3AuthConnect();

  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hexKey, setHexKey] = useState<string | null>(null);

  // Hold-to-reveal state
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      stopHold();
      setError(null);
      setRevealed(false);
      setHexKey(null);
    }
  }, [open]);

  function startHold() {
    if (holding) return;
    setHolding(true);
    setProgress(0);
    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / 2000) * 100));
      setProgress(pct);
      if (pct >= 100) {
        stopHold();
        onReveal();
      }
    }, 30);
  }
  function stopHold() {
    setHolding(false);
    setProgress((p) => (p >= 100 ? p : 0));
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function exportKey() {
    function normalize(input: any): string | null {
      const pick = (v: any) => {
        if (typeof v !== 'string') return null;
        const s = v.trim().replace(/^"|"$/g, "");
        if (/^0x[0-9a-fA-F]{64}$/.test(s)) return s;
        if (/^[0-9a-fA-F]{64}$/.test(s)) return `0x${s}`;
        return null;
      };
      if (typeof input === 'string') return pick(input);
      if (input && typeof input === 'object') return pick(input.privateKey || input.privKey || "");
      return null;
    }
    let prov = provider;
    if (!prov) {
      try { await connect(); } catch {}
      prov = web3Auth?.provider || null;
    }
    if (!prov) throw new Error("Embedded wallet not available. Sign in first.");
    const methods = ["private_key", "eth_private_key", "wallet_exportPrivateKey", "wallet_getPrivateKey"];
    let lastErr: any = null;
    for (const m of methods) {
      try {
        const v = await prov.request?.({ method: m });
        const k = normalize(v);
        if (k) return k;
      } catch (e: any) { lastErr = e; }
    }
    if (lastErr) throw lastErr;
    throw new Error("Programmable export method not available on provider.");
  }

  async function onReveal() {
    setError(null);
    try {
      const k = await exportKey();
      setHexKey(k);
      setRevealed(true);
      try { await navigator.clipboard.writeText(k); } catch {}
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (/not supported|unsupported|does not exist|not available|Method not found/i.test(msg)) {
        setError("Programmable key export is unavailable. Enable it in your Embedded Wallet project and allowlist this origin, then sign out and back in.");
      } else if (/permission|denied|unauthorized/i.test(msg)) {
        setError("Access denied by wallet. Confirm programmatic export is enabled and try again.");
      } else setError(msg);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-[580px] max-w-[90vw] rounded-[28px] bg-vulcan-900 p-6 md:p-8 text-white">
        <div className="mb-6 grid gap-4">
          <div className="text-h4 font-black text-center text-orange">Important notice</div>
          <div className="text-vulcan-100 text-xl text-center">
            Your <b>private key</b> is your cryptographic identity, it’s what allows you to interact securely with the blockchain.
            You <b>alone</b> are responsible for keeping it safe. Anyone with access to your private key can control your wallet and assets.
            <br />
            <br />
            Please make sure you understand the risks before revealing your key.
          </div>
        </div>

        {!revealed ? (
          <div className="grid gap-3">
            {error && <div className="text-red-300 text-sm">{error}</div>}
            <button
              type="button"
              onMouseDown={startHold}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={startHold}
              onTouchEnd={stopHold}
              className="relative overflow-hidden rounded-2xl bg-orange text-white font-black text-lg px-4 py-3"
              aria-label="Hold to reveal"
            >
              <span className="relative z-10">Hold to reveal</span>
              <span
                className="absolute left-0 top-0 bottom-0 bg-white/25"
                style={{ width: `${progress}%` }}
                aria-hidden
              />
            </button>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 bg-vulcan-800 rounded-2xl px-4 py-3">
              <input
                type="text"
                readOnly
                value={hexKey || ""}
                className="flex-1 bg-transparent outline-none text-white font-mono text-sm"
              />
              <button
                type="button"
                className="rounded-lg px-2 py-1 hover:bg-white/10"
                onClick={async () => { try { await navigator.clipboard.writeText(hexKey || ""); } catch {} }}
                aria-label="Copy private key"
              >
                <i className="f7-icons text-2xl">doc_on_doc</i>
              </button>
            </div>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </div>
  );
}
