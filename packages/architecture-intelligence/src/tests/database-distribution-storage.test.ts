import { describe, it, expect } from "vitest";
import { DatabaseCapabilityRegistry } from "../database/providers/database-capability-registry";
import { DistributionAnalyzer } from "../database/analysis/distribution-analyzer";
import { StorageGrowthAnalyzer } from "../database/analysis/storage-growth-analyzer";
import { MigrationAnalyzer } from "../database/analysis/migration-analyzer";
import { ConnectionAnalyzer } from "../database/analysis/connection-analyzer";
import type {
  DatabaseSchema,
  QueryWorkload,
  ShardingTopology,
  DatabaseAsset,
} from "../database/contracts/database.types";

describe("Phase 05.3.23: Distribution, Storage Growth, Migrations & Connection Pooling", () => {
  const now = new Date().toISOString();

  it("should detect cross-shard scatter-gather joins on sharded clusters", () => {
    const schema: DatabaseSchema = {
      id: "schema-sharded",
      databaseAssetId: "asset-sharded-1",
      architectureRevisionId: "rev-1",
      dialect: "postgresql",
      schemaVersion: 1,
      tables: [
        {
          id: "tbl-tenant-users",
          name: "tenant_users",
          schema: "public",
          columns: [
            { id: "c1", name: "id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: true, isGenerated: false },
            { id: "c2", name: "tenant_id", dataType: "uuid", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
            { id: "c3", name: "email", dataType: "text", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
          ],
          primaryKeyColumnNames: ["id"],
          foreignKeys: [],
          indexes: [],
          estimatedRowCount: 20000000,
          averageRowSizeBytes: 150,
          isJunctionTable: false,
          provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
        },
      ],
      relationships: [],
      provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
    };

    const sharding: ShardingTopology = {
      strategy: "hash",
      shardKeyColumnNames: ["tenant_id"],
      totalShards: 8,
      crossShardJoinRisk: true,
      hotShardRisk: false,
      shards: [],
    };

    // Workload query looks up by email without providing the shard key tenant_id!
    const workloads: QueryWorkload[] = [
      {
        id: "workload-email-lookup",
        databaseAssetId: "asset-sharded-1",
        queryName: "Find User By Email (Scatter-Gather)",
        queryType: "select",
        parameterizedSql: "SELECT id, tenant_id FROM tenant_users WHERE email = $1;",
        queryFingerprint: "select id, tenant_id from tenant_users where email = ?",
        readWriteClassification: "read_only",
        frequencyPerMinute: 6000,
        concurrentClients: 10,
        expectedReturnedRows: 1,
        targetTableNames: ["tenant_users"],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ];

    const findings = DistributionAnalyzer.analyze(schema, workloads, sharding);
    const scatterFinding = findings.find((f) => f.category === "cross_shard_join_bottleneck");
    expect(scatterFinding).toBeDefined();
    expect(scatterFinding?.severity).toBe("high");
    expect(scatterFinding?.explanation).toContain("broadcast this query to all 8 shards");
  });

  it("should forecast storage capacity saturation and IOPS exhaustion", () => {
    const schema: DatabaseSchema = {
      id: "schema-storage",
      databaseAssetId: "asset-1",
      architectureRevisionId: "rev-1",
      dialect: "postgresql",
      schemaVersion: 1,
      tables: [
        {
          id: "tbl-logs",
          name: "access_logs",
          schema: "public",
          columns: [
            { id: "c1", name: "id", dataType: "bigint", isNullable: false, isPrimaryKey: true, isUnique: true, isGenerated: false },
          ],
          primaryKeyColumnNames: ["id"],
          foreignKeys: [],
          indexes: [
            { id: "idx-logs-pk", name: "logs_pkey", indexType: "btree", columnNames: ["id"], isUnique: true, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
          ],
          estimatedRowCount: 500000000, // 500M rows
          averageRowSizeBytes: 200, // ~100 GB
          tableSizeBytes: 100000 * 1024 * 1024,
          isJunctionTable: false,
          provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
        },
      ],
      relationships: [],
      provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
    };

    const workloads: QueryWorkload[] = [
      {
        id: "workload-heavy-write",
        databaseAssetId: "asset-1",
        queryName: "High Throughput Log Ingestion",
        queryType: "insert",
        parameterizedSql: "INSERT INTO access_logs VALUES ($1);",
        queryFingerprint: "insert into access_logs values (?)",
        readWriteClassification: "write_only",
        frequencyPerMinute: 600000, // 10,000 writes/sec -> high IOPS!
        concurrentClients: 100,
        expectedReturnedRows: 1,
        targetTableNames: ["access_logs"],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ];

    // Provisioned disk: 100GB (100000 MB), provisioned IOPS: 1000
    const res = StorageGrowthAnalyzer.analyze(schema, workloads, 100000, 1000);
    expect(res.forecast.totalIopsModeled).toBeGreaterThan(1000);
    expect(res.forecast.iopsCapacitySaturationRatio).toBeGreaterThan(1.0);

    const iopsFinding = res.findings.find((f) => f.category === "storage_iops_saturation");
    expect(iopsFinding).toBeDefined();
    expect(iopsFinding?.severity).toBe("critical");
  });

  it("should detect table rewrite risks on adding NOT NULL column without default in migration analysis", () => {
    const oldSchema: DatabaseSchema = {
      id: "schema-v1",
      databaseAssetId: "asset-1",
      architectureRevisionId: "rev-1",
      dialect: "postgresql",
      schemaVersion: 1,
      tables: [
        {
          id: "tbl-accounts",
          name: "accounts",
          schema: "public",
          columns: [
            { id: "c1", name: "id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: true, isGenerated: false },
          ],
          primaryKeyColumnNames: ["id"],
          foreignKeys: [],
          indexes: [],
          estimatedRowCount: 1000000,
          averageRowSizeBytes: 100,
          isJunctionTable: false,
          provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
        },
      ],
      relationships: [],
      provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
    };

    const newSchema: DatabaseSchema = {
      ...oldSchema,
      id: "schema-v2",
      schemaVersion: 2,
      tables: [
        {
          ...oldSchema.tables[0],
          columns: [
            ...oldSchema.tables[0].columns,
            // Adding NOT NULL column WITHOUT defaultValue!
            { id: "c2", name: "tax_identifier", dataType: "text", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
          ],
        },
      ],
    };

    const res = MigrationAnalyzer.compare(oldSchema, newSchema);
    expect(res.diffEntries.length).toBe(1);
    expect(res.diffEntries[0].requiresTableRewrite).toBe(true);
    expect(res.diffEntries[0].requiresExclusiveLock).toBe(true);

    const migrationFinding = res.findings.find((f) => f.category === "breaking_migration_table_rewrite");
    expect(migrationFinding).toBeDefined();
    expect(migrationFinding?.severity).toBe("critical");
    expect(res.migrationPlan.steps.length).toBe(6); // 6-phase expand-and-contract
  });

  it("should detect connection exhaustion when direct application connections exceed database capacity", () => {
    const asset: DatabaseAsset = {
      id: "asset-small-db",
      name: "Standard Postgres DB",
      family: "postgresql",
      providerTechnology: "postgres",
      environment: "production",
      provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
    };

    const capabilities = new DatabaseCapabilityRegistry().getCapabilities("postgres");

    const workloads: QueryWorkload[] = [
      {
        id: "workload-concurrency",
        databaseAssetId: "asset-small-db",
        queryName: "Api Requests",
        queryType: "select",
        parameterizedSql: "SELECT 1;",
        queryFingerprint: "select 1;",
        readWriteClassification: "read_only",
        frequencyPerMinute: 60000,
        concurrentClients: 800, // 800 direct concurrent clients!
        expectedReturnedRows: 1,
        targetTableNames: ["users"],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ];

    const findings = ConnectionAnalyzer.analyze(asset, capabilities, workloads);
    const poolFinding = findings.find((f) => f.category === "connection_pool_exhaustion");
    expect(poolFinding).toBeDefined();
    expect(poolFinding?.explanation).toContain("800");
    expect(poolFinding?.remediation).toContain("PgBouncer");
  });
});
