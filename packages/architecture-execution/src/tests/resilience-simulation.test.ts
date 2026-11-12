import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { ExecutionSnapshotManager } from "../domain/execution-snapshot";
import { RuntimeStateHelper } from "../domain/runtime-state";
import { DeterministicRandom } from "../resilience/deterministic-random";
import { BlastRadiusAnalyzer } from "../resilience/blast-radius-analyzer";
import { CircuitBreakerEngine } from "../resilience/circuit-breaker-engine";
import { RetryEngine } from "../resilience/retry-engine";
import { FailoverEngine } from "../resilience/failover-engine";
import { ResiliencePresetFactory } from "../resilience/scenario-presets";
import { ResilienceSimulationEngine } from "../resilience/resilience-simulation-engine";
import type { FaultDefinition, CircuitBreakerPolicy, RetryPolicy, FailoverPolicy } from "../resilience/fault-schemas";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";

const baseConfig: ExecutionConfiguration = {
  version: 1,
  entryNodeId: "node_gateway",
  request: { id: "req_test", method: "GET", path: "/api/test", headers: {} },
  routing: { mode: "deterministic", selectedBranches: {} },
  limits: { maxHops: 20, maxEvents: 200, maxDurationMs: 30000 },
  timing: { nodeDurationMs: 100, edgeDurationMs: 150 },
};

const sampleNodes: BaseNode[] = [
  {
    id: "node_gateway",
    type: "gateway",
    label: "API Gateway",
    position: { x: 0, y: 0 },
    data: { componentType: "gateway" },
  },
  {
    id: "node_order_service",
    type: "service",
    label: "Order Service",
    position: { x: 200, y: 0 },
    data: { componentType: "service" },
  },
  {
    id: "node_payment_service",
    type: "service",
    label: "Payment Service",
    position: { x: 400, y: -100 },
    data: { componentType: "service" },
  },
  {
    id: "node_payment_standby",
    type: "service",
    label: "Payment Standby",
    position: { x: 400, y: 100 },
    data: { componentType: "service" },
  },
  {
    id: "node_postgres",
    type: "database",
    label: "PostgreSQL Primary",
    position: { x: 600, y: 0 },
    data: { componentType: "database" },
  },
];

const sampleEdges: BaseEdge[] = [
  {
    id: "edge_gw_order",
    source: "node_gateway",
    target: "node_order_service",
    label: "HTTP/2",
    data: {},
  },
  {
    id: "edge_order_payment",
    source: "node_order_service",
    target: "node_payment_service",
    label: "gRPC",
    data: {},
  },
  {
    id: "edge_order_db",
    source: "node_order_service",
    target: "node_postgres",
    label: "TCP 5432",
    data: {},
  },
];

