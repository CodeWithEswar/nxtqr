import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — Message Queue
export const MessageQueueConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("message-queue"),
  queueType: z
    .enum(["fifo", "standard", "priority", "delay"])
    .default("fifo"),
  deliveryModel: z
    .enum(["at-least-once", "exactly-once", "at-most-once"])
    .default("at-least-once"),
  orderingGuarantee: z
    .enum(["strict-fifo", "best-effort", "partition-ordered"])
    .default("strict-fifo"),
  visibilityTimeoutSeconds: z.number().int().min(1).max(43200).default(30),
  messageRetentionSeconds: z.number().int().min(60).max(1209600).default(345600), // 4 days
  maxMessageSizeBytes: z.number().int().min(1024).max(10485760).default(262144), // 256 KB
  consumerConcurrency: z.number().int().min(1).max(1000).default(10),
  acknowledgmentMode: z
    .enum(["client-manual-ack", "auto-ack", "transactional"])
    .default("client-manual-ack"),
  deadLetterQueueEnabled: z.boolean().default(true),
  maxReceiveCount: z.number().int().min(1).max(100).default(5),
  assumedThroughputMsgSec: z.number().int().min(10).max(500000).default(2500),
});
export type MessageQueueConfig = z.infer<typeof MessageQueueConfigSchema>;

// 02 — Message Broker
export const MessageBrokerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("message-broker"),
  brokerImplementation: z
    .enum(["activemq", "artemis", "pulsar", "nats-jetstream", "cloud-managed"])
    .default("artemis"),
  supportedProtocols: z
    .enum(["amqp-1.0", "mqtt", "stomp", "openwire", "grpc-native"])
    .default("amqp-1.0"),
  routingModel: z
    .enum([
      "topic-publish-subscribe",
      "point-to-point-queue",
      "content-based-filter",
      "header-directed",
    ])
    .default("topic-publish-subscribe"),
  persistenceMode: z
    .enum(["durable-disk", "in-memory-transient", "replicated-raft"])
    .default("durable-disk"),
  deliveryGuarantees: z
    .enum(["at-least-once", "at-most-once", "effectively-once"])
    .default("at-least-once"),
  clusteringMode: z
    .enum(["active-standby", "shared-nothing-cluster", "peer-to-peer-mesh"])
    .default("shared-nothing-cluster"),
  authenticationRequired: z.boolean().default(true),
  assumedThroughputMsgSec: z.number().int().min(100).max(1000000).default(20000),
});
export type MessageBrokerConfig = z.infer<typeof MessageBrokerConfigSchema>;

// 03 — Event Bus
export const EventBusConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("event-bus"),
  routingStrategy: z
    .enum([
      "fanout-broadcast",
      "schema-attribute-filtered",
      "event-type-routed",
      "header-matched",
    ])
    .default("event-type-routed"),
  eventSchemaFormat: z
    .enum(["cloudevents-v1.0", "json-schema", "protocol-buffers", "avro"])
    .default("cloudevents-v1.0"),
  subscriptionModel: z
    .enum(["declarative-rules", "dynamic-registration", "webhook-dispatch"])
    .default("declarative-rules"),
  filteringRules: z
    .enum([
      "attribute-matching",
      "prefix-matching",
      "numeric-range",
      "wildcard-path",
    ])
    .default("attribute-matching"),
  retryPolicy: z
    .enum(["exponential-backoff", "linear-retry", "immediate-dlq"])
    .default("exponential-backoff"),
  deliveryGuarantees: z.enum(["at-least-once", "best-effort"]).default("at-least-once"),
  eventRetentionHours: z.number().int().min(0).max(168).default(24),
  assumedEventsPerSec: z.number().int().min(50).max(500000).default(10000),
});
export type EventBusConfig = z.infer<typeof EventBusConfigSchema>;

