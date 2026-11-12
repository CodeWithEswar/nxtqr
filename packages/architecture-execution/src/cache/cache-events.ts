import type { BaseExecutionEvent } from "../domain/execution-event";
import type { EvictionPolicyType, CapacityUnit } from "./cache-schemas";

export interface CacheSimOperationStartedEvent extends BaseExecutionEvent {
  type: "cache.operation.started";
  cacheNodeId: string;
  operationId: string;
  opType: string;
  key: string;
}

export interface CacheSimLookupStartedEvent extends BaseExecutionEvent {
  type: "cache.lookup.started";
  cacheNodeId: string;
  key: string;
}

export interface CacheSimHitEvent extends BaseExecutionEvent {
  type: "cache.hit";
  cacheNodeId: string;
  key: string;
  value: unknown;
  entryVersion: number;
  ttlRemainingMs: number;
  isStaleRead?: boolean;
}

export interface CacheSimMissEvent extends BaseExecutionEvent {
  type: "cache.miss";
  cacheNodeId: string;
  key: string;
  reason: "absent" | "expired" | "invalidated" | "evicted";
}

export interface CacheSimEntryCreatedEvent extends BaseExecutionEvent {
  type: "cache.entry.created";
  cacheNodeId: string;
  key: string;
  sizeBytes: number;
  ttlMs?: number;
}

export interface CacheSimEntryUpdatedEvent extends BaseExecutionEvent {
  type: "cache.entry.updated";
  cacheNodeId: string;
  key: string;
  newVersion: number;
  ttlMs?: number;
}

export interface CacheSimEntryDeletedEvent extends BaseExecutionEvent {
  type: "cache.entry.deleted";
  cacheNodeId: string;
  key: string;
}

export interface CacheSimEntryExpiredEvent extends BaseExecutionEvent {
  type: "cache.entry.expired";
  cacheNodeId: string;
  key: string;
  expiredAtMs: number;
}

export interface CacheSimCapacityExceededEvent extends BaseExecutionEvent {
  type: "cache.capacity.exceeded";
  cacheNodeId: string;
  currentCount: number;
  maxCapacity: number;
  unit: CapacityUnit;
}

export interface CacheSimEvictionVictimSelectedEvent extends BaseExecutionEvent {
  type: "cache.eviction.victim.selected";
  cacheNodeId: string;
  victimKey: string;
  policy: EvictionPolicyType;
  reason: string;
}

export interface CacheSimEntryEvictedEvent extends BaseExecutionEvent {
  type: "cache.entry.evicted";
  cacheNodeId: string;
  key: string;
  policy: EvictionPolicyType;
  reason: string;
}

export interface CacheSimTtlAssignedEvent extends BaseExecutionEvent {
  type: "cache.ttl.assigned";
  cacheNodeId: string;
  key: string;
  ttlMs: number;
  expiresAtMs: number;
}

export interface CacheSimTtlRefreshedEvent extends BaseExecutionEvent {
  type: "cache.ttl.refreshed";
  cacheNodeId: string;
  key: string;
  newExpiresAtMs: number;
}

export interface CacheSimInvalidationRequestedEvent extends BaseExecutionEvent {
  type: "cache.invalidation.requested";
  cacheNodeId: string;
  patternOrKey: string;
  cause: string;
}

export interface CacheSimInvalidationAppliedEvent extends BaseExecutionEvent {
  type: "cache.invalidation.applied";
  cacheNodeId: string;
  invalidatedKeys: string[];
}

export interface CacheSimInvalidationFailedEvent extends BaseExecutionEvent {
  type: "cache.invalidation.failed";
  cacheNodeId: string;
  reason: string;
}

export interface CacheSimWriteBehindQueuedEvent extends BaseExecutionEvent {
  type: "cache.writebehind.queued";
  cacheNodeId: string;
  key: string;
  queueLength: number;
}

export interface CacheSimWriteBehindFlushStartedEvent extends BaseExecutionEvent {
  type: "cache.writebehind.flush.started";
  cacheNodeId: string;
  batchCount: number;
}

