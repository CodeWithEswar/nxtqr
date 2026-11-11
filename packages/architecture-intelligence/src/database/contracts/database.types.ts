/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Domain Contracts & Type Definitions
 */

export type DatabaseEvidenceSource =
  | "declared_design"
  | "imported_configuration"
  | "observed_performance"
  | "modeled_performance"
  | "unknown";

export interface DatabaseStateProvenance {
  source: DatabaseEvidenceSource;
  sourceIdentifier?: string;
  timestamp: string;
  graphRevision: string;
  confirmed: boolean;
  notes?: string;
}

export type DatabaseFamily =
  | "postgresql"
  | "mysql"
  | "sqlite"
  | "document_db"
  | "key_value"
  | "wide_column"
  | "graph"
  | "time_series"
  | "search"
  | "distributed_sql";

export type DatabaseProviderTechnology =
  | "postgres"
  | "mysql"
  | "sqlite"
  | "mongodb"
  | "dynamodb"
  | "cassandra"
  | "redis"
  | "neo4j"
  | "clickhouse"
  | "elasticsearch"
  | "cockroachdb"
  | "custom";

export type IndexType =
  | "btree"
  | "hash"
  | "gin"
  | "gist"
  | "brin"
  | "bitmap"
  | "inverted"
  | "spatial"
  | "custom";

export type IsolationLevel =
  | "read_uncommitted"
  | "read_committed"
  | "repeatable_read"
  | "serializable"
  | "snapshot"
  | "unknown";

export type PartitioningType = "range" | "hash" | "list" | "composite" | "none";

export type ShardingStrategy = "hash" | "range" | "directory" | "tenant" | "none";

export type ConnectionPoolType =
  | "direct"
  | "application_pool"
  | "transaction_pool"
  | "session_pool";

export type ForeignKeyAction = "cascade" | "restrict" | "set_null" | "set_default" | "no_action";

export interface DatabaseAsset {
  id: string; // Database Node ID or Asset ID
  architectureComponentId?: string;
  name: string;
  family: DatabaseFamily;
  providerTechnology: DatabaseProviderTechnology;
  engineVersion?: string;
  deploymentReference?: string;
  environment: "development" | "staging" | "production";
  ownershipTeam?: string;
  provenance: DatabaseStateProvenance;
}

export interface DatabaseProviderCapabilities {
  supportsTransactions: boolean;
  supportedIsolationLevels: IsolationLevel[];
  supportedIndexTypes: IndexType[];
  supportsPartitioning: boolean;
  supportedPartitioningTypes: PartitioningType[];
  supportsSharding: boolean;
  supportsExplainPlan: boolean;
  supportsPITR: boolean;
  supportsCDC: boolean;
  supportsFullTextSearch: boolean;
  supportsGeneratedColumns: boolean;
  maxConnectionsDefault: number;
  provenance: DatabaseStateProvenance;
}

export interface TableColumn {
  id: string;
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultValue?: string;
  isGenerated: boolean;
  generationExpression?: string;
  characterMaximumLength?: number;
  numericPrecision?: number;
  checkConstraintExpression?: string;
  comment?: string;
}

export interface ForeignKeyConstraint {
  id: string;
  name: string;
  sourceColumnNames: string[];
  targetTableName: string;
  targetColumnNames: string[];
  onDeleteAction: ForeignKeyAction;
  onUpdateAction: ForeignKeyAction;
}

export interface TableIndex {
  id: string;
  name: string;
  indexType: IndexType;
  columnNames: string[];
  isUnique: boolean;
  partialPredicate?: string;
  includedColumnNames?: string[];
  estimatedSizeBytes?: number;
  provenance: DatabaseStateProvenance;
}

export interface TablePartitionConfig {
  partitionType: PartitioningType;
  partitionKeyColumnNames: string[];
  partitionCount?: number;
  pruningSupported: boolean;
}

export interface DatabaseTable {
  id: string;
  name: string;
  schema: string;
  columns: TableColumn[];
  primaryKeyColumnNames: string[];
  foreignKeys: ForeignKeyConstraint[];
  indexes: TableIndex[];
  estimatedRowCount: number;
  averageRowSizeBytes: number;
  tableSizeBytes?: number;
  isJunctionTable: boolean;
  partitionConfig?: TablePartitionConfig;
  provenance: DatabaseStateProvenance;
}

