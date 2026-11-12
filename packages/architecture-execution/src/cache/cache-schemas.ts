import { z } from "zod";

// ----------------------------------------------------------------------------
// 1. Cache Entry & Metadata
// ----------------------------------------------------------------------------

export const CacheEntrySchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
  sizeBytes: z.number().int().nonnegative().default(64),
  createdAtMs: z.number().nonnegative().default(0),
  expiresAtMs: z.number().nonnegative().optional(),
  lastAccessedAtMs: z.number().nonnegative().default(0),
  accessCount: z.number().int().nonnegative().default(0),
  insertionSequence: z.number().int().nonnegative().default(0),
  version: z.number().int().nonnegative().default(1),
});
export type CacheEntry = z.infer<typeof CacheEntrySchema>;

// ----------------------------------------------------------------------------
// 2. Capacity Units & Eviction Policies
// ----------------------------------------------------------------------------

export const CapacityUnitSchema = z.enum(["entries", "bytes"]);
export type CapacityUnit = z.infer<typeof CapacityUnitSchema>;

export const EvictionPolicyTypeSchema = z.enum(["lru", "lfu", "fifo", "noeviction"]);
export type EvictionPolicyType = z.infer<typeof EvictionPolicyTypeSchema>;

export const EvictionDecisionSchema = z.object({
  policy: EvictionPolicyTypeSchema,
  victimKey: z.string().nullable(),
  reason: z.string(),
  evaluatedCandidateKeys: z.array(z.string()),
  atMs: z.number(),
});
export type EvictionDecision = z.infer<typeof EvictionDecisionSchema>;

// ----------------------------------------------------------------------------
// 3. Caching Strategies & Consistency Models
// ----------------------------------------------------------------------------

export const CachingStrategySchema = z.enum([
  "cache_aside",
  "read_through",
  "write_through",
  "write_behind",
]);
export type CachingStrategy = z.infer<typeof CachingStrategySchema>;

export const ConsistencyModelSchema = z.enum([
  "eventual",
  "read_your_writes",
  "primary_only",
  "strong",
]);
export type ConsistencyModel = z.infer<typeof ConsistencyModelSchema>;

// ----------------------------------------------------------------------------
// 4. Cache Operations
// ----------------------------------------------------------------------------

export const CacheOperationTypeSchema = z.enum([
  "GET",
  "SET",
  "DELETE",
  "EXPIRE",
  "INVALIDATE",
  "CLEAR",
  "MGET",
]);
export type CacheOperationType = z.infer<typeof CacheOperationTypeSchema>;

export const CacheOperationSchema = z.object({
  id: z.string().min(1),
  type: CacheOperationTypeSchema,
  key: z.string().min(1),
  value: z.unknown().optional(),
  ttlMs: z.number().int().positive().optional(),
  atMs: z.number().nonnegative().default(0),
  clientRequestId: z.string().optional(),
  expectedResult: z.enum(["hit", "miss"]).optional(),
});
export type CacheOperation = z.infer<typeof CacheOperationSchema>;

// ----------------------------------------------------------------------------
// 5. Write-Behind Queue Item
// ----------------------------------------------------------------------------

export interface WriteBehindQueueItem {
  id: string;
  key: string;
  value: unknown;
  queuedAtMs: number;
  flushAtMs: number;
  status: "queued" | "flushed" | "failed" | "lost";
  retryCount: number;
}

// ----------------------------------------------------------------------------
// 6. Request Coalescing (Single-Flight)
// ----------------------------------------------------------------------------

export interface CoalescingGroup {
  key: string;
  leaderRequestId: string;
  waitingRequestIds: string[];
  status: "loading" | "completed" | "failed";
  startedAtMs: number;
  sharedValue?: unknown;
}

// ----------------------------------------------------------------------------
// 7. Distributed Cache Replicas & Topology
// ----------------------------------------------------------------------------

export interface CacheReplicaState {
  replicaId: string;
  primaryNodeId: string;
  entries: Record<string, CacheEntry>;
  lastAppliedVersion: number;
  currentLagMs: number;
  pendingReplicationCount: number;
  status: "healthy" | "lagging" | "unavailable";
}

