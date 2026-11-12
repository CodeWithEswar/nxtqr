import type {
  CacheEntry,
  CacheReplicaState,
} from "../cache-schemas";
import type {
  CacheSimReplicationScheduledEvent,
  CacheSimReplicationAppliedEvent,
} from "../cache-events";

export interface PendingReplicationItem {
  id: string;
  key: string;
  entry: CacheEntry;
  version: number;
  primaryNodeId: string;
  scheduledAtMs: number;
  applyAtMs: number;
}

export class DistributedCacheManager {
  private primaryNodeId: string;
  private replicas: Record<string, CacheReplicaState> = {};
  private pendingReplications: PendingReplicationItem[] = [];
  private replicationDelayMs = 150;
  private eventSeq = 1;

  constructor(
    primaryNodeId = "cache_primary",
    replicaIds: string[] | number = ["cache_replica_1"],
    delayMs = 150
  ) {
    this.primaryNodeId = primaryNodeId;
    this.replicationDelayMs = delayMs;
    const resolvedIds = typeof replicaIds === "number"
      ? Array.from({ length: replicaIds }, (_, i) => `${primaryNodeId}-replica-${i + 1}`)
      : replicaIds;
    this.initializeReplicas(resolvedIds);
  }

  public initializeReplicas(replicaIds: string[]): void {
    this.replicas = {};
    for (const rId of replicaIds) {
      this.replicas[rId] = {
        replicaId: rId,
        primaryNodeId: this.primaryNodeId,
        entries: {},
        lastAppliedVersion: 0,
        currentLagMs: 0,
        pendingReplicationCount: 0,
        status: "healthy",
      };
    }
  }

  public scheduleReplication(
    key: string,
    entry: CacheEntry,
    virtualClockMs: number,
    sequence?: number
  ): { item: PendingReplicationItem; event: CacheSimReplicationScheduledEvent } {
    const seq = sequence ?? this.eventSeq++;
    const item: PendingReplicationItem = {
      id: `rep_${seq}_${key}`,
      key,
      entry: { ...entry },
      version: entry.version || 1,
      primaryNodeId: this.primaryNodeId,
      scheduledAtMs: virtualClockMs,
      applyAtMs: virtualClockMs + this.replicationDelayMs,
    };
    this.pendingReplications.push(item);

    for (const rep of Object.values(this.replicas)) {
      rep.pendingReplicationCount++;
      rep.currentLagMs = this.replicationDelayMs;
      if (rep.currentLagMs > 300) {
        rep.status = "lagging";
      }
    }
    const event: CacheSimReplicationScheduledEvent = {
      id: `evt_rep_sched_${item.id}`,
      sequence: seq,
      atMs: virtualClockMs,
      durationMs: 1,
      explanation: `Replication scheduled for key '${key}' (v${item.version}) to replicas with modeled lag +${this.replicationDelayMs}ms`,
      type: "cache.replication.scheduled",
      primaryNodeId: this.primaryNodeId,
      key,
      version: item.version,
      delayMs: this.replicationDelayMs,
    };

    return { item, event };
  }

  public catchUpReplicas(
    virtualClockMs: number,
    getNextSeq?: () => number
  ): CacheSimReplicationAppliedEvent[] {
    const appliedEvents: CacheSimReplicationAppliedEvent[] = [];
    const nextSeq = getNextSeq || (() => this.eventSeq++);

    const dueItems = this.pendingReplications.filter((i) => i.applyAtMs <= virtualClockMs);
    for (const item of dueItems) {
      for (const rep of Object.values(this.replicas)) {
        rep.entries[item.key] = { ...item.entry };
        rep.lastAppliedVersion = Math.max(rep.lastAppliedVersion, item.version);
        rep.pendingReplicationCount = Math.max(0, rep.pendingReplicationCount - 1);
        rep.currentLagMs = rep.pendingReplicationCount === 0 ? 0 : this.replicationDelayMs;
        rep.status = rep.currentLagMs > 300 ? "lagging" : "healthy";

        appliedEvents.push({
          id: `evt_rep_app_${rep.replicaId}_${item.key}_${item.version}`,
          sequence: nextSeq(),
          atMs: item.applyAtMs,
          durationMs: 1,
          explanation: `Replica '${rep.replicaId}' applied replication for '${item.key}' (version: ${item.version})`,
          type: "cache.replication.applied",
          replicaNodeId: rep.replicaId,
          key: item.key,
          version: item.version,
          lagMs: this.replicationDelayMs,
        });
      }
    }

    this.pendingReplications = this.pendingReplications.filter((i) => i.applyAtMs > virtualClockMs);
    return appliedEvents;
  }

  public isStaleRead(replicaId: string, key: string, primaryVersion: number): boolean {
    const rep = this.replicas[replicaId];
    if (!rep) return false;
    const repEntry = rep.entries[key];
    const repVersion = repEntry?.version ?? 0;
    return repVersion < primaryVersion;
  }

  public getReplicas(): Record<string, CacheReplicaState> {
    return { ...this.replicas };
  }

  public getPendingReplications(): PendingReplicationItem[] {
    return [...this.pendingReplications];
  }
}

export class ShardRouter {
  /**
   * Deterministic FNV-1a 32-bit hash function for consistent key distribution.
   */
  public static hashKey(key: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  /**
   * Routes a cache key to a specific shard index.
   */
  public static routeKey(
    key: string,
    shardsCount = 3
  ): { shardIndex: number; shardNodeId: string; hash: number } {
    if (shardsCount <= 1) {
      return { shardIndex: 0, shardNodeId: "cache_shard_0", hash: 0 };
    }
    const hash = this.hashKey(key);
    const shardIndex = hash % shardsCount;
    return {
      shardIndex,
      shardNodeId: `cache_shard_${shardIndex}`,
      hash,
    };
  }
}
