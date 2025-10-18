"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useMemo, useState } from "react";
import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";

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
          rpcTarget: "https://optimism-sepolia.blockpi.network/v1/rpc/public",
          displayName: "OP Sepolia",
          ticker: "ETH",
          tickerName: "Ethereum",
          blockExplorerUrl: "https://sepolia-optimism.etherscan.io",
        },
      ],
      uiConfig: {
        appName: process.env.NEXT_PUBLIC_MM_DAPP_NAME || "Reef Impact Attest",
        mode: "light",
        loginMethodsOrder: ["google", "github", "twitter"],
      },
    },
  }), []);

  return (
    <Web3AuthProvider config={web3AuthConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>{children}</WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}
