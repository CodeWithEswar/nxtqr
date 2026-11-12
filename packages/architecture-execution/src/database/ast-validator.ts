import type { DatabaseSchema, ParsedQuery } from "./database-schemas";

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
  field?: string;
}

export class AstValidator {
  /**
   * Validates a ParsedQuery against the active DatabaseSchema.
   * Ensures referenced tables and columns exist and operator types are compatible.
   */
  public static validate(query: ParsedQuery, schema: DatabaseSchema): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // 1. Validate primary table
    const tableDef = schema.tables[query.table];
    if (!tableDef) {
      issues.push({
        severity: "error",
        message: `Table "${query.table}" does not exist in the active schema. Available tables: ${Object.keys(schema.tables).join(", ")}.`,
        field: "table",
      });
      return issues; // cannot validate columns if table is invalid
    }

    const availableColumns = new Map<string, string>(); // column -> table
    for (const col of tableDef.columns) {
      availableColumns.set(col.name.toLowerCase(), query.table);
    }

    // 2. Validate JOIN tables and conditions
    if (query.joins && query.joins.length > 0) {
      for (const join of query.joins) {
        const joinTableDef = schema.tables[join.table];
        if (!joinTableDef) {
          issues.push({
            severity: "error",
            message: `Joined table "${join.table}" does not exist in the active schema.`,
            field: "joins",
          });
          continue;
        }

        // Add joined columns
        for (const col of joinTableDef.columns) {
          availableColumns.set(col.name.toLowerCase(), join.table);
          if (join.alias) {
            availableColumns.set(`${join.alias.toLowerCase()}.${col.name.toLowerCase()}`, join.table);
          }
          availableColumns.set(`${join.table.toLowerCase()}.${col.name.toLowerCase()}`, join.table);
        }

        // Validate ON columns
        const leftColName = join.on.leftColumn.toLowerCase();
        const rightColName = join.on.rightColumn.toLowerCase();

        const leftExists =
          tableDef.columns.some((c) => c.name.toLowerCase() === leftColName) ||
          joinTableDef.columns.some((c) => c.name.toLowerCase() === leftColName);
        const rightExists =
          joinTableDef.columns.some((c) => c.name.toLowerCase() === rightColName) ||
          tableDef.columns.some((c) => c.name.toLowerCase() === rightColName);

        if (!leftExists) {
          issues.push({
            severity: "error",
            message: `Join condition left column "${join.on.leftColumn}" not found in involved tables.`,
            field: "joins.on",
          });
        }
        if (!rightExists) {
          issues.push({
            severity: "error",
            message: `Join condition right column "${join.on.rightColumn}" not found in involved tables.`,
            field: "joins.on",
          });
        }
      }
    }

    // 3. Validate SELECT columns
    if (query.columns && query.columns.length > 0) {
      for (const col of query.columns) {
        if (col === "*") continue;
        const normalized = col.toLowerCase();
        const pureCol = normalized.includes(".") ? normalized.split(".")[1] : normalized;

        if (!availableColumns.has(normalized) && !availableColumns.has(pureCol)) {
          issues.push({
            severity: "error",
            message: `Referenced column "${col}" does not exist on table "${query.table}" or joined tables.`,
            field: "columns",
          });
        }
      }
    }

    // 4. Validate WHERE predicate columns
    if (query.where) {
      this.validateFilter(query.where, availableColumns, issues);
    }

    // 5. Validate ORDER BY columns
    if (query.orderBy) {
      for (const ord of query.orderBy) {
        const norm = ord.column.toLowerCase();
        const pureCol = norm.includes(".") ? norm.split(".")[1] : norm;
        if (!availableColumns.has(norm) && !availableColumns.has(pureCol)) {
          issues.push({
            severity: "warning",
            message: `ORDER BY column "${ord.column}" does not exist in active query projection.`,
            field: "orderBy",
          });
        }
      }
    }

    return issues;
  }

  private static validateFilter(
    filter: import("./database-schemas").FilterExpression,
    availableCols: Map<string, string>,
    issues: ValidationIssue[]
  ): void {
    if (filter.and) {
      for (const sub of filter.and) {
        this.validateFilter(sub, availableCols, issues);
      }
      return;
    }

    if (filter.or) {
      for (const sub of filter.or) {
        this.validateFilter(sub, availableCols, issues);
      }
      return;
    }

    if (filter.leftColumn) {
      const norm = filter.leftColumn.toLowerCase();
      const pureCol = norm.includes(".") ? norm.split(".")[1] : norm;
      if (!availableCols.has(norm) && !availableCols.has(pureCol)) {
        issues.push({
          severity: "error",
          message: `WHERE filter column "${filter.leftColumn}" not found in active query scope.`,
          field: "where",
        });
      }
    }
  }
}
