// Centralized map color tokens matching tailwind.config.ts theme
// This isolates MapLibre color strings from component code so we can
// adjust palette in one place if the design system changes.

export const MAP_COLORS = {
  pin: {
    hasData: '#F06334',   // flamingo-400 / brand orange
    noData:  '#6B6E8C',   // vulcan-500 (muted gray on dark bg)
  },
  stroke: '#3C3D50',      // vulcan-800 (outline around pins)
  pulse:  'rgba(255,255,255,0.6)', // selection ring stroke color
} as const;

