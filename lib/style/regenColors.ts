// Regen Action type → Tailwind color classes
// Map by canonical name (case-insensitive) using seeds in supabase/sql/007_v0_4_phase2_seeds_template.sql

export type ColorClasses = {
  bg: string;   // Tailwind bg-* class
  text: string; // Tailwind text-* class
  ring?: string;
  hex: string;  // Hex color for inline SVG (charts)
};

// Choose high-contrast light tints for dark backgrounds
// Using different shades within the same color family for category grouping
const LIGHT = {
  // Chartreuse family (bright greens) - for Asexual Propagation
  chartreuse: { bg: "bg-chartreuse-200", text: "text-vulcan-950", hex: "#CAFE98" },
  chartreuse2: { bg: "bg-chartreuse-300", text: "text-vulcan-950", hex: "#A8FA5C" },
  chartreuse3: { bg: "bg-chartreuse-400", text: "text-vulcan-950", hex: "#8CF034" },
  chartreuse4: { bg: "bg-chartreuse-500", text: "text-vulcan-950", hex: "#67D60C" },
  
  // Violet family (purples) - for Sexual Propagation
  violet:     { bg: "bg-violet-300",   text: "text-vulcan-950", hex: "#DDB2FF" },
  violet2:    { bg: "bg-violet-400",   text: "text-vulcan-950", hex: "#C880FF" },
  
  // Ribbon family (blues) - for Substratum Enhancement
  ribbon:     { bg: "bg-ribbon-200",   text: "text-vulcan-950", hex: "#C1D1FC" },
  ribbon2:    { bg: "bg-ribbon-300",   text: "text-vulcan-950", hex: "#96B5FA" },
  ribbon3:    { bg: "bg-ribbon-400",   text: "text-vulcan-950", hex: "#648DF6" },
  ribbon4:    { bg: "bg-ribbon-500",   text: "text-vulcan-950", hex: "#345DF0" },
  ribbon5:    { bg: "bg-ribbon-600",   text: "text-vulcan-950", hex: "#2A47E6" },
  
  // Fallback/neutral
  gray:       { bg: "bg-vulcan-200",     text: "text-vulcan-950", hex: "#D6D6E1" },
} satisfies Record<string, ColorClasses>;

// Per-type mapping by name (lowercased key)
// Actions within the same category use the same color family with different shades
export const REGEN_TYPE_NAME_COLORS: Record<string, ColorClasses> = {
  // Asexual Propagation - All use chartreuse family (bright greens)
  "coral gardening - microfragmentation": LIGHT.chartreuse,   // Lightest shade
  "coral gardening - nursery phase": LIGHT.chartreuse2,      // Medium-light
  "coral gardening - transplantation phase": LIGHT.chartreuse3, // Medium-dark
  "direct transplant": LIGHT.chartreuse4,                    // Darker shade

  // Sexual Propagation - All use violet family (purples)
  "larval enhancement": LIGHT.violet,                       // Purple
  "coral gardening - hybridization": LIGHT.violet2,         // Darker purple

  // Substratum Enhancement - All use ribbon family (blues)
  "substrate addition - artificial reef": LIGHT.ribbon,      // Lightest blue
  "substrate enhancement - invasive species removal": LIGHT.ribbon2, // Medium-light blue
  "substrate stabilisation": LIGHT.ribbon3,                  // Medium blue
  "substrate enhancement - electric": LIGHT.ribbon4,         // Medium-dark blue
  "substrate enhancement - addition of grazers": LIGHT.ribbon5, // Darker blue
};

export const REGEN_CATEGORY_COLORS: Record<string, ColorClasses> = {
  "asexual propagation": LIGHT.chartreuse,
  "sexual propagation": LIGHT.violet,
  "substratum enhancement": LIGHT.ribbon,
};

export function normalizeRegenName(name?: string): string {
  const k = (name || "").trim().toLowerCase();
  // Common UI labels → canonical keys used for color mapping
  const ALIASES: Record<string, string> = {
    "nursery phase": "coral gardening - nursery phase",
    "transplantation phase": "coral gardening - transplantation phase",
    "microfragmentation": "coral gardening - microfragmentation",
    "hybridization": "coral gardening - hybridization",
    "direct transplant": "direct transplant",
    "larval enhancement": "larval enhancement",
    "artificial reef": "substrate addition - artificial reef",
    "substrate stabilization": "substrate stabilisation",
    "substrate stabilisation": "substrate stabilisation",
  };
  return ALIASES[k] || k;
}

export function classesForRegen(name?: string, category?: string): ColorClasses {
  const key = normalizeRegenName(name);
  if (key && REGEN_TYPE_NAME_COLORS[key]) return REGEN_TYPE_NAME_COLORS[key];
  const cat = (category || "").trim().toLowerCase();
  if (cat && REGEN_CATEGORY_COLORS[cat]) return REGEN_CATEGORY_COLORS[cat];
  return LIGHT.gray;
}
