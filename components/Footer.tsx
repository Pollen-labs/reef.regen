"use client";
import { usePathname } from "next/navigation";

/**
 * Footer — Global site footer
 *
 * Layout:
 * - Top bar: Logo + mission statement on left, nav links on right
 * - Middle: Repeating decorative blocks (coral pattern)
 * - Bottom: Partner links with logos (horizontal on desktop, vertical on mobile)
 *
 * Colors: Vulcan-800 background, Vulcan-700 decorative blocks
 */
export default function Footer() {
  const pathname = usePathname();
  return (
    <footer className="bg-vulcan-800 flex flex-col">
      {/* Top bar */}
      <div className="w-full px-6 md:px-10 pt-12 md:pt-20 pb-8 md:pb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-10 md:gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-4">
          <a href="/">
            <img
              src="/assets/logo.svg"
              alt="Reef·Regen Logo"
              className="h-28 md:h-32 w-auto"
            />
          </a>
          <div className="max-w-[640px]">
            <span className="block text-2xl md:text-3xl font-black tracking-hd text-white mb-3">
              Built for transparent, verifiable ocean restoration.
            </span>
            <p className="text-base leading-6 font-light text-vulcan-200">
              Reef.Regen empowers reef scientists, restoration teams, and citizen scientists worldwide in their mission to protect coral ecosystems across the planet.
            </p>
          </div>
        </div>

        <nav className="w-full md:w-auto grid grid-cols-2 md:flex items-center gap-x-8 gap-y-4 md:gap-6 mt-6 md:mt-0 text-left">
          <a
            href="/map"
            className={`px-0 md:px-4 py-2 text-xl md:text-xl font-bold leading-8 ${
              pathname === "/map"
                ? "text-orange"
                : "text-white hover:text-white/90"
            }`}
          >
            Explore
          </a>
          <a
            href="/submit/steps/1"
            className={`px-0 md:px-4 py-2 text-xl md:text-xl font-bold leading-8 ${
              pathname?.startsWith("/submit")
                ? "text-orange"
                : "text-white hover:text-white/90"
            }`}
          >
            Submit
          </a>
          <a
            href="https://forms.gle/xxX7TwfLxQeARjsh8"
            className="px-0 md:px-4 py-2 text-xl md:text-xl font-bold text-white leading-8 hover:text-white/90"
            target="_blank"
            rel="noopener noreferrer"
          >
            Feedback
          </a>
          <a
            href="https://github.com/Pollen-labs/reef.regen"
            className="px-0 md:px-4 py-2 text-xl md:text-xl font-bold text-white leading-8 hover:text-white/90"
            target="_blank"
            rel="noopener noreferrer"
          >
            Github
          </a>
        </nav>
      </div>

      {/* Bottom decorative block row - repeating coral pattern */}
      <div className="w-full overflow-hidden">
        <picture>
          <source media="(max-width: 767px)" srcSet="/assets/img-logo-repeat-footer-mobile.svg" />
          <img
            src="/assets/img-logo-repeat-footer.svg"
            alt=""
            aria-hidden="true"
            className="w-full h-[400px] md:h-80 object-cover object-center"
          />
        </picture>
      </div>

      {/* Partner links with logos */}
      <div className="w-full px-6 md:px-10 py-8 md:py-4 border-t border-vulcan-700">
        <div className="flex flex-col md:flex-row items-center justify-center md:items-center gap-4 md:gap-6">
          <a
            href="https://pollenlabs.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-vulcan-400 hover:text-vulcan-300 transition-colors"
          >
            <span className="text-base font-light text-vulcan-400">A creation by</span>
            <img
              src="/assets/logo-pollenlabs.svg"
              alt="Pollen Labs"
              className="h-5 w-5 shrink-0"
            />
            <span className="text-base font-medium">Pollen Labs.</span>
          </a>
          <a
            href="https://mesoreefdao.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-vulcan-400 hover:text-vulcan-300 transition-colors"
          >
            <span className="text-base font-light text-vulcan-5400">Hosted by</span>
            <img
              src="/assets/meso-logo.svg"
              alt="MesoReef DAO"
              className="h-5 w-auto shrink-0"
            />
            <span className="text-base font-medium">MesoReef DAO.</span>
          </a>
          <a
            href="https://community.optimism.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-vulcan-400 hover:text-vulcan-300 transition-colors"
          >
            <span className="text-base font-light text-vulcan-400">Supported by</span>
            <img
              src="/assets/Logo-optimism.svg"
              alt="Optimism Collective"
              className="h-5 w-5 shrink-0"
            />
            <span className="text-base font-medium">Optimism Collective.</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
