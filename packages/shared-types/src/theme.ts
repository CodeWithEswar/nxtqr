export type ThemeMode = "dark" | "light" | "system";

export type AccentPresetId =
  "monochrome" | "red" | "orange" | "yellow" | "amber" | "green" | "blue" | "violet" | "pink";

export interface AccentColorConfig {
  preset: AccentPresetId;
  customHex: string | null;
}

export interface UserThemePreferences {
  themeMode: ThemeMode;
  accentPreset: AccentPresetId;
  customHex: string | null;
  reducedMotion: boolean;
  fontSize: "sm" | "md" | "lg";
}