// 04 — Pub/Sub Topic
export const PubSubTopicConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("pub-sub-topic"),
  topicName: z.string().min(1).max(256).default("events.domain.v1"),
  subscriptionType: z.enum(["push", "pull", "streaming-pull"]).default("streaming-pull"),
  fanOutBehavior: z
    .enum([
      "broadcast-all-subscribers",
      "competing-consumers-load-balanced",
      "partitioned-key-routed",
    ])
    .default("broadcast-all-subscribers"),
  messageFilteringEnabled: z.boolean().default(true),
  retentionPolicy: z
    .enum(["time-to-live", "explicit-ack-purged", "size-limited"])
    .default("time-to-live"),
  orderingScope: z
    .enum(["unordered", "per-ordering-key", "total-topic-ordered"])
    .default("per-ordering-key"),
  deliveryGuarantees: z
    .enum(["at-least-once", "exactly-once-regional"])
    .default("at-least-once"),
  assumedPublishRateMsgSec: z.number().int().min(10).max(500000).default(5000),
});
export type PubSubTopicConfig = z.infer<typeof PubSubTopicConfigSchema>;

// 05 — Event Stream
export const EventStreamConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("event-stream"),
  partitionCount: z.number().int().min(1).max(1024).default(16),
  retentionHours: z.number().int().min(1).max(87600).default(168), // 7 days
  orderingScope: z
    .enum(["per-partition-strict", "per-key-hash", "global-epoch"])
    .default("per-partition-strict"),
  consumerGroupSupport: z.boolean().default(true),
  replaySupport: z.boolean().default(true),
  offsetManagement: z
    .enum(["consumer-managed", "broker-tracked", "dual-commit"])
    .default("broker-tracked"),
  replicationFactor: z.number().int().min(1).max(7).default(3),
  assumedEventRateSec: z.number().int().min(100).max(2000000).default(25000),
});
export type EventStreamConfig = z.infer<typeof EventStreamConfigSchema>;

// 06 — Kafka Broker
export const KafkaBrokerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("kafka-broker"),
  brokerId: z.number().int().min(0).max(9999).default(1),
  clusterReference: z.string().min(1).max(128).default("kafka-prod-us-east"),
  listenerProtocol: z
    .enum(["plaintext", "ssl-tls", "sasl-ssl", "sasl-plaintext"])
    .default("sasl-ssl"),
  storageAllocationGb: z.number().int().min(50).max(65536).default(2048),
  minInsyncReplicas: z.number().int().min(1).max(7).default(2),
  logCleanupPolicy: z
    .enum(["delete", "compact", "compact-and-delete"])
    .default("delete"),
  logRetentionHours: z.number().int().min(1).max(87600).default(168),
  logSegmentSizeMb: z.number().int().min(128).max(4096).default(1024),
  securityProtocol: z
    .enum(["sasl-scram-sha-512", "mtls-x509", "kerberos-gssapi", "oauthbearer"])
    .default("sasl-scram-sha-512"),
  assumedThroughputMbSec: z.number().int().min(10).max(5000).default(250),
});
export type KafkaBrokerConfig = z.infer<typeof KafkaBrokerConfigSchema>;

// 07 — RabbitMQ Broker
export const RabbitmqBrokerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("rabbitmq-broker"),
  virtualHost: z.string().min(1).max(64).default("/production"),
  exchangeType: z
    .enum(["direct", "topic", "fanout", "headers", "consistent-hash"])
    .default("topic"),
  messageAcknowledgment: z
    .enum(["manual-explicit", "automatic"])
    .default("manual-explicit"),
  persistenceMode: z
    .enum(["persistent-disk-backed", "transient-ram"])
    .default("persistent-disk-backed"),
  prefetchCount: z.number().int().min(1).max(5000).default(100),
  deadLetterExchangeConfigured: z.boolean().default(true),
  clusteringMode: z
    .enum(["quorum-queues-raft", "classic-mirrored", "federated-cluster"])
    .default("quorum-queues-raft"),
  assumedMessageRateMsgSec: z.number().int().min(50).max(200000).default(8000),
});
export type RabbitmqBrokerConfig = z.infer<typeof RabbitmqBrokerConfigSchema>;

