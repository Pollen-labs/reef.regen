"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/modal";
import { AttestationWizardProvider } from "@/lib/wizard/attestationWizardStore";
import { LeaveGuardProvider } from "@/hooks/useLeaveGuard";
import { useWeb3Auth, useWeb3AuthUser, useSwitchChain } from "@web3auth/modal/react";
import { useAccount } from "wagmi";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const web3AuthConfig = useMemo<Web3AuthContextConfig>(() => ({
      web3AuthOptions: {
      clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID as string,
      web3AuthNetwork:
        (process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK as any) || WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
      ssr: true,
      enableLogging: process.env.NODE_ENV === "development",
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
        mode: "dark",
      },
      walletServicesConfig: {
        confirmationStrategy: "auto-approve",
      } as any,
    },
  }), []);

  return (
    <Web3AuthProvider config={web3AuthConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <AttestationWizardProvider>
            <LeaveGuardProvider>
              <EnsureEmbeddedChain />
              <ProfileEmailSync />
              {children}
            </LeaveGuardProvider>
          </AttestationWizardProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}

// Silently switch the embedded wallet to Optimism mainnet on connect.
// Uses the SDK's switchChain() instead of raw wallet_switchEthereumChain RPC
// to avoid triggering a visible wallet popup for embedded wallets.
function EnsureEmbeddedChain() {
  const { isConnected } = useWeb3Auth();
  const { switchChain } = useSwitchChain();
  const attempted = useRef(false);

  useEffect(() => {
    if (!isConnected || attempted.current) return;
    attempted.current = true;
    switchChain("0xa").catch(() => {});
  }, [isConnected, switchChain]);
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
