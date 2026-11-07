/**
 * NXTQR Pure Monochrome Design Tokens
 * Grounded in developer precision: pure black base (#000000), neutral grayscale hierarchy,
 * and user-selectable pure saturated accent color.
 */

export const darkThemeTokens = {
  background: "#000000",
  foreground: "#FFFFFF",
  surface: "#0A0A0A",
  elevatedSurface: "#141414",
  secondarySurface: "#1A1A1A",
  mutedSurface: "#1A1A1A",
  border: "#262626",
  subtleBorder: "#1C1C1C",
  mutedForeground: "#A3A3A3",
  secondaryForeground: "#737373",
  disabledText: "#737373",
  defaultAccent: "#FFFFFF",
  defaultAccentForeground: "#000000",
  destructive: "#FF0000",
  destructiveForeground: "#FFFFFF",
  success: "#00CC66",
  successForeground: "#000000",
  warning: "#FFD600",
  warningForeground: "#000000",
  ring: "#262626",
} as const;

export const lightThemeTokens = {
  background: "#FFFFFF",
  foreground: "#000000",
  surface: "#F5F5F5",
  elevatedSurface: "#FFFFFF",
  secondarySurface: "#EBEBEB",
  mutedSurface: "#F0F0F0",
  border: "#E5E5E5",
  subtleBorder: "#F0F0F0",
  mutedForeground: "#737373",
  secondaryForeground: "#A3A3A3",
  disabledText: "#A3A3A3",
  defaultAccent: "#000000",
  defaultAccentForeground: "#FFFFFF",
  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
  success: "#059669",
  successForeground: "#FFFFFF",
  warning: "#D97706",
  warningForeground: "#000000",
  ring: "#E5E5E5",
} as const;
