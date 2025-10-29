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
      <div className="w-full max-w-[1440px] mx-auto px-6 pt-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
          <a href="/">
            <img
              src="/assets/logo.svg"
              alt="Reef·Regen Logo"
              className="h-32 w-auto"
            />
          </a>
          <p className="max-w-[518px] text-base leading-6 font-light text-vulcan-200">
            Reef.Regen is a collaboration between{" "}
            <a
              href="https://pollenlabs.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold hover:text-orange transition-colors"
            >
              Pollen Labs
            </a>{" "}
            and{" "}
            <a
              href="https://mesoreefdao.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold hover:text-orange transition-colors"
            >
              MesoReef DAO
            </a>
            .
            <br />
            Built for transparent, verifiable ocean restoration.
          </p>
        </div>

        <nav className="flex items-center gap-6">
          <a
            href="/map"
            className={`px-4 py-2 text-xl font-bold leading-8 ${
              pathname === "/map"
                ? "text-orange"
                : "text-white hover:text-white/90"
            }`}
          >
            Map
          </a>
          <a
            href="/attest"
            className={`px-4 py-2 text-xl font-bold leading-8 ${
              pathname === "/attest"
                ? "text-orange"
                : "text-white hover:text-white/90"
            }`}
          >
            Submit
          </a>
          <a
            href="https://github.com/Pollen-labs/reef.regen"
            className="px-4 py-2 text-xl font-bold text-white leading-8 hover:text-white/90"
            target="_blank"
            rel="noopener noreferrer"
          >
            Github
          </a>
        </nav>
      </div>

      {/* Bottom decorative block row - repeating coral pattern */}
      <div className="w-full overflow-hidden pb-0">
        <img
          src="/assets/img-logo-repeat-footer.svg"
          alt=""
          aria-hidden="true"
          className="w-full h-60 object-cover object-center"
        />
      </div>
    </footer>
  );
}
