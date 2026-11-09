/**
 * NXTQR Precision Rail Scrollbar Tokens
 * Solid Neumorphism · Pure Black Monochrome Foundation
 */

export const scrollbarTokens = {
  sizes: {
    default: {
      px: 10,
      rem: "0.625rem",
      cssVar: "--scrollbar-size",
    },
    compact: {
      px: 7,
      rem: "0.4375rem",
      cssVar: "--scrollbar-size-compact",
    },
    canvas: {
      px: 7,
      rem: "0.4375rem",
      cssVar: "--scrollbar-size-canvas",
    },
    dense: {
      px: 6,
      rem: "0.375rem",
      cssVar: "--scrollbar-size-dense",
    },
  },
  radius: {
    default: "0.375rem", // 6px rounded-md
    compact: "0.25rem", // 4px
    dense: "0.1875rem", // 3px
  },
  dark: {
    track: "#080808",
    trackBorder: "#141414",
    thumb: "#303030",
    thumbHover: "#505050",
    thumbActive: "#666666",
    border: "#1F1F1F",
    highlight: "#626262",
    insetShadow: "inset 0 0 2px 0 rgba(0, 0, 0, 0.8)",
    thumbHighlight: "inset 0 1px 0 0 rgba(255, 255, 255, 0.08)",
    thumbPressedShadow: "inset 0 1px 2px 0 rgba(0, 0, 0, 0.7)",
  },
  light: {
    track: "#F5F5F5",
    trackBorder: "#E5E5E5",
    thumb: "#CCCCCC",
    thumbHover: "#A3A3A3",
    thumbActive: "#737373",
    border: "#E0E0E0",
    highlight: "#FFFFFF",
    insetShadow: "inset 0 0 2px 0 rgba(0, 0, 0, 0.06)",
    thumbHighlight: "inset 0 1px 0 0 rgba(255, 255, 255, 0.9)",
    thumbPressedShadow: "inset 0 1px 2px 0 rgba(0, 0, 0, 0.12)",
  },
  transition: {
    standard: "background-color 150ms ease, border-color 150ms ease",
  },
  variants: ["default", "compact", "canvas", "dense", "none"] as const,
} as const;

export type ScrollbarVariant = (typeof scrollbarTokens.variants)[number];
