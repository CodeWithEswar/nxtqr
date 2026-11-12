import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { ExecutionSnapshotManager } from "../domain/execution-snapshot";
import { WorkloadGenerator } from "../traffic/workload-generator";
import { WorkerPool } from "../traffic/worker-pool";
import { RequestQueueManager } from "../traffic/request-queue";
import { RateLimiterEngine } from "../traffic/rate-limiter";
import { AutoscalingEngine } from "../traffic/autoscaling-engine";
import { MetricAggregator, type CompletedRequestRecord } from "../traffic/metric-aggregator";
import { TrafficPresetFactory, TRAFFIC_PRESET_DEFINITIONS } from "../traffic/traffic-presets";
import { TrafficSimulationEngine } from "../traffic/traffic-simulation-engine";
import type {
  TrafficScenario,
  ServiceCapacityConfig,
  RateLimiterConfig,
  AutoscalingPolicy,
  ModeledTrafficQueue,
} from "../traffic/traffic-schemas";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";

const baseConfig: ExecutionConfiguration = {
  version: 1,
  entryNodeId: "node_gw",
  request: { id: "req_traffic", method: "GET", path: "/api/products", headers: {} },
  routing: { mode: "deterministic", selectedBranches: {} },
  limits: { maxHops: 20, maxEvents: 500, maxDurationMs: 60000 },
  timing: { nodeDurationMs: 50, edgeDurationMs: 50 },
};

const sampleNodes: BaseNode[] = [
  {
    id: "node_gw",
    type: "gateway",
    label: "API Gateway",
    position: { x: 0, y: 0 },
    data: { componentType: "gateway" },
  },
  {
    id: "node_service",
    type: "service",
    label: "Product Service",
    position: { x: 250, y: 0 },
    data: { componentType: "service" },
  },
  {
    id: "node_db",
    type: "database",
    label: "Product DB",
    position: { x: 500, y: 0 },
    data: { componentType: "database" },
  },
];

const sampleEdges: BaseEdge[] = [
  {
    id: "edge_gw_srv",
    source: "node_gw",
    target: "node_service",
    type: "smoothstep",
    data: {},
  },
  {
    id: "edge_srv_db",
    source: "node_service",
    target: "node_db",
    type: "smoothstep",
    data: {},
  },
];

describe("Workload Generator", () => {
  it("generates open-loop constant arrival schedule", () => {
    const scenario: TrafficScenario = {
      version: 1,
      id: "sc_const",
      name: "Constant Test",
      description: "Test constant rate",
      entryNodeId: "node_gw",
      mode: "open_loop",
      workload: {
        type: "constant",
        requestsPerSecond: 20,
      },
      durationMs: 1000,
      limits: {
        maxRequests: 50,
        maxEvents: 500,
        maxVirtualDurationMs: 10000,
        metricSamplingIntervalMs: 500,
      },
      capacities: {},
      rateLimiters: {},
      autoscaling: {},
      seed: 42,
    };

    const arrivals = WorkloadGenerator.generateArrivals(scenario);
    expect(arrivals.length).toBeGreaterThanOrEqual(18);
    expect(arrivals.length).toBeLessThanOrEqual(22);
    expect(arrivals[0].arrivalMs).toBeGreaterThanOrEqual(0);
    // Monotonically increasing
    for (let i = 1; i < arrivals.length; i++) {
      expect(arrivals[i].arrivalMs).toBeGreaterThanOrEqual(arrivals[i - 1].arrivalMs);
    }
  });

  it("generates open-loop burst arrival schedule", () => {
    const scenario: TrafficScenario = {
      version: 1,
      id: "sc_burst",
      name: "Burst Test",
      description: "Test burst rate",
      entryNodeId: "node_gw",
      mode: "open_loop",
      workload: {
        type: "burst",
        baselineRps: 10,
        burstRps: 50,
        startAtMs: 200,
        durationMs: 400,
      },
      durationMs: 1000,
      limits: {
        maxRequests: 100,
        maxEvents: 500,
        maxVirtualDurationMs: 5000,
        metricSamplingIntervalMs: 250,
      },
      capacities: {},
      rateLimiters: {},
      autoscaling: {},
      seed: 42,
    };

    const arrivals = WorkloadGenerator.generateArrivals(scenario);
    expect(arrivals.length).toBeGreaterThan(15);
  });

  it("generates closed-loop virtual users schedule", () => {
    const scenario: TrafficScenario = {
      version: 1,
      id: "sc_closed",
      name: "Closed-Loop Users",
      description: "Virtual users with think time",
      entryNodeId: "node_gw",
      mode: "closed_loop",
      workload: {
        type: "constant",
        requestsPerSecond: 10,
      },
      virtualUsers: {
        userCount: 5,
        thinkTimeMs: 100,
      },
      durationMs: 5000,
      limits: {
        maxRequests: 30,
        maxEvents: 500,
        maxVirtualDurationMs: 10000,
        metricSamplingIntervalMs: 500,
      },
      capacities: {},
      rateLimiters: {},
      autoscaling: {},
      seed: 42,
    };

    const arrivals = WorkloadGenerator.generateArrivals(scenario);
    expect(arrivals.length).toBe(30);
    expect(arrivals.every((a) => a.virtualUserId !== undefined)).toBe(true);
  });
});