// ----------------------------------------------------------------------------
// 8. Cache Performance Metrics
// ----------------------------------------------------------------------------

export interface CacheMetrics {
  hitCount: number;
  missCount: number;
  hitRate: number; // 0.0 to 1.0 (hits / (hits + misses))
  missRate: number;
  evictionCount: number;
  expirationCount: number;
  invalidationCount: number;
  databaseReadsCount: number;
  databaseWritesCount: number;
  currentEntriesCount: number;
  currentBytesUsed: number;
  memoryUtilizationPercent: number;
  coalescedRequestsCount: number;
  staleReadsCount: number;
}

// ----------------------------------------------------------------------------
// 9. Full Configuration Contract
// ----------------------------------------------------------------------------

export const CacheConfigurationSchema = z.object({
  capacity: z.number().int().positive().default(100),
  capacityUnit: CapacityUnitSchema.default("entries"),
  evictionPolicy: EvictionPolicyTypeSchema.default("lru"),
  defaultTtlMs: z.number().int().positive().default(60000), // 1 min default
  cachingStrategy: CachingStrategySchema.default("cache_aside"),
  consistencyModel: ConsistencyModelSchema.default("eventual"),
  backingDatabaseNodeId: z.string().default("postgres_db"),
  writeBehindConfig: z
    .object({
      flushIntervalMs: z.number().int().positive().default(200),
      batchSize: z.number().int().positive().default(10),
      maxQueueSize: z.number().int().positive().default(100),
      dropOnFailure: z.boolean().default(true),
    })
    .optional(),
  coalescingConfig: z
    .object({
      enabled: z.boolean().default(false),
      windowMs: z.number().int().nonnegative().default(50),
    })
    .optional(),
  staleWhileRevalidateConfig: z
    .object({
      enabled: z.boolean().default(false),
      staleWindowMs: z.number().int().positive().default(10000),
    })
    .optional(),
  replicationConfig: z
    .object({
      primaryNodeId: z.string().default("cache_primary"),
      replicaNodeIds: z.array(z.string()).default([]),
      replicationDelayMs: z.number().int().nonnegative().default(150),
      readRouting: z.enum(["primary", "replica", "round_robin"]).default("primary"),
    })
    .optional(),
  shardingConfig: z
    .object({
      enabled: z.boolean().default(false),
      shardsCount: z.number().int().positive().default(3),
      hashFunction: z.enum(["fnv1a", "crc32"]).default("fnv1a"),
    })
    .optional(),
});
export type CacheConfiguration = z.infer<typeof CacheConfigurationSchema>;

// ----------------------------------------------------------------------------
// 10. Cache Scenario Specification
// ----------------------------------------------------------------------------

export const CacheScenarioLimitsSchema = z.object({
  maxEntries: z.number().int().positive().default(5000),
  maxEvents: z.number().int().positive().default(5000),
  maxVirtualDurationMs: z.number().int().positive().default(30000),
});
export type CacheScenarioLimits = z.infer<typeof CacheScenarioLimitsSchema>;

export interface CacheScenario {
  version: 1;
  id: string;
  cacheNodeId: string;
  title: string;
  description: string;
  configuration: CacheConfiguration;
  initialEntries: CacheEntry[];
  operations: CacheOperation[];
  limits: CacheScenarioLimits;
}

// ----------------------------------------------------------------------------
// 11. Modeled Cache Runtime State
// ----------------------------------------------------------------------------

export interface ModeledCacheRuntimeState {
  entries: Record<string, CacheEntry>;
  replicas: Record<string, CacheReplicaState>;
  writeBehindQueue: WriteBehindQueueItem[];
  activeCoalescingGroups: Record<string, CoalescingGroup>;
  lastEvictionDecision?: EvictionDecision;
  metrics: CacheMetrics;
  lastOperationResult?: {
    type: string;
    key: string;
    outcome: "hit" | "miss" | "set" | "evicted" | "coalesced" | "stale_read";
    explanation: string;
  };
}

