/**
 * NXTQR — Motion Accessibility & Reduced Motion Handling
 * Strict compliance with prefers-reduced-motion: reduce guidelines.
 */

"use client";

import * as React from "react";
import { useReducedMotion as useFramerReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";

/**
 * Synchronous client-side check for prefers-reduced-motion.
 * Safe for SSR (returns false on server).
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * React hook to reactively track user's motion preference.
 * Defaults to false on SSR to prevent hydration mismatch, then reflects client setting.
 */
export function useNxtqrReducedMotion(): boolean {
  const prefersReduced = useFramerReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? Boolean(prefersReduced) : false;
}

/**
 * Instant fallback transition for users with reduced motion preferences
 */
export const reducedMotionTransition: Transition = {
  duration: 0.01,
  ease: "linear",
};

/**
 * Filter animation variants for reduced motion compliance:
 * Replaces transforms (x, y, scale, rotate) with simple, immediate opacity transitions.
 */
export function getAccessibleVariants(variants: Variants, reduceMotion: boolean): Variants {
  if (!reduceMotion) return variants;

  const accessible: Variants = {};
  for (const [key, target] of Object.entries(variants)) {
    if (typeof target === "object" && target !== null && !Array.isArray(target)) {
      accessible[key] = {
        opacity: "opacity" in target ? target.opacity : 1,
        transition: reducedMotionTransition,
      };
    } else {
      accessible[key] = target;
    }
  }
  return accessible;
}
