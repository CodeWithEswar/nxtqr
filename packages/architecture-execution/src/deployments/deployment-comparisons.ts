import { DeploymentExecutionEngine } from "./deployment-execution-engine";
import type {
  DeploymentPostureMetrics,
  DeploymentScenario,
} from "./deployment-schemas";

export interface DeploymentStrategyComparisonResult {
  baselineLabel: string;
  variantLabel: string;
  baselineMetrics: DeploymentPostureMetrics;
  variantMetrics: DeploymentPostureMetrics;
  deltas: {
    errorRateDelta: number;
    candidateP95MsDelta: number;
    gatesPassedDelta: number;
    restartsDelta: number;
    durationMsDelta: number | null;
  };
}

export function compareDeploymentStrategies(
  baselineScenario: DeploymentScenario,
  variantScenario: DeploymentScenario
): DeploymentStrategyComparisonResult {
  const tA = DeploymentExecutionEngine.runScenario(baselineScenario);
  const tB = DeploymentExecutionEngine.runScenario(variantScenario);

  const mA = tA.frames[tA.frames.length - 1]!.runtimeState!.deploymentState!.metrics;
  const mB = tB.frames[tB.frames.length - 1]!.runtimeState!.deploymentState!.metrics;

  return {
    baselineLabel: baselineScenario.label,
    variantLabel: variantScenario.label,
    baselineMetrics: mA,
    variantMetrics: mB,
    deltas: {
      errorRateDelta: Number(
        (mB.candidateErrorRate - mA.candidateErrorRate).toFixed(4)
      ),
      candidateP95MsDelta: Number((mB.candidateP95Ms - mA.candidateP95Ms).toFixed(1)),
      gatesPassedDelta: mB.gatesPassed - mA.gatesPassed,
      restartsDelta: mB.restartsTriggered - mA.restartsTriggered,
      durationMsDelta:
        mA.deploymentDurationMs !== null && mB.deploymentDurationMs !== null
          ? mB.deploymentDurationMs - mA.deploymentDurationMs
          : null,
    },
  };
}

