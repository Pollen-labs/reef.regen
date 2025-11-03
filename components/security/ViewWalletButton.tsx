"use client";

import Button from "@/components/ui/Button";
import { useWeb3Auth, useWeb3AuthConnect } from "@web3auth/modal/react";

export default function ViewWalletButton({ label }: { label?: string }) {
  const { web3Auth, provider } = useWeb3Auth() as any;
  const { connect, loading: connecting } = useWeb3AuthConnect();

  const onClick = async () => {
    try {
      console.debug("[ViewWallet] click", { hasWeb3Auth: !!web3Auth });
      if (typeof web3Auth?.initModal === "function") {
        console.debug("[ViewWallet] initModal()");
        try { await web3Auth.initModal(); } catch {}
      }
      const svc = web3Auth?.walletServices;
      if (svc?.openWallet) { console.debug("[ViewWallet] walletServices.openWallet()"); await svc.openWallet(); return; }
      if (svc?.showWallet) { console.debug("[ViewWallet] walletServices.showWallet()"); await svc.showWallet(); return; }
      if (typeof web3Auth?.showWallet === "function") { console.debug("[ViewWallet] web3Auth.showWallet()"); await web3Auth.showWallet(); return; }
      if (typeof web3Auth?.openWallet === "function") { console.debug("[ViewWallet] web3Auth.openWallet()"); await web3Auth.openWallet(); return; }

      // If no wallet UI surface exists, try opening the Web3Auth modal by invoking connect()
      if (!provider && typeof connect === 'function') {
        console.debug("[ViewWallet] no wallet UI; calling connect() to open modal");
        try { await connect(); } catch (e) { console.warn('[ViewWallet] connect() failed', e); }
        // After connect, attempt wallet surfaces again
        const svc2 = web3Auth?.walletServices;
        if (svc2?.openWallet) { await svc2.openWallet(); return; }
        if (svc2?.showWallet) { await svc2.showWallet(); return; }
        if (typeof web3Auth?.showWallet === "function") { await web3Auth.showWallet(); return; }
        if (typeof web3Auth?.openWallet === "function") { await web3Auth.openWallet(); return; }
      }
      if ((web3Auth as any)?.modal?.open) { console.debug("[ViewWallet] web3Auth.modal.open() fallback"); await (web3Auth as any).modal.open(); return; }
      console.warn("[ViewWallet] No wallet UI surface available on web3Auth instance");
      window.alert("Open the Web3Auth wallet and use its UI.");
    } catch (e: any) {
      console.error("[ViewWallet] failed to open wallet UI", e);
      window.alert(e?.message || String(e) || "Failed to open wallet UI");
    }
  };

  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={connecting}>
      {connecting ? 'Opening…' : (label || "View my wallet")}
    </Button>
  );
}