export interface DatabaseRelationship {
  id: string;
  name: string;
  sourceTableId: string;
  targetTableId: string;
  relationshipType: "one_to_one" | "one_to_many" | "many_to_many";
  sourceColumnNames: string[];
  targetColumnNames: string[];
  foreignKeyConstraintId?: string;
  isOptional: boolean;
  referentialIntegrityEnforced: boolean;
}

export interface DatabaseSchema {
  id: string;
  databaseAssetId: string;
  architectureRevisionId: string;
  dialect: string;
  tables: DatabaseTable[];
  relationships: DatabaseRelationship[];
  schemaVersion: number;
  provenance: DatabaseStateProvenance;
}

export interface QueryWorkload {
  id: string;
  databaseAssetId: string;
  queryName: string;
  queryType: "select" | "insert" | "update" | "delete" | "mixed";
  parameterizedSql: string;
  queryFingerprint: string;
  readWriteClassification: "read_only" | "write_only" | "read_write";
  frequencyPerMinute: number;
  concurrentClients: number;
  expectedReturnedRows: number;
  targetTableNames: string[];
  p95LatencyMsModeled?: number;
  p95LatencyMsObserved?: number;
  provenance: DatabaseStateProvenance;
}

export type QueryPlanOperatorType =
  | "seq_scan"
  | "index_scan"
  | "index_only_scan"
  | "bitmap_index_scan"
  | "bitmap_heap_scan"
  | "nested_loop"
  | "hash_join"
  | "merge_join"
  | "sort"
  | "aggregate"
  | "materialize"
  | "parallel_seq_scan"
  | "limit"
  | "custom";

export interface QueryPlanOperator {
  id: string;
  operatorType: QueryPlanOperatorType;
  targetTableName?: string;
  indexName?: string;
  estimatedStartupCost: number;
  estimatedTotalCost: number;
  estimatedRows: number;
  actualStartupTimeMs?: number;
  actualTotalTimeMs?: number;
  actualRows?: number;
  actualLoops?: number;
  sharedHitBlocks?: number;
  sharedReadBlocks?: number;
  filterPredicate?: string;
  indexCondition?: string;
  children: QueryPlanOperator[];
}

export interface QueryExecutionPlan {
  id: string;
  queryWorkloadId: string;
  format: "postgres_json" | "custom";
  isActualExecution: boolean; // true if EXPLAIN ANALYZE backed with actual metrics
  totalExecutionTimeMs?: number;
  planningTimeMs?: number;
  rootOperator: QueryPlanOperator;
  warnings: string[];
  provenance: DatabaseStateProvenance;
}

export interface TransactionOperation {
  tableId: string;
  tableName: string;
  lockType: "shared" | "exclusive" | "row_share" | "row_exclusive";
  isWrite: boolean;
  estimatedDurationMs: number;
}

export interface TransactionModel {
  id: string;
  name: string;
  databaseAssetId: string;
  isolationLevel: IsolationLevel;
  operations: TransactionOperation[];
  retryPolicyEnabled: boolean;
  maxRetryAttempts?: number;
  provenance: DatabaseStateProvenance;
}

export interface LockContentionScenario {
  id: string;
  contendingTransactionIds: string[];
  conflictingTableName: string;
  hasDeadlockCycle: boolean;
  cyclePath: string[];
  deadlockRiskLevel: "critical" | "high" | "medium" | "low";
  explanation: string;
}

export interface ConnectionPoolingConfig {
  poolType: ConnectionPoolType;
  poolManagerTechnology: "pgbouncer" | "hikari_cp" | "rds_proxy" | "direct" | "custom";
  maxPoolSize: number;
  minIdle: number;
  idleTimeoutSeconds: number;
  connectionTimeoutMs: number;
  clientMaxConnections: number;
}

