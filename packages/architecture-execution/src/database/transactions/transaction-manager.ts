import type {
  DatabaseTransaction,
  IsolationLevel,
  DatabaseRow,
  MVCCRowVersion,
} from "../database-schemas";
import { LockManager } from "./lock-manager";

export class TransactionManager {
  private transactions: Record<string, DatabaseTransaction> = {};
  private lockManager: LockManager;
  private mvccVersions: Record<string, MVCCRowVersion[]> = {}; // tableName -> versions

  constructor(lockManager: LockManager) {
    this.lockManager = lockManager;
  }

  public initialize(
    transactions: Record<string, DatabaseTransaction> = {},
    initialRows: Record<string, DatabaseRow[]> = {}
  ): void {
    this.transactions = { ...transactions };
    this.mvccVersions = {};

    // Seed baseline committed MVCC versions from fixtures
    for (const [table, rows] of Object.entries(initialRows)) {
      this.mvccVersions[table] = rows.map((row, idx) => ({
        rowId: String(row.id ?? idx + 1),
        tableName: table,
        data: { ...row },
        createdXmin: "tx_init",
        deletedXmax: null,
        createdAtMs: 0,
      }));
    }
  }

  public getTransactions(): Record<string, DatabaseTransaction> {
    return { ...this.transactions };
  }

  public getMvccVersions(): Record<string, MVCCRowVersion[]> {
    return { ...this.mvccVersions };
  }

  /**
   * Starts a new database transaction.
   */
  public beginTransaction(
    id: string,
    isolationLevel: IsolationLevel = "read_committed",
    atMs = 0,
    name?: string
  ): DatabaseTransaction {
    const tx: DatabaseTransaction = {
      id,
      name: name || id,
      isolationLevel,
      status: "active",
      startedAtMs: atMs,
      readSet: [],
      writeSet: [],
      heldLocks: [],
      operations: [
        {
          id: `op_${id}_begin`,
          type: "BEGIN",
          atMs,
        },
      ],
    };
    this.transactions[id] = tx;
    return tx;
  }

  /**
   * Commits a transaction: makes writes visible and releases all locks.
   */
  public commitTransaction(
    transactionId: string,
    atMs: number
  ): {
    transaction: DatabaseTransaction;
    unblockedWaits: { wait: import("../database-schemas").LockWait; grantedLock: import("../database-schemas").DatabaseLock }[];
  } {
    const tx = this.transactions[transactionId];
    if (!tx) {
      throw new Error(`Transaction "${transactionId}" does not exist.`);
    }

    tx.status = "committed";
    tx.completedAtMs = atMs;
    tx.operations.push({
      id: `op_${transactionId}_commit`,
      type: "COMMIT",
      atMs,
    });

    const { unblockedWaits } = this.lockManager.releaseTransactionLocks(transactionId, atMs);
    tx.heldLocks = [];

    return { transaction: tx, unblockedWaits };
  }

  public abortTransaction(
    transactionId: string,
    atMs: number,
    reason = "Transaction aborted"
  ) {
    return this.rollbackTransaction(transactionId, atMs, reason);
  }

  /**
   * Rolls back a transaction: discards uncommitted writes and releases locks.
   */
  public rollbackTransaction(
    transactionId: string,
    atMs: number,
    reason = "Transaction rolled back"
  ): {
    transaction: DatabaseTransaction;
    unblockedWaits: { wait: import("../database-schemas").LockWait; grantedLock: import("../database-schemas").DatabaseLock }[];
  } {
    const tx = this.transactions[transactionId];
    if (!tx) {
      throw new Error(`Transaction "${transactionId}" does not exist.`);
    }

    tx.status = "aborted";
    tx.completedAtMs = atMs;
    tx.operations.push({
      id: `op_${transactionId}_rollback`,
      type: "ROLLBACK",
      query: reason,
      atMs,
    });

    // Remove uncommitted MVCC versions created by this transaction
    for (const [table, versions] of Object.entries(this.mvccVersions)) {
      this.mvccVersions[table] = versions.filter((v) => v.createdXmin !== transactionId);
    }

    const { unblockedWaits } = this.lockManager.releaseTransactionLocks(transactionId, atMs);
    tx.heldLocks = [];

    return { transaction: tx, unblockedWaits };
  }