describe("Worker Pool & Concurrency Management", () => {
  it("initializes instances and allocates/releases workers", () => {
    const config: ServiceCapacityConfig = {
      serviceNodeId: "node_service",
      initialInstances: 2,
      workersPerInstance: 3,
      queueCapacity: 10,
      admissionPolicy: "reject_when_full",
      processingDistribution: "constant",
      baseProcessingTimeMs: 100,
      loadBalancing: "round_robin",
    };

    const instances = WorkerPool.initializeInstances(config);
    expect(instances.length).toBe(2);
    expect(WorkerPool.hasAvailableWorker(instances)).toBe(true);

    const availableInst = WorkerPool.findAvailableInstance(instances);
    expect(availableInst).toBeDefined();

    const acquired = WorkerPool.acquireWorker(availableInst!);
    expect(acquired).toBe(true);
    expect(availableInst!.busyWorkers).toBe(1);

    WorkerPool.releaseWorker(availableInst!);
    expect(availableInst!.busyWorkers).toBe(0);
  });

  it("calculates accurate worker utilization", () => {
    const config: ServiceCapacityConfig = {
      serviceNodeId: "node_service",
      initialInstances: 1,
      workersPerInstance: 4,
      queueCapacity: 10,
      admissionPolicy: "reject_when_full",
      processingDistribution: "constant",
      baseProcessingTimeMs: 100,
      loadBalancing: "least_active",
    };

    const instances = WorkerPool.initializeInstances(config);
    expect(WorkerPool.calculateUtilization(instances)).toBe(0);

    WorkerPool.acquireWorker(instances[0]);
    WorkerPool.acquireWorker(instances[0]);
    expect(WorkerPool.calculateUtilization(instances)).toBe(50);

    WorkerPool.acquireWorker(instances[0]);
    WorkerPool.acquireWorker(instances[0]);
    expect(WorkerPool.calculateUtilization(instances)).toBe(100);
  });
});

describe("Request Queue Manager", () => {
  it("enqueues and dequeues FIFO items", () => {
    const qm = new RequestQueueManager();
    const stateQueue: ModeledTrafficQueue = {
      nodeId: "node_service",
      capacity: 2,
      admissionPolicy: "reject_when_full",
      waitingCount: 0,
      totalEnqueuedCount: 0,
      rejectedCount: 0,
    };

    const res1 = qm.enqueue("node_service", "req_1", 0, stateQueue);
    const res2 = qm.enqueue("node_service", "req_2", 10, stateQueue);
    expect(res1.admitted).toBe(true);
    expect(res2.admitted).toBe(true);
    expect(qm.getDepth("node_service")).toBe(2);

    const deq1 = qm.dequeue("node_service", 10, stateQueue);
    expect(deq1.item?.requestId).toBe("req_1");
    expect(qm.getDepth("node_service")).toBe(1);
  });

  it("rejects when queue is full under reject_when_full policy", () => {
    const qm = new RequestQueueManager();
    const stateQueue: ModeledTrafficQueue = {
      nodeId: "node_service",
      capacity: 1,
      admissionPolicy: "reject_when_full",
      waitingCount: 0,
      totalEnqueuedCount: 0,
      rejectedCount: 0,
    };

    qm.enqueue("node_service", "req_1", 0, stateQueue);
    const res2 = qm.enqueue("node_service", "req_2", 10, stateQueue);
    expect(res2.admitted).toBe(false);
    expect(res2.reason).toContain("maximum capacity");
    expect(stateQueue.rejectedCount).toBe(1);
  });
});

