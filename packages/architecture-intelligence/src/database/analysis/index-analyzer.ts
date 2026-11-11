/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Index Coverage, Redundancy & Write Amplification Analyzer
 */

import type {
  DatabaseSchema,
  QueryWorkload,
  DatabaseArchitectureFinding,
  DatabaseTable,
} from "../contracts/database.types";

export interface IndexAnalysisResult {
  findings: DatabaseArchitectureFinding[];
  redundantIndexCount: number;
}

export class IndexAnalyzer {
  public static analyze(
    schema: DatabaseSchema,
    workloads: QueryWorkload[] = []
  ): IndexAnalysisResult {
    const findings: DatabaseArchitectureFinding[] = [];
    let redundantIndexCount = 0;

    for (const table of schema.tables) {
      // 1. Detect Redundant Indexes (Left-prefix duplication)
      const nonUniqueBtreeIndexes = table.indexes.filter(
        (i) => i.indexType === "btree" && !i.isUnique && !i.partialPredicate
      );

      for (let i = 0; i < nonUniqueBtreeIndexes.length; i++) {
        for (let j = 0; j < nonUniqueBtreeIndexes.length; j++) {
          if (i === j) continue;
          const idxA = nonUniqueBtreeIndexes[i];
          const idxB = nonUniqueBtreeIndexes[j];

          // If idxA is a strict left prefix of idxB (or identical columns)
          if (this.isPrefixOf(idxA.columnNames, idxB.columnNames)) {
            redundantIndexCount++;
            findings.push({
              id: `finding-redundant-index-${table.id}-${idxA.id}`,
              category: "redundant_index",
              severity: "medium",
              affectedTableId: table.id,
              affectedIndexId: idxA.id,
              title: `Redundant Index "${idxA.name}" on Table "${table.name}"`,
              explanation: `Index "${idxA.name}" on (${idxA.columnNames.join(", ")}) is a redundant left-prefix of composite index "${idxB.name}" on (${idxB.columnNames.join(", ")}). The database query planner can use "${idxB.name}" to satisfy queries filtering on (${idxA.columnNames.join(", ")}).`,
              evidence: [
                `Table: ${table.name}`,
                `Redundant Index: ${idxA.name} (${idxA.columnNames.join(", ")})`,
                `Super-Index: ${idxB.name} (${idxB.columnNames.join(", ")})`,
              ],
              riskAnalysis:
                "Unnecessary storage consumption, cache pool dilution, and write amplification during row insertions and updates.",
              remediation: `Safely drop index "${idxA.name}" as queries are covered by "${idxB.name}".`,
            });
          }
        }
      }

      // 2. High Write Amplification (More than 6 indexes on a table)
      if (table.indexes.length >= 6) {
        findings.push({
          id: `finding-write-amplification-${table.id}`,
          category: "write_amplification_overhead",
          severity: "low",
          affectedTableId: table.id,
          title: `High Write Amplification on Table "${table.name}" (${table.indexes.length} Indexes)`,
          explanation: `Table "${table.name}" has ${table.indexes.length} indexes defined. While indexes accelerate read queries, every INSERT and UPDATE operation must modify all ${table.indexes.length} index B-trees synchronously, causing write stalls and increased WAL generation.`,
          evidence: [
            `Table: ${table.name}`,
            `Total Indexes: ${table.indexes.length}`,
            `Estimated Row Count: ${table.estimatedRowCount.toLocaleString()}`,
          ],
          riskAnalysis:
            "Reduced write throughput, higher storage consumption, and increased vacuum/maintenance I/O.",
          remediation:
            "Consolidate overlapping indexes into composite indexes or partial indexes covering only selective query conditions.",
          deterministicCalculation: {
            metricName: "Index Count",
            value: table.indexes.length,
            threshold: 5,
            formula: "table.indexes.length",
          },
        });
      }

      // 3. Workload Missing Selective Index Check
      for (const workload of workloads) {
        if (
          workload.targetTableNames.map((t) => t.toLowerCase()).includes(table.name.toLowerCase()) &&
          workload.frequencyPerMinute > 100 &&
          table.estimatedRowCount > 50000
        ) {
          const hasCoveringIndex = this.hasAnyCoveringIndex(table, workload);
          if (!hasCoveringIndex) {
            findings.push({
              id: `finding-missing-index-workload-${table.id}-${workload.id}`,
              category: "missing_index_scan",
              severity: "high",
              affectedTableId: table.id,
              affectedQueryId: workload.id,
              title: `High-Frequency Query "${workload.queryName}" Missing Selective Index on "${table.name}"`,
              explanation: `Workload "${workload.queryName}" runs at ${workload.frequencyPerMinute} queries/min on table "${table.name}" (${table.estimatedRowCount.toLocaleString()} rows), but no index matches its query filters, forcing sequential full table scans.`,
              evidence: [
                `Workload: ${workload.queryName} (${workload.frequencyPerMinute} rpm)`,
                `Table: ${table.name} (${table.estimatedRowCount.toLocaleString()} rows)`,
                `Fingerprint: ${workload.queryFingerprint}`,
              ],
              riskAnalysis:
                "High database CPU saturation, buffer cache churning, and prolonged query latency.",
              remediation:
                "Add a selective B-Tree or Hash index on the columns evaluated in the WHERE clause.",
            });
          }
        }
      }
    }

    return { findings, redundantIndexCount };
  }

  private static isPrefixOf(prefixCols: string[], targetCols: string[]): boolean {
    if (prefixCols.length >= targetCols.length) return false;
    for (let i = 0; i < prefixCols.length; i++) {
      if (prefixCols[i].toLowerCase() !== targetCols[i].toLowerCase()) {
        return false;
      }
    }
    return true;
  }

  private static hasAnyCoveringIndex(table: DatabaseTable, workload: QueryWorkload): boolean {
    // If the table has indexes, check if any column in the fingerprint matches an index column
    for (const idx of table.indexes) {
      if (idx.columnNames.some((c) => workload.queryFingerprint.toLowerCase().includes(c.toLowerCase()))) {
        return true;
      }
    }
    return false;
  }
}
