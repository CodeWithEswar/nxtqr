import { describe, it, expect } from "vitest";
import { InvalidationAnalyzer } from "../cache-state/analysis/invalidation-analyzer";
import { StampedeAnalyzer } from "../cache-state/analysis/stampede-analyzer";
import { CapacityAnalyzer } from "../cache-state/analysis/capacity-analyzer";
import type { DistributedStateTopology } from "../cache-state/contracts/cache-state.types";

describe("Phase 05.3.22: Cache Invalidation, Stampede & Capacity Analyzers", () => {
  const now = new Date().toISOString();

  const baseTopology: DistributedStateTopology = {
    id: "topo-policies-1",
    projectId: "proj-1",
    architectureId: "arch-1",
    graphRevision: "rev-1",
    version: 1,
    cacheLayers: [
      {
        id: "layer-edge",
        name: "Edge CDN",
        cacheType: "cdn_cache",
        technology: "cloudflare_cache",
        strategy: "read_through",
        tierOrder: 1,
        allocatedMemoryMb: 512,
        evictionPolicy: "lru",
        ttlConfig: {
          type: "absolute",
          defaultTtlSeconds: 3600,
          jitterPercentage: 0, // synchronized TTL avalanche risk!
          isSynchronizedExpirationRisk: true,
        },
        keySpaces: [
          {
            id: "ks-edge-catalog",
            name: "Catalog Edge Cache",
            namespacePattern: "catalog:*",
            includesTenantScope: true,
            includesEnvironmentScope: true,
            includesVersionScope: false,
            dataClassification: "public",
            estimatedEntrySizeBytes: 10240,
            estimatedKeyCount: 10000,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        ],
        fallbackBehavior: "database_direct",
        requestCoalescingEnabled: false, // Stampede risk!
        negativeCachingEnabled: false, // Penetration risk!
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
      {
        id: "layer-redis",
        name: "Redis Master",
        cacheType: "distributed_cache",
        technology: "redis",
        strategy: "cache_aside",
        tierOrder: 2,
        allocatedMemoryMb: 256,
        evictionPolicy: "no_eviction", // Fatal OOM risk when working set exceeds 256MB!
        ttlConfig: {
          type: "absolute",
          defaultTtlSeconds: 1800,
          jitterPercentage: 0,
          isSynchronizedExpirationRisk: true,
        },
        keySpaces: [
          {
            id: "ks-tenant-leak",
            name: "Account Entities",
            namespacePattern: "accounts:{accountId}", // Missing tenant isolation!
            includesTenantScope: false, // Multi-tenant collision risk!
            includesEnvironmentScope: true,
            includesVersionScope: false,
            dataClassification: "restricted",
            estimatedEntrySizeBytes: 2048,
            estimatedKeyCount: 200000, // 200k * 2KB = 400MB + 15% = 460MB > 256MB!
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        ],
        fallbackBehavior: "database_direct",
        requestCoalescingEnabled: false,
        negativeCachingEnabled: false,
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    sourcesOfTruth: [
      {
        id: "sot-db",
        name: "PostgreSQL Production",
        type: "primary_relational_database",
        isAuthoritativeMaster: true,
        storageEngine: "postgres_16",
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    // Only invalidates Redis (tier 2), leaving CDN (tier 1) omitted!
    invalidationRules: [
      {
        id: "inv-db-redis",
        name: "PostgreSQL Production Mutation Purge",
        targetCacheLayerIds: ["layer-redis"], // layer-edge omitted!
        triggerEventOrTable: "PostgreSQL Production:accounts",
        mechanism: "event_driven_messaging",
        isAsynchronous: true, // Race condition risk!
        invalidationKeyPattern: "accounts:*",
        propagationLatencyMsExpected: 250,
        reRefillPolicy: "on_demand_lazy",
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    replicaGroups: [],
    stateOwners: [],
    createdAt: now,
    updatedAt: now,
    provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
  };

  it("detects multi-tier invalidation propagation gaps where upstream CDN is omitted", () => {
    const { findings, uncoveredLayersByRule } = InvalidationAnalyzer.analyze(baseTopology);

    const gapFinding = findings.find((f) => f.category === "invalidation_propagation_gap");
    expect(gapFinding).toBeDefined();
    expect(gapFinding?.severity).toBe("high");
    expect(gapFinding?.title).toContain("Upstream Invalidation Propagation Gap");

    expect(uncoveredLayersByRule["inv-db-redis"]).toBeDefined();
    expect(uncoveredLayersByRule["inv-db-redis"]).toContain("Edge CDN");
  });

  it("detects missing single-flight coalescing and stampede risks", () => {
    const { evaluations, findings } = StampedeAnalyzer.analyze(baseTopology);

    const stampedeFindings = findings.filter((f) => f.category === "cache_stampede_risk");
    expect(stampedeFindings.length).toBeGreaterThan(0);
    const finding = stampedeFindings.find((f) => f.title.includes("Cache Stampede Vulnerability"));
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("high");

    const edgeEval = evaluations.find((e) => e.layerId === "layer-edge");
    expect(edgeEval).toBeDefined();
    expect(edgeEval?.isStampedeRisk).toBe(true);
    expect(edgeEval?.peakBackendLoadMultiplier).toBeGreaterThan(5);
  });

  it("detects TTL avalanche hazards when jitter is absent", () => {
    const { findings } = StampedeAnalyzer.analyze(baseTopology);

    const avalancheFinding = findings.find((f) => f.category === "cache_avalanche_risk");
    expect(avalancheFinding).toBeDefined();
    expect(avalancheFinding?.title).toContain("Cache Avalanche Risk");
    expect(avalancheFinding?.explanation).toContain("jitter");
  });

  it("detects cache penetration risk when negative caching is missing", () => {
    const { findings } = StampedeAnalyzer.analyze(baseTopology);

    const penetrationFinding = findings.find((f) => f.category === "cache_penetration_risk");
    expect(penetrationFinding).toBeDefined();
    expect(penetrationFinding?.severity).toBe("medium");
  });

  it("detects multi-tenant key namespace collisions", () => {
    const { findings } = StampedeAnalyzer.analyze(baseTopology);

    const collisionFinding = findings.find((f) => f.category === "missing_tenant_key_collision");
    expect(collisionFinding).toBeDefined();
    expect(collisionFinding?.severity).toBe("critical");
    expect(collisionFinding?.title).toContain("Multi-Tenant Key Collision Hazard");
  });

  it("detects fatal OOM crash hazard on no_eviction policy when working set exceeds memory", () => {
    const { evaluations, findings } = CapacityAnalyzer.analyze(baseTopology);

    const oomFinding = findings.find((f) => f.title.includes("Fatal Out-Of-Memory Crash Risk"));
    expect(oomFinding).toBeDefined();
    expect(oomFinding?.severity).toBe("critical");
    expect(oomFinding?.explanation).toContain("no_eviction");

    const redisEval = evaluations.find((e) => e.layerId === "layer-redis");
    expect(redisEval).toBeDefined();
    expect(redisEval?.isCapacityExhausted).toBe(true);
    expect(redisEval?.projectedWorkingSetMb).toBeGreaterThan(redisEval?.allocatedMemoryMb ?? 0);
  });
});
