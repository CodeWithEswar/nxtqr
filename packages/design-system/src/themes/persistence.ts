import type { AccentColorConfig, UserThemePreferences } from "@nxtqr/shared-types";

export const THEME_STORAGE_KEYS = {
  MODE: "nxtqr_theme_mode",
  ACCENT: "nxtqr_accent_config",
  PREFERENCES: "nxtqr_user_preferences",
} as const;

export const DEFAULT_THEME_PREFERENCES: UserThemePreferences = {
  themeMode: "dark",
  accentPreset: "monochrome",
  customHex: null,
  reducedMotion: false,
  fontSize: "md",
};

/**
 * NXTQR Unified Monochrome: Always returns pure monochrome configuration.
 */
export function getLocalAccentConfig(): AccentColorConfig {
  return { preset: "monochrome", customHex: null };
}

/**
 * Cleans up legacy theme/accent keys from localStorage.
 */
export function setLocalAccentConfig(_config?: AccentColorConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(THEME_STORAGE_KEYS.ACCENT);
    window.localStorage.removeItem(THEME_STORAGE_KEYS.MODE);
  } catch {
    // Ignore storage quota or disabled storage errors
  }
}

/**
 * In the unified monochrome system, CSS variables are defined statically in CSS.
 */
export function applyAccentToDocument(_config?: AccentColorConfig, _isDark = true): void {
  // Pure monochrome tokens are statically declared in CSS.
}
