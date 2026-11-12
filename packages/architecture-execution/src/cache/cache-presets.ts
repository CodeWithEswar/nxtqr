import type {
  CacheScenario,
} from "./cache-schemas";

export type CacheScenarioPresetId =
  | "basic_cache_hit"
  | "basic_cache_miss"
  | "lru_eviction"
  | "lfu_eviction"
  | "fifo_eviction"
  | "ttl_expiration"
  | "cache_aside"
  | "read_through"
  | "write_through"
  | "write_behind"
  | "cache_stampede"
  | "request_coalescing"
  | "stale_while_revalidate"
  | "replica_lag"
  | "cache_outage"
  | "invalidation_race";

export interface CachePresetMetadata {
  id: CacheScenarioPresetId;
  title: string;
  category: "Fundamentals & Eviction" | "Caching Strategies" | "Concurrency & Stampede" | "Distributed & Replication";
  description: string;
}

export const CACHE_PRESET_METADATA: Record<CacheScenarioPresetId, CachePresetMetadata> = {
  basic_cache_hit: {
    id: "basic_cache_hit",
    title: "Basic Cache Hit",
    category: "Fundamentals & Eviction",
    description: "Evaluates unexpired key in cache memory, returning data in 1ms without database I/O.",
  },
  basic_cache_miss: {
    id: "basic_cache_miss",
    title: "Basic Cache Miss",
    category: "Fundamentals & Eviction",
    description: "Key is absent from memory, resulting in a cache miss event.",
  },
  lru_eviction: {
    id: "lru_eviction",
    title: "LRU Eviction Policy",
    category: "Fundamentals & Eviction",
    description: "Capacity 3. Accesses A and B; adding D evicts C as the least recently accessed entry.",
  },
  lfu_eviction: {
    id: "lfu_eviction",
    title: "LFU Eviction Policy",
    category: "Fundamentals & Eviction",
    description: "Capacity 3. Accesses A multiple times; adding D evicts lowest frequency candidate with tie-breaker.",
  },
  fifo_eviction: {
    id: "fifo_eviction",
    title: "FIFO Eviction Policy",
    category: "Fundamentals & Eviction",
    description: "Capacity 3. Oldest inserted entry is evicted regardless of recent read hits.",
  },
  ttl_expiration: {
    id: "ttl_expiration",
    title: "TTL Virtual Expiration",
    category: "Fundamentals & Eviction",
    description: "Entry has 100ms TTL. At t=150ms, lookup results in an expired cache miss.",
  },
  cache_aside: {
    id: "cache_aside",
    title: "Cache-Aside (Lazy Loading)",
    category: "Caching Strategies",
    description: "Application misses cache, queries backing PostgreSQL database, and populates cache.",
  },
  read_through: {
    id: "read_through",
    title: "Read-Through Strategy",
    category: "Caching Strategies",
    description: "Cache abstraction transparently handles database lookup on miss and caches result.",
  },
  write_through: {
    id: "write_through",
    title: "Write-Through Strategy",
    category: "Caching Strategies",
    description: "Synchronous coordinated write to both cache and database before acknowledging success.",
  },
  write_behind: {
    id: "write_behind",
    title: "Write-Behind (Deferred Queue)",
    category: "Caching Strategies",
    description: "Fast in-memory write acknowledged immediately; deferred write queue flushes asynchronously to DB.",
  },
  cache_stampede: {
    id: "cache_stampede",
    title: "Cache Stampede (Thundering Herd)",
    category: "Concurrency & Stampede",
    description: "5 concurrent requests miss the same hot key simultaneously, duplicating database load.",
  },
  request_coalescing: {
    id: "request_coalescing",
    title: "Single-Flight Request Coalescing",
    category: "Concurrency & Stampede",
    description: "5 concurrent requests for missing key: 1 leader fetches from DB, 4 followers wait and share result.",
  },
  stale_while_revalidate: {
    id: "stale_while_revalidate",
    title: "Stale-While-Revalidate",
    category: "Concurrency & Stampede",
    description: "Serves expired entry immediately within stale window while background refresh repopulates cache.",
  },
  replica_lag: {
    id: "replica_lag",
    title: "Primary-Replica Cache Lag",
    category: "Distributed & Replication",
    description: "Primary receives update; read directed to lagging replica before delay returns stale value.",
  },
  cache_outage: {
    id: "cache_outage",
    title: "Cache Node Outage Fallback",
    category: "Distributed & Replication",
    description: "Cache becomes unavailable; requests gracefully fall back directly to persistent storage.",
  },
  invalidation_race: {
    id: "invalidation_race",
    title: "Invalidation Race Condition",
    category: "Distributed & Replication",
    description: "Slow read attempts to populate cache after a concurrent write already updated the database.",
  },
};

