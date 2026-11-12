import type { DeterministicRandom } from "../../resilience/deterministic-random";
import type {
  SimulatedSpanRuntime,
  TelemetrySamplingMode,
} from "../observability-schemas";

export function computeTraceCriticalPath(spans: SimulatedSpanRuntime[]): {
  spanIds: string[];
  durationMs: number;
} {
  if (spans.length === 0) return { spanIds: [], durationMs: 0 };

  const spanMap = new Map<string, SimulatedSpanRuntime>(
    spans.map((s) => [s.spanId, s])
  );
  const childrenMap = new Map<string, SimulatedSpanRuntime[]>();
  for (const s of spans) {
    if (s.parentSpanId && spanMap.has(s.parentSpanId)) {
      const list = childrenMap.get(s.parentSpanId) ?? [];
      list.push(s);
      childrenMap.set(s.parentSpanId, list);
    }
  }

  const root =
    spans.find((s) => !s.parentSpanId || !spanMap.has(s.parentSpanId)) ??
    spans[0]!;

  // Pick the latest-finishing child recursively so parallel async branches don't sum twice
  const walk = (span: SimulatedSpanRuntime): string[] => {
    const kids = childrenMap.get(span.spanId) ?? [];
    if (kids.length === 0) return [span.spanId];
    let latestKid = kids[0]!;
    for (const k of kids) {
      if (k.endTimeMs > latestKid.endTimeMs) latestKid = k;
    }
    return [span.spanId, ...walk(latestKid)];
  };

  return {
    spanIds: walk(root),
    durationMs: Math.max(0, root.endTimeMs - root.startTimeMs),
  };
}

export function evaluateTraceSampling(params: {
  mode: TelemetrySamplingMode;
  samplingRate: number;
  tailSlowThresholdMs: number;
  durationMs: number;
  hasError: boolean;
  collectorOnline: boolean;
  rng: DeterministicRandom;
}): boolean {
  if (!params.collectorOnline) return false;
  if (params.mode === "none") return true;
  if (params.mode === "head") {
    return params.rng.next() <= params.samplingRate;
  }
  if (params.mode === "rule_based") {
    if (params.hasError) return true;
    return params.rng.next() <= params.samplingRate;
  }
  // tail sampling retains slow or failing traces
  if (params.hasError || params.durationMs >= params.tailSlowThresholdMs) {
    return true;
  }
  return params.rng.next() <= Math.min(0.25, params.samplingRate);
}

