import { DisasterRecoveryExecutionEngine } from "./disaster-recovery-execution-engine";
import type {
  DisasterRecoveryMetrics,
  DisasterRecoveryScenario,
} from "./disaster-recovery-schemas";

export interface RecoveryStrategyComparisonResult {
  baselineLabel: string;
  variantLabel: string;
  baselineMetrics: DisasterRecoveryMetrics;
  variantMetrics: DisasterRecoveryMetrics;
  deltas: {
    achievedRpoMsDelta: number | null;
    achievedRtoMsDelta: number | null;
    missingWritesDelta: number;
    lostRequestsDelta: number;
    capacityDeficitRpsDelta: number;
  };
}

export function compareRecoveryStrategies(
  baselineScenario: DisasterRecoveryScenario,
  variantScenario: DisasterRecoveryScenario
): RecoveryStrategyComparisonResult {
  const tA = DisasterRecoveryExecutionEngine.runScenario(baselineScenario);
  const tB = DisasterRecoveryExecutionEngine.runScenario(variantScenario);

  const mA =
    tA.frames[tA.frames.length - 1]!.runtimeState!.disasterRecoveryState!
      .metrics;
  const mB =
    tB.frames[tB.frames.length - 1]!.runtimeState!.disasterRecoveryState!
      .metrics;

  return {
    baselineLabel: baselineScenario.label,
    variantLabel: variantScenario.label,
    baselineMetrics: mA,
    variantMetrics: mB,
    deltas: {
      achievedRpoMsDelta:
        mA.achievedRpoMs !== null && mB.achievedRpoMs !== null
          ? mB.achievedRpoMs - mA.achievedRpoMs
          : null,
      achievedRtoMsDelta:
        mA.achievedRtoMs !== null && mB.achievedRtoMs !== null
          ? mB.achievedRtoMs - mA.achievedRtoMs
          : null,
      missingWritesDelta:
        mB.missingAcknowledgedWrites - mA.missingAcknowledgedWrites,
      lostRequestsDelta: mB.lostRequests - mA.lostRequests,
      capacityDeficitRpsDelta:
        mB.recoveryCapacityDeficitRps - mA.recoveryCapacityDeficitRps,
    },
  };
}

