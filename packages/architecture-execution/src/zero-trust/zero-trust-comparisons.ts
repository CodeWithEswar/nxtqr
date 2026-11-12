import { ZeroTrustExecutionEngine } from "./zero-trust-execution-engine";
import type {
  SecurityPostureMetrics,
  ZeroTrustScenario,
} from "./zero-trust-schemas";

export interface ZeroTrustScenarioComparisonResult {
  baselineLabel: string;
  variantLabel: string;
  baselineMetrics: SecurityPostureMetrics;
  variantMetrics: SecurityPostureMetrics;
  deltas: {
    allowedRequestsDelta: number;
    deniedRequestsDelta: number;
    blockedAttackStepsDelta: number;
    completedAttackStepsDelta: number;
    reachableResourcesDelta: number;
    residualRiskScoreDelta: number;
    controlEffectivenessPctDelta: number;
  };
}

export function compareZeroTrustScenarios(
  baselineScenario: ZeroTrustScenario,
  variantScenario: ZeroTrustScenario
): ZeroTrustScenarioComparisonResult {
  const tA = ZeroTrustExecutionEngine.runScenario(baselineScenario);
  const tB = ZeroTrustExecutionEngine.runScenario(variantScenario);

  const mA = tA.frames[tA.frames.length - 1]!.runtimeState!.zeroTrustState!.metrics;
  const mB = tB.frames[tB.frames.length - 1]!.runtimeState!.zeroTrustState!.metrics;

  return {
    baselineLabel: baselineScenario.label,
    variantLabel: variantScenario.label,
    baselineMetrics: mA,
    variantMetrics: mB,
    deltas: {
      allowedRequestsDelta: mB.allowedRequests - mA.allowedRequests,
      deniedRequestsDelta: mB.deniedRequests - mA.deniedRequests,
      blockedAttackStepsDelta: mB.blockedAttackSteps - mA.blockedAttackSteps,
      completedAttackStepsDelta: mB.completedAttackSteps - mA.completedAttackSteps,
      reachableResourcesDelta:
        mB.reachableResourcesCount - mA.reachableResourcesCount,
      residualRiskScoreDelta: mB.residualRiskScore - mA.residualRiskScore,
      controlEffectivenessPctDelta: Number(
        (mB.controlEffectivenessPct - mA.controlEffectivenessPct).toFixed(1)
      ),
    },
  };
}

