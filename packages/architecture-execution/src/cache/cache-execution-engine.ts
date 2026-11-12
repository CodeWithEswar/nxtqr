import type {
  ExecutionTrace,
  VisualizationFrame,
} from "../domain/execution-trace";
import type { ModeledRuntimeState } from "../domain/runtime-state";
import { RuntimeStateHelper } from "../domain/runtime-state";
import type {
  CacheScenario,
  CacheEntry,
  ModeledCacheRuntimeState,
  CacheMetrics,
  WriteBehindQueueItem,
  EvictionDecision,
} from "./cache-schemas";
import type {
  CacheExecutionEvent,
  CacheSimOperationStartedEvent,
  CacheSimLookupStartedEvent,
  CacheSimHitEvent,
  CacheSimMissEvent,
  CacheSimEntryCreatedEvent,
  CacheSimEntryUpdatedEvent,
  CacheSimEntryDeletedEvent,
  CacheSimEntryExpiredEvent,
  CacheSimCapacityExceededEvent,
  CacheSimEvictionVictimSelectedEvent,
  CacheSimEntryEvictedEvent,
  CacheSimTtlAssignedEvent,
  CacheSimInvalidationRequestedEvent,
  CacheSimInvalidationAppliedEvent,
  CacheSimWriteBehindQueuedEvent,
  CacheSimWriteBehindFlushStartedEvent,
  CacheSimWriteBehindFlushCompletedEvent,
  CacheSimLoadStartedEvent,
  CacheSimLoadCoalescedEvent,
  CacheSimLoadCompletedEvent,
  CacheSimOperationCompletedEvent,
  CacheSimOperationFailedEvent,
} from "./cache-events";
import { EvictionManager } from "./policies/eviction-policies";
import { BackingDatabaseAdapter } from "./strategies/cache-strategies";
import { DETERMINISTIC_EPOCH_ISO, createDeterministicId } from "../orchestrator/deterministic-id";
import {
  RequestCoalescingManager,
  InvalidationManager,
  StaleWhileRevalidateChecker,
} from "./consistency/cache-consistency";
import { DistributedCacheManager } from "./distributed/cache-distributed";

export class CacheExecutionEngine {
  /**
   * Executes a deterministic in-memory cache scenario, producing a rich ExecutionTrace.
   */
  public static executeScenario(scenario: CacheScenario): ExecutionTrace {
    const events: CacheExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];
    let sequence = 1;
    let virtualClockMs = 0;

    const cacheNodeId = scenario.cacheNodeId || "redis_cache";
    const baseRuntimeState = RuntimeStateHelper.createInitialState();

    // 1. Initialize Subsystems
    const entries: Record<string, CacheEntry> = {};
    let insertionSeq = 1;

    for (const init of scenario.initialEntries) {
      entries[init.key] = {
        ...init,
        insertionSequence: init.insertionSequence || insertionSeq++,
      };
    }

    const backingDb = new BackingDatabaseAdapter();
    const coalescingManager = new RequestCoalescingManager();
    const distributedManager = new DistributedCacheManager(
      scenario.configuration.replicationConfig?.primaryNodeId || cacheNodeId,
      scenario.configuration.replicationConfig?.replicaNodeIds || [],
      scenario.configuration.replicationConfig?.replicationDelayMs || 150
    );

    const writeBehindQueue: WriteBehindQueueItem[] = [];
    let lastEvictionDecision: EvictionDecision | undefined;

    interface InFlightLoadItem {
      key: string;
      leaderRequestId: string;
      startedAtMs: number;
      completesAtMs: number;
      waitingRequestIds: string[];
      dbValue: unknown;
    }
    const inFlightLoads: Record<string, InFlightLoadItem> = {};

