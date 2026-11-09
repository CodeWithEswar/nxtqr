import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — Redis Cache
export const RedisCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("redis-cache"),
  deploymentMode: z
    .enum(["standalone", "sentinel-ha", "redis-cluster", "managed-cloud"])
    .default("redis-cluster"),
  primaryDataStructure: z
    .enum([
      "strings-and-hashes",
      "lists-and-sets",
      "sorted-sets-zset",
      "streams",
      "hyperloglog-bitmaps",
      "json-modules",
    ])
    .default("strings-and-hashes"),
  memoryAllocationMb: z.number().int().min(64).max(1048576).default(8192),
  maxmemoryPolicy: z
    .enum([
      "allkeys-lru",
      "volatile-lru",
      "allkeys-lfu",
      "volatile-lfu",
      "allkeys-random",
      "volatile-ttl",
      "noeviction",
    ])
    .default("allkeys-lru"),
  persistenceMode: z
    .enum(["rdb-snapshots", "aof-everysec", "rdb-and-aof", "disabled-in-memory"])
    .default("rdb-and-aof"),
  defaultTtlSeconds: z.number().int().min(0).max(31536000).default(3600),
  replicationMode: z
    .enum(["async-primary-replica", "multi-az-sync", "none"])
    .default("async-primary-replica"),
  highAvailability: z.boolean().default(true),
  maxConnections: z.number().int().min(50).max(100000).default(10000),
  assumedOpsPerSec: z.number().int().min(100).max(2000000).default(75000),
});
export type RedisCacheConfig = z.infer<typeof RedisCacheConfigSchema>;

// 02 — Memcached Cache
export const MemcachedCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("memcached-cache"),
  nodeCount: z.number().int().min(1).max(64).default(3),
  memoryPerNodeMb: z.number().int().min(64).max(524288).default(4096),
  keyDistributionStrategy: z
    .enum(["consistent-ketama", "modulo-hash", "client-rendezvous"])
    .default("consistent-ketama"),
  defaultTtlSeconds: z.number().int().min(0).max(2592000).default(1800),
  evictionPolicy: z
    .enum(["slab-lru", "slab-automove", "no-eviction-oom"])
    .default("slab-lru"),
  maxConnections: z.number().int().min(50).max(65535).default(4096),
  itemSizeLimitKb: z.number().int().min(64).max(10240).default(1024),
  threadCount: z.number().int().min(1).max(64).default(8),
  assumedOpsPerSec: z.number().int().min(100).max(2000000).default(100000),
});
export type MemcachedCacheConfig = z.infer<typeof MemcachedCacheConfigSchema>;

// 03 — Application Cache
export const ApplicationCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("application-cache"),
  cacheScope: z
    .enum(["in-process-heap", "off-heap-memory", "local-disk-ssd", "hybrid-tiered"])
    .default("in-process-heap"),
  cacheKeyStrategy: z
    .enum([
      "hash-code-keyed",
      "method-signature-annotated",
      "composite-canonical-key",
      "uuid-identifier",
    ])
    .default("composite-canonical-key"),
  defaultTtlSeconds: z.number().int().min(0).max(86400).default(600),
  evictionPolicy: z.enum(["lru", "lfu", "fifo", "time-based-soft"]).default("lru"),
  invalidationStrategy: z
    .enum([
      "ttl-expiration",
      "event-driven-bus",
      "explicit-programmatic",
      "write-intercept",
    ])
    .default("event-driven-bus"),
  maxEntries: z.number().int().min(100).max(10000000).default(50000),
  threadSafetyModel: z
    .enum([
      "concurrent-hash-map",
      "read-write-lock",
      "actor-isolated",
      "single-threaded-loop",
    ])
    .default("concurrent-hash-map"),
  memoryBudgetMb: z.number().int().min(16).max(65536).default(1024),
  assumedHitRatioPercent: z.number().min(0).max(100).default(85),
});
export type ApplicationCacheConfig = z.infer<typeof ApplicationCacheConfigSchema>;

// 04 — Distributed Cache
export const DistributedCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("distributed-cache"),
  topology: z
    .enum([
      "consistent-hash-ring",
      "replicated-mesh",
      "near-cache-two-tier",
      "partitioned-sharded",
    ])
    .default("consistent-hash-ring"),
  clusterNodeCount: z.number().int().min(2).max(128).default(6),
  partitioningStrategy: z
    .enum(["ketama-vnodes", "murmur3-ranges", "rendezvous-hrw"])
    .default("ketama-vnodes"),
  replicationFactor: z.number().int().min(1).max(7).default(2),
  consistencyModel: z
    .enum([
      "eventual-consistency",
      "read-your-writes",
      "quorum-w-r",
      "linearizable-strong",
    ])
    .default("eventual-consistency"),
  coherenceProtocol: z
    .enum([
      "invalidation-broadcast",
      "gossip-consensus",
      "write-invalidate-bus",
      "read-repair",
    ])
    .default("invalidation-broadcast"),
  failureHandling: z
    .enum(["automatic-rebalance", "graceful-degrade", "circuit-breaker-fallback"])
    .default("automatic-rebalance"),
  defaultTtlSeconds: z.number().int().min(0).max(2592000).default(7200),
  evictionPolicy: z
    .enum(["distributed-lru", "sampled-lfu", "size-bounded-ttl"])
    .default("distributed-lru"),
  assumedThroughputRps: z.number().int().min(500).max(1000000).default(120000),
});
export type DistributedCacheConfig = z.infer<typeof DistributedCacheConfigSchema>;

