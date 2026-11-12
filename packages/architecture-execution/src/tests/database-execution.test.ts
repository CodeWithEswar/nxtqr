import { describe, it, expect } from "vitest";
import {
  SqlParser,
  AstValidator,
  PhysicalPlanner,
  LockManager,
  DeadlockDetector,
  TransactionManager,
  ReplicationEngine,
  ConnectionPoolManager,
  createDatabasePresetScenario,
  DatabaseExecutionEngine,
  SAMPLE_DATABASE_SCHEMA,
  SAMPLE_DATABASE_FIXTURES,
} from "../index";

describe("Phase 05.4.6: Database Query Execution & Concurrency Engine", () => {
  describe("1. SQL Parser", () => {
    it("parses SELECT query with WHERE filter, ORDER BY, and LIMIT", () => {
      const sql = "SELECT id, name FROM products WHERE id = 42 ORDER BY name DESC LIMIT 10;";
      const result = SqlParser.safeParse(sql);
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.ast?.type).toBe("SELECT");
      expect(result.ast?.table).toBe("products");
      expect(result.ast?.columns).toEqual(["id", "name"]);
      expect(result.ast?.where?.leftColumn).toBe("id");
      expect(result.ast?.where?.rightValue).toBe(42);
      expect(result.ast?.orderBy?.[0].column).toBe("name");
      expect(result.ast?.orderBy?.[0].direction).toBe("DESC");
      expect(result.ast?.limit).toBe(10);
    });

    it("parses INNER JOIN syntax correctly", () => {
      const sql = "SELECT users.name, orders.total FROM users INNER JOIN orders ON users.id = orders.user_id;";
      const result = SqlParser.safeParse(sql);
      expect(result.success).toBe(true);
      expect(result.ast?.joins).toHaveLength(1);
      expect(result.ast?.joins?.[0].type).toBe("INNER");
      expect(result.ast?.joins?.[0].table).toBe("orders");
      expect(result.ast?.joins?.[0].on.leftColumn).toBe("id");
      expect(result.ast?.joins?.[0].on.rightColumn).toBe("user_id");
    });

    it("parses UPDATE statement with SET and WHERE", () => {
      const sql = "UPDATE accounts SET balance = 4900 WHERE id = 1;";
      const result = SqlParser.safeParse(sql);
      expect(result.success).toBe(true);
      expect(result.ast?.type).toBe("UPDATE");
      expect(result.ast?.table).toBe("accounts");
      expect(result.ast?.updateSet?.balance).toBe(4900);
      expect(result.ast?.where?.leftColumn).toBe("id");
      expect(result.ast?.where?.rightValue).toBe(1);
    });

    it("returns error for unsupported or malformed SQL", () => {
      const result = SqlParser.safeParse("DROP DATABASE production;");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unsupported SQL query command");
    });
  });

  describe("2. AST Validator", () => {
    it("validates valid query against schema successfully", () => {
      const parsed = SqlParser.safeParse("SELECT * FROM products WHERE id = 42;");
      expect(parsed.ast).toBeDefined();
      const errors = AstValidator.validate(parsed.ast!, SAMPLE_DATABASE_SCHEMA);
      expect(errors).toHaveLength(0);
    });

    it("detects non-existent table error", () => {
      const parsed = SqlParser.safeParse("SELECT * FROM non_existent_table;");
      expect(parsed.ast).toBeDefined();
      const errors = AstValidator.validate(parsed.ast!, SAMPLE_DATABASE_SCHEMA);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("non_existent_table");
    });

    it("detects non-existent column in WHERE clause", () => {
      const parsed = SqlParser.safeParse("SELECT * FROM products WHERE imaginary_col = 123;");
      expect(parsed.ast).toBeDefined();
      const errors = AstValidator.validate(parsed.ast!, SAMPLE_DATABASE_SCHEMA);
      expect(errors.some((e) => e.message.includes("imaginary_col"))).toBe(true);
    });
  });

  describe("3. Physical Planner & Cost Model", () => {
    it("selects IndexScan for primary key lookup", () => {
      const parsed = SqlParser.safeParse("SELECT * FROM products WHERE id = 42;");
      const plan = PhysicalPlanner.plan(
        "q_test_pk",
        parsed.ast!,
        SAMPLE_DATABASE_SCHEMA,
        SAMPLE_DATABASE_FIXTURES
      );
      const scanOp = Object.values(plan.operators).find((o) => o.logicalOperator === "Scan");
      expect(scanOp).toBeDefined();
      expect(scanOp?.physicalOperator).toBe("IndexScan");
      expect(scanOp?.indexName).toBe("products_pkey");
      expect(scanOp?.cost.indexProbes).toBe(1);
    });

    it("selects SeqScan when filtering on non-indexed column", () => {
      const parsed = SqlParser.safeParse("SELECT * FROM orders WHERE status = 'shipped';");
      const plan = PhysicalPlanner.plan(
        "q_test_seq",
        parsed.ast!,
        SAMPLE_DATABASE_SCHEMA,
        SAMPLE_DATABASE_FIXTURES
      );
      const scanOp = Object.values(plan.operators).find((o) => o.logicalOperator === "Scan");
      expect(scanOp).toBeDefined();
      expect(scanOp?.physicalOperator).toBe("SeqScan");
      expect(scanOp?.cost.rowVisits).toBe(SAMPLE_DATABASE_FIXTURES.orders.length);
    });

    it("selects NestedLoopJoin for joined query with small dataset", () => {
      const parsed = SqlParser.safeParse(
        "SELECT users.name, orders.total FROM users INNER JOIN orders ON users.id = orders.user_id;"
      );
      const plan = PhysicalPlanner.plan(
        "q_test_join",
        parsed.ast!,
        SAMPLE_DATABASE_SCHEMA,
        SAMPLE_DATABASE_FIXTURES
      );
      const joinOp = Object.values(plan.operators).find((o) => o.logicalOperator === "Join");
      expect(joinOp).toBeDefined();
      expect(joinOp?.physicalOperator).toBe("NestedLoopJoin");
    });
  });

  describe("4. Transactions & MVCC Visibility", () => {
    it("manages transaction commit and MVCC row versions", () => {
      const lockManager = new LockManager();
      const txManager = new TransactionManager(lockManager);
      txManager.initialize({}, SAMPLE_DATABASE_FIXTURES);

      const tx = txManager.beginTransaction("tx_1", "read_committed", 10, "Test Commit");
      expect(tx.status).toBe("active");

      // Write new version
      txManager.recordWrite("tx_1", "accounts", "1", { id: 1, name: "Primary Checking", balance: 4500.0 }, 20);

      // Before commit, uncommitted write should not be visible to other transactions
      const visibleBefore = txManager.getVisibleRows("accounts", "tx_2", "read_committed", 25);
      const acc1Before = visibleBefore.find((r) => r.id === 1);
      expect(acc1Before?.balance).toBe(5000.0);

      // Commit transaction
      txManager.commitTransaction("tx_1", 30);
      expect(txManager.getTransactions().tx_1.status).toBe("committed");

      // After commit, new version is visible
      const visibleAfter = txManager.getVisibleRows("accounts", "tx_2", "read_committed", 35);
      const acc1After = visibleAfter.find((r) => r.id === 1);
      expect(acc1After?.balance).toBe(4500.0);
    });

    it("discards uncommitted row versions on transaction rollback", () => {
      const lockManager = new LockManager();
      const txManager = new TransactionManager(lockManager);
      txManager.initialize({}, SAMPLE_DATABASE_FIXTURES);

      txManager.beginTransaction("tx_roll", "read_committed", 10);
      txManager.recordWrite("tx_roll", "inventory", "10", { id: 10, sku: "SKU-PRO-42", stock: 100 }, 20);

      // Rollback
      txManager.rollbackTransaction("tx_roll", 30);
      expect(txManager.getTransactions().tx_roll.status).toBe("aborted");

      // Original stock 150 remains
      const visible = txManager.getVisibleRows("inventory", "tx_other", "read_committed", 40);
      const item = visible.find((r) => r.id === 10);
      expect(item?.stock).toBe(150);
    });
  });

  describe("5. Lock Manager & Deadlock Detector", () => {
    it("handles lock contention between transactions", () => {
      const lockMgr = new LockManager();

      // Tx1 acquires Exclusive lock on accounts:1
      const acq1 = lockMgr.acquireLock("tx_1", "accounts:1", "accounts", "exclusive", 10);
      expect(acq1.granted).toBe(true);

      // Tx2 attempts to acquire Exclusive lock on accounts:1 -> blocked into wait
      const acq2 = lockMgr.acquireLock("tx_2", "accounts:1", "accounts", "exclusive", 15);
      expect(acq2.granted).toBe(false);
      expect(acq2.wait).toBeDefined();
      expect(acq2.wait?.waitingForTransactionId).toBe("tx_1");
      expect(lockMgr.getActiveWaits()).toHaveLength(1);

      // Tx1 releases locks -> Tx2 unblocked
      const { releasedLocks, unblockedWaits } = lockMgr.releaseTransactionLocks("tx_1", 20);
      expect(releasedLocks).toHaveLength(1);
      expect(unblockedWaits).toHaveLength(1);
      expect(unblockedWaits[0].wait.transactionId).toBe("tx_2");
    });

    it("detects deadlock cycle and deterministically selects youngest victim", () => {
      const lockMgr = new LockManager();
      const txManager = new TransactionManager(lockMgr);

      txManager.beginTransaction("tx_A", "read_committed", 10);
      txManager.beginTransaction("tx_B", "read_committed", 20);

      lockMgr.acquireLock("tx_A", "accounts:1", "accounts", "exclusive", 12);
      lockMgr.acquireLock("tx_B", "accounts:2", "accounts", "exclusive", 22);

      // Tx_A waits for accounts:2 (held by tx_B)
      lockMgr.acquireLock("tx_A", "accounts:2", "accounts", "exclusive", 30);
      // Tx_B waits for accounts:1 (held by tx_A)
      lockMgr.acquireLock("tx_B", "accounts:1", "accounts", "exclusive", 35);

      const deadlock = DeadlockDetector.detectDeadlock(
        lockMgr.getActiveWaits(),
        txManager.getTransactions(),
        40
      );

      expect(deadlock).not.toBeNull();
      expect(deadlock?.cycle).toContain("tx_A");
      expect(deadlock?.cycle).toContain("tx_B");
      // Youngest is tx_B (started at 20 vs 10)
      expect(deadlock?.selectedVictimTransactionId).toBe("tx_B");
    });
  });

  describe("6. Replication Engine & Connection Pool", () => {
    it("logs WAL changes and computes replica lag", () => {
      const repEngine = new ReplicationEngine("primary_db", ["replica_1"], 200);

      const { entry, event } = repEngine.logChange("tx_1", "products", "INSERT", "47", { id: 47 }, 100);
      expect(entry.lsn).toBe(1);
      expect(event.type).toBe("replication.change.created");

      // Before replication delay (e.g. at 150ms), replica is lagging
      expect(repEngine.isStaleRead("replica_1", 150)).toBe(true);

      // At 305ms, catchup applies changes
      const { appliedEvents } = repEngine.catchUpReplicas(305);
      expect(appliedEvents.length).toBeGreaterThan(0);
      expect(appliedEvents[0].lsn).toBe(1);

      // Now replica is up-to-date
      expect(repEngine.isStaleRead("replica_1", 310)).toBe(false);
    });

    it("queues requests when connection pool is saturated", () => {
      const pool = new ConnectionPoolManager("db_node", { maxConnections: 2 });

      const c1 = pool.acquireConnection(10);
      const c2 = pool.acquireConnection(12);
      expect(c1.success).toBe(true);
      expect(c2.success).toBe(true);

      // 3rd connection is queued
      const c3 = pool.acquireConnection(14);
      expect(c3.success).toBe(false);
      expect(c3.isQueued).toBe(true);
      expect(pool.getConfig().waitingRequestsCount).toBe(1);

      // Release c1 unblocks pool
      const rel = pool.releaseConnection(c1.connectionId!, 20);
      expect(rel).toBeDefined();
      expect(pool.getConfig().waitingRequestsCount).toBe(0);
    });
  });

  describe("7. End-to-End Simulation & Presets", () => {
    it("executes primary_key_lookup preset scenario successfully", () => {
      const scenario = createDatabasePresetScenario("primary_key_lookup");
      const trace = DatabaseExecutionEngine.executeScenario(scenario);

      expect(trace.outcome).toBe("success");
      expect(trace.events.length).toBeGreaterThan(3);
      expect(trace.frames.length).toBe(trace.events.length);

      const hasIndexProbe = trace.events.some((e) => e.type === "query.index.probed");
      expect(hasIndexProbe).toBe(true);

      const state = trace.frames[trace.frames.length - 1].runtimeState;
      expect(state?.databaseState?.queryMetrics?.rowsReturned).toBe(1);
    });

    it("executes deadlock preset and detects & resolves cycle", () => {
      const scenario = createDatabasePresetScenario("deadlock");
      const trace = DatabaseExecutionEngine.executeScenario(scenario);

      expect(trace.outcome).toBe("success");
      const dlEvent = trace.events.find((e) => e.type === "deadlock.detected");
      expect(dlEvent).toBeDefined();

      const abortEvent = trace.events.find((e) => e.type === "transaction.aborted");
      expect(abortEvent).toBeDefined();
    });

    it("executes replica_lag preset and logs replication events", () => {
      const scenario = createDatabasePresetScenario("replica_lag");
      const trace = DatabaseExecutionEngine.executeScenario(scenario);

      expect(trace.outcome).toBe("success");
      const hasRepEvent = trace.events.some(
        (e) => e.type === "replication.change.applied" || e.type === "replication.lag.updated"
      );
      expect(hasRepEvent).toBe(true);
    });
  });
});
