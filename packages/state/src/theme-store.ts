import { create } from "zustand";
import type { AccentPresetId, ThemeMode } from "@nxtqr/shared-types";

export interface ThemeStoreState {
  themeMode: ThemeMode;
  accentPreset: AccentPresetId;
  customHex: string | null;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentPreset: (preset: AccentPresetId) => void;
  setCustomHex: (hex: string | null) => void;
  resetToMonochrome: () => void;
  hydrateFromLocal: () => void;
}

/**
 * NXTQR Unified Pure Black Monochrome Theme Store
 * The application has exactly one theme: Pure Black Monochrome + Solid Neumorphism.
 * Theme mode is permanently "dark" and accent is permanently "monochrome".
 */
export const useThemeStore = create<ThemeStoreState>(() => ({
  themeMode: "dark",
  accentPreset: "monochrome",
  customHex: null,

  setThemeMode: () => {},
  setAccentPreset: () => {},
  setCustomHex: () => {},
  resetToMonochrome: () => {},
  hydrateFromLocal: () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("nxtqr_theme_mode");
        window.localStorage.removeItem("nxtqr_accent_config");
      } catch {
        // Ignore storage errors
      }
    }
  },
}));