// 05 — Session Cache
export const SessionCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("session-cache"),
  storageModel: z
    .enum([
      "in-memory-key-value",
      "sticky-cookie-backed",
      "replicated-session-cluster",
      "hybrid-token-store",
    ])
    .default("in-memory-key-value"),
  sessionTtlMinutes: z.number().int().min(1).max(43200).default(120),
  slidingExpiration: z.boolean().default(true),
  sessionKeyStrategy: z
    .enum(["cryptographic-uuid-v4", "opaque-token-hash", "jwt-jti-keyed"])
    .default("opaque-token-hash"),
  revocationBehavior: z
    .enum(["immediate-delete", "blacklist-tombstone", "graceful-token-expiry"])
    .default("immediate-delete"),
  replicationAcrossAz: z.boolean().default(true),
  encryptionAtRest: z.boolean().default(true),
  maxActiveSessionsAssumption: z.number().int().min(100).max(5000000).default(100000),
  compressionEnabled: z.boolean().default(false),
});
export type SessionCacheConfig = z.infer<typeof SessionCacheConfigSchema>;

// 06 — Query Cache
export const QueryCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("query-cache"),
  queryScope: z
    .enum([
      "database-level",
      "orm-second-level",
      "graphql-field-level",
      "api-gateway-edge",
    ])
    .default("orm-second-level"),
  cacheKeyGeneration: z
    .enum(["sql-hash-digest", "ast-normalized-hash", "parameterized-signature"])
    .default("ast-normalized-hash"),
  defaultTtlSeconds: z.number().int().min(1).max(86400).default(300),
  invalidationStrategy: z
    .enum([
      "table-mutation-hook",
      "cdc-debezium-stream",
      "time-to-live-only",
      "tag-based-selective",
    ])
    .default("table-mutation-hook"),
  maxResultSizeKb: z.number().int().min(1).max(102400).default(512),
  storageBackend: z
    .enum(["in-memory-redis", "application-heap", "shared-memcached"])
    .default("in-memory-redis"),
  consistencyExpectation: z
    .enum([
      "eventual-read-skew-tolerated",
      "strict-snapshot-matching",
      "stale-while-revalidate",
    ])
    .default("stale-while-revalidate"),
  assumedHitRatePercent: z.number().min(0).max(100).default(75),
});
export type QueryCacheConfig = z.infer<typeof QueryCacheConfigSchema>;

// 07 — Read-Through Cache
export const ReadThroughCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("read-through-cache"),
  backingDataSourceType: z
    .enum([
      "postgresql-database",
      "mysql-database",
      "document-store",
      "rest-microservice",
      "distributed-sql",
    ])
    .default("postgresql-database"),
  cacheMissBehavior: z
    .enum([
      "synchronous-loader-fetch",
      "singleflight-mutex-fetch",
      "asynchronous-background-fill",
    ])
    .default("singleflight-mutex-fetch"),
  defaultTtlSeconds: z.number().int().min(1).max(604800).default(3600),
  evictionPolicy: z
    .enum(["lru-memory-capped", "lfu-frequency", "sliding-window-idle"])
    .default("lru-memory-capped"),
  cachePopulationStrategy: z
    .enum(["on-demand-lazy", "eager-warmup", "cdc-prepopulated"])
    .default("on-demand-lazy"),
  stampedeProtection: z
    .enum(["mutex-single-flight", "probabilistic-early-expiration", "distributed-lock"])
    .default("mutex-single-flight"),
  failureFallback: z
    .enum(["pass-through-to-origin", "serve-stale-if-error", "circuit-break-fail"])
    .default("serve-stale-if-error"),
  assumedReadLatencyP95Ms: z.number().int().min(1).max(500).default(3),
});
export type ReadThroughCacheConfig = z.infer<typeof ReadThroughCacheConfigSchema>;

