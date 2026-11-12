import type {
  ParsedQuery,
  BinaryOperator,
  FilterExpression,
  JoinDefinition,
  AggregateExpression,
  OrderByExpression,
} from "./database-schemas";

export class SqlParser {
  /**
   * Parses a safe, restricted SQL statement into a strongly typed AST.
   * Throws an Error with a descriptive explanation if the syntax is unsupported or malformed.
   */
  public static parse(sql: string): ParsedQuery {
    const trimmed = sql.trim().replace(/;+$/, "").trim();
    if (!trimmed) {
      throw new Error("Empty SQL query string.");
    }

    const firstWordMatch = trimmed.match(/^([A-Za-z]+)/);
    if (!firstWordMatch) {
      throw new Error("Unable to parse query verb.");
    }

    const verb = firstWordMatch[1].toUpperCase();

    switch (verb) {
      case "SELECT":
        return this.parseSelect(trimmed);
      case "INSERT":
        return this.parseInsert(trimmed);
      case "UPDATE":
        return this.parseUpdate(trimmed);
      case "DELETE":
        return this.parseDelete(trimmed);
      default:
        throw new Error(`Unsupported SQL query command "${verb}". Supported commands: SELECT, INSERT, UPDATE, DELETE.`);
    }
  }

  public static safeParse(sql: string): { success: boolean; ast?: ParsedQuery; error?: string } {
    try {
      const ast = this.parse(sql);
      return { success: true, ast };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private static parseSelect(sql: string): ParsedQuery {
    // Regex tokenizer to split primary SQL clauses
    // SELECT ... FROM ... [JOIN ...] [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT ...]
    const fromIndex = this.findKeywordIndex(sql, "FROM");
    if (fromIndex === -1) {
      throw new Error("SELECT statement missing mandatory FROM clause.");
    }

    const selectClause = sql.substring(6, fromIndex).trim();
    const rest = sql.substring(fromIndex + 4).trim();

    // Parse Columns & Aggregates
    const { columns, aggregates } = this.parseSelectItems(selectClause);

    // Parse FROM table and possible alias
    const tokens = rest.split(/\s+/);
    const primaryTable = tokens[0].replace(/,/g, "").trim();
    let alias: string | undefined = undefined;
    let nextTokenIndex = 1;

    if (tokens.length > 1 && !this.isClauseKeyword(tokens[1])) {
      if (tokens[1].toUpperCase() === "AS" && tokens.length > 2) {
        alias = tokens[2];
        nextTokenIndex = 3;
      } else {
        alias = tokens[1];
        nextTokenIndex = 2;
      }
    }

    const remainingClauseStr = tokens.slice(nextTokenIndex).join(" ");

    // Extract optional JOIN, WHERE, GROUP BY, ORDER BY, LIMIT
    const joins = this.parseJoins(remainingClauseStr);
    const where = this.parseWhere(remainingClauseStr);
    const groupBy = this.parseGroupBy(remainingClauseStr);
    const orderBy = this.parseOrderBy(remainingClauseStr);
    const limit = this.parseLimit(remainingClauseStr);

    return {
      rawSql: sql,
      type: "SELECT",
      table: primaryTable,
      alias,
      columns,
      joins,
      where,
      groupBy,
      aggregates,
      orderBy,
      limit,
    };
  }

  private static parseInsert(sql: string): ParsedQuery {
    // INSERT INTO <table> [(col1, col2)] VALUES (val1, val2)
    const match = sql.match(/INSERT\s+INTO\s+([A-Za-z0-9_]+)\s*(?:\(([^)]+)\))?\s+VALUES\s*\(([^)]+)\)/i);
    if (!match) {
      throw new Error("Invalid INSERT INTO syntax. Expected: INSERT INTO <table> (cols...) VALUES (values...)");
    }

    const table = match[1];
    const cols = match[2] ? match[2].split(",").map((c) => c.trim()) : [];
    const rawValues = match[3].split(",").map((v) => this.parseLiteral(v.trim()));

    const insertValues: Record<string, unknown> = {};
    if (cols.length > 0) {
      for (let i = 0; i < cols.length; i++) {
        insertValues[cols[i]] = rawValues[i];
      }
    } else {
      rawValues.forEach((val, i) => {
        insertValues[`col_${i + 1}`] = val;
      });
    }

    return {
      rawSql: sql,
      type: "INSERT",
      table,
      columns: Object.keys(insertValues),
      insertValues,
    };
  }

