import { z } from "zod";

export const TransactionProtocolSchema = z.enum([
  "two_phase_commit",
  "saga_orchestration",
  "saga_choreography",
]);
export type TransactionProtocol = z.infer<typeof TransactionProtocolSchema>;

export const LocalOperationKindSchema = z.enum([
  "RESERVE_INVENTORY",
  "RELEASE_INVENTORY",
  "HOLD_PAYMENT",
  "CAPTURE_PAYMENT",
  "VOID_PAYMENT",
  "REFUND_PAYMENT",
  "CREATE_ORDER",
  "CONFIRM_ORDER",
  "CANCEL_ORDER",
  "SCHEDULE_SHIPMENT",
  "CANCEL_SHIPMENT",
]);
export type LocalOperationKind = z.infer<typeof LocalOperationKindSchema>;

export const LocalOperationSchema = z.object({
  id: z.string().min(1),
  kind: LocalOperationKindSchema,
  resourceKey: z.string().min(1),
  amount: z.number().nonnegative().default(1),
  reversible: z.enum(["reversible", "conditionally_reversible", "irreversible"]).default("reversible"),
  forceOutcome: z
    .enum([
      "auto",
      "vote_no_insufficient",
      "step_fail",
      "step_timeout",
      "storage_error",
      "compensation_fail_irreversible",
      "compensation_fail_unavailable",
    ])
    .default("auto"),
});
export type LocalOperation = z.infer<typeof LocalOperationSchema>;

export const ParticipantInitialStoreSchema = z.object({
  inventory: z.record(z.string(), z.number().int().nonnegative()).default({}),
  balances: z.record(z.string(), z.number().nonnegative()).default({}),
  orders: z.record(z.string(), z.string()).default({}),
  shipments: z.record(z.string(), z.string()).default({}),
  reservations: z.record(z.string(), z.number().int().nonnegative()).default({}),
});
export type ParticipantInitialStore = z.infer<typeof ParticipantInitialStoreSchema>;

export const TransactionParticipantConfigSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  label: z.string().min(1),
  online: z.boolean().default(true),
  idempotencyEnabled: z.boolean().default(true),
  outboxEnabled: z.boolean().default(true),
  inboxEnabled: z.boolean().default(true),
  initialStore: ParticipantInitialStoreSchema.default({}),
});
export type TransactionParticipantConfig = z.infer<typeof TransactionParticipantConfigSchema>;

export const TxRetryPolicySchema = z.object({
  enabled: z.boolean().default(true),
  maxAttempts: z.number().int().min(1).max(6).default(3),
  backoffType: z.enum(["fixed", "exponential"]).default("exponential"),
  baseDelayMs: z.number().int().min(10).max(5000).default(60),
  jitterRatio: z.number().min(0).max(0.5).default(0.1),
  overallDeadlineMs: z.number().int().min(50).max(20000).default(3000),
});
export type TxRetryPolicy = z.infer<typeof TxRetryPolicySchema>;

// 2PC Workflow
export const TwoPCParticipantStepSchema = z.object({
  participantId: z.string().min(1),
  operation: LocalOperationSchema,
  required: z.boolean().default(true),
});

export const TwoPCTransactionItemSchema = z.object({
  transactionId: z.string().min(1),
  atMs: z.number().int().nonnegative().default(0),
  prepareTimeoutMs: z.number().int().min(40).max(10000).default(240),
  coordinatorId: z.string().default("tx-coordinator"),
  steps: z.array(TwoPCParticipantStepSchema).min(1).max(10),
});

export const TwoPCWorkflowConfigSchema = z.object({
  protocol: z.literal("two_phase_commit"),
  transactions: z.array(TwoPCTransactionItemSchema).min(1).max(10),
});
export type TwoPCWorkflowConfig = z.infer<typeof TwoPCWorkflowConfigSchema>;

// Saga Orchestration Workflow
export const SagaStepDefinitionSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  participantId: z.string().min(1),
  label: z.string().min(1),
  operation: LocalOperationSchema,
  compensation: LocalOperationSchema.optional(),
  retryPolicy: TxRetryPolicySchema.default({}),
  timeoutMs: z.number().int().min(30).max(10000).default(220),
  dependsOn: z.array(z.string()).default([]),
});
export type SagaStepDefinition = z.infer<typeof SagaStepDefinitionSchema>;

