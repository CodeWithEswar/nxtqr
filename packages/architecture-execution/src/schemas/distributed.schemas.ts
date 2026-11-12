import { z } from "zod";

// ============================================================================
// 1. Distributed Tracing & Spans
// ============================================================================

export const TraceSpanStatusSchema = z.enum(["running", "success", "error"]);
export type TraceSpanStatus = z.infer<typeof TraceSpanStatusSchema>;

export const TraceContextSchema = z.object({
  requestId: z.string(),
  correlationId: z.string(),
  traceId: z.string(),
  spanId: z.string(),
  parentSpanId: z.string().optional(),
  branchId: z.string(),
});
export type TraceContext = z.infer<typeof TraceContextSchema>;

export const TraceSpanSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  parentSpanId: z.string().optional(),
  name: z.string(),
  componentId: z.string(),
  componentLabel: z.string().optional(),
  startMs: z.number(),
  endMs: z.number().optional(),
  durationMs: z.number().optional(),
  status: TraceSpanStatusSchema,
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])),
  isCriticalPath: z.boolean().optional(),
  branchId: z.string(),
  causedByEventId: z.string().optional(),
});
export type TraceSpan = z.infer<typeof TraceSpanSchema>;

// ============================================================================
// 2. Parallel Execution & Logical Branches
// ============================================================================

export const BranchStatusSchema = z.enum(["active", "waiting", "completed", "failed", "cancelled"]);
export type BranchStatus = z.infer<typeof BranchStatusSchema>;

export const ExecutionBranchSchema = z.object({
  id: z.string(),
  parentBranchId: z.string().optional(),
  name: z.string(),
  originNodeId: z.string(),
  targetNodeId: z.string(),
  startedAtMs: z.number(),
  completedAtMs: z.number().optional(),
  status: BranchStatusSchema,
  spanId: z.string(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type ExecutionBranch = z.infer<typeof ExecutionBranchSchema>;

export const FanInPolicySchema = z.enum(["all", "any", "first-success"]);
export type FanInPolicy = z.infer<typeof FanInPolicySchema>;

export const FanInBarrierSchema = z.object({
  barrierId: z.string(),
  parentBranchId: z.string(),
  waitingNodeId: z.string(),
  policy: FanInPolicySchema,
  expectedBranchIds: z.array(z.string()),
  completedBranchIds: z.array(z.string()),
  failedBranchIds: z.array(z.string()),
  status: z.enum(["waiting", "satisfied", "failed"]),
  resolvedAtMs: z.number().optional(),
  timeoutMs: z.number().optional(),
});
export type FanInBarrier = z.infer<typeof FanInBarrierSchema>;

// ============================================================================
// 3. Asynchronous Messaging & Queues
// ============================================================================

export const MessageStatusSchema = z.enum([
  "created",
  "queued",
  "in-flight",
  "acknowledged",
  "retry-pending",
  "dead-lettered",
]);
export type MessageStatus = z.infer<typeof MessageStatusSchema>;

export const ModeledMessageSchema = z.object({
  id: z.string(),
  correlationId: z.string(),
  traceContext: TraceContextSchema,
  producerNodeId: z.string(),
  destinationQueueId: z.string(),
  payload: z.unknown(),
  createdAtMs: z.number(),
  deliveredAtMs: z.number().optional(),
  attempt: z.number().default(1),
  maxAttempts: z.number().default(3),
  status: MessageStatusSchema,
  consumerNodeId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  error: z.string().optional(),
  acknowledgedAtMs: z.number().optional(),
  retryAtMs: z.number().optional(),
});
export type ModeledMessage = z.infer<typeof ModeledMessageSchema>;

export const QueueDeliveryModeSchema = z.enum(["competing-workers", "pub-sub"]);
export type QueueDeliveryMode = z.infer<typeof QueueDeliveryModeSchema>;

export const ModeledQueueConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodeId: z.string(),
  capacity: z.number().default(100),
  deliveryMode: QueueDeliveryModeSchema.default("competing-workers"),
  deadLetterQueueId: z.string().optional(),
  subscriberNodeIds: z.array(z.string()).default([]),
  consumerConcurrency: z.number().default(2),
  processingDurationMs: z.number().default(120),
  retryDelayMs: z.number().default(200),
  maxRetries: z.number().default(3),
});
export type ModeledQueueConfig = z.infer<typeof ModeledQueueConfigSchema>;

export const ModeledQueueStateSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  name: z.string(),
  capacity: z.number(),
  readyMessageIds: z.array(z.string()),
  inFlightMessageIds: z.array(z.string()),
  acknowledgedMessageIds: z.array(z.string()),
  deadLetteredMessageIds: z.array(z.string()),
  deadLetterQueueId: z.string().optional(),
  activeConsumerCount: z.number(),
});
export type ModeledQueueState = z.infer<typeof ModeledQueueStateSchema>;

// ============================================================================
// 4. Distributed Scenario & Configuration
// ============================================================================

export const DistributedScenarioPresetIdSchema = z.enum([
  "parallel-fanout",
  "async-queue-workers",
  "message-retry-dlq",
  "fanin-partial-failure",
  "custom-distributed",
]);
export type DistributedScenarioPresetId = z.infer<typeof DistributedScenarioPresetIdSchema>;

export const DistributedScenarioConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  presetId: DistributedScenarioPresetIdSchema,
  entryNodeId: z.string(),
  entryRequest: z.object({
    method: z.string().default("POST"),
    path: z.string().default("/api/v1/orders"),
    body: z.unknown().optional(),
    headers: z.record(z.string()).default({}),
  }),
  parallelBranches: z.array(
    z.object({
      id: z.string(),
      targetNodeId: z.string(),
      operation: z.string(),
      durationMs: z.number(),
      edgeId: z.string().optional(),
      willFail: z.boolean().default(false),
      errorMessage: z.string().optional(),
    })
  ).default([]),
  fanInPolicy: FanInPolicySchema.default("all"),
  fanInNodeId: z.string().optional(),
  queues: z.array(ModeledQueueConfigSchema).default([]),
  messagesToPublish: z.array(
    z.object({
      producerNodeId: z.string(),
      destinationQueueId: z.string(),
      delayMs: z.number().default(0),
      payload: z.unknown(),
      idempotencyKey: z.string().optional(),
      willFailOnAttempt: z.number().optional(),
      failError: z.string().optional(),
    })
  ).default([]),
});
export type DistributedScenarioConfig = z.infer<typeof DistributedScenarioConfigSchema>;