  private static parseUpdate(sql: string): ParsedQuery {
    // UPDATE <table> SET col1 = val1, col2 = val2 [WHERE ...]
    const setIdx = this.findKeywordIndex(sql, "SET");
    if (setIdx === -1) {
      throw new Error("Invalid UPDATE syntax. Missing SET clause.");
    }

    const tablePart = sql.substring(6, setIdx).trim();
    const table = tablePart.split(/\s+/)[0];

    const whereIdx = this.findKeywordIndex(sql, "WHERE");
    const setClause = whereIdx !== -1 ? sql.substring(setIdx + 3, whereIdx).trim() : sql.substring(setIdx + 3).trim();

    const updateSet: Record<string, unknown> = {};
    const assignments = setClause.split(",");
    for (const assignment of assignments) {
      const [col, val] = assignment.split("=").map((s) => s.trim());
      if (col && val !== undefined) {
        updateSet[col] = this.parseLiteral(val);
      }
    }

    const where = whereIdx !== -1 ? this.parseWhere(sql.substring(whereIdx)) : undefined;

    return {
      rawSql: sql,
      type: "UPDATE",
      table,
      columns: Object.keys(updateSet),
      updateSet,
      where,
    };
  }

  private static parseDelete(sql: string): ParsedQuery {
    // DELETE FROM <table> [WHERE ...]
    const fromIdx = this.findKeywordIndex(sql, "FROM");
    if (fromIdx === -1) {
      throw new Error("Invalid DELETE syntax. Expected: DELETE FROM <table> [WHERE ...]");
    }

    const afterFrom = sql.substring(fromIdx + 4).trim();
    const whereIdx = this.findKeywordIndex(afterFrom, "WHERE");
    const table = (whereIdx !== -1 ? afterFrom.substring(0, whereIdx) : afterFrom).trim().split(/\s+/)[0];

    const where = whereIdx !== -1 ? this.parseWhere(afterFrom.substring(whereIdx)) : undefined;

    return {
      rawSql: sql,
      type: "DELETE",
      table,
      columns: ["*"],
      where,
    };
  }

  private static parseSelectItems(selectStr: string): {
    columns: string[];
    aggregates: AggregateExpression[];
  } {
    const rawItems = selectStr.split(",").map((s) => s.trim());
    const columns: string[] = [];
    const aggregates: AggregateExpression[] = [];

    for (const item of rawItems) {
      // Check for Aggregate function e.g. COUNT(*), SUM(price), AVG(latency)
      const aggMatch = item.match(/^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*([A-Za-z0-9_.*]+)\s*\)(?:\s+(?:AS\s+)?([A-Za-z0-9_]+))?$/i);
      if (aggMatch) {
        aggregates.push({
          function: aggMatch[1].toUpperCase() as any,
          column: aggMatch[2],
          alias: aggMatch[3],
        });
      } else {
        const colMatch = item.match(/^([A-Za-z0-9_.*]+)(?:\s+(?:AS\s+)?([A-Za-z0-9_]+))?$/i);
        if (colMatch) {
          columns.push(colMatch[1]);
        } else {
          columns.push(item);
        }
      }
    }

