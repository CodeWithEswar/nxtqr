/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Domain Contracts & Type Definitions
 */

export type CacheEvidenceSource =
  | "modeled"      // Architecture assumption
  | "configured"   // Imported or declared configuration
  | "observed"     // Authorized runtime telemetry
  | "simulated"    // Deterministic simulation
  | "unknown";     // Insufficient evidence

export interface CacheStateProvenance {
  source: CacheEvidenceSource;
  sourceIdentifier?: string;
  timestamp: string;
  graphRevision: string;
  confirmed: boolean;
  notes?: string;
}

export type CacheType =
  | "browser_cache"
  | "cdn_cache"
  | "edge_cache"
  | "app_memory_cache"
  | "distributed_cache"
  | "database_query_cache"
  | "object_cache"
  | "custom";

export type CacheProviderTechnology =
  | "redis"
  | "valkey"
  | "memcached"
  | "cloudflare_kv"
  | "cloudflare_cache"
  | "aws_elasticache"
  | "aws_memorydb"
  | "fastly"
  | "browser_native"
  | "in_memory"
  | "custom";

export type CacheStrategy =
  | "cache_aside"
  | "read_through"
  | "write_through"
  | "write_behind"
  | "refresh_ahead"
  | "hybrid";

export type EvictionPolicy =
  | "lru"
  | "lfu"
  | "fifo"
  | "random"
  | "ttl_only"
  | "no_eviction"
  | "custom";

export type TTLPolicyType =
  | "absolute"
  | "sliding"
  | "stale_while_revalidate"
  | "no_expiration"
  | "unknown";

export type InvalidationMechanism =
  | "time_based_ttl"
  | "explicit_api_purge"
  | "event_driven_messaging"
  | "change_data_capture"
  | "versioned_key_rotation"
  | "namespace_purge"
  | "write_synchronous_invalidation";

export type SourceOfTruthType =
  | "primary_relational_database"
  | "distributed_nosql_database"
  | "event_log_stream"
  | "external_saas_api"
  | "authoritative_microservice"
  | "custom";

export type ConsistencyModel =
  | "linearizable"       // Strict real-time order
  | "sequential"         // Total order consistent with individual program order
  | "causal"             // Causally related operations seen in same order
  | "read_after_write"   // Read-your-writes guarantee for client session
  | "monotonic_reads"    // Client never observes older state after seeing newer
  | "bounded_staleness"  // Lag bounded by time T or versions K
  | "eventual"           // Replicas eventually converge
  | "provider_specific"  // Platform-defined guarantee
  | "unknown";

export type ReplicationMode =
  | "synchronous"
  | "asynchronous"
  | "semi_synchronous"
  | "quorum_based"
  | "none";

export type ReplicationTopologyType =
  | "leader_follower"
  | "multi_leader"
  | "leaderless_dynamo"
  | "single_node";

export type ConflictResolutionStrategy =
  | "last_write_wins_timestamp"
  | "version_vector"
  | "optimistic_concurrency_cas"
  | "application_business_merge"
  | "crdt_conflict_free"
  | "manual_operator_intervention";

export type CacheFindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type CacheFindingCategory =
  | "cache_stampede_risk"
  | "cache_penetration_risk"
  | "cache_avalanche_risk"
  | "stale_read_violation"
  | "invalidation_propagation_gap"
  | "invalidation_race_condition"
  | "unbounded_write_behind_data_loss"
  | "missing_tenant_key_collision"
  | "read_after_write_lag_hazard"
  | "monotonic_read_violation"
  | "quorum_inconsistency_hazard"
  | "split_brain_distributed_lock_hazard"
  | "cache_coherence_divergence"
  | "authoritative_source_missing"
  | "unshielded_backend_overload";

export interface CacheProviderCapabilities {
  supportsEvictionConfiguration: boolean;
  supportedEvictionPolicies: EvictionPolicy[];
  supportsSlidingTTL: boolean;
  supportsBackgroundRefresh: boolean;
  supportsAtomicCompareAndSwap: boolean;
  supportsDistributedLocking: boolean;
  supportsPubSubInvalidation: boolean;
  supportsKeyPatternPurge: boolean;
  supportsReplication: boolean;
  supportsMultiRegionActiveActive: boolean;
  maxKeySizeBytes?: number;
  maxValueSizeBytes?: number;
  provenance: CacheStateProvenance;
}

export interface CacheKeySpace {
  id: string;
  name: string;
  namespacePattern: string; // e.g. "tenant:{tenantId}:user:{userId}:profile"
  includesTenantScope: boolean;
  includesEnvironmentScope: boolean;
  includesVersionScope: boolean;
  dataClassification: "public" | "internal" | "confidential" | "restricted";
  estimatedEntrySizeBytes: number;
  estimatedKeyCount: number;
  provenance: CacheStateProvenance;
}

export interface CacheTTLConfig {
  type: TTLPolicyType;
  defaultTtlSeconds: number;
  minTtlSeconds?: number;
  maxTtlSeconds?: number;
  staleWhileRevalidateSeconds?: number;
  jitterPercentage: number; // 0 - 50% to prevent synchronized expiration
  isSynchronizedExpirationRisk: boolean;
}

