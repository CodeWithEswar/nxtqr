import type {
  ExecutionTrace,
  VisualizationFrame,
} from "../domain/execution-trace";
import type { ModeledRuntimeState } from "../domain/runtime-state";
import { RuntimeStateHelper } from "../domain/runtime-state";
import type {
  DatabaseScenario,
  ModeledDatabaseRuntimeState,
  QueryExecutionPlan,
  DeadlockCycle,
  DatabaseRow,
} from "./database-schemas";
import type {
  DatabaseExecutionEvent,
  QueryParsedEvent,
  QueryPlanCreatedEvent,
  QueryOperatorStartedEvent,
  QueryRowExaminedEvent,
  QueryRowMatchedEvent,
  QueryIndexProbedEvent,
  QueryJoinMatchedEvent,
  QueryOperatorCompletedEvent,
  QueryCompletedEvent,
  QueryFailedEvent,
  LockRequestedEvent,
  LockAcquiredEvent,
  LockWaitingEvent,
  LockReleasedEvent,
  DeadlockDetectedEvent,
  TransactionStartedEvent,
  TransactionCommittedEvent,
  TransactionAbortedEvent,
} from "./database-events";
import { SqlParser } from "./sql-parser";
import { AstValidator } from "./ast-validator";
import { PhysicalPlanner } from "./planner/physical-planner";
import { OperatorsEngine } from "./operators/operators-engine";
import { LockManager } from "./transactions/lock-manager";
import { DeadlockDetector } from "./transactions/deadlock-detector";
import { TransactionManager } from "./transactions/transaction-manager";
import { ReplicationEngine } from "./replication/replication-engine";
import { ConnectionPoolManager } from "./capacity/connection-pool";
import { DETERMINISTIC_EPOCH_ISO, createDeterministicId } from "../orchestrator/deterministic-id";

export class DatabaseExecutionEngine {
  /**
   * Runs an end-to-end modeled database simulation for a given scenario.
   */
  public static executeScenario(scenario: DatabaseScenario): ExecutionTrace {
    const events: DatabaseExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];
    let sequence = 1;
    let virtualClockMs = 0;

    const databaseNodeId = scenario.databaseNodeId || "database_primary";
    const baseRuntimeState = RuntimeStateHelper.createInitialState();

    // 1. Initialize Subsystems
    const lockManager = new LockManager();
    const transactionManager = new TransactionManager(lockManager);
    transactionManager.initialize(
      {},
      scenario.fixtures
    );

    const replicationEngine = new ReplicationEngine(
      scenario.replication?.primaryNodeId || databaseNodeId,
      scenario.replication?.replicaNodeIds || [],
      scenario.replication?.replicationDelayMs || 200
    );

    const poolManager = new ConnectionPoolManager(
      databaseNodeId,
      scenario.capacity || {
        maxConnections: 10,
        activeConnections: 0,
        idleConnections: 10,
        queueCapacity: 50,
        waitingRequestsCount: 0,
        timeoutMs: 5000,
      }
    );

    // 2. Connection Acquisition
    const poolAcq = poolManager.acquireConnection(virtualClockMs, sequence++);
    if (poolAcq.event) {
      events.push(poolAcq.event);
      virtualClockMs += 2;
    }

    // 3. SQL Parsing & Schema Validation
    const parseResult = SqlParser.safeParse(scenario.primaryQuery);
    if (!parseResult.success || !parseResult.ast) {
      const failEvent: QueryFailedEvent = {
        id: `evt_q_fail_${sequence}`,
        sequence: sequence++,
        atMs: virtualClockMs,
        durationMs: 1,
        explanation: `SQL Syntax Error: ${parseResult.error || "Unknown parse error"}`,
        type: "query.failed",
        queryId: "query_1",
        reason: parseResult.error || "Syntax error in SQL query",
        errorCode: "SYNTAX_ERROR",
      };
      events.push(failEvent);

      return this.buildFailureTrace(scenario, events, virtualClockMs, parseResult.error || "Syntax error");
    }

    const ast = parseResult.ast;
    const validationErrors = AstValidator.validate(ast, scenario.schema);
    if (validationErrors.length > 0) {
      const errReason = validationErrors.map((e) => e.message).join("; ");
      const failEvent: QueryFailedEvent = {
        id: `evt_q_fail_${sequence}`,
        sequence: sequence++,
        atMs: virtualClockMs,
        durationMs: 1,
        explanation: `Schema Validation Error: ${errReason}`,
        type: "query.failed",
        queryId: "query_1",
        reason: errReason,
        errorCode: "SCHEMA_VALIDATION_ERROR",
      };
      events.push(failEvent);

      return this.buildFailureTrace(scenario, events, virtualClockMs, errReason);
    }

