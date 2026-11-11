/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Provider-Neutral Broker Capability Registry
 */

import type {
  MessageBrokerTechnology,
  BrokerCapabilities,
  MessagingEvidenceSource,
  MessagingBroker,
} from "../contracts/messaging.types";

export class BrokerCapabilityRegistry {
  private readonly capabilities = new Map<MessageBrokerTechnology, BrokerCapabilities>();

  constructor() {
    this.registerDefaults();
  }

  public getCapabilities(
    technology: MessageBrokerTechnology,
    evidenceSource: MessagingEvidenceSource = "modeled"
  ): BrokerCapabilities {
    const base = this.capabilities.get(technology) || this.getDefaultCustomCapabilities();
    return {
      ...base,
      provenance: {
        source: evidenceSource,
        sourceIdentifier: `registry:${technology}`,
        timestamp: new Date().toISOString(),
        graphRevision: "rev-default",
        confirmed: evidenceSource !== "unknown",
      },
    };
  }

  public resolveCapabilities(broker: MessagingBroker): BrokerCapabilities {
    if (broker.capabilities) {
      return broker.capabilities;
    }
    return this.getCapabilities(broker.technology, broker.provenance?.source || "modeled");
  }

  public registerCustomCapabilities(
    technology: MessageBrokerTechnology,
    capabilities: BrokerCapabilities
  ): void {
    this.capabilities.set(technology, capabilities);
  }

