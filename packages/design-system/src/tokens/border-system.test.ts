import { describe, it, expect } from "vitest";
import { monochromeTokens } from "./colors";

describe("NXTQR Border System & Pure Black Monochrome Standards", () => {
  it("enforces dark neutral borders and strictly prohibits white/near-white component borders", () => {
    const prohibitedBrightColors = ["#ffffff", "#f5f5f5", "#e5e5e5", "#ffffff", "#ffffff"];

    const borderTokens = [
      monochromeTokens.borderSubtle,
      monochromeTokens.borderInset,
      monochromeTokens.borderDefault,
      monochromeTokens.borderHover,
      monochromeTokens.borderStrong,
      monochromeTokens.border,
      monochromeTokens.subtleBorder,
      monochromeTokens.ring,
    ];

    borderTokens.forEach((token) => {
      const lower = token.toLowerCase();
      expect(prohibitedBrightColors).not.toContain(lower);
    });

    // Check strict dark-gray palette
    expect(monochromeTokens.borderSubtle.toLowerCase()).toBe("#1a1a1a");
    expect(monochromeTokens.borderInset.toLowerCase()).toBe("#202020");
    expect(monochromeTokens.borderDefault.toLowerCase()).toBe("#262626");
    expect(monochromeTokens.borderHover.toLowerCase()).toBe("#333333");
    expect(monochromeTokens.borderStrong.toLowerCase()).toBe("#404040");
    expect(monochromeTokens.ring.toLowerCase()).toBe("#404040");
  });

  it("verifies base surfaces are solid dark neutral and pure black base", () => {
    expect(monochromeTokens.background).toBe("#000000");
    expect(monochromeTokens.surface01).toBe("#080808");
    expect(monochromeTokens.surface02).toBe("#0D0D0D");
    expect(monochromeTokens.surface03).toBe("#141414");
    expect(monochromeTokens.surface04).toBe("#1A1A1A");
  });
});
