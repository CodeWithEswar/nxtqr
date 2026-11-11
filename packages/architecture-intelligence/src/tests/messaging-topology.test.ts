import { describe, it, expect } from "vitest";
import { BrokerCapabilityRegistry } from "../messaging/providers/capability-registry";
import { MessagingTopologySchema } from "../messaging/schemas/messaging.schemas";
import { MessagingTopology } from "../messaging/contracts/messaging.types";

describe("Phase 05.3.21: Messaging Topology & Broker Capabilities", () => {
  const registry = new BrokerCapabilityRegistry();

  it("resolves capabilities for Apache Kafka accurately", () => {
    const caps = registry.getCapabilities("apache_kafka");
    expect(caps.supportsTopicPubSub).toBe(true);
    expect(caps.supportsQueueDelivery).toBe(false);
    expect(caps.supportsPartitioning).toBe(true);
    expect(caps.supportsOrderingKey).toBe(true);
    expect(caps.supportsConsumerGroups).toBe(true);
    expect(caps.supportsEventReplay).toBe(true);
  });

  it("resolves capabilities for AWS SQS accurately", () => {
    const caps = registry.getCapabilities("aws_sqs");
    expect(caps.supportsTopicPubSub).toBe(false);
    expect(caps.supportsQueueDelivery).toBe(true);
    expect(caps.supportsNativeDeadLetter).toBe(true);
    expect(caps.supportsDelayedDelivery).toBe(true);
  });

  it("resolves capabilities for RabbitMQ accurately", () => {
    const caps = registry.getCapabilities("rabbitmq");
    expect(caps.supportsTopicPubSub).toBe(true);
    expect(caps.supportsQueueDelivery).toBe(true);
    expect(caps.supportsNativeDeadLetter).toBe(true);
  });

  it("validates a fully specified MessagingTopology schema", () => {
    const topology: MessagingTopology = {
      id: "topo-1",
      projectId: "proj-1",
      architectureId: "arch-1",
      graphRevision: "rev-1",
      version: 1,
      brokers: [
        {
          id: "broker-kafka",
          name: "Production Kafka",
          technology: "apache_kafka",
          clusterMode: "clustered",
          isMultiRegion: false,
          capabilities: registry.getCapabilities("apache_kafka"),
          provenance: {
            source: "configured",
            timestamp: new Date().toISOString(),
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
      ],
      destinations: [
        {
          id: "dest-orders",
          brokerId: "broker-kafka",
          name: "orders.events",
          type: "topic",
          eventContractIds: ["contract-orders"],
          deliverySemantics: "at_least_once",
          orderingScope: "partition",
          partitioning: {
            partitionCount: 6,
            partitionKeyField: "orderId",
            assignmentStrategy: "range",
            rebalanceAssumption: "cooperative_incremental",
          },
          retention: {
            retentionHours: 168,
            cleanupPolicy: "delete",
            isDurableStorage: true,
          },
          provenance: {
            source: "configured",
            timestamp: new Date().toISOString(),
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
      ],
      producers: [
        {
          id: "prod-order-service",
          serviceId: "order-service",
          destinationId: "dest-orders",
          eventTypesPublished: ["OrderCreated", "OrderCancelled"],
          publicationRateRps: 250,
          usesTransactionalOutbox: true,
          outboxTableName: "order_outbox",
          deliveryGuarantee: "at_least_once_outbox",
          provenance: {
            source: "configured",
            timestamp: new Date().toISOString(),
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
      ],
      consumers: [
        {
          id: "cons-fulfillment",
          serviceId: "fulfillment-service",
          destinationId: "dest-orders",
          consumerGroupId: "cg-fulfillment",
          workerConcurrency: 6,
          eventTypesConsumed: ["OrderCreated"],
          avgProcessingTimeMs: 40,
          ackMode: "offset_commit",
          retryPolicy: {
            maxAttempts: 3,
            initialDelayMs: 100,
            maxDelayMs: 1000,
            backoffStrategy: "exponential_jitter",
            jitterPct: 25,
          },
          idempotency: {
            isConfigured: true,
            idempotencyKeyField: "eventId",
            deduplicationStore: "database_table",
            windowSeconds: 604800,
            scope: "consumer_service",
            provenance: {
              source: "configured",
              timestamp: new Date().toISOString(),
              graphRevision: "rev-1",
              confirmed: true,
            },
          },
          usesInboxDeduplication: true,
          inboxTableName: "fulfillment_inbox",
          hasSideEffects: true,
          sideEffectTypes: ["inventory_mutation"],
          provenance: {
            source: "configured",
            timestamp: new Date().toISOString(),
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
      ],
      consumerGroups: [
        {
          id: "cg-fulfillment-id",
          groupId: "cg-fulfillment",
          destinationId: "dest-orders",
          consumerServiceIds: ["fulfillment-service"],
          activeWorkersCount: 6,
          provenance: {
            source: "configured",
            timestamp: new Date().toISOString(),
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
      ],
      relationships: [
        {
          id: "rel-1",
          sourceId: "order-service",
          destinationId: "dest-orders",
          kind: "publishes_to",
          provenance: {
            source: "configured",
            timestamp: new Date().toISOString(),
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
        {
          id: "rel-2",
          sourceId: "dest-orders",
          destinationId: "fulfillment-service",
          kind: "consumes_from",
          provenance: {
            source: "configured",
            timestamp: new Date().toISOString(),
            graphRevision: "rev-1",
            confirmed: true,
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const parsed = MessagingTopologySchema.parse(topology);
    expect(parsed.id).toBe("topo-1");
    expect(parsed.brokers.length).toBe(1);
    expect(parsed.destinations.length).toBe(1);
    expect(parsed.producers.length).toBe(1);
    expect(parsed.consumers.length).toBe(1);
  });
});
