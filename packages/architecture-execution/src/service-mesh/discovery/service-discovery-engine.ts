import type {
  MeshDiscoveryConfig,
  ModeledServiceMeshRuntimeState,
} from "../service-mesh-schemas";

export class ServiceDiscoveryEngine {
  public static resolveEndpoints(
    requestId: string,
    serviceId: string,
    atMs: number,
    discoveryConfig: MeshDiscoveryConfig,
    runtime: ModeledServiceMeshRuntimeState,
    emit: (evt: Record<string, unknown>) => void
  ): { endpointIds: string[]; latencyMs: number; fromCache: boolean } {
    emit({
      type: "mesh.discovery.lookup.started",
      atMs,
      durationMs: 1,
      requestId,
      serviceId,
      explanation: `Resolving service endpoints for "${serviceId}" (cache=${discoveryConfig.cacheEnabled}).`,
    });

    const cached = runtime.discoveryCache[serviceId];
    if (
      discoveryConfig.cacheEnabled &&
      cached &&
      cached.expiresAtMs > atMs &&
      cached.endpointIds.length > 0
    ) {
      emit({
        type: "mesh.discovery.cache.hit",
        atMs,
        durationMs: 1,
        requestId,
        serviceId,
        endpointIds: cached.endpointIds,
        explanation: `Discovery cache HIT for "${serviceId}": [${cached.endpointIds.join(", ")}]${cached.stale ? " (stale pre-propagation)" : ""}.`,
      });
      return {
        endpointIds: cached.endpointIds,
        latencyMs: 1,
        fromCache: true,
      };
    }

    emit({
      type: "mesh.discovery.cache.miss",
      atMs,
      durationMs: discoveryConfig.lookupLatencyMs,
      requestId,
      serviceId,
      explanation: `Discovery cache MISS/expired for "${serviceId}"; querying service registry.`,
    });

    const activeEndpoints = Object.values(runtime.instances)
      .filter((inst) => {
        if (inst.serviceId !== serviceId) return false;
        if (inst.healthy && inst.ready) return true;
        // Model delayed discovery propagation: unhealthy instance may remain visible until propagation delay passes
        if (
          discoveryConfig.propagationDelayMs > 0 &&
          atMs - inst.lastUpdatedAtMs < discoveryConfig.propagationDelayMs
        ) {
          return true;
        }
        return false;
      })
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((i) => i.id);

    if (activeEndpoints.length === 0) {
      emit({
        type: "mesh.discovery.failed",
        atMs: atMs + discoveryConfig.lookupLatencyMs,
        durationMs: 2,
        requestId,
        serviceId,
        reason: `No healthy/ready endpoints registered for "${serviceId}".`,
        explanation: `Service discovery FAILED for "${serviceId}": zero eligible instances.`,
      });
      return {
        endpointIds: [],
        latencyMs: discoveryConfig.lookupLatencyMs,
        fromCache: false,
      };
    }

    if (discoveryConfig.cacheEnabled) {
      runtime.discoveryCache[serviceId] = {
        serviceId,
        endpointIds: activeEndpoints,
        updatedAtMs: atMs,
        expiresAtMs: atMs + discoveryConfig.cacheTtlMs,
        stale: false,
      };
    }

    emit({
      type: "mesh.discovery.endpoints.resolved",
      atMs: atMs + discoveryConfig.lookupLatencyMs,
      durationMs: 1,
      requestId,
      serviceId,
      endpointIds: activeEndpoints,
      explanation: `Resolved endpoints for "${serviceId}": [${activeEndpoints.join(", ")}].`,
    });

    return {
      endpointIds: activeEndpoints,
      latencyMs: discoveryConfig.lookupLatencyMs,
      fromCache: false,
    };
  }
}