describe("Rate Limiter Engine", () => {
  it("admits requests within limit and replenishes virtual tokens", () => {
    const config: RateLimiterConfig = {
      nodeId: "node_gw",
      algorithm: "token_bucket",
      capacity: 5,
      refillRatePerSec: 10,
      windowMs: 1000,
      rejectStatusCode: 429,
    };

    const state = RateLimiterEngine.initialize(config, 0);
    expect(state.currentTokens).toBe(5);

    // Consume 5 tokens
    for (let i = 0; i < 5; i++) {
      const res = RateLimiterEngine.checkAndConsume(state, config, 0);
      expect(res.allowed).toBe(true);
    }

    // 6th should be rejected
    const rejected = RateLimiterEngine.checkAndConsume(state, config, 0);
    expect(rejected.allowed).toBe(false);

    // Advance 500ms (refills 5 tokens)
    const after500ms = RateLimiterEngine.checkAndConsume(state, config, 500);
    expect(after500ms.allowed).toBe(true);
  });
});

describe("Autoscaling Engine", () => {
  it("scales out when worker utilization exceeds threshold", () => {
    const capacityConfig: ServiceCapacityConfig = {
      serviceNodeId: "node_service",
      initialInstances: 1,
      workersPerInstance: 2,
      queueCapacity: 10,
      admissionPolicy: "reject_when_full",
      processingDistribution: "constant",
      baseProcessingTimeMs: 100,
      loadBalancing: "round_robin",
    };

    const policy: AutoscalingPolicy = {
      serviceNodeId: "node_service",
      enabled: true,
      minInstances: 1,
      maxInstances: 4,
      scaleOutThresholdPercent: 75,
      scaleInThresholdPercent: 25,
      cooldownMs: 500,
      provisioningDelayMs: 200,
    };

    const state = AutoscalingEngine.initializeState("node_service", 1);
    const instances = WorkerPool.initializeInstances(capacityConfig);

    // 100% utilization
    WorkerPool.acquireWorker(instances[0]);
    WorkerPool.acquireWorker(instances[0]);

    const evalResult = AutoscalingEngine.evaluateScaling(policy, capacityConfig, state, instances, 1000);
    expect(evalResult.action).toBe("scale_out");
    expect(evalResult.toInstances).toBe(2);
    expect(evalResult.newInstance).toBeDefined();
    expect(evalResult.readyAtMs).toBe(1200);
  });
});

describe("Metric Aggregator & Percentiles", () => {
  it("calculates accurate latency percentiles and nearest-rank values", () => {
    const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const p50 = MetricAggregator.calculatePercentile(latencies, 50);
    const p90 = MetricAggregator.calculatePercentile(latencies, 90);
    const p99 = MetricAggregator.calculatePercentile(latencies, 99);

    expect(p50).toBe(50);
    expect(p90).toBe(90);
    expect(p99).toBe(100);
  });

  it("computes summary with bottleneck evidence", () => {
    const records: CompletedRequestRecord[] = [
      {
        requestId: "r1",
        arrivalAtMs: 0,
        completedAtMs: 100,
        latencyMs: 100,
        status: "success",
        terminalNodeId: "node_service",
        queueWaitMs: 60,
      },
    ];

    const queuesMap: Record<string, ModeledTrafficQueue> = {
      node_service: {
        nodeId: "node_service",
        capacity: 10,
        admissionPolicy: "reject_when_full",
        waitingCount: 5,
        totalEnqueuedCount: 10,
        rejectedCount: 2,
      },
    };

    const instances = WorkerPool.initializeInstances({
      serviceNodeId: "node_service",
      initialInstances: 1,
      workersPerInstance: 2,
      baseProcessingTimeMs: 40,
      processingDistribution: "constant",
      queueCapacity: 10,
      admissionPolicy: "reject_when_full",
      loadBalancing: "round_robin",
    });

    const summary = MetricAggregator.computeSummary(
      1,
      records,
      0,
      0,
      [],
      sampleNodes,
      { node_service: instances },
      queuesMap,
      0
    );

    expect(summary.totalRequests).toBe(1);
    expect(summary.successfulRequests).toBe(1);
    expect(summary.bottlenecks.length).toBeGreaterThan(0);
    expect(summary.bottlenecks[0].nodeId).toBe("node_service");
  });
});

