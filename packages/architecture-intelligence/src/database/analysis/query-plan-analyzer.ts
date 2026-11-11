/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Query Execution Plan & Anti-Pattern Analyzer
 */

import type {
  QueryExecutionPlan,
  QueryPlanOperator,
  DatabaseArchitectureFinding,
} from "../contracts/database.types";

export class QueryPlanAnalyzer {
  public static analyze(plans: QueryExecutionPlan[]): DatabaseArchitectureFinding[] {
    const findings: DatabaseArchitectureFinding[] = [];

    for (const plan of plans) {
      this.traverseOperator(plan.rootOperator, plan, findings);
    }

    return findings;
  }

  private static traverseOperator(
    op: QueryPlanOperator,
    plan: QueryExecutionPlan,
    findings: DatabaseArchitectureFinding[]
  ): void {
    // 1. Unbounded Full-Table Scan on Large Table
    if (op.operatorType === "seq_scan" || op.operatorType === "parallel_seq_scan") {
      const isHighCost = op.estimatedTotalCost > 1000 || op.estimatedRows > 50000;
      const isHighActualRows = (op.actualRows ?? 0) * (op.actualLoops ?? 1) > 20000;

      if (isHighCost || isHighActualRows) {
        findings.push({
          id: `finding-seq-scan-${plan.id}-${op.id}`,
          category: "unbounded_table_scan",
          severity: "high",
          affectedQueryId: plan.queryWorkloadId,
          title: `Expensive Full-Table Scan (${op.operatorType}) on "${op.targetTableName || "relation"}"`,
          explanation: `Execution plan contains a ${op.operatorType} on "${op.targetTableName || "relation"}" with an estimated cost of ${op.estimatedTotalCost.toFixed(0)} and ${op.estimatedRows.toLocaleString()} rows. Bypassing indexes forces the database engine to load all disk pages into memory.`,
          evidence: [
            `Operator: ${op.operatorType}`,
            `Relation: ${op.targetTableName || "unnamed"}`,
            `Estimated Total Cost: ${op.estimatedTotalCost}`,
            `Estimated Rows: ${op.estimatedRows.toLocaleString()}`,
            op.actualTotalTimeMs !== undefined ? `Actual Total Time: ${op.actualTotalTimeMs.toFixed(2)}ms` : "Modeled plan",
            op.filterPredicate ? `Filter: ${op.filterPredicate}` : "Unfiltered scan",
          ],
          riskAnalysis:
            "Disk I/O saturation, high buffer cache eviction of other hot tables, and severe query latency spikes under concurrency.",
          remediation: `Add a selective index on the filtered columns (${op.filterPredicate || "query condition"}) or add an index condition to enable Index Scans.`,
          deterministicCalculation: {
            metricName: "Plan Total Cost",
            value: op.estimatedTotalCost,
            threshold: 1000,
            formula: "estimatedTotalCost",
          },
        });
      }
    }

    // 2. Cardinality Estimation Mismatch (Estimated vs Actual Rows > 10x)
    if (op.actualRows !== undefined && op.estimatedRows > 0) {
      const actualTotalRows = op.actualRows * (op.actualLoops ?? 1);
      const ratio = actualTotalRows > op.estimatedRows
        ? actualTotalRows / op.estimatedRows
        : op.estimatedRows / Math.max(actualTotalRows, 1);

      if (ratio > 10 && (actualTotalRows > 100 || op.estimatedRows > 100)) {
        findings.push({
          id: `finding-cardinality-mismatch-${plan.id}-${op.id}`,
          category: "cardinality_estimation_mismatch",
          severity: "medium",
          affectedQueryId: plan.queryWorkloadId,
          title: `Severe Cardinality Estimation Mismatch on "${op.operatorType}" (${ratio.toFixed(1)}x)`,
          explanation: `Planner estimated ${op.estimatedRows.toLocaleString()} rows, but actual execution observed ${actualTotalRows.toLocaleString()} rows (${ratio.toFixed(1)}x discrepancy). When the query planner's estimates diverge by more than an order of magnitude, it selects sub-optimal join algorithms (e.g. Nested Loops instead of Hash Joins) or inefficient scans.`,
          evidence: [
            `Operator: ${op.operatorType} on ${op.targetTableName || "relation"}`,
            `Estimated Rows: ${op.estimatedRows.toLocaleString()}`,
            `Actual Total Rows: ${actualTotalRows.toLocaleString()}`,
            `Estimation Discrepancy Ratio: ${ratio.toFixed(1)}x`,
          ],
          riskAnalysis:
            "Sub-optimal query plan selection, memory spillage to temporary disk files, and degraded query throughput.",
          remediation:
            "Run ANALYZE on the target table to refresh statistical histograms, or create extended statistics (CREATE STATISTICS) if columns have correlated distributions.",
          deterministicCalculation: {
            metricName: "Estimation Error Ratio",
            value: ratio,
            threshold: 10,
            formula: "Max(actual/estimated, estimated/actual)",
          },
        });
      }
    }

    // 3. High-Work Nested Loop Join
    if (op.operatorType === "nested_loop") {
      const loops = op.actualLoops ?? 1;
      const rows = op.actualRows ?? 0;
      if (loops > 1000 || rows * loops > 50000) {
        findings.push({
          id: `finding-nested-loop-surge-${plan.id}-${op.id}`,
          category: "unbounded_table_scan",
          severity: "medium",
          affectedQueryId: plan.queryWorkloadId,
          title: `High-Work Nested Loop Join on Plan`,
          explanation: `Nested loop join executed with ${loops.toLocaleString()} outer loops, iterating inner relations extensively. High iteration counts in nested loops indicate missing inner indexes or an inappropriate join strategy for the data volume.`,
          evidence: [
            `Operator: Nested Loop`,
            `Outer Loops: ${loops.toLocaleString()}`,
            `Total Output Rows: ${(rows * loops).toLocaleString()}`,
          ],
          riskAnalysis:
            "Quadratic CPU utilization scaling as outer table row counts expand.",
          remediation:
            "Ensure the inner relation of the nested loop has an index on the join key, or allow the planner to consider Hash/Merge Joins by increasing work_mem.",
        });
      }
    }

    // Recurse into children
    for (const child of op.children) {
      this.traverseOperator(child, plan, findings);
    }
  }
}
