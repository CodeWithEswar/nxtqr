/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Domain Contracts & Types
 */

/**
 * Strict 5-tier evidence segregation for messaging intelligence.
 */
export type MessagingEvidenceSource =
  | "modeled"    // Behavior derived from architecture design & assumptions
  | "configured" // Explicitly specified in provider configuration, IAC, or imported spec
  | "observed"   // Confirmed by authorized runtime telemetry (OpenTelemetry, broker metrics)
  | "simulated"  // Produced by virtual-clock deterministic failure simulation
  | "unknown";   // Cannot be reliably determined from available evidence

export interface MessagingProvenance {
  source: MessagingEvidenceSource;
  sourceIdentifier?: string;
  timestamp: string;
  graphRevision: string;
  confirmed: boolean;
  notes?: string;
}

export type MessageBrokerTechnology =
  | "apache_kafka"
  | "rabbitmq"
  | "aws_sqs"
  | "aws_sns"
  | "google_pubsub"
  | "azure_service_bus"
  | "cloudflare_queues"
  | "redis_streams"
  | "nats_jetstream"
  | "custom";

export type DestinationType = "queue" | "topic" | "exchange" | "channel" | "stream";

export type DeliverySemantics =
  | "at_most_once"
  | "at_least_once"
  | "provider_transactional"
  | "unknown";

export type AcknowledgmentMode =
  | "auto"
  | "explicit"
  | "negative_ack"
  | "visibility_timeout"
  | "offset_commit"
  | "provider_custom";

export type BackoffStrategy =
  | "exponential"
  | "constant"
  | "linear"
  | "exponential_jitter"
  | "fibonacci";

export type OrderingScope =
  | "global"
  | "partition"
  | "message_group"
  | "key"
  | "unordered"
  | "unknown";

export type SagaType = "choreography" | "orchestration";

export type MessagingFindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type MessagingFindingCategory =
  | "poison_message_risk"
  | "retry_amplification_storm"
  | "unhandled_dead_letter"
  | "missing_idempotency"
  | "ordering_violation"
  | "unbounded_queue_growth"
  | "consumer_lag_spike"
  | "replay_side_effect_hazard"
  | "incomplete_saga_compensation"
  | "outbox_dual_write_gap"
  | "broker_single_point_of_failure"
  | "partition_skew"
  | "competing_consumer_hazard"
  | "cyclic_event_loop";

/**
 * Provider-neutral broker capabilities.
 */
export interface BrokerCapabilities {
  supportsQueueDelivery: boolean;
  supportsTopicPubSub: boolean;
  supportsConsumerGroups: boolean;
  supportsPartitioning: boolean;
  supportsOrderingKey: boolean;
  supportsMessageRetention: boolean;
  supportsEventReplay: boolean;
  supportsDelayedDelivery: boolean;
  supportsNativeDeadLetter: boolean;
  supportsBrokerDeduplication: boolean;
  supportsTransactions: boolean;
  supportsCompaction: boolean;
  maxRetentionDurationHours?: number;
  maxPayloadBytes?: number;
  provenance: MessagingProvenance;
}

export interface MessagingBroker {
  id: string; // Architecture Node ID or sub-resource ID
  nodeId?: string; // Link to graph node
  name: string;
  technology: MessageBrokerTechnology;
  clusterMode: "standalone" | "clustered" | "managed_serverless" | "multi_region";
  isMultiRegion: boolean;
  capabilities: BrokerCapabilities;
  provenance: MessagingProvenance;
  metadata?: Record<string, unknown>;
}

export interface PartitioningConfig {
  partitionCount: number;
  partitionKeyField?: string;
  assignmentStrategy: "range" | "round_robin" | "sticky" | "cooperative_sticky" | "hash" | "custom";
  rebalanceAssumption: "stop_the_world" | "cooperative_incremental" | "instantaneous";
}

export interface RetentionConfig {
  retentionHours: number;
  retentionBytesLimit?: number;
  cleanupPolicy: "delete" | "compact" | "compact_delete";
  isDurableStorage: boolean;
  archivalTarget?: string;
}

export interface MessagingDestination {
  id: string; // Graph Node ID or Topic/Queue ID
  nodeId?: string;
  brokerId: string;
  name: string;
  type: DestinationType;
  eventContractIds: string[]; // Linked Phase 05.3.20 contract IDs
  deliverySemantics: DeliverySemantics;
  orderingScope: OrderingScope;
  partitioning?: PartitioningConfig;
  retention: RetentionConfig;
  deadLetterDestinationId?: string;
  maxDeliveryAttemptsBeforeDeadLetter?: number;
  visibilityTimeoutSeconds?: number;
  timeToLiveSeconds?: number;
  provenance: MessagingProvenance;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffStrategy: BackoffStrategy;
  jitterPct: number; // 0 - 100
  retryableErrorCodes?: string[];
  retryDestinationId?: string; // e.g. dedicated retry topic/queue
  fatalErrorCodes?: string[];
}

export interface IdempotencyConfig {
  isConfigured: boolean;
  idempotencyKeyField?: string;
  deduplicationStore: "redis" | "database_table" | "in_memory" | "broker_native" | "none";
  windowSeconds?: number;
  scope: "handler" | "consumer_service" | "distributed";
  provenance: MessagingProvenance;
}