    // 4. Emit query.parsed Event
    const parsedEvent: QueryParsedEvent = {
      id: `evt_q_parsed_${sequence}`,
      sequence: sequence++,
      atMs: virtualClockMs,
      durationMs: 3,
      explanation: `Parsed ${ast.type} query on table '${ast.table}' (${ast.columns.join(", ")})`,
      type: "query.parsed",
      queryId: "query_1",
      rawSql: ast.rawSql,
      parsedSummary: `${ast.type} on ${ast.table} with ${ast.where ? "WHERE filter" : "no filter"}`,
    };
    events.push(parsedEvent);
    virtualClockMs += 3;

    // 5. Logical & Physical Planning
    const physicalPlan = PhysicalPlanner.plan(
      "query_1",
      ast,
      scenario.schema,
      scenario.fixtures
    );

    const planCreatedEvent: QueryPlanCreatedEvent = {
      id: `evt_q_plan_${sequence}`,
      sequence: sequence++,
      atMs: virtualClockMs,
      durationMs: 5,
      explanation: `Selected Physical Plan: Root '${physicalPlan.operators[physicalPlan.rootOperatorId]?.physicalOperator}' (Estimated Cost: ${physicalPlan.totalEstimatedCost.toFixed(2)}, Est. Duration: ${physicalPlan.totalModeledDurationMs}ms)`,
      type: "query.plan.created",
      queryId: "query_1",
      plan: physicalPlan,
      rootOperatorId: physicalPlan.rootOperatorId,
      totalEstimatedCost: physicalPlan.totalEstimatedCost,
    };
    events.push(planCreatedEvent);
    virtualClockMs += 5;

