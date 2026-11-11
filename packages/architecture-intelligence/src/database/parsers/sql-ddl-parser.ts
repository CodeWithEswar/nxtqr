/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Safe, Bounded SQL DDL Parser
 */

import type {
  DatabaseTable,
  DatabaseRelationship,
  TableColumn,
  ForeignKeyConstraint,
  TableIndex,
  IndexType,
  ForeignKeyAction,
  DatabaseStateProvenance,
} from "../contracts/database.types";

export interface SqlParseResult {
  tables: DatabaseTable[];
  relationships: DatabaseRelationship[];
  errors: string[];
}

export class SqlDdlParser {
  private static readonly MAX_INPUT_BYTES = 2 * 1024 * 1024; // 2 MB limit
  private static readonly MAX_STATEMENTS = 500;

  public static parse(sql: string, provenance?: DatabaseStateProvenance): SqlParseResult {
    const prov: DatabaseStateProvenance = provenance || {
      source: "imported_configuration",
      sourceIdentifier: "sql_ddl_parser",
      timestamp: new Date().toISOString(),
      graphRevision: "rev-parsed",
      confirmed: true,
    };

    if (sql.length > this.MAX_INPUT_BYTES) {
      return {
        tables: [],
        relationships: [],
        errors: [`SQL input exceeds safety limit of ${this.MAX_INPUT_BYTES} bytes.`],
      };
    }

    // 1. Strip comments (single-line -- and multi-line /* */)
    const cleanedSql = this.stripComments(sql);

    // 2. Split statements by semicolon
    const statements = cleanedSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, this.MAX_STATEMENTS);

    const tablesMap = new Map<string, DatabaseTable>();
    const relationships: DatabaseRelationship[] = [];
    const errors: string[] = [];

    for (const stmt of statements) {
      try {
        if (/^CREATE\s+TABLE/i.test(stmt)) {
          const table = this.parseCreateTable(stmt, prov);
          if (table) {
            tablesMap.set(table.name.toLowerCase(), table);
          }
        } else if (/^CREATE\s+(UNIQUE\s+)?INDEX/i.test(stmt)) {
          this.parseCreateIndex(stmt, tablesMap, prov);
        } else if (/^ALTER\s+TABLE/i.test(stmt)) {
          this.parseAlterTable(stmt, tablesMap);
        }
      } catch (err: unknown) {
        errors.push(`Parse error on statement: "${stmt.slice(0, 50)}...": ${(err as Error).message}`);
      }
    }

    // 3. Build relationships from foreign keys
    for (const table of tablesMap.values()) {
      for (const fk of table.foreignKeys) {
        const targetTable = tablesMap.get(fk.targetTableName.toLowerCase());
        const relId = `rel-${table.name}-${fk.name}`;

        // Check if table is a junction table (e.g. composite PK matching foreign keys)
        const isCompositePK = table.primaryKeyColumnNames.length > 1;
        const pkMatchesFK = table.primaryKeyColumnNames.every((col) =>
          table.foreignKeys.some((f) => f.sourceColumnNames.includes(col))
        );
        if (isCompositePK && pkMatchesFK && table.foreignKeys.length >= 2) {
          table.isJunctionTable = true;
        }

        relationships.push({
          id: relId,
          name: fk.name,
          sourceTableId: table.id,
          targetTableId: targetTable ? targetTable.id : `external-${fk.targetTableName}`,
          relationshipType: table.isJunctionTable ? "many_to_many" : "one_to_many",
          sourceColumnNames: fk.sourceColumnNames,
          targetColumnNames: fk.targetColumnNames,
          foreignKeyConstraintId: fk.id,
          isOptional: fk.sourceColumnNames.some((c) => {
            const col = table.columns.find((tc) => tc.name === c);
            return col ? col.isNullable : false;
          }),
          referentialIntegrityEnforced: true,
        });
      }
    }

