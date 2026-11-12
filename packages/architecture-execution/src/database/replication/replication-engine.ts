import type {
  ReplicationLogEntry,
  ReplicaState,
  DatabaseRow,
} from "../database-schemas";
import type {
  ReplicationChangeCreatedEvent,
  ReplicationChangeAppliedEvent,
  ReplicationLagUpdatedEvent,
} from "../database-events";

export class ReplicationEngine {
  private replicationLog: ReplicationLogEntry[] = [];
  private replicas: Record<string, ReplicaState> = {};
  private nextLsn = 1;
  private replicationDelayMs = 200;
  private primaryNodeId = "primary_db";
  private eventSeq = 1;

  constructor(
    primaryNodeId = "primary_db",
    replicaNodeIds: string[] = ["replica_db_1"],
    replicationDelayMs = 200
  ) {
    this.primaryNodeId = primaryNodeId;
    this.replicationDelayMs = replicationDelayMs;
    this.initializeReplicas(replicaNodeIds);
  }

  public initialize(
    log: ReplicationLogEntry[] = [],
    replicas: Record<string, ReplicaState> = {},
    primaryNodeId?: string,
    replicationDelayMs?: number
  ): void {
    this.replicationLog = [...log];
    this.replicas = { ...replicas };
    if (primaryNodeId) this.primaryNodeId = primaryNodeId;
    if (replicationDelayMs !== undefined) this.replicationDelayMs = replicationDelayMs;
    this.nextLsn = log.length > 0 ? Math.max(...log.map((e) => e.lsn)) + 1 : 1;
  }

  public initializeReplicas(replicaNodeIds: string[]): void {
    this.replicas = {};
    for (const id of replicaNodeIds) {
      this.replicas[id] = {
        replicaNodeId: id,
        role: "read_replica",
        lastAppliedLsn: 0,
        currentLagMs: 0,
        pendingChangesCount: 0,
        status: "healthy",
      };
    }
  }

  public getReplicationLog(): ReplicationLogEntry[] {
    return [...this.replicationLog];
  }

  public getReplicas(): Record<string, ReplicaState> {
    return { ...this.replicas };
  }

  public getPrimaryNodeId(): string {
    return this.primaryNodeId;
  }

  public getReplicationDelayMs(): number {
    return this.replicationDelayMs;
  }

  /**
   * Appends a change to the replication WAL log on primary write.
   */
  public logChange(
    transactionId: string,
    tableName: string,
    operation: "INSERT" | "UPDATE" | "DELETE",
    rowId: string,
    data: DatabaseRow,
    committedAtMs: number,
    sequence?: number
  ): { entry: ReplicationLogEntry; event: ReplicationChangeCreatedEvent } {
    const lsn = this.nextLsn++;
    const entry: ReplicationLogEntry = {
      lsn,
      transactionId,
      tableName,
      operation,
      rowId,
      data,
      committedAtMs,
    };
    this.replicationLog.push(entry);

    // Update pending changes count for each replica
    for (const replica of Object.values(this.replicas)) {
      replica.pendingChangesCount = this.replicationLog.filter(
        (e) => e.lsn > replica.lastAppliedLsn
      ).length;
      replica.currentLagMs = this.replicationDelayMs;
      if (replica.currentLagMs > 500) {
        replica.status = "lagging";
      }
    }

    const seq = sequence ?? this.eventSeq++;
    const event: ReplicationChangeCreatedEvent = {
      id: `evt_rep_create_${lsn}`,
      sequence: seq,
      atMs: committedAtMs,
      durationMs: 1,
      explanation: `WAL write: LSN ${lsn} ${operation} on ${tableName} (row: ${rowId})`,
      type: "replication.change.created",
      primaryNodeId: this.primaryNodeId,
      lsn,
      tableName,
      operation,
      rowId,
    };

    return { entry, event };
  }

  /**
   * Simulates catching up replicas to the current virtual clock.
   * Returns applied change events and lag updated events.
   */
  public catchUpReplicas(virtualClockMs: number, getNextSeq?: () => number): {
    appliedEvents: ReplicationChangeAppliedEvent[];
    lagEvents: ReplicationLagUpdatedEvent[];
  } {
    const appliedEvents: ReplicationChangeAppliedEvent[] = [];
    const lagEvents: ReplicationLagUpdatedEvent[] = [];
    const nextSeq = getNextSeq || (() => this.eventSeq++);

    for (const replica of Object.values(this.replicas)) {
      // Find entries that should be applied by now
      const dueEntries = this.replicationLog.filter(
        (e) =>
          e.lsn > replica.lastAppliedLsn &&
          e.committedAtMs + this.replicationDelayMs <= virtualClockMs
      );

      for (const entry of dueEntries) {
        replica.lastAppliedLsn = entry.lsn;
        appliedEvents.push({
          id: `evt_rep_apply_${replica.replicaNodeId}_${entry.lsn}`,
          sequence: nextSeq(),
          atMs: entry.committedAtMs + this.replicationDelayMs,
          durationMs: 2,
          explanation: `Replica ${replica.replicaNodeId} applied LSN ${entry.lsn} (${entry.operation} on ${entry.tableName})`,
          type: "replication.change.applied",
          replicaNodeId: replica.replicaNodeId,
          lsn: entry.lsn,
          lagMs: this.replicationDelayMs,
        });
      }

      // Re-calculate remaining pending and current lag
      const pending = this.replicationLog.filter(
        (e) => e.lsn > replica.lastAppliedLsn
      );
      replica.pendingChangesCount = pending.length;
      if (pending.length === 0) {
        replica.currentLagMs = 0;
        replica.status = "healthy";
      } else {
        const oldestPending = pending[0];
        replica.currentLagMs = Math.max(0, virtualClockMs - oldestPending.committedAtMs);
        replica.status = replica.currentLagMs > 500 ? "lagging" : "healthy";
      }

      lagEvents.push({
        id: `evt_rep_lag_${replica.replicaNodeId}_${virtualClockMs}`,
        sequence: nextSeq(),
        atMs: virtualClockMs,
        durationMs: 1,
        explanation: `Replica ${replica.replicaNodeId} lag: ${replica.currentLagMs}ms (${replica.pendingChangesCount} changes pending)`,
        type: "replication.lag.updated",
        replicaNodeId: replica.replicaNodeId,
        currentLagMs: replica.currentLagMs,
        pendingChangesCount: replica.pendingChangesCount,
      });
    }

    return { appliedEvents, lagEvents };
  }

  /**
   * Evaluates if a read on a replica at a given virtual clock time will result in a stale read.
   */
  public isStaleRead(replicaNodeId: string, virtualClockMs: number): boolean {
    const replica = this.replicas[replicaNodeId];
    if (!replica) return false;

    // If there are unapplied changes that were committed before this read, it's a stale read
    const unappliedCommitted = this.replicationLog.some(
      (e) => e.lsn > replica.lastAppliedLsn && e.committedAtMs <= virtualClockMs
    );

    return unappliedCommitted;
  }
}
