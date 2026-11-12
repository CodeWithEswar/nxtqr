import type {
  MeshCanaryConfig,
  MeshCanaryRuntimeState,
} from "../service-mesh-schemas";

export class CanaryController {
  public static initialize(config?: MeshCanaryConfig): MeshCanaryRuntimeState | undefined {
    if (!config || !config.enabled) return undefined;
    const initialPct = config.stagesPct[0] ?? 5;
    return {
      serviceId: config.serviceId,
      stableRevision: config.stableRevision,
      canaryRevision: config.canaryRevision,
      currentStageIndex: 0,
      currentCanaryPct: initialPct,
      status: "active",
      stableRequests: 0,
      stableErrors: 0,
      canaryRequests: 0,
      canaryErrors: 0,
      stableAvgLatencyMs: 0,
      canaryAvgLatencyMs: 0,
      lastEvaluatedAtMs: 0,
      reason: `Canary initialized at ${initialPct}% traffic toward "${config.canaryRevision}".`,
    };
  }

  public static recordObservation(
    state: MeshCanaryRuntimeState | undefined,
    serviceId: string,
    revision: string,
    success: boolean,
    latencyMs: number
  ): void {
    if (!state || state.serviceId !== serviceId || state.status === "rolled_back") {
      return;
    }
    if (revision === state.canaryRevision) {
      const prevTotal = state.canaryAvgLatencyMs * state.canaryRequests;
      state.canaryRequests += 1;
      if (!success) state.canaryErrors += 1;
      state.canaryAvgLatencyMs = Math.round((prevTotal + latencyMs) / state.canaryRequests);
    } else {
      const prevTotal = state.stableAvgLatencyMs * state.stableRequests;
      state.stableRequests += 1;
      if (!success) state.stableErrors += 1;
      state.stableAvgLatencyMs = Math.round((prevTotal + latencyMs) / state.stableRequests);
    }
  }

  public static evaluate(
    config: MeshCanaryConfig | undefined,
    state: MeshCanaryRuntimeState | undefined,
    atMs: number,
    emit: (evt: Record<string, unknown>) => void
  ): void {
    if (!config || !state || !config.enabled) return;
    if (state.status === "promoted" || state.status === "rolled_back") return;

    const canaryErrorRatePct =
      state.canaryRequests > 0
        ? Math.round((state.canaryErrors / state.canaryRequests) * 100)
        : 0;

    emit({
      type: "mesh.canary.evaluation.started",
      atMs,
      durationMs: 2,
      serviceId: state.serviceId,
      canaryPct: state.currentCanaryPct,
      canaryErrorRatePct,
      explanation: `Evaluating canary "${state.canaryRevision}": ${state.canaryRequests} samples, ${canaryErrorRatePct}% errors (limit ${config.maxErrorRatePct}%).`,
    });

    state.lastEvaluatedAtMs = atMs;

    if (state.canaryRequests < config.minSamples) {
      state.status = "paused";
      state.reason = `Awaiting minimum sample size (${state.canaryRequests}/${config.minSamples}) before promotion.`;
      return;
    }

    if (canaryErrorRatePct > config.maxErrorRatePct) {
      state.status = "rolled_back";
      state.currentCanaryPct = 0;
      state.reason = `Canary error rate ${canaryErrorRatePct}% exceeded threshold ${config.maxErrorRatePct}%; rolled back to "${state.stableRevision}".`;
      emit({
        type: "mesh.canary.rollback.completed",
        atMs,
        durationMs: 4,
        serviceId: state.serviceId,
        reason: state.reason,
        explanation: state.reason,
      });
      return;
    }

    const nextStage = state.currentStageIndex + 1;
    if (nextStage < config.stagesPct.length) {
      state.currentStageIndex = nextStage;
      state.currentCanaryPct = config.stagesPct[nextStage]!;
      state.status = state.currentCanaryPct === 100 ? "promoted" : "active";
      state.reason =
        state.status === "promoted"
          ? `Canary "${state.canaryRevision}" promoted to 100% traffic.`
          : `Canary promoted to stage ${nextStage + 1} (${state.currentCanaryPct}%).`;
      emit({
        type: "mesh.canary.promoted",
        atMs,
        durationMs: 3,
        serviceId: state.serviceId,
        newCanaryPct: state.currentCanaryPct,
        explanation: state.reason,
      });
    } else {
      state.status = "promoted";
      state.currentCanaryPct = 100;
      state.reason = `Canary "${state.canaryRevision}" fully promoted.`;
    }
  }
}

