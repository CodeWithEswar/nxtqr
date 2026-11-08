/**
 * NXTQR — Global Motion Provider
 * Configures Motion for React with centralized defaults and automatic reduced-motion handling.
 */

"use client";

import * as React from "react";
import { MotionConfig, type MotionConfigProps } from "motion/react";
import { enterTransition } from "./transitions";

export interface NxtqrMotionProviderProps {
  children: React.ReactNode;
  /**
   * Motion reduction strategy:
   * - "user": respect system accessibility setting (default)
   * - "always": force reduced motion
   * - "never": disable motion reduction
   */
  reducedMotion?: MotionConfigProps["reducedMotion"];
  /**
   * Optional custom default transition override
   */
  transition?: MotionConfigProps["transition"];
}

export function NxtqrMotionProvider({
  children,
  reducedMotion = "user",
  transition = enterTransition,
}: NxtqrMotionProviderProps) {
  return (
    <MotionConfig reducedMotion={reducedMotion} transition={transition}>
      {children}
    </MotionConfig>
  );
}

