/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Strict Zod Validation Schemas
 */

import { z } from "zod";

export const CacheEvidenceSourceSchema = z.enum([
  "modeled",
  "configured",
  "observed",
  "simulated",
  "unknown",
]);

export const CacheStateProvenanceSchema = z.object({
  source: CacheEvidenceSourceSchema,
  sourceIdentifier: z.string().optional(),
  timestamp: z.string(),
  graphRevision: z.string(),
  confirmed: z.boolean(),
  notes: z.string().optional(),
});

export const CacheTypeSchema = z.enum([
  "browser_cache",
  "cdn_cache",
  "edge_cache",
  "app_memory_cache",
  "distributed_cache",
  "database_query_cache",
  "object_cache",
  "custom",
]);

export const CacheProviderTechnologySchema = z.enum([
  "redis",
  "valkey",
  "memcached",
  "cloudflare_kv",
  "cloudflare_cache",
  "aws_elasticache",
  "aws_memorydb",
  "fastly",
  "browser_native",
  "in_memory",
  "custom",
]);

export const CacheStrategySchema = z.enum([
  "cache_aside",
  "read_through",
  "write_through",
  "write_behind",
  "refresh_ahead",
  "hybrid",
]);

export const EvictionPolicySchema = z.enum([
  "lru",
  "lfu",
  "fifo",
  "random",
  "ttl_only",
  "no_eviction",
  "custom",
]);

export const TTLPolicyTypeSchema = z.enum([
  "absolute",
  "sliding",
  "stale_while_revalidate",
  "no_expiration",
  "unknown",
]);

export const InvalidationMechanismSchema = z.enum([
  "time_based_ttl",
  "explicit_api_purge",
  "event_driven_messaging",
  "change_data_capture",
  "versioned_key_rotation",
  "namespace_purge",
  "write_synchronous_invalidation",
]);

export const SourceOfTruthTypeSchema = z.enum([
  "primary_relational_database",
  "distributed_nosql_database",
  "event_log_stream",
  "external_saas_api",
  "authoritative_microservice",
  "custom",
]);

export const ConsistencyModelSchema = z.enum([
  "linearizable",
  "sequential",
  "causal",
  "read_after_write",
  "monotonic_reads",
  "bounded_staleness",
  "eventual",
  "provider_specific",
  "unknown",
]);

export const ReplicationModeSchema = z.enum([
  "synchronous",
  "asynchronous",
  "semi_synchronous",
  "quorum_based",
  "none",
]);

export const ReplicationTopologyTypeSchema = z.enum([
  "leader_follower",
  "multi_leader",
  "leaderless_dynamo",
  "single_node",
]);

export const ConflictResolutionStrategySchema = z.enum([
  "last_write_wins_timestamp",
  "version_vector",
  "optimistic_concurrency_cas",
  "application_business_merge",
  "crdt_conflict_free",
  "manual_operator_intervention",
]);

export const CacheFindingSeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const CacheFindingCategorySchema = z.enum([
  "cache_stampede_risk",
  "cache_penetration_risk",
  "cache_avalanche_risk",
  "stale_read_violation",
  "invalidation_propagation_gap",
  "invalidation_race_condition",
  "unbounded_write_behind_data_loss",
  "missing_tenant_key_collision",
  "read_after_write_lag_hazard",
  "monotonic_read_violation",
  "quorum_inconsistency_hazard",
  "split_brain_distributed_lock_hazard",
  "cache_coherence_divergence",
  "authoritative_source_missing",
  "unshielded_backend_overload",
]);

export const CacheKeySpaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  namespacePattern: z.string().min(1),
  includesTenantScope: z.boolean(),
  includesEnvironmentScope: z.boolean(),
  includesVersionScope: z.boolean(),
  dataClassification: z.enum(["public", "internal", "confidential", "restricted"]),
  estimatedEntrySizeBytes: z.number().int().min(0),
  estimatedKeyCount: z.number().int().min(0),
  provenance: CacheStateProvenanceSchema,
});

export const CacheTTLConfigSchema = z.object({
  type: TTLPolicyTypeSchema,
  defaultTtlSeconds: z.number().min(0),
  minTtlSeconds: z.number().min(0).optional(),
  maxTtlSeconds: z.number().min(0).optional(),
  staleWhileRevalidateSeconds: z.number().min(0).optional(),
  jitterPercentage: z.number().min(0).max(100),
  isSynchronizedExpirationRisk: z.boolean(),
});

