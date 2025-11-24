"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { AttestationWizardProvider } from "@/lib/wizard/attestationWizardStore";
import { LeaveGuardProvider } from "@/hooks/useLeaveGuard";
import { useWeb3Auth, useWeb3AuthUser } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
import { env } from "@/lib/env";

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
          chainId: "0xa", // 10 Optimism mainnet (hex)
          rpcTarget: process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.optimism.io",
          displayName: "Optimism",
          ticker: "ETH",
          tickerName: "Ethereum",
          blockExplorerUrl: "https://optimistic.etherscan.io",
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
              {process.env.NEXT_PUBLIC_AUTO_SWITCH_ON_CONNECT !== 'false' && (
                <EnsureEmbeddedChain />
              )}
              <ProfileEmailSync />
              {children}
            </LeaveGuardProvider>
          </AttestationWizardProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}

function EnsureEmbeddedChain() {
  const { provider, isConnected } = useWeb3Auth() as any;
  const attempted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!provider || !isConnected || attempted.current) return;
    (async () => {
      try {
        const target = Number(env.chainId || 0);
        if (!target) return;
        const currentHex = await provider.request?.({ method: "eth_chainId" }).catch(() => null);
        const current = currentHex ? Number(currentHex) : 0;
        if (current === target) return;
        const chainIdHex = "0x" + target.toString(16);
        try {
          await provider.request?.({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
        } catch (e: any) {
          const msg = e?.message || String(e || "");
          if ((e?.code === 4902) || /unrecognized|not added|4902/i.test(msg)) {
            try {
              await provider.request?.({
                method: "wallet_addEthereumChain",
                params: [{
                  chainId: chainIdHex,
                  chainName: "Optimism",
                  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
                  rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.optimism.io"],
                  blockExplorerUrls: ["https://optimistic.etherscan.io"],
                }],
              });
              await provider.request?.({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
            } catch {}
          }
        }
      } finally {
        if (!cancelled) attempted.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, [provider, isConnected]);
  return null;
}

function ProfileEmailSync() {
  const { userInfo } = useWeb3AuthUser();
  const { address, isConnected } = useAccount();
  const sentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) return;
    const key = `${address.toLowerCase()}|${userInfo?.email || ''}`;
    if (!userInfo?.email || sentRef.current === key) return;
    sentRef.current = key;
    (async () => {
      try {
        await fetch("/api/profiles/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet_address: address, email: userInfo.email }),
        });
      } catch {}
    })();
  }, [isConnected, address, userInfo?.email]);
  return null;
}
