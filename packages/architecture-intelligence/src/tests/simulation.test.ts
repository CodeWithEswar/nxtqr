import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { VirtualClock } from "../simulation/engine/virtual-clock";
import { DeterministicRandom } from "../simulation/engine/deterministic-replay";
import { SimulationEventQueue } from "../simulation/engine/event-queue";
import { ComponentStateMachine } from "../simulation/engine/component-state-machine";
import { DependencyPropagationEngine } from "../simulation/engine/propagation-engine";
import { CriticalJourneyEvaluator } from "../simulation/analysis/journey-evaluator";
import { BlastRadiusEvaluator } from "../simulation/analysis/blast-radius-evaluator";
import { RecoveryEvaluator } from "../simulation/analysis/recovery-evaluator";
import { CascadingFailureEvaluator } from "../simulation/analysis/cascading-failure-evaluator";
import type {
  CriticalUserJourney,
  SimulationEvent,
} from "../simulation/contracts/simulation.types";

describe("Architecture Simulation - Virtual Clock", () => {
  it("initializes with specified bounds and resolution", () => {
    const clock = new VirtualClock(0, 60000, 1000);
    expect(clock.currentTimeMs).toBe(0);
    expect(clock.progressRatio).toBe(0);
    expect(!clock.isFinished).toBe(true);
  });

  it("steps forward incrementally and finishes at end time", () => {
    const clock = new VirtualClock(0, 3000, 1000);
    expect(clock.step()).toBe(1000);
    expect(clock.step()).toBe(2000);
    expect(clock.step()).toBe(3000);
    expect(clock.isFinished).toBe(true);
    expect(clock.progressRatio).toBe(1);
    expect(clock.step()).toBe(3000);
  });

  it("seeks accurately within bounds and clamps to min/max", () => {
    const clock = new VirtualClock(0, 10000, 1000);
    expect(clock.seek(4500)).toBe(4500);
    expect(clock.currentTimeMs).toBe(4500);
    expect(clock.seek(-500)).toBe(0);
    expect(clock.seek(15000)).toBe(10000);
    expect(clock.isFinished).toBe(true);
  });

  it("resets back to start time", () => {
    const clock = new VirtualClock(1000, 5000, 500);
    clock.step();
    clock.step();
    expect(clock.currentTimeMs).toBe(2000);
    clock.reset();
    expect(clock.currentTimeMs).toBe(1000);
    expect(clock.isFinished).toBe(false);
  });
});

