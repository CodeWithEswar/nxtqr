import type { AccentPresetId } from "@nxtqr/shared-types";
import { ACCENT_PRESETS } from "./presets";
import { deriveAccentShades, type DerivedAccentShades } from "./color-utils";

export interface AccentThemeContext {
  preset: AccentPresetId;
  customHex: string | null;
  isDarkMode?: boolean;
}

export function resolveEffectiveAccentHex(context: AccentThemeContext): string {
  if (context.customHex && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(context.customHex)) {
    return context.customHex;
  }
  const presetDef = ACCENT_PRESETS[context.preset] ?? ACCENT_PRESETS.monochrome;
  return presetDef.hex;
}

export function generateAccentCssVariables(context: AccentThemeContext): Record<string, string> {
  const isDark = context.isDarkMode !== false;
  const hex = resolveEffectiveAccentHex(context);
  const shades: DerivedAccentShades = deriveAccentShades(hex, isDark);

  return {
    "--accent": shades.base,
    "--accent-foreground": shades.foreground,
    "--accent-hover": shades.hover,
    "--accent-active": shades.active,
    "--accent-muted": shades.muted,
    "--accent-muted-foreground": shades.mutedForeground,
    "--accent-ring": shades.ring,
    "--ring": shades.ring,
  };
}

export function generateAccentCssString(context: AccentThemeContext, selector = ":root"): string {
  const vars = generateAccentCssVariables(context);
  const lines = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
  return `${selector} {\n${lines}\n}`;
}