describe("Phase 05.4.4: Resilience Simulation Engine", () => {
  describe("1. DeterministicRandom (Mulberry32 PRNG)", () => {
    it("generates 100% reproducible sequences for identical seeds", () => {
      const rng1 = new DeterministicRandom(1337);
      const rng2 = new DeterministicRandom(1337);

      const seq1 = [rng1.next(), rng1.nextInt(1, 100), rng1.testChance(0.5)];
      const seq2 = [rng2.next(), rng2.nextInt(1, 100), rng2.testChance(0.5)];

      expect(seq1).toEqual(seq2);
    });

    it("generates distinct values for different seeds", () => {
      const rng1 = new DeterministicRandom(100);
      const rng2 = new DeterministicRandom(200);

      expect(rng1.next()).not.toEqual(rng2.next());
    });
  });

  describe("2. BlastRadiusAnalyzer", () => {
    it("identifies direct and downstream components in causal chain", () => {
      const fault: FaultDefinition = {
        id: "f_order_crash",
        name: "Order Service Crash",
        type: "component.outage",
        target: { type: "node", targetId: "node_order_service" },
        startAtMs: 100,
        parameters: {},
      };

      const report = BlastRadiusAnalyzer.calculateBlastRadius(sampleNodes, sampleEdges, fault);

      expect(report.originTargetId).toBe("node_order_service");
      expect(report.directlyAffectedNodeIds).toContain("node_order_service");
      // Downstream data dependencies and callers
      expect(report.downstreamAffectedNodeIds).toContain("node_gateway");
      expect(report.downstreamAffectedNodeIds).toContain("node_payment_service");
      expect(report.downstreamAffectedNodeIds).toContain("node_postgres");
      expect(report.causalDepth).toBeGreaterThanOrEqual(1);
      expect(report.propagationChain.length).toBeGreaterThan(0);
    });
  });

  describe("3. CircuitBreakerEngine", () => {
    const policy: CircuitBreakerPolicy = {
      targetNodeId: "node_payment_service",
      failureThreshold: 2,
      observationWindowMs: 5000,
      openDurationMs: 1000,
      halfOpenProbeLimit: 1,
      successThreshold: 2,
      fallbackAction: "fail_fast",
      fallbackMessage: "Payment circuit open",
    };

    it("transitions from CLOSED to OPEN when failures reach threshold", () => {
      const state = RuntimeStateHelper.createInitialState();

      // Attempt 1: failure
      const f1 = CircuitBreakerEngine.recordFailure(state, policy, 100, "503 timeout");
      expect(f1.state).toBe("closed");
      expect(f1.tripped).toBe(false);

      // Attempt 2: threshold reached -> trips to open
      const f2 = CircuitBreakerEngine.recordFailure(state, policy, 200, "503 timeout");
      expect(f2.state).toBe("open");
      expect(f2.tripped).toBe(true);

      // Subsequent call before cooldown should be blocked
      const checkBlocked = CircuitBreakerEngine.shouldAllowRequest(state, policy, 500);
      expect(checkBlocked.allowed).toBe(false);
      expect(checkBlocked.state).toBe("open");
    });

    it("transitions from OPEN to HALF-OPEN after openDurationMs and CLOSED upon success", () => {
      const state = RuntimeStateHelper.createInitialState();
      CircuitBreakerEngine.recordFailure(state, policy, 100, "err 1");
      CircuitBreakerEngine.recordFailure(state, policy, 200, "err 2");

      // Advance past openDurationMs (200 + 1000 = 1200ms)
      const checkProbe = CircuitBreakerEngine.shouldAllowRequest(state, policy, 1300);
      expect(checkProbe.allowed).toBe(true);
      expect(checkProbe.isProbe).toBe(true);
      expect(checkProbe.state).toBe("half-open");

      // Probe 1 succeeds
      const s1 = CircuitBreakerEngine.recordSuccess(state, policy, 1350);
      expect(s1.state).toBe("half-open");
      expect(s1.closed).toBe(false);

      // Probe 2 succeeds -> circuit closes
      const s2 = CircuitBreakerEngine.recordSuccess(state, policy, 1400);
      expect(s2.state).toBe("closed");
      expect(s2.closed).toBe(true);
    });
  });

  describe("4. RetryEngine", () => {
    const policy: RetryPolicy = {
      maxAttempts: 3,
      strategy: "exponential",
      initialDelayMs: 100,
      maxDelayMs: 1000,
      multiplier: 2,
      jitter: false,
      retryableFailures: ["connection_refused", "timeout", "503"],
      idempotent: true,
    };

    it("rejects non-idempotent HTTP methods when idempotency is enforced", () => {
      const state = RuntimeStateHelper.createInitialState();
      const rng = new DeterministicRandom(42);

      const postReq = {
        id: "req_post",
        method: "POST" as const,
        path: "/api/orders",
        headers: {},
        query: {},
        sourceNodeId: "node_gateway",
        correlationId: "corr_post",
      };
      const evalPost = RetryEngine.evaluateRetry(state, policy, "req_1", "timeout", postReq, 100, rng);
      expect(evalPost.shouldRetry).toBe(false);
      expect(evalPost.reason).toContain("Non-idempotent");
    });

    it("schedules exponential backoff for eligible idempotent requests", () => {
      const state = RuntimeStateHelper.createInitialState();
      const rng = new DeterministicRandom(42);

      const getReq = {
        id: "req_get",
        method: "GET" as const,
        path: "/api/orders/42",
        headers: {},
        query: {},
        sourceNodeId: "node_gateway",
        correlationId: "corr_get",
      };

      // Attempt 1 -> Retry attempt 2 scheduled
      const r1 = RetryEngine.evaluateRetry(state, policy, "req_1", "503", getReq, 100, rng);
      expect(r1.shouldRetry).toBe(true);
      expect(r1.attemptNumber).toBe(2);
      expect(r1.backoffDelayMs).toBe(100);

      // Attempt 2 -> Retry attempt 3 scheduled (exponential 100 * 2^1 = 200)
      const r2 = RetryEngine.evaluateRetry(state, policy, "req_1", "503", getReq, 250, rng);
      expect(r2.shouldRetry).toBe(true);
      expect(r2.attemptNumber).toBe(3);
      expect(r2.backoffDelayMs).toBe(200);

      // Attempt 3 -> Reached max attempts (3)
      const r3 = RetryEngine.evaluateRetry(state, policy, "req_1", "503", getReq, 500, rng);
      expect(r3.shouldRetry).toBe(false);
      expect(r3.reason).toContain("Retry exhausted");
    });
  });

  describe("5. FailoverEngine", () => {
    const policy: FailoverPolicy = {
      primaryTargetId: "node_payment_service",
      secondaryTargetIds: ["node_payment_standby"],
      eligibilityConditions: ["target.healthy"],
      healthCheckRequired: false,
      maxFailoverAttempts: 2,
      recoveryPreference: "revert_to_primary",
    };

    it("routes to standby candidate when primary is down", () => {
      const state = RuntimeStateHelper.createInitialState();
      state.componentHealth["node_payment_service"] = "unavailable";

      const result = FailoverEngine.evaluateFailover(state, policy);
      expect(result.selected).toBe(true);
      expect(result.selectedTargetId).toBe("node_payment_standby");
    });

    it("fails over when primary circuit breaker is open", () => {
      const state = RuntimeStateHelper.createInitialState();
      state.circuitBreakers["node_payment_service"] = {
        state: "open",
        failureCount: 3,
        consecutiveSuccesses: 0,
        lastStateChangeMs: 100,
        nextAllowedProbeMs: 2000,
        tripCount: 1,
        totalFastFailures: 2,
      };

      const result = FailoverEngine.evaluateFailover(state, policy);
      expect(result.selected).toBe(true);
      expect(result.selectedTargetId).toBe("node_payment_standby");
    });
  });

  describe("6. Scenario Presets & Simulation Execution", () => {
    it("creates valid scenarios for all 10 presets", () => {
      const presetIds = [
        "database_outage",
        "service_crash",
        "latency_spike",
        "disconnection",
        "packet_loss",
        "retry_storm",
        "circuit_breaker",
        "failover",
        "consumer_failure",
        "queue_backlog",
      ] as const;

      for (const pid of presetIds) {
        const scenario = ResiliencePresetFactory.createScenario(pid, sampleNodes, sampleEdges);
        expect(scenario.id).toContain(pid);
        expect(scenario.faults.length).toBeGreaterThan(0);
      }
    });

    it("runs database outage simulation and captures fault activation events", () => {
      const snapshot = ExecutionSnapshotManager.createSnapshot("arch_1", "rev_1", "Test", sampleNodes, sampleEdges);
      const scenario = ResiliencePresetFactory.createScenario("database_outage", sampleNodes, sampleEdges);

      const trace = ResilienceSimulationEngine.planResilienceExecution(snapshot, scenario, {
        ...baseConfig,
        request: { id: "req_db", method: "POST", path: "/api/orders", headers: {} },
      });

      expect(trace.events.length).toBeGreaterThan(0);
      const activatedEvt = trace.events.find((e) => e.type === "fault.activated");
      expect(activatedEvt).toBeDefined();

      const lastState = trace.frames[trace.frames.length - 1]?.runtimeState;
      expect(lastState?.resilienceMetrics).toBeDefined();
    });

    it("compares baseline vs failure scenario runs with divergent spans report", () => {
      const snapshot = ExecutionSnapshotManager.createSnapshot("arch_1", "rev_1", "Test", sampleNodes, sampleEdges);
      const cleanScenario = ResiliencePresetFactory.createScenario("service_crash", sampleNodes, sampleEdges);
      cleanScenario.faults = []; // baseline without faults

      const baselineTrace = ResilienceSimulationEngine.planResilienceExecution(snapshot, cleanScenario, {
        ...baseConfig,
        request: { id: "req_base", method: "GET", path: "/api/orders/1", headers: {} },
      });

      const failureScenario = ResiliencePresetFactory.createScenario("service_crash", sampleNodes, sampleEdges);
      const failureTrace = ResilienceSimulationEngine.planResilienceExecution(snapshot, failureScenario, {
        ...baseConfig,
        request: { id: "req_fail", method: "GET", path: "/api/orders/1", headers: {} },
      });

      const comparison = ResilienceSimulationEngine.compareScenarios(
        baselineTrace,
        failureTrace,
        cleanScenario,
        failureScenario
      );

      expect(comparison.summary).toBeDefined();
      expect(comparison.baselineMetrics).toBeDefined();
      expect(comparison.failureMetrics).toBeDefined();
    });
  });
});