export interface ReadReplicaRoutingConfig {
  strategy: "primary_only" | "round_robin_replicas" | "lag_aware_replicas" | "session_sticky";
  maxAllowableLagMs: number;
  readAfterWriteGracePeriodSeconds: number;
  replicaCount: number;
  p95ReplicaLagMsObserved?: number;
}

export interface ShardingTopology {
  strategy: ShardingStrategy;
  shardKeyColumnNames: string[];
  totalShards: number;
  crossShardJoinRisk: boolean;
  hotShardRisk: boolean;
  shards: Array<{
    id: string;
    shardIndex: number;
    assignedKeyRange?: string;
    targetNodeId: string;
  }>;
}

export type SchemaChangeKind =
  | "add_table"
  | "drop_table"
  | "add_column"
  | "drop_column"
  | "alter_column_type"
  | "alter_column_nullability"
  | "add_constraint"
  | "drop_constraint"
  | "add_index"
  | "drop_index";

export interface SchemaDiffEntry {
  kind: SchemaChangeKind;
  targetTable: string;
  targetObject: string;
  isBreakingChange: boolean;
  requiresTableRewrite: boolean;
  requiresExclusiveLock: boolean;
  riskLevel: "critical" | "high" | "medium" | "low";
  description: string;
  expandContractRecommendation?: string;
}

export interface DatabaseMigrationPlan {
  id: string;
  name: string;
  fromRevision: string;
  toRevision: string;
  diffEntries: SchemaDiffEntry[];
  steps: Array<{
    phase: "expand" | "deploy_app" | "backfill" | "validate" | "switch" | "contract";
    name: string;
    description: string;
    reversible: boolean;
    requiresLock: boolean;
  }>;
  estimatedDowntimeRequiredSeconds: number;
}

export interface StorageForecast {
  allocatedDiskMb?: number;
  provisionedIops?: number;
  currentLogicalDataMb: number;
  currentIndexDataMb: number;
  currentWalDataMb: number;
  currentTotalMb: number;
  projectedMonthlyGrowthMb: number;
  projectedSaturationMonths?: number;
  readIopsModeled: number;
  writeIopsModeled: number;
  totalIopsModeled: number;
  iopsCapacitySaturationRatio: number;
}

export type DatabaseFindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type DatabaseFindingCategory =
  | "missing_index_scan"
  | "redundant_index"
  | "unbounded_table_scan"
  | "cardinality_estimation_mismatch"
  | "deadlock_dependency_cycle"
  | "transaction_isolation_anomaly"
  | "connection_pool_exhaustion"
  | "breaking_migration_table_rewrite"
  | "cross_shard_join_bottleneck"
  | "storage_iops_saturation"
  | "missing_foreign_key_index"
  | "unnormalized_redundancy"
  | "write_amplification_overhead";

export interface DatabaseArchitectureFinding {
  id: string;
  category: DatabaseFindingCategory;
  severity: DatabaseFindingSeverity;
  affectedTableId?: string;
  affectedQueryId?: string;
  affectedIndexId?: string;
  affectedTransactionId?: string;
  title: string;
  explanation: string;
  evidence: string[];
  riskAnalysis: string;
  remediation: string;
  deterministicCalculation?: {
    metricName: string;
    value: number;
    threshold: number;
    formula: string;
  };
}

export interface DatabaseArchitectureTopology {
  id: string;
  projectId: string;
  architectureId: string;
  graphRevision: string;
  version: number;
  assets: DatabaseAsset[];
  schemas: DatabaseSchema[];
  workloads: QueryWorkload[];
  executionPlans: QueryExecutionPlan[];
  transactions: TransactionModel[];
  connectionPooling?: ConnectionPoolingConfig;
  readReplicaRouting?: ReadReplicaRoutingConfig;
  sharding?: ShardingTopology;
  migrationPlan?: DatabaseMigrationPlan;
  storageForecast?: StorageForecast;
  provenance?: DatabaseStateProvenance;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseAnalysisSummary {
  assetCount: number;
  tableCount: number;
  indexCount: number;
  workloadCount: number;
  planCount: number;
  transactionCount: number;
  unindexedForeignKeysCount: number;
  redundantIndexCount: number;
  deadlockRiskCount: number;
  breakingMigrationCount: number;
  findingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
}
