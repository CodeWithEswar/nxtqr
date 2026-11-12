import { describe, it, expect } from "vitest";
import { performance } from "node:perf_hooks";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import {
  CANONICAL_SIMULATION_CAPABILITIES,
  CapabilityRegistry,
  CheckpointManager,
  CrossModuleExecutionPipeline,
  EventIntegrityVerifier,
  SimulationOrchestrator,
  UnifiedFindingsAggregator,
  ExecutionPlanner,
  ExecutionSnapshotManager,
} from "../../index";

function buildFullStackTopology(dbCapacityRps = 350, gwCapacityRps = 5000): {
  nodes: BaseNode[];
  edges: BaseEdge[];
} {
  const nodes: BaseNode[] = [
    { id: "n_dns", type: "dns", position: { x: 0, y: 0 }, label: "Route53 GeoDNS", data: { componentType: "dns" } },
    { id: "n_cdn", type: "cdn", position: { x: 100, y: 0 }, label: "Cloudflare Edge POP", data: { componentType: "cdn" } },
    { id: "n_gw", type: "api-gateway", position: { x: 200, y: 0 }, label: "API Gateway", data: { componentType: "api-gateway", capacityRps: gwCapacityRps, rateLimitRps: gwCapacityRps } },
    { id: "n_auth", type: "security", position: { x: 300, y: 0 }, label: "Zero Trust Auth", data: { componentType: "security", capacityRps: 4000 } },
    { id: "n_rl", type: "rate-limiter", position: { x: 400, y: 0 }, label: "Token Bucket Limiter", data: { componentType: "rate-limiter", capacityRps: 1200 } },
    { id: "n_lb", type: "load-balancer", position: { x: 500, y: 0 }, label: "L7 Load Balancer", data: { componentType: "load-balancer", capacityRps: 8000, replicas: 2 } },
    { id: "n_mesh", type: "service-mesh", position: { x: 600, y: 0 }, label: "Envoy Sidecar Mesh", data: { componentType: "service-mesh", capacityRps: 5000 } },
    { id: "n_svc", type: "service", position: { x: 700, y: 0 }, label: "Checkout Service", data: { componentType: "service", capacityRps: 600, replicas: 2 } },
    { id: "n_cache", type: "cache", position: { x: 800, y: 0 }, label: "Redis Cluster", data: { componentType: "cache", capacityRps: 3000, hitRatio: 0.85 } },
    { id: "n_db", type: "database", position: { x: 900, y: 0 }, label: "Primary Postgres", data: { componentType: "database", capacityRps: dbCapacityRps, replicas: 1 } },
    { id: "n_q", type: "queue", position: { x: 1000, y: 0 }, label: "Orders Kafka Topic", data: { componentType: "queue", capacityRps: 2000 } },
    { id: "n_obs", type: "observability", position: { x: 1100, y: 0 }, label: "OTel Collector", data: { componentType: "observability" } },
  ];

  const edges: BaseEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    edges.push({
      id: `e_${i}`,
      source: nodes[i]!.id,
      target: nodes[i + 1]!.id,
      type: "smoothstep",
      label: "http",
      data: {},
    });
  }

  return { nodes, edges };
}

function buildSyntheticGraph(nodeCount: number): { nodes: BaseNode[]; edges: BaseEdge[] } {
  const kinds = ["client", "api-gateway", "load-balancer", "service", "cache", "database", "queue"];
  const nodes: BaseNode[] = [];
  const edges: BaseEdge[] = [];
  for (let i = 0; i < nodeCount; i += 1) {
    const kind = kinds[i % kinds.length]!;
    nodes.push({
      id: `node_${i}`,
      type: kind,
      position: { x: (i % 10) * 120, y: Math.floor(i / 10) * 100 },
      label: `${kind}-${i}`,
      data: { componentType: kind, capacityRps: 500 },
    });
    if (i > 0) {
      edges.push({
        id: `edge_${i}`,
        source: `node_${i - 1}`,
        target: `node_${i}`,
        type: "smoothstep",
        data: {},
      });
    }
  }
  return { nodes, edges };
}