  /**
   * Records a row write under the transaction (creates new MVCC version).
   */
  public recordWrite(
    transactionId: string,
    tableName: string,
    rowId: string,
    data: DatabaseRow,
    atMs: number
  ): void {
    const tx = this.transactions[transactionId];
    if (tx) {
      const resourceId = `${tableName}:${rowId}`;
      if (!tx.writeSet.includes(resourceId)) {
        tx.writeSet.push(resourceId);
      }
    }

    if (!this.mvccVersions[tableName]) {
      this.mvccVersions[tableName] = [];
    }

    // Mark previous version as superseded
    const prev = this.mvccVersions[tableName].find((v) => v.rowId === rowId && v.deletedXmax === null);
    if (prev) {
      prev.deletedXmax = transactionId;
    }

    // Create new version
    this.mvccVersions[tableName].push({
      rowId,
      tableName,
      data: { ...data },
      createdXmin: transactionId,
      deletedXmax: null,
      createdAtMs: atMs,
    });
  }

  /**
   * Returns rows visible to the given transaction under its isolation level.
   */
  public getVisibleRows(
    tableName: string,
    transactionId?: string,
    isolationLevel: IsolationLevel = "read_committed",
    queryAtMs = 0
  ): DatabaseRow[] {
    const versions = this.mvccVersions[tableName] || [];
    const tx = transactionId ? this.transactions[transactionId] : undefined;
    const isolation = tx ? tx.isolationLevel : isolationLevel;

    const visibleRows: DatabaseRow[] = [];

    // Group by rowId, find the visible version
    const rowMap = new Map<string, MVCCRowVersion[]>();
    for (const v of versions) {
      if (!rowMap.has(v.rowId)) {
        rowMap.set(v.rowId, []);
      }
      rowMap.get(v.rowId)!.push(v);
    }

    for (const [, rowVersions] of rowMap.entries()) {
      // Sort newest first
      const sorted = [...rowVersions].sort((a, b) => b.createdAtMs - a.createdAtMs);
      for (const ver of sorted) {
        if (this.isVersionVisible(ver, tx, isolation, queryAtMs)) {
          visibleRows.push({ ...ver.data });
          break;
        }
      }
    }

    return visibleRows;
  }

  private isVersionVisible(
    ver: MVCCRowVersion,
    tx: DatabaseTransaction | undefined,
    isolation: IsolationLevel,
    queryAtMs: number
  ): boolean {
    // Check if creator is visible
    let creatorVisible = false;
    if (ver.createdXmin === "tx_init") {
      creatorVisible = true;
    } else if (tx && ver.createdXmin === tx.id) {
      creatorVisible = true;
    } else {
      const creatorTx = this.transactions[ver.createdXmin];
      if (creatorTx && creatorTx.status === "committed") {
        if (isolation === "repeatable_read") {
          creatorVisible = tx !== undefined && creatorTx.completedAtMs !== undefined
            ? creatorTx.completedAtMs <= tx.startedAtMs
            : true;
        } else {
          creatorVisible = creatorTx.completedAtMs !== undefined
            ? creatorTx.completedAtMs <= queryAtMs
            : true;
        }
      }
    }

    if (!creatorVisible) {
      return false;
    }

    // Check if superseded/deleted
    if (ver.deletedXmax === null) {
      return true;
    }

    // If current transaction deleted it, it is not visible to current transaction
    if (tx && ver.deletedXmax === tx.id) {
      return false;
    }

    // For other transactions, only invisible if deleter transaction has COMMITTED
    const deleterTx = this.transactions[ver.deletedXmax];
    if (!deleterTx || deleterTx.status !== "committed") {
      return true; // Deleter has not committed yet, so old version remains visible
    }

    if (isolation === "repeatable_read") {
      if (tx && deleterTx.completedAtMs !== undefined && deleterTx.completedAtMs > tx.startedAtMs) {
        return true;
      }
    } else {
      if (deleterTx.completedAtMs !== undefined && deleterTx.completedAtMs > queryAtMs) {
        return true;
      }
    }

    return false;
  }
}
