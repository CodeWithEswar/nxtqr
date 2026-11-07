import { motionDuration, motionEasing } from "./duration";

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: motionDuration.fast,
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

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: motionDuration.normal,
      ease: motionEasing.standard,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: {
      duration: motionDuration.fast,
      ease: motionEasing.exit,
    },
  },
};

export const slideFromRight = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: motionDuration.moderate,
      ease: motionEasing.standard,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      duration: motionDuration.fast,
      ease: motionEasing.exit,
    },
  },
};
