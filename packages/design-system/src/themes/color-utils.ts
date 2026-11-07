export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

/**
 * Parses 3 or 6 char hex color into RGB. Returns null if invalid.
 */
export function hexToRgb(hex: string): RgbColor | null {
  const cleanHex = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return null;
  }

  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const num = parseInt(fullHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Formats RGB to uppercase 6-char hex string with #.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (val: number) => clamp(val).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts RGB [0-255] to HSL (h: 0-360, s: 0-100, l: 0-100).
 */
export function rgbToHsl(r: number, g: number, b: number): HslColor {
  const normR = r / 255;
  const normG = g / 255;
  const normB = b / 255;

  const max = Math.max(normR, normG, normB);
  const min = Math.min(normR, normG, normB);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case normR:
        h = (normG - normB) / d + (normG < normB ? 6 : 0);
        break;
      case normG:
        h = (normB - normR) / d + 2;
        break;
      case normB:
        h = (normR - normG) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL (h: 0-360, s: 0-100, l: 0-100) to RGB [0-255].
 */
export function hslToRgb(h: number, s: number, l: number): RgbColor {
  const normH = (h % 360) / 360;
  const normS = Math.max(0, Math.min(100, s)) / 100;
  const normL = Math.max(0, Math.min(100, l)) / 100;

  if (normS === 0) {
    const val = Math.round(normL * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tVal = t;
    if (tVal < 0) tVal += 1;
    if (tVal > 1) tVal -= 1;
    if (tVal < 1 / 6) return p + (q - p) * 6 * tVal;
    if (tVal < 1 / 2) return q;
    if (tVal < 2 / 3) return p + (q - p) * (2 / 3 - tVal) * 6;
    return p;
  };

  const q = normL < 0.5 ? normL * (1 + normS) : normL + normS - normL * normS;
  const p = 2 * normL - q;

  return {
    r: Math.round(hue2rgb(p, q, normH + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, normH) * 255),
    b: Math.round(hue2rgb(p, q, normH - 1 / 3) * 255),
  };
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB color.
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const srgb = [r / 255, g / 255, b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Calculates contrast ratio between two hex colors according to WCAG 2.1.
 * Ratio is always >= 1.0 and <= 21.0.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1) ?? { r: 255, g: 255, b: 255 };
  const rgb2 = hexToRgb(hex2) ?? { r: 0, g: 0, b: 0 };

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Determines whether pure black (#000000) or pure white (#FAFAFA) provides
 * superior contrast against the given background hex color.
 */
export function getAccessibleForeground(backgroundHex: string): "#000000" | "#FAFAFA" {
  const contrastWithBlack = getContrastRatio(backgroundHex, "#000000");
  const contrastWithWhite = getContrastRatio(backgroundHex, "#FAFAFA");

  return contrastWithBlack >= contrastWithWhite ? "#000000" : "#FAFAFA";
}

export interface DerivedAccentShades {
  base: string;
  foreground: string;
  hover: string;
  active: string;
  muted: string;
  mutedForeground: string;
  ring: string;
  contrastOnDark: number;
  contrastOnLight: number;
}

/**
 * Derives accessible perceptual shades for hover, active, muted, and focus ring
 * from a primary accent color.
 */
export function deriveAccentShades(hex: string, isDarkMode = true): DerivedAccentShades {
  const rgb = hexToRgb(hex) ?? { r: 250, g: 250, b: 250 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const foreground = getAccessibleForeground(hex);

  // Perceptual hover: brighten slightly in dark mode, darken slightly in light mode
  const hoverLightness = isDarkMode ? Math.min(95, hsl.l + 8) : Math.max(10, hsl.l - 8);
  const hoverRgb = hslToRgb(hsl.h, hsl.s, hoverLightness);
  const hover = rgbToHex(hoverRgb.r, hoverRgb.g, hoverRgb.b);

  // Perceptual active: slightly darker
  const activeLightness = isDarkMode ? Math.max(15, hsl.l - 6) : Math.max(5, hsl.l - 12);
  const activeRgb = hslToRgb(hsl.h, hsl.s, activeLightness);
  const active = rgbToHex(activeRgb.r, activeRgb.g, activeRgb.b);

  // Perceptual muted background (subtle badge or tab highlight)
  const mutedLightness = isDarkMode ? 12 : 94;
  const mutedSaturation = Math.min(40, hsl.s);
  const mutedRgb = hslToRgb(hsl.h, mutedSaturation, mutedLightness);
  const muted = rgbToHex(mutedRgb.r, mutedRgb.g, mutedRgb.b);

  const mutedForeground = isDarkMode ? "#D4D4D8" : "#27272A";

  const contrastOnDark = getContrastRatio(hex, "#000000");
  const contrastOnLight = getContrastRatio(hex, "#FFFFFF");

  return {
    base: hex,
    foreground,
    hover,
    active,
    muted,
    mutedForeground,
    ring: hex,
    contrastOnDark,
    contrastOnLight,
  };
}
