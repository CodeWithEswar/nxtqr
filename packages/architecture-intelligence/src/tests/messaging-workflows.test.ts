import { describe, it, expect } from "vitest";
import { architectureMessagingEngine } from "../messaging/engine/messaging-engine";
import { MessagingTopology, SagaWorkflow } from "../messaging/contracts/messaging.types";

describe("Phase 05.3.21: Event Flow Traversal & Saga Workflows", () => {
  const now = new Date().toISOString();

  it("traces multi-hop event flow with dead-letter queue routing", () => {
    const topology: MessagingTopology = {
      id: "topo-flow",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      brokers: [
        {
          id: "b1",
          name: "Kafka",
          technology: "apache_kafka",
          clusterMode: "clustered",
          isMultiRegion: false,
          capabilities: architectureMessagingEngine.getCapabilityRegistry().getCapabilities("apache_kafka"),
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      destinations: [
        {
          id: "dest-dlq",
          brokerId: "b1",
          name: "orders.dlq",
          type: "queue",
          eventContractIds: [],
          deliverySemantics: "at_least_once",
          orderingScope: "unordered",
          retention: { retentionHours: 336, cleanupPolicy: "delete", isDurableStorage: true },
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
        {
          id: "dest-main",
          brokerId: "b1",
          name: "orders.primary",
          type: "topic",
          eventContractIds: [],
          deliverySemantics: "at_least_once",
          orderingScope: "partition",
          deadLetterDestinationId: "dest-dlq",
          maxDeliveryAttemptsBeforeDeadLetter: 3,
          retention: { retentionHours: 168, cleanupPolicy: "delete", isDurableStorage: true },
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      producers: [
        {
          id: "prod-checkout",
          serviceId: "checkout-api",
          destinationId: "dest-main",
          eventTypesPublished: ["OrderPlaced"],
          publicationRateRps: 50,
          usesTransactionalOutbox: true,
          deliveryGuarantee: "at_least_once_outbox",
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      consumers: [
        {
          id: "cons-inventory",
          serviceId: "inventory-service",
          destinationId: "dest-main",
          workerConcurrency: 4,
          eventTypesConsumed: ["OrderPlaced"],
          avgProcessingTimeMs: 30,
          ackMode: "explicit",
          retryPolicy: {
            maxAttempts: 3,
            initialDelayMs: 100,
            maxDelayMs: 1000,
            backoffStrategy: "exponential_jitter",
            jitterPct: 20,
          },
          idempotency: {
            isConfigured: true,
            idempotencyKeyField: "orderId",
            deduplicationStore: "database_table",
            scope: "consumer_service",
            provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
          },
          usesInboxDeduplication: true,
          hasSideEffects: true,
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      consumerGroups: [],
      relationships: [
        {
          id: "r1",
          sourceId: "checkout-api",
          destinationId: "dest-main",
          kind: "publishes_to",
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
        {
          id: "r2",
          sourceId: "dest-main",
          destinationId: "inventory-service",
          kind: "consumes_from",
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const output = architectureMessagingEngine.analyzeTopology(topology);
    expect(output.eventFlowTraces.length).toBeGreaterThan(0);
    const trace = output.eventFlowTraces[0];
    expect(trace.rootEventType).toBe("OrderPlaced");
    expect(trace.path.length).toBeGreaterThanOrEqual(2);
    expect(trace.deadLetterPaths.length).toBe(1);
    expect(trace.deadLetterPaths[0][2].id).toBe("dest-dlq");
  });

  it("identifies uncompensated failure states and missing timeouts in Saga workflows", () => {
    const uncompensatedSaga: SagaWorkflow = {
      id: "saga-order-checkout",
      name: "E-Commerce Checkout Saga",
      type: "choreography",
      initiatingEventType: "CheckoutInitiated",
      states: ["Initiated", "PaymentProcessed", "InventoryReserved", "OrderFailed", "OrderCompleted"],
      initialState: "Initiated",
      terminalSuccessStates: ["OrderCompleted"],
      terminalFailureStates: ["OrderFailed"],
      transitions: [
        {
          fromState: "Initiated",
          toState: "PaymentProcessed",
          triggerEvent: "PaymentAuthorized",
          actionServiceId: "payment-service",
          isCompensating: false,
          timeoutSeconds: 30,
        },
        {
          fromState: "PaymentProcessed",
          toState: "OrderFailed", // Payment succeeded, but inventory fails directly without refund compensation!
          triggerEvent: "InventoryOutOfStock",
          actionServiceId: "inventory-service",
          isCompensating: false, // Missing compensating action!
        },
        {
          fromState: "PaymentProcessed",
          toState: "InventoryReserved",
          triggerEvent: "InventoryAllocated",
          actionServiceId: "inventory-service",
          isCompensating: false,
          // Missing timeoutSeconds
        },
      ],
      consistencyAnalysis: {
        isFullyCompensated: false,
        uncompensatedStates: [],
        potentialOrphanedStates: [],
        riskSummary: "",
      },
      provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
    };

    const topology: MessagingTopology = {
      id: "topo-saga",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      brokers: [
        {
          id: "b1",
          name: "Kafka",
          technology: "apache_kafka",
          clusterMode: "clustered",
          isMultiRegion: false,
          capabilities: architectureMessagingEngine.getCapabilityRegistry().getCapabilities("apache_kafka"),
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      destinations: [
        {
          id: "d1",
          brokerId: "b1",
          name: "saga.events",
          type: "topic",
          eventContractIds: [],
          deliverySemantics: "at_least_once",
          orderingScope: "key",
          partitioning: {
            partitionCount: 3,
            partitionKeyField: "orderId",
            assignmentStrategy: "hash",
            rebalanceAssumption: "cooperative_incremental",
          },
          retention: { retentionHours: 72, cleanupPolicy: "delete", isDurableStorage: true },
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      producers: [],
      consumers: [],
      consumerGroups: [],
      relationships: [],
      sagas: [uncompensatedSaga],
      createdAt: now,
      updatedAt: now,
    };

    const output = architectureMessagingEngine.analyzeTopology(topology);
    expect(output.sagas.length).toBe(1);
    const analyzedSaga = output.sagas[0];
    expect(analyzedSaga.consistencyAnalysis.isFullyCompensated).toBe(false);
    expect(analyzedSaga.consistencyAnalysis.uncompensatedStates).toContain("PaymentProcessed");

    const uncompensatedFinding = output.findings.find((f) => f.id.includes("saga-uncompensated"));
    expect(uncompensatedFinding).toBeDefined();
    expect(uncompensatedFinding?.severity).toBe("critical");

    const timeoutFinding = output.findings.find((f) => f.id.includes("saga-missing-timeout"));
    expect(timeoutFinding).toBeDefined();
    expect(timeoutFinding?.severity).toBe("medium");
  });
});