    // 6. Execute Modeled Concurrent Transactions (if configured)
    const detectedDeadlocks: DeadlockCycle[] = [];
    if (scenario.concurrentTransactions && scenario.concurrentTransactions.length > 0) {
      // Step A: Start all transactions and grant their initial held locks
      for (const tx of scenario.concurrentTransactions) {
        transactionManager.beginTransaction(tx.id, tx.isolationLevel, virtualClockMs, tx.name);
        const startEvt: TransactionStartedEvent = {
          id: `evt_tx_start_${sequence}`,
          sequence: sequence++,
          atMs: virtualClockMs,
          durationMs: 2,
          explanation: `Transaction ${tx.name || tx.id} started with isolation ${tx.isolationLevel}`,
          type: "transaction.started",
          transactionId: tx.id,
          isolationLevel: tx.isolationLevel,
        };
        events.push(startEvt);
        virtualClockMs += 2;

        for (const res of tx.heldLocks) {
          const tableName = res.split(":")[0];
          const reqEvt: LockRequestedEvent = {
            id: `evt_lock_req_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Tx ${tx.id} requested Exclusive lock on ${res}`,
            type: "lock.requested",
            transactionId: tx.id,
            resourceId: res,
            tableName,
            mode: "exclusive",
          };
          events.push(reqEvt);

          lockManager.acquireLock(tx.id, res, tableName, "exclusive", virtualClockMs);
          const acqEvt: LockAcquiredEvent = {
            id: `evt_lock_acq_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Tx ${tx.id} acquired Exclusive lock on ${res}`,
            type: "lock.acquired",
            transactionId: tx.id,
            resourceId: res,
            mode: "exclusive",
          };
          events.push(acqEvt);
        }
      }

      // Step B: Request waiting locks (now other transactions' held locks are actively held)
      for (const tx of scenario.concurrentTransactions) {
        if (tx.waitingForLock) {
          const wait = tx.waitingForLock;
          lockManager.acquireLock(
            wait.transactionId,
            wait.resourceId,
            wait.resourceId.split(":")[0],
            wait.requestedMode,
            virtualClockMs
          );
          const waitEvt: LockWaitingEvent = {
            id: `evt_lock_wait_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 5,
            explanation: `Tx ${wait.transactionId} blocked waiting for ${wait.waitingForTransactionId} to release ${wait.resourceId}`,
            type: "lock.waiting",
            transactionId: wait.transactionId,
            resourceId: wait.resourceId,
            mode: wait.requestedMode,
            waitingForTransactionId: wait.waitingForTransactionId,
          };
          events.push(waitEvt);
          virtualClockMs += 5;
        }
      }

      // Step C: Detect and resolve deadlock cycles
      const dl = DeadlockDetector.detectDeadlock(
        lockManager.getActiveWaits(),
        transactionManager.getTransactions(),
        virtualClockMs
      );
      if (dl) {
        detectedDeadlocks.push(dl);
        const dlEvt: DeadlockDetectedEvent = {
          id: `evt_dl_${sequence}`,
          sequence: sequence++,
          atMs: virtualClockMs,
          durationMs: 5,
          type: "deadlock.detected",
          cycle: dl.cycle,
          victimTransactionId: dl.selectedVictimTransactionId,
          explanation: dl.reason,
        };
        events.push(dlEvt);

        // Abort victim
        transactionManager.abortTransaction(dl.selectedVictimTransactionId, virtualClockMs);
        const abortEvt: TransactionAbortedEvent = {
          id: `evt_tx_abort_${sequence}`,
          sequence: sequence++,
          atMs: virtualClockMs,
          durationMs: 2,
          explanation: `Victim Tx ${dl.selectedVictimTransactionId} aborted due to deadlock`,
          type: "transaction.aborted",
          transactionId: dl.selectedVictimTransactionId,
          reason: dl.reason,
        };
        events.push(abortEvt);

        const { releasedLocks } = lockManager.releaseTransactionLocks(dl.selectedVictimTransactionId, virtualClockMs);
        for (const r of releasedLocks) {
          const relEvt: LockReleasedEvent = {
            id: `evt_lock_rel_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Released lock on ${r.resourceId}`,
            type: "lock.released",
            transactionId: dl.selectedVictimTransactionId,
            resourceId: r.resourceId,
            mode: r.mode,
          };
          events.push(relEvt);
        }
      }

      // Step D: Commit or abort non-victim transactions
      for (const tx of scenario.concurrentTransactions) {
        if (detectedDeadlocks.some((d) => d.selectedVictimTransactionId === tx.id)) {
          continue;
        }

        if (tx.status === "committed") {
          transactionManager.commitTransaction(tx.id, virtualClockMs);
          const commitEvt: TransactionCommittedEvent = {
            id: `evt_tx_commit_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 3,
            explanation: `Transaction ${tx.id} committed successfully. MVCC versions persisted.`,
            type: "transaction.committed",
            transactionId: tx.id,
            modifiedRowsCount: tx.writeSet.length,
          };
          events.push(commitEvt);
          virtualClockMs += 3;

          // Log replication change on primary
          for (const w of tx.writeSet) {
            const [tName, rId] = w.split(":");
            const { event: repEvt } = replicationEngine.logChange(
              tx.id,
              tName,
              "UPDATE",
              rId,
              { id: Number(rId) },
              virtualClockMs,
              sequence++
            );
            events.push(repEvt);
          }
        } else if (tx.status === "aborted") {
          transactionManager.abortTransaction(tx.id, virtualClockMs);
          const abortEvt: TransactionAbortedEvent = {
            id: `evt_tx_abort_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 2,
            explanation: `Transaction ${tx.id} rolled back. Changes discarded.`,
            type: "transaction.aborted",
            transactionId: tx.id,
            reason: "User requested ROLLBACK",
          };
          events.push(abortEvt);
          virtualClockMs += 2;
        }
      }
    }

    // 7. Execute Physical Plan Operators Step-by-Step
    let rowsExaminedTotal = 0;
    let indexProbesTotal = 0;
    const operatorIntermediateMap: Record<string, DatabaseRow[]> = {};

    // Topological/depth execution
    const operatorExecutionOrder = this.getExecutionOrder(physicalPlan);

    for (const opId of operatorExecutionOrder) {
      const op = physicalPlan.operators[opId];
      if (!op) continue;

      // Compute intermediate rows
      if (op.logicalOperator === "Scan") {
        const fullRows = scenario.fixtures[op.tableName || ""] || [];
        if (op.physicalOperator === "IndexScan") {
          const matched = fullRows.filter((r) => OperatorsEngine.evaluateFilter(r, ast.where));
          op.intermediateRows = matched.length > 0 ? matched : fullRows.slice(0, 1);
        } else {
          op.intermediateRows = fullRows;
        }
        op.actualRows = op.intermediateRows.length;
      } else if (op.logicalOperator === "Filter") {
        const child = physicalPlan.operators[op.children[0]];
        const inputRows = child ? child.intermediateRows : [];
        op.intermediateRows = inputRows.filter((r) => OperatorsEngine.evaluateFilter(r, ast.where));
        op.actualRows = op.intermediateRows.length;
      } else if (op.logicalOperator === "Join") {
        const outer = physicalPlan.operators[op.children[0]]?.intermediateRows || [];
        const inner = physicalPlan.operators[op.children[1]]?.intermediateRows || [];
        const joinDef = ast.joins?.[0] || { type: "INNER", table: "", on: { leftColumn: "id", rightColumn: "id" } };
        const res = op.physicalOperator === "HashJoin"
          ? OperatorsEngine.hashJoin(outer, inner, joinDef)
          : OperatorsEngine.nestedLoopJoin(outer, inner, joinDef);
        op.intermediateRows = res.joinedRows;
        op.actualRows = res.joinedRows.length;
      } else if (op.logicalOperator === "Sort") {
        const child = physicalPlan.operators[op.children[0]];
        op.intermediateRows = OperatorsEngine.sortRows(child?.intermediateRows || [], ast.orderBy);
        op.actualRows = op.intermediateRows.length;
      } else if (op.logicalOperator === "Project") {
        const child = physicalPlan.operators[op.children[0]];
        op.intermediateRows = (child?.intermediateRows || []).map((r) => OperatorsEngine.projectRow(r, ast.columns));
        op.actualRows = op.intermediateRows.length;
      } else if (op.logicalOperator === "Limit") {
        const child = physicalPlan.operators[op.children[0]];
        op.intermediateRows = (child?.intermediateRows || []).slice(0, ast.limit ?? 100);
        op.actualRows = op.intermediateRows.length;
      }

      const opStartEvt: QueryOperatorStartedEvent = {
        id: `evt_op_start_${sequence}`,
        sequence: sequence++,
        atMs: virtualClockMs,
        durationMs: 2,
        explanation: `Starting operator: ${op.physicalOperator} on ${op.tableName || "dataset"} (${op.description})`,
        type: "query.operator.started",
        queryId: "query_1",
        operatorId: op.id,
        operatorType: op.physicalOperator,
        tableName: op.tableName,
        indexName: op.indexName,
      };
      events.push(opStartEvt);
      virtualClockMs += Math.max(1, Math.round(op.cost.startup));

      // Operator-specific event emissions
      if (op.physicalOperator === "IndexScan") {
        indexProbesTotal += op.cost.indexProbes;
        const probeEvt: QueryIndexProbedEvent = {
          id: `evt_idx_probe_${sequence}`,
          sequence: sequence++,
          atMs: virtualClockMs,
          durationMs: 1,
          explanation: `Index probe on '${op.indexName}': binary search traversed tree root -> leaf`,
          type: "query.index.probed",
          queryId: "query_1",
          operatorId: op.id,
          indexName: op.indexName || "index",
          lookupKey: ast.where?.rightValue ?? "id",
          matchingRowIds: op.intermediateRows.map((r) => String(r.id)),
        };
        events.push(probeEvt);
        virtualClockMs += 1;

        for (const row of op.intermediateRows) {
          rowsExaminedTotal++;
          const matchEvt: QueryRowMatchedEvent = {
            id: `evt_row_match_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Index matched row #${row.id} on predicate`,
            type: "query.row.matched",
            queryId: "query_1",
            operatorId: op.id,
            tableName: op.tableName || "table",
            row,
          };
          events.push(matchEvt);
        }
      } else if (op.physicalOperator === "SeqScan") {
        const fullRows = scenario.fixtures[op.tableName || ""] || [];
        for (const row of fullRows) {
          rowsExaminedTotal++;
          const matches = op.intermediateRows.some((r: DatabaseRow) => r.id === row.id);
          const examEvt: QueryRowExaminedEvent = {
            id: `evt_row_exam_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Examined row #${row.id}: ${matches ? "MATCHED filter" : "filtered out"}`,
            type: "query.row.examined",
            queryId: "query_1",
            operatorId: op.id,
            tableName: op.tableName || "table",
            rowId: String(row.id),
            evaluatedPredicate: op.predicateExplanation,
            matched: matches,
          };
          events.push(examEvt);

          if (matches) {
            const matchEvt: QueryRowMatchedEvent = {
              id: `evt_row_match_${sequence}`,
              sequence: sequence++,
              atMs: virtualClockMs,
              durationMs: 1,
              explanation: `Row #${row.id} matched predicate`,
              type: "query.row.matched",
              queryId: "query_1",
              operatorId: op.id,
              tableName: op.tableName || "table",
              row,
            };
            events.push(matchEvt);
          }
        }
      } else if (op.physicalOperator === "NestedLoopJoin" || op.physicalOperator === "HashJoin") {
        for (const joined of op.intermediateRows) {
          const joinEvt: QueryJoinMatchedEvent = {
            id: `evt_join_match_${sequence}`,
            sequence: sequence++,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Joined record matched: Left #${joined.user_id || joined.id} with Right #${joined.id}`,
            type: "query.join.matched",
            queryId: "query_1",
            operatorId: op.id,
            leftRowId: String(joined.user_id || joined.id),
            rightRowId: String(joined.id),
            joinedRow: joined,
          };
          events.push(joinEvt);
        }
      }

      operatorIntermediateMap[op.id] = op.intermediateRows;

      const opCompEvt: QueryOperatorCompletedEvent = {
        id: `evt_op_comp_${sequence}`,
        sequence: sequence++,
        atMs: virtualClockMs,
        durationMs: 2,
        explanation: `Operator ${op.physicalOperator} completed: yielded ${op.actualRows} rows`,
        type: "query.operator.completed",
        queryId: "query_1",
        operatorId: op.id,
        operator: op,
        emittedRowCount: op.actualRows,
      };
      events.push(opCompEvt);
      virtualClockMs += 2;
    }

