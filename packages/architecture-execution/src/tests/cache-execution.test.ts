import { describe, it, expect, beforeEach } from "vitest";
import {
  CacheExecutionEngine,
  createCachePresetScenario,
  CACHE_PRESET_METADATA,
  LruEvictionPolicy,
  LfuEvictionPolicy,
  FifoEvictionPolicy,
  NoEvictionPolicy,
  EvictionManager,
  BackingDatabaseAdapter,
  CacheStrategyPlanner,
  RequestCoalescingManager,
  InvalidationManager,
  StaleWhileRevalidateChecker,
  DistributedCacheManager,
  ShardRouter,
  type CacheEntry,
  type EvictionContext,
} from "../index";

describe("NXTQR Phase 05.4.7 — Interactive Cache Execution Engine", () => {
  let defaultContext: EvictionContext;

  beforeEach(() => {
    defaultContext = {
      cacheNodeId: "redis_cache",
      virtualClockMs: 500,
      capacityLimit: 3,
      currentCount: 3,
      policy: "lru",
    };
  });

  describe("1. Eviction Policies & Deterministic Tie-Breaking", () => {
    it("LRU: Evicts least recently accessed entry with insertionSequence tie-breaker", () => {
      const policy = new LruEvictionPolicy();
      const entries: CacheEntry[] = [
        { key: "entry_a", value: "A", sizeBytes: 10, createdAtMs: 100, lastAccessedAtMs: 200, accessCount: 5, insertionSequence: 1, version: 1 },
        { key: "entry_b", value: "B", sizeBytes: 10, createdAtMs: 110, lastAccessedAtMs: 150, accessCount: 1, insertionSequence: 2, version: 1 },
        { key: "entry_c", value: "C", sizeBytes: 10, createdAtMs: 120, lastAccessedAtMs: 300, accessCount: 1, insertionSequence: 3, version: 1 },
      ];

      const victim = policy.selectVictim(entries, defaultContext);
      expect(victim.victimKey).toBe("entry_b"); // lowest lastAccessedAtMs (150)
      expect(victim.policy).toBe("lru");

      // Test tie-break by insertionSequence
      entries[0].lastAccessedAtMs = 150;
      const tiedVictim = policy.selectVictim(entries, defaultContext);
      expect(tiedVictim.victimKey).toBe("entry_a"); // insertionSequence 1 < 2
    });

    it("LFU: Evicts least frequently accessed entry with recency tie-breaker", () => {
      const policy = new LfuEvictionPolicy();
      const entries: CacheEntry[] = [
        { key: "entry_a", value: "A", sizeBytes: 10, createdAtMs: 100, lastAccessedAtMs: 500, accessCount: 10, insertionSequence: 1, version: 1 },
        { key: "entry_b", value: "B", sizeBytes: 10, createdAtMs: 110, lastAccessedAtMs: 400, accessCount: 2, insertionSequence: 2, version: 1 },
        { key: "entry_c", value: "C", sizeBytes: 10, createdAtMs: 120, lastAccessedAtMs: 200, accessCount: 2, insertionSequence: 3, version: 1 },
      ];

      const victim = policy.selectVictim(entries, { ...defaultContext, policy: "lfu" });
      expect(victim.victimKey).toBe("entry_c"); // same frequency (2), but entry_c accessed earlier (200 < 400)
    });

    it("FIFO: Evicts earliest inserted entry regardless of access count or recency", () => {
      const policy = new FifoEvictionPolicy();
      const entries: CacheEntry[] = [
        { key: "entry_a", value: "A", sizeBytes: 10, createdAtMs: 100, lastAccessedAtMs: 999, accessCount: 100, insertionSequence: 1, version: 1 },
        { key: "entry_b", value: "B", sizeBytes: 10, createdAtMs: 110, lastAccessedAtMs: 100, accessCount: 1, insertionSequence: 2, version: 1 },
      ];

      const victim = policy.selectVictim(entries, { ...defaultContext, policy: "fifo" });
      expect(victim.victimKey).toBe("entry_a"); // lowest insertionSequence
    });

    it("NoEviction: Rejects insertion and returns null victim when at capacity", () => {
      const policy = new NoEvictionPolicy();
      const entries: CacheEntry[] = [
        { key: "entry_a", value: "A", sizeBytes: 10, createdAtMs: 100, lastAccessedAtMs: 100, accessCount: 1, insertionSequence: 1, version: 1 },
      ];

      const victim = policy.selectVictim(entries, { ...defaultContext, policy: "noeviction" });
      expect(victim.victimKey).toBeNull();
      expect(victim.reason).toContain("rejected");
    });

    it("EvictionManager: Correctly delegates to chosen eviction policy", () => {
      const entries: CacheEntry[] = [
        { key: "entry_a", value: "A", sizeBytes: 10, createdAtMs: 100, lastAccessedAtMs: 200, accessCount: 5, insertionSequence: 1, version: 1 },
        { key: "entry_b", value: "B", sizeBytes: 10, createdAtMs: 110, lastAccessedAtMs: 150, accessCount: 1, insertionSequence: 2, version: 1 },
      ];

      const victim = EvictionManager.selectVictim(entries, defaultContext);
      expect(victim.victimKey).toBe("entry_b");
    });
  });

  describe("2. Caching Strategies & Database Backing Store", () => {
    it("BackingDatabaseAdapter: Retrieves records from fixture database tables", () => {
      const db = new BackingDatabaseAdapter();
      const res = db.query("products:42");
      expect(res.found).toBe(true);
      expect((res.value as any)?.id).toBe(42);
      expect((res.value as any)?.name).toBe("Quantum Processor");

      const notFound = db.query("products:99999");
      expect(notFound.found).toBe(false);
    });

    it("CacheStrategyPlanner: Evaluates read and write strategies appropriately", () => {
      const readPlanMiss = CacheStrategyPlanner.planGet("cache_aside", false);
      expect(readPlanMiss.requiresDatabaseRead).toBe(true);
      expect(readPlanMiss.requiresDatabaseWrite).toBe(false);

      const readPlanHit = CacheStrategyPlanner.planGet("cache_aside", true);
      expect(readPlanHit.requiresDatabaseRead).toBe(false);

      const writeBehindPlan = CacheStrategyPlanner.planSet("write_behind");
      expect(writeBehindPlan.deferredWrite).toBe(true);
      expect(writeBehindPlan.requiresDatabaseWrite).toBe(false); // Deferred to queue
    });
  });

  describe("3. Concurrency, Request Coalescing & Stale-While-Revalidate", () => {
    it("RequestCoalescingManager: Coalesces duplicate concurrent reads into single-flight leader", () => {
      const manager = new RequestCoalescingManager();

      // Request 1 is leader
      const r1 = manager.requestLoad("products:42", "req_1", 100);
      expect(r1.isLeader).toBe(true);
      expect(r1.joinedExisting).toBe(false);

      // Request 2 & 3 join single-flight group
      const r2 = manager.requestLoad("products:42", "req_2", 110);
      expect(r2.isLeader).toBe(false);
      expect(r2.joinedExisting).toBe(true);

      const r3 = manager.requestLoad("products:42", "req_3", 115);
      expect(r3.isLeader).toBe(false);
      expect(r3.joinedExisting).toBe(true);

      // Complete leader
      const completedGroup = manager.completeLoad("products:42", { id: 42, name: "SSD" });
      expect(completedGroup).not.toBeNull();
      expect(completedGroup?.waitingRequestIds).toEqual(["req_2", "req_3"]);
      expect(completedGroup?.status).toBe("completed");
    });

    it("StaleWhileRevalidateChecker: Detects expired entries within stale grace window", () => {
      const entry: CacheEntry = {
        key: "k1",
        value: "v1",
        sizeBytes: 10,
        createdAtMs: 1000,
        expiresAtMs: 60000,
        lastAccessedAtMs: 1000,
        accessCount: 1,
        insertionSequence: 1,
        version: 1,
      };

      // Virtual clock at 30,000ms -> Not expired yet
      expect(StaleWhileRevalidateChecker.isWithinStaleWindow(entry, 30000, 30000)).toBe(false);

      // Virtual clock at 70,000ms -> Expired at 60,000ms, elapsed 10,000ms <= window 30,000ms -> TRUE
      expect(StaleWhileRevalidateChecker.isWithinStaleWindow(entry, 70000, 30000)).toBe(true);

      // Virtual clock at 100,000ms -> Expired at 60,000ms, elapsed 40,000ms > window 30,000ms -> FALSE
      expect(StaleWhileRevalidateChecker.isWithinStaleWindow(entry, 100000, 30000)).toBe(false);
    });

    it("InvalidationManager: Matches single keys and wildcard patterns (e.g. products:*)", () => {
      const entries: Record<string, CacheEntry> = {
        "products:1": { key: "products:1", value: 1, sizeBytes: 10, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 1, version: 1 },
        "products:2": { key: "products:2", value: 2, sizeBytes: 10, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 2, version: 1 },
        "orders:10": { key: "orders:10", value: 10, sizeBytes: 10, createdAtMs: 0, lastAccessedAtMs: 0, accessCount: 1, insertionSequence: 3, version: 1 },
      };

      const matchedProducts = InvalidationManager.findInvalidationTargets(entries, "products:*");
      expect(matchedProducts).toEqual(["products:1", "products:2"]);

      const exact = InvalidationManager.findInvalidationTargets(entries, "orders:10");
      expect(exact).toEqual(["orders:10"]);
    });
  });

  describe("4. Distributed Cache, Replicas & Sharding", () => {
    it("DistributedCacheManager: Models primary-replica replication delay and tracks replica lag", () => {
      const dist = new DistributedCacheManager("redis-primary", 2, 200);
      const replicas = dist.getReplicas();
      expect(Object.keys(replicas).length).toBe(2);

      const entry: CacheEntry = {
        key: "order:123",
        value: { total: 500 },
        sizeBytes: 20,
        createdAtMs: 1000,
        expiresAtMs: 60000,
        lastAccessedAtMs: 1000,
        accessCount: 1,
        insertionSequence: 1,
        version: 2,
      };

      // Schedule replication at virtual time 1000ms
      const { item, event } = dist.scheduleReplication("order:123", entry, 1000);
      expect(event.delayMs).toBe(200);
      expect(item.applyAtMs).toBe(1200);

      // At 1100ms: Replica is lagging and read returns stale check
      const isStaleAt1100 = dist.isStaleRead("redis-primary-replica-1", "order:123", 2);
      expect(isStaleAt1100).toBe(true);

      // At 1250ms: Replicas catch up
      const catchupEvents = dist.catchUpReplicas(1250);
      expect(catchupEvents.length).toBe(2);

      // Replica is now up to date
      const isStaleAt1300 = dist.isStaleRead("redis-primary-replica-1", "order:123", 2);
      expect(isStaleAt1300).toBe(false);
    });

    it("ShardRouter: Routes keys deterministically across shards using FNV-1a hash", () => {
      const shardA = ShardRouter.routeKey("products:42", 3);
      const shardB = ShardRouter.routeKey("products:42", 3);
      expect(shardA.shardIndex).toBe(shardB.shardIndex);
      expect(shardA.shardNodeId).toBe(`cache_shard_${shardA.shardIndex}`);

      const shardC = ShardRouter.routeKey("orders:999", 3);
      expect(typeof shardC.shardIndex).toBe("number");
      expect(shardC.shardIndex).toBeGreaterThanOrEqual(0);
      expect(shardC.shardIndex).toBeLessThan(3);
    });
  });

  describe("5. Full Cache Execution Engine Simulation & Presets", () => {
    it("Executes basic_cache_hit scenario deterministically", () => {
      const scenario = createCachePresetScenario("basic_cache_hit");
      const trace = CacheExecutionEngine.executeScenario(scenario);

      expect(trace.outcome).toBe("success");
      expect(trace.events.length).toBeGreaterThan(0);
      expect(trace.frames.length).toBeGreaterThan(0);

      const hitEvent = trace.events.find((e) => e.type === "cache.hit");
      expect(hitEvent).toBeDefined();

      const lastFrame = trace.frames[trace.frames.length - 1]!;
      expect(lastFrame.metrics?.cacheMetrics?.hits).toBe(1);
      expect(lastFrame.metrics?.cacheMetrics?.misses).toBe(0);
    });

    it("Executes basic_cache_miss scenario with DB fetch and cache repopulation", () => {
      const scenario = createCachePresetScenario("basic_cache_miss");
      const trace = CacheExecutionEngine.executeScenario(scenario);

      expect(trace.outcome).toBe("success");
      const missEvent = trace.events.find((e) => e.type === "cache.miss");
      expect(missEvent).toBeDefined();

      const entryCreated = trace.events.find((e) => e.type === "cache.entry.created");
      expect(entryCreated).toBeDefined();

      const lastFrame = trace.frames[trace.frames.length - 1]!;
      expect(lastFrame.metrics?.cacheMetrics?.misses).toBe(1);
      expect(lastFrame.runtimeState?.cacheState?.entries["products:42"]).toBeDefined();
    });

    it("Executes lru_eviction scenario and records victim eviction decision", () => {
      const scenario = createCachePresetScenario("lru_eviction");
      const trace = CacheExecutionEngine.executeScenario(scenario);

      expect(trace.outcome).toBe("success");
      const evictionEvent = trace.events.find((e) => e.type === "cache.entry.evicted");
      expect(evictionEvent).toBeDefined();
      expect(evictionEvent?.explanation).toContain("Evicted");

      const lastFrame = trace.frames[trace.frames.length - 1]!;
      expect(lastFrame.metrics?.cacheMetrics?.evictions).toBeGreaterThanOrEqual(1);
    });

    it("Executes request_coalescing scenario and eliminates stampede redundant reads", () => {
      const scenario = createCachePresetScenario("request_coalescing");
      const trace = CacheExecutionEngine.executeScenario(scenario);

      expect(trace.outcome).toBe("success");
      const coalescedEvents = trace.events.filter((e) => e.type === "cache.load.coalesced");
      expect(coalescedEvents.length).toBeGreaterThanOrEqual(2);

      const lastFrame = trace.frames[trace.frames.length - 1]!;
      expect(lastFrame.metrics?.cacheMetrics?.coalescedRequests).toBeGreaterThanOrEqual(2);
    });

    it("Validates all 16 presets load valid scenarios with metadata", () => {
      const presetIds = Object.keys(CACHE_PRESET_METADATA) as (keyof typeof CACHE_PRESET_METADATA)[];
      expect(presetIds.length).toBe(16);

      for (const presetId of presetIds) {
        const scenario = createCachePresetScenario(presetId);
        expect(scenario.id).toBe(presetId);
        expect(scenario.operations.length).toBeGreaterThan(0);

        const trace = CacheExecutionEngine.executeScenario(scenario);
        expect(trace.outcome).toBe("success");
        expect(trace.frames.length).toBeGreaterThan(0);
      }
    });
  });
});
