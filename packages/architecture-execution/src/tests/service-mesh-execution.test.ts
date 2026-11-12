import { describe, expect, it } from "vitest";
import {
  SERVICE_MESH_PRESET_METADATA,
  ServiceMeshExecutionEngine,
  createServiceMeshPresetScenario,
  type ExecutionTrace,
  type ModeledServiceMeshRuntimeState,
} from "../index";

function getFinalMeshState(trace: ExecutionTrace): ModeledServiceMeshRuntimeState {
  const lastFrame = trace.frames[trace.frames.length - 1];
  if (!lastFrame?.runtimeState?.serviceMeshState) {
    throw new Error("Expected final frame to include serviceMeshState");
  }
  return lastFrame.runtimeState.serviceMeshState;
}

describe("Phase 05.4.12: Microservices, Service Mesh & Distributed Resilience Engine", () => {
  it("runs all 26 presets deterministically with valid causal spans", () => {
    expect(SERVICE_MESH_PRESET_METADATA.length).toBe(26);

    for (const meta of SERVICE_MESH_PRESET_METADATA) {
      const scenario = createServiceMeshPresetScenario(meta.id);
      const traceA = ServiceMeshExecutionEngine.runScenario(scenario);
      const traceB = ServiceMeshExecutionEngine.runScenario(scenario);

      expect(traceA.frames.length).toBeGreaterThan(0);
      expect(traceA.events.length).toBe(traceB.events.length);

      const finalA = getFinalMeshState(traceA);
      const finalB = getFinalMeshState(traceB);

      expect(finalA.metrics).toEqual(finalB.metrics);
      expect(finalA.recentRequests.length).toBe(finalB.recentRequests.length);

      for (const req of finalA.recentRequests) {
        expect(req.totalDurationMs).toBeGreaterThanOrEqual(0);
        const spanById = new Map(req.spans.map((s) => [s.spanId, s]));
        for (const sp of req.spans) {
          expect(sp.durationMs).toBeGreaterThanOrEqual(0);
          if (sp.parentSpanId) {
            const parent = spanById.get(sp.parentSpanId);
            if (parent) {
              expect(sp.startMs).toBeGreaterThanOrEqual(parent.startMs);
            }
          }
        }
      }
    }
  });

  it("enforces strict mTLS and authorization policies without retry bypass", () => {
    const mtlsFail = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("mtls_failure")
      )
    );
    expect(mtlsFail.metrics.mtlsFailedCount).toBe(1);
    expect(mtlsFail.recentRequests[0]?.status).toBe("rejected");

    const authDeny = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("authorization_denial")
      )
    );
    expect(authDeny.metrics.authDeniedCount).toBe(1);
    // Auth denial MUST NOT trigger retries even when retry policy is configured (maxAttempts=3)
    expect(authDeny.metrics.retryCount).toBe(0);
    expect(authDeny.recentRequests[0]?.status).toBe("rejected");
  });

  it("distributes load across replicas via round-robin and least-active routing", () => {
    const rrState = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("round_robin_routing")
      )
    );
    expect(rrState.instances["payments-v1-a"]?.totalHandled).toBe(2);
    expect(rrState.instances["payments-v1-b"]?.totalHandled).toBe(2);
    expect(rrState.instances["payments-v1-c"]?.totalHandled).toBe(2);

    const laState = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("least_active_routing")
      )
    );
    expect(laState.instances["payments-v1-a"]?.totalHandled).toBe(2);
    expect(laState.instances["payments-v1-b"]?.totalHandled).toBe(2);
  });

  it("models retry recovery, retry amplification storm, and deadline propagation cap", () => {
    const backoffState = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("retry_with_backoff")
      )
    );
    expect(backoffState.metrics.successCount).toBe(1);
    expect(backoffState.metrics.retryCount).toBeGreaterThanOrEqual(1);

    const stormState = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("retry_storm")
      )
    );
    // API (1) -> Orders (up to 3) -> Payments (up to 3) amplifies total calls well beyond 5
    expect(stormState.metrics.retryAmplificationFactor).toBeGreaterThan(5);

    const budgetedStorm = createServiceMeshPresetScenario("retry_storm");
    budgetedStorm.resilience.forEach((r) => {
      r.retry.retryBudgetPct = 100;
    });
    const budgetedState = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(budgetedStorm)
    );
    expect(budgetedState.metrics.retryAmplificationFactor).toBeLessThan(
      stormState.metrics.retryAmplificationFactor
    );

    const deadlineState = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("deadline_propagation")
      )
    );
    expect(deadlineState.metrics.timeoutCount).toBeGreaterThan(0);
    expect(deadlineState.recentRequests[0]?.totalDurationMs).toBeLessThanOrEqual(450);
  });

  it("transitions circuit breakers through OPEN and HALF_OPEN recovery", () => {
    const openState = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("circuit_breaker_opening")
      )
    );
    const cbOpen = openState.circuits["payments"];
    expect(cbOpen?.state).toBe("open");
    expect(openState.metrics.circuitRejectionCount).toBeGreaterThan(0);

    const recoverState = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("half_open_recovery")
      )
    );
    const cbRec = recoverState.circuits["payments"];
    expect(cbRec?.transitions.some((t) => t.to === "open")).toBe(true);
    expect(cbRec?.transitions.some((t) => t.to === "half_open")).toBe(true);
    expect(cbRec?.transitions.some((t) => t.to === "closed")).toBe(true);
    expect(cbRec?.state).toBe("closed");
  });

  it("enforces bulkhead maxActive+queue limits and proxy connection pool bounds", () => {
    const bhState = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("bulkhead_saturation")
      )
    );
    expect(bhState.metrics.bulkheadRejectionCount).toBe(3);
    expect(bhState.metrics.successCount).toBe(5);

    const poolState = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("connection_pool_exhaustion")
      )
    );
    expect(poolState.metrics.poolRejectedCount).toBe(3);
    expect(poolState.metrics.successCount).toBe(3);
  });

  it("evaluates canary promotion, automatic rollback, and parallel partial fallback", () => {
    const promoted = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("canary_promotion")
      )
    );
    expect(promoted.canary?.status).toBe("promoted");
    expect(promoted.canary?.currentCanaryPct).toBe(100);

    const rolledBack = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("canary_rollback")
      )
    );
    expect(rolledBack.canary?.status).toBe("rolled_back");
    expect(rolledBack.canary?.currentCanaryPct).toBe(0);

    const partial = getFinalMeshState(
      ServiceMeshExecutionEngine.runScenario(
        createServiceMeshPresetScenario("partial_response")
      )
    );
    expect(partial.recentRequests[0]?.status).toBe("degraded");
    expect(partial.metrics.fallbackCount).toBeGreaterThanOrEqual(1);
    const sumSpans = partial.recentRequests[0]!.spans.reduce(
      (s, sp) => s + (sp.parentSpanId ? sp.durationMs : 0),
      0
    );
    // Parallel fan-out critical path is shorter than summing sequential child spans
    expect(partial.recentRequests[0]!.criticalPathMs).toBeLessThan(sumSpans);
  });
});