    return { columns, aggregates };
  }

  private static parseJoins(clauseStr: string): JoinDefinition[] {
    const joins: JoinDefinition[] = [];
    const joinRegex = /(?:(INNER|LEFT)\s+)?JOIN\s+([A-Za-z0-9_]+)(?:\s+(?:AS\s+)?([A-Za-z0-9_]+))?\s+ON\s+([A-Za-z0-9_.]+)\s*=\s*([A-Za-z0-9_.]+)/gi;

    let match: RegExpExecArray | null;
    while ((match = joinRegex.exec(clauseStr)) !== null) {
      const type = (match[1]?.toUpperCase() || "INNER") as "INNER" | "LEFT";
      const table = match[2];
      const alias = match[3];
      const leftColRaw = match[4];
      const rightColRaw = match[5];

      const [leftTable, leftCol] = leftColRaw.includes(".") ? leftColRaw.split(".") : [undefined, leftColRaw];
      const [rightTable, rightCol] = rightColRaw.includes(".") ? rightColRaw.split(".") : [undefined, rightColRaw];

      joins.push({
        type,
        table,
        alias,
        on: {
          leftTable,
          leftColumn: leftCol,
          rightTable,
          rightColumn: rightCol,
        },
      });
    }

    return joins;
  }

  private static parseWhere(clauseStr: string): FilterExpression | undefined {
    const whereIdx = this.findKeywordIndex(clauseStr, "WHERE");
    if (whereIdx === -1) return undefined;

    let whereSubstring = clauseStr.substring(whereIdx + 5).trim();

    // End at GROUP BY, ORDER BY, or LIMIT
    const endIdxs = [
      this.findKeywordIndex(whereSubstring, "GROUP BY"),
      this.findKeywordIndex(whereSubstring, "ORDER BY"),
      this.findKeywordIndex(whereSubstring, "LIMIT"),
    ].filter((i) => i !== -1);

    if (endIdxs.length > 0) {
      const firstEnd = Math.min(...endIdxs);
      whereSubstring = whereSubstring.substring(0, firstEnd).trim();
    }

    return this.parsePredicateString(whereSubstring);
  }

  private static parsePredicateString(predicate: string): FilterExpression {
    const trimmed = predicate.trim();

    // Check for OR first (lowest precedence)
    const orParts = this.splitTopLevel(trimmed, "OR");
    if (orParts.length > 1) {
      return {
        or: orParts.map((p) => this.parsePredicateString(p)),
      };
    }

    // Check for AND
    const andParts = this.splitTopLevel(trimmed, "AND");
    if (andParts.length > 1) {
      return {
        and: andParts.map((p) => this.parsePredicateString(p)),
      };
    }

    // Check for IS NULL / IS NOT NULL
    const isNotNullMatch = trimmed.match(/^([A-Za-z0-9_.]+)\s+IS\s+NOT\s+NULL$/i);
    if (isNotNullMatch) {
      return {
        leftColumn: isNotNullMatch[1],
        isNotNull: true,
      };
    }

    const isNullMatch = trimmed.match(/^([A-Za-z0-9_.]+)\s+IS\s+NULL$/i);
    if (isNullMatch) {
      return {
        leftColumn: isNullMatch[1],
        isNull: true,
      };
    }

    // Check for Binary Operator (=, !=, <>, <, <=, >, >=, LIKE)
    const binMatch = trimmed.match(/^([A-Za-z0-9_.]+)\s*(=|!=|<>|<=|>=|<|>|LIKE)\s*(.+)$/i);
    if (binMatch) {
      const leftCol = binMatch[1].trim();
      let op = binMatch[2].toUpperCase();
      if (op === "<>") op = "!=";

      const rightRaw = binMatch[3].trim();
      // Check if right is column reference or literal
      const isColumnRef = /^[A-Za-z0-9_]+\.[A-Za-z0-9_]+$/.test(rightRaw);

      return {
        leftColumn: leftCol,
        operator: op as BinaryOperator,
        rightValue: isColumnRef ? undefined : this.parseLiteral(rightRaw),
        rightColumn: isColumnRef ? rightRaw : undefined,
      };
    }

    return {};
  }

  private static parseGroupBy(clauseStr: string): string[] | undefined {
    const groupIdx = this.findKeywordIndex(clauseStr, "GROUP BY");
    if (groupIdx === -1) return undefined;

    let sub = clauseStr.substring(groupIdx + 8).trim();
    const endIdxs = [
      this.findKeywordIndex(sub, "ORDER BY"),
      this.findKeywordIndex(sub, "LIMIT"),
    ].filter((i) => i !== -1);

    if (endIdxs.length > 0) {
      sub = sub.substring(0, Math.min(...endIdxs)).trim();
    }

    return sub.split(",").map((s) => s.trim());
  }

  private static parseOrderBy(clauseStr: string): OrderByExpression[] | undefined {
    const orderIdx = this.findKeywordIndex(clauseStr, "ORDER BY");
    if (orderIdx === -1) return undefined;

    let sub = clauseStr.substring(orderIdx + 8).trim();
    const limitIdx = this.findKeywordIndex(sub, "LIMIT");
    if (limitIdx !== -1) {
      sub = sub.substring(0, limitIdx).trim();
    }

    return sub.split(",").map((part) => {
      const match = part.trim().match(/^([A-Za-z0-9_.]+)(?:\s+(ASC|DESC))?$/i);
      if (match) {
        return {
          column: match[1],
          direction: (match[2]?.toUpperCase() || "ASC") as "ASC" | "DESC",
        };
      }
      return { column: part.trim(), direction: "ASC" };
    });
  }

  private static parseLimit(clauseStr: string): number | undefined {
    const match = clauseStr.match(/\bLIMIT\s+(\d+)\b/i);
    return match ? Number(match[1]) : undefined;
  }

  private static parseLiteral(raw: string): unknown {
    if (raw === "NULL" || raw === "null") return null;
    if (raw === "TRUE" || raw === "true") return true;
    if (raw === "FALSE" || raw === "false") return false;

    // Quoted string '...' or "..."
    if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
      return raw.slice(1, -1);
    }

    // Number
    if (!isNaN(Number(raw))) {
      return Number(raw);
    }

    return raw;
  }

  private static findKeywordIndex(sql: string, keyword: string): number {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    const match = regex.exec(sql);
    return match ? match.index : -1;
  }

  private static isClauseKeyword(token: string): boolean {
    const upper = token.toUpperCase();
    return [
      "JOIN",
      "INNER",
      "LEFT",
      "RIGHT",
      "WHERE",
      "GROUP",
      "HAVING",
      "ORDER",
      "LIMIT",
      "ON",
    ].includes(upper);
  }

  private static splitTopLevel(str: string, keyword: string): string[] {
    const regex = new RegExp(`\\s+${keyword}\\s+`, "i");
    const parts = str.split(regex);
    return parts.length > 1 ? parts : [str];
  }
}