export const CacheLayerSchema = z.object({
  id: z.string().min(1),
  nodeId: z.string().optional(),
  name: z.string().min(1),
  cacheType: CacheTypeSchema,
  technology: CacheProviderTechnologySchema,
  strategy: CacheStrategySchema,
  tierOrder: z.number().int().min(1),
  regionId: z.string().optional(),
  evictionPolicy: EvictionPolicySchema,
  allocatedMemoryMb: z.number().min(0),
  ttlConfig: CacheTTLConfigSchema,
  keySpaces: z.array(CacheKeySpaceSchema),
  readHitRatioModeled: z.number().min(0).max(1).optional(),
  readHitRatioObserved: z.number().min(0).max(1).optional(),
  fallbackBehavior: z.enum([
    "database_direct",
    "stale_serve",
    "fail_closed",
    "fail_open",
    "error_response",
  ]),
  requestCoalescingEnabled: z.boolean(),
  negativeCachingEnabled: z.boolean(),
  negativeCacheTtlSeconds: z.number().min(0).optional(),
  provenance: CacheStateProvenanceSchema,
});

export const SourceOfTruthSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: SourceOfTruthTypeSchema,
  isAuthoritativeMaster: z.boolean(),
  storageEngine: z.string().optional(),
  provenance: CacheStateProvenanceSchema,
});

export const InvalidationRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetCacheLayerIds: z.array(z.string().min(1)),
  mechanism: InvalidationMechanismSchema,
  triggerEventOrTable: z.string().min(1),
  isAsynchronous: z.boolean(),
  invalidationKeyPattern: z.string().min(1),
  propagationLatencyMsExpected: z.number().min(0).optional(),
  reRefillPolicy: z.enum(["on_demand_lazy", "immediate_warmup", "none"]),
  provenance: CacheStateProvenanceSchema,
});

export const ReplicaNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  regionId: z.string().min(1),
  isLeader: z.boolean(),
  isReadOnly: z.boolean(),
  replicationLagMsModeled: z.number().min(0).optional(),
  replicationLagMsObserved: z.number().min(0).optional(),
  provenance: CacheStateProvenanceSchema,
});

export const ReplicaGroupSchema = z.object({
  id: z.string().min(1),
  sourceOfTruthId: z.string().min(1),
  topologyType: ReplicationTopologyTypeSchema,
  replicationMode: ReplicationModeSchema,
  replicas: z.array(ReplicaNodeSchema),
  readQuorumSize: z.number().int().min(1).optional(),
  writeQuorumSize: z.number().int().min(1).optional(),
  consistencyModel: ConsistencyModelSchema,
  conflictResolution: ConflictResolutionStrategySchema,
  provenance: CacheStateProvenanceSchema,
});

export const DistributedLockConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lockManagerTechnology: z.enum([
    "redis_redlock",
    "zookeeper",
    "etcd",
    "database_row",
    "custom",
  ]),
  leaseDurationMs: z.number().int().min(1),
  hasFencingToken: z.boolean(),
  autoRenewal: z.boolean(),
  provenance: CacheStateProvenanceSchema,
});

export const StateOwnerSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  stateDomain: z.string().min(1),
  stateType: z.enum(["session", "workflow", "entity", "materialized_projection"]),
  isExclusiveAuthoritativeWriter: z.boolean(),
  sourceOfTruthId: z.string().min(1),
  associatedCacheLayerIds: z.array(z.string().min(1)),
  optimisticConcurrencyField: z.string().optional(),
  distributedLockConfig: DistributedLockConfigSchema.optional(),
  provenance: CacheStateProvenanceSchema,
});

export const CacheStateFindingSchema = z.object({
  id: z.string().min(1),
  category: CacheFindingCategorySchema,
  severity: CacheFindingSeveritySchema,
  affectedCacheLayerId: z.string().optional(),
  affectedSourceOfTruthId: z.string().optional(),
  affectedStateOwnerId: z.string().optional(),
  affectedReplicaGroupId: z.string().optional(),
  title: z.string().min(1),
  explanation: z.string().min(1),
  evidence: z.array(z.string()),
  riskAnalysis: z.string().min(1),
  remediation: z.string().min(1),
  deterministicCalculation: z
    .object({
      metricName: z.string(),
      value: z.number(),
      threshold: z.number(),
      formula: z.string(),
    })
    .optional(),
});

export const DistributedStateTopologySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  graphRevision: z.string().min(1),
  version: z.number().int().min(1),
  cacheLayers: z.array(CacheLayerSchema),
  sourcesOfTruth: z.array(SourceOfTruthSchema),
  invalidationRules: z.array(InvalidationRuleSchema),
  replicaGroups: z.array(ReplicaGroupSchema),
  stateOwners: z.array(StateOwnerSchema),
  provenance: CacheStateProvenanceSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