export const SagaOrchestrationWorkflowSchema = z.object({
  protocol: z.literal("saga_orchestration"),
  sagaId: z.string().min(1).default("saga-1"),
  workflowVersion: z.number().int().min(1).default(1),
  failurePolicy: z.enum(["backward_recovery", "fail_fast"]).default("backward_recovery"),
  steps: z.array(SagaStepDefinitionSchema).min(1).max(12),
});
export type SagaOrchestrationWorkflow = z.infer<typeof SagaOrchestrationWorkflowSchema>;

// Saga Choreography Workflow
export const ChoreographySubscriptionSchema = z.object({
  id: z.string().min(1),
  participantId: z.string().min(1),
  consumesEvent: z.string().min(1),
  operation: LocalOperationSchema,
  emitsOnSuccess: z.string().min(1),
  emitsOnFailure: z.string().optional(),
  compensation: LocalOperationSchema.optional(),
  emitsCompensationEvent: z.string().optional(),
  retryPolicy: TxRetryPolicySchema.default({}),
});
export type ChoreographySubscription = z.infer<typeof ChoreographySubscriptionSchema>;

export const SagaChoreographyWorkflowSchema = z.object({
  protocol: z.literal("saga_choreography"),
  sagaId: z.string().min(1).default("saga-choreo-1"),
  workflowVersion: z.number().int().min(1).default(1),
  initialEvent: z.object({
    eventType: z.string().min(1),
    producer: z.string().min(1),
    aggregateId: z.string().min(1),
  }),
  subscriptions: z.array(ChoreographySubscriptionSchema).min(1).max(20),
});
export type SagaChoreographyWorkflow = z.infer<typeof SagaChoreographyWorkflowSchema>;

export const TransactionWorkflowConfigSchema = z.discriminatedUnion("protocol", [
  TwoPCWorkflowConfigSchema,
  SagaOrchestrationWorkflowSchema,
  SagaChoreographyWorkflowSchema,
]);
export type TransactionWorkflowConfig = z.infer<typeof TransactionWorkflowConfigSchema>;

export const TransactionNetworkConfigSchema = z.object({
  baseLatencyMs: z.number().int().min(5).max(1000).default(20),
  jitterMs: z.number().int().min(0).max(200).default(4),
  packetLossProbability: z.number().min(0).max(1).default(0),
  duplicateProbability: z.number().min(0).max(1).default(0),
});

export const TransactionFaultConfigSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "coordinator_crash",
    "coordinator_restart",
    "participant_crash",
    "participant_restart",
    "network_partition",
    "partition_heal",
    "drop_next_rpc",
    "duplicate_next_message",
    "outbox_dispatcher_fail",
    "outbox_dispatcher_recover",
    "storage_failure",
  ]),
  targetId: z.string().min(1),
  atMs: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative().optional(),
  partitionGroups: z.array(z.array(z.string())).optional(),
  description: z.string().default(""),
});
export type TransactionFaultConfig = z.infer<typeof TransactionFaultConfigSchema>;

export const TransactionLimitsSchema = z.object({
  maxParticipants: z.number().int().min(1).max(12).default(10),
  maxTransactions: z.number().int().min(1).max(50).default(20),
  maxEvents: z.number().int().min(20).max(2500).default(800),
  maxVirtualDurationMs: z.number().int().min(100).max(30000).default(5000),
  maxRetriesPerStep: z.number().int().min(1).max(6).default(4),
});