  private registerDefaults(): void {
    const now = new Date().toISOString();
    const defaultProv = {
      source: "configured" as const,
      timestamp: now,
      graphRevision: "rev-capabilities-v1",
      confirmed: true,
    };

    // 1. Apache Kafka
    this.capabilities.set("apache_kafka", {
      supportsQueueDelivery: false,
      supportsTopicPubSub: true,
      supportsConsumerGroups: true,
      supportsPartitioning: true,
      supportsOrderingKey: true,
      supportsMessageRetention: true,
      supportsEventReplay: true,
      supportsDelayedDelivery: false,
      supportsNativeDeadLetter: false, // Requires consumer routing or mirror maker/Kafka Streams
      supportsBrokerDeduplication: false, // Requires idempotent producer + transaction coordinator
      supportsTransactions: true,
      supportsCompaction: true,
      maxRetentionDurationHours: 87600, // Multi-year retention supported
      maxPayloadBytes: 1048576, // 1MB default
      provenance: defaultProv,
    });

    // 2. RabbitMQ
    this.capabilities.set("rabbitmq", {
      supportsQueueDelivery: true,
      supportsTopicPubSub: true,
      supportsConsumerGroups: false, // Uses competing consumers or exchange routing
      supportsPartitioning: false,
      supportsOrderingKey: false,
      supportsMessageRetention: false, // Consumed messages deleted immediately (unless streams plugin)
      supportsEventReplay: false,
      supportsDelayedDelivery: true,
      supportsNativeDeadLetter: true,
      supportsBrokerDeduplication: false,
      supportsTransactions: true,
      supportsCompaction: false,
      maxPayloadBytes: 134217728, // 128MB
      provenance: defaultProv,
    });

    // 3. AWS SQS
    this.capabilities.set("aws_sqs", {
      supportsQueueDelivery: true,
      supportsTopicPubSub: false,
      supportsConsumerGroups: false,
      supportsPartitioning: false,
      supportsOrderingKey: true, // SQS FIFO MessageGroupId
      supportsMessageRetention: true,
      supportsEventReplay: false,
      supportsDelayedDelivery: true,
      supportsNativeDeadLetter: true,
      supportsBrokerDeduplication: true, // Content-based or deduplication ID (5-min window)
      supportsTransactions: false,
      supportsCompaction: false,
      maxRetentionDurationHours: 336, // 14 days max
      maxPayloadBytes: 262144, // 256KB
      provenance: defaultProv,
    });

    // 4. AWS SNS
    this.capabilities.set("aws_sns", {
      supportsQueueDelivery: false,
      supportsTopicPubSub: true,
      supportsConsumerGroups: false,
      supportsPartitioning: false,
      supportsOrderingKey: true, // SNS FIFO
      supportsMessageRetention: false, // Fan-out only
      supportsEventReplay: false,
      supportsDelayedDelivery: false,
      supportsNativeDeadLetter: true, // DLQ for subscriptions
      supportsBrokerDeduplication: true, // SNS FIFO
      supportsTransactions: false,
      supportsCompaction: false,
      maxPayloadBytes: 262144, // 256KB
      provenance: defaultProv,
    });

    // 5. Google Cloud Pub/Sub
    this.capabilities.set("google_pubsub", {
      supportsQueueDelivery: false,
      supportsTopicPubSub: true,
      supportsConsumerGroups: true, // Subscriptions with multiple pull workers
      supportsPartitioning: false, // Managed partitions
      supportsOrderingKey: true,
      supportsMessageRetention: true,
      supportsEventReplay: true, // Seek to timestamp or snapshot
      supportsDelayedDelivery: false,
      supportsNativeDeadLetter: true,
      supportsBrokerDeduplication: false,
      supportsTransactions: false,
      supportsCompaction: false,
      maxRetentionDurationHours: 168, // 7 days default
      maxPayloadBytes: 10485760, // 10MB
      provenance: defaultProv,
    });

    // 6. Azure Service Bus
    this.capabilities.set("azure_service_bus", {
      supportsQueueDelivery: true,
      supportsTopicPubSub: true,
      supportsConsumerGroups: true,
      supportsPartitioning: true,
      supportsOrderingKey: true, // Session-based FIFO
      supportsMessageRetention: true,
      supportsEventReplay: false,
      supportsDelayedDelivery: true,
      supportsNativeDeadLetter: true, // Dead-letter subqueue
      supportsBrokerDeduplication: true,
      supportsTransactions: true,
      supportsCompaction: false,
      maxRetentionDurationHours: 336, // 14 days
      maxPayloadBytes: 104857600, // 100MB on Premium
      provenance: defaultProv,
    });

    // 7. Redis Streams
    this.capabilities.set("redis_streams", {
      supportsQueueDelivery: true,
      supportsTopicPubSub: true,
      supportsConsumerGroups: true,
      supportsPartitioning: false,
      supportsOrderingKey: true, // Entry IDs
      supportsMessageRetention: true,
      supportsEventReplay: true, // Range queries (XRANGE)
      supportsDelayedDelivery: false,
      supportsNativeDeadLetter: false,
      supportsBrokerDeduplication: false,
      supportsTransactions: true,
      supportsCompaction: false,
      maxRetentionDurationHours: undefined, // Memory constrained
      provenance: defaultProv,
    });

    // 8. NATS JetStream
    this.capabilities.set("nats_jetstream", {
      supportsQueueDelivery: true,
      supportsTopicPubSub: true,
      supportsConsumerGroups: true, // JetStream durable consumer groups
      supportsPartitioning: false, // Subject-based sharding
      supportsOrderingKey: true,
      supportsMessageRetention: true,
      supportsEventReplay: true,
      supportsDelayedDelivery: false,
      supportsNativeDeadLetter: false,
      supportsBrokerDeduplication: true, // Msg-Id deduplication window
      supportsTransactions: false,
      supportsCompaction: false,
      provenance: defaultProv,
    });

    // 9. Cloudflare Queues
    this.capabilities.set("cloudflare_queues", {
      supportsQueueDelivery: true,
      supportsTopicPubSub: false,
      supportsConsumerGroups: false,
      supportsPartitioning: false,
      supportsOrderingKey: false,
      supportsMessageRetention: true,
      supportsEventReplay: false,
      supportsDelayedDelivery: true,
      supportsNativeDeadLetter: true,
      supportsBrokerDeduplication: false,
      supportsTransactions: false,
      supportsCompaction: false,
      maxRetentionDurationHours: 96, // 4 days
      maxPayloadBytes: 131072, // 128KB
      provenance: defaultProv,
    });
  }

  private getDefaultCustomCapabilities(): BrokerCapabilities {
    return {
      supportsQueueDelivery: true,
      supportsTopicPubSub: true,
      supportsConsumerGroups: false,
      supportsPartitioning: false,
      supportsOrderingKey: false,
      supportsMessageRetention: false,
      supportsEventReplay: false,
      supportsDelayedDelivery: false,
      supportsNativeDeadLetter: false,
      supportsBrokerDeduplication: false,
      supportsTransactions: false,
      supportsCompaction: false,
      provenance: {
        source: "unknown",
        timestamp: new Date().toISOString(),
        graphRevision: "rev-unknown",
        confirmed: false,
      },
    };
  }
}

export const brokerCapabilityRegistry = new BrokerCapabilityRegistry();
