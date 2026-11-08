/**
 * NXTQR — Centralized Motion Tokens
 * Strict engineering timing scales and cubic-bezier easing curves.
 */

export const motionDuration = {
  instant: 0.08, // 80ms: Small state feedback
  fast: 0.14, // 140ms: Hover and press
  normal: 0.2, // 200ms: Menus and tooltips
  smooth: 0.28, // 280ms: Dialogs and popovers
  panel: 0.34, // 340ms: Sheets and sidebars
  emphasis: 0.42, // 420ms: Larger coordinated transitions
} as const;

export const motionDurationMs = {
  instant: 80,
  fast: 140,
  normal: 200,
  smooth: 280,
  panel: 340,
  emphasis: 420,
} as const;

export type MotionDurationToken = keyof typeof motionDuration;

export const motionEasing = {
  // Snappy UI standard curve
  standard: [0.2, 0, 0, 1] as const,
  // Expressive deceleration on entrance
  enter: [0, 0, 0.2, 1] as const,
  // Accelerated dismiss on exit
  exit: [0.4, 0, 1, 1] as const,
  // Coordinated emphasis
  emphasized: [0.2, 0, 0, 1] as const,
  // Linear
  linear: [0, 0, 1, 1] as const,
} as const;

export type MotionEasingToken = keyof typeof motionEasing;

export const cssEasing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  enter: "cubic-bezier(0, 0, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  linear: "linear",
} as const;

