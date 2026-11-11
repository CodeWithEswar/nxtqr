import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  ObservedVsModeledComparison,
  ServiceHealthIndicator,
} from "../contracts/observability.types";

export class ObservedModeledComparator {
  /**
   * Compares observed telemetry metrics with deterministic architecture model assumptions.
   */
  public static compare(params: {
    nodes: BaseNode[];
    healthIndicators: Record<string, ServiceHealthIndicator>;
    modeledExpectations?: Record<
      string,
      {
        expectedRps?: number;
        expectedLatencyP95Ms?: number;
        isModeledBottleneck?: boolean;
      }
    >;
  }): ObservedVsModeledComparison[] {
    const { nodes, healthIndicators, modeledExpectations = {} } = params;
    const comparisons: ObservedVsModeledComparison[] = [];

    for (const node of nodes) {
      const health = healthIndicators[node.id];
      const model = modeledExpectations[node.id];

      const observedRps = health?.metrics.rps;
      const modeledRps = model?.expectedRps;
      const observedLatencyP95 = health?.metrics.p95LatencyMs;
      const modeledLatencyP95 = model?.expectedLatencyP95Ms;

      let rpsDeltaPct: number | undefined;
      if (observedRps !== undefined && modeledRps !== undefined && modeledRps > 0) {
        rpsDeltaPct = Number((((observedRps - modeledRps) / modeledRps) * 100).toFixed(1));
      }

      let latencyDeltaPct: number | undefined;
      if (observedLatencyP95 !== undefined && modeledLatencyP95 !== undefined && modeledLatencyP95 > 0) {
        latencyDeltaPct = Number((((observedLatencyP95 - modeledLatencyP95) / modeledLatencyP95) * 100).toFixed(1));
      }

      const observedSaturation = (health?.metrics.cpuSaturationPct || 0) >= 80 || (health?.metrics.errorRatePct || 0) >= 2.0;
      const modeledBottleneck = !!model?.isModeledBottleneck;

      const calibrationSuggestions: string[] = [];

      if (rpsDeltaPct !== undefined && Math.abs(rpsDeltaPct) > 25) {
        calibrationSuggestions.push(
          `Actual observed throughput (${observedRps} RPS) deviates ${rpsDeltaPct > 0 ? "+" : ""}${rpsDeltaPct}% from modeled workload (${modeledRps} RPS). Update capacity planning traffic forecast.`
        );
      }

      if (latencyDeltaPct !== undefined && latencyDeltaPct > 50) {
        calibrationSuggestions.push(
          `Observed P95 latency (${observedLatencyP95}ms) is ${latencyDeltaPct}% higher than modeled architecture estimate (${modeledLatencyP95}ms). Calibrate service processing time assumptions.`
        );
      }

      if (observedSaturation && !modeledBottleneck) {
        calibrationSuggestions.push(
          `Component is experiencing production resource saturation (${health?.metrics.cpuSaturationPct}% CPU), but was not identified as a bottleneck in model. Check replica configuration.`
        );
      } else if (!observedSaturation && modeledBottleneck) {
        calibrationSuggestions.push(
          `Model predicted bottleneck saturation, but production telemetry reflects healthy headroom. Check if production cache hit ratio is higher than assumed.`
        );
      }

      comparisons.push({
        componentId: node.id,
        componentLabel: (node.data?.label as string) || node.id,
        modeledRps,
        observedRps,
        rpsDeltaPct,
        modeledLatencyP95Ms: modeledLatencyP95,
        observedLatencyP95Ms: observedLatencyP95,
        latencyDeltaPct,
        modeledBottleneck,
        observedSaturation,
        calibrationSuggestions,
      });
    }

    return comparisons;
  }
}
