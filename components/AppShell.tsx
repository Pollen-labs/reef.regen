import TopNav from "./TopNav";
import Footer from "./Footer";

/**
 * AppShell — Global layout wrapper
 *
 * Provides:
 * - Sticky TopNav at the top
 * - Main content area (flexible for full-bleed or contained layouts)
 * - Footer at the bottom
 *
 * Z-layers:
 * - Map content: z-0
 * - LocationPane: z-10
 * - AttestationModal: z-20
 * - Toasts: z-30
 * - TopNav: z-40
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-white text-vulcan-900">
      <TopNav />
      <main className="relative flex-1">{children}</main>
      <Footer />
    </div>
  );
}
