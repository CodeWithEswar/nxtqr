import type {
  DatabaseRow,
  FilterExpression,
  JoinDefinition,
  AggregateExpression,
  OrderByExpression,
} from "../database-schemas";

export class OperatorsEngine {
  /**
   * Evaluates a FilterExpression against a single DatabaseRow.
   */
  public static evaluateFilter(row: DatabaseRow, filter?: FilterExpression): boolean {
    if (!filter) return true;

    // Composite OR
    if (filter.or && filter.or.length > 0) {
      return filter.or.some((sub) => this.evaluateFilter(row, sub));
    }

    // Composite AND
    if (filter.and && filter.and.length > 0) {
      return filter.and.every((sub) => this.evaluateFilter(row, sub));
    }

    // Single column filter
    if (filter.leftColumn) {
      const val = this.resolveColumnValue(row, filter.leftColumn);

      if (filter.isNull) {
        return val === null || val === undefined;
      }
      if (filter.isNotNull) {
        return val !== null && val !== undefined;
      }

      const expectedVal = filter.rightColumn
        ? this.resolveColumnValue(row, filter.rightColumn)
        : filter.rightValue;

      switch (filter.operator) {
        case "=":
          return val === expectedVal || String(val) === String(expectedVal);
        case "!=":
          return val !== expectedVal && String(val) !== String(expectedVal);
        case "<":
          return Number(val) < Number(expectedVal);
        case "<=":
          return Number(val) <= Number(expectedVal);
        case ">":
          return Number(val) > Number(expectedVal);
        case ">=":
          return Number(val) >= Number(expectedVal);
        case "LIKE":
          return typeof val === "string" && typeof expectedVal === "string"
            ? new RegExp("^" + (expectedVal as string).replace(/%/g, ".*") + "$", "i").test(val)
            : false;
        default:
          return true;
      }
    }

    return true;
  }

  /**
   * Projects requested columns from a row.
   */
  public static projectRow(row: DatabaseRow, columns: string[]): DatabaseRow {
    if (columns.includes("*") || columns.length === 0) {
      return { ...row };
    }

    const projected: DatabaseRow = {};
    for (const col of columns) {
      const pureCol = col.includes(".") ? col.split(".")[1] : col;
      if (row[col] !== undefined) {
        projected[col] = row[col];
      } else if (row[pureCol] !== undefined) {
        projected[pureCol] = row[pureCol];
      }
    }

    return projected;
  }

  /**
   * Performs an in-memory Nested Loop Join between two sets of rows.
   */
  public static nestedLoopJoin(
    outerRows: DatabaseRow[],
    innerRows: DatabaseRow[],
    join: JoinDefinition
  ): { joinedRows: DatabaseRow[]; matchedCount: number } {
    const joinedRows: DatabaseRow[] = [];
    let matchedCount = 0;

    const leftCol = join.on.leftColumn;
    const rightCol = join.on.rightColumn;

    for (const outer of outerRows) {
      let outerMatched = false;
      const leftVal = this.resolveColumnValue(outer, leftCol);

      for (const inner of innerRows) {
        const rightVal = this.resolveColumnValue(inner, rightCol);

        if (leftVal !== undefined && rightVal !== undefined && (leftVal === rightVal || String(leftVal) === String(rightVal))) {
          matchedCount++;
          outerMatched = true;
          joinedRows.push({ ...outer, ...inner });
        }
      }

      if (!outerMatched && join.type === "LEFT") {
        joinedRows.push({ ...outer });
      }
    }

    return { joinedRows, matchedCount };
  }

