/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Zod Validation Schemas
 */

import { z } from "zod";
import type {
  QueryPlanOperator,
  QueryExecutionPlan,
  DatabaseArchitectureTopology,
} from "../contracts/database.types";

export const DatabaseEvidenceSourceSchema = z.enum([
  "declared_design",
  "imported_configuration",
  "observed_performance",
  "modeled_performance",
  "unknown",
]);

export const DatabaseStateProvenanceSchema = z.object({
  source: DatabaseEvidenceSourceSchema,
  sourceIdentifier: z.string().optional(),
  timestamp: z.string(),
  graphRevision: z.string(),
  confirmed: z.boolean(),
  notes: z.string().optional(),
});

export const DatabaseFamilySchema = z.enum([
  "postgresql",
  "mysql",
  "sqlite",
  "document_db",
  "key_value",
  "wide_column",
  "graph",
  "time_series",
  "search",
  "distributed_sql",
]);

export const DatabaseProviderTechnologySchema = z.enum([
  "postgres",
  "mysql",
  "sqlite",
  "mongodb",
  "dynamodb",
  "cassandra",
  "redis",
  "neo4j",
  "clickhouse",
  "elasticsearch",
  "cockroachdb",
  "custom",
]);

export const IndexTypeSchema = z.enum([
  "btree",
  "hash",
  "gin",
  "gist",
  "brin",
  "bitmap",
  "inverted",
  "spatial",
  "custom",
]);

export const IsolationLevelSchema = z.enum([
  "read_uncommitted",
  "read_committed",
  "repeatable_read",
  "serializable",
  "snapshot",
  "unknown",
]);

export const PartitioningTypeSchema = z.enum([
  "range",
  "hash",
  "list",
  "composite",
  "none",
]);

export const ShardingStrategySchema = z.enum([
  "hash",
  "range",
  "directory",
  "tenant",
  "none",
]);

export const ConnectionPoolTypeSchema = z.enum([
  "direct",
  "application_pool",
  "transaction_pool",
  "session_pool",
]);

export const ForeignKeyActionSchema = z.enum([
  "cascade",
  "restrict",
  "set_null",
  "set_default",
  "no_action",
]);

export const DatabaseAssetSchema = z.object({
  id: z.string().min(1),
  architectureComponentId: z.string().optional(),
  name: z.string().min(1),
  family: DatabaseFamilySchema,
  providerTechnology: DatabaseProviderTechnologySchema,
  engineVersion: z.string().optional(),
  deploymentReference: z.string().optional(),
  environment: z.enum(["development", "staging", "production"]),
  ownershipTeam: z.string().optional(),
  provenance: DatabaseStateProvenanceSchema,
});

export const TableColumnSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  dataType: z.string().min(1),
  isNullable: z.boolean(),
  isPrimaryKey: z.boolean(),
  isUnique: z.boolean(),
  defaultValue: z.string().optional(),
  isGenerated: z.boolean(),
  generationExpression: z.string().optional(),
  characterMaximumLength: z.number().int().optional(),
  numericPrecision: z.number().int().optional(),
  checkConstraintExpression: z.string().optional(),
  comment: z.string().optional(),
});

export const ForeignKeyConstraintSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sourceColumnNames: z.array(z.string().min(1)),
  targetTableName: z.string().min(1),
  targetColumnNames: z.array(z.string().min(1)),
  onDeleteAction: ForeignKeyActionSchema,
  onUpdateAction: ForeignKeyActionSchema,
});

export const TableIndexSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  indexType: IndexTypeSchema,
  columnNames: z.array(z.string().min(1)),
  isUnique: z.boolean(),
  partialPredicate: z.string().optional(),
  includedColumnNames: z.array(z.string()).optional(),
  estimatedSizeBytes: z.number().nonnegative().optional(),
  provenance: DatabaseStateProvenanceSchema,
});

export const TablePartitionConfigSchema = z.object({
  partitionType: PartitioningTypeSchema,
  partitionKeyColumnNames: z.array(z.string().min(1)),
  partitionCount: z.number().int().positive().optional(),
  pruningSupported: z.boolean(),
});

export const DatabaseTableSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  schema: z.string(),
  columns: z.array(TableColumnSchema),
  primaryKeyColumnNames: z.array(z.string()),
  foreignKeys: z.array(ForeignKeyConstraintSchema),
  indexes: z.array(TableIndexSchema),
  estimatedRowCount: z.number().nonnegative(),
  averageRowSizeBytes: z.number().nonnegative(),
  tableSizeBytes: z.number().nonnegative().optional(),
  isJunctionTable: z.boolean(),
  partitionConfig: TablePartitionConfigSchema.optional(),
  provenance: DatabaseStateProvenanceSchema,
});

