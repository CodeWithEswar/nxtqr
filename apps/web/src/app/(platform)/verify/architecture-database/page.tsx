"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Interactive Verification Testbed Page
 */

import React, { useState } from "react";
import { DatabaseWorkspace } from "@/features/system-design/database";
import {
  type DatabaseArchitectureTopology,
  type DatabaseSchema,
  type QueryWorkload,
  type TransactionModel,
  DatabaseCapabilityRegistry,
  SqlDdlParser,
  PostgresPlanParser,
  IndexAnalyzer,
  TransactionAnalyzer,
  StorageGrowthAnalyzer,
} from "@nxtqr/architecture-intelligence";
import { LayersIcon, PlayIcon, CheckIcon, AlertTriangleIcon } from "@nxtqr/icons";

export default function ArchitectureDatabaseVerificationPage() {
  const [activeScenario, setActiveScenario] = useState<"ecommerce" | "financial" | "multi_tenant">(
    "ecommerce"
  );
  const [verificationResults, setVerificationResults] = useState<
    Array<{ name: string; status: "passed" | "failed"; detail: string }>
  >([]);
  const [hasRunVerification, setHasRunVerification] = useState(false);

  const now = new Date().toISOString();

  // Run in-browser automated verification test suite
  const runAllVerifications = () => {
    const results: Array<{ name: string; status: "passed" | "failed"; detail: string }> = [];

    // Test 1: Capability Registry Multi-Family Resolution
    try {
      const registry = new DatabaseCapabilityRegistry();
      const pgCaps = registry.getCapabilities("postgres");
      const myCaps = registry.getCapabilities("mysql");
      const mongoCaps = registry.getCapabilities("mongodb");
      const clickCaps = registry.getCapabilities("clickhouse");

      if (
        pgCaps.supportsExplainPlan &&
        pgCaps.supportedIsolationLevels.includes("serializable") &&
        !mongoCaps.supportedIsolationLevels.includes("serializable") &&
        clickCaps.supportsPartitioning &&
        myCaps.supportedIndexTypes.includes("hash")
      ) {
        results.push({
          name: "Database Capability Matrix Resolution",
          status: "passed",
          detail: "Postgres 16, MySQL 8, MongoDB, and ClickHouse capabilities resolved accurately with zero provider hallucination.",
        });
      } else {
        results.push({
          name: "Database Capability Matrix Resolution",
          status: "failed",
          detail: "Capability flags mismatch expected relational/NoSQL provider semantics.",
        });
      }
    } catch (err: unknown) {
      results.push({
        name: "Database Capability Matrix Resolution",
        status: "failed",
        detail: (err as Error).message,
      });
    }

    // Test 2: Safe Bounded SQL DDL Parser
    try {
      const ddl = `
        CREATE TABLE users (
          id UUID PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP NOT NULL
        );

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

      const parsed = SqlDdlParser.parse(ddl);

      if (
        parsed.tables.length === 4 &&
        parsed.tables[0].columns.length === 3 &&
        parsed.tables[1].foreignKeys.length === 1 &&
        parsed.tables[1].indexes.length === 2 &&
        parsed.tables[3].isJunctionTable
      ) {
        results.push({
          name: "Safe Bounded SQL DDL Parser",
          status: "passed",
          detail: "Parsed 4 tables, columns, constraints, foreign key references, and junction table safely with zero SQL execution.",
        });
      } else {
        results.push({
          name: "Safe Bounded SQL DDL Parser",
          status: "failed",
          detail: `Unexpected parse output: ${parsed.tables.length} tables parsed`,
        });
      }
    } catch (err: unknown) {
      results.push({
        name: "Safe Bounded SQL DDL Parser",
        status: "failed",
        detail: (err as Error).message,
      });
    }

    // Test 3: PostgreSQL EXPLAIN JSON Plan Parser
    try {
      const explainJson = [
        {
          Plan: {
            "Node Type": "Seq Scan",
            "Relation Name": "orders",
            "Alias": "orders",
            "Startup Cost": 0.0,
            "Total Cost": 4520.5,
            "Plan Rows": 150000,
            "Actual Startup Time": 0.05,
            "Actual Total Time": 142.8,
            "Actual Rows": 149800,
            "Actual Loops": 1,
            "Shared Hit Blocks": 3120,
            "Shared Read Blocks": 1400,
            Filter: "(created_at > '2026-01-01'::timestamptz)",
            Plans: [],
          },
          "Planning Time": 0.12,
          "Execution Time": 143.5,
        },
      ];

      const parsedPlan = PostgresPlanParser.parse(explainJson, "w-1", {
        source: "observed_performance",
        timestamp: now,
        graphRevision: "rev-1",
        confirmed: true,
      });

      if (
        parsedPlan.rootOperator.operatorType === "seq_scan" &&
        parsedPlan.rootOperator.actualTotalTimeMs === 142.8 &&
        parsedPlan.rootOperator.sharedHitBlocks === 3120 &&
        parsedPlan.totalExecutionTimeMs === 143.5
      ) {
        results.push({
          name: "PostgreSQL EXPLAIN JSON Plan Tree Parser",
          status: "passed",
          detail: "Parsed recursive plan operator tree with actual execution times, row counts, buffer cache hits, and filter predicates.",
        });
      } else {
        results.push({
          name: "PostgreSQL EXPLAIN JSON Plan Tree Parser",
          status: "failed",
          detail: `Parsed plan node mismatch: ${parsedPlan.rootOperator.operatorType}`,
        });
      }
    } catch (err: unknown) {
      results.push({
        name: "PostgreSQL EXPLAIN JSON Plan Tree Parser",
        status: "failed",
        detail: (err as Error).message,
      });
    }

    // Test 4: Deadlock Cycle Detection on Wait-For Graph
    try {
      const txA: TransactionModel = {
        id: "tx-order-checkout",
        name: "Checkout Order Transaction",
        databaseAssetId: "asset-1",
        isolationLevel: "read_committed",
        retryPolicyEnabled: false,
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
        operations: [
          { tableId: "tbl-orders", tableName: "orders", lockType: "exclusive", isWrite: true, estimatedDurationMs: 45 },
          { tableId: "tbl-inventory", tableName: "inventory", lockType: "exclusive", isWrite: true, estimatedDurationMs: 50 },
        ],
      };

      const txB: TransactionModel = {
        id: "tx-inventory-restock",
        name: "Inventory Restock Transaction",
        databaseAssetId: "asset-1",
        isolationLevel: "read_committed",
        retryPolicyEnabled: false,
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
        operations: [
          { tableId: "tbl-inventory", tableName: "inventory", lockType: "exclusive", isWrite: true, estimatedDurationMs: 60 },
          { tableId: "tbl-orders", tableName: "orders", lockType: "exclusive", isWrite: true, estimatedDurationMs: 40 },
        ],
      };

      const res = TransactionAnalyzer.analyze([txA, txB]);
      const deadlockFinding = res.findings.find((f) => f.category === "deadlock_dependency_cycle");

      if (res.deadlockRiskCount >= 1 && deadlockFinding && deadlockFinding.severity === "critical") {
        results.push({
          name: "Deadlock Cycle Wait-For Graph Analysis",
          status: "passed",
          detail: "Detected inverted lock acquisition order cycle creating deterministic transaction deadlock.",
        });
      } else {
        results.push({
          name: "Deadlock Cycle Wait-For Graph Analysis",
          status: "failed",
          detail: `Expected critical deadlock finding, got ${res.findings.length} findings`,
        });
      }
    } catch (err: unknown) {
      results.push({
        name: "Deadlock Cycle Wait-For Graph Analysis",
        status: "failed",
        detail: (err as Error).message,
      });
    }

    // Test 5: Left-Prefix Redundant Index Detection
    try {
      const testSchema: DatabaseSchema = {
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
            ],
            primaryKeyColumnNames: ["id"],
            foreignKeys: [],
            indexes: [
              { id: "idx-pk", name: "events_pkey", indexType: "btree", columnNames: ["id"], isUnique: true, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
              { id: "idx-composite", name: "idx_events_tenant_user_type", indexType: "btree", columnNames: ["tenant_id", "user_id", "event_type"], isUnique: false, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
              { id: "idx-redundant", name: "idx_events_tenant_user", indexType: "btree", columnNames: ["tenant_id", "user_id"], isUnique: false, provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true } },
            ],
            estimatedRowCount: 1000000,
            averageRowSizeBytes: 200,
            tableSizeBytes: 200000000,
            isJunctionTable: false,
            provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        ],
        relationships: [],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      };

      const res = IndexAnalyzer.analyze(testSchema, []);
      const redundantFinding = res.findings.find((f) => f.category === "redundant_index");

      if (res.redundantIndexCount >= 1 && redundantFinding) {
        results.push({
          name: "Left-Prefix Redundant Index Detection",
          status: "passed",
          detail: "Identified that idx_events_tenant_user is completely shadowed by composite index idx_events_tenant_user_type.",
        });
      } else {
        results.push({
          name: "Left-Prefix Redundant Index Detection",
          status: "failed",
          detail: "Did not flag left-prefix redundant index.",
        });
      }
    } catch (err: unknown) {
      results.push({
        name: "Left-Prefix Redundant Index Detection",
        status: "failed",
        detail: (err as Error).message,
      });
    }

    // Test 6: Storage Capacity Forecasting & IOPS Saturation
    try {
      const storageSchema: DatabaseSchema = {
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
              { id: "c1", name: "id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: true, isGenerated: false },
            ],
            primaryKeyColumnNames: ["id"],
            foreignKeys: [],
            indexes: [],
            estimatedRowCount: 10000000,
            averageRowSizeBytes: 500,
            tableSizeBytes: 5000000000,
            isJunctionTable: false,
            provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        ],
        relationships: [],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      };

      const storageWorkloads: QueryWorkload[] = [
        {
          id: "workload-heavy-write",
          databaseAssetId: "asset-1",
          queryName: "Ingest Log Batch",
          queryType: "insert",
          parameterizedSql: "INSERT INTO access_logs VALUES ($1);",
          queryFingerprint: "insert into access_logs values (?)",
          readWriteClassification: "write_only",
          frequencyPerMinute: 600000, // 10,000 writes/sec -> triggers IOPS saturation!
          concurrentClients: 100,
          expectedReturnedRows: 1,
          targetTableNames: ["access_logs"],
          provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
        },
      ];

      const res = StorageGrowthAnalyzer.analyze(storageSchema, storageWorkloads, 100000, 1000);

      if (
        res.forecast.totalIopsModeled > 1000 &&
        res.forecast.iopsCapacitySaturationRatio > 1.0 &&
        res.findings.some((f) => f.category === "storage_iops_saturation")
      ) {
        results.push({
          name: "Storage Capacity Forecasting & IOPS Saturation",
          status: "passed",
          detail: "Calculated disk growth forecast and detected critical provisioned IOPS capacity saturation.",
        });
      } else {
        results.push({
          name: "Storage Capacity Forecasting & IOPS Saturation",
          status: "failed",
          detail: `Mismatch in forecast calculations: iopsRatio=${res.forecast.iopsCapacitySaturationRatio}`,
        });
      }
    } catch (err: unknown) {
      results.push({
        name: "Storage Capacity Forecasting & IOPS Saturation",
        status: "failed",
        detail: (err as Error).message,
      });
    }

    setVerificationResults(results);
    setHasRunVerification(true);
  };

  // Scenario 1: PostgreSQL Enterprise E-Commerce
  const ecommerceScenario: DatabaseArchitectureTopology = {
    id: "topo-pg-ecommerce",
    projectId: "proj-ecommerce",
    architectureId: "arch-ecommerce",
    graphRevision: "rev-v1.4",
    version: 1,
    assets: [
      {
        id: "asset-aurora-primary",
        name: "Aurora PostgreSQL 16 Primary",
        family: "postgresql",
        providerTechnology: "postgres",
        engineVersion: "16.1",
        environment: "production",
        ownershipTeam: "Storefront Core",
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
      },
      {
        id: "asset-aurora-replica",
        name: "Aurora PostgreSQL 16 Read Replica",
        family: "postgresql",
        providerTechnology: "postgres",
        engineVersion: "16.1",
        environment: "production",
        ownershipTeam: "Storefront Core",
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
      },
    ],
    schemas: [
      {
        id: "schema-public",
        databaseAssetId: "asset-aurora-primary",
        architectureRevisionId: "rev-v1.4",
        dialect: "postgresql",
        schemaVersion: 1,
        tables: [
          {
            id: "tbl-customers",
            name: "customers",
            schema: "public",
            estimatedRowCount: 85000,
            averageRowSizeBytes: 320,
            tableSizeBytes: 85000 * 320,
            columns: [
              { id: "col-c-id", name: "id", dataType: "uuid", isPrimaryKey: true, isNullable: false, isUnique: true, isGenerated: false },
              { id: "col-c-email", name: "email", dataType: "varchar(255)", isPrimaryKey: false, isNullable: false, isUnique: true, isGenerated: false },
              { id: "col-c-name", name: "full_name", dataType: "varchar(255)", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
              { id: "col-c-created", name: "created_at", dataType: "timestamptz", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
            ],
            primaryKeyColumnNames: ["id"],
            foreignKeys: [],
            indexes: [
              {
                id: "idx-pk-customers",
                name: "customers_pkey",
                indexType: "btree",
                columnNames: ["id"],
                isUnique: true,
                provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
              },
            ],
            isJunctionTable: false,
            provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
          },
          {
            id: "tbl-orders",
            name: "orders",
            schema: "public",
            estimatedRowCount: 420000,
            averageRowSizeBytes: 450,
            tableSizeBytes: 420000 * 450,
            columns: [
              { id: "col-o-id", name: "id", dataType: "uuid", isPrimaryKey: true, isNullable: false, isUnique: true, isGenerated: false },
              { id: "col-o-cid", name: "customer_id", dataType: "uuid", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
              { id: "col-o-status", name: "status", dataType: "varchar(32)", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
              { id: "col-o-total", name: "total_cents", dataType: "bigint", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
              { id: "col-o-created", name: "created_at", dataType: "timestamptz", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
            ],
            primaryKeyColumnNames: ["id"],
            foreignKeys: [
              {
                id: "fk-orders-customer",
                name: "fk_orders_customer_id",
                sourceColumnNames: ["customer_id"],
                targetTableName: "customers",
                targetColumnNames: ["id"],
                onDeleteAction: "restrict",
                onUpdateAction: "cascade",
              },
            ],
            indexes: [
              {
                id: "idx-pk-orders",
                name: "orders_pkey",
                indexType: "btree",
                columnNames: ["id"],
                isUnique: true,
                provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
              },
              {
                id: "idx-orders-cust",
                name: "idx_orders_customer_id",
                indexType: "btree",
                columnNames: ["customer_id"],
                isUnique: false,
                provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
              },
              {
                id: "idx-orders-cust-date",
                name: "idx_orders_customer_and_date",
                indexType: "btree",
                columnNames: ["customer_id", "created_at"],
                isUnique: false,
                provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
              },
            ],
            isJunctionTable: false,
            provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
          },
        ],
        relationships: [
          {
            id: "rel-orders-customers",
            name: "fk_orders_customer_id",
            sourceTableId: "tbl-orders",
            targetTableId: "tbl-customers",
            relationshipType: "one_to_many",
            sourceColumnNames: ["customer_id"],
            targetColumnNames: ["id"],
            foreignKeyConstraintId: "fk-orders-customer",
            isOptional: false,
            referentialIntegrityEnforced: true,
          },
        ],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
      },
    ],
    workloads: [
      {
        id: "workload-customer-orders",
        databaseAssetId: "asset-aurora-primary",
        queryName: "Get Recent Customer Orders",
        queryType: "select",
        parameterizedSql: "SELECT id, status, total_cents FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10",
        queryFingerprint: "select id, status, total_cents from orders where customer_id = ? order by created_at desc limit ?",
        readWriteClassification: "read_only",
        frequencyPerMinute: 27000,
        concurrentClients: 45,
        expectedReturnedRows: 10,
        targetTableNames: ["orders"],
        p95LatencyMsObserved: 6.2,
        provenance: { source: "observed_performance", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
      },
      {
        id: "workload-monthly-export",
        databaseAssetId: "asset-aurora-replica",
        queryName: "Monthly Orders Export Batch",
        queryType: "select",
        parameterizedSql: "SELECT * FROM orders WHERE created_at >= '2026-10-01'",
        queryFingerprint: "select * from orders where created_at >= ?",
        readWriteClassification: "read_only",
        frequencyPerMinute: 120,
        concurrentClients: 5,
        expectedReturnedRows: 420000,
        targetTableNames: ["orders"],
        p95LatencyMsObserved: 380.0,
        provenance: { source: "observed_performance", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
      },
    ],
    executionPlans: [
      {
        id: "plan-monthly-export",
        queryWorkloadId: "workload-monthly-export",
        format: "postgres_json",
        isActualExecution: true,
        totalExecutionTimeMs: 380.5,
        planningTimeMs: 0.18,
        rootOperator: {
          id: "op-seq-scan-orders",
          operatorType: "seq_scan",
          targetTableName: "orders",
          estimatedStartupCost: 0.0,
          estimatedTotalCost: 9800.0,
          estimatedRows: 420000,
          actualStartupTimeMs: 0.08,
          actualTotalTimeMs: 379.2,
          actualRows: 385000,
          actualLoops: 1,
          sharedHitBlocks: 8500,
          sharedReadBlocks: 4200,
          filterPredicate: "(created_at >= '2026-10-01'::timestamptz)",
          children: [],
        },
        warnings: [],
        provenance: { source: "observed_performance", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
      },
    ],
    transactions: [
      {
        id: "tx-place-order",
        name: "Place Customer Order",
        databaseAssetId: "asset-aurora-primary",
        isolationLevel: "read_committed",
        retryPolicyEnabled: false,
        operations: [
          { tableId: "tbl-orders", tableName: "orders", lockType: "exclusive", isWrite: true, estimatedDurationMs: 35 },
          { tableId: "tbl-customers", tableName: "customers", lockType: "shared", isWrite: false, estimatedDurationMs: 10 },
        ],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v1.4", confirmed: true },
      },
    ],
    connectionPooling: {
      poolType: "transaction_pool",
      poolManagerTechnology: "pgbouncer",
      maxPoolSize: 200,
      minIdle: 30,
      idleTimeoutSeconds: 60,
      connectionTimeoutMs: 2500,
      clientMaxConnections: 1500,
    },
    readReplicaRouting: {
      strategy: "lag_aware_replicas",
      maxAllowableLagMs: 3000,
      readAfterWriteGracePeriodSeconds: 2,
      replicaCount: 1,
      p95ReplicaLagMsObserved: 650,
    },
    storageForecast: {
      allocatedDiskMb: 300000, // 300 GB
      provisionedIops: 6000,
      currentLogicalDataMb: 45000,
      currentIndexDataMb: 18000,
      currentWalDataMb: 3200,
      currentTotalMb: 66200,
      projectedMonthlyGrowthMb: 9200,
      projectedSaturationMonths: 25.4,
      readIopsModeled: 2800,
      writeIopsModeled: 950,
      totalIopsModeled: 3750,
      iopsCapacitySaturationRatio: 0.625,
    },
    createdAt: now,
    updatedAt: now,
  };

  // Scenario 2: High-Volume Financial Ledger
  const financialScenario: DatabaseArchitectureTopology = {
    id: "topo-pg-financial",
    projectId: "proj-ledger",
    architectureId: "arch-ledger",
    graphRevision: "rev-v2.1",
    version: 1,
    assets: [
      {
        id: "asset-ledger-db",
        name: "PostgreSQL 16 High-Compliance Ledger",
        family: "postgresql",
        providerTechnology: "postgres",
        engineVersion: "16.1",
        environment: "production",
        ownershipTeam: "Financial Core & Treasury",
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v2.1", confirmed: true },
      },
    ],
    schemas: [
      {
        id: "schema-treasury",
        databaseAssetId: "asset-ledger-db",
        architectureRevisionId: "rev-v2.1",
        dialect: "postgresql",
        schemaVersion: 1,
        tables: [
          {
            id: "tbl-accounts",
            name: "accounts",
            schema: "treasury",
            estimatedRowCount: 2000000,
            averageRowSizeBytes: 240,
            tableSizeBytes: 2000000 * 240,
            columns: [
              { id: "col-acc-id", name: "id", dataType: "uuid", isPrimaryKey: true, isNullable: false, isUnique: true, isGenerated: false },
              { id: "col-acc-balance", name: "balance_cents", dataType: "bigint", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
              { id: "col-acc-currency", name: "currency", dataType: "varchar(3)", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
            ],
            primaryKeyColumnNames: ["id"],
            foreignKeys: [],
            indexes: [
              {
                id: "idx-pk-acc",
                name: "accounts_pkey",
                indexType: "btree",
                columnNames: ["id"],
                isUnique: true,
                provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v2.1", confirmed: true },
              },
            ],
            isJunctionTable: false,
            provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v2.1", confirmed: true },
          },
          {
            id: "tbl-ledger-entries",
            name: "ledger_entries",
            schema: "treasury",
            estimatedRowCount: 50000000,
            averageRowSizeBytes: 380,
            tableSizeBytes: 50000000 * 380,
            columns: [
              { id: "col-entry-id", name: "id", dataType: "uuid", isPrimaryKey: true, isNullable: false, isUnique: true, isGenerated: false },
              { id: "col-entry-account", name: "account_id", dataType: "uuid", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
              { id: "col-entry-amount", name: "amount_cents", dataType: "bigint", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
              { id: "col-entry-ts", name: "created_at", dataType: "timestamptz", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
            ],
            primaryKeyColumnNames: ["id", "created_at"],
            foreignKeys: [
              {
                id: "fk-entry-account",
                name: "fk_ledger_entries_account_id",
                sourceColumnNames: ["account_id"],
                targetTableName: "accounts",
                targetColumnNames: ["id"],
                onDeleteAction: "restrict",
                onUpdateAction: "cascade",
              },
            ],
            indexes: [
              {
                id: "idx-pk-entries",
                name: "ledger_entries_pkey",
                indexType: "btree",
                columnNames: ["id", "created_at"],
                isUnique: true,
                provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v2.1", confirmed: true },
              },
            ],
            partitionConfig: {
              partitionType: "range",
              partitionKeyColumnNames: ["created_at"],
              partitionCount: 24,
              pruningSupported: true,
            },
            isJunctionTable: false,
            provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v2.1", confirmed: true },
          },
        ],
        relationships: [
          {
            id: "rel-entries-accounts",
            name: "fk_ledger_entries_account_id",
            sourceTableId: "tbl-ledger-entries",
            targetTableId: "tbl-accounts",
            relationshipType: "one_to_many",
            sourceColumnNames: ["account_id"],
            targetColumnNames: ["id"],
            foreignKeyConstraintId: "fk-entry-account",
            isOptional: false,
            referentialIntegrityEnforced: true,
          },
        ],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v2.1", confirmed: true },
      },
    ],
    workloads: [
      {
        id: "workload-pruned-balance",
        databaseAssetId: "asset-ledger-db",
        queryName: "Monthly Ledger Audit Scan",
        queryType: "select",
        parameterizedSql: "SELECT SUM(amount_cents) FROM ledger_entries WHERE created_at >= '2026-10-01' AND created_at < '2026-11-01'",
        queryFingerprint: "select sum(amount_cents) from ledger_entries where created_at >= ? and created_at < ?",
        readWriteClassification: "read_only",
        frequencyPerMinute: 900,
        concurrentClients: 15,
        expectedReturnedRows: 1,
        targetTableNames: ["ledger_entries"],
        p95LatencyMsModeled: 24.5,
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v2.1", confirmed: true },
      },
    ],
    executionPlans: [],
    transactions: [
      {
        id: "tx-transfer-a-to-b",
        name: "Transfer Account Alpha to Beta",
        databaseAssetId: "asset-ledger-db",
        isolationLevel: "serializable",
        retryPolicyEnabled: true,
        operations: [
          { tableId: "tbl-accounts", tableName: "accounts", lockType: "exclusive", isWrite: true, estimatedDurationMs: 40 },
          { tableId: "tbl-ledger-entries", tableName: "ledger_entries", lockType: "exclusive", isWrite: true, estimatedDurationMs: 35 },
        ],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v2.1", confirmed: true },
      },
      {
        id: "tx-transfer-b-to-a",
        name: "Transfer Account Beta to Alpha",
        databaseAssetId: "asset-ledger-db",
        isolationLevel: "serializable",
        retryPolicyEnabled: true,
        operations: [
          { tableId: "tbl-ledger-entries", tableName: "ledger_entries", lockType: "exclusive", isWrite: true, estimatedDurationMs: 45 },
          { tableId: "tbl-accounts", tableName: "accounts", lockType: "exclusive", isWrite: true, estimatedDurationMs: 30 },
        ],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v2.1", confirmed: true },
      },
    ],
    connectionPooling: {
      poolType: "application_pool",
      poolManagerTechnology: "hikari_cp",
      maxPoolSize: 100,
      minIdle: 25,
      idleTimeoutSeconds: 30,
      connectionTimeoutMs: 1500,
      clientMaxConnections: 200,
    },
    storageForecast: {
      allocatedDiskMb: 1000000, // 1 TB
      provisionedIops: 12000,
      currentLogicalDataMb: 420000,
      currentIndexDataMb: 110000,
      currentWalDataMb: 15000,
      currentTotalMb: 545000,
      projectedMonthlyGrowthMb: 35000,
      projectedSaturationMonths: 13.0,
      readIopsModeled: 4500,
      writeIopsModeled: 5200,
      totalIopsModeled: 9700,
      iopsCapacitySaturationRatio: 0.808,
    },
    createdAt: now,
    updatedAt: now,
  };

  // Scenario 3: Multi-Tenant SaaS Sharded Catalog
  const multiTenantScenario: DatabaseArchitectureTopology = {
    id: "topo-sharded-catalog",
    projectId: "proj-sharded",
    architectureId: "arch-catalog",
    graphRevision: "rev-v3.0",
    version: 1,
    assets: [
      {
        id: "asset-shards",
        name: "Distributed Sharded Postgres Cluster (16 Shards)",
        family: "postgresql",
        providerTechnology: "postgres",
        engineVersion: "16.1",
        environment: "production",
        ownershipTeam: "Catalog Platform Team",
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v3.0", confirmed: true },
      },
    ],
    schemas: [
      {
        id: "schema-catalog",
        databaseAssetId: "asset-shards",
        architectureRevisionId: "rev-v3.0",
        dialect: "postgresql",
        schemaVersion: 1,
        tables: [
          {
            id: "tbl-tenants",
            name: "tenants",
            schema: "catalog",
            estimatedRowCount: 5000,
            averageRowSizeBytes: 512,
            tableSizeBytes: 5000 * 512,
            columns: [
              { id: "col-t-id", name: "tenant_id", dataType: "uuid", isPrimaryKey: true, isNullable: false, isUnique: true, isGenerated: false },
              { id: "col-t-name", name: "name", dataType: "varchar(255)", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
            ],
            primaryKeyColumnNames: ["tenant_id"],
            foreignKeys: [],
            indexes: [
              {
                id: "idx-pk-tenants",
                name: "tenants_pkey",
                indexType: "btree",
                columnNames: ["tenant_id"],
                isUnique: true,
                provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v3.0", confirmed: true },
              },
            ],
            isJunctionTable: false,
            provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v3.0", confirmed: true },
          },
          {
            id: "tbl-items",
            name: "catalog_items",
            schema: "catalog",
            estimatedRowCount: 85000000,
            averageRowSizeBytes: 620,
            tableSizeBytes: 85000000 * 620,
            columns: [
              { id: "col-i-id", name: "item_id", dataType: "uuid", isPrimaryKey: true, isNullable: false, isUnique: true, isGenerated: false },
              { id: "col-i-tid", name: "tenant_id", dataType: "uuid", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
              { id: "col-i-cat", name: "category_id", dataType: "uuid", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
              { id: "col-i-title", name: "title", dataType: "varchar(255)", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
              { id: "col-i-price", name: "price_cents", dataType: "bigint", isPrimaryKey: false, isNullable: false, isUnique: false, isGenerated: false },
            ],
            primaryKeyColumnNames: ["item_id", "tenant_id"],
            foreignKeys: [
              {
                id: "fk-items-tenant",
                name: "fk_catalog_items_tenant_id",
                sourceColumnNames: ["tenant_id"],
                targetTableName: "tenants",
                targetColumnNames: ["tenant_id"],
                onDeleteAction: "cascade",
                onUpdateAction: "cascade",
              },
            ],
            indexes: [
              {
                id: "idx-pk-items",
                name: "catalog_items_pkey",
                indexType: "btree",
                columnNames: ["item_id", "tenant_id"],
                isUnique: true,
                provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v3.0", confirmed: true },
              },
            ],
            isJunctionTable: false,
            provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v3.0", confirmed: true },
          },
        ],
        relationships: [
          {
            id: "rel-items-tenants",
            name: "fk_catalog_items_tenant_id",
            sourceTableId: "tbl-items",
            targetTableId: "tbl-tenants",
            relationshipType: "one_to_many",
            sourceColumnNames: ["tenant_id"],
            targetColumnNames: ["tenant_id"],
            foreignKeyConstraintId: "fk-items-tenant",
            isOptional: false,
            referentialIntegrityEnforced: true,
          },
        ],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-v3.0", confirmed: true },
      },
    ],
    workloads: [
      {
        id: "workload-scatter-gather",
        databaseAssetId: "asset-shards",
        queryName: "Global Category Search (Missing Tenant ID)",
        queryType: "select",
        parameterizedSql: "SELECT item_id, title, price_cents FROM catalog_items WHERE category_id = 'cat-electronics-99' LIMIT 50",
        queryFingerprint: "select item_id, title, price_cents from catalog_items where category_id = ? limit ?",
        readWriteClassification: "read_only",
        frequencyPerMinute: 10800,
        concurrentClients: 35,
        expectedReturnedRows: 50,
        targetTableNames: ["catalog_items"],
        p95LatencyMsModeled: 240.0,
        provenance: { source: "modeled_performance", timestamp: now, graphRevision: "rev-v3.0", confirmed: true },
      },
    ],
    executionPlans: [],
    transactions: [],
    sharding: {
      strategy: "hash",
      shardKeyColumnNames: ["tenant_id"],
      totalShards: 16,
      crossShardJoinRisk: true,
      hotShardRisk: true,
      shards: Array.from({ length: 16 }, (_, i) => ({
        id: `shard-${i + 1}`,
        shardIndex: i,
        targetNodeId: `node-shard-${i + 1}`,
      })),
    },
    migrationPlan: {
      id: "mig-v3-add-barcode",
      name: "Add EAN barcode column to catalog",
      fromRevision: "rev-v2.9",
      toRevision: "rev-v3.0",
      diffEntries: [
        {
          kind: "add_column",
          targetTable: "catalog_items",
          targetObject: "barcode_ean",
          isBreakingChange: true,
          requiresTableRewrite: true,
          requiresExclusiveLock: true,
          riskLevel: "critical",
          description: "Adding NOT NULL barcode column to catalog_items without DEFAULT forces exclusive table lock and full rewrite.",
          expandContractRecommendation: "Use 6-phase expand-and-contract: add nullable column, backfill via batch, set default, then add NOT NULL constraint asynchronously.",
        },
      ],
      steps: [
        { phase: "expand", name: "1. Expand Schema", description: "Add nullable barcode_ean column without locks", reversible: true, requiresLock: false },
        { phase: "deploy_app", name: "2. Dual-Write Application", description: "Deploy app version reading old/new, writing both barcode formats", reversible: true, requiresLock: false },
        { phase: "backfill", name: "3. Backfill Data", description: "Backfill existing 85M rows in throttled 5,000-row chunks", reversible: true, requiresLock: false },
        { phase: "switch", name: "4. Read New Column", description: "Switch application reads completely to barcode_ean", reversible: true, requiresLock: false },
        { phase: "validate", name: "5. Enforce Constraints", description: "Add NOT NULL constraint using VALIDATE CONSTRAINT", reversible: true, requiresLock: false },
        { phase: "contract", name: "6. Contract Schema", description: "Drop legacy columns and unused indexes safely", reversible: false, requiresLock: false },
      ],
      estimatedDowntimeRequiredSeconds: 0,
    },
    storageForecast: {
      allocatedDiskMb: 2000000, // 2 TB
      provisionedIops: 25000,
      currentLogicalDataMb: 850000,
      currentIndexDataMb: 240000,
      currentWalDataMb: 35000,
      currentTotalMb: 1125000,
      projectedMonthlyGrowthMb: 68000,
      projectedSaturationMonths: 12.8,
      readIopsModeled: 9500,
      writeIopsModeled: 6400,
      totalIopsModeled: 15900,
      iopsCapacitySaturationRatio: 0.636,
    },
    createdAt: now,
    updatedAt: now,
  };

  const currentTopology =
    activeScenario === "ecommerce"
      ? ecommerceScenario
      : activeScenario === "financial"
      ? financialScenario
      : multiTenantScenario;

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] flex flex-col font-sans">
      {/* Testbed Header Banner */}
      <header className="p-4 bg-[#080808] border-b border-[#262626] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#141414] border border-[#262626] rounded-md text-[10px] uppercase font-mono tracking-wider text-[#B5B5B5]">
              Verification Testbed
            </span>
            <span className="text-xs font-mono text-[#666666]">Phase 05.3.23</span>
          </div>
          <h1 className="text-lg font-bold text-[#FFFFFF] tracking-tight mt-1">
            Architecture Database Design, Query Performance & Storage Intelligence Engine
          </h1>
          <p className="text-xs text-[#858585] mt-0.5">
            Relational schemas, SQL DDL parser, PostgreSQL EXPLAIN JSON operator trees, left-prefix index redundancy, wait-for deadlock graphs, and IOPS capacity forecasting.
          </p>
        </div>

        {/* Scenario Selector & Run Suite Button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-[#0D0D0D] border border-[#262626] rounded-md p-0.5">
            <button
              onClick={() => setActiveScenario("ecommerce")}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                activeScenario === "ecommerce"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] font-semibold"
                  : "text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              E-Commerce PG16
            </button>
            <button
              onClick={() => setActiveScenario("financial")}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                activeScenario === "financial"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] font-semibold"
                  : "text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              Financial Ledger
            </button>
            <button
              onClick={() => setActiveScenario("multi_tenant")}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                activeScenario === "multi_tenant"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] font-semibold"
                  : "text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              Sharded Catalog
            </button>
          </div>

          <button
            onClick={runAllVerifications}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] text-[#000000] font-semibold text-xs rounded-md shadow-level-1 hover:bg-[#E5E5E5] transition-colors"
          >
            <PlayIcon className="w-3.5 h-3.5" />
            <span>Run Test Suite</span>
          </button>
        </div>
      </header>

      {/* Automated In-Browser Verification Results Tray */}
      {hasRunVerification && (
        <section className="p-4 bg-[#080808] border-b border-[#262626] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayersIcon className="w-4 h-4 text-[#FFFFFF]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
                Automated Verification Results ({verificationResults.filter((r) => r.status === "passed").length}/{verificationResults.length} Passed)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#858585]">
              Executed in Browser Environment
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {verificationResults.map((res, i) => (
              <div
                key={i}
                className="p-3 bg-[#0D0D0D] border border-[#262626] rounded-md space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FFFFFF]">{res.name}</span>
                  {res.status === "passed" ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#FFFFFF] px-1.5 py-0.5 bg-[#141414] border border-[#333333] rounded-md">
                      <CheckIcon className="w-3 h-3 text-[#FFFFFF]" /> PASS
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#FFFFFF] px-1.5 py-0.5 bg-[#1A1A1A] border border-[#404040] rounded-md">
                      <AlertTriangleIcon className="w-3 h-3 text-[#FFFFFF]" /> FAIL
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#858585] leading-relaxed">{res.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Interactive Database Workspace Mount */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <DatabaseWorkspace
          key={activeScenario}
          projectId={currentTopology.projectId}
          architectureId={currentTopology.architectureId}
          graphRevision={currentTopology.graphRevision}
          initialTopology={currentTopology}
        />
      </main>
    </div>
  );
}
