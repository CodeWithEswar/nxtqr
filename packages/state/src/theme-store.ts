import { create } from "zustand";
import type { AccentPresetId, ThemeMode } from "@nxtqr/shared-types";
import {
  applyAccentToDocument,
  DEFAULT_THEME_PREFERENCES,
  getLocalAccentConfig,
  setLocalAccentConfig,
} from "@nxtqr/design-system";

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

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  themeMode: DEFAULT_THEME_PREFERENCES.themeMode,
  accentPreset: DEFAULT_THEME_PREFERENCES.accentPreset,
  customHex: DEFAULT_THEME_PREFERENCES.customHex,

  setThemeMode: (themeMode) => {
    set({ themeMode });
    const { accentPreset, customHex } = get();
    applyAccentToDocument({ preset: accentPreset, customHex }, themeMode === "dark");
  },

  setAccentPreset: (accentPreset) => {
    set({ accentPreset, customHex: null });
    const { themeMode } = get();
    setLocalAccentConfig({ preset: accentPreset, customHex: null });
    applyAccentToDocument({ preset: accentPreset, customHex: null }, themeMode === "dark");
  },

  setCustomHex: (customHex) => {
    set({ customHex });
    const { themeMode, accentPreset } = get();
    setLocalAccentConfig({ preset: accentPreset, customHex });
    applyAccentToDocument({ preset: accentPreset, customHex }, themeMode === "dark");
  },

  resetToMonochrome: () => {
    set({ accentPreset: "monochrome", customHex: null });
    const { themeMode } = get();
    setLocalAccentConfig({ preset: "monochrome", customHex: null });
    applyAccentToDocument({ preset: "monochrome", customHex: null }, themeMode === "dark");
  },

  hydrateFromLocal: () => {
    const config = getLocalAccentConfig();
    set({ accentPreset: config.preset, customHex: config.customHex });
    const isDark = get().themeMode === "dark";
    applyAccentToDocument(config, isDark);
  },
}));
