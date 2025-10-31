"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useAccount } from "wagmi";

/**
 * TopNav — Global sticky navigation
 *
 * Features:
 * - Dark theme (black background, white text)
 * - Logo + wordmark on the left
 * - Primary links: Map, Submit (NO Github per Figma design)
 * - AuthButton: Sign in / user menu
 * - Mobile: Hamburger menu opens slide-in sheet
 *
 * Styling matches Figma Dev Mode specs:
 * - px-8 py-6, items-end
 * - Dark bar (black token), white text
 * - CTA: Sign in (outline: 4px, offset -4, orange)
 */
export default function TopNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { connect: connectWeb3Auth, loading: web3authLoading } = useWeb3AuthConnect();
  const { isConnected, address } = useAccount();
  const [profileHandle, setProfileHandle] = useState<string | null>(null);

  // Fetch user's profile handle when connected
  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      if (!isConnected || !address) {
        setProfileHandle(null);
        return;
      }
      try {
        const res = await fetch(`/api/profiles/by-wallet?address=${address}`);
        const json = await res.json().catch(() => ({}));
        if (!cancelled) setProfileHandle(json?.handle || null);
      } catch {
        if (!cancelled) setProfileHandle(null);
      }
    }
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  const handleSignIn = async () => {
    try {
      if (!isConnected) {
        await connectWeb3Auth();
      }
      // After successful connect, go to onboarding setup step with return path
      const ret = encodeURIComponent(pathname || "/");
      router.push((`/profile/setup?redirect=${ret}`) as Route);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const accountHref = profileHandle ? `/profile/${profileHandle}` : "/profile/setup";

  return (
    <header className="sticky top-0 z-40 bg-black text-white">
      <div className="w-full max-w-[1440px] mx-auto px-8 py-6 flex justify-between items-end">
        {/* Left: Logo + Wordmark */}
        <a href="/" className="flex items-center gap-1">
          <img
            src="/assets/full-logo.svg"
            alt="Reef·Regen"
            className="h-16 w-auto"
          />
          <span className="sr-only">Reef·Regen</span>
        </a>

        {/* Right: Links + CTA (desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            className={`px-4 py-2 text-xl font-bold leading-8 hover:text-white/90 ${
              pathname === "/map" ? "text-orange" : ""
            }`}
            href="/map"
          >
            Map
          </a>
          <a
            className={`px-4 py-2 text-xl font-bold leading-8 hover:text-white/90 ${
              pathname === "/attest" ? "text-orange" : ""
            }`}
            href="/attest"
          >
            Submit
          </a>
          {isConnected ? (
            <a
              className={`px-4 py-2 text-xl font-bold leading-8 hover:text-white/90 ${
                pathname.startsWith("/profile") ? "text-orange" : ""
              }`}
              href={accountHref}
            >
              Account
            </a>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={web3authLoading}
              className="px-4 py-2 text-xl font-bold leading-8 rounded-2xl outline outline-4 outline-offset-[-4px] outline-orange hover:bg-white/5 disabled:opacity-50 disabled:cursor-wait"
            >
              {web3authLoading ? "Connecting..." : "Sign in"}
            </button>
          )}
        </nav>

        {/* Mobile trigger */}
        <button
          aria-label="Open menu"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/5"
          onClick={() => setOpen(true)}
        >
          <span aria-hidden>☰</span>
        </button>
      </div>

      {/* Mobile Sheet */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-80 bg-black p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="mb-6 rounded-lg px-3 py-2 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
            <nav className="grid gap-2">
              <a
                href="/map"
                className={`px-4 py-2 text-xl font-bold leading-8 ${
                  pathname === "/map" ? "text-orange" : ""
                }`}
              >
                Map
              </a>
              <a
                href="/attest"
                className={`px-4 py-2 text-xl font-bold leading-8 ${
                  pathname === "/attest" ? "text-orange" : ""
                }`}
              >
                Submit
              </a>
              {isConnected ? (
                <a
                  href={accountHref}
                  className={`mt-2 px-4 py-2 text-xl font-bold leading-8 ${
                    pathname.startsWith("/profile") ? "text-orange" : ""
                  }`}
                >
                  Account
                </a>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={web3authLoading}
                  className="mt-2 px-4 py-2 text-xl font-bold leading-8 rounded outline outline-4 outline-offset-[-4px] outline-orange disabled:opacity-50"
                >
                  {web3authLoading ? "Connecting..." : "Sign in"}
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
