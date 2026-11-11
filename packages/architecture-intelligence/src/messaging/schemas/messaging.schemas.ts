/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Zod Validation Schemas
 */

import { z } from "zod";

export const MessagingEvidenceSourceSchema = z.enum([
  "modeled",
  "configured",
  "observed",
  "simulated",
  "unknown",
]);

export const MessagingProvenanceSchema = z.object({
  source: MessagingEvidenceSourceSchema,
  sourceIdentifier: z.string().optional(),
  timestamp: z.string(),
  graphRevision: z.string(),
  confirmed: z.boolean(),
  notes: z.string().optional(),
});

export const MessageBrokerTechnologySchema = z.enum([
  "apache_kafka",
  "rabbitmq",
  "aws_sqs",
  "aws_sns",
  "google_pubsub",
  "azure_service_bus",
  "cloudflare_queues",
  "redis_streams",
  "nats_jetstream",
  "custom",
]);

export const DestinationTypeSchema = z.enum([
  "queue",
  "topic",
  "exchange",
  "channel",
  "stream",
]);

export const DeliverySemanticsSchema = z.enum([
  "at_most_once",
  "at_least_once",
  "provider_transactional",
  "unknown",
]);

export const AcknowledgmentModeSchema = z.enum([
  "auto",
  "explicit",
  "negative_ack",
  "visibility_timeout",
  "offset_commit",
  "provider_custom",
]);

export const BackoffStrategySchema = z.enum([
  "exponential",
  "constant",
  "linear",
  "exponential_jitter",
  "fibonacci",
]);

export const OrderingScopeSchema = z.enum([
  "global",
  "partition",
  "message_group",
  "key",
  "unordered",
  "unknown",
]);

export const SagaTypeSchema = z.enum(["choreography", "orchestration"]);

export const MessagingFindingSeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const MessagingFindingCategorySchema = z.enum([
  "poison_message_risk",
  "retry_amplification_storm",
  "unhandled_dead_letter",
  "missing_idempotency",
  "ordering_violation",
  "unbounded_queue_growth",
  "consumer_lag_spike",
  "replay_side_effect_hazard",
  "incomplete_saga_compensation",
  "outbox_dual_write_gap",
  "broker_single_point_of_failure",
  "partition_skew",
  "competing_consumer_hazard",
  "cyclic_event_loop",
]);

export const BrokerCapabilitiesSchema = z.object({
  supportsQueueDelivery: z.boolean(),
  supportsTopicPubSub: z.boolean(),
  supportsConsumerGroups: z.boolean(),
  supportsPartitioning: z.boolean(),
  supportsOrderingKey: z.boolean(),
  supportsMessageRetention: z.boolean(),
  supportsEventReplay: z.boolean(),
  supportsDelayedDelivery: z.boolean(),
  supportsNativeDeadLetter: z.boolean(),
  supportsBrokerDeduplication: z.boolean(),
  supportsTransactions: z.boolean(),
  supportsCompaction: z.boolean(),
  maxRetentionDurationHours: z.number().nonnegative().optional(),
  maxPayloadBytes: z.number().int().positive().optional(),
  provenance: MessagingProvenanceSchema,
});

export const MessagingBrokerSchema = z.object({
  id: z.string(),
  nodeId: z.string().optional(),
  name: z.string(),
  technology: MessageBrokerTechnologySchema,
  clusterMode: z.enum(["standalone", "clustered", "managed_serverless", "multi_region"]),
  isMultiRegion: z.boolean(),
  capabilities: BrokerCapabilitiesSchema,
  provenance: MessagingProvenanceSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const PartitioningConfigSchema = z.object({
  partitionCount: z.number().int().min(1),
  partitionKeyField: z.string().optional(),
  assignmentStrategy: z.enum(["range", "round_robin", "sticky", "cooperative_sticky", "hash", "custom"]),
  rebalanceAssumption: z.enum(["stop_the_world", "cooperative_incremental", "instantaneous"]),
});

export const RetentionConfigSchema = z.object({
  retentionHours: z.number().nonnegative(),
  retentionBytesLimit: z.number().nonnegative().optional(),
  cleanupPolicy: z.enum(["delete", "compact", "compact_delete"]),
  isDurableStorage: z.boolean(),
  archivalTarget: z.string().optional(),
});

export const MessagingDestinationSchema = z.object({
  id: z.string(),
  nodeId: z.string().optional(),
  brokerId: z.string(),
  name: z.string(),
  type: DestinationTypeSchema,
  eventContractIds: z.array(z.string()),
  deliverySemantics: DeliverySemanticsSchema,
  orderingScope: OrderingScopeSchema,
  partitioning: PartitioningConfigSchema.optional(),
  retention: RetentionConfigSchema,
  deadLetterDestinationId: z.string().optional(),
  maxDeliveryAttemptsBeforeDeadLetter: z.number().int().min(1).optional(),
  visibilityTimeoutSeconds: z.number().int().positive().optional(),
  timeToLiveSeconds: z.number().int().positive().optional(),
  provenance: MessagingProvenanceSchema,
});

export const RetryPolicySchema = z.object({
  maxAttempts: z.number().int().nonnegative(),
  initialDelayMs: z.number().int().nonnegative(),
  maxDelayMs: z.number().int().nonnegative(),
  backoffStrategy: BackoffStrategySchema,
  jitterPct: z.number().min(0).max(100),
  retryableErrorCodes: z.array(z.string()).optional(),
  retryDestinationId: z.string().optional(),
  fatalErrorCodes: z.array(z.string()).optional(),
});

export const IdempotencyConfigSchema = z.object({
  isConfigured: z.boolean(),
  idempotencyKeyField: z.string().optional(),
  deduplicationStore: z.enum(["redis", "database_table", "in_memory", "broker_native", "none"]),
  windowSeconds: z.number().int().positive().optional(),
  scope: z.enum(["handler", "consumer_service", "distributed"]),
  provenance: MessagingProvenanceSchema,
});

export const MessagingProducerSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  destinationId: z.string(),
  eventTypesPublished: z.array(z.string()),
  publicationRateRps: z.number().nonnegative().optional(),
  usesTransactionalOutbox: z.boolean(),
  outboxTableName: z.string().optional(),
  deliveryGuarantee: z.enum(["at_least_once_outbox", "fire_and_forget", "two_phase_commit", "unreliable"]),
  provenance: MessagingProvenanceSchema,
});

