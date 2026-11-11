/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Transaction Boundaries, Isolation Anomalies & Deadlock Graph Analyzer
 */

import type {
  TransactionModel,
  LockContentionScenario,
  DatabaseArchitectureFinding,
} from "../contracts/database.types";

export interface TransactionAnalysisResult {
  findings: DatabaseArchitectureFinding[];
  deadlockScenarios: LockContentionScenario[];
  deadlockRiskCount: number;
}

export class TransactionAnalyzer {
  public static analyze(transactions: TransactionModel[]): TransactionAnalysisResult {
    const findings: DatabaseArchitectureFinding[] = [];
    const deadlockScenarios: LockContentionScenario[] = [];

    // 1. Transaction Isolation Level Anomalies
    for (const tx of transactions) {
      if (tx.isolationLevel === "read_uncommitted") {
        findings.push({
          id: `finding-isolation-dirty-read-${tx.id}`,
          category: "transaction_isolation_anomaly",
          severity: "critical",
          affectedTransactionId: tx.id,
          title: `Dirty Read Hazard on Transaction "${tx.name}" (READ UNCOMMITTED)`,
          explanation: `Transaction "${tx.name}" is configured with isolation level READ UNCOMMITTED. It can observe uncommitted mutations from concurrent transactions that may later roll back, corrupting business logic.`,
          evidence: [
            `Transaction: ${tx.name}`,
            `Isolation Level: read_uncommitted`,
            `Operation count: ${tx.operations.length}`,
          ],
          riskAnalysis:
            "Severe data integrity corruption, reading intermediate invalid state, and phantom operations.",
          remediation:
            "Upgrade isolation level to at least READ COMMITTED (or REPEATABLE READ / SERIALIZABLE).",
        });
      }

      if (tx.isolationLevel === "read_committed") {
        const writeOps = tx.operations.filter((op) => op.isWrite);
        if (writeOps.length > 1) {
          findings.push({
            id: `finding-isolation-non-repeatable-${tx.id}`,
            category: "transaction_isolation_anomaly",
            severity: "medium",
            affectedTransactionId: tx.id,
            title: `Non-Repeatable Read & Lost Update Exposure on "${tx.name}"`,
            explanation: `Transaction "${tx.name}" executes ${writeOps.length} write operations under READ COMMITTED isolation. Consecutive SELECT queries within the same transaction can observe different data if concurrent transactions commit updates in between, leading to lost updates.`,
            evidence: [
              `Transaction: ${tx.name}`,
              `Isolation Level: read_committed`,
              `Write operations: ${writeOps.map((o) => o.tableName).join(", ")}`,
            ],
            riskAnalysis:
              "Lost updates and inconsistent business calculations across multi-step transactions.",
            remediation:
              "Use SELECT ... FOR UPDATE pessimistic locking, optimistic concurrency version checks, or elevate to REPEATABLE READ.",
          });
        }
      }

      // Check long-running exclusive locks
      for (const op of tx.operations) {
        if (op.lockType === "exclusive" && op.estimatedDurationMs > 2000) {
          findings.push({
            id: `finding-long-exclusive-lock-${tx.id}-${op.tableId}`,
            category: "transaction_isolation_anomaly",
            severity: "high",
            affectedTransactionId: tx.id,
            title: `Prolonged Exclusive Lock on Table "${op.tableName}" (${op.estimatedDurationMs}ms)`,
            explanation: `Operation in "${tx.name}" holds an exclusive lock on "${op.tableName}" for an estimated ${op.estimatedDurationMs}ms. Exclusive locks block all concurrent readers and writers, creating massive connection queueing and latency spikes.`,
            evidence: [
              `Transaction: ${tx.name}`,
              `Table: ${op.tableName}`,
              `Lock Type: exclusive`,
              `Estimated Duration: ${op.estimatedDurationMs}ms`,
            ],
            riskAnalysis:
              "Cascading connection pool exhaustion and application request timeouts.",
            remediation:
              "Shorten transaction duration, break large batch updates into smaller chunks, or acquire row-level locks instead of table locks.",
          });
        }
      }
    }

    // 2. Deadlock Detection (Wait-For Graph Cycle Detection)
    // Compare pairs of transactions accessing common tables in conflicting lock orders
    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const txA = transactions[i];
        const txB = transactions[j];

        const orderA = txA.operations.map((o) => o.tableName.toLowerCase());
        const orderB = txB.operations.map((o) => o.tableName.toLowerCase());

        // Find tables touched by both
        const commonTables = orderA.filter((t) => orderB.includes(t));
        if (commonTables.length >= 2) {
          // Check if the order of access differs between TxA and TxB
          const indexA1 = orderA.indexOf(commonTables[0]);
          const indexA2 = orderA.indexOf(commonTables[1]);
          const indexB1 = orderB.indexOf(commonTables[0]);
          const indexB2 = orderB.indexOf(commonTables[1]);

          const orderInA = indexA1 < indexA2;
          const orderInB = indexB1 < indexB2;

          if (orderInA !== orderInB) {
            // Cycle detected: TxA locks table 0 then table 1, TxB locks table 1 then table 0!
            const cyclePath = [`${txA.name} -> ${commonTables[0]} -> ${commonTables[1]}`, `${txB.name} -> ${commonTables[1]} -> ${commonTables[0]}`];
            const scenario: LockContentionScenario = {
              id: `deadlock-${txA.id}-${txB.id}`,
              contendingTransactionIds: [txA.id, txB.id],
              conflictingTableName: commonTables.join(" & "),
              hasDeadlockCycle: true,
              cyclePath,
              deadlockRiskLevel: "critical",
              explanation: `Transaction "${txA.name}" acquires locks in order (${commonTables[0]} -> ${commonTables[1]}), while "${txB.name}" acquires locks in reverse order (${commonTables[1]} -> ${commonTables[0]}). When executed concurrently, both transactions will hold one lock while waiting on the other, producing an unresolvable deadlock.`,
            };
            deadlockScenarios.push(scenario);

            findings.push({
              id: `finding-deadlock-cycle-${txA.id}-${txB.id}`,
              category: "deadlock_dependency_cycle",
              severity: "critical",
              affectedTransactionId: txA.id,
              title: `Critical Deadlock Hazard between "${txA.name}" and "${txB.name}"`,
              explanation: scenario.explanation,
              evidence: [
                `Tx 1: ${txA.name} [${commonTables[0]} -> ${commonTables[1]}]`,
                `Tx 2: ${txB.name} [${commonTables[1]} -> ${commonTables[0]}]`,
                `Cycle Path: ${cyclePath.join(" | ")}`,
              ],
              riskAnalysis:
                "Automatic transaction aborts, rollback churn, and 500 error cascades for end users.",
              remediation:
                "Standardize lock acquisition order across all application code (e.g. always sort table/row IDs prior to acquiring locks).",
            });
          }
        }
      }
    }

    return {
      findings,
      deadlockScenarios,
      deadlockRiskCount: deadlockScenarios.length,
    };
  }
}
