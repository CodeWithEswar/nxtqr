import { describe, expect, it } from "vitest";
import {
  TRAFFIC_CONTROL_PRESET_METADATA,
  TrafficControlExecutionEngine,
  TrafficControlScenarioSchema,
  compareTrafficControlScenarios,
  createTrafficControlPresetScenario,
  type TrafficControlPresetId,
} from "../index";

function runPreset(id: TrafficControlPresetId) {
  const scenario = createTrafficControlPresetScenario(id);
  const trace = TrafficControlExecutionEngine.runScenario(scenario);
  const finalState =
    trace.frames[trace.frames.length - 1]?.runtimeState?.trafficControlState;
  return { scenario, trace, finalState };
}

describe("TrafficControlExecutionEngine — Phase 05.4.16 (Rate Limiting, Backpressure, Queueing & Load Shedding)", () => {
  it("executes all 30 presets deterministically with zero protocol invariant violations", () => {
    expect(TRAFFIC_CONTROL_PRESET_METADATA.length).toBe(30);

    for (const meta of TRAFFIC_CONTROL_PRESET_METADATA) {
      const sA = createTrafficControlPresetScenario(meta.id);
      const sB = createTrafficControlPresetScenario(meta.id);
      expect(() => TrafficControlScenarioSchema.parse(sA)).not.toThrow();

      const tA = TrafficControlExecutionEngine.runScenario(sA);
      const tB = TrafficControlExecutionEngine.runScenario(sB);

      expect(tA.frames.length).toBeGreaterThan(0);
      expect(tA.events.length).toBe(tB.events.length);

      const finalA =
        tA.frames[tA.frames.length - 1]?.runtimeState?.trafficControlState;
      const finalB =
        tB.frames[tB.frames.length - 1]?.runtimeState?.trafficControlState;

      expect(finalA).toBeDefined();
      expect(finalA?.metrics).toEqual(finalB?.metrics);
      expect(finalA?.limiters).toEqual(finalB?.limiters);
      expect(
        finalA?.invariants.allPassed,
        `${meta.id} violated invariants: ${finalA?.invariants.violations.join("; ")}`
      ).toBe(true);
    }
  });

  it("verifies rate-limiting algorithms, hierarchical atomic reservation, and per-tenant isolation", () => {
    const { finalState: fixedState } = runPreset("fixed_window_boundary_burst");
    expect(fixedState?.metrics.rateLimitRejections).toBeGreaterThanOrEqual(1);

    const { finalState: swLogState } = runPreset("sliding_window_log");
    expect(
      Object.values(swLogState?.limiters ?? {}).some(
        (l) => l.slidingWindow?.kind === "log"
      )
    ).toBe(true);

    const { finalState: swCntState } = runPreset("sliding_window_counter");
    expect(
      Object.values(swCntState?.limiters ?? {}).some(
        (l) => l.slidingWindow?.kind === "counter_approx"
      )
    ).toBe(true);

    const { finalState: tbRefill } = runPreset("token_bucket_refill");
    expect(tbRefill?.metrics.admittedRequests).toBeGreaterThan(
      tbRefill!.limiters[Object.keys(tbRefill!.limiters)[0]!]!.tokenBucket!
        .capacity
    );

    const { finalState: leaky } = runPreset("leaky_bucket_smoothing");
    expect(
      Object.values(leaky?.limiters ?? {}).some(
        (l) => (l.leakyBucket?.drainedTotal ?? 0) >= 1
      )
    ).toBe(true);

    const { finalState: hier } = runPreset("hierarchical_limits");
    expect(hier?.invariants.atomicMultiPolicyOk).toBe(true);
    expect(hier?.metrics.rateLimitRejections).toBeGreaterThanOrEqual(1);

    const { finalState: tenantIso } = runPreset("per_tenant_limits");
    const tA = tenantIso?.tenantFairness["tenant-a"];
    const tB = tenantIso?.tenantFairness["tenant-b"];
    expect(tA?.rejected).toBeGreaterThan(tB?.rejected ?? 0);
    expect(tB?.admitted).toBeGreaterThan(0);
  });

  it("models distributed coordination, local overshoot, and fail-open vs fail-closed behavior", () => {
    const { finalState: localOvershoot } = runPreset("local_limiter_overshoot");
    const gw1 = localOvershoot?.gateways["gw-1"];
    const gw2 = localOvershoot?.gateways["gw-2"];
    expect((gw1?.localUsed ?? 0) + (gw2?.localUsed ?? 0)).toBeGreaterThan(4);

    const { finalState: failOpen } = runPreset("fail_open_behavior");
    const { finalState: failClosed } = runPreset("fail_closed_behavior");
    expect(failClosed?.metrics.rateLimitRejections).toBeGreaterThan(
      failOpen?.metrics.rateLimitRejections ?? 0
    );
  });

  it("models concurrency saturation, queue bounds, deadlines, backpressure, shedding, WFQ fairness, retry budgets, circuit breakers, and adaptive concurrency", () => {
    const { finalState: concSat } = runPreset("concurrency_saturation");
    expect(concSat?.metrics.concurrencyRejections).toBeGreaterThanOrEqual(1);

    const { finalState: qOver } = runPreset("queue_overflow");
    expect(qOver?.metrics.queueOverflows).toBeGreaterThanOrEqual(1);

    const { finalState: qTime } = runPreset("queue_timeout");
    expect(qTime?.metrics.timeoutCount).toBeGreaterThanOrEqual(1);

    const { finalState: bpState } = runPreset("backpressure_propagation");
    expect(bpState?.backpressure.activatedCount).toBeGreaterThanOrEqual(1);

    const { finalState: shedState } = runPreset("load_shedding");
    expect(shedState?.metrics.loadShedCount).toBeGreaterThanOrEqual(1);
    expect(shedState?.tenantFairness["vip"]?.completed).toBeGreaterThan(0);

    const { finalState: wfqState } = runPreset("tenant_fairness");
    expect(wfqState?.tenantFairness["steady-tenant"]?.completed).toBeGreaterThan(0);
    expect(wfqState?.tenantFairness["steady-tenant"]?.starving).toBe(false);

    const { scenario: stormScenario, finalState: storm } = runPreset("retry_storm");
    const { scenario: budgetScenario, finalState: budgeted } = runPreset(
      "retry_budget_protection"
    );
    expect(budgeted?.metrics.suppressedRetries).toBeGreaterThanOrEqual(1);
    expect(storm?.metrics.retryAmplification).toBeGreaterThanOrEqual(
      budgeted?.metrics.retryAmplification ?? 1
    );

    const comparison = compareTrafficControlScenarios(stormScenario, budgetScenario);
    expect(comparison.deltas.retryAmplificationDelta).toBeLessThanOrEqual(0);

    const { finalState: cbOpen } = runPreset("circuit_breaker_open");
    expect(cbOpen?.circuitBreaker.tripCount).toBeGreaterThanOrEqual(1);
    expect(cbOpen?.metrics.circuitRejections).toBeGreaterThanOrEqual(1);

    const { finalState: cbRec } = runPreset("circuit_breaker_recovery");
    expect(cbRec?.circuitBreaker.tripCount).toBeGreaterThanOrEqual(1);
    expect(cbRec?.circuitBreaker.state).toBe("CLOSED");

    const { finalState: adaptive } = runPreset("adaptive_concurrency");
    expect(adaptive?.concurrency.adaptiveEnabled).toBe(true);
    expect(adaptive?.invariants.concurrencyBoundsOk).toBe(true);
  });

  it("satisfies property invariants across randomized seeds and scales to 20 sources / high request volumes", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const base = createTrafficControlPresetScenario("flash_crowd");
      base.seed = seed;
      const trace = TrafficControlExecutionEngine.runScenario(base);
      const last =
        trace.frames[trace.frames.length - 1]?.runtimeState?.trafficControlState;
      expect(last?.invariants.allPassed).toBe(true);
      expect(last?.invariants.permitsBalancedOk).toBe(true);
      expect(last?.invariants.tokenBoundsOk).toBe(true);
      expect(last?.invariants.queueBoundsOk).toBe(true);
    }

    // Multi-source load scale verification (20 sources, bounded execution)
    const stress = createTrafficControlPresetScenario("flash_crowd");
    stress.sources = Array.from({ length: 20 }, (_, i) => ({
      ...stress.sources[0]!,
      id: `stress-src-${i}`,
      tenantId: `tenant-${i % 4}`,
      requestsPerSecond: 30,
      endAtMs: 400,
    }));
    stress.limits.maxRequests = 1200;
    stress.limits.maxEvents = 4000;
    const stressTrace = TrafficControlExecutionEngine.runScenario(stress);
    const stressFinal =
      stressTrace.frames[stressTrace.frames.length - 1]?.runtimeState
        ?.trafficControlState;
    expect(stressFinal?.metrics.offeredRequests).toBeGreaterThan(100);
    expect(stressFinal?.invariants.allPassed).toBe(true);
  });
});

