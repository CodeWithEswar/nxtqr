/**
 * NXTQR Pure Black Monochrome Design Tokens
 * Grounded in developer precision: pure black base (#000000), neutral grayscale hierarchy,
 * and user-selectable accent color.
 */

export const darkThemeTokens = {
  background: "#000000",
  foreground: "#FAFAFA",
  surface: "#080808",
  elevatedSurface: "#111111",
  mutedSurface: "#171717",
  border: "#262626",
  subtleBorder: "#1C1C1C",
  mutedForeground: "#A3A3A3",
  secondaryForeground: "#737373",
  defaultAccent: "#FAFAFA",
  defaultAccentForeground: "#000000",
  destructive: "#EF4444",
  destructiveForeground: "#FAFAFA",
  success: "#10B981",
  successForeground: "#FAFAFA",
  warning: "#F59E0B",
  warningForeground: "#000000",
  ring: "#262626",
} as const;

export const lightThemeTokens = {
  background: "#FFFFFF",
  foreground: "#0A0A0A",
  surface: "#FBFBFB",
  elevatedSurface: "#FFFFFF",
  mutedSurface: "#F4F4F5",
  border: "#E4E4E7",
  subtleBorder: "#F0F0F2",
  mutedForeground: "#71717A",
  secondaryForeground: "#A1A1AA",
  defaultAccent: "#18181B",
  defaultAccentForeground: "#FFFFFF",
  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
  success: "#059669",
  successForeground: "#FFFFFF",
  warning: "#D97706",
  warningForeground: "#FFFFFF",
  ring: "#E4E4E7",
} as const;
