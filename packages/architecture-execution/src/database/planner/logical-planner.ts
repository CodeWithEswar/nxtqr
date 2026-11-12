import type {
  ParsedQuery,
  DatabaseSchema,
  PlanOperator,
} from "../database-schemas";

export interface LogicalPlanResult {
  rootId: string;
  operators: Record<string, PlanOperator>;
}

export class LogicalPlanner {
  /**
   * Translates a ParsedQuery AST into a logical operator tree.
   */
  public static plan(query: ParsedQuery, _schema: DatabaseSchema, fixtureRowsCount: Record<string, number>): LogicalPlanResult {
    const operators: Record<string, PlanOperator> = {};
    let opCounter = 1;
    const nextId = (prefix: string) => `${prefix}_${opCounter++}`;

    // 1. Base Scan
    const baseTableRows = fixtureRowsCount[query.table] || 10;
    const scanId = nextId("logical_scan");
    operators[scanId] = {
      id: scanId,
      logicalOperator: "Scan",
      physicalOperator: "SeqScan", // physical planner will refine
      tableName: query.table,
      estimatedRows: baseTableRows,
      actualRows: 0,
      cost: { startup: 0, total: baseTableRows, rowVisits: baseTableRows, indexProbes: 0, comparisons: 0, modeledDurationMs: 5 },
      children: [],
      description: `Scan table "${query.table}"`,
      intermediateRows: [],
    };
    let currentRootId = scanId;

    // 2. Joins
    if (query.joins && query.joins.length > 0) {
      for (const join of query.joins) {
        const joinTableRows = fixtureRowsCount[join.table] || 10;
        const joinScanId = nextId("logical_join_scan");
        operators[joinScanId] = {
          id: joinScanId,
          logicalOperator: "Scan",
          physicalOperator: "SeqScan",
          tableName: join.table,
          estimatedRows: joinTableRows,
          actualRows: 0,
          cost: { startup: 0, total: joinTableRows, rowVisits: joinTableRows, indexProbes: 0, comparisons: 0, modeledDurationMs: 5 },
          children: [],
          description: `Scan joined table "${join.table}"`,
          intermediateRows: [],
        };

        const joinId = nextId("logical_join");
        const estimatedJoinedRows = Math.round(baseTableRows * 0.8);
        operators[joinId] = {
          id: joinId,
          logicalOperator: "Join",
          physicalOperator: "NestedLoopJoin",
          estimatedRows: estimatedJoinedRows,
          actualRows: 0,
          cost: { startup: 0, total: baseTableRows * joinTableRows * 0.1, rowVisits: baseTableRows + joinTableRows, indexProbes: 0, comparisons: baseTableRows * joinTableRows, modeledDurationMs: 10 },
          children: [currentRootId, joinScanId],
          description: `${join.type} Join on ${join.on.leftColumn} = ${join.on.rightColumn}`,
          intermediateRows: [],
        };
        currentRootId = joinId;
      }
    }

    // 3. Filter
    if (query.where) {
      const filterId = nextId("logical_filter");
      const estFilteredRows = Math.max(1, Math.round(operators[currentRootId].estimatedRows * 0.4));
      operators[filterId] = {
        id: filterId,
        logicalOperator: "Filter",
        physicalOperator: "Filter",
        estimatedRows: estFilteredRows,
        actualRows: 0,
        cost: { startup: 0, total: operators[currentRootId].estimatedRows * 0.05, rowVisits: operators[currentRootId].estimatedRows, indexProbes: 0, comparisons: operators[currentRootId].estimatedRows, modeledDurationMs: 5 },
        children: [currentRootId],
        description: `Filter rows matching predicate`,
        intermediateRows: [],
      };
      currentRootId = filterId;
    }

    // 4. Aggregates / Group By
    if ((query.aggregates && query.aggregates.length > 0) || (query.groupBy && query.groupBy.length > 0)) {
      const aggId = nextId("logical_aggregate");
      const estAggRows = query.groupBy ? Math.min(10, operators[currentRootId].estimatedRows) : 1;
      operators[aggId] = {
        id: aggId,
        logicalOperator: "Aggregate",
        physicalOperator: "Aggregate",
        estimatedRows: estAggRows,
        actualRows: 0,
        cost: { startup: 1, total: operators[currentRootId].estimatedRows * 0.1, rowVisits: operators[currentRootId].estimatedRows, indexProbes: 0, comparisons: operators[currentRootId].estimatedRows, modeledDurationMs: 5 },
        children: [currentRootId],
        description: `Aggregate ${query.aggregates?.map((a) => `${a.function}(${a.column})`).join(", ") || "rows"}`,
        intermediateRows: [],
      };
      currentRootId = aggId;
    }

    // 5. Sort / Order By
    if (query.orderBy && query.orderBy.length > 0) {
      const sortId = nextId("logical_sort");
      const prevEst = operators[currentRootId].estimatedRows;
      operators[sortId] = {
        id: sortId,
        logicalOperator: "Sort",
        physicalOperator: "Sort",
        estimatedRows: prevEst,
        actualRows: 0,
        cost: { startup: 2, total: prevEst * Math.log2(Math.max(2, prevEst)) * 0.1, rowVisits: prevEst, indexProbes: 0, comparisons: prevEst, modeledDurationMs: 5 },
        children: [currentRootId],
        description: `Sort by ${query.orderBy.map((o) => `${o.column} ${o.direction}`).join(", ")}`,
        intermediateRows: [],
      };
      currentRootId = sortId;
    }

    // 6. Project
    const projId = nextId("logical_project");
    const finalEst = operators[currentRootId].estimatedRows;
    operators[projId] = {
      id: projId,
      logicalOperator: "Project",
      physicalOperator: "Projection",
      estimatedRows: finalEst,
      actualRows: 0,
      cost: { startup: 0, total: finalEst * 0.01, rowVisits: finalEst, indexProbes: 0, comparisons: 0, modeledDurationMs: 2 },
      children: [currentRootId],
      description: `Project columns [${query.columns.join(", ")}]`,
      intermediateRows: [],
    };
    currentRootId = projId;

    // 7. Limit
    if (query.limit !== undefined) {
      const limitId = nextId("logical_limit");
      const limitedEst = Math.min(query.limit, operators[currentRootId].estimatedRows);
      operators[limitId] = {
        id: limitId,
        logicalOperator: "Limit",
        physicalOperator: "Limit",
        estimatedRows: limitedEst,
        actualRows: 0,
        cost: { startup: 0, total: limitedEst * 0.01, rowVisits: limitedEst, indexProbes: 0, comparisons: 0, modeledDurationMs: 1 },
        children: [currentRootId],
        description: `Limit to ${query.limit} rows`,
        intermediateRows: [],
      };
      currentRootId = limitId;
    }

    return {
      rootId: currentRootId,
      operators,
    };
  }
}