export const DistributedTransactionScenarioSchema = z
  .object({
    version: z.literal(1).default(1),
    id: z.string().min(1),
    presetId: z.string().optional(),
    name: z.string().min(1),
    description: z.string().default(""),
    architectureRevisionId: z.string().default("rev_tx_001"),
    seed: z.number().int().default(42),
    protocol: TransactionProtocolSchema,
    participants: z.array(TransactionParticipantConfigSchema).min(1).max(10),
    workflow: TransactionWorkflowConfigSchema,
    network: TransactionNetworkConfigSchema.default({}),
    failures: z.array(TransactionFaultConfigSchema).default([]),
    limits: TransactionLimitsSchema.default({}),
  })
  .superRefine((val, ctx) => {
    if (val.protocol !== val.workflow.protocol) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Protocol '${val.protocol}' does not match workflow protocol '${val.workflow.protocol}'`,
      });
    }
    const pIds = new Set(val.participants.map((p) => p.id));
    if (pIds.size !== val.participants.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Participant IDs must be unique",
      });
    }
    if (val.workflow.protocol === "saga_orchestration") {
      const stepMap = new Map(val.workflow.steps.map((s) => [s.id, s]));
      for (const s of val.workflow.steps) {
        if (!pIds.has(s.participantId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unknown participantId '${s.participantId}' in step '${s.id}'`,
          });
        }
        for (const dep of s.dependsOn) {
          if (!stepMap.has(dep)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Unknown dependency '${dep}' in step '${s.id}'`,
            });
          }
        }
      }
      // Reject cycles via DFS
      const visited = new Set<string>();
      const visiting = new Set<string>();
      const hasCycle = (id: string): boolean => {
        if (visiting.has(id)) return true;
        if (visited.has(id)) return false;
        visiting.add(id);
        const node = stepMap.get(id);
        if (node) {
          for (const dep of node.dependsOn) {
            if (hasCycle(dep)) return true;
          }
        }
        visiting.delete(id);
        visited.add(id);
        return false;
      };
      for (const s of val.workflow.steps) {
        if (hasCycle(s.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Cyclic dependency detected involving step '${s.id}'`,
          });
        }
      }
    }
  });

export type DistributedTransactionScenario = z.infer<
  typeof DistributedTransactionScenarioSchema
>;

// ========================
// Runtime State Contracts
// ========================

export type CoordinatorState =
  | "INITIALIZING"
  | "PREPARING"
  | "WAITING_FOR_VOTES"
  | "DECIDED_COMMIT"
  | "DECIDED_ABORT"
  | "NOTIFYING_PARTICIPANTS"
  | "COMPLETED"
  | "RECOVERING";

export type ParticipantLocalTxState =
  | "IDLE"
  | "PREPARING"
  | "PREPARED"
  | "COMMITTED"
  | "ABORTED"
  | "RECOVERING";

export type TwoPCMessageType =
  | "PREPARE"
  | "VOTE_YES"
  | "VOTE_NO"
  | "GLOBAL_COMMIT"
  | "GLOBAL_ABORT"
  | "DECISION_ACK"
  | "DECISION_QUERY"
  | "DECISION_RESPONSE";

export interface DurableLogRecord {
  seq: number;
  atMs: number;
  role: "coordinator" | "participant";
  ownerId: string;
  transactionId: string;
  recordType:
    | "TX_BEGIN"
    | "PARTICIPANT_ENLISTED"
    | "PREPARE_SENT"
    | "PARTICIPANT_PREPARED"
    | "VOTE_RECEIVED"
    | "GLOBAL_COMMIT"
    | "GLOBAL_ABORT"
    | "PARTICIPANT_COMMITTED"
    | "PARTICIPANT_ABORTED"
    | "TX_COMPLETED";
  detail: string;
  durable: boolean;
}

export interface LockRecord {
  id: string;
  resourceKey: string;
  ownerTxId: string;
  participantId: string;
  acquiredAtMs: number;
  releasedAtMs: number | null;
  waiters: string[];
  blockingReason?: string;
}

export interface IdempotencyRecord {
  operationId: string;
  participantId: string;
  status: "in_progress" | "completed" | "failed";
  resultSummary: string;
  recordedAtMs: number;
}

export interface OutboxRecord {
  id: string;
  participantId: string;
  transactionId: string;
  eventType: string;
  payloadSummary: string;
  createdAtMs: number;
  status:
    | "OUTBOX_RECORD_CREATED"
    | "OUTBOX_DISPATCH_STARTED"
    | "OUTBOX_MESSAGE_PUBLISHED"
    | "OUTBOX_DISPATCH_FAILED"
    | "OUTBOX_RETRY_SCHEDULED";
  attempts: number;
}

export interface InboxRecord {
  messageId: string;
  consumerId: string;
  eventType: string;
  processedAtMs: number;
  duplicateCount: number;
}

export interface TransactionMessageEnvelope {
  id: string;
  transactionId: string;
  from: string;
  to: string;
  messageType: string;
  sentAtMs: number;
  deliverAtMs: number;
  status: "in_flight" | "delivered" | "dropped";
  dropReason?: string;
  isDuplicate?: boolean;
  correlationId: string;
  causationId: string;
}

