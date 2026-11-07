import { describe, it, expect } from "vitest";
import {
  motionDuration,
  motionDurationMs,
  motionEasing,
  cssEasing,
} from "./tokens";
import { motionSprings } from "./springs";
import {
  instantTransition,
  fastTransition,
  normalTransition,
  smoothTransition,
  panelTransition,
  emphasisTransition,
} from "./transitions";
import {
  fadeVariants,
  dialogVariants,
  sheetRightVariants,
  sheetLeftVariants,
  sheetBottomVariants,
  menuVariants,
  popoverVariants,
  accordionVariants,
  tabContentVariants,
} from "./variants";
import {
  shouldReduceMotion,
  getAccessibleVariants,
  reducedMotionTransition,
} from "./accessibility";

describe("Motion Tokens", () => {
  it("defines ordered durations adhering to the constitution scale", () => {
    expect(motionDuration.instant).toBe(0.08);
    expect(motionDuration.fast).toBe(0.14);
    expect(motionDuration.normal).toBe(0.2);
    expect(motionDuration.smooth).toBe(0.28);
    expect(motionDuration.panel).toBe(0.34);
    expect(motionDuration.emphasis).toBe(0.42);

    expect(motionDuration.instant).toBeLessThan(motionDuration.fast);
    expect(motionDuration.fast).toBeLessThan(motionDuration.normal);
    expect(motionDuration.normal).toBeLessThan(motionDuration.smooth);
    expect(motionDuration.smooth).toBeLessThan(motionDuration.panel);
    expect(motionDuration.panel).toBeLessThan(motionDuration.emphasis);
  });

  it("provides matching millisecond representations for CSS/DOM hooks", () => {
    expect(motionDurationMs.instant).toBe(80);
    expect(motionDurationMs.fast).toBe(140);
    expect(motionDurationMs.normal).toBe(200);
    expect(motionDurationMs.smooth).toBe(280);
    expect(motionDurationMs.panel).toBe(340);
    expect(motionDurationMs.emphasis).toBe(420);
  });

  it("defines calibrated cubic bezier curves for UI interactions", () => {
    expect(motionEasing.standard).toEqual([0.2, 0, 0, 1]);
    expect(motionEasing.enter).toEqual([0, 0, 0.2, 1]);
    expect(motionEasing.exit).toEqual([0.4, 0, 1, 1]);
    expect(cssEasing.standard).toContain("cubic-bezier");
    expect(cssEasing.enter).toContain("cubic-bezier");
    expect(cssEasing.exit).toContain("cubic-bezier");
  });
});

describe("Calibrated Springs", () => {
  it("defines gentle, snappy, panel, and selection springs", () => {
    expect(motionSprings.gentle.type).toBe("spring");
    expect(motionSprings.snappy.type).toBe("spring");
    expect(motionSprings.panel.type).toBe("spring");
    expect(motionSprings.selection.type).toBe("spring");

    expect(motionSprings.snappy.stiffness).toBeGreaterThan(motionSprings.gentle.stiffness);
    expect(motionSprings.selection.stiffness).toBeGreaterThan(motionSprings.panel.stiffness);
  });
});

describe("Motion Transitions", () => {
  it("exports valid Framer Motion transition objects", () => {
    expect(instantTransition.duration).toBe(0.08);
    expect(fastTransition.duration).toBe(0.14);
    expect(normalTransition.duration).toBe(0.2);
    expect(smoothTransition.duration).toBe(0.28);
    expect(panelTransition.duration).toBe(0.34);
    expect(emphasisTransition.duration).toBe(0.42);
  });
});

describe("Motion Variants", () => {
  it("defines dialog variants with subtle scale and translation", () => {
    expect(dialogVariants.hidden).toBeDefined();
    expect(dialogVariants.visible).toBeDefined();
    expect(dialogVariants.exit).toBeDefined();

    // @ts-expect-error test assertion
    expect(dialogVariants.hidden.scale).toBe(0.985);
    // @ts-expect-error test assertion
    expect(dialogVariants.visible.scale).toBe(1);
    // @ts-expect-error test assertion
    expect(dialogVariants.exit.scale).toBe(0.99);
  });

  it("defines directional sheet variants", () => {
    // @ts-expect-error test assertion
    expect(sheetRightVariants.hidden.x).toBe("100%");
    // @ts-expect-error test assertion
    expect(sheetLeftVariants.hidden.x).toBe("-100%");
    // @ts-expect-error test assertion
    expect(sheetBottomVariants.hidden.y).toBe("100%");
  });

  it("defines menu, popover, accordion, and tab variants", () => {
    expect(fadeVariants.hidden).toBeDefined();
    expect(menuVariants.hidden).toBeDefined();
    expect(popoverVariants.hidden).toBeDefined();
    expect(accordionVariants.collapsed).toBeDefined();
    expect(accordionVariants.expanded).toBeDefined();
    expect(tabContentVariants.hidden).toBeDefined();
  });
});

describe("Accessibility & Reduced Motion", () => {
  it("safely handles SSR execution for shouldReduceMotion", () => {
    expect(typeof shouldReduceMotion()).toBe("boolean");
  });

  it("filters out transforms when reduced motion is preferred", () => {
    const accessible = getAccessibleVariants(dialogVariants, true);
    // @ts-expect-error test assertion
    expect(accessible.hidden.scale).toBeUndefined();
    // @ts-expect-error test assertion
    expect(accessible.hidden.y).toBeUndefined();
    // @ts-expect-error test assertion
    expect(accessible.hidden.opacity).toBe(0);
    // @ts-expect-error test assertion
    expect(accessible.hidden.transition).toEqual(reducedMotionTransition);
  });

  it("preserves original variants when reduced motion is false", () => {
    const original = getAccessibleVariants(dialogVariants, false);
    expect(original).toEqual(dialogVariants);
  });
});
