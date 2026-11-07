/**
 * NXTQR Solid Neumorphism Elevation Levels & Shadow Tokens
 *
 * Restrained tactile depth without blurry or soft decorative artifacts:
 * - Level 0: Base (#000000 page and canvas background)
 * - Level 1: Raised (buttons, toolbars, compact cards)
 * - Level 2: Elevated (popovers, dropdowns, dialogs, floating inspectors)
 * - Level 3: Pressed (active toolbar buttons, selected controls, pressed state)
 */

export const elevationTokens = {
  level0: {
    background: "#000000",
    boxShadow: "none",
  },
  level1: {
    background: "#0A0A0A",
    border: "1px solid #262626",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.5), 0 1px 0 0 rgba(255, 255, 255, 0.03) inset",
  },
  level2: {
    background: "#141414",
    border: "1px solid #262626",
    boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.7), 0 1px 0 0 rgba(255, 255, 255, 0.05) inset",
  },
  level3: {
    background: "#1A1A1A",
    border: "1px solid #262626",
    boxShadow: "inset 0 1px 3px 0 rgba(0, 0, 0, 0.6), inset 0 0 1px 0 rgba(0, 0, 0, 0.4)",
  },
} as const;

export type ElevationLevel = keyof typeof elevationTokens;
