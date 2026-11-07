export const motionDuration = {
  instant: 0,
  fast: 0.12,
  normal: 0.2,
  moderate: 0.3,
} as const;

export const motionEasing = {
  standard: [0.16, 1, 0.3, 1] as const, // cubic-bezier for snappy UI
  exit: [0.4, 0, 1, 1] as const,
  enter: [0, 0, 0.2, 1] as const,
} as const;