export const DatabaseRelationshipSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sourceTableId: z.string().min(1),
  targetTableId: z.string().min(1),
  relationshipType: z.enum(["one_to_one", "one_to_many", "many_to_many"]),
  sourceColumnNames: z.array(z.string().min(1)),
  targetColumnNames: z.array(z.string().min(1)),
  foreignKeyConstraintId: z.string().optional(),
  isOptional: z.boolean(),
  referentialIntegrityEnforced: z.boolean(),
});

export const DatabaseSchemaDefinitionSchema = z.object({
  id: z.string().min(1),
  databaseAssetId: z.string().min(1),
  architectureRevisionId: z.string().min(1),
  dialect: z.string(),
  tables: z.array(DatabaseTableSchema),
  relationships: z.array(DatabaseRelationshipSchema),
  schemaVersion: z.number().int().min(1),
  provenance: DatabaseStateProvenanceSchema,
});

export const QueryWorkloadSchema = z.object({
  id: z.string().min(1),
  databaseAssetId: z.string().min(1),
  queryName: z.string().min(1),
  queryType: z.enum(["select", "insert", "update", "delete", "mixed"]),
  parameterizedSql: z.string().min(1),
  queryFingerprint: z.string().min(1),
  readWriteClassification: z.enum(["read_only", "write_only", "read_write"]),
  frequencyPerMinute: z.number().nonnegative(),
  concurrentClients: z.number().int().positive(),
  expectedReturnedRows: z.number().nonnegative(),
  targetTableNames: z.array(z.string()),
  p95LatencyMsModeled: z.number().nonnegative().optional(),
  p95LatencyMsObserved: z.number().nonnegative().optional(),
  provenance: DatabaseStateProvenanceSchema,
});

export const QueryPlanOperatorTypeSchema = z.enum([
  "seq_scan",
  "index_scan",
  "index_only_scan",
  "bitmap_index_scan",
  "bitmap_heap_scan",
  "nested_loop",
  "hash_join",
  "merge_join",
  "sort",
  "aggregate",
  "materialize",
  "parallel_seq_scan",
  "limit",
  "custom",
]);

export const QueryPlanOperatorSchema: z.ZodType<QueryPlanOperator> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    operatorType: QueryPlanOperatorTypeSchema,
    targetTableName: z.string().optional(),
    indexName: z.string().optional(),
    estimatedStartupCost: z.number(),
    estimatedTotalCost: z.number(),
    estimatedRows: z.number(),
    actualStartupTimeMs: z.number().optional(),
    actualTotalTimeMs: z.number().optional(),
    actualRows: z.number().optional(),
    actualLoops: z.number().optional(),
    sharedHitBlocks: z.number().optional(),
    sharedReadBlocks: z.number().optional(),
    filterPredicate: z.string().optional(),
    indexCondition: z.string().optional(),
    children: z.array(QueryPlanOperatorSchema),
  })
);

export const QueryExecutionPlanSchema: z.ZodType<QueryExecutionPlan> = z.object({
  id: z.string().min(1),
  queryWorkloadId: z.string().min(1),
  format: z.enum(["postgres_json", "custom"]),
  isActualExecution: z.boolean(),
  totalExecutionTimeMs: z.number().optional(),
  planningTimeMs: z.number().optional(),
  rootOperator: QueryPlanOperatorSchema,
  warnings: z.array(z.string()),
  provenance: DatabaseStateProvenanceSchema,
});

export const TransactionOperationSchema = z.object({
  tableId: z.string().min(1),
  tableName: z.string().min(1),
  lockType: z.enum(["shared", "exclusive", "row_share", "row_exclusive"]),
  isWrite: z.boolean(),
  estimatedDurationMs: z.number().nonnegative(),
});

export const TransactionModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  databaseAssetId: z.string().min(1),
  isolationLevel: IsolationLevelSchema,
  operations: z.array(TransactionOperationSchema),
  retryPolicyEnabled: z.boolean(),
  maxRetryAttempts: z.number().int().optional(),
  provenance: DatabaseStateProvenanceSchema,
});

export const ConnectionPoolingConfigSchema = z.object({
  poolType: ConnectionPoolTypeSchema,
  poolManagerTechnology: z.enum(["pgbouncer", "hikari_cp", "rds_proxy", "direct", "custom"]),
  maxPoolSize: z.number().int().positive(),
  minIdle: z.number().int().nonnegative(),
  idleTimeoutSeconds: z.number().int().positive(),
  connectionTimeoutMs: z.number().int().positive(),
  clientMaxConnections: z.number().int().positive(),
});

export const ReadReplicaRoutingConfigSchema = z.object({
  strategy: z.enum(["primary_only", "round_robin_replicas", "lag_aware_replicas", "session_sticky"]),
  maxAllowableLagMs: z.number().nonnegative(),
  readAfterWriteGracePeriodSeconds: z.number().nonnegative(),
  replicaCount: z.number().int().nonnegative(),
  p95ReplicaLagMsObserved: z.number().nonnegative().optional(),
});

