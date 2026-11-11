import { describe, it, expect } from "vitest";
import {
  architecturePerformanceEngine,
  architectureToolRegistry,
  architectureReportEngine,
  ReportExportCoordinator,
  type BenchmarkDefinition,
} from "../index";

describe("Phase 05.3.17: Architecture Performance Integration Tests", () => {
  const sampleDefinition: BenchmarkDefinition = {
    id: "def-ecommerce-checkout",
    projectId: "proj-ecommerce",
    architectureId: "arch-ecommerce",
    name: "E-Commerce Checkout Peak Load Test",
    description: "Evaluates end-to-end checkout flow latency under 1,500 RPS arrival rate.",
    testType: "load",
    workloadProfile: {
      modelType: "open_loop",
      targetRps: 1500,
      maxExecutionCapacityVUs: 500,
      allocatedVUs: 150,
      droppedIterationBehavior: "drop",
      stages: [
        { id: "s1", name: "Warmup", stageType: "warmup", durationSeconds: 30, targetRps: 200 },
        { id: "s2", name: "Ramp-up", stageType: "ramp_up", durationSeconds: 60, targetRps: 1500 },
        { id: "s3", name: "Peak Sustained", stageType: "steady", durationSeconds: 120, targetRps: 1500 },
        { id: "s4", name: "Cooldown", stageType: "cooldown", durationSeconds: 30, targetRps: 100 },
      ],
    },
    operations: [
      { id: "op-1", name: "Search Products", method: "GET", path: "/api/products", weight: 60, expectedStatus: 200, targetComponentId: "srv-search" },
      { id: "op-2", name: "Add To Cart", method: "POST", path: "/api/cart/items", weight: 30, expectedStatus: 201, targetComponentId: "srv-cart" },
      { id: "op-3", name: "Submit Order", method: "POST", path: "/api/checkout", weight: 10, expectedStatus: 200, targetComponentId: "srv-order" },
    ],
    targets: [
      { id: "t1", name: "Search P95 Latency", metric: "p95_latency", operator: "lt", thresholdValue: 80, unit: "ms", scope: "operation", targetId: "op-1" },
      { id: "t2", name: "Checkout P99 Latency", metric: "p99_latency", operator: "lt", thresholdValue: 350, unit: "ms", scope: "operation", targetId: "op-3" },
      { id: "t3", name: "Total Error Rate", metric: "error_rate_pct", operator: "lt", thresholdValue: 0.5, unit: "%", scope: "global" },
    ],
    targetHost: "https://staging-loadtest.nxtqr.dev",
    environment: {
      id: "env-loadtest",
      name: "Staging Dedicated Load VPC",
      category: "load_test",
      region: "us-east-1",
      computeSpec: "8x c6i.2xlarge",
      generatorSpec: "k6 v0.48.0 distributed (4 runners)",
    },
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("should generate a valid, runnable k6 ECMAScript test script", () => {
    const script = architecturePerformanceEngine.exportK6Script(sampleDefinition);

    expect(script).toContain("import http from 'k6/http';");
    expect(script).toContain("import { check, sleep } from 'k6';");
    expect(script).toContain("open_loop_exec: {");
    expect(script).toContain("ramping-arrival-rate");
    expect(script).toContain("https://staging-loadtest.nxtqr.dev");
    expect(script).toContain("Search Products");
    expect(script).toContain("Submit Order");
    expect(script).toContain("http_req_duration");
  });

  it("should import k6 summary JSON into a structured BenchmarkRun with target evaluations", () => {
    const rawK6Summary = {
      metrics: {
        http_req_duration: {
          values: {
            "p(50)": 34.2,
            "p(90)": 62.5,
            "p(95)": 78.4,
            "p(99)": 142.1,
            min: 6.2,
            max: 420.5,
            avg: 41.8,
          },
        },
        http_reqs: { values: { count: 360000, rate: 1485.2 } },
        http_req_failed: { values: { count: 48, passes: 48, fails: 359952, rate: 0.000133 } },
        iterations: { values: { count: 360000, rate: 1485.2 } },
        dropped_iterations: { values: { count: 18 } },
        "http_req_duration{name:Search Products,operation_id:op-1,component:srv-search}": {
          values: { count: 216000, "p(50)": 18.2, "p(95)": 42.1, "p(99)": 88.0, rate: 891.0 },
        },
        "http_req_duration{name:Submit Order,operation_id:op-3,component:srv-order}": {
          values: { count: 36000, "p(50)": 125.0, "p(95)": 280.5, "p(99)": 342.0, rate: 148.5 },
        },
      },
      state: { testRunDurationMs: 240000 },
    };

    const run = architecturePerformanceEngine.importK6Result(rawK6Summary, {
      definitionId: sampleDefinition.id,
      architectureId: sampleDefinition.architectureId,
      projectId: sampleDefinition.projectId,
      environment: sampleDefinition.environment,
      workloadProfile: sampleDefinition.workloadProfile,
      runNumber: 1,
      targets: sampleDefinition.targets,
    });

    expect(run.id).toBeDefined();
    expect(run.overallSummary.totalRequests).toBe(360000);
    expect(run.overallSummary.achievedRps).toBe(1485.2);
    expect(run.overallSummary.p95LatencyMs).toBe(78.4);
    expect(run.overallSummary.p99LatencyMs).toBe(142.1);
    expect(run.overallSummary.droppedIterations).toBe(18);
    expect(run.dataQuality.status).toBe("high");
    expect(run.dataQuality.qualityScore).toBeGreaterThanOrEqual(85);

    // Operation breakdowns
    expect(run.operationSummaries["op-1"]).toBeDefined();
    expect(run.operationSummaries["op-1"].operationName).toBe("Search Products");
    expect(run.operationSummaries["op-1"].p95LatencyMs).toBe(42.1);

    expect(run.operationSummaries["op-3"]).toBeDefined();
    expect(run.operationSummaries["op-3"].operationName).toBe("Submit Order");
    expect(run.operationSummaries["op-3"].p95LatencyMs).toBe(280.5);

    // Targets evaluation
    expect(run.targetEvaluations.length).toBe(3);
    expect(run.targetEvaluations.every((t) => t.status === "passed")).toBe(true);
  });

  it("should execute AI Architecture Assistant Tool #20 (get_performance_benchmark)", async () => {
    const tool = architectureToolRegistry.getTool("get_performance_benchmark");
    expect(tool).toBeDefined();

    const result = (await tool!.execute(
      {
        workloadType: "open_loop",
        targetRps: 1200,
        compareWithBaseline: true,
      },
      {
        projectId: "proj-1",
        architectureId: "arch-1",
        graphRevision: "rev-1",
        nodes: [
          { id: "api-gw", type: "api_gateway", position: { x: 0, y: 0 }, data: { label: "Ingress Gateway" } },
          { id: "srv-order", type: "service", position: { x: 100, y: 0 }, data: { label: "Order Service" } },
        ],
        edges: [{ id: "e1", source: "api-gw", target: "srv-order", data: {} }],
      }
    )) as any;

    expect(result).toBeDefined();
    expect(result.workloadModel).toBe("open_loop");
    expect(result.metricsSummary.category).toBe("measured");
    expect(result.metricsSummary.totalRequests).toBeGreaterThan(0);
    expect(result.targetEvaluations.length).toBeGreaterThan(0);
    expect(result.bottleneckValidations.length).toBeGreaterThan(0);
  });

  it("should generate Architecture Report containing the 'benchmark' section and export to Markdown & HTML", async () => {
    const nodes = [
      { id: "gw", type: "api_gateway", position: { x: 0, y: 0 }, data: { label: "API Gateway" } },
      { id: "srv", type: "service", position: { x: 100, y: 0 }, data: { label: "Checkout Service" } },
    ];
    const edges = [{ id: "e1", source: "gw", target: "srv", data: {} }];

    const benchmarkRun = architecturePerformanceEngine.importK6Result(
      {
        metrics: {
          http_req_duration: {
            values: { "p(50)": 18.5, "p(90)": 35.0, "p(95)": 48.0, "p(99)": 85.0, min: 3.0, max: 210.0, avg: 22.0 },
          },
          http_reqs: { values: { count: 50000, rate: 820.0 } },
          http_req_failed: { values: { count: 12, passes: 12, fails: 49988, rate: 0.00024 } },
          iterations: { values: { count: 50000, rate: 820.0 } },
          dropped_iterations: { values: { count: 0 } },
        },
        state: { testRunDurationMs: 60000 },
      },
      {
        definitionId: "def-ci-test",
        architectureId: "arch-perf-report",
        projectId: "proj-reports",
        environment: { id: "env-stg", name: "Staging Cluster", category: "staging" },
        workloadProfile: {
          modelType: "closed_loop",
          initialVUs: 10,
          maxVUs: 80,
          stages: [{ id: "s1", name: "Steady", stageType: "steady", durationSeconds: 60, targetVUs: 80 }],
          thinkTimeMs: { min: 20, max: 80 },
        },
        runNumber: 1,
      }
    );

    const report = await architectureReportEngine.generateReport({
      projectId: "proj-reports",
      architectureId: "arch-perf-report",
      title: "Performance Engineering Benchmark Verification Report",
      enabledSections: ["overview", "benchmark"],
      nodes,
      edges,
      analysisContext: {
        benchmark: {
          run: benchmarkRun,
        },
      },
    });

    const benchSection = report.sections.find((s) => s.kind === "benchmark");
    expect(benchSection).toBeDefined();
    expect(benchSection!.title).toBe("Performance Benchmarking & Load Testing");

    // Markdown export
    const mdResult = ReportExportCoordinator.exportReport(report, { format: "markdown" });
    expect(mdResult.content).toContain("Performance Benchmarking & Load Testing");
    expect(mdResult.content).toContain("Measured Latency Percentiles");
    expect(mdResult.content).toContain("48.0 ms");

    // HTML export
    const htmlResult = ReportExportCoordinator.exportReport(report, { format: "html" });
    expect(htmlResult.content).toContain("Performance Benchmarking &amp; Load Testing");
    expect(htmlResult.content).toContain("Measured Latency Distribution");
    expect(htmlResult.content).toContain("P95");
  });
});
