import { ObservabilityExecutionEngine } from "./observability-execution-engine";
import type {
  ObservabilityMetrics,
  ObservabilityScenario,
} from "./observability-schemas";

export interface ObservabilityScenarioComparisonResult {
  baselineLabel: string;
  variantLabel: string;
  baselineMetrics: ObservabilityMetrics;
  variantMetrics: ObservabilityMetrics;
  deltas: {
    errorRateDelta: number;
    p95LatencyMsDelta: number;
    sloCompliancePctDelta: number;
    telemetryCoveragePctDelta: number;
    incidentsResolvedDelta: number;
    alertFireTransitionsDelta: number;
  };
}

export function compareObservabilityScenarios(
  baselineScenario: ObservabilityScenario,
  variantScenario: ObservabilityScenario
): ObservabilityScenarioComparisonResult {
  const tA = ObservabilityExecutionEngine.runScenario(baselineScenario);
  const tB = ObservabilityExecutionEngine.runScenario(variantScenario);

  const mA =
    tA.frames[tA.frames.length - 1]!.runtimeState!.observabilityState!.metrics;
  const mB =
    tB.frames[tB.frames.length - 1]!.runtimeState!.observabilityState!.metrics;

  return {
    baselineLabel: baselineScenario.label,
    variantLabel: variantScenario.label,
    baselineMetrics: mA,
    variantMetrics: mB,
    deltas: {
      errorRateDelta: Number((mB.overallErrorRate - mA.overallErrorRate).toFixed(4)),
      p95LatencyMsDelta: Number((mB.overallP95LatencyMs - mA.overallP95LatencyMs).toFixed(1)),
      sloCompliancePctDelta: Number((mB.sloCompliancePct - mA.sloCompliancePct).toFixed(1)),
      telemetryCoveragePctDelta: Number(
        (mB.telemetryCoveragePct - mA.telemetryCoveragePct).toFixed(1)
      ),
      incidentsResolvedDelta: mB.incidentsResolved - mA.incidentsResolved,
      alertFireTransitionsDelta: mB.alertFireTransitions - mA.alertFireTransitions,
    },
  };
}
