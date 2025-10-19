"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
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

  const friendly = (msg?: string | null) => {
    if (!msg) return null;
    if (msg.toLowerCase().includes("user rejected")) return "Request cancelled";
    return msg;
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        onClick={onConnectWeb3Auth}
        disabled={web3AuthLoading || web3authLoadingHook}
        style={{
          background: "#0364ff",
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "6px",
          cursor: web3AuthLoading ? "wait" : "pointer"
        }}
      >
        {web3AuthLoading || web3authLoadingHook ? "Connecting…" : "Connect Embedded Wallet"}
      </button>
      {(web3AuthError || web3authError) && (
        <div style={{ color: "#b00", fontSize: "12px" }}>{friendly((web3AuthError || web3authError?.message) || null)}</div>
      )}
    </div>
  );
}
