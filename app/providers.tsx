"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { AttestationWizardProvider } from "@/lib/wizard/attestationWizardStore";
import { LeaveGuardProvider } from "@/hooks/useLeaveGuard";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const web3AuthConfig = useMemo<Web3AuthContextConfig>(() => ({
    web3AuthOptions: {
      clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID as string,
      web3AuthNetwork:
        (process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK as any) || WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
      ssr: true,
      chains: [
        {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0xAA37DC", // 11155420 OP Sepolia (hex)
          rpcTarget: process.env.NEXT_PUBLIC_RPC_URL || "https://optimism-sepolia.blockpi.network/v1/rpc/public",
          displayName: "OP Sepolia",
          ticker: "ETH",
          tickerName: "Ethereum",
          blockExplorerUrl: "https://sepolia-optimism.etherscan.io",
          logo: "https://images.toruswallet.io/eth.svg",
        },
      ],
      uiConfig: {
        appName: process.env.NEXT_PUBLIC_MM_DAPP_NAME || "Reef Impact Attest",
        mode: "dark",
        loginMethodsOrder: ["google", "github", "twitter"],
        // Optional: set to your logo if you want it shown inside modal
        // appLogo: "/assets/logo.svg",
      },
    },
  }), []);

  return (
    <Web3AuthProvider config={web3AuthConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <AttestationWizardProvider>
            <LeaveGuardProvider>
              {process.env.NEXT_PUBLIC_HIDE_WEB3AUTH_LAUNCHER === 'true' && (
                <HideWeb3AuthLauncher />
              )}
              {process.env.NEXT_PUBLIC_HIDE_WEB3AUTH_LAUNCHER === 'true' && (
                <style jsx global>{`
                  /* Hide Web3Auth floating launcher when feature flag is on */
                  /* Adjust selectors if your SDK uses different class names */
                  [class*="w3a-launcher"],
                  [class*="w3a__launcher"],
                  [data-testid="w3a-modal-button"],
                  .w3a-modal__launcher,
                  .w3a-widget__launcher {
                    display: none !important;
                  }
                `}</style>
              )}
              {children}
            </LeaveGuardProvider>
          </AttestationWizardProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}

function HideWeb3AuthLauncher() {
  useEffect(() => {
    const hide = () => {
      try {
        const candidates = Array.from(document.querySelectorAll('*')).filter((el) => {
          const anyEl = el as HTMLElement;
          const id = anyEl.id || '';
          const cls = anyEl.className?.toString() || '';
          const tag = anyEl.tagName || '';
          return /w3a|web3auth/i.test(id + ' ' + cls + ' ' + tag);
        });
        for (const el of candidates) {
          (el as HTMLElement).style.setProperty('display', 'none', 'important');
          (el as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
          (el as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
        }
      } catch {}
    };
    hide();
    const obs = new MutationObserver(() => hide());
    obs.observe(document.documentElement, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
  return null;
}