export const MessagingConsumerSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  destinationId: z.string(),
  consumerGroupId: z.string().optional(),
  workerConcurrency: z.number().int().min(1),
  eventTypesConsumed: z.array(z.string()),
  avgProcessingTimeMs: z.number().nonnegative(),
  ackMode: AcknowledgmentModeSchema,
  retryPolicy: RetryPolicySchema,
  idempotency: IdempotencyConfigSchema,
  usesInboxDeduplication: z.boolean(),
  inboxTableName: z.string().optional(),
  hasSideEffects: z.boolean(),
  sideEffectTypes: z.array(
    z.enum(["payment_charge", "email_sms_notification", "external_webhook", "inventory_mutation"])
  ).optional(),
  provenance: MessagingProvenanceSchema,
});

export const ConsumerGroupSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  destinationId: z.string(),
  consumerServiceIds: z.array(z.string()),
  activeWorkersCount: z.number().int().min(1),
  maxWorkersScaleLimit: z.number().int().min(1).optional(),
  lagMetrics: z
    .object({
      messageCountLag: z.number().nonnegative(),
      timeLagSeconds: z.number().nonnegative(),
      oldestMessageAgeSeconds: z.number().nonnegative(),
      isEstimated: z.boolean(),
    })
    .optional(),
  provenance: MessagingProvenanceSchema,
});

export const MessagingRelationshipSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  destinationId: z.string(),
  kind: z.enum([
    "publishes_to",
    "consumes_from",
    "dead_letter_routes_to",
    "retry_routes_to",
    "replays_from",
  ]),
  provenance: MessagingProvenanceSchema,
});

export const MessagingFindingSchema = z.object({
  id: z.string(),
  category: MessagingFindingCategorySchema,
  severity: MessagingFindingSeveritySchema,
  affectedBrokerId: z.string().optional(),
  affectedDestinationId: z.string().optional(),
  affectedProducerId: z.string().optional(),
  affectedConsumerId: z.string().optional(),
  title: z.string(),
  explanation: z.string(),
  evidence: z.array(z.string()),
  riskAnalysis: z.string(),
  remediation: z.string(),
  deterministicCalculation: z
    .object({
      metricName: z.string(),
      value: z.number(),
      threshold: z.number(),
      formula: z.string(),
    })
    .optional(),
});

export const SagaStateTransitionSchema = z.object({
  fromState: z.string(),
  toState: z.string(),
  triggerEvent: z.string(),
  actionServiceId: z.string(),
  isCompensating: z.boolean(),
  compensationAction: z.string().optional(),
  timeoutSeconds: z.number().positive().optional(),
});

export const SagaWorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: SagaTypeSchema,
  orchestratorServiceId: z.string().optional(),
  initiatingEventType: z.string(),
  states: z.array(z.string()),
  initialState: z.string(),
  terminalSuccessStates: z.array(z.string()),
  terminalFailureStates: z.array(z.string()),
  transitions: z.array(SagaStateTransitionSchema),
  consistencyAnalysis: z.object({
    isFullyCompensated: z.boolean(),
    uncompensatedStates: z.array(z.string()),
    potentialOrphanedStates: z.array(z.string()),
    riskSummary: z.string(),
  }),
  provenance: MessagingProvenanceSchema,
});

export const MessagingTopologySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  architectureId: z.string(),
  graphRevision: z.string(),
  version: z.number().int().min(1),
  brokers: z.array(MessagingBrokerSchema),
  destinations: z.array(MessagingDestinationSchema),
  producers: z.array(MessagingProducerSchema),
  consumers: z.array(MessagingConsumerSchema),
  consumerGroups: z.array(ConsumerGroupSchema),
  relationships: z.array(MessagingRelationshipSchema),
  sagas: z.array(SagaWorkflowSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
