import { describe, it, expect } from "vitest";
import { scrollbarTokens } from "./scrollbar";

describe("Design System — Precision Rail Scrollbar Tokens", () => {
  it("defines standard dimensions for all 4 variants", () => {
    expect(scrollbarTokens.sizes.default.px).toBe(10);
    expect(scrollbarTokens.sizes.compact.px).toBe(7);
    expect(scrollbarTokens.sizes.canvas.px).toBe(7);
    expect(scrollbarTokens.sizes.dense.px).toBe(6);

    expect(scrollbarTokens.sizes.default.cssVar).toBe("--scrollbar-size");
    expect(scrollbarTokens.sizes.compact.cssVar).toBe("--scrollbar-size-compact");
    expect(scrollbarTokens.sizes.canvas.cssVar).toBe("--scrollbar-size-canvas");
    expect(scrollbarTokens.sizes.dense.cssVar).toBe("--scrollbar-size-dense");
  });

  it("defines correct corner radius hierarchy conforming to rounded-md standard", () => {
    expect(scrollbarTokens.radius.default).toBe("0.375rem"); // 6px rounded-md
    expect(scrollbarTokens.radius.compact).toBe("0.25rem"); // 4px
    expect(scrollbarTokens.radius.dense).toBe("0.1875rem"); // 3px
  });

  it("defines pure monochrome dark palette with solid neumorphic shadow tokens", () => {
    expect(scrollbarTokens.dark.track).toBe("#080808");
    expect(scrollbarTokens.dark.thumb).toBe("#303030");
    expect(scrollbarTokens.dark.thumbHover).toBe("#505050");
    expect(scrollbarTokens.dark.thumbActive).toBe("#666666");
    expect(scrollbarTokens.dark.border).toBe("#1F1F1F");
    expect(scrollbarTokens.dark.insetShadow).toContain("inset");
    expect(scrollbarTokens.dark.thumbHighlight).toContain("inset 0 1px 0 0");
  });

  it("defines light theme fallback palette", () => {
    expect(scrollbarTokens.light.track).toBe("#F5F5F5");
    expect(scrollbarTokens.light.thumb).toBe("#CCCCCC");
    expect(scrollbarTokens.light.thumbHover).toBe("#A3A3A3");
    expect(scrollbarTokens.light.thumbActive).toBe("#737373");
  });

  it("supports all required variant tokens", () => {
    expect(scrollbarTokens.variants).toEqual(["default", "compact", "canvas", "dense", "none"]);
  });
});