    return {
      tables: Array.from(tablesMap.values()),
      relationships,
      errors,
    };
  }

  private static stripComments(sql: string): string {
    return sql
      .replace(/\/\*[\s\S]*?\*\//g, "") // remove /* ... */
      .replace(/--.*$/gm, ""); // remove -- ...
  }

  private static cleanIdentifier(raw: string): string {
    return raw.trim().replace(/^["`\[]/, "").replace(/["`\]]$/, "");
  }

  private static parseCreateTable(
    stmt: string,
    provenance: DatabaseStateProvenance
  ): DatabaseTable | null {
    // Match: CREATE TABLE [IF NOT EXISTS] [schema.]table_name ( ... )
    const match = stmt.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([^\s(]+)\s*\(([\s\S]+)\)/i);
    if (!match) return null;

    const fullTableName = match[1];
    const body = match[2];

    const parts = fullTableName.split(".");
    const schema = parts.length > 1 ? this.cleanIdentifier(parts[0]) : "public";
    const tableName = this.cleanIdentifier(parts.length > 1 ? parts[1] : parts[0]);

    const columns: TableColumn[] = [];
    const foreignKeys: ForeignKeyConstraint[] = [];
    const indexes: TableIndex[] = [];
    const primaryKeyCols: string[] = [];

    // Split column definitions respecting parentheses in types/constraints
    const lines = this.splitTopLevelCommas(body);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (/^CONSTRAINT\s+/i.test(line) || /^PRIMARY\s+KEY/i.test(line) || /^FOREIGN\s+KEY/i.test(line) || /^UNIQUE/i.test(line)) {
        // Table-level constraint
        this.parseTableConstraint(line, primaryKeyCols, foreignKeys, indexes, tableName, provenance);
      } else {
        // Column definition
        const col = this.parseColumn(line, primaryKeyCols, foreignKeys, tableName);
        if (col) {
          columns.push(col);
        }
      }
    }

    // Mark primary key columns
    for (const col of columns) {
      if (primaryKeyCols.includes(col.name)) {
        col.isPrimaryKey = true;
        col.isNullable = false;
      }
    }

    // If primary keys exist, automatically generate PK index if not present
    if (primaryKeyCols.length > 0 && !indexes.some((i) => i.isUnique && i.columnNames.join(",") === primaryKeyCols.join(","))) {
      indexes.unshift({
        id: `idx-${tableName}-pk`,
        name: `${tableName}_pkey`,
        indexType: "btree",
        columnNames: primaryKeyCols,
        isUnique: true,
        estimatedSizeBytes: 16384,
        provenance,
      });
    }

    // Estimate row size
    let avgRowSize = 0;
    for (const col of columns) {
      avgRowSize += this.estimateColumnBytes(col.dataType);
    }
    avgRowSize = Math.max(avgRowSize, 32);

    return {
      id: `tbl-${tableName.toLowerCase()}`,
      name: tableName,
      schema,
      columns,
      primaryKeyColumnNames: primaryKeyCols,
      foreignKeys,
      indexes,
      estimatedRowCount: 1000,
      averageRowSizeBytes: avgRowSize,
      tableSizeBytes: avgRowSize * 1000,
      isJunctionTable: false,
      provenance,
    };
  }

  private static parseColumn(
    line: string,
    primaryKeyCols: string[],
    foreignKeys: ForeignKeyConstraint[],
    tableName: string
  ): TableColumn | null {
    const tokens = line.split(/\s+/);
    if (tokens.length < 2) return null;

    const colName = this.cleanIdentifier(tokens[0]);
    const dataType = tokens[1].toUpperCase();

    const isPrimaryKey = /PRIMARY\s+KEY/i.test(line);
    const isNotNull = /NOT\s+NULL/i.test(line);
    const isUnique = /UNIQUE/i.test(line);

    if (isPrimaryKey && !primaryKeyCols.includes(colName)) {
      primaryKeyCols.push(colName);
    }

    // Default value
    let defaultValue: string | undefined;
    const defaultMatch = line.match(/DEFAULT\s+([^,)]+)/i);
    if (defaultMatch) {
      defaultValue = defaultMatch[1].trim();
    }

    // Check inline foreign key REFERENCES target_table(col)
    const refMatch = line.match(/REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)/i);
    if (refMatch) {
      const targetTable = this.cleanIdentifier(refMatch[1]);
      const targetCol = this.cleanIdentifier(refMatch[2]);
      const onDelete = this.parseAction(line, "ON\\s+DELETE");
      const onUpdate = this.parseAction(line, "ON\\s+UPDATE");

      foreignKeys.push({
        id: `fk-${tableName}-${colName}`,
        name: `fk_${tableName}_${colName}`,
        sourceColumnNames: [colName],
        targetTableName: targetTable,
        targetColumnNames: [targetCol],
        onDeleteAction: onDelete,
        onUpdateAction: onUpdate,
      });
    }

    return {
      id: `col-${tableName}-${colName}`,
      name: colName,
      dataType,
      isNullable: !isPrimaryKey && !isNotNull,
      isPrimaryKey,
      isUnique,
      defaultValue,
      isGenerated: /GENERATED\s+ALWAYS\s+AS/i.test(line),
    };
  }

  private static parseTableConstraint(
    line: string,
    primaryKeyCols: string[],
    foreignKeys: ForeignKeyConstraint[],
    indexes: TableIndex[],
    tableName: string,
    provenance: DatabaseStateProvenance
  ): void {
    // Constraint name
    const nameMatch = line.match(/CONSTRAINT\s+([^\s(]+)/i);
    const constraintName = nameMatch ? this.cleanIdentifier(nameMatch[1]) : `c_${Date.now()}`;

    // Primary key constraint
    if (/PRIMARY\s+KEY/i.test(line)) {
      const pkMatch = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        const cols = pkMatch[1].split(",").map((c) => this.cleanIdentifier(c));
        for (const c of cols) {
          if (!primaryKeyCols.includes(c)) primaryKeyCols.push(c);
        }
      }
    }

    // Foreign key constraint
    if (/FOREIGN\s+KEY/i.test(line)) {
      const fkMatch = line.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)/i);
      if (fkMatch) {
        const srcCols = fkMatch[1].split(",").map((c) => this.cleanIdentifier(c));
        const targetTable = this.cleanIdentifier(fkMatch[2]);
        const targetCols = fkMatch[3].split(",").map((c) => this.cleanIdentifier(c));
        const onDelete = this.parseAction(line, "ON\\s+DELETE");
        const onUpdate = this.parseAction(line, "ON\\s+UPDATE");

        foreignKeys.push({
          id: `fk-${tableName}-${constraintName}`,
          name: constraintName,
          sourceColumnNames: srcCols,
          targetTableName: targetTable,
          targetColumnNames: targetCols,
          onDeleteAction: onDelete,
          onUpdateAction: onUpdate,
        });
      }
    }

    // Unique constraint
    if (/UNIQUE/i.test(line) && !/FOREIGN/i.test(line)) {
      const uqMatch = line.match(/UNIQUE\s*\(([^)]+)\)/i);
      if (uqMatch) {
        const cols = uqMatch[1].split(",").map((c) => this.cleanIdentifier(c));
        indexes.push({
          id: `idx-${tableName}-${constraintName}`,
          name: constraintName,
          indexType: "btree",
          columnNames: cols,
          isUnique: true,
          provenance,
        });
      }
    }
  }

  private static parseCreateIndex(
    stmt: string,
    tablesMap: Map<string, DatabaseTable>,
    provenance: DatabaseStateProvenance
  ): void {
    // CREATE [UNIQUE] INDEX [IF NOT EXISTS] idx_name ON table_name [USING method] (col1, col2) [WHERE ...]
    const isUnique = /CREATE\s+UNIQUE\s+INDEX/i.test(stmt);
    const match = stmt.match(
      /CREATE\s+(?:UNIQUE\s+)?INDEX(?:\s+IF\s+NOT\s+EXISTS)?\s+([^\s(]+)\s+ON\s+([^\s(]+)(?:\s+USING\s+(\w+))?\s*\(([^)]+)\)(?:\s+WHERE\s+(.+))?/i
    );
    if (!match) return;

    const indexName = this.cleanIdentifier(match[1]);
    const tableName = this.cleanIdentifier(match[2].split(".").pop() || match[2]);
    const methodRaw = (match[3] || "btree").toLowerCase();
    const cols = match[4].split(",").map((c) => this.cleanIdentifier(c));
    const partialPredicate = match[5]?.trim();

    const validMethods: IndexType[] = ["btree", "hash", "gin", "gist", "brin", "bitmap", "inverted"];
    const indexType: IndexType = validMethods.includes(methodRaw as IndexType)
      ? (methodRaw as IndexType)
      : "btree";

    const table = tablesMap.get(tableName.toLowerCase());
    if (table) {
      table.indexes.push({
        id: `idx-${tableName}-${indexName}`,
        name: indexName,
        indexType,
        columnNames: cols,
        isUnique,
        partialPredicate,
        estimatedSizeBytes: 16384 * Math.max(1, cols.length),
        provenance,
      });
    }
  }

  private static parseAlterTable(stmt: string, tablesMap: Map<string, DatabaseTable>): void {
    // ALTER TABLE [ONLY] table_name ADD CONSTRAINT ...
    const match = stmt.match(/ALTER\s+TABLE(?:\s+ONLY)?\s+([^\s]+)\s+ADD\s+CONSTRAINT\s+([^\s(]+)\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)/i);
    if (!match) return;

    const tableName = this.cleanIdentifier(match[1].split(".").pop() || match[1]);
    const constraintName = this.cleanIdentifier(match[2]);
    const srcCols = match[3].split(",").map((c) => this.cleanIdentifier(c));
    const targetTable = this.cleanIdentifier(match[4].split(".").pop() || match[4]);
    const targetCols = match[5].split(",").map((c) => this.cleanIdentifier(c));
    const onDelete = this.parseAction(stmt, "ON\\s+DELETE");
    const onUpdate = this.parseAction(stmt, "ON\\s+UPDATE");

    const table = tablesMap.get(tableName.toLowerCase());
    if (table) {
      table.foreignKeys.push({
        id: `fk-${tableName}-${constraintName}`,
        name: constraintName,
        sourceColumnNames: srcCols,
        targetTableName: targetTable,
        targetColumnNames: targetCols,
        onDeleteAction: onDelete,
        onUpdateAction: onUpdate,
      });
    }
  }

  private static parseAction(str: string, prefixRegex: string): ForeignKeyAction {
    const regex = new RegExp(`${prefixRegex}\\s+(CASCADE|RESTRICT|SET\\s+NULL|SET\\s+DEFAULT|NO\\s+ACTION)`, "i");
    const m = str.match(regex);
    if (!m) return "no_action";
    const act = m[1].toUpperCase().replace(/\s+/g, "_");
    if (act === "CASCADE") return "cascade";
    if (act === "RESTRICT") return "restrict";
    if (act === "SET_NULL") return "set_null";
    if (act === "SET_DEFAULT") return "set_default";
    return "no_action";
  }

  private static splitTopLevelCommas(body: string): string[] {
    const result: string[] = [];
    let current = "";
    let parenDepth = 0;
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < body.length; i++) {
      const char = body[i];

      if ((char === "'" || char === '"' || char === "`") && (i === 0 || body[i - 1] !== "\\")) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (quoteChar === char) {
          inQuotes = false;
        }
      }

      if (!inQuotes) {
        if (char === "(") parenDepth++;
        else if (char === ")") parenDepth--;
        else if (char === "," && parenDepth === 0) {
          result.push(current);
          current = "";
          continue;
        }
      }

      current += char;
    }

    if (current.trim()) {
      result.push(current);
    }

    return result;
  }

  private static estimateColumnBytes(type: string): number {
    const t = type.toUpperCase();
    if (t.includes("INT8") || t.includes("BIGINT") || t.includes("BIGSERIAL")) return 8;
    if (t.includes("INT4") || t.includes("INTEGER") || t.includes("SERIAL") || t.includes("INT")) return 4;
    if (t.includes("INT2") || t.includes("SMALLINT")) return 2;
    if (t.includes("FLOAT8") || t.includes("DOUBLE")) return 8;
    if (t.includes("FLOAT4") || t.includes("REAL")) return 4;
    if (t.includes("UUID")) return 16;
    if (t.includes("BOOL")) return 1;
    if (t.includes("TIMESTAMPTZ") || t.includes("TIMESTAMP")) return 8;
    if (t.includes("DATE")) return 4;
    if (t.includes("JSONB") || t.includes("JSON") || t.includes("TEXT")) return 64; // average estimate
    if (t.includes("VARCHAR") || t.includes("CHAR")) {
      const m = t.match(/\((\d+)\)/);
      return m ? Math.min(parseInt(m[1], 10), 128) : 32;
    }
    return 16;
  }
}