    // 7b. Handle INSERT WAL log if primary write
    if (ast.type === "INSERT" && ast.insertValues) {
      const rowId = String(ast.insertValues.id || `row_${sequence}`);
      const { event: repEvt } = replicationEngine.logChange(
        "tx_main",
        ast.table,
        "INSERT",
        rowId,
        ast.insertValues,
        virtualClockMs,
        sequence++
      );
      events.push(repEvt);
    }

    // 8. Replication & Stale Read Checking
    let isStaleRead = false;
    if (scenario.replication?.readPreference === "replica") {
      const replicaId = scenario.replication.replicaNodeIds[0] || "replica_1";
      isStaleRead = replicationEngine.isStaleRead(replicaId, virtualClockMs);

      // Advance clock and catch up replica
      const { appliedEvents, lagEvents } = replicationEngine.catchUpReplicas(
        virtualClockMs + scenario.replication.replicationDelayMs,
        () => sequence++
      );
      events.push(...appliedEvents);
      events.push(...lagEvents);
    }

    // 9. Query Completed Event
    const rootOp = physicalPlan.operators[physicalPlan.rootOperatorId];
    const finalRowCount = rootOp ? rootOp.actualRows : 0;

    const queryCompEvt: QueryCompletedEvent = {
      id: `evt_q_comp_${sequence}`,
      sequence: sequence++,
      atMs: virtualClockMs,
      durationMs: 2,
      explanation: `Query completed successfully in ${virtualClockMs}ms. Returned ${finalRowCount} rows.${isStaleRead ? " (Warning: Stale Read detected on replica)" : ""}`,
      type: "query.completed",
      queryId: "query_1",
      returnedRowCount: finalRowCount,
      totalModeledDurationMs: virtualClockMs,
      isStaleRead,
    };
    events.push(queryCompEvt);
    virtualClockMs += 2;

