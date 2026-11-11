"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * React Hook for Studio Database Intelligence
 */

import { useState, useMemo, useCallback } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  type DatabaseArchitectureTopology,
  type DatabaseTable,
  architectureDatabaseEngine,
} from "@nxtqr/architecture-intelligence";

export interface UseArchitectureDatabaseProps {
  projectId?: string;
  architectureId?: string;
  graphRevision?: string;
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialTopology?: DatabaseArchitectureTopology;
}

export type DatabaseTab =
  | "overview"
  | "schema"
  | "er_diagram"
  | "queries"
  | "indexes"
  | "transactions"
  | "distribution"
  | "storage"
  | "migrations"
  | "findings";

export function useArchitectureDatabase(props: UseArchitectureDatabaseProps) {
  const {
    projectId = "default-project",
    architectureId = "default-arch",
    graphRevision = "rev-default",
    nodes: _nodes = [],
    edges: _edges = [],
    initialTopology,
  } = props;

  // Build default realistic e-commerce & ledger topology if none supplied
  const defaultTopology: DatabaseArchitectureTopology = useMemo(() => {
    if (initialTopology) return initialTopology;

    const now = new Date().toISOString();
    const primaryAssetId = "asset-aurora-pg-primary";
    const replicaAssetId = "asset-aurora-pg-replica";

    return {
      id: `topo-db-${architectureId}`,
      projectId,
      architectureId,
      graphRevision,
      version: 1,
      assets: [
        {
          id: primaryAssetId,
          name: "Aurora PostgreSQL 16 Primary",
          family: "postgresql",
          providerTechnology: "postgres",
          engineVersion: "16.1",
          environment: "production",
          ownershipTeam: "Core Platform Team",
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
        {
          id: replicaAssetId,
          name: "Aurora PostgreSQL Read Replica (Analytics)",
          family: "postgresql",
          providerTechnology: "postgres",
          engineVersion: "16.1",
          environment: "production",
          ownershipTeam: "Analytics Team",
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      schemas: [
        {
          id: "schema-ecommerce-core",
          databaseAssetId: primaryAssetId,
          architectureRevisionId: graphRevision,
          dialect: "postgresql",
          schemaVersion: 1,
          tables: [
            {
              id: "table-users",
              name: "users",
              schema: "public",
              columns: [
                { id: "u1", name: "id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: true, isGenerated: false },
                { id: "u2", name: "email", dataType: "varchar(255)", isNullable: false, isPrimaryKey: false, isUnique: true, isGenerated: false },
                { id: "u3", name: "tier", dataType: "varchar(32)", isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: "'standard'", isGenerated: false },
                { id: "u4", name: "created_at", dataType: "timestamp with time zone", isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: "NOW()", isGenerated: false },
              ],
              primaryKeyColumnNames: ["id"],
              foreignKeys: [],
              indexes: [
                { id: "idx-users-pk", name: "users_pkey", indexType: "btree", columnNames: ["id"], isUnique: true, provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true } },
                { id: "idx-users-email", name: "users_email_key", indexType: "btree", columnNames: ["email"], isUnique: true, provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true } },
              ],
              estimatedRowCount: 2000000,
              averageRowSizeBytes: 180,
              tableSizeBytes: 360000000,
              isJunctionTable: false,
              provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
            },
            {
              id: "table-orders",
              name: "orders",
              schema: "public",
              columns: [
                { id: "o1", name: "id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: true, isGenerated: false },
                { id: "o2", name: "user_id", dataType: "uuid", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
                { id: "o3", name: "status", dataType: "varchar(50)", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
                { id: "o4", name: "total_cents", dataType: "bigint", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
                { id: "o5", name: "created_at", dataType: "timestamp with time zone", isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: "NOW()", isGenerated: false },
              ],
              primaryKeyColumnNames: ["id"],
              foreignKeys: [
                {
                  id: "fk-orders-users",
                  name: "fk_orders_user_id",
                  sourceColumnNames: ["user_id"],
                  targetTableName: "users",
                  targetColumnNames: ["id"],
                  onDeleteAction: "cascade",
                  onUpdateAction: "cascade",
                },
              ],
              indexes: [
                { id: "idx-orders-pk", name: "orders_pkey", indexType: "btree", columnNames: ["id"], isUnique: true, provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true } },
                // Composite index
                { id: "idx-orders-composite", name: "idx_orders_user_status_created", indexType: "btree", columnNames: ["user_id", "status", "created_at"], isUnique: false, provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true } },
                // Left-prefix redundant index!
                { id: "idx-orders-redundant", name: "idx_orders_user_status", indexType: "btree", columnNames: ["user_id", "status"], isUnique: false, provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true } },
              ],
              estimatedRowCount: 15000000,
              averageRowSizeBytes: 240,
              tableSizeBytes: 3600000000,
              isJunctionTable: false,
              provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
            },
            {
              id: "table-order-items",
              name: "order_items",
              schema: "public",
              columns: [
                { id: "oi1", name: "order_id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: false, isGenerated: false },
                { id: "oi2", name: "item_id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: false, isGenerated: false },
                { id: "oi3", name: "quantity", dataType: "integer", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
                { id: "oi4", name: "unit_price_cents", dataType: "bigint", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
              ],
              primaryKeyColumnNames: ["order_id", "item_id"],
              foreignKeys: [
                {
                  id: "fk-order-items-order",
                  name: "fk_order_items_order_id",
                  sourceColumnNames: ["order_id"],
                  targetTableName: "orders",
                  targetColumnNames: ["id"],
                  onDeleteAction: "cascade",
                  onUpdateAction: "cascade",
                },
              ],
              indexes: [
                { id: "idx-oi-pk", name: "order_items_pkey", indexType: "btree", columnNames: ["order_id", "item_id"], isUnique: true, provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true } },
              ],
              estimatedRowCount: 45000000,
              averageRowSizeBytes: 80,
              tableSizeBytes: 3600000000,
              isJunctionTable: true,
              provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
            },
          ],
          relationships: [
            {
              id: "rel-orders-users",
              name: "fk_orders_user_id",
              sourceTableId: "table-orders",
              targetTableId: "table-users",
              relationshipType: "one_to_many",
              sourceColumnNames: ["user_id"],
              targetColumnNames: ["id"],
              foreignKeyConstraintId: "fk-orders-users",
              isOptional: false,
              referentialIntegrityEnforced: true,
            },
          ],
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      workloads: [
        {
          id: "workload-customer-orders",
          databaseAssetId: primaryAssetId,
          queryName: "Find Customer Recent Orders",
          queryType: "select",
          parameterizedSql: "SELECT id, status, total_cents, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20;",
          queryFingerprint: "select id, status, total_cents, created_at from orders where user_id = ? order by created_at desc limit ?;",
          readWriteClassification: "read_only",
          frequencyPerMinute: 24000, // 400 queries/sec
          concurrentClients: 40,
          expectedReturnedRows: 20,
          targetTableNames: ["orders"],
          p95LatencyMsModeled: 8.5,
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
        {
          id: "workload-unindexed-search",
          databaseAssetId: primaryAssetId,
          queryName: "Find Orders By Total Amount Filter",
          queryType: "select",
          parameterizedSql: "SELECT id, user_id FROM orders WHERE total_cents > $1;",
          queryFingerprint: "select id, user_id from orders where total_cents > ?;",
          readWriteClassification: "read_only",
          frequencyPerMinute: 6000, // 100 queries/sec
          concurrentClients: 20,
          expectedReturnedRows: 500,
          targetTableNames: ["orders"],
          p95LatencyMsModeled: 280.0, // High latency sequential scan
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      executionPlans: [
        {
          id: "plan-orders-seq-scan",
          queryWorkloadId: "workload-unindexed-search",
          format: "postgres_json",
          isActualExecution: true,
          totalExecutionTimeMs: 312.4,
          planningTimeMs: 0.62,
          warnings: ["Sequential Scan on 15M row table without index filters."],
          provenance: { source: "observed_performance", timestamp: now, graphRevision, confirmed: true },
          rootOperator: {
            id: "op-seq-scan-orders",
            operatorType: "seq_scan",
            targetTableName: "orders",
            estimatedStartupCost: 0.0,
            estimatedTotalCost: 48500.0,
            estimatedRows: 1200,
            actualStartupTimeMs: 0.08,
            actualTotalTimeMs: 310.2,
            actualRows: 15000000,
            actualLoops: 1,
            sharedHitBlocks: 45000,
            sharedReadBlocks: 185000,
            filterPredicate: "(total_cents > 100000)",
            children: [],
          },
        },
      ],
      transactions: [
        {
          id: "tx-order-checkout",
          name: "Checkout Order Transaction",
          databaseAssetId: primaryAssetId,
          isolationLevel: "read_committed",
          retryPolicyEnabled: false,
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
          operations: [
            { tableId: "table-orders", tableName: "orders", lockType: "exclusive", isWrite: true, estimatedDurationMs: 40 },
            { tableId: "table-order-items", tableName: "order_items", lockType: "exclusive", isWrite: true, estimatedDurationMs: 35 },
          ],
        },
        {
          id: "tx-order-cancel",
          name: "Cancellation Restock Transaction",
          databaseAssetId: primaryAssetId,
          isolationLevel: "read_committed",
          retryPolicyEnabled: false,
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
          operations: [
            { tableId: "table-order-items", tableName: "order_items", lockType: "exclusive", isWrite: true, estimatedDurationMs: 50 },
            { tableId: "table-orders", tableName: "orders", lockType: "exclusive", isWrite: true, estimatedDurationMs: 45 },
          ],
        },
      ],
      connectionPooling: {
        poolType: "transaction_pool",
        poolManagerTechnology: "pgbouncer",
        maxPoolSize: 150,
        minIdle: 20,
        idleTimeoutSeconds: 60,
        connectionTimeoutMs: 3000,
        clientMaxConnections: 1200,
      },
      readReplicaRouting: {
        strategy: "lag_aware_replicas",
        maxAllowableLagMs: 5000,
        readAfterWriteGracePeriodSeconds: 3,
        replicaCount: 1,
        p95ReplicaLagMsObserved: 1200,
      },
      storageForecast: {
        allocatedDiskMb: 250000, // 250 GB
        provisionedIops: 5000,
        currentLogicalDataMb: 7560,
        currentIndexDataMb: 3200,
        currentWalDataMb: 850,
        currentTotalMb: 11610,
        projectedMonthlyGrowthMb: 8500,
        projectedSaturationMonths: 28.0,
        readIopsModeled: 2150,
        writeIopsModeled: 780,
        totalIopsModeled: 2930,
        iopsCapacitySaturationRatio: 0.586,
      },
      createdAt: now,
      updatedAt: now,
    };
  }, [architectureId, graphRevision, initialTopology, projectId]);

  const [topology, setTopology] = useState<DatabaseArchitectureTopology>(defaultTopology);
  const [activeTab, setActiveTab] = useState<DatabaseTab>("overview");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(
    topology.assets[0]?.id ?? null
  );
  const [selectedTableId, setSelectedTableId] = useState<string | null>(
    topology.schemas[0]?.tables[0]?.id ?? null
  );
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(
    topology.workloads[0]?.id ?? null
  );
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(
    topology.transactions[0]?.id ?? null
  );

  // Run comprehensive database intelligence analysis
  const analysis = useMemo(() => {
    return architectureDatabaseEngine.analyzeTopology(topology);
  }, [topology]);

  const selectedAsset = useMemo(() => {
    return topology.assets.find((a) => a.id === selectedAssetId) || topology.assets[0] || null;
  }, [topology.assets, selectedAssetId]);

  const selectedTable = useMemo(() => {
    for (const schema of topology.schemas) {
      const table = schema.tables.find((t) => t.id === selectedTableId);
      if (table) return table;
    }
    return topology.schemas[0]?.tables[0] || null;
  }, [topology.schemas, selectedTableId]);

  const selectedQuery = useMemo(() => {
    return topology.workloads.find((w) => w.id === selectedQueryId) || topology.workloads[0] || null;
  }, [topology.workloads, selectedQueryId]);

  const selectedTransaction = useMemo(() => {
    return (
      topology.transactions.find((tx) => tx.id === selectedTransactionId) ||
      topology.transactions[0] ||
      null
    );
  }, [topology.transactions, selectedTransactionId]);

  const selectAsset = useCallback((id: string) => {
    setSelectedAssetId(id);
  }, []);

  const selectTable = useCallback((id: string) => {
    setSelectedTableId(id);
  }, []);

  const selectQuery = useCallback((id: string) => {
    setSelectedQueryId(id);
  }, []);

  const selectTransaction = useCallback((id: string) => {
    setSelectedTransactionId(id);
  }, []);

  const updateTable = useCallback((tableId: string, patch: Partial<DatabaseTable>) => {
    setTopology((prev) => {
      const updatedSchemas = prev.schemas.map((schema) => ({
        ...schema,
        tables: schema.tables.map((tbl) => (tbl.id === tableId ? { ...tbl, ...patch } : tbl)),
      }));
      return { ...prev, schemas: updatedSchemas, updatedAt: new Date().toISOString() };
    });
  }, []);

  return {
    topology,
    analysis,
    activeTab,
    setActiveTab,
    selectedAsset,
    selectedTable,
    selectedQuery,
    selectedTransaction,
    selectAsset,
    selectTable,
    selectQuery,
    selectTransaction,
    updateTable,
  };
}
