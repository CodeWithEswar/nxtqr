import type {
  MeshBulkheadPolicy,
  MeshCircuitBreakerPolicy,
  MeshCircuitBreakerState,
  MeshRetryPolicy,
  ModeledServiceMeshRuntimeState,
} from "../service-mesh-schemas";

export class MeshResilienceEngine {
  public static getOrCreateCircuit(
    runtime: ModeledServiceMeshRuntimeState,
    policyId: string,
    scopeKey: string,
    serviceId: string
  ): MeshCircuitBreakerState {
    if (!runtime.circuits[scopeKey]) {
      runtime.circuits[scopeKey] = {
        policyId,
        scopeKey,
        serviceId,
        state: "closed",
        recentOutcomes: [],
        halfOpenActiveProbes: 0,
        halfOpenSuccesses: 0,
        rejectedCount: 0,
        transitions: [],
      };
    }
    return runtime.circuits[scopeKey]!;
  }

  public static canPassCircuit(
    requestId: string,
    scopeKey: string,
    serviceId: string,
    atMs: number,
    policy: MeshCircuitBreakerPolicy,
    runtime: ModeledServiceMeshRuntimeState,
    emit: (evt: Record<string, unknown>) => void
  ): boolean {
    if (!policy.enabled) return true;
    const cb = this.getOrCreateCircuit(runtime, `cb-${serviceId}`, scopeKey, serviceId);

    if (cb.state === "open") {
      if (cb.nextProbeAtMs !== undefined && atMs >= cb.nextProbeAtMs) {
        const prevState = cb.state;
        cb.state = "half_open";
        cb.halfOpenActiveProbes = 0;
        cb.halfOpenSuccesses = 0;
        cb.transitions.push({
          atMs,
          from: prevState,
          to: "half_open",
          reason: `Open duration (${policy.openDurationMs}ms) elapsed; allowing probes.`,
        });
        emit({
          type: "mesh.circuit.half_opened",
          atMs,
          durationMs: 1,
          scopeKey,
          serviceId,
          explanation: `Circuit breaker "${scopeKey}" transitioned OPEN -> HALF_OPEN (max ${policy.halfOpenProbeLimit} probes).`,
        });
      } else {
        cb.rejectedCount += 1;
        emit({
          type: "mesh.circuit.request.rejected",
          atMs,
          durationMs: 1,
          requestId,
          scopeKey,
          state: "open",
          explanation: `Circuit breaker "${scopeKey}" OPEN — fast-failed "${requestId}".`,
        });
        return false;
      }
    }

    if (cb.state === "half_open") {
      if (cb.halfOpenActiveProbes >= policy.halfOpenProbeLimit) {
        cb.rejectedCount += 1;
        emit({
          type: "mesh.circuit.request.rejected",
          atMs,
          durationMs: 1,
          requestId,
          scopeKey,
          state: "half_open",
          explanation: `Circuit breaker "${scopeKey}" HALF_OPEN probe limit (${policy.halfOpenProbeLimit}) reached — rejected "${requestId}".`,
        });
        return false;
      }
      cb.halfOpenActiveProbes += 1;
    }

    emit({
      type: "mesh.circuit.request.allowed",
      atMs,
      durationMs: 0,
      requestId,
      scopeKey,
      state: cb.state === "half_open" ? "half_open" : "closed",
      explanation: `Circuit breaker "${scopeKey}" (${cb.state}) allowed "${requestId}".`,
    });
    return true;
  }

  public static recordCircuitOutcome(
    scopeKey: string,
    serviceId: string,
    atMs: number,
    success: boolean,
    policy: MeshCircuitBreakerPolicy,
    runtime: ModeledServiceMeshRuntimeState,
    emit: (evt: Record<string, unknown>) => void
  ): void {
    if (!policy.enabled) return;
    const cb = this.getOrCreateCircuit(runtime, `cb-${serviceId}`, scopeKey, serviceId);

    // Prune outside rolling window (bounded max 200 outcomes)
    const minWindowTs = atMs - policy.rollingWindowMs;
    cb.recentOutcomes = cb.recentOutcomes
      .filter((o) => o.timestampMs >= minWindowTs)
      .slice(-199);
    cb.recentOutcomes.push({ timestampMs: atMs, success });

    if (cb.state === "half_open") {
      cb.halfOpenActiveProbes = Math.max(0, cb.halfOpenActiveProbes - 1);
      if (success) {
        cb.halfOpenSuccesses += 1;
        if (cb.halfOpenSuccesses >= policy.successThreshold) {
          cb.state = "closed";
          cb.recentOutcomes = [];
          cb.halfOpenSuccesses = 0;
          cb.transitions.push({
            atMs,
            from: "half_open",
            to: "closed",
            reason: `Probe threshold (${policy.successThreshold}) passed.`,
          });
          emit({
            type: "mesh.circuit.closed",
            atMs,
            durationMs: 1,
            scopeKey,
            serviceId,
            explanation: `Circuit breaker "${scopeKey}" transitioned HALF_OPEN -> CLOSED.`,
          });
        }
      } else {
        cb.state = "open";
        cb.openedAtMs = atMs;
        cb.nextProbeAtMs = atMs + policy.openDurationMs;
        cb.halfOpenSuccesses = 0;
        cb.transitions.push({
          atMs,
          from: "half_open",
          to: "open",
          reason: "Half-open probe failed; reopening circuit.",
        });
        emit({
          type: "mesh.circuit.opened",
          atMs,
          durationMs: 1,
          scopeKey,
          serviceId,
          failureRatePct: 100,
          explanation: `Circuit breaker "${scopeKey}" probe failed -> reopened OPEN for ${policy.openDurationMs}ms.`,
        });
      }
      return;
    }

    if (cb.state === "closed" && cb.recentOutcomes.length >= policy.minimumRequests) {
      const failures = cb.recentOutcomes.filter((o) => !o.success).length;
      const failureRatePct = Math.round((failures / cb.recentOutcomes.length) * 100);
      if (failureRatePct >= policy.failureRateThresholdPct) {
        cb.state = "open";
        cb.openedAtMs = atMs;
        cb.nextProbeAtMs = atMs + policy.openDurationMs;
        cb.transitions.push({
          atMs,
          from: "closed",
          to: "open",
          reason: `Failure rate ${failureRatePct}% >= ${policy.failureRateThresholdPct}% over ${cb.recentOutcomes.length} calls.`,
        });
        emit({
          type: "mesh.circuit.opened",
          atMs,
          durationMs: 1,
          scopeKey,
          serviceId,
          failureRatePct,
          explanation: `Circuit breaker "${scopeKey}" OPENED (${failures}/${cb.recentOutcomes.length} failed = ${failureRatePct}%).`,
        });
      }
    }
  }

