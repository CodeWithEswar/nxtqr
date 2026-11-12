import { CapacityExecutionEngine } from "./capacity-execution-engine";
import { buildCapacityPresetScenario, type CapacityPresetId } from "./capacity-presets";
import type { CapScalingMode, CapacityScenario } from "./capacity-schemas";

export interface CapacityStrategyComparisonRow {
  label: string;
  mode: CapScalingMode | "overprovisioned_fixed";
  finalReadyReplicas: number;
  peakQueueDepth: number;
  p95LatencyMs: number;
  rejectedRequests: number;
  sloViolationsCount: number;
  projectedMonthlyCostUsd: number;
  costPerSuccessfulRequestUsd: number | null;
}

export function compareCapacityConfigurations(
  basePresetOrScenario: CapacityPresetId | CapacityScenario
): CapacityStrategyComparisonRow[] {
  const base =
    typeof basePresetOrScenario === "string"
      ? buildCapacityPresetScenario(basePresetOrScenario)
      : basePresetOrScenario;

  const variants: {
    label: string;
    mode: CapScalingMode | "overprovisioned_fixed";
    mutate: (s: CapacityScenario) => CapacityScenario;
  }[] = [
    {
      label: "Fixed Capacity (Current)",
      mode: "fixed",
      mutate: (s) => ({
        ...s,
        scalingPolicies: s.scalingPolicies.map((p) => ({ ...p, mode: "fixed" })),
      }),
    },
    {
      label: "Reactive HPA (Target 70% CPU)",
      mode: "hpa_reactive",
      mutate: (s) => ({
        ...s,
        scalingPolicies: s.scalingPolicies.map((p) => ({
          ...p,
          mode: "hpa_reactive",
          targetCpuUtilizationPct: 70,
        })),
      }),
    },
    {
      label: "Predictive Scaling (Zero Leakage)",
      mode: "predictive",
      mutate: (s) => ({
        ...s,
        scalingPolicies: s.scalingPolicies.map((p) => ({
          ...p,
          mode: "predictive",
          forecastModel: "exponential_smoothing",
        })),
      }),
    },
    {
      label: "Overprovisioned N+2 Buffer",
      mode: "overprovisioned_fixed",
      mutate: (s) => ({
        ...s,
        services: s.services.map((svc, idx) =>
          idx === 0
            ? {
                ...svc,
                initialReplicas: Math.min(svc.maxReplicas, Math.max(svc.initialReplicas + 3, 6)),
              }
            : svc
        ),
        scalingPolicies: s.scalingPolicies.map((p) => ({ ...p, mode: "fixed" })),
      }),
    },
  ];

  return variants.map((v) => {
    const mutated = v.mutate(JSON.parse(JSON.stringify(base)));
    const { finalState, frames } = CapacityExecutionEngine.runScenario(mutated);
    const peakQueueDepth = frames.reduce(
      (max, f) =>
        Math.max(
          max,
          f.runtimeState?.capacityState?.metrics.activeQueueDepth ?? 0
        ),
      0
    );

    return {
      label: v.label,
      mode: v.mode,
      finalReadyReplicas: finalState.metrics.readyReplicas,
      peakQueueDepth,
      p95LatencyMs: finalState.metrics.p95LatencyMs,
      rejectedRequests: finalState.metrics.rejectedRequests,
      sloViolationsCount: finalState.metrics.sloViolationsCount,
      projectedMonthlyCostUsd: finalState.metrics.projectedMonthlyCostUsd,
      costPerSuccessfulRequestUsd: finalState.cost.costPerSuccessfulRequestUsd,
    };
  });
}
