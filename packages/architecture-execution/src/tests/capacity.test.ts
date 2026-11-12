import { describe, expect, it } from "vitest";
import {
  CAPACITY_PRESET_METADATA,
  CapacityExecutionEngine,
  buildCapacityPresetScenario,
  calculateTimeBasedCost,
  compareCapacityConfigurations,
  computeForecastNoLeakage,
  evaluateMM1Queue,
  evaluateMMcQueue,
} from "../index";

describe("Phase 05.4.21 Distributed Capacity Planning, Autoscaling, Queueing Theory & Cost Optimization Engine", () => {
  it("runs all 45 capacity presets cleanly with valid invariants", () => {
    expect(CAPACITY_PRESET_METADATA).toHaveLength(45);

    for (const meta of CAPACITY_PRESET_METADATA) {
      const scenario = buildCapacityPresetScenario(meta.id);
      const { frames, finalState, trace } =
        CapacityExecutionEngine.runScenario(scenario);

      expect(frames.length).toBeGreaterThan(0);
      expect(trace.events.length).toBeGreaterThan(0);
      expect(finalState.invariants.allPassed).toBe(true);
      expect(finalState.invariants.replicaBoundsOk).toBe(true);
      expect(finalState.invariants.unreadyZeroCapacityOk).toBe(true);
      expect(finalState.invariants.queueNonNegativeOk).toBe(true);
      expect(finalState.invariants.analyticalAssumptionsEnforcedOk).toBe(true);
      expect(finalState.invariants.noFutureForecastLeakageOk).toBe(true);
      expect(finalState.cost.totalSimulatedWindowCostUsd).toBeGreaterThanOrEqual(0);
    }
  });

  it("enforces analytical M/M/1 and M/M/c stability assumptions and Little's Law", () => {
    const stableMM1 = evaluateMM1Queue(60, 100);
    expect(stableMM1.stable).toBe(true);
    expect(stableMM1.applicable).toBe(true);
    expect(stableMM1.expectedTotalTimeMsW).not.toBeNull();
    // Little's Law: L = lambda * (W_ms / 1000)
    expect(stableMM1.littlesLawL).toBeCloseTo(
      (stableMM1.lambdaRps * stableMM1.expectedTotalTimeMsW!) / 1000,
      2
    );

    const unstableMM1 = evaluateMM1Queue(100, 100);
    expect(unstableMM1.stable).toBe(false);
    expect(unstableMM1.applicable).toBe(false);
    expect(unstableMM1.expectedWaitQueueMsWq).toBeNull();
    expect(unstableMM1.expectedTotalTimeMsW).toBeNull();
    expect(unstableMM1.caveat).toContain("steady-state formulas inapplicable");

    // Pooling benefit: 1 pooled M/M/4 queue vs 4 isolated M/M/1 queues with same total lambda/mu
    const pooledMM4 = evaluateMMcQueue(320, 100, 4);
    const singleMM1 = evaluateMM1Queue(80, 100);
    expect(pooledMM4.applicable).toBe(true);
    expect(singleMM1.applicable).toBe(true);
    expect(pooledMM4.expectedWaitQueueMsWq!).toBeLessThan(
      singleMM1.expectedWaitQueueMsWq!
    );

    const unstableMMc = evaluateMMcQueue(500, 100, 4);
    expect(unstableMMc.applicable).toBe(false);
    expect(unstableMMc.expectedWaitQueueMsWq).toBeNull();
  });

  it("distinguishes downstream DB bottleneck from upstream CPU saturation", () => {
    const scenario = buildCapacityPresetScenario("db_connection_exhaustion");
    const { finalState } = CapacityExecutionEngine.runScenario(scenario);

    const upstreamBn = finalState.bottlenecks.find(
      (b) => b.serviceId === "api-service"
    );
    expect(upstreamBn?.limitingResource).toBe("downstream_dependency");
    expect(finalState.recommendations.length).toBeGreaterThan(0);
    expect(finalState.recommendations[0]!.suggestedChange.toLowerCase()).toContain(
      "downstream"
    );
  });

  it("gating readiness delays prevent unready replicas from serving traffic and surfaces pending pods when cluster full", () => {
    const slowScenario = buildCapacityPresetScenario("slow_replica_startup");
    const slowRes = CapacityExecutionEngine.runScenario(slowScenario);
    expect(slowRes.finalState.invariants.unreadyZeroCapacityOk).toBe(true);

    const insuff = buildCapacityPresetScenario("insufficient_cluster_capacity");
    const insuffRes = CapacityExecutionEngine.runScenario(insuff);
    expect(insuffRes.finalState.metrics.pendingReplicas).toBeGreaterThan(0);

    const cas = buildCapacityPresetScenario("cluster_autoscaling");
    const casRes = CapacityExecutionEngine.runScenario(cas);
    expect(casRes.finalState.cluster.nodeCount).toBeGreaterThan(
      cas.cluster.nodeCount
    );
  });

  it("forecasts without future leakage, guards zero-division cost metrics, and produces deterministic traces", () => {
    const f0 = computeForecastNoLeakage([], "exponential_smoothing");
    const fPast = computeForecastNoLeakage([100, 140, 180], "trend_extrapolation");
    expect(f0).toBe(0);
    expect(fPast).toBeGreaterThanOrEqual(180);

    const zeroReqCost = calculateTimeBasedCost({
      costModel: {
        id: "c1",
        currency: "USD",
        provenanceLabel: "Synthetic defaults",
        computePerReplicaHour: 0.0625,
        memoryPerGiBHour: 0.008,
        storagePerGiBMonth: 0.1,
        networkPerGiB: 0.02,
        requestPerMillion: 0.4,
        fixedMonthlyCost: 0,
      },
      replicaSecondsAccumulated: 10,
      memoryGiBSecondsAccumulated: 5,
      successfulRequests: 0,
      totalRequests: 0,
      virtualDurationMs: 600,
    });
    expect(zeroReqCost.costPerSuccessfulRequestUsd).toBeNull();
    expect(zeroReqCost.totalSimulatedWindowCostUsd).toBeGreaterThanOrEqual(0);

    // Deterministic replay across identical seeds
    const s = buildCapacityPresetScenario("pareto_frontier");
    const run1 = CapacityExecutionEngine.runScenario(s);
    const run2 = CapacityExecutionEngine.runScenario(s);
    expect(run1.finalState.metrics).toEqual(run2.finalState.metrics);
    expect(run1.finalState.paretoFrontier.some((p) => p.paretoEfficient)).toBe(
      true
    );

    const matrix = compareCapacityConfigurations("cap_strategy_comparison");
    expect(matrix).toHaveLength(4);
    expect(matrix.some((m) => m.mode === "predictive")).toBe(true);
  });
});