    const flushCompletedLoads = (timeThreshold: number) => {
      for (const k of Object.keys(inFlightLoads)) {
        const load = inFlightLoads[k];
        if (load.completesAtMs <= timeThreshold) {
          virtualClockMs = Math.max(virtualClockMs, load.completesAtMs);
          const ttlMs = scenario.configuration.defaultTtlMs;
          const newEntry: CacheEntry = {
            key: load.key,
            value: load.dbValue,
            sizeBytes: 128,
            createdAtMs: virtualClockMs,
            expiresAtMs: virtualClockMs + ttlMs,
            lastAccessedAtMs: virtualClockMs,
            accessCount: 1,
            insertionSequence: insertionSeq++,
            version: 1,
          };
          entries[load.key] = newEntry;

          events.push({
            id: `evt_create_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Populated cache entry for '${load.key}' from database fixture (TTL: ${ttlMs}ms)`,
            type: "cache.entry.created",
            cacheNodeId,
            key: load.key,
            sizeBytes: newEntry.sizeBytes,
            ttlMs,
          });

          events.push({
            id: `evt_load_comp_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Single-flight load completed for '${load.key}', shared with ${load.waitingRequestIds.length} waiting requests`,
            type: "cache.load.completed",
            cacheNodeId,
            key: load.key,
            coalescedCount: load.waitingRequestIds.length + 1,
          });

          delete inFlightLoads[k];
        }
      }
    };

    const metrics: CacheMetrics = {
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      expirationCount: 0,
      invalidationCount: 0,
      databaseReadsCount: 0,
      databaseWritesCount: 0,
      currentEntriesCount: Object.keys(entries).length,
      currentBytesUsed: Object.values(entries).reduce((sum, e) => sum + e.sizeBytes, 0),
      memoryUtilizationPercent: 0,
      coalescedRequestsCount: 0,
      staleReadsCount: 0,
    };

