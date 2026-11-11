"use client";

/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * React Hook for Studio Distributed State & Cache Hierarchy Analysis
 */

import { useState, useMemo, useCallback } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  DistributedStateTopology,
  CacheLayer,
  InvalidationRule,
  architectureCacheStateEngine,
} from "@nxtqr/architecture-intelligence";

export interface UseArchitectureCacheStateProps {
  projectId?: string;
  architectureId?: string;
  graphRevision?: string;
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialTopology?: DistributedStateTopology;
}

export type CacheStateTab =
  | "overview"
  | "layers"
  | "stampede"
  | "consistency"
  | "ownership"
  | "paths"
  | "findings";

export function useArchitectureCacheState(props: UseArchitectureCacheStateProps) {
  const {
    projectId = "default-project",
    architectureId = "default-arch",
    graphRevision = "rev-default",
    nodes: _nodes = [],
    edges: _edges = [],
    initialTopology,
  } = props;

  // Build default fallback topology if none supplied
  const defaultTopology: DistributedStateTopology = useMemo(() => {
    if (initialTopology) return initialTopology;

    const now = new Date().toISOString();
    const cdnId = "layer-edge-cdn";
    const redisId = "layer-redis-cluster";
    const sotId = "sot-pg-primary";

    return {
      id: `topo-state-${architectureId}`,
      projectId,
      architectureId,
      graphRevision,
      version: 1,
      cacheLayers: [
        {
          id: cdnId,
          name: "Global Edge CDN Cache",
          cacheType: "cdn_cache",
          technology: "cloudflare_cache",
          strategy: "read_through",
          tierOrder: 1,
          allocatedMemoryMb: 4096,
          evictionPolicy: "lru",
          ttlConfig: {
            type: "stale_while_revalidate",
            defaultTtlSeconds: 86400,
            jitterPercentage: 15,
            isSynchronizedExpirationRisk: false,
          },
          keySpaces: [
            {
              id: "ks-static-assets",
              name: "Static Content & Media",
              namespacePattern: "static:*",
              includesTenantScope: true,
              includesEnvironmentScope: true,
              includesVersionScope: false,
              dataClassification: "public",
              estimatedEntrySizeBytes: 15000,
              estimatedKeyCount: 100000,
              provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
            },
          ],
          fallbackBehavior: "database_direct",
          requestCoalescingEnabled: true,
          negativeCachingEnabled: true,
          negativeCacheTtlSeconds: 60,
          readHitRatioModeled: 0.85,
          provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
        },
        {
          id: redisId,
          name: "Distributed Entity Redis Cluster",
          cacheType: "distributed_cache",
          technology: "redis",
          strategy: "cache_aside",
          tierOrder: 2,
          allocatedMemoryMb: 16384,
          evictionPolicy: "lru",
          ttlConfig: {
            type: "sliding",
            defaultTtlSeconds: 3600,
            jitterPercentage: 10,
            isSynchronizedExpirationRisk: false,
          },
          keySpaces: [
            {
              id: "ks-user-profiles",
              name: "User Profiles & Workspaces",
              namespacePattern: "tenant:{tenantId}:user:{userId}:profile",
              includesTenantScope: true,
              includesEnvironmentScope: true,
              includesVersionScope: true,
              dataClassification: "internal",
              estimatedEntrySizeBytes: 3072,
              estimatedKeyCount: 500000,
              provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
            },
            {
              id: "ks-catalog",
              name: "Catalog Item Records",
              namespacePattern: "tenant:{tenantId}:catalog:{itemId}",
              includesTenantScope: true,
              includesEnvironmentScope: true,
              includesVersionScope: false,
              dataClassification: "public",
              estimatedEntrySizeBytes: 2048,
              estimatedKeyCount: 250000,
              provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
            },
          ],
          fallbackBehavior: "database_direct",
          requestCoalescingEnabled: true,
          negativeCachingEnabled: true,
          negativeCacheTtlSeconds: 60,
          readHitRatioModeled: 0.9,
          provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      sourcesOfTruth: [
        {
          id: sotId,
          name: "PostgreSQL Primary Cluster",
          type: "primary_relational_database",
          storageEngine: "postgres_16",
          isAuthoritativeMaster: true,
          provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      invalidationRules: [
        {
          id: "inv-pg-redis",
          name: "PostgreSQL Mutation Purge",
          targetCacheLayerIds: [redisId, cdnId],
          triggerEventOrTable: "PostgreSQL Primary Cluster:entities",
          mechanism: "event_driven_messaging",
          isAsynchronous: false,
          invalidationKeyPattern: "tenant:{tenantId}:*",
          propagationLatencyMsExpected: 35,
          reRefillPolicy: "on_demand_lazy",
          provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      replicaGroups: [
        {
          id: "rep-pg-pool",
          sourceOfTruthId: sotId,
          topologyType: "leader_follower",
          replicationMode: "asynchronous",
          readQuorumSize: 2,
          writeQuorumSize: 2,
          consistencyModel: "read_after_write",
          conflictResolution: "optimistic_concurrency_cas",
          replicas: [
            {
              id: "pg-leader",
              name: "pg-primary-writer",
              regionId: "us-east-1",
              isLeader: true,
              isReadOnly: false,
              provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
            },
            {
              id: "pg-reader-1",
              name: "pg-replica-us-east",
              regionId: "us-east-1",
              isLeader: false,
              isReadOnly: true,
              replicationLagMsObserved: 30,
              provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
            },
            {
              id: "pg-reader-2",
              name: "pg-replica-eu-west",
              regionId: "eu-west-1",
              isLeader: false,
              isReadOnly: true,
              replicationLagMsObserved: 120,
              provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
            },
          ],
          provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      stateOwners: [
        {
          id: "owner-catalog-srv",
          serviceId: "srv-catalog",
          stateDomain: "catalog_entity",
          stateType: "entity",
          isExclusiveAuthoritativeWriter: true,
          sourceOfTruthId: sotId,
          associatedCacheLayerIds: [redisId],
          optimisticConcurrencyField: "version",
          distributedLockConfig: {
            id: "lock-catalog",
            name: "Catalog Mutation Mutex",
            lockManagerTechnology: "redis_redlock",
            leaseDurationMs: 5000,
            hasFencingToken: true,
            autoRenewal: true,
            provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
          },
          provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      createdAt: now,
      updatedAt: now,
      provenance: { source: "configured", timestamp: now, graphRevision, confirmed: true },
    };
  }, [architectureId, graphRevision, initialTopology, projectId]);

  // Topology state
  const [topology, setTopology] = useState<DistributedStateTopology>(defaultTopology);
  const [activeTab, setActiveTab] = useState<CacheStateTab>("overview");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    defaultTopology.cacheLayers[0]?.id ?? null
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(
    defaultTopology.sourcesOfTruth[0]?.id ?? null
  );
  const [selectedReplicaGroupId, setSelectedReplicaGroupId] = useState<string | null>(
    defaultTopology.replicaGroups[0]?.id ?? null
  );
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(
    defaultTopology.stateOwners[0]?.id ?? null
  );

  // Simulation controls
  const [simulatedIncomingRps, setSimulatedIncomingRps] = useState<number>(5000);
  const [simulatedStampedeFailureRate, setSimulatedStampedeFailureRate] = useState<number>(0.05);

  // Run intelligence analysis
  const analysis = useMemo(() => {
    return architectureCacheStateEngine.analyzeTopology(topology);
  }, [topology]);

  const selectedLayer = useMemo(() => {
    return topology.cacheLayers.find((l) => l.id === selectedLayerId) || null;
  }, [topology.cacheLayers, selectedLayerId]);

  const selectedSource = useMemo(() => {
    return topology.sourcesOfTruth.find((s) => s.id === selectedSourceId) || null;
  }, [topology.sourcesOfTruth, selectedSourceId]);

  const selectedReplicaGroup = useMemo(() => {
    return topology.replicaGroups.find((r) => r.id === selectedReplicaGroupId) || null;
  }, [topology.replicaGroups, selectedReplicaGroupId]);

  const selectedOwner = useMemo(() => {
    return topology.stateOwners.find((o) => o.id === selectedOwnerId) || null;
  }, [topology.stateOwners, selectedOwnerId]);

  // Mutators
  const updateCacheLayer = useCallback((layerId: string, patch: Partial<CacheLayer>) => {
    setTopology((prev) => ({
      ...prev,
      cacheLayers: prev.cacheLayers.map((l) => (l.id === layerId ? { ...l, ...patch } : l)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addCacheLayer = useCallback((newLayer: CacheLayer) => {
    setTopology((prev) => ({
      ...prev,
      cacheLayers: [...prev.cacheLayers, newLayer],
      updatedAt: new Date().toISOString(),
    }));
    setSelectedLayerId(newLayer.id);
  }, []);

  const removeCacheLayer = useCallback((layerId: string) => {
    setTopology((prev) => ({
      ...prev,
      cacheLayers: prev.cacheLayers.filter((l) => l.id !== layerId),
      updatedAt: new Date().toISOString(),
    }));
    setSelectedLayerId((prev) => (prev === layerId ? null : prev));
  }, []);

  const addInvalidationRule = useCallback((newRule: InvalidationRule) => {
    setTopology((prev) => ({
      ...prev,
      invalidationRules: [...prev.invalidationRules, newRule],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const resetTopology = useCallback(() => {
    setTopology(defaultTopology);
  }, [defaultTopology]);

  return {
    topology,
    activeTab,
    setActiveTab,
    selectedLayerId,
    setSelectedLayerId,
    selectedLayer,
    selectedSourceId,
    setSelectedSourceId,
    selectedSource,
    selectedReplicaGroupId,
    setSelectedReplicaGroupId,
    selectedReplicaGroup,
    selectedOwnerId,
    setSelectedOwnerId,
    selectedOwner,
    simulatedIncomingRps,
    setSimulatedIncomingRps,
    simulatedStampedeFailureRate,
    setSimulatedStampedeFailureRate,
    analysis,
    updateCacheLayer,
    addCacheLayer,
    removeCacheLayer,
    addInvalidationRule,
    resetTopology,
  };
}
