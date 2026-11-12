import type { BaseExecutionEvent } from "../domain/execution-event";
import type {
  PlanOperator,
  QueryExecutionPlan,
  LockMode,
  DatabaseRow,
} from "./database-schemas";

export interface QueryParsedEvent extends BaseExecutionEvent {
  type: "query.parsed";
  queryId: string;
  rawSql: string;
  parsedSummary: string;
}

export interface QueryPlanCreatedEvent extends BaseExecutionEvent {
  type: "query.plan.created";
  queryId: string;
  plan: QueryExecutionPlan;
  rootOperatorId: string;
  totalEstimatedCost: number;
}

export interface QueryOperatorStartedEvent extends BaseExecutionEvent {
  type: "query.operator.started";
  queryId: string;
  operatorId: string;
  operatorType: string;
  tableName?: string;
  indexName?: string;
}

export interface QueryRowExaminedEvent extends BaseExecutionEvent {
  type: "query.row.examined";
  queryId: string;
  operatorId: string;
  tableName: string;
  rowId: string;
  evaluatedPredicate?: string;
  matched: boolean;
}

export interface QueryRowMatchedEvent extends BaseExecutionEvent {
  type: "query.row.matched";
  queryId: string;
  operatorId: string;
  tableName: string;
  row: DatabaseRow;
}

export interface QueryIndexProbedEvent extends BaseExecutionEvent {
  type: "query.index.probed";
  queryId: string;
  operatorId: string;
  indexName: string;
  lookupKey: unknown;
  matchingRowIds: string[];
}

export interface QueryJoinMatchedEvent extends BaseExecutionEvent {
  type: "query.join.matched";
  queryId: string;
  operatorId: string;
  leftRowId: string;
  rightRowId: string;
  joinedRow: DatabaseRow;
}

export interface QueryOperatorCompletedEvent extends BaseExecutionEvent {
  type: "query.operator.completed";
  queryId: string;
  operatorId: string;
  operator: PlanOperator;
  emittedRowCount: number;
}

export interface QueryCompletedEvent extends BaseExecutionEvent {
  type: "query.completed";
  queryId: string;
  returnedRowCount: number;
  totalModeledDurationMs: number;
  isStaleRead?: boolean;
}

export interface QueryFailedEvent extends BaseExecutionEvent {
  type: "query.failed";
  queryId: string;
  reason: string;
  errorCode?: string;
}

export interface LockRequestedEvent extends BaseExecutionEvent {
  type: "lock.requested";
  transactionId: string;
  resourceId: string;
  tableName: string;
  mode: LockMode;
}

export interface LockAcquiredEvent extends BaseExecutionEvent {
  type: "lock.acquired";
  transactionId: string;
  resourceId: string;
  mode: LockMode;
}

export interface LockWaitingEvent extends BaseExecutionEvent {
  type: "lock.waiting";
  transactionId: string;
  resourceId: string;
  mode: LockMode;
  waitingForTransactionId: string;
}

export interface LockReleasedEvent extends BaseExecutionEvent {
  type: "lock.released";
  transactionId: string;
  resourceId: string;
  mode: LockMode;
}

export interface DeadlockDetectedEvent extends BaseExecutionEvent {
  type: "deadlock.detected";
  cycle: string[];
  victimTransactionId: string;
  explanation: string;
}

export interface TransactionStartedEvent extends BaseExecutionEvent {
  type: "transaction.started";
  transactionId: string;
  isolationLevel: string;
}

export interface TransactionCommittedEvent extends BaseExecutionEvent {
  type: "transaction.committed";
  transactionId: string;
  modifiedRowsCount: number;
}

export interface TransactionAbortedEvent extends BaseExecutionEvent {
  type: "transaction.aborted";
  transactionId: string;
  reason: string;
}

export interface ReplicationChangeCreatedEvent extends BaseExecutionEvent {
  type: "replication.change.created";
  primaryNodeId: string;
  lsn: number;
  tableName: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  rowId: string;
}

export interface ReplicationChangeAppliedEvent extends BaseExecutionEvent {
  type: "replication.change.applied";
  replicaNodeId: string;
  lsn: number;
  lagMs: number;
}

export interface ReplicationLagUpdatedEvent extends BaseExecutionEvent {
  type: "replication.lag.updated";
  replicaNodeId: string;
  currentLagMs: number;
  pendingChangesCount: number;
}

export interface ConnectionPoolAcquiredEvent extends BaseExecutionEvent {
  type: "connection.acquired";
  nodeId: string;
  connectionId: string;
  activeCount: number;
}

export interface ConnectionPoolReleasedEvent extends BaseExecutionEvent {
  type: "connection.released";
  nodeId: string;
  connectionId: string;
  activeCount: number;
}

export type DatabaseExecutionEvent =
  | QueryParsedEvent
  | QueryPlanCreatedEvent
  | QueryOperatorStartedEvent
  | QueryRowExaminedEvent
  | QueryRowMatchedEvent
  | QueryIndexProbedEvent
  | QueryJoinMatchedEvent
  | QueryOperatorCompletedEvent
  | QueryCompletedEvent
  | QueryFailedEvent
  | LockRequestedEvent
  | LockAcquiredEvent
  | LockWaitingEvent
  | LockReleasedEvent
  | DeadlockDetectedEvent
  | TransactionStartedEvent
  | TransactionCommittedEvent
  | TransactionAbortedEvent
  | ReplicationChangeCreatedEvent
  | ReplicationChangeAppliedEvent
  | ReplicationLagUpdatedEvent
  | ConnectionPoolAcquiredEvent
  | ConnectionPoolReleasedEvent;
