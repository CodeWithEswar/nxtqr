import { describe, it, expect } from "vitest";
import { StaleReadAnalyzer } from "../cache-state/analysis/stale-read-analyzer";
import { ReplicationConsistencyAnalyzer } from "../cache-state/analysis/replication-consistency-analyzer";
import { StateCorrectnessAnalyzer } from "../cache-state/analysis/state-correctness-analyzer";
import { LockSafetyAnalyzer } from "../cache-state/analysis/lock-safety-analyzer";
import type { DistributedStateTopology } from "../cache-state/contracts/cache-state.types";

describe("Phase 05.3.22: Caching, Replication & State Consistency Analyzers", () => {
  const now = new Date().toISOString();

  const consistencyTopology: DistributedStateTopology = {
    id: "topo-consistency-1",
    projectId: "proj-1",
    architectureId: "arch-1",
    graphRevision: "rev-1",
    version: 1,
    cacheLayers: [
      {
        id: "layer-write-behind",
        name: "Write-Behind Ingestion Buffer",
        cacheType: "distributed_cache",
        technology: "redis",
        strategy: "write_behind", // Durability loss hazard!
        tierOrder: 1,
        allocatedMemoryMb: 2048,
        evictionPolicy: "lru",
        ttlConfig: {
          type: "stale_while_revalidate",
          defaultTtlSeconds: 7200, // Long TTL on restricted data!
          jitterPercentage: 5,
          isSynchronizedExpirationRisk: false,
        },
        keySpaces: [
          {
            id: "ks-financial",
            name: "Ledger State",
            namespacePattern: "tenant:{tenantId}:ledger:{accountId}",
            includesTenantScope: true,
            includesEnvironmentScope: true,
            includesVersionScope: true,
            dataClassification: "restricted", // Restricted classification!
            estimatedEntrySizeBytes: 1024,
            estimatedKeyCount: 50000,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        ],
        fallbackBehavior: "database_direct",
        requestCoalescingEnabled: true,
        negativeCachingEnabled: true,
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    sourcesOfTruth: [
      {
        id: "sot-aurora",
        name: "Aurora PostgreSQL Cluster",
        type: "primary_relational_database",
        storageEngine: "aurora_postgres",
        isAuthoritativeMaster: true,
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    invalidationRules: [],
    replicaGroups: [
      {
        id: "rep-quorum-group",
        sourceOfTruthId: "sot-aurora",
        topologyType: "multi_leader", // Multi-leader LWW risk!
        replicationMode: "quorum_based",
        readQuorumSize: 2,
        writeQuorumSize: 2, // 2 + 2 = 4 <= 5 -> Quorum violation!
        consistencyModel: "eventual",
        conflictResolution: "last_write_wins_timestamp", // LWW silent conflict risk!
        replicas: [
          {
            id: "n1",
            name: "node-1",
            regionId: "us-east-1",
            isLeader: true,
            isReadOnly: false,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
          {
            id: "n2",
            name: "node-2",
            regionId: "us-east-1",
            isLeader: false,
            isReadOnly: true,
            replicationLagMsModeled: 250,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
          {
            id: "n3",
            name: "node-3",
            regionId: "us-east-1",
            isLeader: false,
            isReadOnly: true,
            replicationLagMsModeled: 300,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
          {
            id: "n4",
            name: "node-4",
            regionId: "us-east-1",
            isLeader: false,
            isReadOnly: true,
            replicationLagMsModeled: 150,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
          {
            id: "n5",
            name: "node-5",
            regionId: "us-east-1",
            isLeader: false,
            isReadOnly: true,
            replicationLagMsModeled: 180,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        ],
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
      {
        id: "rep-async-group",
        sourceOfTruthId: "sot-aurora",
        topologyType: "leader_follower",
        replicationMode: "asynchronous",
        consistencyModel: "eventual",
        conflictResolution: "optimistic_concurrency_cas",
        replicas: [
          {
            id: "rep-a1",
            name: "leader",
            regionId: "us-east-1",
            isLeader: true,
            isReadOnly: false,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
          {
            id: "rep-a2",
            name: "follower",
            regionId: "us-east-1",
            isLeader: false,
            isReadOnly: true,
            replicationLagMsObserved: 450,
            provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        ],
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    stateOwners: [
      {
        id: "owner-writer-1",
        serviceId: "srv-orders-v1",
        stateDomain: "customer_balance",
        stateType: "entity",
        isExclusiveAuthoritativeWriter: false, // Multiple writers on customer_balance!
        sourceOfTruthId: "sot-aurora",
        associatedCacheLayerIds: [],
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
      {
        id: "owner-writer-2",
        serviceId: "srv-orders-v2",
        stateDomain: "customer_balance",
        stateType: "entity",
        isExclusiveAuthoritativeWriter: false,
        sourceOfTruthId: "sot-aurora",
        associatedCacheLayerIds: [],
        distributedLockConfig: {
          id: "lock-cb",
          name: "Customer Balance Lock",
          lockManagerTechnology: "redis_redlock",
          leaseDurationMs: 500, // Short lease duration without fencing token!
          hasFencingToken: false, // Martin Kleppmann Redlock hazard!
          autoRenewal: false,
          provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
        },
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    createdAt: now,
    updatedAt: now,
    provenance: { source: "configured", timestamp: now, graphRevision: "rev-1", confirmed: true },
  };

  it("detects excessive stale read windows on critical key spaces", () => {
    const { evaluations, findings } = StaleReadAnalyzer.analyze(consistencyTopology);

    const staleFindings = findings.filter((f) => f.category === "stale_read_violation");
    expect(staleFindings.length).toBeGreaterThan(0);
    expect(staleFindings.some((f) => f.title.includes("Excessive Stale-Read Window"))).toBe(true);

    const evalRes = evaluations.find((e) => e.layerOrReplicaId === "layer-write-behind");
    expect(evalRes).toBeDefined();
    expect(evalRes?.isStaleReadRisk).toBe(true);
    expect(evalRes?.maximumStalenessWindowSeconds).toBe(7200);
  });

  it("detects read-after-write consistency gap on async read replicas", () => {
    const { findings } = StaleReadAnalyzer.analyze(consistencyTopology);

    const rawFinding = findings.find((f) => f.category === "read_after_write_lag_hazard");
    expect(rawFinding).toBeDefined();
    expect(rawFinding?.severity).toBe("high");
    expect(rawFinding?.title).toContain("Read-After-Write Consistency Hazard");
  });

  it("detects quorum overlap failure when R + W <= N", () => {
    const findings = ReplicationConsistencyAnalyzer.analyze(consistencyTopology);

    const quorumFinding = findings.find((f) => f.category === "quorum_inconsistency_hazard");
    expect(quorumFinding).toBeDefined();
    expect(quorumFinding?.severity).toBe("critical");
    expect(quorumFinding?.explanation).toContain("R=2 and Write Quorum W=2 across N=5");
  });

  it("detects silent data loss hazards in multi-leader Last-Write-Wins topologies", () => {
    const findings = ReplicationConsistencyAnalyzer.analyze(consistencyTopology);

    const lwwFinding = findings.find((f) => f.title.includes("Last-Write-Wins (LWW)"));
    expect(lwwFinding).toBeDefined();
    expect(lwwFinding?.severity).toBe("high");
    expect(lwwFinding?.remediation).toContain("CRDT");
  });

  it("detects uncoordinated concurrent writers and missing concurrency control", () => {
    const findings = StateCorrectnessAnalyzer.analyze(consistencyTopology);

    const writerFinding = findings.find((f) => f.title.includes("Uncoordinated Multiple Writers"));
    expect(writerFinding).toBeDefined();
    expect(writerFinding?.severity).toBe("critical");
    expect(writerFinding?.explanation).toContain("customer_balance");

    const occFinding = findings.find((f) => f.title.includes("Missing Optimistic Concurrency Control"));
    expect(occFinding).toBeDefined();
  });

  it("detects write-behind cache durability loss hazards", () => {
    const findings = StateCorrectnessAnalyzer.analyze(consistencyTopology);

    const writeBehindFinding = findings.find((f) => f.category === "unbounded_write_behind_data_loss");
    expect(writeBehindFinding).toBeDefined();
    expect(writeBehindFinding?.severity).toBe("high");
    expect(writeBehindFinding?.title).toContain("Write-Behind Asynchronous Durability Exposure");
  });

  it("detects Martin Kleppmann Redlock fencing token hazards", () => {
    const findings = LockSafetyAnalyzer.analyze(consistencyTopology);

    const lockFinding = findings.find((f) => f.title.includes("Lacks Fencing Token"));
    expect(lockFinding).toBeDefined();
    expect(lockFinding?.severity).toBe("critical");
    expect(lockFinding?.explanation).toContain("Martin Kleppmann");
    expect(lockFinding?.remediation).toContain("fencing token");

    const shortLeaseFinding = findings.find((f) => f.title.includes("Short Lease Duration"));
    expect(shortLeaseFinding).toBeDefined();
  });
});