export interface TwoPCTransactionRuntime {
  transactionId: string;
  coordinatorId: string;
  coordinatorOnline: boolean;
  state: CoordinatorState;
  startedAtMs: number;
  completedAtMs: number | null;
  enlistedParticipants: string[];
  votes: Record<string, "YES" | "NO" | "PENDING">;
  acks: Record<string, boolean>;
  decision: "COMMIT" | "ABORT" | null;
  decisionReason: string;
  inDoubtParticipants: string[];
  blockedWaiters: string[];
}

export type SagaInstanceState =
  | "CREATED"
  | "RUNNING"
  | "WAITING"
  | "COMPENSATING"
  | "COMPLETED"
  | "COMPENSATED"
  | "COMPENSATION_FAILED"
  | "MANUAL_INTERVENTION_REQUIRED";

export type SagaStepRuntimeState =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "COMPENSATION_PENDING"
  | "COMPENSATING"
  | "COMPENSATED"
  | "COMPENSATION_FAILED";

export interface SagaStepExecutionState {
  stepId: string;
  participantId: string;
  label: string;
  status: SagaStepRuntimeState;
  attempts: number;
  startedAtMs: number | null;
  finishedAtMs: number | null;
  lastError?: string;
  compensationStatus?: "none" | "pending" | "compensating" | "compensated" | "failed";
  compensationError?: string;
  dependsOn: string[];
}

export interface SagaRuntime {
  sagaId: string;
  workflowVersion: number;
  mode: "orchestration" | "choreography";
  state: SagaInstanceState;
  startedAtMs: number;
  completedAtMs: number | null;
  steps: SagaStepExecutionState[];
  compensationOrder: string[];
  failureChain: string[];
  partialCompletionSummary: string;
}

export interface TransactionParticipantRuntime {
  id: string;
  serviceId: string;
  label: string;
  online: boolean;
  outboxDispatcherHealthy: boolean;
  storageHealthy: boolean;
  localTxStates: Record<string, ParticipantLocalTxState>;
  inDoubtTxIds: string[];
  stagedOperations: Record<string, { operationId: string; summary: string }>;
  store: ParticipantInitialStore;
  heldLocks: string[];
  durableLog: DurableLogRecord[];
}

export interface TransactionInvariantReport {
  allPassed: boolean;
  noCommitWithoutAllYesOk: boolean;
  durableDecisionImmutableOk: boolean;
  noSplitCommitAbortOk: boolean;
  preparedSurvivesCrashOk: boolean;
  noUnknownDecisionInventedOk: boolean;
  locksReleasedAfterTerminalOk: boolean;
  idempotencyPreservedOk: boolean;
  compensationMatchesCompletedOk: boolean;
  compensationFailureVisibleOk: boolean;
  violations: string[];
}

export interface DistributedTransactionMetrics {
  protocol: TransactionProtocol;
  transactionsStarted: number;
  transactionsCommitted: number;
  transactionsAborted: number;
  inDoubtCount: number;
  blockedCount: number;
  lockHoldingTotalMs: number;
  blockingTotalMs: number;
  commitLatencyMs: number;
  sagaCompletionTimeMs: number;
  compensationCount: number;
  compensationFailures: number;
  manualInterventionCount: number;
  retryCount: number;
  duplicateDeliveries: number;
  deduplicatedCount: number;
  outboxPublishedCount: number;
  outboxFailedCount: number;
}

export interface ModeledDistributedTransactionRuntimeState {
  virtualTimeMs: number;
  protocol: TransactionProtocol;
  coordinatorOnline: boolean;
  activePartitions: string[][];
  participants: Record<string, TransactionParticipantRuntime>;
  twoPCTransactions: Record<string, TwoPCTransactionRuntime>;
  saga: SagaRuntime | null;
  locks: LockRecord[];
  durableLogs: DurableLogRecord[];
  messages: TransactionMessageEnvelope[];
  outboxRecords: OutboxRecord[];
  inboxRecords: InboxRecord[];
  idempotencyRecords: IdempotencyRecord[];
  failurePropagationChain: string[];
  invariants: TransactionInvariantReport;
  metrics: DistributedTransactionMetrics;
}