describe("Traffic Presets", () => {
  it("creates all 10 presets correctly from factory", () => {
    for (const def of TRAFFIC_PRESET_DEFINITIONS) {
      const preset = TrafficPresetFactory.createPreset(def.id, sampleNodes, sampleEdges);
      expect(preset).toBeDefined();
      expect(preset.durationMs).toBeGreaterThan(0);
      expect(preset.limits.maxRequests).toBeGreaterThan(0);
    }
  });
});

describe("Traffic Simulation Engine Full Run & Comparison", () => {
  it("executes deterministic traffic simulation and generates reconstructable snapshots", () => {
    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_test",
      "rev_001",
      "Test Architecture",
      sampleNodes,
      sampleEdges,
      baseConfig
    );

    const scenario: TrafficScenario = {
      version: 1,
      id: "sc_run_test",
      name: "Run Test",
      description: "Full simulation execution test",
      entryNodeId: "node_gw",
      mode: "open_loop",
      workload: {
        type: "constant",
        requestsPerSecond: 10,
      },
      durationMs: 1000,
      limits: {
        maxRequests: 10,
        maxEvents: 500,
        maxVirtualDurationMs: 5000,
        metricSamplingIntervalMs: 500,
      },
      capacities: {
        node_service: {
          serviceNodeId: "node_service",
          initialInstances: 1,
          workersPerInstance: 2,
          queueCapacity: 5,
          admissionPolicy: "reject_when_full",
          processingDistribution: "constant",
          baseProcessingTimeMs: 40,
          loadBalancing: "round_robin",
        },
      },
      rateLimiters: {},
      autoscaling: {},
      seed: 42,
    };

    const trace = TrafficSimulationEngine.runTrafficSimulation(snapshot, baseConfig, scenario);

    expect(trace.events.length).toBeGreaterThan(0);
    expect(trace.performanceSamples).toBeDefined();
    expect(trace.performanceSamples!.length).toBeGreaterThan(0);
    expect(trace.performanceSummary).toBeDefined();
    expect(trace.performanceSummary!.totalRequests).toBeGreaterThan(0);

    // Verify reconstructable state snapshots via visualization frames
    expect(trace.frames.length).toBe(trace.events.length);
    expect(trace.frames[0].runtimeState).toBeDefined();

    // Verify travel markers are populated for React Flow rendering
    expect(trace.frames.some((f) => (f.travelingPackets?.length || 0) > 0)).toBe(true);
  });

  it("compares baseline vs scaled traffic scenarios accurately", () => {
    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_test",
      "rev_001",
      "Test Architecture",
      sampleNodes,
      sampleEdges,
      baseConfig
    );

    const baselineScenario: TrafficScenario = {
      version: 1,
      id: "sc_baseline",
      name: "Baseline",
      description: "1 instance",
      entryNodeId: "node_gw",
      mode: "open_loop",
      workload: { type: "constant", requestsPerSecond: 15 },
      durationMs: 1000,
      limits: {
        maxRequests: 15,
        maxEvents: 500,
        maxVirtualDurationMs: 5000,
        metricSamplingIntervalMs: 500,
      },
      capacities: {
        node_service: {
          serviceNodeId: "node_service",
          initialInstances: 1,
          workersPerInstance: 2,
          queueCapacity: 2,
          admissionPolicy: "reject_when_full",
          processingDistribution: "constant",
          baseProcessingTimeMs: 80,
          loadBalancing: "round_robin",
        },
      },
      rateLimiters: {},
      autoscaling: {},
      seed: 42,
    };

    const scaledScenario: TrafficScenario = {
      ...baselineScenario,
      id: "sc_scaled",
      name: "Scaled",
      capacities: {
        node_service: {
          serviceNodeId: "node_service",
          initialInstances: 3,
          workersPerInstance: 2,
          queueCapacity: 10,
          admissionPolicy: "reject_when_full",
          processingDistribution: "constant",
          baseProcessingTimeMs: 80,
          loadBalancing: "least_active",
        },
      },
    };

    const baselineTrace = TrafficSimulationEngine.runTrafficSimulation(snapshot, baseConfig, baselineScenario);
    const scaledTrace = TrafficSimulationEngine.runTrafficSimulation(snapshot, baseConfig, scaledScenario);

    const comparison = TrafficSimulationEngine.compareScenarios(baselineTrace, scaledTrace);

    expect(comparison.baselineScenarioId).toBe("sc_baseline");
    expect(comparison.testScenarioId).toBe("sc_scaled");
    expect(typeof comparison.throughputDeltaRps).toBe("number");
    expect(typeof comparison.p95LatencyDeltaMs).toBe("number");
  });
});
