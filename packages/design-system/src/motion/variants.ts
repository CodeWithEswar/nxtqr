/**
 * NXTQR — Reusable Framer Motion Variants
 * Standardized animation variants for overlays, drawers, disclosures, and navigation.
 */

import type { Variants } from "motion/react";
import { motionDuration, motionEasing } from "./tokens";

/**
 * Clean opacity fade without spatial displacement
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: {
      duration: motionDuration.fast,
      ease: motionEasing.exit,
    },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: motionDuration.normal,
      ease: motionEasing.enter,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: motionDuration.fast,
      ease: motionEasing.exit,
    },
  },
};

/**
 * Standard Dialog & Alert Dialog surface animation
 * Scale 0.985 -> 1 with subtle vertical drift
 */
export const dialogVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.985,
    transition: {
      duration: motionDuration.fast,
      ease: motionEasing.exit,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: motionDuration.smooth,
      ease: motionEasing.enter,
    },
  },
  exit: {
    opacity: 0,
    y: 4,
    scale: 0.99,
    transition: {
      duration: motionDuration.fast,
      ease: motionEasing.exit,
    },
  },
};

/**
 * Right-side drawer / inspector sheet
 */
export const sheetRightVariants: Variants = {
  hidden: {
    x: "100%",
    opacity: 0.9,
    transition: {
      duration: motionDuration.normal,
      ease: motionEasing.exit,
    },
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: motionDuration.panel,
      ease: motionEasing.standard,
    },
  },
  exit: {
    x: "100%",
    opacity: 0.9,
    transition: {
      duration: motionDuration.normal,
      ease: motionEasing.exit,
    },
  },
};

/**
 * Left-side navigation sheet
 */
export const sheetLeftVariants: Variants = {
  hidden: {
    x: "-100%",
    opacity: 0.9,
    transition: {
      duration: motionDuration.normal,
      ease: motionEasing.exit,
    },
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: motionDuration.panel,
      ease: motionEasing.standard,
    },
  },
  exit: {
    x: "-100%",
    opacity: 0.9,
    transition: {
      duration: motionDuration.normal,
      ease: motionEasing.exit,
    },
  },
};

/**
 * Bottom sheet
 */
export const sheetBottomVariants: Variants = {
  hidden: {
    y: "100%",
    opacity: 0.9,
    transition: {
      duration: motionDuration.normal,
      ease: motionEasing.exit,
    },
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: motionDuration.panel,
      ease: motionEasing.standard,
    },
  },
  exit: {
    y: "100%",
    opacity: 0.9,
    transition: {
      duration: motionDuration.normal,
      ease: motionEasing.exit,
    },
  },
};

/**
 * Dropdown Menu and Context Menu surface
 */
export const menuVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: {
      duration: motionDuration.instant,
      ease: motionEasing.exit,
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: motionDuration.fast,
      ease: motionEasing.enter,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -2,
    transition: {
      duration: motionDuration.instant,
      ease: motionEasing.exit,
    },
  },
};

/**
 * Popover placement-aware settling
 */
export const popoverVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: {
      duration: motionDuration.fast,
      ease: motionEasing.exit,
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: motionDuration.normal,
      ease: motionEasing.enter,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 2,
    transition: {
      duration: motionDuration.fast,
      ease: motionEasing.exit,
    },
  },
};

/**
 * Accordion / Collapsible height expansion
 */
export const accordionVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    transition: {
      height: { duration: motionDuration.normal, ease: motionEasing.exit },
      opacity: { duration: motionDuration.fast, ease: motionEasing.exit },
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    overflow: "hidden",
    transition: {
      height: { duration: motionDuration.normal, ease: motionEasing.enter },
      opacity: { duration: motionDuration.normal, ease: motionEasing.enter },
    },
  },
};

/**
 * Tabs content transition
 */
export const tabContentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 4,
    transition: {
      duration: motionDuration.instant,
      ease: motionEasing.exit,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDuration.fast,
      ease: motionEasing.enter,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: motionDuration.instant,
      ease: motionEasing.exit,
    },
  },
};

/**
 * Sequential item staggering for list reveals
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};