export interface CacheSimWriteBehindFlushCompletedEvent extends BaseExecutionEvent {
  type: "cache.writebehind.flush.completed";
  cacheNodeId: string;
  flushedCount: number;
}

export interface CacheSimWriteBehindFlushFailedEvent extends BaseExecutionEvent {
  type: "cache.writebehind.flush.failed";
  cacheNodeId: string;
  reason: string;
  dataLossRisk: boolean;
}

export interface CacheSimLoadStartedEvent extends BaseExecutionEvent {
  type: "cache.load.started";
  cacheNodeId: string;
  key: string;
  leaderRequestId: string;
}

export interface CacheSimLoadCoalescedEvent extends BaseExecutionEvent {
  type: "cache.load.coalesced";
  cacheNodeId: string;
  key: string;
  followerRequestId: string;
  leaderRequestId: string;
}

export interface CacheSimLoadCompletedEvent extends BaseExecutionEvent {
  type: "cache.load.completed";
  cacheNodeId: string;
  key: string;
  coalescedCount: number;
}

export interface CacheSimLoadFailedEvent extends BaseExecutionEvent {
  type: "cache.load.failed";
  cacheNodeId: string;
  key: string;
  reason: string;
}

export interface CacheSimReplicationScheduledEvent extends BaseExecutionEvent {
  type: "cache.replication.scheduled";
  primaryNodeId: string;
  key: string;
  version: number;
  delayMs: number;
}

export interface CacheSimReplicationSentEvent extends BaseExecutionEvent {
  type: "cache.replication.sent";
  primaryNodeId: string;
  replicaNodeId: string;
  key: string;
}

export interface CacheSimReplicationReceivedEvent extends BaseExecutionEvent {
  type: "cache.replication.received";
  replicaNodeId: string;
  key: string;
  version: number;
}

export interface CacheSimReplicationAppliedEvent extends BaseExecutionEvent {
  type: "cache.replication.applied";
  replicaNodeId: string;
  key: string;
  version: number;
  lagMs: number;
}

export interface CacheSimReplicationFailedEvent extends BaseExecutionEvent {
  type: "cache.replication.failed";
  replicaNodeId: string;
  key: string;
  reason: string;
}

export interface CacheSimOperationCompletedEvent extends BaseExecutionEvent {
  type: "cache.operation.completed";
  cacheNodeId: string;
  operationId: string;
  resultOutcome: "hit" | "miss" | "set" | "deleted" | "expired" | "evicted";
}

export interface CacheSimOperationFailedEvent extends BaseExecutionEvent {
  type: "cache.operation.failed";
  cacheNodeId: string;
  operationId: string;
  reason: string;
}

export type CacheExecutionEvent =
  | CacheSimOperationStartedEvent
  | CacheSimLookupStartedEvent
  | CacheSimHitEvent
  | CacheSimMissEvent
  | CacheSimEntryCreatedEvent
  | CacheSimEntryUpdatedEvent
  | CacheSimEntryDeletedEvent
  | CacheSimEntryExpiredEvent
  | CacheSimCapacityExceededEvent
  | CacheSimEvictionVictimSelectedEvent
  | CacheSimEntryEvictedEvent
  | CacheSimTtlAssignedEvent
  | CacheSimTtlRefreshedEvent
  | CacheSimInvalidationRequestedEvent
  | CacheSimInvalidationAppliedEvent
  | CacheSimInvalidationFailedEvent
  | CacheSimWriteBehindQueuedEvent
  | CacheSimWriteBehindFlushStartedEvent
  | CacheSimWriteBehindFlushCompletedEvent
  | CacheSimWriteBehindFlushFailedEvent
  | CacheSimLoadStartedEvent
  | CacheSimLoadCoalescedEvent
  | CacheSimLoadCompletedEvent
  | CacheSimLoadFailedEvent
  | CacheSimReplicationScheduledEvent
  | CacheSimReplicationSentEvent
  | CacheSimReplicationReceivedEvent
  | CacheSimReplicationAppliedEvent
  | CacheSimReplicationFailedEvent
  | CacheSimOperationCompletedEvent
  | CacheSimOperationFailedEvent;
