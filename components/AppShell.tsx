"use client";
import { usePathname } from "next/navigation";
import TopNav from "./TopNav";
import Footer from "./Footer";

/**
 * AppShell — Global layout wrapper
 *
 * Provides:
 * - Sticky TopNav at the top (max-width 1440px content)
 * - Main content area:
 *   - Map page: Full-bleed for absolute positioning
 *   - Other pages: Constrained container (max-width 1440px)
 * - Footer at the bottom (hidden on /map page for full-height experience)
 *
 * Usage:
 * - For full-width colored sections: Use absolute/fixed positioning or render outside AppShell
 * - For standard content: Automatically constrained to 1440px with proper padding
 *
 * Z-layers:
 * - Map content: z-0
 * - LocationPane: z-10
 * - AttestationModal: z-20
 * - Toasts: z-30
 * - TopNav: z-40
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMapPage = pathname === "/map";
  const isHomePage = pathname === "/";
  const isOnboarding = pathname?.startsWith("/profile/setup") || pathname?.startsWith("/profile/details");
  const isSubmitFlow = pathname?.startsWith("/submit");

  const rootTheme = (isOnboarding || isSubmitFlow) ? "bg-black text-white" : "bg-white text-vulcan-900";

  return (
    <div className={`min-h-dvh flex flex-col ${rootTheme}`}>
      <TopNav />
      <main className="relative flex-1">
        {isMapPage || isHomePage || isOnboarding ? (
          // Map page: full-bleed for absolute positioning
          children
        ) : (
          // Other pages: constrained container with padding
          <div className="w-full max-w-[1440px] mx-auto px-8 py-8">
            {children}
          </div>
        )}
      </main>
      {!isMapPage && <Footer />}
    </div>
  );
}