    // 10. Connection Pool Release
    if (poolAcq.connectionId) {
      const poolRelEvt = poolManager.releaseConnection(
        poolAcq.connectionId,
        virtualClockMs,
        sequence++
      );
      if (poolRelEvt) {
        events.push(poolRelEvt);
      }
    }

    // 11. Compile Modeled Database Runtime State
    const databaseState: ModeledDatabaseRuntimeState = {
      activeQueryId: "query_1",
      currentOperatorId: physicalPlan.rootOperatorId,
      tableRows: scenario.fixtures,
      mvccVersions: transactionManager.getMvccVersions(),
      activeLocks: lockManager.getActiveLocks(),
      activeLockWaits: lockManager.getActiveWaits(),
      transactions: transactionManager.getTransactions(),
      deadlocks: detectedDeadlocks,
      replicationLog: replicationEngine.getReplicationLog(),
      replicas: replicationEngine.getReplicas(),
      connectionPool: poolManager.getConfig(),
      lastQueryPlan: physicalPlan,
      intermediateResults: operatorIntermediateMap,
      queryMetrics: {
        rowsExamined: rowsExaminedTotal,
        rowsReturned: finalRowCount,
        indexProbes: indexProbesTotal,
        totalCost: physicalPlan.totalEstimatedCost,
        durationMs: virtualClockMs,
        lockWaitMs: detectedDeadlocks.length > 0 ? 10 : 0,
        isStaleRead,
      },
    };

