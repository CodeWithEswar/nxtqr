import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  getRelativeLuminance,
  getContrastRatio,
  getAccessibleForeground,
  deriveAccentShades,
} from "./color-utils";
import { generateAccentCssVariables, resolveEffectiveAccentHex } from "./css-generator";
import { ACCENT_PRESETS } from "./presets";

describe("Theme Engine — Color Utilities & Perceptual Math", () => {
  it("correctly parses 3-character and 6-character hex colors to RGB", () => {
    expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#F00")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("invalid")).toBeNull();
  });

  it("converts RGB values to hex correctly", () => {
    expect(rgbToHex(255, 255, 255)).toBe("#FFFFFF");
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
    expect(rgbToHex(242, 140, 82)).toBe("#F28C52");
  });

  it("calculates WCAG 2.1 relative luminance", () => {
    const whiteLum = getRelativeLuminance(255, 255, 255);
    const blackLum = getRelativeLuminance(0, 0, 0);

    expect(whiteLum).toBeCloseTo(1.0, 2);
    expect(blackLum).toBeCloseTo(0.0, 2);
    expect(whiteLum).toBeGreaterThan(blackLum);
  });

  it("computes accurate WCAG 2.1 contrast ratios", () => {
    const whiteOnBlack = getContrastRatio("#FFFFFF", "#000000");
    expect(whiteOnBlack).toBeCloseTo(21.0, 1);

    const sameColor = getContrastRatio("#579DFF", "#579DFF");
    expect(sameColor).toBeCloseTo(1.0, 1);

    // Neutral white on pure black background
    const monoOnDark = getContrastRatio("#FAFAFA", "#000000");
    expect(monoOnDark).toBeGreaterThanOrEqual(19.0);
  });

  it("determines accessible foreground (WCAG compliant) for accent backgrounds", () => {
    // Pure Orange & Pure Yellow select black text for high contrast
    expect(getAccessibleForeground("#FF6600")).toBe("#000000");
    expect(getAccessibleForeground("#FFD600")).toBe("#000000");
    expect(getAccessibleForeground("#FFFFFF")).toBe("#000000");

    // Pure Red & Pure Blue select white text
    expect(getAccessibleForeground("#FF0000")).toBe("#FFFFFF");
    expect(getAccessibleForeground("#0066FF")).toBe("#FFFFFF");
    expect(getAccessibleForeground("#111111")).toBe("#FFFFFF");
  });

  it("derives perceptual hover, active, and muted shades", () => {
    const blueShades = deriveAccentShades("#579DFF", true);

    expect(blueShades.base).toBe("#579DFF");
    expect(blueShades.hover).toBeDefined();
    expect(blueShades.active).toBeDefined();
    expect(blueShades.muted).toBeDefined();
    expect(blueShades.contrastOnDark).toBeGreaterThan(4.5); // AA compliance
  });

  it("generates complete CSS variables for user-selected accent", () => {
    const vars = generateAccentCssVariables({
      preset: "orange",
      customHex: null,
      isDarkMode: true,
    });

    expect(vars["--accent"]).toBe(ACCENT_PRESETS.orange.hex);
    expect(vars["--accent-foreground"]).toBeDefined();
    expect(vars["--accent-hover"]).toBeDefined();
    expect(vars["--accent-ring"]).toBe(ACCENT_PRESETS.orange.hex);
    expect(vars["--ring"]).toBe(ACCENT_PRESETS.orange.hex);
  });

  it("prioritizes valid custom HEX over preset", () => {
    const hex = resolveEffectiveAccentHex({
      preset: "red",
      customHex: "#48B98A",
      isDarkMode: true,
    });

    expect(hex).toBe("#48B98A");
  });
});
