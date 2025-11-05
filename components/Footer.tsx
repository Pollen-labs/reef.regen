"use client";
import { usePathname } from "next/navigation";

/**
 * Footer — Global site footer
 *
 * Layout:
 * - Two main sections: top content bar + bottom decorative asset
 * - Top bar: Logo + blurb on left, nav links on right
 * - Bottom: Repeating decorative blocks (coral pattern)
 *
 * Colors: Vulcan-800 background, Vulcan-700 decorative blocks
 * Links: Map, Submit, Github (Github IS in footer per spec)
 */
export default function Footer() {
  const pathname = usePathname();
  return (
    <footer className="bg-vulcan-800 flex flex-col gap-8">
      {/* Top bar */}
      <div className="w-full px-6 md:px-10 pt-12 md:pt-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-10 md:gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-4">
          <a href="/">
            <img
              src="/assets/logo.svg"
              alt="Reef·Regen Logo"
              className="h-28 md:h-32 w-auto"
            />
          </a>
          <p className="max-w-[640px] text-base leading-6 font-light text-vulcan-200">
          
          <span className="block text-2xl md:text-3xl font-black tracking-hd text-white mb-3">
            Built for transparent, verifiable ocean restoration.
          </span>
            Reef.Regen is a collaboration between{" "}
            <a
              href="https://pollenlabs.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white hover:text-white/80 transition-colors"
            >
              Pollen Labs
            </a>{" "}
            and{" "}
            <a
              href="https://mesoreefdao.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white hover:text-white/80 transition-colors"
            >
              MesoReef DAO
            </a>
            .
            <br />
            Supported by {" "}
            <a
              href="https://community.optimism.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white hover:text-white/80 transition-colors"
            >
              Optimism collective
            </a>
            .
           
          </p>
        </div>

        <nav className="w-full md:w-auto grid grid-cols-3 md:flex items-center gap-x-8 gap-y-4 md:gap-6 mt-6 md:mt-0 text-left">
          <a
            href="/map"
            className={`px-0 md:px-4 py-2 text-xl md:text-xl font-bold leading-8 ${
              pathname === "/map"
                ? "text-orange"
                : "text-white hover:text-white/90"
            }`}
          >
            Map
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
      <div className="w-full overflow-hidden pb-4">
        <picture>
          <source media="(max-width: 767px)" srcSet="/assets/img-logo-repeat-footer-mobile.svg" />
          <img
            src="/assets/img-logo-repeat-footer.svg"
            alt=""
            aria-hidden="true"
            className="w-full h-[520px] md:h-80 object-cover object-center"
          />
        </picture>
      </div>
    </footer>
  );
}
