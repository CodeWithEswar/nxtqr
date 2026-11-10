import type { ScoringPolicy } from "../contracts/health.types";

export const DEFAULT_SCORING_POLICY: ScoringPolicy = {
  version: "1.0.0",
  dimensionWeights: {
    reliability: 0.25,
    security: 0.25,
    scalability: 0.15,
    performance: 0.15,
    maintainability: 0.10,
    operations: 0.10,
  },
  severityDeductions: {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 0,
  },
  maxDeductionPerRule: 30,
  minComponentsForScoring: 1,
  confidenceMultipliers: {
    high: 1.0,
    medium: 0.8,
    low: 0.5,
  },
};
