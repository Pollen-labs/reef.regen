"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const isMapPage = pathname === "/map";
  const router = useRouter();
  const { confirm, shouldBlock } = useLeaveGuard();
  const { connect: connectWeb3Auth, loading: web3authLoading } = useWeb3AuthConnect();
  const { disconnect: disconnectWeb3Auth } = useWeb3AuthDisconnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [profileHandle, setProfileHandle] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuAnim, setMenuAnim] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const hideTimeout = useRef<number | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  // Scroll-aware behavior: hide on scroll down, show on scroll up
  useEffect(() => {
    if (isMapPage) {
      setIsVisible(true);
      return;
    }
    if (typeof window === 'undefined') return;

    // initialize last scroll in case user is not at top
    lastScrollY.current = window.scrollY || 0;

    // Mobile detection: use more aggressive thresholds for mobile
    const isMobile = () => window.innerWidth < 768; // md breakpoint
    
    // Mobile: more aggressive (hide faster), Desktop: current behavior
    const getThreshold = () => isMobile() ? 8 : 16; // px delta before considering a direction change
    const getMinHideY = () => isMobile() ? 50 : 200; // only hide after passing this scroll position
    const getHideDelay = () => isMobile() ? 50 : 200; // delay before hiding (ms)
    
    let ticking = false;

    const onScroll = () => {
      const run = () => {
        const y = window.scrollY;
        const delta = y - lastScrollY.current;
        const THRESHOLD = getThreshold();
        const MIN_HIDE_Y = getMinHideY();
        const HIDE_DELAY = getHideDelay();

        // ignore micro scrolls
        if (Math.abs(delta) < THRESHOLD) {
          ticking = false;
          return;
        }

        // always show near top or on scroll up
        if (y <= 0 || delta < 0) {
          if (hideTimeout.current) {
            window.clearTimeout(hideTimeout.current);
            hideTimeout.current = null;
          }
          setIsVisible(true);
        } else if (delta > 0 && y > MIN_HIDE_Y) {
          // scrolling down past threshold and minimum position: delay hide slightly
          if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
          hideTimeout.current = window.setTimeout(() => {
            setIsVisible(false);
          }, HIDE_DELAY);
        }

        lastScrollY.current = y;
        ticking = false;
      };

      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(run);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
    };
  }, [isMapPage]);

  // Keep nav visible when mobile menu is open
  useEffect(() => {
    if (open) setIsVisible(true);
  }, [open]);

  // Measure header height and expose CSS var for layout padding
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = headerRef.current;
    if (!el) return;

    const setVar = () => {
      const h = el.offsetHeight;
      document.documentElement.style.setProperty('--topnav-height', `${h}px`);
    };

    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    window.addEventListener('resize', setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setVar);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = prev || '';
    return () => { document.body.style.overflow = prev || ''; };
  }, [open]);

  // Subtle fade/slide animation for mobile menu
  useEffect(() => {
    setMounted(true);
    if (open) {
      const id = requestAnimationFrame(() => setMenuAnim(true));
      return () => cancelAnimationFrame(id);
    }
    setMenuAnim(false);
  }, [open]);

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
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-40 bg-black text-white ${
        open ? '' : 'will-change-transform transition-transform'
      } ${
        open ? '' : ((isVisible || isMapPage) ? 'translate-y-0' : '-translate-y-full')
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)', // easeOutCubic
        transitionDuration: isMapPage ? '0ms' : (isVisible ? '350ms' : '550ms'),
        // Avoid creating a transformed containing block when mobile menu is open
        transform: open ? 'none' as any : undefined,
      }}
    >
      {/* Global announcement bar */}
      <div className="w-full bg-orange text-white">
        <div className="w-full px-6 md:px-10 py-1 flex items-center justify-center">
          <p className="text-xsb text-center break-words">
            Preview release, testnet only, please help us to find any bugs. - update on Nov 6, 2025
          </p>
        </div>
      </div>
      <div className="w-full px-6 md:px-4 py-6  md:py-4 flex justify-between items-end">
        {/* Left: Logo + Wordmark */}
        <a href="/" className="flex items-center gap-1 -m-2 p-2 md:m-0 md:p-0 rounded-2xl hover:bg-white/5">
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
            Explore
          </a>
          {pathname?.startsWith("/submit") ? (
            <span
              className="px-4 py-2 text-xl font-bold leading-8 text-orange cursor-default select-none"
              aria-current="page"
              aria-disabled="true"
            >
              Submit
            </span>
          ) : (
            <a
              className="px-4 py-2 text-xl font-bold leading-8 hover:text-white/90"
              href="/submit/steps/1"
              onClick={(e) => onNavClick(e, "/submit/steps/1")}
            >
              Submit
            </a>
          )}
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
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-black/95 outline outline-1 outline-white/10 shadow-xl overflow-hidden"
                >
                 <a
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2 text-white text-lg font-bold hover:bg-white/10"
                    href={accountHref}
                    onClick={(e) => onNavClick(e, accountHref)}
                  >
                    <i className="f7-icons text-lg">smiley</i>
                    <span>View profile</span>
                  </a>
                 <a
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2 text-white text-lg font-bold hover:bg-white/10"
                    href="/profile/setting"
                    onClick={(e) => onNavClick(e, "/profile/setting")}
                  >
                    <i className="f7-icons text-lg">gear_alt</i>
                    <span>Settings</span>
                  </a>
                 <button
                    role="menuitem"
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-white text-lg font-bold hover:bg-white/10"
                    onClick={async () => {
                      try { await disconnectWeb3Auth(); } catch {}
                      disconnect();
                      setMenuOpen(false);
                      try { localStorage.clear(); } catch {}
                      if (typeof window !== 'undefined') window.location.href = "/";
                    }}
                  >
                    <i className="f7-icons text-lg">arrow_right_to_line_alt</i>
                    <span>Log out</span>
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
          className="md:hidden inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20"
          onClick={() => setOpen(true)}
        >
          <span aria-hidden className="text-2xl leading-none">≡</span>
        </button>
      </div>

      {/* Mobile Fullscreen Menu (Portal to body to avoid double backgrounds / stacking glitches) */}
      {open && mounted && createPortal(
        <div
          className={`md:hidden fixed inset-0 z-[1000] bg-black transition-opacity duration-200 ease-out ${menuAnim ? 'opacity-100' : 'opacity-0'}`}
          role="dialog"
          aria-modal="true"
        >
          <div className={`flex h-full flex-col px-6 md:px-4 py-6 md:py-4 transition-transform duration-200 ease-out ${menuAnim ? 'translate-y-0' : 'translate-y-1'}` }>
            {/* Top row: logo + close */}
            <div className="flex items-center justify-between">
              <a href="/" onClick={() => setOpen(false)} className="flex items-center gap-1 -m-2 p-2 rounded-2xl hover:bg-white/5">
                <img
                  src="/assets/full-logo.svg"
                  alt="Reef·Regen"
                  className="h-16 w-auto"
                />
                <span className="sr-only">Reef·Regen</span>
              </a>
              <button
                aria-label="Close menu"
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20"
                onClick={() => setOpen(false)}
              >
                <span className="text-2xl leading-none">×</span>
              </button>
            </div>

            {/* Menu links */}
            <nav className="flex-1 w-full flex items-center justify-end">
              <div className="text-right space-y-6">
                <a
                  href="/map"
                  onClick={(e) => { onNavClick(e, "/map"); setOpen(false); }}
                  className={`block text-4xl font-extrabold ${pathname === "/map" ? "text-orange" : "text-white hover:text-white/80"}`}
                >
                  Explore
                </a>
                {pathname?.startsWith("/submit") ? (
                  <span className="block text-4xl font-extrabold text-orange cursor-default select-none" aria-current="page" aria-disabled="true">Submit</span>
                ) : (
                  <a
                    href="/submit/steps/1"
                    onClick={(e) => { onNavClick(e, "/submit/steps/1"); setOpen(false); }}
                    className="block text-4xl font-extrabold text-white hover:text-white/80"
                  >
                    Submit
                  </a>
                )}

                {isConnected ? (
                  <>
                    <a
                      href={accountHref}
                      onClick={(e) => { onNavClick(e, accountHref); setOpen(false); }}
                      className={`block text-4xl font-extrabold ${pathname.startsWith("/profile") ? "text-orange" : "text-white hover:text-white/80"}`}
                    >
                      Profile
                    </a>
                    <a
                      href="/profile/setting"
                      onClick={(e) => { onNavClick(e, "/profile/setting"); setOpen(false); }}
                      className="block text-4xl font-extrabold text-white hover:text-white/80"
                    >
                      Settings
                    </a>
                    <button
                      onClick={async () => {
                        try { await disconnectWeb3Auth(); } catch {}
                        disconnect();
                        setOpen(false);
                        try { localStorage.clear(); } catch {}
                        if (typeof window !== 'undefined') window.location.href = "/";
                      }}
                      className="block text-4xl font-extrabold text-left text-white hover:text-white/80"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={async () => { await handleSignIn(); setOpen(false); }}
                    disabled={web3authLoading}
                    className="block text-4xl font-extrabold text-left text-white hover:text-white/80"
                  >
                    {web3authLoading ? "Connecting..." : "Sign in"}
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      , document.body)}
    </header>
  );
}
