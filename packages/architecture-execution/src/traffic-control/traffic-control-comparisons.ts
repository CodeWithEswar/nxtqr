import { TrafficControlExecutionEngine } from "./traffic-control-execution-engine";
import type {
  TrafficControlMetrics,
  TrafficControlScenario,
} from "./traffic-control-schemas";

export interface AlgorithmTradeoffRow {
  algorithm: string;
  burstTolerance: string;
  memoryFootprint: string;
  approximation: string;
  rejectionBehavior: string;
  complexity: string;
}

export const RATE_LIMIT_ALGORITHM_COMPARISON_TABLE: AlgorithmTradeoffRow[] = [
  {
    algorithm: "Fixed Window",
    burstTolerance: "2x across adjacent boundary",
    memoryFootprint: "O(1) per scope key",
    approximation: "Coarse window alignment",
    rejectionBehavior: "Hard cutoff until rollover",
    complexity: "Low",
  },
  {
    algorithm: "Sliding Window Log",
    burstTolerance: "Strict cap over exact interval",
    memoryFootprint: "O(N) timestamps per key",
    approximation: "Exact",
    rejectionBehavior: "Rejects until oldest entry expires",
    complexity: "Medium-High",
  },
  {
    algorithm: "Sliding Window Counter",
    burstTolerance: "Smoothed boundary weighting",
    memoryFootprint: "O(1) two window counters",
    approximation: "Approximate linear overlap",
    rejectionBehavior: "Smoothed rejection near edge",
    complexity: "Low-Medium",
  },
  {
    algorithm: "Token Bucket",
    burstTolerance: "Configurable up to bucket capacity",
    memoryFootprint: "O(1) tokens + timestamp",
    approximation: "Continuous refill model",
    rejectionBehavior: "Allows burst then enforces refill rate",
    complexity: "Low",
  },
  {
    algorithm: "Leaky Bucket (Queue Drain)",
    burstTolerance: "Absorbs burst up to FIFO capacity",
    memoryFootprint: "O(1) count or O(Q) FIFO",
    approximation: "Fixed outflow pacing (not GCRA)",
    rejectionBehavior: "Sheds overflow while smoothing outflow",
    complexity: "Low-Medium",
  },
];

export interface TrafficControlScenarioComparisonResult {
  baselineLabel: string;
  variantLabel: string;
  baselineMetrics: TrafficControlMetrics;
  variantMetrics: TrafficControlMetrics;
  deltas: {
    rejectionRatePctDelta: number;
    completedThroughputDelta: number;
    p95LatencyMsDelta: number;
    retryAmplificationDelta: number;
    loadShedDelta: number;
  };
}

export function compareTrafficControlScenarios(
  baselineScenario: TrafficControlScenario,
  variantScenario: TrafficControlScenario
): TrafficControlScenarioComparisonResult {
  const traceA = TrafficControlExecutionEngine.runScenario(baselineScenario);
  const traceB = TrafficControlExecutionEngine.runScenario(variantScenario);

  const mA =
    traceA.frames[traceA.frames.length - 1]!.runtimeState!.trafficControlState!
      .metrics;
  const mB =
    traceB.frames[traceB.frames.length - 1]!.runtimeState!.trafficControlState!
      .metrics;

  return {
    baselineLabel: baselineScenario.label,
    variantLabel: variantScenario.label,
    baselineMetrics: mA,
    variantMetrics: mB,
    deltas: {
      rejectionRatePctDelta: Number(
        (mB.rejectionRatePct - mA.rejectionRatePct).toFixed(1)
      ),
      completedThroughputDelta: Number(
        (mB.completedThroughputPerSec - mA.completedThroughputPerSec).toFixed(2)
      ),
      p95LatencyMsDelta: Number((mB.p95LatencyMs - mA.p95LatencyMs).toFixed(1)),
      retryAmplificationDelta: Number(
        (mB.retryAmplification - mA.retryAmplification).toFixed(2)
      ),
      loadShedDelta: mB.loadShedCount - mA.loadShedCount,
    },
  };
}

