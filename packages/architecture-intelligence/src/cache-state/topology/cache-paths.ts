/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Multi-Layer Cache Path & Read Traffic Tracer
 */

import type {
  DistributedStateTopology,
  MultiLayerCachePathTrace,
  MultiLayerCacheTraceHop,
} from "../contracts/cache-state.types";

export class CachePathTracer {
  public static traceHierarchy(
    topology: DistributedStateTopology,
    incomingClientRps: number = 1000
  ): MultiLayerCachePathTrace[] {
    if (topology.cacheLayers.length === 0) {
      return [
        {
          id: "trace-direct-db",
          flowName: "Direct Database Reads (No Caching)",
          incomingClientRps,
          hops: [],
          terminalBackendReadRps: incomingClientRps,
          netOffloadPercentage: 0,
          explanation: "All read traffic hits the primary database with 0% caching offload.",
        },
      ];
    }

    // Sort layers by tier order ascending (tier 1 = edge/client closest, tier 4 = distributed redis)
    const sortedLayers = [...topology.cacheLayers].sort((a, b) => a.tierOrder - b.tierOrder);

    const hops: MultiLayerCacheTraceHop[] = [];
    let currentIncomingRps = incomingClientRps;

    for (const layer of sortedLayers) {
      const hitRatio =
        layer.readHitRatioObserved !== undefined
          ? layer.readHitRatioObserved
          : layer.readHitRatioModeled !== undefined
          ? layer.readHitRatioModeled
          : 0.65; // default modeled assumption

      const missesRps = Number((currentIncomingRps * (1 - hitRatio)).toFixed(1));

      hops.push({
        layerId: layer.id,
        layerName: layer.name,
        cacheType: layer.cacheType,
        tierOrder: layer.tierOrder,
        hitRatioModeled: hitRatio,
        effectiveIncomingRps: Number(currentIncomingRps.toFixed(1)),
        effectiveOutgoingMissRps: missesRps,
      });

      currentIncomingRps = missesRps;
    }

    const terminalBackendReadRps = Number(currentIncomingRps.toFixed(1));
    const netOffloadPercentage = Number(
      (((incomingClientRps - terminalBackendReadRps) / incomingClientRps) * 100).toFixed(1)
    );

    return [
      {
        id: `trace-hierarchy-${topology.id}`,
        flowName: "Multi-Tier Cascading Cache Read Path",
        incomingClientRps,
        hops,
        terminalBackendReadRps,
        netOffloadPercentage,
        explanation: `Hierarchical multi-tier caching reduces ${incomingClientRps} incoming client RPS down to ${terminalBackendReadRps} terminal database RPS (${netOffloadPercentage}% database offload).`,
      },
    ];
  }
}

