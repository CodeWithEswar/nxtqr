import { describe, it, expect } from "vitest";
import {
  WorkloadValidator,
  PerformanceSafetyPolicy,
  LatencyAnalyzer,
  ResultNormalizer,
  PerformanceRegressionDetector,
  ModelCalibrator,
  type BenchmarkOperation,
  type ClosedLoopProfile,
  type OpenLoopProfile,
  type PerformanceTarget,
  type BenchmarkMetricSummary,
  type BenchmarkRun,
} from "../index";

describe("Phase 05.3.17: Architecture Performance Benchmarking Unit Tests", () => {
  describe("WorkloadValidator", () => {
    it("should validate and normalize operation weights correctly", () => {
      const ops: BenchmarkOperation[] = [
        { id: "op-1", name: "Browse", method: "GET", path: "/catalog", weight: 30, expectedStatus: 200 },
        { id: "op-2", name: "Cart", method: "POST", path: "/cart", weight: 10, expectedStatus: 201 },
      ];

      const normalized = WorkloadValidator.normalizeOperationWeights(ops);
      expect(normalized[0].weight).toBe(75);
      expect(normalized[1].weight).toBe(25);
    });

    it("should reject empty operations or invalid paths", () => {
      const profile: ClosedLoopProfile = {
        modelType: "closed_loop",
        initialVUs: 10,
        maxVUs: 50,
        stages: [{ id: "s1", name: "Warmup", stageType: "warmup", durationSeconds: 30, targetVUs: 20 }],
        thinkTimeMs: { min: 10, max: 100 },
      };

      const result = WorkloadValidator.validate(profile, []);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("At least one benchmark operation is required.");

      const invalidPathResult = WorkloadValidator.validate(profile, [
        { id: "op-bad", name: "Bad", method: "GET", path: "invalid-relative", weight: 10, expectedStatus: 200 },
      ]);
      expect(invalidPathResult.valid).toBe(false);
    });

    it("should validate closed-loop and open-loop constraints", () => {
      const invalidClosed: ClosedLoopProfile = {
        modelType: "closed_loop",
        initialVUs: 100,
        maxVUs: 50, // initial > max
        stages: [{ id: "s1", name: "Spike", stageType: "spike", durationSeconds: 60, targetVUs: 80 }],
        thinkTimeMs: { min: 200, max: 100 }, // min > max
      };

      const ops: BenchmarkOperation[] = [
        { id: "op-1", name: "API", method: "GET", path: "/health", weight: 100, expectedStatus: 200 },
      ];

      const resClosed = WorkloadValidator.validate(invalidClosed, ops);
      expect(resClosed.valid).toBe(false);
      expect(resClosed.errors.some((e) => e.includes("initialVUs cannot exceed maxVUs"))).toBe(true);

      const invalidOpen: OpenLoopProfile = {
        modelType: "open_loop",
        targetRps: 0, // non-positive
        maxExecutionCapacityVUs: -5,
        allocatedVUs: 0,
        droppedIterationBehavior: "drop",
        stages: [{ id: "s1", name: "Steady", stageType: "steady", durationSeconds: 60, targetRps: 0 }],
      };

      const resOpen = WorkloadValidator.validate(invalidOpen, ops);
      expect(resOpen.valid).toBe(false);
      expect(resOpen.errors.some((e) => e.includes("Open-loop targetRps must be greater than 0"))).toBe(true);
    });
  });

  describe("PerformanceSafetyPolicy", () => {
    it("should block loopback and cloud metadata targets by default", () => {
      const policy = new PerformanceSafetyPolicy({ allowPrivateNetworkTargets: false });

      expect(policy.evaluateTargetHost("http://localhost:8080").isValid).toBe(false);
      expect(policy.evaluateTargetHost("http://127.0.0.1:3000").isValid).toBe(false);
      expect(policy.evaluateTargetHost("http://169.254.169.254/latest/meta-data").isValid).toBe(false);
      expect(policy.evaluateTargetHost("https://staging.nxtqr.dev/api").isValid).toBe(true);
    });

    it("should enforce concurrency and arrival rate ceilings", () => {
      const policy = new PerformanceSafetyPolicy({
        maxAllowedVUs: 2000,
        maxAllowedRps: 5000,
        maxDurationSeconds: 3600,
      });

      const safeCheck = policy.validatePlan({
        targetHost: "https://loadtest.api.nxtqr.internal",
        totalVUs: 500,
        targetRps: 2500,
        durationSeconds: 1800,
      });
      expect(safeCheck.isSafe).toBe(true);

      const unsafeCheck = policy.validatePlan({
        targetHost: "https://loadtest.api.nxtqr.internal",
        totalVUs: 5000, // exceeds 2000
        targetRps: 10000, // exceeds 5000
        durationSeconds: 7200, // exceeds 3600
      });
      expect(unsafeCheck.isSafe).toBe(false);
      expect(unsafeCheck.violations.length).toBe(3);
    });
  });

  describe("LatencyAnalyzer (Mathematical Precision)", () => {
    it("should compute exact percentiles without averaging percentiles", () => {
      // 100 samples from 1 to 100 ms
      const samples = Array.from({ length: 100 }, (_, i) => i + 1);
      const res = LatencyAnalyzer.calculatePercentilesFromSamples(samples);

      expect(res.p50).toBe(50.5);
      expect(res.p90).toBe(90.1);
      expect(res.p95).toBe(95.05);
      expect(res.p99).toBe(99.01);
      expect(res.min).toBe(1);
      expect(res.max).toBe(100);
      expect(res.mean).toBe(50.5);
    });

    it("should compute quantiles from histogram buckets using linear interpolation", () => {
      const buckets = [
        { le: 10, count: 50 },
        { le: 20, count: 150 }, // 100 items between 10 and 20
        { le: 50, count: 200 }, // 50 items between 20 and 50
      ];

      // Median (100th item out of 200): exactly halfway through the 10-20 bucket => 15
      const median = LatencyAnalyzer.calculatePercentileFromHistogram(buckets, 0.5);
      expect(median).toBe(15);
    });
  });

  describe("ResultNormalizer", () => {
    it("should evaluate performance targets and flag passes, warnings, and failures", () => {
      const targets: PerformanceTarget[] = [
        { id: "t1", name: "P95 Latency", metric: "p95_latency", operator: "lt", thresholdValue: 50, warningThresholdValue: 80, unit: "ms", scope: "global" },
        { id: "t2", name: "Throughput", metric: "throughput_rps", operator: "gte", thresholdValue: 500, unit: "rps", scope: "global" },
        { id: "t3", name: "Error Rate", metric: "error_rate_pct", operator: "lte", thresholdValue: 0.1, unit: "%", scope: "global" },
      ];

      const summary: BenchmarkMetricSummary = {
        category: "measured",
        totalRequests: 10000,
        failedRequests: 5,
        errorRatePct: 0.05,
        durationSeconds: 60,
        offeredRps: 600,
        achievedRps: 580,
        droppedIterations: 0,
        droppedIterationsPct: 0,
        p50LatencyMs: 25,
        p90LatencyMs: 45,
        p95LatencyMs: 65, // breaches primary (50) but within warning (80)
        p99LatencyMs: 90,
        minLatencyMs: 5,
        maxLatencyMs: 150,
        meanLatencyMs: 30,
      };

      const evals = ResultNormalizer.evaluateTargets(targets, summary);
      expect(evals[0].status).toBe("warn"); // P95 warning
      expect(evals[1].status).toBe("passed"); // Throughput passed
      expect(evals[2].status).toBe("passed"); // Error rate passed
    });

    it("should detect tail latency skew and dropped iterations during data quality evaluation", () => {
      const summary: BenchmarkMetricSummary = {
        category: "measured",
        totalRequests: 2000,
        failedRequests: 20,
        errorRatePct: 1.0,
        durationSeconds: 120,
        offeredRps: 1000,
        achievedRps: 800,
        droppedIterations: 150,
        droppedIterationsPct: 6.97,
        p50LatencyMs: 10,
        p90LatencyMs: 30,
        p95LatencyMs: 80,
        p99LatencyMs: 220, // 22x P50 -> tail skew
        minLatencyMs: 2,
        maxLatencyMs: 850,
        meanLatencyMs: 22,
      };

      const quality = ResultNormalizer.evaluateDataQuality(summary);
      expect(quality.hasWarmupBias).toBe(true);
      expect(quality.notes.some((n) => n.includes("Dropped iterations detected"))).toBe(true);
      expect(quality.notes.some((n) => n.includes("Extreme tail latency skew"))).toBe(true);
    });
  });

  describe("PerformanceRegressionDetector", () => {
    it("should identify statistically meaningful regressions between baseline and candidate", () => {
      const mockRun = (p95: number, rps: number, errors: number, runNum: number): BenchmarkRun => ({
        id: `run-${runNum}`,
        benchmarkDefinitionId: "def-1",
        architectureId: "arch-1",
        projectId: "proj-1",
        runNumber: runNum,
        environment: { id: "env-1", name: "Staging", category: "staging" },
        workloadProfile: {
          modelType: "closed_loop",
          initialVUs: 10,
          maxVUs: 50,
          stages: [{ id: "s1", name: "Main", stageType: "steady", durationSeconds: 60, targetVUs: 50 }],
          thinkTimeMs: { min: 50, max: 100 },
        },
        sourceTool: "k6",
        executedAt: new Date().toISOString(),
        durationSeconds: 60,
        overallSummary: {
          category: "measured",
          totalRequests: 10000,
          failedRequests: errors,
          errorRatePct: (errors / 10000) * 100,
          durationSeconds: 60,
          offeredRps: rps,
          achievedRps: rps,
          droppedIterations: 0,
          droppedIterationsPct: 0,
          p50LatencyMs: 20,
          p90LatencyMs: 35,
          p95LatencyMs: p95,
          p99LatencyMs: p95 * 1.5,
          minLatencyMs: 5,
          maxLatencyMs: 300,
          meanLatencyMs: 25,
        },
        operationSummaries: {},
        targetEvaluations: [],
        dataQuality: { qualityScore: 95, status: "high", hasWarmupBias: false, missingSampleRatio: 0, clockSkewDetected: false, sparsityWarning: false, notes: [] },
      });

      const baseline = mockRun(40, 1000, 5, 1);
      const candidate = mockRun(95, 820, 85, 2); // P95 regressed +137.5%, throughput dropped -18%, errors rose to 0.85%

      const comp = PerformanceRegressionDetector.compareRuns(baseline, candidate);
      expect(comp.regressions.length).toBeGreaterThanOrEqual(3);
      expect(comp.regressions.some((r) => r.metric === "p95_latency" && r.severity === "critical")).toBe(true);
      expect(comp.regressions.some((r) => r.metric === "throughput_rps")).toBe(true);
      expect(comp.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("ModelCalibrator", () => {
    it("should validate predicted bottlenecks against empirical benchmark runs", () => {
      const nodes = [
        { id: "srv-order", type: "service", position: { x: 0, y: 0 }, data: { label: "Order Service", latencyMs: 15 } },
        { id: "db-primary", type: "database", position: { x: 0, y: 0 }, data: { label: "PostgreSQL Primary", latencyMs: 8 } },
      ];

      const predictions = [
        { nodeId: "srv-order", nodeLabel: "Order Service", predictedSaturationRps: 500 },
      ];

      const runSupported: BenchmarkRun = {
        id: "run-sat",
        benchmarkDefinitionId: "def-1",
        architectureId: "arch-1",
        projectId: "proj-1",
        runNumber: 1,
        environment: { id: "env-1", name: "Staging", category: "staging" },
        workloadProfile: {
          modelType: "open_loop",
          targetRps: 600,
          maxExecutionCapacityVUs: 200,
          allocatedVUs: 50,
          droppedIterationBehavior: "drop",
          stages: [{ id: "s1", name: "Peak", stageType: "steady", durationSeconds: 60, targetRps: 600 }],
        },
        sourceTool: "k6",
        executedAt: new Date().toISOString(),
        durationSeconds: 60,
        overallSummary: {
          category: "measured",
          totalRequests: 30000,
          failedRequests: 120,
          errorRatePct: 0.4,
          durationSeconds: 60,
          offeredRps: 600,
          achievedRps: 495, // capped around 500
          droppedIterations: 45,
          droppedIterationsPct: 0.15,
          p50LatencyMs: 65,
          p90LatencyMs: 180,
          p95LatencyMs: 340, // high latency at predicted saturation
          p99LatencyMs: 620,
          minLatencyMs: 8,
          maxLatencyMs: 1200,
          meanLatencyMs: 85,
        },
        operationSummaries: {},
        targetEvaluations: [],
        dataQuality: { qualityScore: 90, status: "high", hasWarmupBias: false, missingSampleRatio: 0, clockSkewDetected: false, sparsityWarning: false, notes: [] },
      };

      const validations = ModelCalibrator.validateBottlenecks(nodes, predictions, runSupported);
      expect(validations[0].verdict).toBe("supported");
      expect(validations[0].explanation).toContain("Supports modeled bottleneck prediction");
    });
  });
});
