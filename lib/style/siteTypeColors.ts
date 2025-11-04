import type { ColorClasses } from "./regenColors";

// Reuse the same light tints as regen colors
// Hex not required for site type badges; provide anyway for future charts
const COLORS = {
  ribbon:     { bg: "bg-violet-300",     text: "text-vulcan-950", hex: "#96B5FA" },
  aquamarine: { bg: "bg-aquamarine-300", text: "text-vulcan-950", hex: "#59FCCE" },
  flamingo:   { bg: "bg-flamingo-300",   text: "text-vulcan-950", hex: "#F6A17B" },
  sunflower:  { bg: "bg-sunflower-300",  text: "text-vulcan-950", hex: "#F4EA50" },
  gray:       { bg: "bg-vulcan-300",     text: "text-vulcan-950", hex: "#D6D6E1" },
} satisfies Record<string, ColorClasses>;

// Default mapping by canonical site_type name (case-insensitive)
const SITE_TYPE_COLORS: Record<string, ColorClasses> = {
  "outplant reef": COLORS.aquamarine,
  "nursery": COLORS.ribbon,
  "lab / hatchery": COLORS.sunflower,
  "staging / holding": COLORS.flamingo,
  "other": COLORS.gray,
};

export function classesForSiteType(name?: string): ColorClasses {
  const key = (name || "").trim().toLowerCase();
  return SITE_TYPE_COLORS[key] || COLORS.gray;
}

// Allow easy external tweaks by exporting the map
export { SITE_TYPE_COLORS };

