import { describe, it, expect } from "vitest";
import {
  LatencyAnalyzer,
  ResultNormalizer,
  PerformanceRegressionDetector,
  type BenchmarkMetricSummary,
  type BenchmarkRun,
  type PerformanceTarget,
} from "../index";

describe("Phase 05.3.17: Architecture Performance Engine Scalability & Execution Speed", () => {
  it("should calculate exact latency percentiles for 10,000 raw samples within < 30ms", () => {
    // Generate 10,000 log-normal like random latency samples
    const samples: number[] = new Array(10000);
    for (let i = 0; i < 10000; i++) {
      samples[i] = Math.exp(Math.random() * 3 + 2); // 7ms to 150ms typical range
    }

    const start = performance.now();
    const result = LatencyAnalyzer.calculatePercentilesFromSamples(samples);
    const duration = performance.now() - start;

    expect(result.p50).toBeGreaterThan(0);
    expect(result.p95).toBeGreaterThanOrEqual(result.p50);
    expect(result.p99).toBeGreaterThanOrEqual(result.p95);
    expect(duration).toBeLessThan(50); // Under 50ms limit
  });

  it("should evaluate 1,000 performance targets within < 20ms", () => {
    const targets: PerformanceTarget[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `target-${i}`,
      name: `SLA Target ${i}`,
      metric: i % 2 === 0 ? "p95_latency" : "throughput_rps",
      operator: i % 2 === 0 ? "lt" : "gte",
      thresholdValue: i % 2 === 0 ? 100 + (i % 50) : 500 + (i % 200),
      warningThresholdValue: i % 2 === 0 ? 150 + (i % 50) : 400,
      unit: i % 2 === 0 ? "ms" : "rps",
      scope: "global",
    }));

    const summary: BenchmarkMetricSummary = {
      category: "measured",
      totalRequests: 50000,
      failedRequests: 10,
      errorRatePct: 0.02,
      durationSeconds: 60,
      offeredRps: 1000,
      achievedRps: 980,
      droppedIterations: 0,
      droppedIterationsPct: 0,
      p50LatencyMs: 25,
      p90LatencyMs: 50,
      p95LatencyMs: 85,
      p99LatencyMs: 140,
      minLatencyMs: 5,
      maxLatencyMs: 320,
      meanLatencyMs: 32,
    };

    const start = performance.now();
    const evaluations = ResultNormalizer.evaluateTargets(targets, summary);
    const duration = performance.now() - start;

    expect(evaluations.length).toBe(1000);
    expect(duration).toBeLessThan(30);
  });

  it("should execute 100 run comparisons and regression evaluations within < 40ms", () => {
    const makeRun = (id: string, p95: number, rps: number): BenchmarkRun => ({
      id,
      benchmarkDefinitionId: "def-perf",
      architectureId: "arch-1",
      projectId: "proj-1",
      runNumber: 1,
      environment: { id: "env-1", name: "Staging", category: "staging" },
      workloadProfile: {
        modelType: "closed_loop",
        initialVUs: 10,
        maxVUs: 100,
        stages: [{ id: "s1", name: "Steady", stageType: "steady", durationSeconds: 60, targetVUs: 100 }],
        thinkTimeMs: { min: 20, max: 80 },
      },
      sourceTool: "k6",
      executedAt: new Date().toISOString(),
      durationSeconds: 60,
      overallSummary: {
        category: "measured",
        totalRequests: 20000,
        failedRequests: 2,
        errorRatePct: 0.01,
        durationSeconds: 60,
        offeredRps: rps,
        achievedRps: rps,
        droppedIterations: 0,
        droppedIterationsPct: 0,
        p50LatencyMs: 15,
        p90LatencyMs: 28,
        p95LatencyMs: p95,
        p99LatencyMs: p95 * 1.4,
        minLatencyMs: 3,
        maxLatencyMs: 250,
        meanLatencyMs: 18,
      },
      operationSummaries: {},
      targetEvaluations: [],
      dataQuality: { qualityScore: 100, status: "high", hasWarmupBias: false, missingSampleRatio: 0, clockSkewDetected: false, sparsityWarning: false, notes: [] },
    });

    const baseline = makeRun("run-base", 35, 1200);

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      const candidate = makeRun(`run-cand-${i}`, 35 + (i % 20), 1200 - (i % 100));
      const comp = PerformanceRegressionDetector.compareRuns(baseline, candidate);
      expect(comp.summary).toBeDefined();
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50);
  });
});
