import type { Transition, Variants } from "motion/react";

/**
 * NXTQR — Shell Motion System
 * Fast, controlled, subtle transitions that never fight native drag interactions.
 */
export const shellMotion = {
  sidebar: {
    duration: 0.22,
    ease: [0.22, 1, 0.36, 1],
  } as Transition,

  panel: {
    duration: 0.2,
    ease: [0.22, 1, 0.36, 1],
  } as Transition,

  overlay: {
    duration: 0.16,
    ease: [0.2, 0, 0, 1],
  } as Transition,

  dropdown: {
    duration: 0.14,
    ease: [0.2, 0, 0, 1],
  } as Transition,
} as const;

export const sidebarVariants: Variants = {
  expanded: {
    opacity: 1,
    transition: shellMotion.sidebar,
  },
  collapsed: {
    opacity: 1,
    transition: shellMotion.sidebar,
  },
};

export const panelVariants: Variants = {
  open: {
    opacity: 1,
    scale: 1,
    transition: shellMotion.panel,
  },
  closed: {
    opacity: 0,
    scale: 0.98,
    transition: shellMotion.panel,
  },
};