// 08 — Dead-Letter Queue
export const DeadLetterQueueConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("dead-letter-queue"),
  sourceQueueReference: z.string().min(1).max(256).default("inbound-events-queue"),
  failureReasonCategories: z
    .enum([
      "max-retries-exceeded",
      "schema-poison-pill",
      "unhandled-processing-exception",
      "expired-ttl",
    ])
    .default("max-retries-exceeded"),
  retentionDays: z.number().int().min(1).max(365).default(14),
  maxRedriveAttempts: z.number().int().min(0).max(20).default(3),
  redriveDestination: z.string().min(1).max(256).default("inbound-events-queue-retry"),
  alertingEnabled: z.boolean().default(true),
  assumedDeadLetterVolumePerHour: z.number().int().min(0).max(50000).default(25),
});
export type DeadLetterQueueConfig = z.infer<typeof DeadLetterQueueConfigSchema>;

// 09 — Retry Queue
export const RetryQueueConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("retry-queue"),
  retryStrategy: z
    .enum(["exponential-backoff", "linear-interval", "fibonacci-backoff", "fixed-delay"])
    .default("exponential-backoff"),
  initialDelaySeconds: z.number().int().min(1).max(3600).default(5),
  maxDelaySeconds: z.number().int().min(5).max(86400).default(900),
  backoffMultiplier: z.number().min(1).max(10).default(2.0),
  jitterEnabled: z.boolean().default(true),
  maxRetryAttempts: z.number().int().min(1).max(30).default(5),
  destinationQueue: z.string().min(1).max(256).default("original-inbound-queue"),
  deadLetterDestination: z.string().min(1).max(256).default("dead-letter-queue-quarantine"),
  assumedPendingRetryVolume: z.number().int().min(0).max(100000).default(150),
});
export type RetryQueueConfig = z.infer<typeof RetryQueueConfigSchema>;

// 10 — Event Consumer
export const EventConsumerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("event-consumer"),
  consumerGroup: z.string().min(1).max(128).default("order-fulfillment-group"),
  subscribedSource: z.string().min(1).max(256).default("orders.events.stream"),
  concurrencyThreads: z.number().int().min(1).max(256).default(8),
  acknowledgmentMode: z
    .enum(["commit-after-processing", "commit-immediate", "batch-commit"])
    .default("commit-after-processing"),
  offsetResetStrategy: z.enum(["latest", "earliest", "none"]).default("latest"),
  retryBehavior: z
    .enum([
      "retry-locally-then-dlq",
      "immediate-requeue",
      "stop-consumer-on-error",
    ])
    .default("retry-locally-then-dlq"),
  idempotencyAssumption: z.boolean().default(true),
  processingTimeoutSeconds: z.number().int().min(1).max(600).default(30),
  assumedConsumptionRateMsgSec: z.number().int().min(10).max(200000).default(4000),
});
export type EventConsumerConfig = z.infer<typeof EventConsumerConfigSchema>;

// 11 — Event Producer
export const EventProducerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("event-producer"),
  destinationTopic: z.string().min(1).max(256).default("events.business.events"),
  schemaValidationMode: z
    .enum(["enforce-strict-schema", "permissive-evolution", "untyped-binary"])
    .default("enforce-strict-schema"),
  deliveryAcknowledgment: z
    .enum(["all-replicas-minus-1", "leader-ack-1", "no-ack-0"])
    .default("all-replicas-minus-1"),
  batchingEnabled: z.boolean().default(true),
  batchSizeKb: z.number().int().min(1).max(1024).default(64),
  lingerMs: z.number().int().min(0).max(500).default(10),
  compressionCodec: z
    .enum(["snappy", "lz4", "zstd", "gzip", "none"])
    .default("snappy"),
  idempotentPublishing: z.boolean().default(true),
  assumedPublishRateMsgSec: z.number().int().min(10).max(500000).default(5000),
});
export type EventProducerConfig = z.infer<typeof EventProducerConfigSchema>;

