"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { useAccount, useDisconnect } from "wagmi";
import { useLeaveGuard } from "@/hooks/useLeaveGuard";
import Button from "@/components/ui/Button";

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
  const { confirm, shouldBlock } = useLeaveGuard();
  const { connect: connectWeb3Auth, loading: web3authLoading } = useWeb3AuthConnect();
  const { disconnect: disconnectWeb3Auth } = useWeb3AuthDisconnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [profileHandle, setProfileHandle] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click / ESC
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuOpen) return;
      const t = e.target as Node | null;
      if (menuRef.current && t && !menuRef.current.contains(t)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenuOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

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

  function onNavClick(e: React.MouseEvent, href: string) {
    if (pathname?.startsWith("/submit") && shouldBlock) {
      e.preventDefault();
      confirm(() => router.push(href as Route));
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-black text-white">
      {/* Global announcement bar */}
      <div className="w-full bg-orange text-white h-6">
        <div className="w-full max-w-[1440px] mx-auto px-8 h-full flex items-center justify-center">
          <p className="text-xsb whitespace-nowrap overflow-x-auto text-center">
            This is a preview release, all attestation will be posted on testnet, please help us to test this app and let us know any bug or issues. - update on Nov 3,2025
          </p>
        </div>
      </div>
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
            onClick={(e) => onNavClick(e, "/map")}
          >
            Map
          </a>
          <a
            className={`px-4 py-2 text-xl font-bold leading-8 hover:text-white/90 ${
              pathname?.startsWith("/submit") ? "text-orange" : ""
            }`}
            href="/submit/steps/1"
            onClick={(e) => onNavClick(e, "/submit/steps/1")}
          >
            Submit
          </a>
          {isConnected ? (
            <div className="relative" ref={menuRef}>
              <button
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xl font-bold leading-8 rounded-xl hover:bg-white/10 ${pathname.startsWith("/profile") ? "text-orange" : ""}`}
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span>Profile</span>
                <i className="f7-icons text-base">arrowtriangle_down_fill</i>
              </button>
              
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-52 rounded-2xl bg-black/95 outline outline-1 outline-white/10 shadow-xl overflow-hidden"
                >
                 <a
                    role="menuitem"
                    className="block px-4 py-2 text-white text-lg font-bold hover:bg-white/10"
                    href={accountHref}
                    onClick={(e) => onNavClick(e, accountHref)}
                  >
                    View profile
                  </a>
                 <a
                    role="menuitem"
                    className="block px-4 py-2 text-white text-lg font-bold hover:bg-white/10"
                    href="/profile/setting"
                    onClick={(e) => onNavClick(e, "/profile/setting")}
                  >
                    Settings
                  </a>
                 <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2 text-white text-lg font-bold hover:bg-white/10"
                    onClick={async () => {
                      try { await disconnectWeb3Auth(); } catch {}
                      disconnect();
                      setMenuOpen(false);
                      try { localStorage.clear(); } catch {}
                      if (typeof window !== 'undefined') window.location.href = "/";
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={handleSignIn}
              disabled={web3authLoading}
              variant="outlineOrange"
              size="lg"
              className="leading-8"
            >
              {web3authLoading ? "Connecting..." : "Sign in"}
            </Button>
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
                href="/submit/steps/1"
                className={`px-4 py-2 text-xl font-bold leading-8 ${
                  pathname?.startsWith("/submit") ? "text-orange" : ""
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
                <Button
                  onClick={handleSignIn}
                  disabled={web3authLoading}
                  variant="outline"
                  size="md"
                  className="mt-2 leading-8"
                >
                  {web3authLoading ? "Connecting..." : "Sign in"}
                </Button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
