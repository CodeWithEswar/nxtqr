import { describe, it, expect } from "vitest";
import { SqlDdlParser } from "../database/parsers/sql-ddl-parser";
import { SchemaAnalyzer } from "../database/analysis/schema-analyzer";
import type { DatabaseSchema } from "../database/contracts/database.types";

describe("Phase 05.3.23: SQL DDL Parser & Schema Analyzer", () => {
  const now = new Date().toISOString();

  it("should safely parse DDL statements into structured tables, columns, and constraints without executing SQL", () => {
    const ddl = `
      -- Customer accounts
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL
      );

      /* Orders table */
      CREATE TABLE orders (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        total_cents BIGINT NOT NULL
      );

      CREATE TABLE items (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );

      CREATE TABLE order_items (
        order_id UUID NOT NULL REFERENCES orders(id),
        item_id UUID NOT NULL REFERENCES items(id),
        quantity INT NOT NULL,
        PRIMARY KEY (order_id, item_id)
      );

      CREATE INDEX idx_orders_status ON orders(status);
    `;

    const schema = SqlDdlParser.parse(ddl, {
      source: "declared_design",
      timestamp: now,
      graphRevision: "rev-1",
      confirmed: true,
    });

    expect(schema.tables.length).toBe(4);

    const usersTable = schema.tables.find((t) => t.name === "users");
    expect(usersTable).toBeDefined();
    expect(usersTable?.primaryKeyColumnNames).toEqual(["id"]);
    const emailCol = usersTable?.columns.find((c) => c.name === "email");
    expect(emailCol?.isUnique).toBe(true);
    expect(emailCol?.isNullable).toBe(false);

    const ordersTable = schema.tables.find((t) => t.name === "orders");
    expect(ordersTable).toBeDefined();
    expect(ordersTable?.foreignKeys.length).toBe(1);
    expect(ordersTable?.foreignKeys[0].targetTableName).toBe("users");
    expect(ordersTable?.foreignKeys[0].sourceColumnNames).toEqual(["user_id"]);
    expect(ordersTable?.indexes.length).toBe(2); // primary key + idx_orders_status

    const orderItemsTable = schema.tables.find((t) => t.name === "order_items");
    expect(orderItemsTable).toBeDefined();
    expect(orderItemsTable?.isJunctionTable).toBe(true);
  });

  it("should detect unindexed foreign keys that create lock contention hazards", () => {
    const schema: DatabaseSchema = {
      id: "schema-test",
      databaseAssetId: "asset-1",
      architectureRevisionId: "rev-1",
      dialect: "postgresql",
      schemaVersion: 1,
      tables: [
        {
          id: "table-users",
          name: "users",
          schema: "public",
          columns: [
            { id: "c1", name: "id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: true, isGenerated: false },
          ],
          primaryKeyColumnNames: ["id"],
          foreignKeys: [],
          indexes: [
            { id: "idx-users-pk", name: "users_pkey", indexType: "btree", columnNames: ["id"], isUnique: true, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
          ],
          estimatedRowCount: 100000,
          averageRowSizeBytes: 100,
          isJunctionTable: false,
          provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
        },
        {
          id: "table-orders",
          name: "orders",
          schema: "public",
          columns: [
            { id: "c2", name: "id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: true, isGenerated: false },
            { id: "c3", name: "user_id", dataType: "uuid", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
          ],
          primaryKeyColumnNames: ["id"],
          foreignKeys: [
            {
              id: "fk-orders-user",
              name: "fk_orders_user_id",
              sourceColumnNames: ["user_id"],
              targetTableName: "users",
              targetColumnNames: ["id"],
              onDeleteAction: "cascade",
              onUpdateAction: "cascade",
            },
          ],
          indexes: [
            { id: "idx-orders-pk", name: "orders_pkey", indexType: "btree", columnNames: ["id"], isUnique: true, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
          ],
          estimatedRowCount: 5000000,
          averageRowSizeBytes: 150,
          isJunctionTable: false,
          provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
        },
      ],
      relationships: [],
      provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
    };

    const res = SchemaAnalyzer.analyze(schema);
    expect(res.unindexedForeignKeysCount).toBe(1);
    const unindexedFkFinding = res.findings.find((f) => f.category === "missing_foreign_key_index");
    expect(unindexedFkFinding).toBeDefined();
    expect(unindexedFkFinding?.severity).toBe("high");
    expect(unindexedFkFinding?.explanation).toContain("orders");
    expect(unindexedFkFinding?.remediation).toContain("Create a B-Tree index");
  });

  it("should detect missing primary keys and 1NF repeating column groups", () => {
    const schema: DatabaseSchema = {
      id: "schema-denorm",
      databaseAssetId: "asset-1",
      architectureRevisionId: "rev-1",
      dialect: "postgresql",
      schemaVersion: 1,
      tables: [
        {
          id: "table-event-logs",
          name: "event_logs",
          schema: "public",
          columns: [
            { id: "c1", name: "event_name", dataType: "text", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
            { id: "c2", name: "phone_1", dataType: "text", isNullable: true, isPrimaryKey: false, isUnique: false, isGenerated: false },
            { id: "c3", name: "phone_2", dataType: "text", isNullable: true, isPrimaryKey: false, isUnique: false, isGenerated: false },
            { id: "c4", name: "phone_3", dataType: "text", isNullable: true, isPrimaryKey: false, isUnique: false, isGenerated: false },
          ],
          primaryKeyColumnNames: [], // Missing primary key!
          foreignKeys: [],
          indexes: [],
          estimatedRowCount: 200000,
          averageRowSizeBytes: 200,
          isJunctionTable: false,
          provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
        },
      ],
      relationships: [],
      provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
    };

    const res = SchemaAnalyzer.analyze(schema);
    const missingPkFinding = res.findings.find((f) => f.title.includes("Missing Primary Key"));
    expect(missingPkFinding).toBeDefined();

    const repeatingColsFinding = res.findings.find((f) => f.id.includes("repeating-columns"));
    expect(repeatingColsFinding).toBeDefined();
    expect(repeatingColsFinding?.explanation).toContain("phone");
  });
});
