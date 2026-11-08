/**
 * NXTQR Spacing & Spatial Density Tokens
 * Built upon an 8px base grid with 4px sub-grid increments for dense engineering surfaces.
 */

export const spacingTokens = {
  scale: {
    "0": { px: 0, rem: "0rem", class: "p-0" },
    "0.5": { px: 2, rem: "0.125rem", class: "p-0.5" },
    "1": { px: 4, rem: "0.25rem", class: "p-1" },
    "1.5": { px: 6, rem: "0.375rem", class: "p-1.5" },
    "2": { px: 8, rem: "0.5rem", class: "p-2" },
    "2.5": { px: 10, rem: "0.625rem", class: "p-2.5" },
    "3": { px: 12, rem: "0.75rem", class: "p-3" },
    "4": { px: 16, rem: "1rem", class: "p-4" },
    "5": { px: 20, rem: "1.25rem", class: "p-5" },
    "6": { px: 24, rem: "1.5rem", class: "p-6" },
    "8": { px: 32, rem: "2rem", class: "p-8" },
    "10": { px: 40, rem: "2.5rem", class: "p-10" },
    "12": { px: 48, rem: "3rem", class: "p-12" },
    "16": { px: 64, rem: "4rem", class: "p-16" },
  },
  densityModes: {
    compact: {
      label: "Compact",
      description: "Dense telemetry tables, inspect wells, property panels",
      rowPadding: "py-1 px-2",
      cellHeight: "h-7",
      fontSize: "text-xs font-mono",
    },
    default: {
      label: "Default",
      description: "Standard engineering controls, modal forms, cards",
      rowPadding: "py-2 px-3",
      cellHeight: "h-8",
      fontSize: "text-xs font-sans",
    },
    comfortable: {
      label: "Comfortable",
      description: "Documentation reading view, marketing summaries, hero cards",
      rowPadding: "py-3 px-4",
      cellHeight: "h-9",
      fontSize: "text-sm font-sans",
    },
  },
} as const;

export type SpacingScaleKey = keyof typeof spacingTokens.scale;
export type DensityMode = keyof typeof spacingTokens.densityModes;

