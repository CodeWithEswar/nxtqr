import { describe, it, expect } from "vitest";
import { IndexAnalyzer } from "../database/analysis/index-analyzer";
import type { DatabaseSchema, QueryWorkload } from "../database/contracts/database.types";

describe("Phase 05.3.23: Index Coverage, Redundancy & Write Amplification Analyzer", () => {
  const now = new Date().toISOString();

  it("should detect redundant left-prefix indexes and high write amplification", () => {
    const schema: DatabaseSchema = {
      id: "schema-index-test",
      databaseAssetId: "asset-1",
      architectureRevisionId: "rev-1",
      dialect: "postgresql",
      schemaVersion: 1,
      tables: [
        {
          id: "table-events",
          name: "events",
          schema: "public",
          columns: [
            { id: "c1", name: "id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: true, isGenerated: false },
            { id: "c2", name: "tenant_id", dataType: "uuid", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
            { id: "c3", name: "user_id", dataType: "uuid", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
            { id: "c4", name: "event_type", dataType: "text", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
            { id: "c5", name: "created_at", dataType: "timestamp", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
            { id: "c6", name: "source_ip", dataType: "text", isNullable: true, isPrimaryKey: false, isUnique: false, isGenerated: false },
          ],
          primaryKeyColumnNames: ["id"],
          foreignKeys: [],
          indexes: [
            { id: "idx-events-pk", name: "events_pkey", indexType: "btree", columnNames: ["id"], isUnique: true, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
            // Composite index covering (tenant_id, user_id, event_type)
            { id: "idx-events-composite", name: "idx_events_tenant_user_type", indexType: "btree", columnNames: ["tenant_id", "user_id", "event_type"], isUnique: false, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
            // Redundant left-prefix index! (tenant_id, user_id) is fully covered by the above
            { id: "idx-events-redundant", name: "idx_events_tenant_user", indexType: "btree", columnNames: ["tenant_id", "user_id"], isUnique: false, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
            // 4th index
            { id: "idx-events-type", name: "idx_events_type", indexType: "btree", columnNames: ["event_type"], isUnique: false, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
            // 5th index
            { id: "idx-events-time", name: "idx_events_time", indexType: "btree", columnNames: ["created_at"], isUnique: false, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
            // 6th index -> Triggers > 5 write amplification warning!
            { id: "idx-events-ip", name: "idx_events_ip", indexType: "btree", columnNames: ["source_ip"], isUnique: false, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
          ],
          estimatedRowCount: 10000000,
          averageRowSizeBytes: 256,
          isJunctionTable: false,
          provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
        },
      ],
      relationships: [],
      provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
    };

    const workloads: QueryWorkload[] = [
      {
        id: "workload-insert-events",
        databaseAssetId: "asset-1",
        queryName: "Ingest Event Batch",
        queryType: "insert",
        parameterizedSql: "INSERT INTO events (id, tenant_id, user_id, event_type, created_at, source_ip) VALUES ($1, $2, $3, $4, $5, $6);",
        queryFingerprint: "insert into events values (?)",
        readWriteClassification: "write_only",
        frequencyPerMinute: 60000, // 1,000 writes/sec
        concurrentClients: 50,
        expectedReturnedRows: 1,
        targetTableNames: ["events"],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ];

    const res = IndexAnalyzer.analyze(schema, workloads);
    expect(res.redundantIndexCount).toBe(1);

    const redundantFinding = res.findings.find((f) => f.category === "redundant_index");
    expect(redundantFinding).toBeDefined();
    expect(redundantFinding?.title).toContain("Redundant Index");
    expect(redundantFinding?.explanation).toContain("redundant left-prefix");
    expect(redundantFinding?.explanation).toContain("idx_events_tenant_user");
    expect(redundantFinding?.explanation).toContain("idx_events_tenant_user_type");

    const writeAmpFinding = res.findings.find((f) => f.category === "write_amplification_overhead");
    expect(writeAmpFinding).toBeDefined();
    expect(writeAmpFinding?.explanation).toContain("6 indexes");
  });
});
