/**
 * NXTQR — Reusable Motion Transitions
 * Framer Motion transition configurations matching global duration & easing tokens.
 */

import type { Transition } from "motion/react";
import { motionDuration, motionEasing } from "./tokens";
import { motionSprings } from "./springs";

export const instantTransition: Transition = {
  duration: motionDuration.instant,
  ease: motionEasing.linear,
};

export const fastTransition: Transition = {
  duration: motionDuration.fast,
  ease: motionEasing.standard,
};

export const normalTransition: Transition = {
  duration: motionDuration.normal,
  ease: motionEasing.standard,
};

export const enterTransition: Transition = {
  duration: motionDuration.normal,
  ease: motionEasing.enter,
};

export const exitTransition: Transition = {
  duration: motionDuration.fast,
  ease: motionEasing.exit,
};

export const smoothTransition: Transition = {
  duration: motionDuration.smooth,
  ease: motionEasing.standard,
};

export const panelTransition: Transition = {
  duration: motionDuration.panel,
  ease: motionEasing.standard,
};

export const emphasisTransition: Transition = {
  duration: motionDuration.emphasis,
  ease: motionEasing.emphasized,
};

export const gentleSpringTransition: Transition = {
  ...motionSprings.gentle,
};

export const snappySpringTransition: Transition = {
  ...motionSprings.snappy,
};

export const panelSpringTransition: Transition = {
  ...motionSprings.panel,
};

export const selectionSpringTransition: Transition = {
  ...motionSprings.selection,
};
