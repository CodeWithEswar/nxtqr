/**
 * NXTQR Global Border Radius Standard
 * Strict standard: rounded-md (0.375rem / 6px) across all UI surfaces.
 * Buttons, Inputs, Cards, Dialogs, Sheets, Popovers, Tabs, Canvas Nodes all use rounded-md.
 *
 * Permitted exceptions:
 * - Intrinsically circular elements: Avatars, Radio Indicators, Loading Spinners.
 */

export const radiusTokens = {
  radiusRem: "0.375rem",
  radiusPx: 6,
  tailwindClass: "rounded-md",
  exceptions: ["avatar", "radio-indicator", "spinner"] as const,
} as const;

export type RadiusException = (typeof radiusTokens.exceptions)[number];