// 12 — Webhook Dispatcher
export const WebhookDispatcherConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("webhook-dispatcher"),
  destinationEndpointsCount: z.number().int().min(1).max(1000).default(25),
  httpMethod: z.enum(["POST", "PUT", "PATCH"]).default("POST"),
  payloadFormat: z.enum(["json", "signed-jwt", "protobuf-binary"]).default("json"),
  signatureMechanism: z
    .enum(["hmac-sha256-header", "ed25519-asymmetric", "bearer-token-auth"])
    .default("hmac-sha256-header"),
  deliveryTimeoutSeconds: z.number().int().min(1).max(60).default(10),
  retryPolicy: z
    .enum(["exponential-with-jitter", "linear-interval", "circuit-breaker-fallback"])
    .default("exponential-with-jitter"),
  maxRetryAttempts: z.number().int().min(1).max(20).default(5),
  idempotencyKeyHeader: z.string().min(1).max(64).default("X-Webhook-Idempotency-Key"),
  assumedDispatchRatePerSec: z.number().int().min(1).max(10000).default(150),
});
export type WebhookDispatcherConfig = z.infer<typeof WebhookDispatcherConfigSchema>;

// 13 — Stream Processor
export const StreamProcessorConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("stream-processor"),
  processingModel: z
    .enum([
      "stateful-event-time",
      "stateless-map-filter",
      "tumbling-window-aggregate",
      "sliding-window-join",
    ])
    .default("stateful-event-time"),
  inputStreamsCount: z.number().int().min(1).max(16).default(2),
  outputStreamsCount: z.number().int().min(1).max(16).default(1),
  windowingStrategy: z
    .enum(["tumbling-time", "hopping-sliding", "session-gap", "event-count-tumbling"])
    .default("tumbling-time"),
  stateBackend: z
    .enum(["rocksdb-local-ssd", "in-memory-heap", "distributed-kv-store"])
    .default("rocksdb-local-ssd"),
  checkpointIntervalSeconds: z.number().int().min(1).max(3600).default(60),
  parallelismScale: z.number().int().min(1).max(256).default(8),
  failureRecovery: z
    .enum(["exactly-once-checkpointed", "at-least-once-resumed"])
    .default("exactly-once-checkpointed"),
  assumedProcessingRateEventsSec: z.number().int().min(100).max(2000000).default(35000),
});
export type StreamProcessorConfig = z.infer<typeof StreamProcessorConfigSchema>;

// 14 — Event Store
export const EventStoreConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("event-store"),
  eventStreamIdentity: z.string().min(1).max(128).default("aggregate-event-journal"),
  appendOnlyEnforced: z.boolean().default(true),
  eventVersioning: z
    .enum(["monotonically-increasing-sequence", "optimistic-vector-clock"])
    .default("monotonically-increasing-sequence"),
  retentionPolicy: z
    .enum(["indefinite-infinite", "time-to-live-years", "snapshot-truncated"])
    .default("indefinite-infinite"),
  snapshotStrategy: z
    .enum(["frequency-every-n-events", "scheduled-cron", "on-demand-compaction"])
    .default("frequency-every-n-events"),
  concurrencyControl: z
    .enum(["expected-version-check", "pessimistic-lock"])
    .default("expected-version-check"),
  replayCapability: z
    .enum(["full-history-stream", "point-in-time-replay", "catch-up-subscription"])
    .default("full-history-stream"),
  storageBackendCategory: z
    .enum([
      "eventstoredb-native",
      "postgresql-append-log",
      "distributed-immutable-store",
    ])
    .default("eventstoredb-native"),
  assumedEventsStoredMillions: z.number().int().min(1).max(10000).default(100),
});
export type EventStoreConfig = z.infer<typeof EventStoreConfigSchema>;

// Combined Category 07 Union
export const MessagingAndEventSystemsComponentConfigSchema = z.discriminatedUnion(
  "componentType",
  [
    MessageQueueConfigSchema,
    MessageBrokerConfigSchema,
    EventBusConfigSchema,
    PubSubTopicConfigSchema,
    EventStreamConfigSchema,
    KafkaBrokerConfigSchema,
    RabbitmqBrokerConfigSchema,
    DeadLetterQueueConfigSchema,
    RetryQueueConfigSchema,
    EventConsumerConfigSchema,
    EventProducerConfigSchema,
    WebhookDispatcherConfigSchema,
    StreamProcessorConfigSchema,
    EventStoreConfigSchema,
  ]
);

export type MessagingAndEventSystemsComponentConfig = z.infer<
  typeof MessagingAndEventSystemsComponentConfigSchema
>;
