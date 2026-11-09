/**
 * NXTQR Pure Monochrome Design Tokens
 * Grounded in developer precision: pure black base (#000000), neutral grayscale hierarchy,
 * and solid neumorphic depth.
 */

export const monochromeTokens = {
  // Core Grayscale Hierarchy (Section 3.1)
  background: "#000000",
  surface01: "#080808",
  surface02: "#0D0D0D",
  surface03: "#141414",
  surface04: "#1A1A1A",

  borderSubtle: "#1A1A1A",
  borderInset: "#202020",
  borderDefault: "#262626",
  borderHover: "#333333",
  borderStrong: "#404040",

  textPrimary: "#FFFFFF",
  textSecondary: "#B5B5B5",
  textMuted: "#858585",
  textDisabled: "#666666",

  // Semantic mappings & compatibility aliases
  foreground: "#FFFFFF",
  surface: "#0A0A0A",
  elevatedSurface: "#141414",
  secondarySurface: "#1A1A1A",
  mutedSurface: "#141414",

  border: "#262626",
  subtleBorder: "#1A1A1A",

  mutedForeground: "#858585",
  secondaryForeground: "#B5B5B5",
  disabledText: "#666666",

  // Pure Monochrome Primary / Accent (default: white on black)
  primary: "#FFFFFF",
  primaryForeground: "#000000",
  accent: "#FFFFFF",
  accentForeground: "#000000",
  accentMuted: "#141414",
  accentMutedForeground: "#858585",
  ring: "#404040",

  // Functional status tokens (for accessible status indicators only)
  destructive: "#FF0000",
  destructiveForeground: "#FFFFFF",
  success: "#00CC66",
  successForeground: "#000000",
  warning: "#FFD600",
  warningForeground: "#000000",
} as const;

// Backward-compatibility alias
export const darkThemeTokens = monochromeTokens;
