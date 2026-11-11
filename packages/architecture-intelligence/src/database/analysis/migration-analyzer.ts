/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Schema Evolution & Expand-and-Contract Migration Risk Analyzer
 */

import type {
  DatabaseSchema,
  SchemaDiffEntry,
  DatabaseMigrationPlan,
  DatabaseArchitectureFinding,
} from "../contracts/database.types";

export interface MigrationAnalysisResult {
  diffEntries: SchemaDiffEntry[];
  migrationPlan: DatabaseMigrationPlan;
  findings: DatabaseArchitectureFinding[];
  breakingMigrationCount: number;
}

export class MigrationAnalyzer {
  public static compare(
    oldSchema: DatabaseSchema,
    newSchema: DatabaseSchema
  ): MigrationAnalysisResult {
    const diffEntries: SchemaDiffEntry[] = [];
    const findings: DatabaseArchitectureFinding[] = [];

    const oldTableMap = new Map(oldSchema.tables.map((t) => [t.name.toLowerCase(), t]));
    const newTableMap = new Map(newSchema.tables.map((t) => [t.name.toLowerCase(), t]));

    // 1. Detect Dropped Tables
    for (const [name, oldTbl] of oldTableMap.entries()) {
      if (!newTableMap.has(name)) {
        diffEntries.push({
          kind: "drop_table",
          targetTable: oldTbl.name,
          targetObject: oldTbl.name,
          isBreakingChange: true,
          requiresTableRewrite: false,
          requiresExclusiveLock: true,
          riskLevel: "critical",
          description: `Dropping table "${oldTbl.name}" causes permanent data loss and breaks active queries.`,
          expandContractRecommendation: "Deprecate table in application code first; drop table in a subsequent release.",
        });
      }
    }

    // 2. Detect Added & Modified Tables
    for (const [name, newTbl] of newTableMap.entries()) {
      const oldTbl = oldTableMap.get(name);
      if (!oldTbl) {
        diffEntries.push({
          kind: "add_table",
          targetTable: newTbl.name,
          targetObject: newTbl.name,
          isBreakingChange: false,
          requiresTableRewrite: false,
          requiresExclusiveLock: false,
          riskLevel: "low",
          description: `Adding new table "${newTbl.name}" is non-breaking.`,
        });
        continue;
      }

      // Check Columns
      const oldColMap = new Map(oldTbl.columns.map((c) => [c.name.toLowerCase(), c]));
      const newColMap = new Map(newTbl.columns.map((c) => [c.name.toLowerCase(), c]));

      // Dropped Columns
      for (const [colName, oldCol] of oldColMap.entries()) {
        if (!newColMap.has(colName)) {
          diffEntries.push({
            kind: "drop_column",
            targetTable: newTbl.name,
            targetObject: oldCol.name,
            isBreakingChange: true,
            requiresTableRewrite: false,
            requiresExclusiveLock: true,
            riskLevel: "high",
            description: `Dropping column "${oldCol.name}" from "${newTbl.name}" will break queries referencing it.`,
            expandContractRecommendation: "Deploy application code that stops reading/writing this column before dropping.",
          });
        }
      }

      // Added & Modified Columns
      for (const [colName, newCol] of newColMap.entries()) {
        const oldCol = oldColMap.get(colName);
        if (!oldCol) {
          // Added Column: Check NOT NULL without DEFAULT hazard!
          const isNotNullWithoutDefault = !newCol.isNullable && newCol.defaultValue === undefined;
          diffEntries.push({
            kind: "add_column",
            targetTable: newTbl.name,
            targetObject: newCol.name,
            isBreakingChange: isNotNullWithoutDefault,
            requiresTableRewrite: isNotNullWithoutDefault,
            requiresExclusiveLock: true,
            riskLevel: isNotNullWithoutDefault ? "critical" : "low",
            description: isNotNullWithoutDefault
              ? `Adding NOT NULL column "${newCol.name}" without a DEFAULT value requires a full table rewrite and exclusive lock on "${newTbl.name}".`
              : `Adding nullable or defaulted column "${newCol.name}" to "${newTbl.name}".`,
            expandContractRecommendation: isNotNullWithoutDefault
              ? "Add column as NULLABLE first -> Backfill values in batches -> Add NOT NULL constraint with VALIDATE."
              : undefined,
          });
        } else {
          // Altered Type
          if (oldCol.dataType.toLowerCase() !== newCol.dataType.toLowerCase()) {
            diffEntries.push({
              kind: "alter_column_type",
              targetTable: newTbl.name,
              targetObject: newCol.name,
              isBreakingChange: true,
              requiresTableRewrite: true,
              requiresExclusiveLock: true,
              riskLevel: "high",
              description: `Altering column "${newCol.name}" data type from ${oldCol.dataType} to ${newCol.dataType} requires a full table rewrite.`,
              expandContractRecommendation: "Use expand-and-contract: add new typed column, dual-write, backfill, cutover.",
            });
          }

          // Altered Nullability
          if (oldCol.isNullable && !newCol.isNullable && newCol.defaultValue === undefined) {
            diffEntries.push({
              kind: "alter_column_nullability",
              targetTable: newTbl.name,
              targetObject: newCol.name,
              isBreakingChange: true,
              requiresTableRewrite: false,
              requiresExclusiveLock: true,
              riskLevel: "medium",
              description: `Changing column "${newCol.name}" to NOT NULL acquires an exclusive lock to validate existing rows.`,
              expandContractRecommendation: "Add a CHECK (col IS NOT NULL) NOT VALID constraint -> VALIDATE CONSTRAINT concurrently.",
            });
          }
        }
      }
    }

    // Generate Findings from High-Risk Diff Entries
    let breakingMigrationCount = 0;
    for (const diff of diffEntries) {
      if (diff.isBreakingChange || diff.riskLevel === "critical" || diff.riskLevel === "high") {
        breakingMigrationCount++;
        findings.push({
          id: `finding-migration-risk-${diff.targetTable}-${diff.targetObject}`,
          category: "breaking_migration_table_rewrite",
          severity: diff.riskLevel === "critical" ? "critical" : "high",
          title: `Migration Risk: ${diff.description}`,
          explanation: diff.description,
          evidence: [
            `Change Kind: ${diff.kind}`,
            `Table: ${diff.targetTable}`,
            `Object: ${diff.targetObject}`,
            `Requires Table Rewrite: ${diff.requiresTableRewrite ? "Yes" : "No"}`,
            `Exclusive Lock: ${diff.requiresExclusiveLock ? "Yes" : "No"}`,
          ],
          riskAnalysis:
            "Prolonged exclusive table locking, query timeouts, and potential application downtime during migration deployment.",
          remediation: diff.expandContractRecommendation || "Review migration steps and schedule during off-peak maintenance window.",
        });
      }
    }

    // Build Step-by-Step Expand-and-Contract Migration Plan
    const steps: DatabaseMigrationPlan["steps"] = [];
    steps.push({
      phase: "expand",
      name: "1. Expand Schema",
      description: "Apply backward-compatible DDL (add nullable columns, create indexes concurrently, add new tables).",
      reversible: true,
      requiresLock: false,
    });
    steps.push({
      phase: "deploy_app",
      name: "2. Deploy Dual-Writing App",
      description: "Deploy application release capable of reading old columns while writing to both old and new representations.",
      reversible: true,
      requiresLock: false,
    });
    steps.push({
      phase: "backfill",
      name: "3. Backfill Data",
      description: "Execute background batch worker to populate historical data in new columns without holding table locks.",
      reversible: true,
      requiresLock: false,
    });
    steps.push({
      phase: "validate",
      name: "4. Validate Constraints",
      description: "Validate CHECK constraints and verify zero nulls or data discrepancy between representations.",
      reversible: true,
      requiresLock: false,
    });
    steps.push({
      phase: "switch",
      name: "5. Switch Read Traffic",
      description: "Switch application read paths to the new schema representation.",
      reversible: true,
      requiresLock: false,
    });
    steps.push({
      phase: "contract",
      name: "6. Contract Schema",
      description: "Drop deprecated columns and obsolete tables once all application consumers have migrated.",
      reversible: false,
      requiresLock: true,
    });

    const migrationPlan: DatabaseMigrationPlan = {
      id: `plan-mig-${oldSchema.id}-${newSchema.id}`,
      name: `Migration Plan: ${oldSchema.schemaVersion} -> ${newSchema.schemaVersion}`,
      fromRevision: oldSchema.architectureRevisionId,
      toRevision: newSchema.architectureRevisionId,
      diffEntries,
      steps,
      estimatedDowntimeRequiredSeconds: breakingMigrationCount > 0 ? 0 : 0, // 0 with expand-and-contract!
    };

    return {
      diffEntries,
      migrationPlan,
      findings,
      breakingMigrationCount,
    };
  }
}