export function createCachePresetScenario(
  presetId: CacheScenarioPresetId,
  cacheNodeId = "redis_cache"
): CacheScenario {
  const meta = CACHE_PRESET_METADATA[presetId];

  const baseScenario: CacheScenario = {
    version: 1,
    id: presetId,
    cacheNodeId,
    title: meta.title,
    description: meta.description,
    configuration: {
      capacity: 3,
      capacityUnit: "entries",
      evictionPolicy: "lru",
      defaultTtlMs: 60000,
      cachingStrategy: "cache_aside",
      consistencyModel: "eventual",
      backingDatabaseNodeId: "postgres_db",
    },
    initialEntries: [],
    operations: [],
    limits: {
      maxEntries: 5000,
      maxEvents: 2000,
      maxVirtualDurationMs: 30000,
    },
  };

  switch (presetId) {
    case "basic_cache_hit":
      baseScenario.configuration.capacity = 10;
      baseScenario.initialEntries = [
        {
          key: "products:42",
          value: { id: 42, name: "Quantum Processor", price: 799.99 },
          sizeBytes: 128,
          createdAtMs: 0,
          expiresAtMs: 60000,
          lastAccessedAtMs: 0,
          accessCount: 1,
          insertionSequence: 1,
          version: 1,
        },
      ];
      baseScenario.operations = [
        { id: "op_hit_1", type: "GET", key: "products:42", atMs: 10, expectedResult: "hit" },
      ];
      break;

    case "basic_cache_miss":
      baseScenario.configuration.capacity = 10;
      baseScenario.operations = [
        { id: "op_miss_1", type: "GET", key: "products:42", atMs: 10, expectedResult: "miss" },
      ];
      break;

    case "lru_eviction":
      baseScenario.configuration.capacity = 3;
      baseScenario.configuration.evictionPolicy = "lru";
      baseScenario.initialEntries = [
        { key: "A", value: "data_A", sizeBytes: 32, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 1, version: 1 },
        { key: "B", value: "data_B", sizeBytes: 32, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 2, version: 1 },
        { key: "C", value: "data_C", sizeBytes: 32, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 3, version: 1 },
      ];
      baseScenario.operations = [
        { id: "op_1", type: "GET", key: "A", atMs: 10 },
        { id: "op_2", type: "GET", key: "B", atMs: 20 },
        { id: "op_3", type: "GET", key: "A", atMs: 30 },
        { id: "op_4", type: "SET", key: "D", value: "data_D", atMs: 40 },
      ];
      break;

    case "lfu_eviction":
      baseScenario.configuration.capacity = 3;
      baseScenario.configuration.evictionPolicy = "lfu";
      baseScenario.initialEntries = [
        { key: "A", value: "data_A", sizeBytes: 32, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 1, version: 1 },
        { key: "B", value: "data_B", sizeBytes: 32, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 2, version: 1 },
        { key: "C", value: "data_C", sizeBytes: 32, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 3, version: 1 },
      ];
      baseScenario.operations = [
        { id: "op_1", type: "GET", key: "A", atMs: 10 },
        { id: "op_2", type: "GET", key: "A", atMs: 20 },
        { id: "op_3", type: "GET", key: "B", atMs: 30 },
        { id: "op_4", type: "SET", key: "D", value: "data_D", atMs: 40 },
      ];
      break;

    case "fifo_eviction":
      baseScenario.configuration.capacity = 3;
      baseScenario.configuration.evictionPolicy = "fifo";
      baseScenario.initialEntries = [
        { key: "A", value: "data_A", sizeBytes: 32, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 1, version: 1 },
        { key: "B", value: "data_B", sizeBytes: 32, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 2, version: 1 },
        { key: "C", value: "data_C", sizeBytes: 32, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 3, version: 1 },
      ];
      baseScenario.operations = [
        { id: "op_1", type: "GET", key: "A", atMs: 10 },
        { id: "op_2", type: "SET", key: "D", value: "data_D", atMs: 20 },
      ];
      break;

    case "ttl_expiration":
      baseScenario.configuration.capacity = 10;
      baseScenario.initialEntries = [
        {
          key: "session:user_1",
          value: { userId: 1, role: "admin" },
          sizeBytes: 64,
          createdAtMs: 0,
          expiresAtMs: 100,
          lastAccessedAtMs: 0,
          accessCount: 1,
          insertionSequence: 1,
          version: 1,
        },
      ];
      baseScenario.operations = [
        { id: "op_1", type: "GET", key: "session:user_1", atMs: 50 },
        { id: "op_2", type: "GET", key: "session:user_1", atMs: 150 },
      ];
      break;

    case "cache_aside":
      baseScenario.configuration.capacity = 10;
      baseScenario.configuration.cachingStrategy = "cache_aside";
      baseScenario.operations = [
        { id: "op_ca_1", type: "GET", key: "products:42", atMs: 10 },
        { id: "op_ca_2", type: "GET", key: "products:42", atMs: 50 },
      ];
      break;

    case "read_through":
      baseScenario.configuration.capacity = 10;
      baseScenario.configuration.cachingStrategy = "read_through";
      baseScenario.operations = [
        { id: "op_rt_1", type: "GET", key: "products:43", atMs: 10 },
      ];
      break;

    case "write_through":
      baseScenario.configuration.capacity = 10;
      baseScenario.configuration.cachingStrategy = "write_through";
      baseScenario.operations = [
        { id: "op_wt_1", type: "SET", key: "products:42", value: { id: 42, price: 849.99 }, atMs: 15 },
      ];
      break;

    case "write_behind":
      baseScenario.configuration.capacity = 10;
      baseScenario.configuration.cachingStrategy = "write_behind";
      baseScenario.configuration.writeBehindConfig = {
        flushIntervalMs: 150,
        batchSize: 5,
        maxQueueSize: 20,
        dropOnFailure: true,
      };
      baseScenario.operations = [
        { id: "op_wb_1", type: "SET", key: "products:42", value: { id: 42, price: 899.99 }, atMs: 10 },
        { id: "op_wb_2", type: "SET", key: "products:44", value: { id: 44, price: 169.0 }, atMs: 20 },
      ];
      break;

    case "cache_stampede":
      baseScenario.configuration.capacity = 10;
      baseScenario.configuration.coalescingConfig = { enabled: false, windowMs: 50 };
      baseScenario.operations = [
        { id: "req_st_1", type: "GET", key: "products:42", atMs: 10, clientRequestId: "req_1" },
        { id: "req_st_2", type: "GET", key: "products:42", atMs: 10, clientRequestId: "req_2" },
        { id: "req_st_3", type: "GET", key: "products:42", atMs: 10, clientRequestId: "req_3" },
        { id: "req_st_4", type: "GET", key: "products:42", atMs: 10, clientRequestId: "req_4" },
        { id: "req_st_5", type: "GET", key: "products:42", atMs: 10, clientRequestId: "req_5" },
      ];
      break;

    case "request_coalescing":
      baseScenario.configuration.capacity = 10;
      baseScenario.configuration.coalescingConfig = { enabled: true, windowMs: 50 };
      baseScenario.operations = [
        { id: "req_coal_1", type: "GET", key: "products:42", atMs: 10, clientRequestId: "req_1" },
        { id: "req_coal_2", type: "GET", key: "products:42", atMs: 12, clientRequestId: "req_2" },
        { id: "req_coal_3", type: "GET", key: "products:42", atMs: 15, clientRequestId: "req_3" },
        { id: "req_coal_4", type: "GET", key: "products:42", atMs: 18, clientRequestId: "req_4" },
        { id: "req_coal_5", type: "GET", key: "products:42", atMs: 20, clientRequestId: "req_5" },
      ];
      break;

    case "stale_while_revalidate":
      baseScenario.configuration.capacity = 10;
      baseScenario.configuration.staleWhileRevalidateConfig = {
        enabled: true,
        staleWindowMs: 200,
      };
      baseScenario.initialEntries = [
        {
          key: "products:42",
          value: { id: 42, name: "Quantum Processor", price: 799.99 },
          sizeBytes: 128,
          createdAtMs: 0,
          expiresAtMs: 100, // Expired at t=100
          lastAccessedAtMs: 0,
          accessCount: 1,
          insertionSequence: 1,
          version: 1,
        },
      ];
      baseScenario.operations = [
        { id: "op_swr_1", type: "GET", key: "products:42", atMs: 150 }, // Inside stale window 100-300ms
      ];
      break;

    case "replica_lag":
      baseScenario.configuration.capacity = 10;
      baseScenario.configuration.replicationConfig = {
        primaryNodeId: cacheNodeId,
        replicaNodeIds: ["cache_replica_1"],
        replicationDelayMs: 200,
        readRouting: "replica",
      };
      baseScenario.initialEntries = [
        {
          key: "products:42",
          value: { id: 42, price: 799.99 },
          sizeBytes: 64,
          createdAtMs: 0,
          lastAccessedAtMs: 0,
          accessCount: 1,
          insertionSequence: 1,
          version: 1,
        },
      ];
      baseScenario.operations = [
        { id: "op_rep_1", type: "SET", key: "products:42", value: { id: 42, price: 899.99 }, atMs: 20 },
        { id: "op_rep_2", type: "GET", key: "products:42", atMs: 50 }, // Read from replica before lag catches up -> stale!
      ];
      break;

    case "cache_outage":
      baseScenario.configuration.capacity = 10;
      baseScenario.operations = [
        { id: "op_outage_1", type: "GET", key: "products:42", atMs: 10 },
      ];
      break;

    case "invalidation_race":
      baseScenario.configuration.capacity = 10;
      baseScenario.operations = [
        { id: "op_race_1", type: "GET", key: "products:42", atMs: 10 },
        { id: "op_race_2", type: "INVALIDATE", key: "products:42", atMs: 20 },
        { id: "op_race_3", type: "SET", key: "products:42", value: { id: 42, price: 950.0 }, atMs: 30 },
      ];
      break;

    default:
      break;
  }

  return baseScenario;
}
