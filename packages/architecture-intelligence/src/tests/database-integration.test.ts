import { describe, it, expect } from "vitest";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import type { AIExecutionContext } from "../ai-assistant/contracts/ai-assistant.types";
import { architectureReportEngine } from "../reports/engine/report-engine";
import { MarkdownExporter } from "../reports/exporters/markdown-exporter";
import { HtmlExporter } from "../reports/exporters/html-exporter";
import type { DatabaseArchitectureTopology } from "../database/contracts/database.types";

describe("Phase 05.3.23: AI Assistant Tool #26 & Reports Generator Integration", () => {
  const now = new Date().toISOString();

  const mockTopology: DatabaseArchitectureTopology = {
    id: "db-topo-ecommerce",
    projectId: "proj-1",
    architectureId: "arch-1",
    graphRevision: "rev-1",
    version: 1,
    assets: [
      {
        id: "asset-aurora-pg",
        name: "Aurora PostgreSQL Primary",
        family: "postgresql",
        providerTechnology: "postgres",
        environment: "production",
        engineVersion: "16.1",
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    schemas: [
      {
        id: "schema-store",
        databaseAssetId: "asset-aurora-pg",
        architectureRevisionId: "rev-1",
        dialect: "postgresql",
        schemaVersion: 1,
        tables: [
          {
            id: "tbl-orders",
            name: "orders",
            schema: "public",
            columns: [
              { id: "c1", name: "id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: true, isGenerated: false },
              { id: "c2", name: "customer_id", dataType: "uuid", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
              { id: "c3", name: "total_cents", dataType: "bigint", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
            ],
            primaryKeyColumnNames: ["id"],
            foreignKeys: [
              {
                id: "fk-orders-customer",
                name: "fk_orders_customer_id",
                sourceColumnNames: ["customer_id"],
                targetTableName: "customers",
                targetColumnNames: ["id"],
                onDeleteAction: "cascade",
                onUpdateAction: "cascade",
              },
            ],
            indexes: [
              { id: "idx-orders-pk", name: "orders_pkey", indexType: "btree", columnNames: ["id"], isUnique: true, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
            ],
            estimatedRowCount: 1000000,
            averageRowSizeBytes: 120,
            tableSizeBytes: 120000000,
            isJunctionTable: false,
            provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        ],
        relationships: [],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    workloads: [],
    executionPlans: [],
    transactions: [],
    storageForecast: {
      allocatedDiskMb: 500000,
      provisionedIops: 5000,
      currentLogicalDataMb: 120,
      currentIndexDataMb: 30,
      currentWalDataMb: 15,
      currentTotalMb: 165,
      projectedMonthlyGrowthMb: 2500,
      projectedSaturationMonths: 195,
      readIopsModeled: 850,
      writeIopsModeled: 240,
      totalIopsModeled: 1090,
      iopsCapacitySaturationRatio: 0.218,
    },
    createdAt: now,
    updatedAt: now,
  };

  it("should execute AI Tool #26 (get_database_intelligence) returning analysis summary and findings", async () => {
    const context: AIExecutionContext = {
      projectId: "proj-1",
      architectureId: "arch-1",
      graphRevision: "rev-1",
      nodes: [],
      edges: [],
      databaseTopology: mockTopology,
    };

    const res = await architectureToolRegistry.executeTool("get_database_intelligence", {}, context);
    if (!res.success) {
      console.error("TOOL #26 ERROR:", res.error);
    }
    expect(res.success).toBe(true);
    expect(res.result).toBeDefined();

    const output = res.result as any;
    expect(output.summary.assetCount).toBe(1);
    expect(output.summary.tableCount).toBe(1);
    expect(output.summary.unindexedForeignKeysCount).toBe(1);
    expect(output.findings.length).toBeGreaterThanOrEqual(1);
    expect(output.storageForecast).toBeDefined();
  });

  it("should generate reports with database_architecture section in Markdown and HTML", () => {
    const report = architectureReportEngine.generateReport({
      projectId: "proj-1",
      architectureId: "arch-1",
      templateId: "detailed_technical_architecture",
      title: "E-Commerce System Design & Storage Architecture",
      nodes: [
        {
          id: "node-pg",
          type: "database",
          data: { label: "Aurora PostgreSQL" },
          position: { x: 0, y: 0 },
        },
      ],
      edges: [],
      analysisContext: {
        databaseTopology: mockTopology,
      },
    });

    const dbSection = report.sections.find((s) => s.kind === "database_architecture");
    expect(dbSection).toBeDefined();

    // Verify Markdown export
    const md = MarkdownExporter.export(report).content;
    expect(md).toContain("Database Architecture, Query Performance & Storage Intelligence");
    expect(md).toContain("Aurora PostgreSQL Primary");
    expect(md).toContain("orders");
    expect(md).toContain("Unindexed Foreign Keys");

    // Verify HTML export
    const html = HtmlExporter.export(report).content;
    expect(html).toContain("Database Assets");
    expect(html).toContain("Aurora PostgreSQL Primary");
    expect(html).toContain("orders");
    expect(html).toContain("Unindexed FKs");
  });
});
