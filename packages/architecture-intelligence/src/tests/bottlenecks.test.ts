import { describe, it, expect } from "vitest";
import { bottleneckEngine } from "../bottlenecks/engine/bottleneck-engine";
import { DEFAULT_WORKLOAD_SCENARIOS } from "../bottlenecks/scenarios/scenario-registry";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

describe("Bottleneck Detection Engine", () => {
  it("detects service saturation (BOT-SRV-001) when demand exceeds declared capacity", () => {
    const nodes: BaseNode[] = [
      { id: "client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "api", type: "api-gateway", position: { x: 100, y: 0 }, data: { replicas: 1 } },
      // Worker with low explicit capacity of 300 rps
      { id: "worker", type: "container-service", position: { x: 250, y: 0 }, data: { capacityRps: 300, replicas: 1 } },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "client", target: "api", data: { relationshipKind: "request-response" } },
      { id: "e2", source: "api", target: "worker", data: { relationshipKind: "request-response" } },
    ];

    // Under normal traffic (1,000 rps), worker capacity (300 rps) is exceeded (utilization ~333%)
    const report = bottleneckEngine.analyzeGraph(nodes, edges, DEFAULT_WORKLOAD_SCENARIOS.normal_traffic);

    const srvFinding = report.findings.find((f) => f.ruleId === "BOT-SRV-001" && f.affectedNodeIds.includes("worker"));
    expect(srvFinding).toBeDefined();
    expect(srvFinding?.severity).toBe("critical");
    expect(srvFinding?.calculations.length).toBeGreaterThan(0);

    const workerUtil = report.nodeUtilization["worker"];
    expect(workerUtil.status).toBe("exceeding_capacity");
    expect(workerUtil.utilizationRatio).toBeGreaterThan(1.0);
  });

  it("detects queue backlog accumulation (BOT-QUE-001) when arrival rate exceeds consumer capacity", () => {
    const nodes: BaseNode[] = [
      { id: "ingress", type: "api-gateway", position: { x: 0, y: 0 }, data: {} },
      { id: "task_queue", type: "message-queue", position: { x: 150, y: 0 }, data: {} },
      // Consumer with only 200 rps processing limit
      { id: "consumer", type: "container-service", position: { x: 300, y: 0 }, data: { capacityRps: 200, replicas: 1 } },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "ingress", target: "task_queue", data: { relationshipKind: "event-delivery" } },
      { id: "e2", source: "task_queue", target: "consumer", data: { relationshipKind: "stream" } },
    ];

    const report = bottleneckEngine.analyzeGraph(nodes, edges, DEFAULT_WORKLOAD_SCENARIOS.normal_traffic);

    const queueFinding = report.findings.find((f) => f.ruleId === "BOT-QUE-001");
    expect(queueFinding).toBeDefined();
    expect(report.queueMetrics["task_queue"]).toBeDefined();
    expect(report.queueMetrics["task_queue"].isSaturating).toBe(true);
    expect(report.queueMetrics["task_queue"].netBacklogGrowthMsgPerSec).toBeGreaterThan(0);
  });

  it("detects database throughput saturation and connection pool exhaustion", () => {
    const nodes: BaseNode[] = [
      { id: "api", type: "api-gateway", position: { x: 0, y: 0 }, data: {} },
      { id: "svc", type: "container-service", position: { x: 150, y: 0 }, data: { replicas: 4 } },
      // Database with low capacity of 500 ops and pool of 20
      {
        id: "db_main",
        type: "relational-database",
        position: { x: 300, y: 0 },
        data: { declaredCapacityOps: 500, connectionPoolSize: 20, processingTimeMs: 25 },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "api", target: "svc", data: { relationshipKind: "request-response" } },
      { id: "e2", source: "svc", target: "db_main", data: { relationshipKind: "database-access" } },
    ];

    const report = bottleneckEngine.analyzeGraph(nodes, edges, DEFAULT_WORKLOAD_SCENARIOS.normal_traffic);

    const dbFinding = report.findings.find((f) => f.ruleId === "BOT-DB-001");
    expect(dbFinding).toBeDefined();
    expect(dbFinding?.bottleneckType).toBe("database_contention");

    const poolFinding = report.findings.find((f) => f.ruleId === "BOT-DB-POOL-001");
    expect(poolFinding).toBeDefined();
  });

  it("detects cache miss leakage under low hit-rate scenario", () => {
    const nodes: BaseNode[] = [
      { id: "svc", type: "container-service", position: { x: 0, y: 0 }, data: {} },
      { id: "cache", type: "distributed-cache", position: { x: 150, y: 0 }, data: {} },
      { id: "db", type: "relational-database", position: { x: 300, y: 0 }, data: {} },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "svc", target: "cache", data: { relationshipKind: "cache-access" } },
      { id: "e2", source: "cache", target: "db", data: { relationshipKind: "database-access" } },
    ];

    // Under write_heavy or batch_processing scenario with cacheHitRate = 0.40
    const report = bottleneckEngine.analyzeGraph(nodes, edges, DEFAULT_WORKLOAD_SCENARIOS.write_heavy);

    const cacheFinding = report.findings.find((f) => f.ruleId === "BOT-CACHE-001");
    expect(cacheFinding).toBeDefined();
    expect(cacheFinding?.bottleneckType).toBe("cache_miss_amplification");
  });

  it("compares normal vs peak traffic scenarios deterministically", () => {
    const nodes: BaseNode[] = [
      { id: "gw", type: "api-gateway", position: { x: 0, y: 0 }, data: {} },
      { id: "svc", type: "container-service", position: { x: 150, y: 0 }, data: { replicas: 3 } }, // ~2400 rps capacity
    ];
    const edges: BaseEdge[] = [
      { id: "e1", source: "gw", target: "svc", data: { relationshipKind: "request-response" } },
    ];

    const normalReport = bottleneckEngine.analyzeGraph(nodes, edges, DEFAULT_WORKLOAD_SCENARIOS.normal_traffic);
    // Under normal (1,000 rps), svc utilization is ~42% (optimal)
    expect(normalReport.nodeUtilization["svc"].status).toBe("optimal");
    expect(normalReport.findings.length).toBe(0);

    const spikeReport = bottleneckEngine.analyzeGraph(nodes, edges, DEFAULT_WORKLOAD_SCENARIOS.traffic_spike);
    // Under spike (25,000 rps effective), svc is massively overloaded
    expect(spikeReport.nodeUtilization["svc"].status).toBe("exceeding_capacity");
    expect(spikeReport.findings.length).toBeGreaterThan(0);
  });
});

