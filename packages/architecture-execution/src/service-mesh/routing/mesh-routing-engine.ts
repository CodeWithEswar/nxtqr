import type {
  MeshCanaryRuntimeState,
  MeshRoutingRule,
  MeshServiceInstanceRuntimeState,
} from "../service-mesh-schemas";

function hashDeterministic(input: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}

export class MeshRoutingEngine {
  public static selectEndpoint(
    requestId: string,
    destinationServiceId: string,
    endpointIds: string[],
    headers: Record<string, string>,
    path: string,
    atMs: number,
    seed: number,
    rules: MeshRoutingRule[],
    instances: Record<string, MeshServiceInstanceRuntimeState>,
    rrCursorByService: Record<string, number>,
    canaryState: MeshCanaryRuntimeState | undefined,
    emit: (evt: Record<string, unknown>) => void
  ): {
    selectedInstance?: MeshServiceInstanceRuntimeState;
    matchedRuleId?: string;
    selectedRevision?: string;
  } {
    const candidates = endpointIds
      .map((id) => instances[id])
      .filter((inst): inst is MeshServiceInstanceRuntimeState => Boolean(inst));

    if (candidates.length === 0) {
      return {};
    }

    // Find matching rule
    const rule = rules.find((r) => {
      if (r.destinationServiceId !== destinationServiceId) return false;
      if (r.matchPathPrefix && !path.startsWith(r.matchPathPrefix)) return false;
      for (const [hk, hv] of Object.entries(r.matchHeaders)) {
        if (headers[hk] !== hv) return false;
      }
      return true;
    });

    let pool = candidates;
    let selectedRevision: string | undefined;

    // 1. Canary weighted revision selection if enabled for this service
    if (
      canaryState &&
      canaryState.serviceId === destinationServiceId &&
      canaryState.status !== "rolled_back"
    ) {
      const roll = hashDeterministic(`${requestId}:${atMs}`, seed) % 100;
      const targetRev =
        roll < canaryState.currentCanaryPct
          ? canaryState.canaryRevision
          : canaryState.stableRevision;
      const revPool = candidates.filter((c) => c.revision === targetRev);
      if (revPool.length > 0) {
        pool = revPool;
        selectedRevision = targetRev;
      }
      emit({
        type: "mesh.traffic_split.evaluated",
        atMs,
        durationMs: 1,
        requestId,
        destinationServiceId,
        selectedRevision: selectedRevision ?? candidates[0]!.revision,
        explanation: `Canary split (${canaryState.currentCanaryPct}% ${canaryState.canaryRevision}) routed "${requestId}" to revision "${selectedRevision ?? candidates[0]!.revision}".`,
      });
    } else if (rule?.targetRevision) {
      const revPool = candidates.filter((c) => c.revision === rule.targetRevision);
      if (revPool.length > 0) {
        pool = revPool;
        selectedRevision = rule.targetRevision;
      }
    } else if (rule && rule.splits.length > 0) {
      const totalWeight = rule.splits.reduce((sum, s) => sum + s.weight, 0);
      if (totalWeight > 0) {
        const cursor = (rrCursorByService[`split:${destinationServiceId}`] ?? 0);
        rrCursorByService[`split:${destinationServiceId}`] = cursor + 1;
        const bucket = (cursor * 37 + (seed % 100)) % totalWeight;
        let acc = 0;
        let chosenRev = rule.splits[0]!.revision;
        for (const s of rule.splits) {
          acc += s.weight;
          if (bucket < acc) {
            chosenRev = s.revision;
            break;
          }
        }
        const revPool = candidates.filter((c) => c.revision === chosenRev);
        if (revPool.length > 0) {
          pool = revPool;
          selectedRevision = chosenRev;
        }
        emit({
          type: "mesh.traffic_split.evaluated",
          atMs,
          durationMs: 1,
          requestId,
          destinationServiceId,
          selectedRevision: chosenRev,
          explanation: `Traffic split selected revision "${chosenRev}" via rule "${rule.id}".`,
        });
      }
    }

    const strategy = rule?.loadBalancing ?? "round_robin";
    let chosen: MeshServiceInstanceRuntimeState;

    if (strategy === "least_active") {
      const sorted = [...pool].sort((a, b) => {
        if (a.activeRequests !== b.activeRequests) {
          return a.activeRequests - b.activeRequests;
        }
        if (a.totalHandled !== b.totalHandled) {
          return a.totalHandled - b.totalHandled;
        }
        return a.id.localeCompare(b.id);
      });
      chosen = sorted[0]!;
    } else if (strategy === "weighted_round_robin") {
      const expanded: MeshServiceInstanceRuntimeState[] = [];
      for (const inst of pool) {
        const slots = Math.max(1, Math.min(10, Math.round(inst.weight / 20)));
        for (let i = 0; i < slots; i++) expanded.push(inst);
      }
      const cursor = rrCursorByService[destinationServiceId] ?? 0;
      rrCursorByService[destinationServiceId] = cursor + 1;
      chosen = expanded[cursor % expanded.length]!;
    } else if (strategy === "consistent_hash") {
      const hashKey = headers["x-user-id"] ?? headers["x-tenant-id"] ?? requestId;
      const idx = hashDeterministic(hashKey, seed) % pool.length;
      chosen = pool[idx]!;
    } else if (strategy === "deterministic_random") {
      const idx = hashDeterministic(`${requestId}:${atMs}`, seed) % pool.length;
      chosen = pool[idx]!;
    } else {
      const cursor = rrCursorByService[destinationServiceId] ?? 0;
      rrCursorByService[destinationServiceId] = cursor + 1;
      chosen = pool[cursor % pool.length]!;
    }

    emit({
      type: "mesh.routing.completed",
      atMs,
      durationMs: 1,
      requestId,
      destinationServiceId,
      selectedInstanceId: chosen.id,
      selectedRevision: chosen.revision,
      matchedRuleId: rule?.id,
      explanation: `Routed "${requestId}" -> "${chosen.id}" (rev ${chosen.revision}) via ${strategy}.`,
    });

    return {
      selectedInstance: chosen,
      matchedRuleId: rule?.id,
      selectedRevision: selectedRevision ?? chosen.revision,
    };
  }
}

