/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Relational Schema, Normalization & Foreign Key Constraint Analyzer
 */

import type {
  DatabaseSchema,
  DatabaseArchitectureFinding,
  DatabaseTable,
} from "../contracts/database.types";

export interface SchemaAnalysisResult {
  findings: DatabaseArchitectureFinding[];
  unindexedForeignKeysCount: number;
}

export class SchemaAnalyzer {
  public static analyze(schema: DatabaseSchema): SchemaAnalysisResult {
    const findings: DatabaseArchitectureFinding[] = [];
    let unindexedForeignKeysCount = 0;

    for (const table of schema.tables) {
      // 1. Missing Primary Key Check
      if (table.primaryKeyColumnNames.length === 0) {
        findings.push({
          id: `finding-missing-pk-${table.id}`,
          category: "unnormalized_redundancy",
          severity: "high",
          affectedTableId: table.id,
          title: `Missing Primary Key on Table "${table.name}"`,
          explanation: `Table "${table.name}" does not define a primary key. Without a primary key, logical replication (e.g. Postgres CDC / Debezium) fails, row updates lack unique identity, and queries require full scans to target individual records.`,
          evidence: [
            `Table: ${table.name}`,
            `Column count: ${table.columns.length}`,
            `Primary Key: none`,
          ],
          riskAnalysis:
            "Logical replication failure, duplicate rows cannot be prevented, and point updates become slow table scans.",
          remediation: `Add a primary key constraint (e.g. an auto-incrementing identity or UUID column) to table "${table.name}".`,
        });
      }

      // 2. Unindexed Foreign Keys Check
      for (const fk of table.foreignKeys) {
        const isIndexed = this.isForeignKeyCoveredByIndex(table, fk.sourceColumnNames);
        if (!isIndexed) {
          unindexedForeignKeysCount++;
          findings.push({
            id: `finding-unindexed-fk-${table.id}-${fk.name}`,
            category: "missing_foreign_key_index",
            severity: "high",
            affectedTableId: table.id,
            title: `Unindexed Foreign Key on Table "${table.name}" (${fk.sourceColumnNames.join(", ")})`,
            explanation: `Foreign key constraint "${fk.name}" referencing "${fk.targetTableName}" is not covered by any index on "${table.name}". In PostgreSQL and MySQL, updating or deleting rows in the parent table "${fk.targetTableName}" will acquire a full table-level share lock on "${table.name}", stalling concurrent writes.`,
            evidence: [
              `Table: ${table.name}`,
              `Foreign Key: ${fk.name}`,
              `Referenced table: ${fk.targetTableName}`,
              `FK columns: ${fk.sourceColumnNames.join(", ")}`,
              `Matching index: none`,
            ],
            riskAnalysis:
              "Severe lock contention and potential deadlocks when parent table rows are deleted or updated, along with slow JOIN queries.",
            remediation: `Create a B-Tree index on "${table.name}" covering columns (${fk.sourceColumnNames.join(", ")}).`,
          });
        }
      }

      // 3. 1NF Violation: Repeating Column Groups (e.g. tag1, tag2, phone1, phone2)
      const repeatingGroups = this.detectRepeatingColumns(table);
      if (repeatingGroups.length > 0) {
        findings.push({
          id: `finding-1nf-repeating-columns-${table.id}`,
          category: "unnormalized_redundancy",
          severity: "medium",
          affectedTableId: table.id,
          title: `First Normal Form (1NF) Violation: Repeating Column Group in "${table.name}"`,
          explanation: `Table "${table.name}" contains numbered repeating columns (${repeatingGroups.join(", ")}), violating 1NF atomicity. This complicates queries (requiring multi-column OR conditions) and limits storage flexibility.`,
          evidence: [
            `Table: ${table.name}`,
            `Numbered columns: ${repeatingGroups.join(", ")}`,
          ],
          riskAnalysis:
            "Complicated search predicates, inability to index dynamic elements efficiently, and schema evolution friction.",
          remediation: `Normalize repeating column groups into a separate 1:N related table or use an array/JSONB column if supported.`,
        });
      }
    }

    return { findings, unindexedForeignKeysCount };
  }

  private static isForeignKeyCoveredByIndex(table: DatabaseTable, fkCols: string[]): boolean {
    const fkString = fkCols.map((c) => c.toLowerCase()).join(",");

    for (const idx of table.indexes) {
      // An index covers the FK if the FK columns form a left-prefix of the index columns
      const idxPrefix = idx.columnNames.slice(0, fkCols.length).map((c) => c.toLowerCase()).join(",");
      if (idxPrefix === fkString) {
        return true;
      }
    }

    return false;
  }

  private static detectRepeatingColumns(table: DatabaseTable): string[] {
    const colNames = table.columns.map((c) => c.name.toLowerCase());
    const matched: string[] = [];

    for (const name of colNames) {
      const m = name.match(/^([a-z_]+)(\d+)$/);
      if (m) {
        const base = m[1];
        const num = parseInt(m[2], 10);
        if (num === 1) {
          // Check if base2 exists
          if (colNames.includes(`${base}2`)) {
            matched.push(`${base}1, ${base}2`);
          }
        }
      }
    }

    return matched;
  }
}