// 08 — Write-Through Cache
export const WriteThroughCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("write-through-cache"),
  backingDataSourceType: z
    .enum([
      "postgresql-database",
      "mysql-database",
      "relational-cluster",
      "document-store",
    ])
    .default("postgresql-database"),
  writeOrdering: z
    .enum(["cache-first-then-db", "two-phase-commit", "db-first-then-cache"])
    .default("cache-first-then-db"),
  writeAckSemantics: z
    .enum(["after-backing-store-confirms", "two-tier-durable-commit"])
    .default("after-backing-store-confirms"),
  failureHandling: z
    .enum([
      "rollback-cache-on-db-fail",
      "throw-exception-and-evict",
      "compensating-transaction",
    ])
    .default("rollback-cache-on-db-fail"),
  retryPolicy: z
    .enum(["exponential-backoff-3x", "linear-retry-2x", "immediate-fail"])
    .default("exponential-backoff-3x"),
  consistencyLevel: z
    .enum(["strong-consistency", "read-your-writes-immediate"])
    .default("strong-consistency"),
  cacheUpdatePolicy: z
    .enum(["update-in-place", "invalidate-and-evict"])
    .default("update-in-place"),
  assumedWriteThroughputRps: z.number().int().min(50).max(500000).default(5000),
});
export type WriteThroughCacheConfig = z.infer<typeof WriteThroughCacheConfigSchema>;

// 09 — Write-Behind Cache
export const WriteBehindCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("write-behind-cache"),
  backingDataSourceType: z
    .enum([
      "postgresql-database",
      "mysql-database",
      "data-warehouse",
      "document-store",
    ])
    .default("postgresql-database"),
  writeBufferSizeMb: z.number().int().min(16).max(65536).default(2048),
  flushIntervalMs: z.number().int().min(50).max(60000).default(1000),
  flushBatchSize: z.number().int().min(10).max(50000).default(500),
  coalescingStrategy: z
    .enum(["last-write-wins-key", "append-all-deltas", "merge-partial-fields"])
    .default("last-write-wins-key"),
  retryLimit: z.number().int().min(1).max(10).default(3),
  failureHandling: z
    .enum(["dead-letter-queue", "quarantine-memory-buffer", "alert-and-halt"])
    .default("dead-letter-queue"),
  durabilityLevel: z
    .enum(["wal-backed-queue", "volatile-memory-buffer", "replicated-in-memory"])
    .default("wal-backed-queue"),
  maxPendingWrites: z.number().int().min(1000).max(10000000).default(100000),
  dataLossRiskTolerance: z
    .enum(["minimal-wal-guarantee", "acceptable-minor-loss", "zero-loss-strict"])
    .default("minimal-wal-guarantee"),
});
export type WriteBehindCacheConfig = z.infer<typeof WriteBehindCacheConfigSchema>;

// 10 — Rate Limit Store
export const RateLimitStoreConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("rate-limit-store"),
  counterStorageModel: z
    .enum([
      "redis-in-memory-hash",
      "memcached-atomic-incr",
      "distributed-in-memory-shards",
    ])
    .default("redis-in-memory-hash"),
  rateLimitAlgorithm: z
    .enum([
      "token-bucket",
      "sliding-window-log",
      "sliding-window-counter",
      "fixed-window-counter",
      "leaky-bucket",
    ])
    .default("sliding-window-counter"),
  windowDurationSeconds: z.number().int().min(1).max(86400).default(60),
  tokenCapacity: z.number().int().min(1).max(1000000).default(1000),
  refillRatePerSecond: z.number().int().min(1).max(100000).default(20),
  keyScope: z
    .enum([
      "client-ip",
      "api-key-tenant",
      "user-id-principal",
      "route-endpoint-composite",
    ])
    .default("api-key-tenant"),
  counterTtlSeconds: z.number().int().min(1).max(86400).default(120),
  atomicityGuarantees: z
    .enum(["lua-script-atomic", "redis-multi-exec", "atomic-cas-incr"])
    .default("lua-script-atomic"),
  distributedConsistency: z
    .enum([
      "eventual-replicated-sync",
      "single-primary-atomic",
      "multi-region-crdt",
    ])
    .default("single-primary-atomic"),
  assumedMaxRequestsPerSec: z.number().int().min(100).max(2000000).default(50000),
});
export type RateLimitStoreConfig = z.infer<typeof RateLimitStoreConfigSchema>;

// Discriminated Union for Caching & Performance
export const CachingAndPerformanceConfigSchema = z.discriminatedUnion("componentType", [
  RedisCacheConfigSchema,
  MemcachedCacheConfigSchema,
  ApplicationCacheConfigSchema,
  DistributedCacheConfigSchema,
  SessionCacheConfigSchema,
  QueryCacheConfigSchema,
  ReadThroughCacheConfigSchema,
  WriteThroughCacheConfigSchema,
  WriteBehindCacheConfigSchema,
  RateLimitStoreConfigSchema,
]);

export type CachingAndPerformanceConfig = z.infer<typeof CachingAndPerformanceConfigSchema>;
