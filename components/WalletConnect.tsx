"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
import Button from "@/components/ui/Button";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const { disconnect } = useDisconnect();
  const [web3AuthLoading, setWeb3AuthLoading] = useState(false);
  const [web3AuthError, setWeb3AuthError] = useState<string | null>(null);
  const { connect: connectWeb3Auth, loading: web3authLoadingHook, error: web3authError } = useWeb3AuthConnect();
  const { disconnect: disconnectWeb3Auth } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const [emailSaved, setEmailSaved] = useState(false);

  useEffect(() => setMounted(true), []);

  if (mounted && isConnected) {
    // Fire-and-forget email upsert when connected and we have userInfo
    if (!emailSaved && userInfo?.email && address) {
      (async () => {
        try {
          await fetch("/api/profiles/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet_address: address, email: userInfo.email }),
          });
        } finally {
          setEmailSaved(true);
        }
      })();
    }
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>Connected: {address?.slice(0, 6)}...{address?.slice(-5)}</span>
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
    <div className="grid gap-2">
      <Button onClick={onConnectWeb3Auth} disabled={web3AuthLoading || web3authLoadingHook} size="lg" variant="solid">
        {web3AuthLoading || web3authLoadingHook ? "Connecting…" : "Sign in"}
      </Button>
      {(web3AuthError || web3authError) && (
        <div className="text-red-300 text-sm">{friendly((web3AuthError || (web3authError as any)?.message) || null)}</div>
      )}
    </div>
  );
}