export const ShardingTopologySchema = z.object({
  strategy: ShardingStrategySchema,
  shardKeyColumnNames: z.array(z.string().min(1)),
  totalShards: z.number().int().positive(),
  crossShardJoinRisk: z.boolean(),
  hotShardRisk: z.boolean(),
  shards: z.array(
    z.object({
      id: z.string().min(1),
      shardIndex: z.number().int().nonnegative(),
      assignedKeyRange: z.string().optional(),
      targetNodeId: z.string().min(1),
    })
  ),
});

export const SchemaDiffEntrySchema = z.object({
  kind: z.enum([
    "add_table",
    "drop_table",
    "add_column",
    "drop_column",
    "alter_column_type",
    "alter_column_nullability",
    "add_constraint",
    "drop_constraint",
    "add_index",
    "drop_index",
  ]),
  targetTable: z.string(),
  targetObject: z.string(),
  isBreakingChange: z.boolean(),
  requiresTableRewrite: z.boolean(),
  requiresExclusiveLock: z.boolean(),
  riskLevel: z.enum(["critical", "high", "medium", "low"]),
  description: z.string(),
  expandContractRecommendation: z.string().optional(),
});

export const DatabaseMigrationPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fromRevision: z.string(),
  toRevision: z.string(),
  diffEntries: z.array(SchemaDiffEntrySchema),
  steps: z.array(
    z.object({
      phase: z.enum(["expand", "deploy_app", "backfill", "validate", "switch", "contract"]),
      name: z.string(),
      description: z.string(),
      reversible: z.boolean(),
      requiresLock: z.boolean(),
    })
  ),
  estimatedDowntimeRequiredSeconds: z.number().nonnegative(),
});

export const StorageForecastSchema = z.object({
  allocatedDiskMb: z.number().nonnegative().optional(),
  provisionedIops: z.number().nonnegative().optional(),
  currentLogicalDataMb: z.number().nonnegative(),
  currentIndexDataMb: z.number().nonnegative(),
  currentWalDataMb: z.number().nonnegative(),
  currentTotalMb: z.number().nonnegative(),
  projectedMonthlyGrowthMb: z.number().nonnegative(),
  projectedSaturationMonths: z.number().positive().optional(),
  readIopsModeled: z.number().nonnegative(),
  writeIopsModeled: z.number().nonnegative(),
  totalIopsModeled: z.number().nonnegative(),
  iopsCapacitySaturationRatio: z.number().nonnegative(),
});

export const DatabaseFindingCategorySchema = z.enum([
  "missing_index_scan",
  "redundant_index",
  "unbounded_table_scan",
  "cardinality_estimation_mismatch",
  "deadlock_dependency_cycle",
  "transaction_isolation_anomaly",
  "connection_pool_exhaustion",
  "breaking_migration_table_rewrite",
  "cross_shard_join_bottleneck",
  "storage_iops_saturation",
  "missing_foreign_key_index",
  "unnormalized_redundancy",
  "write_amplification_overhead",
]);

export const DatabaseFindingSeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const DatabaseArchitectureFindingSchema = z.object({
  id: z.string().min(1),
  category: DatabaseFindingCategorySchema,
  severity: DatabaseFindingSeveritySchema,
  affectedTableId: z.string().optional(),
  affectedQueryId: z.string().optional(),
  affectedIndexId: z.string().optional(),
  affectedTransactionId: z.string().optional(),
  title: z.string().min(1),
  explanation: z.string().min(1),
  evidence: z.array(z.string()),
  riskAnalysis: z.string().min(1),
  remediation: z.string().min(1),
  deterministicCalculation: z
    .object({
      metricName: z.string(),
      value: z.number(),
      threshold: z.number(),
      formula: z.string(),
    })
    .optional(),
});

export const DatabaseArchitectureTopologySchema: z.ZodType<DatabaseArchitectureTopology> = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  graphRevision: z.string().min(1),
  version: z.number().int().min(1),
  assets: z.array(DatabaseAssetSchema),
  schemas: z.array(DatabaseSchemaDefinitionSchema),
  workloads: z.array(QueryWorkloadSchema),
  executionPlans: z.array(QueryExecutionPlanSchema),
  transactions: z.array(TransactionModelSchema),
  connectionPooling: ConnectionPoolingConfigSchema.optional(),
  readReplicaRouting: ReadReplicaRoutingConfigSchema.optional(),
  sharding: ShardingTopologySchema.optional(),
  migrationPlan: DatabaseMigrationPlanSchema.optional(),
  storageForecast: StorageForecastSchema.optional(),
  provenance: DatabaseStateProvenanceSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
