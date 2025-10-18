"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useConnectors } from "wagmi";
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const { connect, isPending, error: connectError } = useConnect();
  const connectors = useConnectors();
  const { disconnect } = useDisconnect();
  const [web3AuthLoading, setWeb3AuthLoading] = useState(false);
  const [web3AuthError, setWeb3AuthError] = useState<string | null>(null);
  const { connect: connectWeb3Auth, loading: web3authLoadingHook, error: web3authError } = useWeb3AuthConnect();
  const { disconnect: disconnectWeb3Auth } = useWeb3AuthDisconnect();

  useEffect(() => setMounted(true), []);

  if (mounted && isConnected) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
        <button onClick={async () => { await disconnectWeb3Auth(); disconnect(); }}>
          Disconnect
        </button>
      </div>
    );
  }

  const injectedConnector = connectors.find((c) => c.id === "metaMask" || c.id === "injected");
  const web3authConnector = connectors.find((c) => c.id?.toLowerCase?.().includes("web3auth") || c.name?.toLowerCase?.().includes("web3auth"));

  const onConnectMetaMask = () => {
    if (injectedConnector) connect({ connector: injectedConnector });
  };

  const onConnectWeb3Auth = async () => {
    setWeb3AuthLoading(true);
    setWeb3AuthError(null);
    try {
      await connectWeb3Auth();
    } catch (error: any) {
      setWeb3AuthError(error?.message || "Failed to connect");
    } finally {
      setWeb3AuthLoading(false);
    }
  };

  const hasProvider = typeof window !== "undefined" && (window as any).ethereum;

  const friendly = (msg?: string | null) => {
    if (!msg) return null;
    if (msg.toLowerCase().includes("user rejected")) return "Request cancelled";
    return msg;
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        onClick={onConnectWeb3Auth}
        disabled={web3AuthLoading || isPending}
        style={{
          background: "#0364ff",
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "6px",
          cursor: web3AuthLoading ? "wait" : "pointer"
        }}
      >
        {web3AuthLoading ? "Connecting…" : "Connect Embedded Wallet"}
      </button>

      <div style={{ textAlign: "center", color: "#999", fontSize: "12px" }}>or</div>

      <button onClick={onConnectMetaMask} disabled={isPending || !injectedConnector}>
        {isPending ? "Connecting…" : injectedConnector ? `Connect ${injectedConnector.name}` : "No wallet found"}
      </button>

      {!hasProvider && (
        <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" style={{ fontSize: "12px", textAlign: "center" }}>
          Install MetaMask
        </a>
      )}

      {connectError && <div style={{ color: "#b00", fontSize: "12px" }}>{friendly(connectError.message)}</div>}
      {(web3AuthError || web3authError) && (
        <div style={{ color: "#b00", fontSize: "12px" }}>{friendly((web3AuthError || web3authError?.message) || null)}</div>
      )}
    </div>
  );
}
