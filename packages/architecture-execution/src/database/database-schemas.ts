import { z } from "zod";

// ----------------------------------------------------------------------------
// 1. Column Types & Schema Definitions
// ----------------------------------------------------------------------------

export const ColumnTypeSchema = z.enum([
  "integer",
  "decimal",
  "string",
  "boolean",
  "date",
  "timestamp",
  "json",
]);
export type ColumnType = z.infer<typeof ColumnTypeSchema>;

export const ColumnDefinitionSchema = z.object({
  name: z.string().min(1),
  type: ColumnTypeSchema,
  primaryKey: z.boolean().optional(),
  nullable: z.boolean().optional(),
  unique: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  references: z
    .object({
      table: z.string(),
      column: z.string(),
    })
    .optional(),
});
export type ColumnDefinition = z.infer<typeof ColumnDefinitionSchema>;

export const IndexDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  tableName: z.string(),
  columns: z.array(z.string()).min(1),
  unique: z.boolean().default(false),
  type: z.enum(["btree", "hash"]).default("btree"),
});
export type IndexDefinition = z.infer<typeof IndexDefinitionSchema>;

export const TableDefinitionSchema = z.object({
  name: z.string().min(1),
  columns: z.array(ColumnDefinitionSchema).min(1),
  primaryKey: z.array(z.string()).min(1),
  indexes: z.array(IndexDefinitionSchema).default([]),
});
export type TableDefinition = z.infer<typeof TableDefinitionSchema>;

export const DatabaseSchemaDefinitionSchema = z.object({
  tables: z.record(TableDefinitionSchema),
});
export type DatabaseSchema = z.infer<typeof DatabaseSchemaDefinitionSchema>;

// ----------------------------------------------------------------------------
// 2. Fixtures & Row Representation
// ----------------------------------------------------------------------------

export type DatabaseRow = Record<string, unknown>;

export interface MVCCRowVersion {
  rowId: string;
  tableName: string;
  data: DatabaseRow;
  createdXmin: string; // transaction ID that created this version
  deletedXmax: string | null; // transaction ID that superseded/deleted this version
  createdAtMs: number;
}

// ----------------------------------------------------------------------------
// 3. Restricted SQL Parser AST Models
// ----------------------------------------------------------------------------

export type QueryType = "SELECT" | "INSERT" | "UPDATE" | "DELETE";

export type BinaryOperator = "=" | "!=" | "<" | "<=" | ">" | ">=" | "AND" | "OR" | "LIKE";

export interface FilterExpression {
  leftColumn?: string;
  operator?: BinaryOperator;
  rightValue?: unknown;
  rightColumn?: string;
  isNull?: boolean;
  isNotNull?: boolean;
  and?: FilterExpression[];
  or?: FilterExpression[];
}

export interface JoinDefinition {
  type: "INNER" | "LEFT";
  table: string;
  alias?: string;
  on: {
    leftTable?: string;
    leftColumn: string;
    rightTable?: string;
    rightColumn: string;
  };
}

export interface AggregateExpression {
  function: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
  column: string;
  alias?: string;
}

export interface OrderByExpression {
  column: string;
  direction: "ASC" | "DESC";
}

