import { MetricAggregator } from "../../traffic/metric-aggregator";
import {
  evaluateSLOForService,
  type ServiceObservationSample,
} from "../../observability/reliability/slo-alert-engine";
import type {
  FeatureFlagConfig,
  FeatureFlagEvalRuntime,
  GateEvaluationRuntime,
  PromotionGateConfig,
  RevisionTelemetryStats,
} from "../deployment-schemas";

/**
 * Deterministic hash in [0, 99] for stable synthetic identity cohort routing / feature flags.
 */
export function deterministicIdentityBucket(identityId: string, flagKey: string): number {
  let hash = 2166136261;
  const input = `${flagKey}:${identityId}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

export function evaluateFeatureFlagsDeterministic(
  flags: FeatureFlagConfig[],
  identities: Array<{ id: string; tenant: string; cohort: string; region: string }>,
  nowMs: number
): FeatureFlagEvalRuntime[] {
  const flagOutcomeCache: Record<string, Record<string, boolean>> = {};
  const results: FeatureFlagEvalRuntime[] = [];

  for (const flag of flags) {
    flagOutcomeCache[flag.key] = {};
    const sampleResults: FeatureFlagEvalRuntime["sampleResults"] = [];

    for (const ident of identities) {
      let enabled = flag.defaultValue;
      let ruleMatched = "default";

      if (!flag.misconfiguredRule && nowMs >= flag.staleCacheDelayMs) {
        for (const rule of flag.rules) {
          if (rule.kind === "prerequisite" && rule.prerequisiteFlagKey) {
            const prereqOk = flagOutcomeCache[rule.prerequisiteFlagKey]?.[ident.id];
            if (!prereqOk) {
              enabled = false;
              ruleMatched = `prereq_failed:${rule.prerequisiteFlagKey}`;
              break;
            }
          }
          if (rule.kind === "tenant" && rule.targetValues.includes(ident.tenant)) {
            enabled = rule.serveValue;
            ruleMatched = rule.id;
            break;
          }
          if (rule.kind === "cohort" && rule.targetValues.includes(ident.cohort)) {
            enabled = rule.serveValue;
            ruleMatched = rule.id;
            break;
          }
          if (rule.kind === "region" && rule.targetValues.includes(ident.region)) {
            enabled = rule.serveValue;
            ruleMatched = rule.id;
            break;
          }
          if (rule.kind === "percentage" && rule.percentage !== undefined) {
            const bucket = deterministicIdentityBucket(ident.id, flag.key);
            if (bucket < rule.percentage) {
              enabled = rule.serveValue;
              ruleMatched = `${rule.id}(bucket=${bucket})`;
              break;
            }
          }
        }
      } else if (flag.misconfiguredRule) {
        enabled = !flag.defaultValue;
        ruleMatched = "misconfigured_rule";
      }

      flagOutcomeCache[flag.key]![ident.id] = enabled;
      sampleResults.push({
        identityId: ident.id,
        region: ident.region,
        cohort: ident.cohort,
        enabled,
        ruleMatched,
      });
    }

    results.push({
      key: flag.key,
      revision: flag.revision,
      misconfigured: flag.misconfiguredRule,
      sampleResults,
    });
  }

  return results;
}

export function computeRevisionStats(params: {
  revisionId: string;
  version: string;
  latenciesMs: number[];
  errors: number;
  saturationPct: number;
  totalServiceRequests: number;
}): RevisionTelemetryStats {
  const {
    revisionId,
    version,
    latenciesMs,
    errors,
    saturationPct,
    totalServiceRequests,
  } = params;
  const reqs = latenciesMs.length;
  return {
    revisionId,
    version,
    requests: reqs,
    errors,
    errorRate: reqs > 0 ? Number((errors / reqs).toFixed(4)) : 0,
    p50LatencyMs: reqs > 0 ? MetricAggregator.calculatePercentile(latenciesMs, 50) : 0,
    p95LatencyMs: reqs > 0 ? MetricAggregator.calculatePercentile(latenciesMs, 95) : 0,
    p99LatencyMs: reqs > 0 ? MetricAggregator.calculatePercentile(latenciesMs, 99) : 0,
    saturationPct,
    observedSharePct:
      totalServiceRequests > 0
        ? Number(((reqs / totalServiceRequests) * 100).toFixed(1))
        : 0,
  };
}

export function evaluatePromotionGate(params: {
  gate: PromotionGateConfig;
  serviceId: string;
  candidateStats: RevisionTelemetryStats;
  stableStats: RevisionTelemetryStats;
  minRequiredSamples: number;
  stageElapsedMs: number;
  minDurationMs: number;
  telemetryLost: boolean;
  previousConsecutivePasses: number;
  nowMs: number;
}): GateEvaluationRuntime {
  const {
    gate,
    serviceId,
    candidateStats,
    stableStats,
    minRequiredSamples,
    stageElapsedMs,
    minDurationMs,
    telemetryLost,
    previousConsecutivePasses,
    nowMs,
  } = params;

  if (gate.metric === "manual_approval") {
    const approved = gate.manualApproved === true;
    return {
      gateId: gate.id,
      gateName: gate.name,
      metric: gate.metric,
      evaluatedAtMs: nowMs,
      observedValue: approved ? 1 : 0,
      baselineValue: 1,
      thresholdLabel: "manualApproval = true",
      sampleCount: candidateStats.requests,
      outcome: approved ? "PASS" : "INCONCLUSIVE",
      consecutivePasses: approved ? previousConsecutivePasses + 1 : 0,
      explanation: approved
        ? "Manual promotion approval granted."
        : "Awaiting explicit operator manual approval before stage advance.",
    };
  }

  // Telemetry missing check — NEVER silently treat missing telemetry as passing unless configured
  if (telemetryLost) {
    const outcome = gate.treatNoDataAsPass ? "PASS" : "NO_DATA";
    return {
      gateId: gate.id,
      gateName: gate.name,
      metric: gate.metric,
      evaluatedAtMs: nowMs,
      observedValue: null,
      baselineValue: null,
      thresholdLabel: "Telemetry present",
      sampleCount: candidateStats.requests,
      outcome,
      consecutivePasses: outcome === "PASS" ? previousConsecutivePasses + 1 : 0,
      explanation:
        outcome === "NO_DATA"
          ? "Telemetry missing or collector unavailable; cannot verify release safety."
          : "Telemetry missing; user policy explicitly configured treatNoDataAsPass=true.",
    };
  }

  // Minimum samples and minimum observation window checks
  if (candidateStats.requests < minRequiredSamples || stageElapsedMs < minDurationMs) {
    return {
      gateId: gate.id,
      gateName: gate.name,
      metric: gate.metric,
      evaluatedAtMs: nowMs,
      observedValue: null,
      baselineValue: null,
      thresholdLabel: `samples >= ${minRequiredSamples}, window >= ${minDurationMs}ms`,
      sampleCount: candidateStats.requests,
      outcome: "INCONCLUSIVE",
      consecutivePasses: 0,
      explanation: `Insufficient observation: ${candidateStats.requests}/${minRequiredSamples} samples, ${stageElapsedMs}/${minDurationMs}ms elapsed.`,
    };
  }

  let observed = 0;
  let baseline = 0;
  let thresholdLabel = "";
  let passed = true;

  switch (gate.metric) {
    case "error_rate": {
      observed = candidateStats.errorRate;
      baseline = stableStats.errorRate;
      const maxErr = gate.maxThreshold ?? 0.02;
      thresholdLabel = `<= ${(maxErr * 100).toFixed(1)}%`;
      passed = observed <= maxErr;
      break;
    }
    case "error_rate_delta": {
      observed = Number(
        Math.max(0, candidateStats.errorRate - stableStats.errorRate).toFixed(4)
      );
      baseline = stableStats.errorRate;
      const maxDelta = gate.maxThreshold ?? 0.01;
      thresholdLabel = `delta <= ${(maxDelta * 100).toFixed(1)}pp`;
      passed = observed <= maxDelta;
      break;
    }
    case "p95_latency_ms": {
      observed = candidateStats.p95LatencyMs;
      baseline = stableStats.p95LatencyMs;
      const maxP95 = gate.maxThreshold ?? 250;
      thresholdLabel = `p95 <= ${maxP95}ms`;
      passed = observed <= maxP95;
      break;
    }
    case "p99_latency_ms": {
      observed = candidateStats.p99LatencyMs;
      baseline = stableStats.p99LatencyMs;
      const maxP99 = gate.maxThreshold ?? 400;
      thresholdLabel = `p99 <= ${maxP99}ms`;
      passed = observed <= maxP99;
      break;
    }
    case "saturation_pct": {
      observed = candidateStats.saturationPct;
      baseline = stableStats.saturationPct;
      const maxSat = gate.maxThreshold ?? 85;
      thresholdLabel = `saturation <= ${maxSat}%`;
      passed = observed <= maxSat;
      break;
    }
    case "slo_compliance": {
      // Reuse Phase 05.4.17 SLO evaluator
      const sloTarget = gate.minThreshold ?? 0.98;
      const total = Math.max(0, candidateStats.requests);
      const bad = Math.min(total, Math.max(0, candidateStats.errors));
      const observations: ServiceObservationSample[] = [];
      for (let i = 0; i < total; i++) {
        observations.push({
          timestampMs: nowMs,
          serviceId,
          durationMs: candidateStats.p95LatencyMs,
          ok: i >= bad,
        });
      }
      const sloRes = evaluateSLOForService(
        {
          id: `slo_${gate.id}`,
          name: gate.name,
          sliType: "availability",
          targetServiceId: serviceId,
          target: sloTarget,
          windowMs: Math.max(100, minDurationMs),
          windowType: "rolling",
        },
        observations,
        nowMs
      );
      observed = sloRes.compliance;
      baseline = 1 - stableStats.errorRate;
      thresholdLabel = `SLO >= ${(sloTarget * 100).toFixed(1)}%`;
      passed = !sloRes.breached;
      break;
    }
  }

  return {
    gateId: gate.id,
    gateName: gate.name,
    metric: gate.metric,
    evaluatedAtMs: nowMs,
    observedValue: observed,
    baselineValue: baseline,
    thresholdLabel,
    sampleCount: candidateStats.requests,
    outcome: passed ? "PASS" : "FAIL",
    consecutivePasses: passed ? previousConsecutivePasses + 1 : 0,
    explanation: passed
      ? `Gate passed (${observed} satisfies ${thresholdLabel}; n=${candidateStats.requests}).`
      : `Gate FAILED (${observed} violated ${thresholdLabel} vs stable baseline ${baseline}).`,
  };
}
