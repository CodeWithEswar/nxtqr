import type {
  DatabaseLock,
  LockWait,
  LockMode,
} from "../database-schemas";

export interface LockAcquisitionResult {
  granted: boolean;
  lock?: DatabaseLock;
  wait?: LockWait;
  reason?: string;
}

export class LockManager {
  private activeLocks: DatabaseLock[] = [];
  private lockWaits: LockWait[] = [];
  private lockCounter = 1;

  public initialize(locks: DatabaseLock[] = [], waits: LockWait[] = []): void {
    this.activeLocks = [...locks];
    this.lockWaits = [...waits];
  }

  public getActiveLocks(): DatabaseLock[] {
    return [...this.activeLocks];
  }

  public getActiveWaits(): LockWait[] {
    return [...this.lockWaits];
  }

  /**
   * Attempts to acquire a row-level lock on a resource (e.g. "products:42").
   * Enforces Shared vs Exclusive lock compatibility.
   */
  public acquireLock(
    transactionId: string,
    resourceId: string,
    tableName: string,
    requestedMode: LockMode,
    atMs: number
  ): LockAcquisitionResult {
    // 1. Check if this transaction already holds an equal or stronger lock
    const existingOwnLock = this.activeLocks.find(
      (l) => l.transactionId === transactionId && l.resourceId === resourceId
    );

    if (existingOwnLock) {
      if (existingOwnLock.mode === requestedMode || existingOwnLock.mode === "exclusive") {
        return { granted: true, lock: existingOwnLock };
      }
      // Upgrade from Shared to Exclusive: check if any other transaction holds a lock
      const otherHolders = this.activeLocks.filter(
        (l) => l.resourceId === resourceId && l.transactionId !== transactionId
      );
      if (otherHolders.length > 0) {
        const wait: LockWait = {
          transactionId,
          resourceId,
          requestedMode,
          waitingForTransactionId: otherHolders[0].transactionId,
          waitingSinceMs: atMs,
        };
        this.lockWaits.push(wait);
        return {
          granted: false,
          wait,
          reason: `Lock upgrade conflict on resource "${resourceId}". Waiting for transaction "${otherHolders[0].transactionId}".`,
        };
      } else {
        existingOwnLock.mode = "exclusive";
        return { granted: true, lock: existingOwnLock };
      }
    }

    // 2. Check conflicts with other transactions
    const conflictingLocks = this.activeLocks.filter((l) => {
      if (l.resourceId !== resourceId || l.transactionId === transactionId) return false;
      // Exclusive locks conflict with everything. Shared locks conflict with Exclusive.
      if (requestedMode === "exclusive" || l.mode === "exclusive") return true;
      return false;
    });

    if (conflictingLocks.length > 0) {
      const wait: LockWait = {
        transactionId,
        resourceId,
        requestedMode,
        waitingForTransactionId: conflictingLocks[0].transactionId,
        waitingSinceMs: atMs,
      };
      this.lockWaits.push(wait);
      return {
        granted: false,
        wait,
        reason: `Lock conflict on resource "${resourceId}". Mode ${requestedMode.toUpperCase()} conflicts with ${conflictingLocks[0].mode.toUpperCase()} held by "${conflictingLocks[0].transactionId}".`,
      };
    }

    // 3. Grant Lock
    const newLock: DatabaseLock = {
      id: `lock_${this.lockCounter++}`,
      transactionId,
      resourceId,
      tableName,
      mode: requestedMode,
      grantedAtMs: atMs,
    };
    this.activeLocks.push(newLock);
    return { granted: true, lock: newLock };
  }

  /**
   * Releases all locks held by a transaction (called upon COMMIT or ROLLBACK).
   * Checks if any waiting transactions can now be granted locks.
   */
  public releaseTransactionLocks(
    transactionId: string,
    atMs: number
  ): {
    releasedLocks: DatabaseLock[];
    unblockedWaits: { wait: LockWait; grantedLock: DatabaseLock }[];
  } {
    const releasedLocks = this.activeLocks.filter((l) => l.transactionId === transactionId);
    this.activeLocks = this.activeLocks.filter((l) => l.transactionId !== transactionId);
    this.lockWaits = this.lockWaits.filter((w) => w.transactionId !== transactionId);

    const unblockedWaits: { wait: LockWait; grantedLock: DatabaseLock }[] = [];

    // Check waiting transactions to see if they can now be granted
    const remainingWaits = [...this.lockWaits];
    for (const wait of remainingWaits) {
      const res = this.acquireLock(
        wait.transactionId,
        wait.resourceId,
        "",
        wait.requestedMode,
        atMs
      );
      if (res.granted && res.lock) {
        this.lockWaits = this.lockWaits.filter(
          (w) => !(w.transactionId === wait.transactionId && w.resourceId === wait.resourceId)
        );
        unblockedWaits.push({ wait, grantedLock: res.lock });
      }
    }

    return { releasedLocks, unblockedWaits };
  }
}