export interface ParsedQuery {
  rawSql: string;
  type: QueryType;
  table: string;
  alias?: string;
  columns: string[]; // e.g. ["*"] or ["id", "name"]
  joins?: JoinDefinition[];
  where?: FilterExpression;
  groupBy?: string[];
  aggregates?: AggregateExpression[];
  orderBy?: OrderByExpression[];
  limit?: number;
  insertValues?: Record<string, unknown>;
  updateSet?: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// 4. Logical & Physical Query Plan Models
// ----------------------------------------------------------------------------

export type LogicalOperatorType =
  | "Scan"
  | "Filter"
  | "Project"
  | "Join"
  | "Aggregate"
  | "Sort"
  | "Limit";

export type PhysicalOperatorType =
  | "SeqScan"
  | "IndexScan"
  | "NestedLoopJoin"
  | "HashJoin"
  | "Filter"
  | "Projection"
  | "Sort"
  | "Aggregate"
  | "Limit";

export interface PlanOperatorCost {
  startup: number;
  total: number;
  rowVisits: number;
  indexProbes: number;
  comparisons: number;
  modeledDurationMs: number;
}

export interface PlanOperator {
  id: string;
  logicalOperator: LogicalOperatorType;
  physicalOperator: PhysicalOperatorType;
  tableName?: string;
  indexName?: string;
  estimatedRows: number;
  actualRows: number;
  cost: PlanOperatorCost;
  children: string[];
  description: string;
  predicateExplanation?: string;
  intermediateRows: DatabaseRow[];
}

export interface QueryExecutionPlan {
  id: string;
  queryId: string;
  rootOperatorId: string;
  operators: Record<string, PlanOperator>;
  totalEstimatedCost: number;
  totalActualRows: number;
  totalModeledDurationMs: number;
}

// ----------------------------------------------------------------------------
// 5. Transactions, Locking, MVCC & Deadlocks
// ----------------------------------------------------------------------------

export type IsolationLevel = "read_committed" | "repeatable_read" | "serializable";

export type TransactionStatus = "active" | "waiting" | "committed" | "aborted";

export type LockMode = "shared" | "exclusive";

export interface DatabaseLock {
  id: string;
  transactionId: string;
  resourceId: string; // e.g. "products:42"
  tableName: string;
  mode: LockMode;
  grantedAtMs: number;
}

export interface LockWait {
  transactionId: string;
  resourceId: string;
  requestedMode: LockMode;
  waitingForTransactionId: string;
  waitingSinceMs: number;
}

export interface TransactionOperation {
  id: string;
  type: "BEGIN" | "QUERY" | "COMMIT" | "ROLLBACK";
  query?: string;
  atMs: number;
}

export interface DatabaseTransaction {
  id: string;
  name?: string;
  isolationLevel: IsolationLevel;
  status: TransactionStatus;
  startedAtMs: number;
  completedAtMs?: number;
  readSet: string[];
  writeSet: string[];
  heldLocks: string[];
  waitingForLock?: LockWait;
  operations: TransactionOperation[];
}

export interface DeadlockCycle {
  cycle: string[]; // transaction IDs forming cycle
  selectedVictimTransactionId: string;
  reason: string;
  detectedAtMs: number;
}

// ----------------------------------------------------------------------------
// 6. Primary-Replica Replication
// ----------------------------------------------------------------------------

export type ReplicationRole = "primary" | "read_replica";

export interface ReplicationLogEntry {
  lsn: number;
  transactionId: string;
  tableName: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  rowId: string;
  data: DatabaseRow;
  committedAtMs: number;
}

export interface ReplicaState {
  replicaNodeId: string;
  role: ReplicationRole;
  lastAppliedLsn: number;
  currentLagMs: number;
  pendingChangesCount: number;
  status: "healthy" | "lagging" | "disconnected";
}

// ----------------------------------------------------------------------------
// 7. Connection Pool & Capacity
// ----------------------------------------------------------------------------

export interface ConnectionPoolConfig {
  maxConnections: number;
  activeConnections: number;
  idleConnections: number;
  queueCapacity: number;
  waitingRequestsCount: number;
  timeoutMs: number;
}

// ----------------------------------------------------------------------------
// 8. Full Database Scenario Specification
// ----------------------------------------------------------------------------

export const DatabaseScenarioLimitsSchema = z.object({
  maxRows: z.number().int().min(1).max(50000).default(5000),
  maxEvents: z.number().int().min(10).max(50000).default(5000),
  maxVirtualDurationMs: z.number().int().min(100).max(300000).default(30000),
});
export type DatabaseScenarioLimits = z.infer<typeof DatabaseScenarioLimitsSchema>;

export interface DatabaseScenario {
  version: 1;
  id: string;
  databaseNodeId: string;
  title: string;
  description?: string;
  schema: DatabaseSchema;
  fixtures: Record<string, DatabaseRow[]>;
  primaryQuery: string;
  concurrentTransactions?: DatabaseTransaction[];
  replication?: {
    primaryNodeId: string;
    replicaNodeIds: string[];
    replicationDelayMs: number;
    readPreference: "primary" | "replica" | "round_robin";
  };
  capacity?: ConnectionPoolConfig;
  limits: DatabaseScenarioLimits;
}

// ----------------------------------------------------------------------------
// 9. Runtime State Extensions for Database Simulation
// ----------------------------------------------------------------------------

export interface ModeledDatabaseRuntimeState {
  activeQueryId?: string;
  currentOperatorId?: string;
  tableRows: Record<string, DatabaseRow[]>;
  mvccVersions: Record<string, MVCCRowVersion[]>;
  activeLocks: DatabaseLock[];
  activeLockWaits: LockWait[];
  transactions: Record<string, DatabaseTransaction>;
  deadlocks: DeadlockCycle[];
  replicationLog: ReplicationLogEntry[];
  replicas: Record<string, ReplicaState>;
  connectionPool: ConnectionPoolConfig;
  lastQueryPlan?: QueryExecutionPlan;
  intermediateResults: Record<string, DatabaseRow[]>;
  queryMetrics?: {
    rowsExamined: number;
    rowsReturned: number;
    indexProbes: number;
    totalCost: number;
    durationMs: number;
    lockWaitMs: number;
    isStaleRead?: boolean;
  };
}