describe("Phase 05.4.25 Unified Simulation Orchestrator & Cross-Module Integration", () => {
  it("registers all 24 Phase 05.4 capabilities canonically and detects topology gaps accurately", () => {
    expect(CANONICAL_SIMULATION_CAPABILITIES).toHaveLength(24);
    const { nodes, edges } = buildFullStackTopology();
    const fullInspection = CapabilityRegistry.inspectTopology(nodes, edges);

    expect(fullInspection.nodeCount).toBe(12);
    expect(fullInspection.misconfiguredCapabilities).toHaveLength(0);
    expect(fullInspection.supportedCapabilities.length).toBeGreaterThanOrEqual(20);

    // Empty topology correctly marks simulation capabilities unsupported
    const emptyInspection = CapabilityRegistry.inspectTopology([], []);
    expect(emptyInspection.topologyWarnings.length).toBeGreaterThan(0);
    expect(emptyInspection.unsupportedCapabilities.length).toBeGreaterThanOrEqual(20);
  });

  it("enforces bit-for-bit determinism for identical inputs/seeds across SimulationOrchestrator and legacy ExecutionPlanner", () => {
    const { nodes, edges } = buildFullStackTopology();
    const orchA = new SimulationOrchestrator();
    const orchB = new SimulationOrchestrator();

    const runA = orchA.createRun(nodes, edges, { capabilityId: "observability", seed: 777, incomingRps: 250 });
    const doneA = orchA.executeRun(runA.runId);
    const fpA = orchA.computeRunFingerprint(doneA.runId);

    const runB = orchB.createRun(nodes, edges, { capabilityId: "observability", seed: 777, incomingRps: 250 });
    const doneB = orchB.executeRun(runB.runId);
    const fpB = orchB.computeRunFingerprint(doneB.runId);

    expect(fpA).toBe(fpB);
    expect(doneA.trace?.events).toEqual(doneB.trace?.events);
    expect(doneA.findings.map((f) => f.id)).toEqual(doneB.findings.map((f) => f.id));

    // Legacy ExecutionPlanner also produces zero clock/random drift across identical runs
    const snap1 = ExecutionSnapshotManager.createSnapshot("arch_1", "rev_1", "DetTest", nodes, edges);
    const snap2 = ExecutionSnapshotManager.createSnapshot("arch_1", "rev_1", "DetTest", nodes, edges);
    const trace1 = ExecutionPlanner.planExecution(snap1, {
      version: 1,
      entryNodeId: "n_dns",
      request: { id: "req_det", method: "GET", path: "/health", headers: {} },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxHops: 30, maxEvents: 200, maxDurationMs: 10000 },
      timing: { nodeDurationMs: 10, edgeDurationMs: 5 },
    });
    const trace2 = ExecutionPlanner.planExecution(snap2, {
      version: 1,
      entryNodeId: "n_dns",
      request: { id: "req_det", method: "GET", path: "/health", headers: {} },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxHops: 30, maxEvents: 200, maxDurationMs: 10000 },
      timing: { nodeDurationMs: 10, edgeDurationMs: 5 },
    });

    expect(trace1.runId).toBe(trace2.runId);
    expect(trace1.events).toEqual(trace2.events);
  });

  it("verifies checkpoint forward-replay state hash equivalence across arbitrary seek indices", () => {
    const { nodes, edges } = buildFullStackTopology();
    const orchestrator = new SimulationOrchestrator();
    const run = orchestrator.createRun(nodes, edges, {
      capabilityId: "observability",
      checkpointInterval: 3,
      seed: 99,
      incomingRps: 250,
    });
    const completed = orchestrator.executeRun(run.runId);

    expect(completed.checkpoints.length).toBeGreaterThanOrEqual(2);
    expect(completed.frames.length).toBeGreaterThan(4);

    for (let step = 0; step < completed.frames.length; step += 1) {
      const seekRes = orchestrator.seekStep(completed.runId, step);
      const directReplay = CheckpointManager.seekWithCheckpointReplay(
        completed.frames,
        completed.checkpoints,
        step
      );
      expect(seekRes.stateHash).toBe(directReplay.stateHash);
      expect(seekRes.record.currentStepIndex).toBe(step);
    }
  });

  it("executes composable full-stack causal flow DNS -> CDN -> Gateway -> Auth -> RL -> LB -> Mesh -> Service -> Cache -> DB -> Queue -> OTel", () => {
    const { nodes, edges } = buildFullStackTopology(500, 5000);
    const result = CrossModuleExecutionPipeline.execute({
      nodes,
      edges,
      config: {
        architectureId: "arch_e2e",
        revisionId: "rev_1",
        capabilityId: "observability",
        seed: 42,
        checkpointInterval: 5,
        maxSteps: 500,
        maxEvents: 1000,
        maxDurationMs: 60000,
        maxConcurrentRequests: 250,
        incomingRps: 250,
        faultKind: "none",
      },
    });

    expect(result.outcome).toBe("success");
    expect(result.terminalStatusCode).toBe(200);
    expect(result.deliveredRps).toBe(250);
    expect(result.integrity.valid).toBe(true);

    const traversedLayers = result.hops.map((h) => h.layer);
    expect(traversedLayers).toEqual([
      "dns",
      "cdn",
      "gateway",
      "auth",
      "rate-limiter",
      "load-balancer",
      "service-mesh",
      "service",
      "cache",
      "database",
      "queue",
      "observability",
    ]);
  });

  it("enforces Zero Trust security invariant: denied auth halts downstream service/cache/DB calls", () => {
    const { nodes, edges } = buildFullStackTopology();
    const result = CrossModuleExecutionPipeline.execute({
      nodes,
      edges,
      config: {
        architectureId: "arch_sec",
        revisionId: "rev_1",
        capabilityId: "zero-trust",
        seed: 42,
        checkpointInterval: 5,
        maxSteps: 500,
        maxEvents: 1000,
        maxDurationMs: 60000,
        maxConcurrentRequests: 250,
        incomingRps: 200,
        denyAuth: true,
        faultKind: "none",
      },
    });

    expect(result.outcome).toBe("blocked-security");
    expect(result.shortCircuitedAtLayer).toBe("auth");
    expect(result.terminalStatusCode).toBe(403);
    expect(result.deliveredRps).toBe(0);

    const executedLayers = new Set(result.hops.map((h) => h.layer));
    expect(executedLayers.has("service")).toBe(false);
    expect(executedLayers.has("cache")).toBe(false);
    expect(executedLayers.has("database")).toBe(false);
    expect(executedLayers.has("queue")).toBe(false);

    expect(result.findings.some((f) => f.category === "security")).toBe(true);
  });

  it("enforces database outage propagation and true bottleneck throughput cap invariant", () => {
    // 1. Outage propagation
    const { nodes, edges } = buildFullStackTopology(300, 10000);
    const outage = CrossModuleExecutionPipeline.execute({
      nodes,
      edges,
      config: {
        architectureId: "arch_outage",
        revisionId: "rev_1",
        capabilityId: "resilience",
        seed: 42,
        checkpointInterval: 5,
        maxSteps: 500,
        maxEvents: 1000,
        maxDurationMs: 60000,
        maxConcurrentRequests: 250,
        incomingRps: 200,
        faultKind: "database_outage",
      },
    });

    expect(outage.outcome).toBe("failed");
    expect(outage.terminalStatusCode).toBe(503);
    expect(outage.findings.some((f) => f.severity === "critical")).toBe(true);

    // 2. Bottleneck law: scaling gateway to 50,000 RPS while DB stays at 300 RPS keeps deliveredRps == 300!
    const { nodes: scaledGwNodes, edges: scaledEdges } = buildFullStackTopology(300, 50000);
    const bottleneckRun = CrossModuleExecutionPipeline.execute({
      nodes: scaledGwNodes,
      edges: scaledEdges,
      config: {
        architectureId: "arch_bottleneck",
        revisionId: "rev_1",
        capabilityId: "capacity",
        seed: 42,
        checkpointInterval: 5,
        maxSteps: 500,
        maxEvents: 1000,
        maxDurationMs: 60000,
        maxConcurrentRequests: 500,
        incomingRps: 900,
        faultKind: "none",
      },
    });

    expect(bottleneckRun.bottleneckNodeId).toBe("n_db");
    expect(bottleneckRun.bottleneckEffectiveRps).toBe(300);
    expect(bottleneckRun.deliveredRps).toBe(300);
    expect(bottleneckRun.errorRatePercent).toBeGreaterThan(60);
  });

  it("enforces EventIntegrityVerifier failure detection on corrupted traces and zero state leaks on rapid cancellation", () => {
    const emptyReport = EventIntegrityVerifier.verifyTrace(null);
    expect(emptyReport.valid).toBe(false);
    expect(emptyReport.issues[0]?.code).toBe("EMPTY_TRACE");

    // Non-monotonic timestamp / sequence detection
    const { nodes, edges } = buildFullStackTopology();
    const pipeline = CrossModuleExecutionPipeline.execute({
      nodes,
      edges,
      config: {
        architectureId: "arch_corrupt",
        revisionId: "rev_1",
        capabilityId: "core-flow",
        seed: 1,
        checkpointInterval: 5,
        maxSteps: 500,
        maxEvents: 500,
        maxDurationMs: 10000,
        maxConcurrentRequests: 50,
        faultKind: "none",
      },
    });

    const corruptedEvents = [...pipeline.trace.events];
    if (corruptedEvents.length >= 2) {
      corruptedEvents[1] = {
        ...corruptedEvents[1]!,
        sequence: corruptedEvents[0]!.sequence, // violation
        atMs: -5, // violation
      };
    }
    const corruptReport = EventIntegrityVerifier.verifyTrace(
      { ...pipeline.trace, events: corruptedEvents },
      nodes,
      edges
    );
    expect(corruptReport.valid).toBe(false);
    expect(corruptReport.issues.some((i) => i.code === "NON_MONOTONIC_SEQUENCE")).toBe(true);
    expect(corruptReport.issues.some((i) => i.code === "NON_MONOTONIC_TIMESTAMP")).toBe(true);

    // Rapid create -> cancel -> dispose stress test (25 runs, zero zombie state)
    const stressOrch = new SimulationOrchestrator();
    for (let i = 0; i < 25; i += 1) {
      const r = stressOrch.createRun(nodes, edges, { seed: i + 10 });
      stressOrch.cancelRun(r.runId, "Stress cancellation");
      expect(stressOrch.getAbortSignal(r.runId)).toBeUndefined();
      stressOrch.disposeRun(r.runId);
    }
    expect(stressOrch.listRunSummaries()).toHaveLength(0);

    // Findings deduplication proof
    const findings = UnifiedFindingsAggregator.aggregate({
      nodes,
      edges,
      trace: pipeline.trace,
    });
    const keys = findings.map((f) => f.dedupeKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("measures real simulation latency across small (8), medium (50), and large (200) topologies within practical bounds", () => {
    const sizes = [8, 50, 200];
    const measuredTimingsMs: Record<number, number> = {};

    for (const size of sizes) {
      const { nodes, edges } = buildSyntheticGraph(size);
      const orch = new SimulationOrchestrator();
      const t0 = performance.now();
      const run = orch.createRun(nodes, edges, {
        capabilityId: "observability",
        incomingRps: 400,
        seed: size,
      });
      const completed = orch.executeRun(run.runId);
      const elapsed = performance.now() - t0;
      measuredTimingsMs[size] = Number(elapsed.toFixed(2));
      expect(completed.state).toBe("completed");
      expect(completed.integrity?.valid).toBe(true);
      orch.disposeRun(run.runId);
    }

    // Even 200-node topology inspection + orchestration should stay well under 1000ms
    expect(measuredTimingsMs[200]).toBeLessThan(1000);
  });
});