export interface CacheLayer {
  id: string; // Node ID or cache layer ID
  nodeId?: string;
  name: string;
  cacheType: CacheType;
  technology: CacheProviderTechnology;
  strategy: CacheStrategy;
  tierOrder: number; // 1 = closest to client (e.g. browser), 2 = CDN, 3 = App memory, 4 = Distributed Redis
  regionId?: string;
  evictionPolicy: EvictionPolicy;
  allocatedMemoryMb: number;
  ttlConfig: CacheTTLConfig;
  keySpaces: CacheKeySpace[];
  readHitRatioModeled?: number; // 0.0 - 1.0 (modeled assumption)
  readHitRatioObserved?: number; // 0.0 - 1.0 (telemetry backed)
  fallbackBehavior: "database_direct" | "stale_serve" | "fail_closed" | "fail_open" | "error_response";
  requestCoalescingEnabled: boolean; // Single-flight / lock-on-miss
  negativeCachingEnabled: boolean; // Cache missing/null values to stop penetration
  negativeCacheTtlSeconds?: number;
  provenance: CacheStateProvenance;
}

export interface SourceOfTruth {
  id: string; // Database Node ID
  name: string;
  type: SourceOfTruthType;
  isAuthoritativeMaster: boolean;
  storageEngine?: string;
  provenance: CacheStateProvenance;
}

export interface InvalidationRule {
  id: string;
  name: string;
  targetCacheLayerIds: string[];
  mechanism: InvalidationMechanism;
  triggerEventOrTable: string;
  isAsynchronous: boolean;
  invalidationKeyPattern: string;
  propagationLatencyMsExpected?: number;
  reRefillPolicy: "on_demand_lazy" | "immediate_warmup" | "none";
  provenance: CacheStateProvenance;
}

export interface ReplicaNode {
  id: string;
  name: string;
  regionId: string;
  isLeader: boolean;
  isReadOnly: boolean;
  replicationLagMsModeled?: number;
  replicationLagMsObserved?: number;
  provenance: CacheStateProvenance;
}

export interface ReplicaGroup {
  id: string;
  sourceOfTruthId: string;
  topologyType: ReplicationTopologyType;
  replicationMode: ReplicationMode;
  replicas: ReplicaNode[];
  readQuorumSize?: number;
  writeQuorumSize?: number;
  consistencyModel: ConsistencyModel;
  conflictResolution: ConflictResolutionStrategy;
  provenance: CacheStateProvenance;
}

export interface DistributedLockConfig {
  id: string;
  name: string;
  lockManagerTechnology: "redis_redlock" | "zookeeper" | "etcd" | "database_row" | "custom";
  leaseDurationMs: number;
  hasFencingToken: boolean; // Monotonically increasing token to reject stale lock holders
  autoRenewal: boolean;
  provenance: CacheStateProvenance;
}

export interface StateOwner {
  id: string;
  serviceId: string; // Service Node ID
  stateDomain: string; // e.g. "OrderState", "UserSession", "InventoryLedger"
  stateType: "session" | "workflow" | "entity" | "materialized_projection";
  isExclusiveAuthoritativeWriter: boolean;
  sourceOfTruthId: string;
  associatedCacheLayerIds: string[];
  optimisticConcurrencyField?: string; // e.g. "version" or "updated_at"
  distributedLockConfig?: DistributedLockConfig;
  provenance: CacheStateProvenance;
}

export interface CacheStateFinding {
  id: string;
  category: CacheFindingCategory;
  severity: CacheFindingSeverity;
  affectedCacheLayerId?: string;
  affectedSourceOfTruthId?: string;
  affectedStateOwnerId?: string;
  affectedReplicaGroupId?: string;
  title: string;
  explanation: string;
  evidence: string[];
  riskAnalysis: string;
  remediation: string;
  deterministicCalculation?: {
    metricName: string;
    value: number;
    threshold: number;
    formula: string;
  };
}

export interface CacheStampedeEvaluation {
  layerId: string;
  isStampedeRisk: boolean;
  peakBackendLoadMultiplier: number; // e.g. 5x load spike without coalescing
  vulnerableKeyPatterns: string[];
  explanation: string;
  mitigationsActive: string[];
  missingSafeguards: string[];
}

export interface StaleReadEvaluation {
  layerOrReplicaId: string;
  layerOrReplicaName: string;
  targetDomain: string;
  isStaleReadRisk: boolean;
  maximumStalenessWindowSeconds: number;
  consistencyModel: ConsistencyModel;
  explanation: string;
  riskSeverity: CacheFindingSeverity;
}

export interface CacheCapacityEvaluation {
  layerId: string;
  allocatedMemoryMb: number;
  projectedWorkingSetMb: number;
  isCapacityExhausted: boolean;
  saturationRatio: number; // projected / allocated
  evictionRisk: "none" | "moderate" | "severe_thrashing";
  explanation: string;
}

export interface MultiLayerCacheTraceHop {
  layerId: string;
  layerName: string;
  cacheType: CacheType;
  tierOrder: number;
  hitRatioModeled: number;
  effectiveIncomingRps: number;
  effectiveOutgoingMissRps: number;
}

export interface MultiLayerCachePathTrace {
  id: string;
  flowName: string;
  incomingClientRps: number;
  hops: MultiLayerCacheTraceHop[];
  terminalBackendReadRps: number;
  netOffloadPercentage: number;
  explanation: string;
}

export interface DistributedStateTopology {
  id: string;
  projectId: string;
  architectureId: string;
  graphRevision: string;
  version: number;
  cacheLayers: CacheLayer[];
  sourcesOfTruth: SourceOfTruth[];
  invalidationRules: InvalidationRule[];
  replicaGroups: ReplicaGroup[];
  stateOwners: StateOwner[];
  provenance?: CacheStateProvenance;
  createdAt: string;
  updatedAt: string;
}

