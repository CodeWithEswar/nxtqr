import type { AccentColorConfig, UserThemePreferences } from "@nxtqr/shared-types";
import { generateAccentCssVariables } from "./css-generator";

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
 * Safely loads locally persisted accent configuration from localStorage.
 */
export function getLocalAccentConfig(): AccentColorConfig {
  if (typeof window === "undefined") {
    return { preset: "monochrome", customHex: null };
  }
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEYS.ACCENT);
    if (!raw) return { preset: "monochrome", customHex: null };
    const parsed = JSON.parse(raw);
    return {
      preset: parsed.preset ?? "monochrome",
      customHex: parsed.customHex ?? null,
    };
  } catch {
    return { preset: "monochrome", customHex: null };
  }
}

/**
 * Persists accent config to localStorage.
 */
export function setLocalAccentConfig(config: AccentColorConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEYS.ACCENT, JSON.stringify(config));
  } catch {
    // Ignore storage quota or disabled storage errors
  }
}

/**
 * Directly applies accent CSS variables to documentElement style to prevent
 * any flash of un-themed content and achieve zero-reload transitions.
 */
export function applyAccentToDocument(config: AccentColorConfig, isDark = true): void {
  if (typeof document === "undefined") return;
  const vars = generateAccentCssVariables({
    preset: config.preset,
    customHex: config.customHex,
    isDarkMode: isDark,
  });
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}
