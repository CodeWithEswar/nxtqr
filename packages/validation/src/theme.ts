import { z } from "zod";

export const ThemeModeSchema = z.enum(["dark", "light", "system"]);

export const AccentPresetIdSchema = z.enum([
  "monochrome",
  "red",
  "orange",
  "yellow",
  "amber",
  "green",
  "blue",
  "violet",
  "pink",
]);

export const HexColorSchema = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
  message: "Must be a valid 3-character or 6-character hex color starting with #",
});

export const UserThemePreferencesSchema = z.object({
  themeMode: ThemeModeSchema.default("dark"),
  accentPreset: AccentPresetIdSchema.default("monochrome"),
  customHex: HexColorSchema.nullable().default(null),
  reducedMotion: z.boolean().default(false),
  fontSize: z.enum(["sm", "md", "lg"]).default("md"),
});

export type UserThemePreferencesInput = z.infer<typeof UserThemePreferencesSchema>;