export interface MessagingProducer {
  id: string;
  serviceId: string; // Graph Node ID of producer service
  destinationId: string;
  eventTypesPublished: string[];
  publicationRateRps?: number;
  usesTransactionalOutbox: boolean;
  outboxTableName?: string;
  deliveryGuarantee: "at_least_once_outbox" | "fire_and_forget" | "two_phase_commit" | "unreliable";
  provenance: MessagingProvenance;
}

export interface MessagingConsumer {
  id: string;
  serviceId: string; // Graph Node ID of consumer service
  destinationId: string;
  consumerGroupId?: string;
  workerConcurrency: number;
  eventTypesConsumed: string[];
  avgProcessingTimeMs: number;
  ackMode: AcknowledgmentMode;
  retryPolicy: RetryPolicy;
  idempotency: IdempotencyConfig;
  usesInboxDeduplication: boolean;
  inboxTableName?: string;
  hasSideEffects: boolean;
  sideEffectTypes?: Array<"payment_charge" | "email_sms_notification" | "external_webhook" | "inventory_mutation">;
  provenance: MessagingProvenance;
}

export interface ConsumerGroup {
  id: string;
  groupId: string;
  destinationId: string;
  consumerServiceIds: string[];
  activeWorkersCount: number;
  maxWorkersScaleLimit?: number;
  lagMetrics?: {
    messageCountLag: number;
    timeLagSeconds: number;
    oldestMessageAgeSeconds: number;
    isEstimated: boolean;
  };
  provenance: MessagingProvenance;
}

export interface MessagingRelationship {
  id: string;
  sourceId: string;
  destinationId: string;
  kind: "publishes_to" | "consumes_from" | "dead_letter_routes_to" | "retry_routes_to" | "replays_from";
  provenance: MessagingProvenance;
}

export interface MessagingFinding {
  id: string;
  category: MessagingFindingCategory;
  severity: MessagingFindingSeverity;
  affectedBrokerId?: string;
  affectedDestinationId?: string;
  affectedProducerId?: string;
  affectedConsumerId?: string;
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

export interface RetryStormEvaluation {
  destinationId: string;
  producerArrivalRps: number;
  consumerFailureRatePct: number;
  maxRetryAttempts: number;
  estimatedRetryMultiplier: number;
  peakRpsUnderFailure: number;
  downstreamSaturationRatio: number;
  isStormRisk: boolean;
  explanation: string;
}

export interface QueueBacklogProjection {
  destinationId: string;
  arrivalRateRps: number;
  effectiveProcessingRateRps: number;
  netBacklogChangePerSecond: number; // positive = accumulating backlog
  projectedTimeToExhaustionSeconds?: number;
  projectedTimeToStorageLimitHours?: number;
  isUnboundedGrowth: boolean;
  explanation: string;
}

export interface ReplaySafetyEvaluation {
  destinationId: string;
  consumerId: string;
  isSafeForReplay: boolean;
  hazards: Array<{
    type: "duplicate_payments" | "duplicate_external_api" | "stale_state_override" | "unbounded_notifications";
    severity: "critical" | "high" | "medium";
    description: string;
  }>;
  requiredSafeguards: string[];
}

export interface EventFlowPathNode {
  type: "producer" | "destination" | "consumer" | "dead_letter" | "retry_queue" | "follow_up_event";
  id: string;
  name: string;
  serviceId?: string;
  status: "healthy" | "retry" | "dead_letter" | "hazard";
}

export interface EventFlowTrace {
  id: string;
  rootEventType: string;
  producerId: string;
  producerName: string;
  destinationId: string;
  destinationName: string;
  flowDepth: number;
  path: EventFlowPathNode[];
  deadLetterPaths: EventFlowPathNode[][];
  consumersReachedCount: number;
  downstreamEventsEmitted: string[];
  hasCyclicDependency: boolean;
}

export interface SagaStateTransition {
  fromState: string;
  toState: string;
  triggerEvent: string;
  actionServiceId: string;
  isCompensating: boolean;
  compensationAction?: string;
  timeoutSeconds?: number;
}

export interface SagaWorkflow {
  id: string;
  name: string;
  type: SagaType;
  orchestratorServiceId?: string;
  initiatingEventType: string;
  states: string[];
  initialState: string;
  terminalSuccessStates: string[];
  terminalFailureStates: string[];
  transitions: SagaStateTransition[];
  consistencyAnalysis: {
    isFullyCompensated: boolean;
    uncompensatedStates: string[];
    potentialOrphanedStates: string[];
    riskSummary: string;
  };
  provenance: MessagingProvenance;
}

export interface MessagingTopology {
  id: string;
  projectId: string;
  architectureId: string;
  graphRevision: string;
  version: number;
  brokers: MessagingBroker[];
  destinations: MessagingDestination[];
  producers: MessagingProducer[];
  consumers: MessagingConsumer[];
  consumerGroups: ConsumerGroup[];
  relationships: MessagingRelationship[];
  sagas?: SagaWorkflow[];
  createdAt: string;
  updatedAt: string;
}
