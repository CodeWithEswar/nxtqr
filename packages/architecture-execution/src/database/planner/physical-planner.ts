import type {
  ParsedQuery,
  DatabaseSchema,
  QueryExecutionPlan,
  PlanOperator,
  IndexDefinition,
} from "../database-schemas";
import { LogicalPlanner } from "./logical-planner";
import { CostModel } from "./cost-model";

export class PhysicalPlanner {
  /**
   * Generates a concrete physical execution plan from a ParsedQuery.
   * Evaluates available indexes and dataset sizes to select between SeqScan vs IndexScan and NestedLoop vs HashJoin.
   */
  public static plan(
    queryId: string,
    query: ParsedQuery,
    schema: DatabaseSchema,
    fixtures: Record<string, import("../database-schemas").DatabaseRow[]>
  ): QueryExecutionPlan {
    const fixtureCounts: Record<string, number> = {};
    for (const [table, rows] of Object.entries(fixtures)) {
      fixtureCounts[table] = rows.length;
    }

    const logical = LogicalPlanner.plan(query, schema, fixtureCounts);
    const operators: Record<string, PlanOperator> = { ...logical.operators };

    const tableDef = schema.tables[query.table];
    const tableRows = fixtures[query.table] || [];

    // 1. Evaluate Index Scan vs Seq Scan on primary table
    const matchingIndex = this.findMatchingIndex(query, tableDef);
    const baseScanOp = Object.values(operators).find(
      (op) => op.logicalOperator === "Scan" && op.tableName === query.table
    );

    if (baseScanOp) {
      if (matchingIndex) {
        // Use Index Scan
        baseScanOp.physicalOperator = "IndexScan";
        baseScanOp.indexName = matchingIndex.name;
        baseScanOp.estimatedRows = matchingIndex.unique ? 1 : Math.max(1, Math.round(tableRows.length * 0.1));
        baseScanOp.cost = CostModel.estimateIndexScanCost(tableRows.length, baseScanOp.estimatedRows);
        baseScanOp.description = `Index Scan using "${matchingIndex.name}" on table "${query.table}" (Lookup key: ${query.where?.leftColumn} = ${query.where?.rightValue})`;
      } else {
        // Use Sequential Scan
        baseScanOp.physicalOperator = "SeqScan";
        baseScanOp.estimatedRows = tableRows.length;
        baseScanOp.cost = CostModel.estimateSeqScanCost(tableRows.length);
        baseScanOp.description = `Sequential Scan on "${query.table}" (${tableRows.length} rows)`;
      }
    }

    // 2. Evaluate Join physical operators
    const joinOps = Object.values(operators).filter((op) => op.logicalOperator === "Join");
    for (const joinOp of joinOps) {
      const outerChild = operators[joinOp.children[0]];
      const innerChild = operators[joinOp.children[1]];
      const outerRows = outerChild?.estimatedRows || 10;
      const innerRows = innerChild?.estimatedRows || 10;

      // Check if Hash Join is more optimal for larger datasets (> 20 rows)
      if (outerRows > 20 || innerRows > 20) {
        joinOp.physicalOperator = "HashJoin";
        joinOp.cost = CostModel.estimateJoinCost("hash", outerRows, innerRows);
        joinOp.description = `Hash Join: Build hash table on inner (${innerRows} rows), probe with outer (${outerRows} rows)`;
      } else {
        joinOp.physicalOperator = "NestedLoopJoin";
        joinOp.cost = CostModel.estimateJoinCost("nested_loop", outerRows, innerRows);
        joinOp.description = `Nested Loop Join: Iterating outer (${outerRows} rows) × inner (${innerRows} rows)`;
      }
    }

    // 3. Evaluate Sort physical operators
    const sortOps = Object.values(operators).filter((op) => op.logicalOperator === "Sort");
    for (const sortOp of sortOps) {
      const child = operators[sortOp.children[0]];
      const rows = child?.estimatedRows || 10;
      sortOp.cost = CostModel.estimateSortCost(rows);
    }

    // 4. Sum total costs & duration
    let totalEstimatedCost = 0;
    let totalModeledDurationMs = 0;
    for (const op of Object.values(operators)) {
      totalEstimatedCost += op.cost.total;
      totalModeledDurationMs += op.cost.modeledDurationMs;
    }

    return {
      id: `plan_${queryId}`,
      queryId,
      rootOperatorId: logical.rootId,
      operators,
      totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
      totalActualRows: 0,
      totalModeledDurationMs,
    };
  }

  private static findMatchingIndex(
    query: ParsedQuery,
    tableDef?: import("../database-schemas").TableDefinition
  ): IndexDefinition | undefined {
    if (!tableDef || !query.where) return undefined;

    // Check if WHERE filter has an equality condition
    const where = query.where;
    if (where.leftColumn && where.operator === "=") {
      const colName = where.leftColumn.toLowerCase();
      const pureCol = colName.includes(".") ? colName.split(".")[1] : colName;

      // Check Primary Key
      if (tableDef.primaryKey.some((pk) => pk.toLowerCase() === pureCol)) {
        return {
          id: `idx_pk_${tableDef.name}`,
          name: `${tableDef.name}_pkey`,
          tableName: tableDef.name,
          columns: [pureCol],
          unique: true,
          type: "btree",
        };
      }

      // Check defined table indexes
      if (tableDef.indexes && tableDef.indexes.length > 0) {
        const found = tableDef.indexes.find((idx) =>
          idx.columns.some((c) => c.toLowerCase() === pureCol)
        );
        if (found) return found;
      }
    }

    return undefined;
  }
}
