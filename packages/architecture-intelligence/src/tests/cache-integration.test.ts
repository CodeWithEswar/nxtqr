import { describe, it, expect } from "vitest";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import { architectureReportEngine } from "../reports/engine/report-engine";
import type { DistributedStateTopology } from "../cache-state/contracts/cache-state.types";
import { ReportExportCoordinator } from "../reports/exporters";

describe("Phase 05.3.22: Cross-Engine Integration (Assistant Tool #25 & Reports)", () => {
  const now = new Date().toISOString();

  const testTopology: DistributedStateTopology = {
    id: "topo-int-cache",
    projectId: "proj-int-cache",
    architectureId: "arch-int-cache",
    graphRevision: "rev-int-1",
    version: 1,
    cacheLayers: [
      {
        id: "layer-int-redis",
        name: "Production Redis Cluster",
        cacheType: "distributed_cache",
        technology: "redis",
        strategy: "cache_aside",
        tierOrder: 1,
        allocatedMemoryMb: 8192,
        evictionPolicy: "lru",
        ttlConfig: {
          type: "absolute",
          defaultTtlSeconds: 3600,
          jitterPercentage: 10,
          isSynchronizedExpirationRisk: false,
        },
        keySpaces: [
          {
            id: "ks-user-profiles",
            name: "User Profiles",
            namespacePattern: "tenant:{tenantId}:users:{userId}",
            includesTenantScope: true,
            includesEnvironmentScope: true,
            includesVersionScope: false,
            dataClassification: "internal",
            estimatedEntrySizeBytes: 4096,
            estimatedKeyCount: 500000,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
          },
        ],
        fallbackBehavior: "database_direct",
        requestCoalescingEnabled: true,
        negativeCachingEnabled: true,
        negativeCacheTtlSeconds: 60,
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
      },
    ],
    sourcesOfTruth: [
      {
        id: "sot-int-pg",
        name: "Enterprise Postgres Master",
        type: "primary_relational_database",
        storageEngine: "postgres_16",
        isAuthoritativeMaster: true,
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
      },
    ],
    invalidationRules: [
      {
        id: "inv-rule-user",
        name: "User Mutation Purge",
        targetCacheLayerIds: ["layer-int-redis"],
        triggerEventOrTable: "Enterprise Postgres Master:users",
        mechanism: "event_driven_messaging",
        isAsynchronous: false,
        invalidationKeyPattern: "tenant:{tenantId}:users:{userId}",
        propagationLatencyMsExpected: 40,
        reRefillPolicy: "on_demand_lazy",
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
      },
    ],
    replicaGroups: [
      {
        id: "rep-pg-readers",
        sourceOfTruthId: "sot-int-pg",
        topologyType: "leader_follower",
        replicationMode: "asynchronous",
        readQuorumSize: 2,
        writeQuorumSize: 2,
        consistencyModel: "read_after_write",
        conflictResolution: "optimistic_concurrency_cas",
        replicas: [
          {
            id: "n-leader",
            name: "primary-writer",
            regionId: "us-east-1",
            isLeader: true,
            isReadOnly: false,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
          },
          {
            id: "n-follower-1",
            name: "reader-1",
            regionId: "us-east-1",
            isLeader: false,
            isReadOnly: true,
            replicationLagMsObserved: 45,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
          },
        ],
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
      },
    ],
    stateOwners: [
      {
        id: "owner-user-srv",
        serviceId: "srv-user-service",
        stateDomain: "user_account",
        stateType: "entity",
        isExclusiveAuthoritativeWriter: true,
        sourceOfTruthId: "sot-int-pg",
        associatedCacheLayerIds: ["layer-int-redis"],
        optimisticConcurrencyField: "version",
        distributedLockConfig: {
          id: "lock-user",
          name: "User Account Mutex",
          lockManagerTechnology: "redis_redlock",
          leaseDurationMs: 5000,
          hasFencingToken: true,
          autoRenewal: true,
          provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
        },
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
      },
    ],
    createdAt: now,
    updatedAt: now,
    provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
  };

  it("executes AI Assistant Tool #25 (get_caching_and_state_consistency)", async () => {
    const tool = architectureToolRegistry.getTool("get_caching_and_state_consistency");
    expect(tool).toBeDefined();

    const result = (await tool!.execute(
      {
        includeStampedeAnalysis: true,
        includeStaleReads: true,
        includeReplicationConsistency: true,
        includeLockSafety: true,
        includeCachePaths: true,
      },
      {
        projectId: "proj-int-cache",
        architectureId: "arch-int-cache",
        graphRevision: "rev-int-1",
        nodes: [
          { id: "srv-user-service", type: "service", data: { label: "User Service" }, position: { x: 0, y: 0 } },
        ],
        edges: [],
        cacheTopology: testTopology,
      }
    )) as Record<string, unknown>;

    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    const summary = result.summary as { cacheLayerCount: number; sourceOfTruthCount: number };
    expect(summary.cacheLayerCount).toBe(1);
    expect(summary.sourceOfTruthCount).toBe(1);
  });

  it("composes Architecture Report with caching_and_state section and exports to markdown and html", async () => {
    const report = architectureReportEngine.generateReport({
      projectId: "proj-int-cache",
      architectureId: "arch-int-cache",
      graphRevision: "rev-int-1",
      title: "Cache Hierarchy & Consistency Review",
      audience: "engineering",
      author: "Principal Systems Architect",
      nodes: [
        { id: "srv-user-service", type: "service", data: { label: "User Service" }, position: { x: 0, y: 0 } },
      ],
      edges: [],
      enabledSections: ["overview", "caching_and_state", "adrs"],
      analysisContext: {
        cacheTopology: testTopology,
      },
    });

    const cacheSec = report.sections.find((s) => s.kind === "caching_and_state");
    expect(cacheSec).toBeDefined();

    // Export to Markdown
    const mdResult = ReportExportCoordinator.exportReport(report, { format: "markdown" });
    const markdown = typeof mdResult.content === "string" ? mdResult.content : "";
    expect(markdown).toContain("Production Redis Cluster");
    expect(markdown).toContain("Enterprise Postgres Master");
    expect(markdown).toContain("Architecture Caching, Data Consistency & State Management Intelligence");

    // Export to HTML
    const htmlResult = ReportExportCoordinator.exportReport(report, { format: "html" });
    const html = typeof htmlResult.content === "string" ? htmlResult.content : "";
    expect(html).toContain("Production Redis Cluster");
    expect(html).toContain("Cache Hierarchy Layers");
    expect(html).toContain("Sources of Truth & Data Stores");
  });
});
