/**
 * NXTQR — Calibrated Spring Physics Tokens
 * Restrained springs designed for responsive engineering interfaces without distracting bounce.
 */

export const motionSprings = {
  /**
   * Gentle spring for relaxed transitions (toolbars, non-critical disclosures)
   */
  gentle: {
    type: "spring",
    stiffness: 120,
    damping: 20,
    mass: 1,
  } as const,

  /**
   * Snappy spring for quick responsive interactions (buttons, icons, toggles)
   */
  snappy: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  } as const,

  /**
   * Panel spring for sidebars, bottom sheets, and slide-in panels
   */
  panel: {
    type: "spring",
    stiffness: 220,
    damping: 28,
    mass: 1,
  } as const,

  /**
   * Selection spring for active indicators, segmented tabs, and focus bounds
   */
  selection: {
    type: "spring",
    stiffness: 400,
    damping: 35,
    mass: 0.8,
  } as const,
} as const;

export type MotionSpringToken = keyof typeof motionSprings;