    // 2. Process Operations in Chronological Virtual Time
    for (const op of scenario.operations) {
      virtualClockMs = Math.max(virtualClockMs, op.atMs);

      // Complete in-flight loads due up to current time
      flushCompletedLoads(op.atMs);

      // Check and apply due replications up to current time
      const appliedRepEvents = distributedManager.catchUpReplicas(virtualClockMs, () => sequence++);
      events.push(...appliedRepEvents);

      // Operation Started
      const opStartEvt: CacheSimOperationStartedEvent = {
        id: `evt_op_start_${sequence}`,
        sequence: sequence++,
        atMs: virtualClockMs,
        durationMs: 1,
        explanation: `Starting cache operation: ${op.type} on key '${op.key}'`,
        type: "cache.operation.started",
        cacheNodeId,
        operationId: op.id,
        opType: op.type,
        key: op.key,
      };
      events.push(opStartEvt);
      virtualClockMs += 1;

      // Handle Operation
      switch (op.type) {
        case "GET": {
          const lookupEvt: CacheSimLookupStartedEvent = {
            id: `evt_lookup_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Looking up key '${op.key}' in cache memory...`,
            type: "cache.lookup.started",
            cacheNodeId,
            key: op.key,
          };
          events.push(lookupEvt);

          // 1. Check Single-Flight Request Coalescing
          if (scenario.configuration.coalescingConfig?.enabled) {
            if (inFlightLoads[op.key]) {
              const reqId = op.clientRequestId || op.id;
              const load = inFlightLoads[op.key];
              load.waitingRequestIds.push(reqId);
              metrics.coalescedRequestsCount++;
              const coalescedEvt: CacheSimLoadCoalescedEvent = {
                id: `evt_coal_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: `Request coalescing: Request '${reqId}' joined existing single-flight load for '${op.key}' led by '${load.leaderRequestId}'`,
                type: "cache.load.coalesced",
                cacheNodeId,
                key: op.key,
                followerRequestId: reqId,
                leaderRequestId: load.leaderRequestId,
              };
              events.push(coalescedEvt);
              virtualClockMs += 2;
              break;
            }
          }

          // 2. Evaluate Cache Entry
          const entry = entries[op.key];
          let isHit = false;
          let isStale = false;

          if (entry) {
            // Check TTL Expiration
            if (entry.expiresAtMs && virtualClockMs >= entry.expiresAtMs) {
              // Check Stale-While-Revalidate window
              if (
                scenario.configuration.staleWhileRevalidateConfig?.enabled &&
                StaleWhileRevalidateChecker.isWithinStaleWindow(
                  entry,
                  virtualClockMs,
                  scenario.configuration.staleWhileRevalidateConfig.staleWindowMs
                )
              ) {
                isHit = true;
                isStale = true;
                metrics.staleReadsCount++;
              } else {
                // Expired Miss
                metrics.expirationCount++;
                metrics.missCount++;
                delete entries[op.key];

                const expiredEvt: CacheSimEntryExpiredEvent = {
                  id: `evt_exp_${sequence}`,
                  sequence: sequence++,
                  atMs: virtualClockMs,
                  durationMs: 1,
                  explanation: `TTL Expired: Key '${op.key}' reached expiration at ${entry.expiresAtMs}ms (current: ${virtualClockMs}ms)`,
                  type: "cache.entry.expired",
                  cacheNodeId,
                  key: op.key,
                  expiredAtMs: entry.expiresAtMs,
                };
                events.push(expiredEvt);

                const missEvt: CacheSimMissEvent = {
                  id: `evt_miss_${sequence}`,
                  sequence: sequence++,
                  atMs: virtualClockMs,
                  durationMs: 1,
                  explanation: `Cache Miss (expired): Key '${op.key}' had expired.`,
                  type: "cache.miss",
                  cacheNodeId,
                  key: op.key,
                  reason: "expired",
                };
                events.push(missEvt);
              }
            } else {
              // Valid Active Hit
              isHit = true;
            }
          }

          if (isHit && entry) {
            metrics.hitCount++;
            entry.accessCount++;
            entry.lastAccessedAtMs = virtualClockMs;

            // Check if reading from lagging replica
            if (scenario.configuration.replicationConfig?.readRouting === "replica") {
              const replicaId = scenario.configuration.replicationConfig.replicaNodeIds[0];
              if (replicaId && distributedManager.isStaleRead(replicaId, op.key, entry.version || 1)) {
                isStale = true;
                metrics.staleReadsCount++;
              }
            }

            const hitEvt: CacheSimHitEvent = {
              id: `evt_hit_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 1,
              explanation: `Cache Hit! Key '${op.key}' retrieved in 1ms (v${entry.version}, accessed: ${entry.accessCount}x).${isStale ? " (Warning: Stale Read)" : ""}`,
              type: "cache.hit",
              cacheNodeId,
              key: op.key,
              value: entry.value,
              entryVersion: entry.version || 1,
              ttlRemainingMs: entry.expiresAtMs ? Math.max(0, entry.expiresAtMs - virtualClockMs) : 999999,
              isStaleRead: isStale,
            };
            events.push(hitEvt);
            virtualClockMs += 1;
          } else if (!isHit && entry === undefined) {
            // Absent Miss
            metrics.missCount++;
            const missEvt: CacheSimMissEvent = {
              id: `evt_miss_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 1,
              explanation: `Cache Miss: Key '${op.key}' is absent from cache memory.`,
              type: "cache.miss",
              cacheNodeId,
              key: op.key,
              reason: "absent",
            };
            events.push(missEvt);
            virtualClockMs += 1;

            if (scenario.configuration.coalescingConfig?.enabled) {
              const reqId = op.clientRequestId || op.id;
              metrics.databaseReadsCount++;
              const dbLookup = backingDb.query(op.key);
              const loadStartEvt: CacheSimLoadStartedEvent = {
                id: `evt_load_start_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: `Request '${reqId}' became single-flight leader for missing key '${op.key}'`,
                type: "cache.load.started",
                cacheNodeId,
                key: op.key,
                leaderRequestId: reqId,
              };
              events.push(loadStartEvt);
              inFlightLoads[op.key] = {
                key: op.key,
                leaderRequestId: reqId,
                startedAtMs: virtualClockMs,
                completesAtMs: virtualClockMs + 15,
                waitingRequestIds: [],
                dbValue: dbLookup.value,
              };
              virtualClockMs += 1;
              break;
            }
          }

          // 3. Fallback to Database & Cache Population if miss
          if (!isHit && (scenario.configuration.cachingStrategy === "cache_aside" || scenario.configuration.cachingStrategy === "read_through")) {
            metrics.databaseReadsCount++;
            virtualClockMs += 15; // Modeled DB roundtrip latency

            const dbLookup = backingDb.query(op.key);
            if (dbLookup.found) {
              // Check capacity before populating
              const currentEntriesCount = Object.keys(entries).length;
              if (currentEntriesCount >= scenario.configuration.capacity) {
                const capEvt: CacheSimCapacityExceededEvent = {
                  id: `evt_cap_${sequence}`,
                  sequence: sequence++,
                  atMs: virtualClockMs,
                  durationMs: 1,
                  explanation: `Cache capacity limit of ${scenario.configuration.capacity} entries reached. Invoking ${scenario.configuration.evictionPolicy.toUpperCase()} eviction.`,
                  type: "cache.capacity.exceeded",
                  cacheNodeId,
                  currentCount: currentEntriesCount,
                  maxCapacity: scenario.configuration.capacity,
                  unit: scenario.configuration.capacityUnit,
                };
                events.push(capEvt);

                // Evict victim
                const decision = EvictionManager.selectVictim(Object.values(entries), {
                  cacheNodeId,
                  virtualClockMs,
                  policy: scenario.configuration.evictionPolicy,
                  capacityLimit: scenario.configuration.capacity,
                  currentCount: currentEntriesCount,
                });
                lastEvictionDecision = decision;

                if (decision.victimKey && entries[decision.victimKey]) {
                  delete entries[decision.victimKey];
                  metrics.evictionCount++;

                  const victimEvt: CacheSimEvictionVictimSelectedEvent = {
                    id: `evt_vic_${sequence}`,
                    sequence: sequence++,
                    atMs: virtualClockMs,
                    durationMs: 1,
                    explanation: decision.reason,
                    type: "cache.eviction.victim.selected",
                    cacheNodeId,
                    victimKey: decision.victimKey,
                    policy: decision.policy,
                    reason: decision.reason,
                  };
                  events.push(victimEvt);

                  const evictEvt: CacheSimEntryEvictedEvent = {
                    id: `evt_evict_${sequence}`,
                    sequence: sequence++,
                    atMs: virtualClockMs,
                    durationMs: 1,
                    explanation: `Evicted key '${decision.victimKey}' from cache memory.`,
                    type: "cache.entry.evicted",
                    cacheNodeId,
                    key: decision.victimKey,
                    policy: decision.policy,
                    reason: decision.reason,
                  };
                  events.push(evictEvt);
                }
              }

              // Insert populated entry
              const ttlMs = scenario.configuration.defaultTtlMs;
              const newEntry: CacheEntry = {
                key: op.key,
                value: dbLookup.value,
                sizeBytes: 128,
                createdAtMs: virtualClockMs,
                expiresAtMs: virtualClockMs + ttlMs,
                lastAccessedAtMs: virtualClockMs,
                accessCount: 1,
                insertionSequence: insertionSeq++,
                version: 1,
              };
              entries[op.key] = newEntry;

              const createEvt: CacheSimEntryCreatedEvent = {
                id: `evt_create_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: `Populated cache entry for '${op.key}' from database fixture (TTL: ${ttlMs}ms)`,
                type: "cache.entry.created",
                cacheNodeId,
                key: op.key,
                sizeBytes: newEntry.sizeBytes,
                ttlMs,
              };
              events.push(createEvt);

              // Complete coalescing if leader
              if (scenario.configuration.coalescingConfig?.enabled) {
                const comp = coalescingManager.completeLoad(op.key, dbLookup.value);
                if (comp) {
                  const loadCompEvt: CacheSimLoadCompletedEvent = {
                    id: `evt_load_comp_${sequence}`,
                    sequence: sequence++,
                    atMs: virtualClockMs,
                    durationMs: 1,
                    explanation: `Single-flight load completed for '${op.key}', shared with ${comp.waitingRequestIds.length} waiting requests`,
                    type: "cache.load.completed",
                    cacheNodeId,
                    key: op.key,
                    coalescedCount: comp.waitingRequestIds.length + 1,
                  };
                  events.push(loadCompEvt);
                }
              }
            }
          }
          break;
        }

        case "SET": {
          const val = op.value ?? { data: "sample_value" };
          const ttlMs = op.ttlMs || scenario.configuration.defaultTtlMs;

          // 1. Handle Caching Strategy Write Behaviors
          if (scenario.configuration.cachingStrategy === "write_through") {
            backingDb.write(op.key, val);
            metrics.databaseWritesCount++;
            virtualClockMs += 10;
          } else if (scenario.configuration.cachingStrategy === "write_behind") {
            const flushInterval = scenario.configuration.writeBehindConfig?.flushIntervalMs || 200;
            const queueItem: WriteBehindQueueItem = {
              id: `wb_${sequence}_${op.key}`,
              key: op.key,
              value: val,
              queuedAtMs: virtualClockMs,
              flushAtMs: virtualClockMs + flushInterval,
              status: "queued",
              retryCount: 0,
            };
            writeBehindQueue.push(queueItem);

            const wbQueuedEvt: CacheSimWriteBehindQueuedEvent = {
              id: `evt_wb_q_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 1,
              explanation: `Write-Behind: Queued write for key '${op.key}' (queue depth: ${writeBehindQueue.length})`,
              type: "cache.writebehind.queued",
              cacheNodeId,
              key: op.key,
              queueLength: writeBehindQueue.length,
            };
            events.push(wbQueuedEvt);
          }

          // 2. Check Capacity & Eviction (if new key)
          const isNew = !entries[op.key];
          if (isNew && Object.keys(entries).length >= scenario.configuration.capacity) {
            const capEvt: CacheSimCapacityExceededEvent = {
              id: `evt_cap_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 1,
              explanation: `Capacity reached (${scenario.configuration.capacity} entries). Evaluating eviction.`,
              type: "cache.capacity.exceeded",
              cacheNodeId,
              currentCount: Object.keys(entries).length,
              maxCapacity: scenario.configuration.capacity,
              unit: scenario.configuration.capacityUnit,
            };
            events.push(capEvt);

            const decision = EvictionManager.selectVictim(Object.values(entries), {
              cacheNodeId,
              virtualClockMs,
              policy: scenario.configuration.evictionPolicy,
              capacityLimit: scenario.configuration.capacity,
              currentCount: Object.keys(entries).length,
            });
            lastEvictionDecision = decision;

            if (decision.victimKey && entries[decision.victimKey]) {
              delete entries[decision.victimKey];
              metrics.evictionCount++;

              const victimEvt: CacheSimEvictionVictimSelectedEvent = {
                id: `evt_vic_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: decision.reason,
                type: "cache.eviction.victim.selected",
                cacheNodeId,
                victimKey: decision.victimKey,
                policy: decision.policy,
                reason: decision.reason,
              };
              events.push(victimEvt);

              const evictEvt: CacheSimEntryEvictedEvent = {
                id: `evt_evict_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: `Evicted key '${decision.victimKey}' from cache.`,
                type: "cache.entry.evicted",
                cacheNodeId,
                key: decision.victimKey,
                policy: decision.policy,
                reason: decision.reason,
              };
              events.push(evictEvt);
            } else if (decision.policy === "noeviction") {
              const failEvt: CacheSimOperationFailedEvent = {
                id: `evt_op_fail_${sequence}`,
                sequence: sequence++,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: decision.reason,
                type: "cache.operation.failed",
                cacheNodeId,
                operationId: op.id,
                reason: "OOM: max memory reached, noeviction policy rejected SET",
              };
              events.push(failEvt);
              break;
            }
          }

          // 3. Store in Memory
          if (entries[op.key]) {
            const existing = entries[op.key];
            existing.value = val;
            existing.version = (existing.version || 1) + 1;
            existing.lastAccessedAtMs = virtualClockMs;
            existing.expiresAtMs = virtualClockMs + ttlMs;

            const updateEvt: CacheSimEntryUpdatedEvent = {
              id: `evt_update_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 1,
              explanation: `Updated entry for '${op.key}' (new version: v${existing.version})`,
              type: "cache.entry.updated",
              cacheNodeId,
              key: op.key,
              newVersion: existing.version,
              ttlMs,
            };
            events.push(updateEvt);

            // Schedule replication if replicas exist
            if (scenario.configuration.replicationConfig?.replicaNodeIds?.length) {
              const { event: repEvt } = distributedManager.scheduleReplication(
                op.key,
                existing,
                virtualClockMs,
                sequence++
              );
              events.push(repEvt);
            }
          } else {
            const newEntry: CacheEntry = {
              key: op.key,
              value: val,
              sizeBytes: 64,
              createdAtMs: virtualClockMs,
              expiresAtMs: virtualClockMs + ttlMs,
              lastAccessedAtMs: virtualClockMs,
              accessCount: 1,
              insertionSequence: insertionSeq++,
              version: 1,
            };
            entries[op.key] = newEntry;

            const createEvt: CacheSimEntryCreatedEvent = {
              id: `evt_create_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 1,
              explanation: `Created cache entry for '${op.key}' (TTL: ${ttlMs}ms)`,
              type: "cache.entry.created",
              cacheNodeId,
              key: op.key,
              sizeBytes: 64,
              ttlMs,
            };
            events.push(createEvt);

            if (scenario.configuration.replicationConfig?.replicaNodeIds?.length) {
              const { event: repEvt } = distributedManager.scheduleReplication(
                op.key,
                newEntry,
                virtualClockMs,
                sequence++
              );
              events.push(repEvt);
            }
          }

          const ttlEvt: CacheSimTtlAssignedEvent = {
            id: `evt_ttl_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Assigned TTL of ${ttlMs}ms (expires at ${virtualClockMs + ttlMs}ms)`,
            type: "cache.ttl.assigned",
            cacheNodeId,
            key: op.key,
            ttlMs,
            expiresAtMs: virtualClockMs + ttlMs,
          };
          events.push(ttlEvt);
          virtualClockMs += 1;
          break;
        }

        case "DELETE":
        case "INVALIDATE": {
          const reqEvt: CacheSimInvalidationRequestedEvent = {
            id: `evt_inv_req_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Invalidation requested for pattern/key '${op.key}'`,
            type: "cache.invalidation.requested",
            cacheNodeId,
            patternOrKey: op.key,
            cause: "Client explicit invalidation",
          };
          events.push(reqEvt);

          const targets = InvalidationManager.findInvalidationTargets(entries, op.key);
          for (const targetKey of targets) {
            delete entries[targetKey];
            metrics.invalidationCount++;

            const delEvt: CacheSimEntryDeletedEvent = {
              id: `evt_del_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 1,
              explanation: `Deleted / invalidated key '${targetKey}'`,
              type: "cache.entry.deleted",
              cacheNodeId,
              key: targetKey,
            };
            events.push(delEvt);
          }

          const appliedEvt: CacheSimInvalidationAppliedEvent = {
            id: `evt_inv_app_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Invalidation applied: ${targets.length} keys invalidated (${targets.join(", ") || "none"})`,
            type: "cache.invalidation.applied",
            cacheNodeId,
            invalidatedKeys: targets,
          };
          events.push(appliedEvt);
          virtualClockMs += 1;
          break;
        }

        default:
          break;
      }

      // Complete Operation
      const compEvt: CacheSimOperationCompletedEvent = {
        id: `evt_op_comp_${sequence}`,
        sequence: sequence++,
        atMs: virtualClockMs,
        durationMs: 1,
        explanation: `Completed operation ${op.type} on '${op.key}'`,
        type: "cache.operation.completed",
        cacheNodeId,
        operationId: op.id,
        resultOutcome: op.type === "GET" ? (entries[op.key] ? "hit" : "miss") : "set",
      };
      events.push(compEvt);
      virtualClockMs += 1;
    }

    // Flush any remaining in-flight loads
    flushCompletedLoads(Infinity);

    // 3. Flush Any Pending Write-Behind Queue
    if (writeBehindQueue.length > 0) {
      const flushStartEvt: CacheSimWriteBehindFlushStartedEvent = {
        id: `evt_wb_flush_start_${sequence}`,
        sequence: sequence++,
        atMs: virtualClockMs,
        durationMs: 2,
        explanation: `Write-Behind: Flushing ${writeBehindQueue.length} queued writes to persistent database...`,
        type: "cache.writebehind.flush.started",
        cacheNodeId,
        batchCount: writeBehindQueue.length,
      };
      events.push(flushStartEvt);
      virtualClockMs += 10;

      for (const item of writeBehindQueue) {
        backingDb.write(item.key, item.value);
        metrics.databaseWritesCount++;
        item.status = "flushed";
      }

      const flushCompEvt: CacheSimWriteBehindFlushCompletedEvent = {
        id: `evt_wb_flush_comp_${sequence}`,
        sequence: sequence++,
        atMs: virtualClockMs,
        durationMs: 2,
        explanation: `Write-Behind: Successfully flushed ${writeBehindQueue.length} writes to database.`,
        type: "cache.writebehind.flush.completed",
        cacheNodeId,
        flushedCount: writeBehindQueue.length,
      };
      events.push(flushCompEvt);
      virtualClockMs += 2;
    }

    // 4. Catch Up Remaining Replicas
    const finalRepEvents = distributedManager.catchUpReplicas(virtualClockMs + 300, () => sequence++);
    events.push(...finalRepEvents);

    // 5. Update Computed Metrics
    const totalLookups = metrics.hitCount + metrics.missCount;
    metrics.hitRate = totalLookups > 0 ? metrics.hitCount / totalLookups : 0;
    metrics.missRate = totalLookups > 0 ? metrics.missCount / totalLookups : 0;
    metrics.currentEntriesCount = Object.keys(entries).length;
    metrics.currentBytesUsed = Object.values(entries).reduce((sum, e) => sum + e.sizeBytes, 0);
    const capacityBytes = scenario.configuration.capacity * 128;
    metrics.memoryUtilizationPercent = Math.min(
      100,
      Math.round((metrics.currentBytesUsed / capacityBytes) * 100)
    );

    // 6. Assemble Modeled Cache Runtime State
    const cacheRuntimeState: ModeledCacheRuntimeState = {
      entries: { ...entries },
      replicas: distributedManager.getReplicas(),
      writeBehindQueue: [...writeBehindQueue],
      activeCoalescingGroups: coalescingManager.getInFlightGroups(),
      lastEvictionDecision,
      metrics,
    };

    const finalRuntimeState: ModeledRuntimeState = {
      ...baseRuntimeState,
      cacheState: cacheRuntimeState,
    };

    // 7. Create Visualization Frames
    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      frames.push({
        frameIndex: i,
        virtualTimeMs: evt.atMs,
        activeNodeIds: [cacheNodeId],
        activeEdgeIds: [],
        activeEvent: evt,
        direction: "request",
        stepTitle: evt.type.replace(/\./g, " ").toUpperCase(),
        stepExplanation: evt.explanation,
        runtimeState: finalRuntimeState,
        metrics: {
          cacheMetrics: {
            hits: metrics.hitCount,
            misses: metrics.missCount,
            evictions: metrics.evictionCount,
            coalescedRequests: metrics.coalescedRequestsCount,
            hitRate: metrics.hitRate,
            missRate: metrics.missRate,
            expirations: metrics.expirationCount,
            invalidations: metrics.invalidationCount,
            databaseReads: metrics.databaseReadsCount,
            databaseWrites: metrics.databaseWritesCount,
            currentEntries: metrics.currentEntriesCount,
            bytesUsed: metrics.currentBytesUsed,
            utilizationPercent: metrics.memoryUtilizationPercent,
            staleReads: metrics.staleReadsCount,
          },
        },
      });
    }

    return {
      runId: createDeterministicId("run_cache", `${scenario.id}:${cacheNodeId}`),
      architectureId: "arch_cache_sim",
      architectureRevisionId: "rev_001",
      snapshotHash: "hash_cache_001",
      createdAt: DETERMINISTIC_EPOCH_ISO,
      visitedNodeIds: [cacheNodeId],
      traversedEdgeIds: [],
      configuration: {
        version: 1,
        entryNodeId: cacheNodeId,
        request: {
          id: "req_cache_sim",
          method: "GET",
          path: "/cache/evaluate",
          headers: {},
        },
        routing: { mode: "deterministic", selectedBranches: {} },
        limits: { maxHops: 50, maxEvents: 5000, maxDurationMs: 30000 },
        timing: { nodeDurationMs: 10, edgeDurationMs: 5 },
      },
      events,
      totalDurationMs: virtualClockMs,
      totalEvents: events.length,
      totalHops: 1,
      outcome: "success",
      terminalReason: "Cache simulation completed successfully",
      frames,
    };
  }
}