  public static tryAcquireBulkhead(
    requestId: string,
    serviceId: string,
    atMs: number,
    policy: MeshBulkheadPolicy,
    runtime: ModeledServiceMeshRuntimeState,
    emit: (evt: Record<string, unknown>) => void
  ): { acquired: boolean; queueWaitMs: number } {
    if (!policy.enabled) return { acquired: true, queueWaitMs: 0 };

    if (!runtime.bulkheads[serviceId]) {
      runtime.bulkheads[serviceId] = {
        serviceId,
        maxActive: policy.maxActive,
        queueCapacity: policy.queueCapacity,
        activeCount: 0,
        queuedCount: 0,
        acquiredCount: 0,
        rejectedCount: 0,
      };
    }

    const bh = runtime.bulkheads[serviceId]!;
    if (bh.activeCount < bh.maxActive) {
      bh.activeCount += 1;
      bh.acquiredCount += 1;
      emit({
        type: "mesh.bulkhead.slot.acquired",
        atMs,
        durationMs: 0,
        requestId,
        serviceId,
        activeCount: bh.activeCount,
        explanation: `Bulkhead "${serviceId}" slot acquired (${bh.activeCount}/${bh.maxActive} active).`,
      });
      return { acquired: true, queueWaitMs: 0 };
    }

    if (bh.queuedCount < bh.queueCapacity) {
      bh.queuedCount += 1;
      emit({
        type: "mesh.bulkhead.queued",
        atMs,
        durationMs: policy.queueTimeoutMs,
        requestId,
        serviceId,
        queuedCount: bh.queuedCount,
        explanation: `Bulkhead "${serviceId}" full; queued "${requestId}" (${bh.queuedCount}/${bh.queueCapacity}).`,
      });
      return { acquired: true, queueWaitMs: Math.min(policy.queueTimeoutMs, 60) };
    }

    bh.rejectedCount += 1;
    emit({
      type: "mesh.bulkhead.rejected",
      atMs,
      durationMs: 1,
      requestId,
      serviceId,
      explanation: `Bulkhead "${serviceId}" saturated (${bh.maxActive} active + ${bh.queueCapacity} queued); rejected "${requestId}".`,
    });
    return { acquired: false, queueWaitMs: 0 };
  }

  public static releaseBulkhead(
    requestId: string,
    serviceId: string,
    atMs: number,
    usedQueue: boolean,
    policy: MeshBulkheadPolicy,
    runtime: ModeledServiceMeshRuntimeState,
    emit: (evt: Record<string, unknown>) => void
  ): void {
    if (!policy.enabled) return;
    const bh = runtime.bulkheads[serviceId];
    if (!bh) return;
    if (usedQueue) {
      bh.queuedCount = Math.max(0, bh.queuedCount - 1);
    } else {
      bh.activeCount = Math.max(0, bh.activeCount - 1);
    }
    emit({
      type: "mesh.bulkhead.slot.released",
      atMs,
      durationMs: 0,
      requestId,
      serviceId,
      explanation: `Released bulkhead capacity for "${serviceId}".`,
    });
  }

  public static computeRetryBackoffMs(
    attemptNumber: number,
    policy: MeshRetryPolicy,
    seed: number
  ): number {
    const exp =
      policy.initialBackoffMs *
      Math.pow(policy.exponentialFactor, Math.max(0, attemptNumber - 1));
    const capped = Math.min(policy.maxBackoffMs, exp);
    const jitterFactor =
      1 + ((((attemptNumber * 31 + seed) % 21) - 10) / 10) * policy.jitterRatio;
    return Math.max(0, Math.round(capped * jitterFactor));
  }
}

