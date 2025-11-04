// Regen Action type → Tailwind color classes
// Map by canonical name (case-insensitive) using seeds in supabase/sql/007_v0_4_phase2_seeds_template.sql

export type ColorClasses = {
  bg: string;   // Tailwind bg-* class
  text: string; // Tailwind text-* class
  ring?: string;
  hex: string;  // Hex color for inline SVG (charts)
};

// Choose high-contrast light tints for dark backgrounds
const LIGHT = {
  // hex values mirror tailwind.config.ts extended palette 300-level tints
  flamingo:   { bg: "bg-flamingo-300",   text: "text-vulcan-950", hex: "#F6A17B" },
  ribbon:     { bg: "bg-ribbon-300",     text: "text-vulcan-950", hex: "#96B5FA" },
  aquamarine: { bg: "bg-aquamarine-300", text: "text-vulcan-950", hex: "#59FCCE" },
  sunflower:  { bg: "bg-sunflower-300",  text: "text-vulcan-950", hex: "#F4EA50" },
  violet:     { bg: "bg-violet-300",     text: "text-vulcan-950", hex: "#DDB2FF" },
  magenta:    { bg: "bg-magenta-300",    text: "text-vulcan-950", hex: "#FADAFD" },
  gray:       { bg: "bg-vulcan-200",     text: "text-vulcan-950", hex: "#D6D6E1" },
} satisfies Record<string, ColorClasses>;

// Per-type mapping by name (lowercased key)
export const REGEN_TYPE_NAME_COLORS: Record<string, ColorClasses> = {
  // Asexual Propagation
  "coral gardening - microfragmentation": LIGHT.flamingo,
  "coral gardening - nursery phase": LIGHT.ribbon,
  "coral gardening - transplantation phase": LIGHT.sunflower,
  "direct transplant": LIGHT.aquamarine,

  // Sexual Propagation
  "larval enhancement": LIGHT.violet,
  "coral gardening - hybridization": LIGHT.magenta,

  // Substratum Enhancement
  "substrate addition - artificial reef": LIGHT.ribbon,
  "substrate enhancement - invasive species removal": LIGHT.gray,
  "substrate stabilisation": LIGHT.aquamarine,
  "substrate enhancement - electric": LIGHT.violet,
  "substrate enhancement - addition of grazers": LIGHT.sunflower,
};

export const REGEN_CATEGORY_COLORS: Record<string, ColorClasses> = {
  "asexual propagation": LIGHT.flamingo,
  "sexual propagation": LIGHT.violet,
  "substratum enhancement": LIGHT.ribbon,
};

export function classesForRegen(name?: string, category?: string): ColorClasses {
  const key = (name || "").trim().toLowerCase();
  if (key && REGEN_TYPE_NAME_COLORS[key]) return REGEN_TYPE_NAME_COLORS[key];
  const cat = (category || "").trim().toLowerCase();
  if (cat && REGEN_CATEGORY_COLORS[cat]) return REGEN_CATEGORY_COLORS[cat];
  return LIGHT.gray;
}
