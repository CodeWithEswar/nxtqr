import { describe, it, expect } from "vitest";
import { CacheCapabilityRegistry } from "../cache-state/providers/cache-capability-registry";
import { DistributedStateTopologySchema } from "../cache-state/schemas/cache-state.schemas";
import type { DistributedStateTopology, CacheLayer } from "../cache-state/contracts/cache-state.types";

describe("Phase 05.3.22: Cache Topology & Capability Registry", () => {
  const registry = new CacheCapabilityRegistry();

  it("resolves capabilities for Redis accurately", () => {
    const layer: CacheLayer = {
      id: "cache-redis-1",
      name: "Redis Cluster",
      cacheType: "distributed_cache",
      technology: "redis",
      strategy: "cache_aside",
      tierOrder: 2,
      allocatedMemoryMb: 8192,
      evictionPolicy: "lru",
      ttlConfig: {
        type: "absolute",
        defaultTtlSeconds: 3600,
        jitterPercentage: 10,
        isSynchronizedExpirationRisk: false,
      },
      keySpaces: [],
      fallbackBehavior: "database_direct",
      requestCoalescingEnabled: true,
      negativeCachingEnabled: true,
      provenance: {
        source: "configured",
        timestamp: new Date().toISOString(),
        graphRevision: "rev-1",
        confirmed: true,
      },
    };

    const caps = registry.resolveCapabilities(layer);
    expect(caps.supportsEvictionConfiguration).toBe(true);
    expect(caps.supportsDistributedLocking).toBe(true);
    expect(caps.supportsPubSubInvalidation).toBe(true);
    expect(caps.supportedEvictionPolicies).toContain("lru");
  });

  it("resolves capabilities for Memcached accurately", () => {
    const layer: CacheLayer = {
      id: "cache-mem-1",
      name: "Memcached Pool",
      cacheType: "distributed_cache",
      technology: "memcached",
      strategy: "cache_aside",
      tierOrder: 2,
      allocatedMemoryMb: 4096,
      evictionPolicy: "lru",
      ttlConfig: {
        type: "absolute",
        defaultTtlSeconds: 1800,
        jitterPercentage: 0,
        isSynchronizedExpirationRisk: true,
      },
      keySpaces: [],
      fallbackBehavior: "database_direct",
      requestCoalescingEnabled: false,
      negativeCachingEnabled: false,
      provenance: {
        source: "configured",
        timestamp: new Date().toISOString(),
        graphRevision: "rev-1",
        confirmed: true,
      },
    };

    const caps = registry.resolveCapabilities(layer);
    expect(caps.supportsEvictionConfiguration).toBe(true);
    expect(caps.supportsDistributedLocking).toBe(false);
    expect(caps.supportsPubSubInvalidation).toBe(false);
  });

  it("resolves capabilities for Cloudflare KV / Edge Cache accurately", () => {
    const layer: CacheLayer = {
      id: "cache-cf-1",
      name: "Cloudflare KV",
      cacheType: "edge_cache",
      technology: "cloudflare_kv",
      strategy: "read_through",
      tierOrder: 1,
      allocatedMemoryMb: 1024,
      evictionPolicy: "ttl_only",
      ttlConfig: {
        type: "stale_while_revalidate",
        defaultTtlSeconds: 86400,
        jitterPercentage: 10,
        isSynchronizedExpirationRisk: false,
      },
      keySpaces: [],
      fallbackBehavior: "stale_serve",
      requestCoalescingEnabled: true,
      negativeCachingEnabled: true,
      provenance: {
        source: "configured",
        timestamp: new Date().toISOString(),
        graphRevision: "rev-1",
        confirmed: true,
      },
    };

    const caps = registry.resolveCapabilities(layer);
    expect(caps.supportsMultiRegionActiveActive).toBe(true);
    expect(caps.supportsBackgroundRefresh).toBe(true);
  });

  it("validates a comprehensive DistributedStateTopology schema", () => {
    const now = new Date().toISOString();
    const topology: DistributedStateTopology = {
      id: "topo-state-1",
      projectId: "proj-1",
      architectureId: "arch-1",
      graphRevision: "rev-1",
      version: 1,
      cacheLayers: [
        {
          id: "layer-edge",
          name: "Edge CDN Cache",
          cacheType: "cdn_cache",
          technology: "cloudflare_cache",
          strategy: "read_through",
          tierOrder: 1,
          allocatedMemoryMb: 2048,
          evictionPolicy: "lru",
          ttlConfig: {
            type: "stale_while_revalidate",
            defaultTtlSeconds: 86400,
            jitterPercentage: 15,
            isSynchronizedExpirationRisk: false,
          },
          keySpaces: [
            {
              id: "ks-static",
              name: "Static Content",
              namespacePattern: "static:*",
              includesTenantScope: true,
              includesEnvironmentScope: true,
              includesVersionScope: false,
              dataClassification: "public",
              estimatedEntrySizeBytes: 15000,
              estimatedKeyCount: 50000,
              provenance: {
                source: "configured",
                timestamp: now,
                graphRevision: "rev-1",
                confirmed: true,
              },
            },
          ],
          fallbackBehavior: "database_direct",
          requestCoalescingEnabled: true,
          negativeCachingEnabled: true,
          negativeCacheTtlSeconds: 120,
          provenance: {
            source: "configured",
            timestamp: now,
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
        {
          id: "layer-redis",
          name: "Distributed Entity Cache",
          cacheType: "distributed_cache",
          technology: "redis",
          strategy: "cache_aside",
          tierOrder: 2,
          allocatedMemoryMb: 16384,
          evictionPolicy: "lru",
          ttlConfig: {
            type: "sliding",
            defaultTtlSeconds: 1800,
            jitterPercentage: 10,
            isSynchronizedExpirationRisk: false,
          },
          keySpaces: [
            {
              id: "ks-products",
              name: "Product Entities",
              namespacePattern: "tenant:{tenantId}:products:{productId}",
              includesTenantScope: true,
              includesEnvironmentScope: true,
              includesVersionScope: true,
              dataClassification: "internal",
              estimatedEntrySizeBytes: 2048,
              estimatedKeyCount: 1000000,
              provenance: {
                source: "configured",
                timestamp: now,
                graphRevision: "rev-1",
                confirmed: true,
              },
            },
          ],
          fallbackBehavior: "database_direct",
          requestCoalescingEnabled: true,
          negativeCachingEnabled: true,
          negativeCacheTtlSeconds: 60,
          provenance: {
            source: "configured",
            timestamp: now,
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
      ],
      sourcesOfTruth: [
        {
          id: "sot-postgres",
          name: "Primary PostgreSQL Database",
          type: "primary_relational_database",
          isAuthoritativeMaster: true,
          storageEngine: "postgres_16",
          provenance: {
            source: "configured",
            timestamp: now,
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
      ],
      invalidationRules: [
        {
          id: "inv-rule-1",
          name: "Entity Mutation Purge",
          targetCacheLayerIds: ["layer-redis", "layer-edge"],
          triggerEventOrTable: "products",
          mechanism: "event_driven_messaging",
          isAsynchronous: false,
          invalidationKeyPattern: "tenant:{tenantId}:products:{productId}",
          propagationLatencyMsExpected: 50,
          reRefillPolicy: "on_demand_lazy",
          provenance: {
            source: "configured",
            timestamp: now,
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
      ],
      replicaGroups: [
        {
          id: "rep-group-1",
          sourceOfTruthId: "sot-postgres",
          topologyType: "leader_follower",
          replicationMode: "asynchronous",
          readQuorumSize: 2,
          writeQuorumSize: 2,
          consistencyModel: "read_after_write",
          conflictResolution: "optimistic_concurrency_cas",
          replicas: [
            {
              id: "node-leader",
              name: "pg-leader",
              regionId: "us-east-1",
              isLeader: true,
              isReadOnly: false,
              provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
            },
            {
              id: "node-follower-1",
              name: "pg-follower-1",
              regionId: "us-east-1",
              isLeader: false,
              isReadOnly: true,
              replicationLagMsModeled: 50,
              provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
            },
          ],
          provenance: {
            source: "configured",
            timestamp: now,
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
      ],
      stateOwners: [
        {
          id: "owner-inventory",
          serviceId: "srv-inventory",
          stateDomain: "inventory_item",
          stateType: "entity",
          isExclusiveAuthoritativeWriter: true,
          sourceOfTruthId: "sot-postgres",
          associatedCacheLayerIds: ["layer-redis"],
          optimisticConcurrencyField: "version",
          distributedLockConfig: {
            id: "lock-inv",
            name: "Inventory Mutex",
            lockManagerTechnology: "redis_redlock",
            leaseDurationMs: 5000,
            hasFencingToken: true,
            autoRenewal: true,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
          provenance: {
            source: "configured",
            timestamp: now,
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const parsed = DistributedStateTopologySchema.parse(topology);
    expect(parsed.cacheLayers).toHaveLength(2);
    expect(parsed.sourcesOfTruth).toHaveLength(1);
    expect(parsed.replicaGroups).toHaveLength(1);
    expect(parsed.stateOwners).toHaveLength(1);
    expect(parsed.stateOwners[0].distributedLockConfig?.hasFencingToken).toBe(true);
  });
});