describe("Architecture Simulation - Deterministic Replay (PRNG)", () => {
  it("generates 100% reproducible sequences for identical seeds", () => {
    const prng1 = new DeterministicRandom(42);
    const prng2 = new DeterministicRandom(42);

    const seq1 = [prng1.next(), prng1.next(), prng1.next(), prng1.next()];
    const seq2 = [prng2.next(), prng2.next(), prng2.next(), prng2.next()];

    expect(seq1).toEqual(seq2);
  });

  it("generates distinct sequences for different seeds", () => {
    const prng1 = new DeterministicRandom(42);
    const prng2 = new DeterministicRandom(43);

    expect(prng1.next()).not.toEqual(prng2.next());
  });

  it("generates integers within specified bounds", () => {
    const prng = new DeterministicRandom(999);
    for (let i = 0; i < 50; i++) {
      const val = prng.nextInt(10, 20);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThanOrEqual(20);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it("evaluates chance probabilities deterministically", () => {
    const prng = new DeterministicRandom(101);
    expect(prng.chance(1.0)).toBe(true);
    expect(prng.chance(0.0)).toBe(false);
  });
});

describe("Architecture Simulation - Event Priority Queue", () => {
  it("orders events deterministically by timestamp and insertion sequence", () => {
    const queue = new SimulationEventQueue();

    queue.enqueue({
      id: "evt-3",
      scenarioId: "sc-1",
      timestampMs: 3000,
      type: "recovery_completed",
      targetId: "node-1",
      payload: {},
      description: "Recovery at 3s",
    });

    queue.enqueue({
      id: "evt-1",
      scenarioId: "sc-1",
      timestampMs: 1000,
      type: "failure_injected",
      targetId: "node-1",
      payload: {},
      description: "Failure at 1s",
    });

    queue.enqueue({
      id: "evt-2",
      scenarioId: "sc-1",
      timestampMs: 1000,
      type: "circuit_breaker_opened",
      targetId: "node-2",
      payload: {},
      description: "Circuit opened at 1s",
    });

    expect(queue.size).toBe(3);
    const drained = queue.drainUpTo(2000);
    expect(drained.length).toBe(2);
    expect(drained[0].id).toBe("evt-1");
    expect(drained[1].id).toBe("evt-2");
    expect(queue.size).toBe(1);

    const remaining = queue.drainUpTo(5000);
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe("evt-3");
    expect(queue.isEmpty).toBe(true);
  });
});

describe("Architecture Simulation - Component State Machine", () => {
  const testNodes: BaseNode[] = [
    {
      id: "web-svc",
      type: "microservice",
      position: { x: 0, y: 0 },
      data: { label: "Web Service" },
    },
    {
      id: "db-primary",
      type: "database",
      position: { x: 200, y: 0 },
      data: { label: "Primary Postgres" },
    },
  ];

  it("initializes all nodes in healthy state", () => {
    const sm = new ComponentStateMachine(testNodes);
    expect(sm.getState("web-svc")).toBe("healthy");
    expect(sm.getState("db-primary")).toBe("healthy");
    expect(sm.getActiveFailures("web-svc")).toEqual([]);
  });

  it("handles failure injection and transitions state to unavailable", () => {
    const sm = new ComponentStateMachine(testNodes);
    sm.injectFailure("db-primary", "fail-1", "Database process killed");

    expect(sm.getState("db-primary")).toBe("unavailable");
    expect(sm.getActiveFailures("db-primary")).toContain("fail-1");

    // Removing failure restores healthy state
    sm.removeFailure("db-primary", "fail-1");
    expect(sm.getState("db-primary")).toBe("healthy");
  });

  it("supports circuit breaker state transitions", () => {
    const sm = new ComponentStateMachine(testNodes);
    expect(sm.isCircuitOpen("web-svc")).toBe(false);

    sm.setCircuitBreaker("web-svc", true);
    expect(sm.isCircuitOpen("web-svc")).toBe(true);
    expect(sm.getState("web-svc")).toBe("degraded");

    sm.setCircuitBreaker("web-svc", false);
    expect(sm.isCircuitOpen("web-svc")).toBe(false);
    expect(sm.getState("web-svc")).toBe("healthy");
  });
});

describe("Architecture Simulation - Dependency Propagation & Blast Radius", () => {
  const nodes: BaseNode[] = [
    { id: "api-gw", type: "api_gateway", position: { x: 0, y: 0 }, data: { label: "API Gateway" } },
    { id: "order-svc", type: "microservice", position: { x: 100, y: 0 }, data: { label: "Order Service" } },
    { id: "payment-svc", type: "microservice", position: { x: 200, y: 0 }, data: { label: "Payment Service" } },
    { id: "db-orders", type: "database", position: { x: 300, y: 0 }, data: { label: "Order DB" } },
    { id: "auth-svc", type: "microservice", position: { x: 100, y: 100 }, data: { label: "Auth Service" } },
  ];

  const edges: BaseEdge[] = [
    { id: "e1", source: "api-gw", target: "order-svc", data: { protocol: "HTTP" } },
    { id: "e2", source: "order-svc", target: "payment-svc", data: { protocol: "gRPC" } },
    { id: "e3", source: "order-svc", target: "db-orders", data: { protocol: "Postgres" } },
    { id: "e4", source: "api-gw", target: "auth-svc", data: { protocol: "HTTP" } },
  ];

  it("propagates failure backwards from failed database up to direct and indirect callers", () => {
    const sm = new ComponentStateMachine(nodes);
    const engine = new DependencyPropagationEngine(nodes, edges);

    sm.injectFailure("db-orders", "f-db", "Storage drive corruption");

    const events = engine.propagateFailure("db-orders", sm, {
      scenarioId: "sc-test",
      timestampMs: 1000,
    });

    expect(events.length).toBeGreaterThan(0);
    // order-svc should be degraded/impacted
    expect(sm.getState("order-svc")).toBe("degraded");
    // api-gw should also be impacted
    expect(sm.getState("api-gw")).toBe("degraded");
    // auth-svc does not depend on db-orders, should remain healthy
    expect(sm.getState("auth-svc")).toBe("healthy");
  });

  it("computes accurate blast radius scoring", () => {
    const sm = new ComponentStateMachine(nodes);
    sm.injectFailure("db-orders", "f-db", "Primary DB unavailable");
    sm.setDegraded("order-svc", true, "Downstream DB unavailable");

    const journeys: CriticalUserJourney[] = [
      {
        id: "j-checkout",
        name: "Customer Checkout Journey",
        description: "Customer checkout flow",
        entryNodeId: "api-gw",
        requiredNodeIds: ["api-gw", "order-svc", "db-orders"],
        criticality: "critical",
      },
      {
        id: "j-auth",
        name: "User Login Journey",
        description: "Authentication flow",
        entryNodeId: "api-gw",
        requiredNodeIds: ["api-gw", "auth-svc"],
        criticality: "high",
      },
    ];

    const journeyResults = CriticalJourneyEvaluator.evaluateJourneys(
      journeys,
      sm.getAllSnapshots()
    );

    const blast = BlastRadiusEvaluator.evaluate(
      "db-orders",
      "Order DB",
      nodes,
      sm.getAllSnapshots(),
      journeyResults
    );

    expect(blast.targetId).toBe("db-orders");
    expect(blast.directlyImpactedNodeIds).toContain("db-orders");
    expect(blast.indirectlyImpactedNodeIds).toContain("order-svc");
    expect(blast.unaffectedNodeIds).toContain("auth-svc");
    expect(blast.affectedJourneysCount).toBe(1);
    expect(blast.totalJourneysCount).toBe(2);
    expect(blast.blastRadiusScore).toBeGreaterThan(0);
    expect(blast.blastRadiusScore).toBeLessThanOrEqual(100);
  });
});

describe("Architecture Simulation - Critical Journeys & Cascading Risks", () => {
  it("evaluates critical user journey health states accurately", () => {
    const journey: CriticalUserJourney = {
      id: "j-1",
      name: "Checkout Flow",
      description: "Checkout user flow",
      entryNodeId: "gw",
      requiredNodeIds: ["gw", "svc", "db"],
      optionalNodeIds: ["cache"],
      criticality: "critical",
    };

    // Scenario 1: All healthy
    const healthySnapshots = {
      gw: { nodeId: "gw", state: "healthy" as const, activeFailures: [], isCircuitOpen: false, activeReplicas: 2, latencyMultiplier: 1 },
      svc: { nodeId: "svc", state: "healthy" as const, activeFailures: [], isCircuitOpen: false, activeReplicas: 2, latencyMultiplier: 1 },
      db: { nodeId: "db", state: "healthy" as const, activeFailures: [], isCircuitOpen: false, activeReplicas: 1, latencyMultiplier: 1 },
      cache: { nodeId: "cache", state: "healthy" as const, activeFailures: [], isCircuitOpen: false, activeReplicas: 1, latencyMultiplier: 1 },
    };

    let result = CriticalJourneyEvaluator.evaluateJourney(journey, healthySnapshots);
    expect(result.status).toBe("available");

    // Scenario 2: Required DB down
    const failedDbSnapshots = {
      ...healthySnapshots,
      db: { ...healthySnapshots.db, state: "unavailable" as const },
    };
    result = CriticalJourneyEvaluator.evaluateJourney(journey, failedDbSnapshots);
    expect(result.status).toBe("unavailable");

    // Scenario 3: Optional cache down, DB healthy
    const degradedCacheSnapshots = {
      ...healthySnapshots,
      cache: { ...healthySnapshots.cache, state: "unavailable" as const },
    };
    result = CriticalJourneyEvaluator.evaluateJourney(journey, degradedCacheSnapshots);
    expect(result.status).toBe("degraded");
  });

  it("evaluates modeled recovery against declared RTO/RPO targets", () => {
    const scenario: any = {
      id: "sc-rec",
      architectureId: "arch-1",
      graphRevision: "rev-1",
      name: "Recovery Test",
      description: "Recovery Test Description",
      durationMs: 60000,
      targetRtoMs: 60000,
      targetRpoMs: 0,
      injections: [
        {
          id: "inj-1",
          name: "DB Outage",
          type: "component_outage",
          targetId: "db-1",
          targetType: "node",
          startMs: 10000,
          durationMs: 30000,
          severity: "critical",
          recoveryBehavior: "automatic",
          parameters: { failoverDelayMs: 20000, recoveryTimeMs: 10000 },
        },
      ],
      criticalJourneys: [],
      assumptions: [],
    };

    const recovery = RecoveryEvaluator.evaluate(scenario, true, false, 0);
    expect(recovery.modeledFailoverTimeMs).toBe(20000);
    expect(recovery.rtoMet).toBe(true);
    expect(recovery.rpoMet).toBe(true);
  });

  it("detects retry storms and cache miss stampede cascading risks", () => {
    const nodes: BaseNode[] = [
      { id: "cache-1", type: "cache", position: { x: 0, y: 0 }, data: { label: "Redis" } },
      { id: "db-1", type: "database", position: { x: 100, y: 0 }, data: { label: "Postgres" } },
    ];
    const states = {
      "cache-1": { nodeId: "cache-1", state: "unavailable" as const, activeFailures: ["f1"], isCircuitOpen: false, activeReplicas: 0, latencyMultiplier: 1 },
      "db-1": { nodeId: "db-1", state: "healthy" as const, activeFailures: [], isCircuitOpen: false, activeReplicas: 1, latencyMultiplier: 1 },
    };

    const events: SimulationEvent[] = Array.from({ length: 6 }).map((_, i) => ({
      id: `evt-${i}`,
      scenarioId: "sc-1",
      timestampMs: 1000 * i,
      sequence: i,
      type: "retry_attempted",
      targetId: "db-1",
      payload: {},
      description: "Retry attempt",
    }));

    const risks = CascadingFailureEvaluator.evaluate(nodes, [], states, events);
    expect(risks.some((r) => r.type === "retry_storm")).toBe(true);
    expect(risks.some((r) => r.type === "cache_miss_surge")).toBe(true);
  });
});