  /**
   * Performs an in-memory Hash Join.
   */
  public static hashJoin(
    outerRows: DatabaseRow[],
    innerRows: DatabaseRow[],
    join: JoinDefinition
  ): { joinedRows: DatabaseRow[]; matchedCount: number } {
    const joinedRows: DatabaseRow[] = [];
    let matchedCount = 0;

    const leftCol = join.on.leftColumn;
    const rightCol = join.on.rightColumn;

    // 1. Build Phase on Inner Table
    const hashTable = new Map<string, DatabaseRow[]>();
    for (const inner of innerRows) {
      const key = String(this.resolveColumnValue(inner, rightCol));
      if (!hashTable.has(key)) {
        hashTable.set(key, []);
      }
      hashTable.get(key)!.push(inner);
    }

    // 2. Probe Phase with Outer Table
    for (const outer of outerRows) {
      const probeKey = String(this.resolveColumnValue(outer, leftCol));
      const matches = hashTable.get(probeKey);

      if (matches && matches.length > 0) {
        for (const match of matches) {
          matchedCount++;
          joinedRows.push({ ...outer, ...match });
        }
      } else if (join.type === "LEFT") {
        joinedRows.push({ ...outer });
      }
    }

    return { joinedRows, matchedCount };
  }

  /**
   * Sorts rows based on order by expressions.
   */
  public static sortRows(rows: DatabaseRow[], orderBy?: OrderByExpression[]): DatabaseRow[] {
    if (!orderBy || orderBy.length === 0) return [...rows];

    const sorted = [...rows];
    sorted.sort((a, b) => {
      for (const order of orderBy) {
        const valA = this.resolveColumnValue(a, order.column);
        const valB = this.resolveColumnValue(b, order.column);

        if (valA === valB) continue;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const cmp = valA < valB ? -1 : 1;
        return order.direction === "ASC" ? cmp : -cmp;
      }
      return 0;
    });

    return sorted;
  }

  /**
   * Computes aggregation (COUNT, SUM, AVG, MIN, MAX) with optional GROUP BY.
   */
  public static aggregateRows(
    rows: DatabaseRow[],
    aggregates?: AggregateExpression[],
    groupBy?: string[]
  ): DatabaseRow[] {
    if (!aggregates || aggregates.length === 0) return rows;

    if (!groupBy || groupBy.length === 0) {
      // Single global aggregate row
      const aggRow: DatabaseRow = {};
      for (const agg of aggregates) {
        const label = agg.alias || `${agg.function.toLowerCase()}_${agg.column}`;
        aggRow[label] = this.computeSingleAggregate(rows, agg);
      }
      return [aggRow];
    }

    // Grouped aggregation
    const groups = new Map<string, DatabaseRow[]>();
    for (const row of rows) {
      const groupKey = groupBy.map((col) => String(this.resolveColumnValue(row, col))).join("|");
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    }

    const result: DatabaseRow[] = [];
    for (const [, groupRows] of groups.entries()) {
      const outRow: DatabaseRow = {};
      // Populate group keys
      for (const col of groupBy) {
        const pureCol = col.includes(".") ? col.split(".")[1] : col;
        outRow[pureCol] = this.resolveColumnValue(groupRows[0], col);
      }
      // Populate aggregate functions
      for (const agg of aggregates) {
        const label = agg.alias || `${agg.function.toLowerCase()}_${agg.column}`;
        outRow[label] = this.computeSingleAggregate(groupRows, agg);
      }
      result.push(outRow);
    }

    return result;
  }

  private static computeSingleAggregate(rows: DatabaseRow[], agg: AggregateExpression): number {
    if (agg.function === "COUNT") {
      if (agg.column === "*") return rows.length;
      return rows.filter((r) => this.resolveColumnValue(r, agg.column) !== null && this.resolveColumnValue(r, agg.column) !== undefined).length;
    }

    const numericValues = rows
      .map((r) => Number(this.resolveColumnValue(r, agg.column)))
      .filter((n) => !isNaN(n));

    if (numericValues.length === 0) return 0;

    switch (agg.function) {
      case "SUM":
        return numericValues.reduce((sum, v) => sum + v, 0);
      case "AVG": {
        const sum = numericValues.reduce((acc, v) => acc + v, 0);
        return Math.round((sum / numericValues.length) * 100) / 100;
      }
      case "MIN":
        return Math.min(...numericValues);
      case "MAX":
        return Math.max(...numericValues);
      default:
        return rows.length;
    }
  }

  public static resolveColumnValue(row: DatabaseRow, colIdentifier: string): unknown {
    if (row[colIdentifier] !== undefined) return row[colIdentifier];
    const pure = colIdentifier.includes(".") ? colIdentifier.split(".")[1] : colIdentifier;
    return row[pure];
  }
}