    const finalRuntimeState: ModeledRuntimeState = {
      ...baseRuntimeState,
      databaseState,
    };

    // 12. Create Visualization Frames
    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      frames.push({
        frameIndex: i,
        virtualTimeMs: evt.atMs,
        activeNodeIds: [databaseNodeId],
        activeEdgeIds: [],
        activeEvent: evt,
        direction: "request",
        stepTitle: evt.type.replace(/\./g, " ").toUpperCase(),
        stepExplanation: evt.explanation,
        runtimeState: finalRuntimeState,
      });
    }

    return {
      runId: createDeterministicId("run_db", `${scenario.id}:${databaseNodeId}`),
      architectureId: "arch_db_sim",
      architectureRevisionId: "rev_001",
      snapshotHash: "hash_db_001",
      configuration: {
        version: 1,
        entryNodeId: databaseNodeId,
        request: {
          id: "req_db_sim",
          method: "GET",
          path: "/database/execute",
          headers: {},
        },
        routing: { mode: "deterministic", selectedBranches: {} },
        limits: { maxHops: 50, maxEvents: 5000, maxDurationMs: 30000 },
        timing: { nodeDurationMs: 10, edgeDurationMs: 5 },
      },
      visitedNodeIds: [databaseNodeId],
      traversedEdgeIds: [],
      createdAt: DETERMINISTIC_EPOCH_ISO,
      events,
      totalDurationMs: virtualClockMs,
      totalEvents: events.length,
      totalHops: 1,
      outcome: "success",
      terminalReason: "Query execution completed successfully",
      frames,
    };
  }

  private static getExecutionOrder(plan: QueryExecutionPlan): string[] {
    const order: string[] = [];
    const visited = new Set<string>();

    function traverse(opId: string) {
      if (visited.has(opId)) return;
      const op = plan.operators[opId];
      if (!op) return;

      for (const childId of op.children) {
        traverse(childId);
      }

      visited.add(opId);
      order.push(opId);
    }

    traverse(plan.rootOperatorId);
    return order;
  }

  private static buildFailureTrace(
    scenario: DatabaseScenario,
    events: DatabaseExecutionEvent[],
    virtualClockMs: number,
    reason: string
  ): ExecutionTrace {
    const databaseNodeId = scenario.databaseNodeId || "database_primary";
    const baseRuntimeState = RuntimeStateHelper.createInitialState();

    const frames: VisualizationFrame[] = events.map((evt, idx) => ({
      frameIndex: idx,
      virtualTimeMs: evt.atMs,
      activeNodeIds: [databaseNodeId],
      activeEdgeIds: [],
      activeEvent: evt,
      direction: "request",
      stepTitle: evt.type.replace(/\./g, " ").toUpperCase(),
      stepExplanation: evt.explanation,
      runtimeState: baseRuntimeState,
    }));

    return {
      runId: createDeterministicId("run_db_fail", `${scenario.id}:${databaseNodeId}`),
      architectureId: "arch_db_sim",
      architectureRevisionId: "rev_001",
      snapshotHash: "hash_db_fail",
      configuration: {
        version: 1,
        entryNodeId: databaseNodeId,
        request: {
          id: "req_db_sim",
          method: "GET",
          path: "/database/execute",
          headers: {},
        },
        routing: { mode: "deterministic", selectedBranches: {} },
        limits: { maxHops: 50, maxEvents: 5000, maxDurationMs: 30000 },
        timing: { nodeDurationMs: 10, edgeDurationMs: 5 },
      },
      visitedNodeIds: [databaseNodeId],
      traversedEdgeIds: [],
      createdAt: DETERMINISTIC_EPOCH_ISO,
      events,
      totalDurationMs: virtualClockMs,
      totalEvents: events.length,
      totalHops: 1,
      outcome: "failure",
      terminalReason: reason,
      frames,
    };
  }
}
