import { describe, it, expect } from "vitest";
import { architectureMessagingEngine } from "../messaging/engine/messaging-engine";
import { MessagingTopology } from "../messaging/contracts/messaging.types";
import { RetryAmplificationAnalyzer } from "../messaging/analysis/retry-amplification-analyzer";

describe("Phase 05.3.21: Messaging Reliability, Retry Storms & Idempotency", () => {
  const now = new Date().toISOString();

  it("calculates geometric retry multiplier and detects storm risk", () => {
    // 5 retries with 25% failure rate
    const evalResult = RetryAmplificationAnalyzer.evaluateRetryStorm(
      {
        id: "dest-1",
        brokerId: "b-1",
        name: "events.orders",
        type: "topic",
        eventContractIds: [],
        deliverySemantics: "at_least_once",
        orderingScope: "partition",
        retention: { retentionHours: 24, cleanupPolicy: "delete", isDurableStorage: true },
        provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
      },
      {
        id: "cons-1",
        serviceId: "srv-consumer",
        destinationId: "dest-1",
        workerConcurrency: 2,
        eventTypesConsumed: ["OrderCreated"],
        avgProcessingTimeMs: 50,
        ackMode: "explicit",
        retryPolicy: {
          maxAttempts: 5,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffStrategy: "constant",
          jitterPct: 0,
        },
        idempotency: {
          isConfigured: false,
          deduplicationStore: "none",
          scope: "handler",
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
        usesInboxDeduplication: false,
        hasSideEffects: true,
        provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
      },
      200, // Arrival RPS
      25 // 25% Failure rate
    );

    // 1 + 0.25 + 0.0625 + ... approx 1.33x
    expect(evalResult.estimatedRetryMultiplier).toBeGreaterThan(1.3);
    expect(evalResult.peakRpsUnderFailure).toBeGreaterThan(260);
    expect(evalResult.isStormRisk).toBe(true);
  });

  it("detects auto-acknowledgment message loss risk", () => {
    const topology: MessagingTopology = {
      id: "topo-auto-ack",
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
          name: "tasks.queue",
          type: "queue",
          eventContractIds: [],
          deliverySemantics: "at_least_once",
          orderingScope: "unordered",
          retention: { retentionHours: 24, cleanupPolicy: "delete", isDurableStorage: true },
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      producers: [],
      consumers: [
        {
          id: "c-loss",
          serviceId: "lossy-worker",
          destinationId: "d1",
          workerConcurrency: 2,
          eventTypesConsumed: ["Task"],
          avgProcessingTimeMs: 20,
          ackMode: "auto",
          retryPolicy: {
            maxAttempts: 0,
            initialDelayMs: 0,
            maxDelayMs: 0,
            backoffStrategy: "constant",
            jitterPct: 0,
          },
          idempotency: {
            isConfigured: false,
            deduplicationStore: "none",
            scope: "handler",
            provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
          },
          usesInboxDeduplication: false,
          hasSideEffects: false,
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      consumerGroups: [],
      relationships: [],
      createdAt: now,
      updatedAt: now,
    };

    const output = architectureMessagingEngine.analyzeTopology(topology);
    const autoAckFinding = output.findings.find((f) => f.id.includes("auto-ack"));
    expect(autoAckFinding).toBeDefined();
    expect(autoAckFinding?.severity).toBe("high");
  });

  it("detects missing idempotency on at-least-once destination with payment side effects", () => {
    const topology: MessagingTopology = {
      id: "topo-idempotency",
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
          name: "payments.charge",
          type: "topic",
          eventContractIds: [],
          deliverySemantics: "at_least_once",
          orderingScope: "partition",
          retention: { retentionHours: 24, cleanupPolicy: "delete", isDurableStorage: true },
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      producers: [],
      consumers: [
        {
          id: "c-payment",
          serviceId: "payment-gateway-client",
          destinationId: "d1",
          workerConcurrency: 4,
          eventTypesConsumed: ["ChargeRequested"],
          avgProcessingTimeMs: 100,
          ackMode: "explicit",
          retryPolicy: {
            maxAttempts: 3,
            initialDelayMs: 200,
            maxDelayMs: 2000,
            backoffStrategy: "exponential_jitter",
            jitterPct: 20,
          },
          idempotency: {
            isConfigured: false,
            deduplicationStore: "none",
            scope: "handler",
            provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
          },
          usesInboxDeduplication: false,
          hasSideEffects: true,
          sideEffectTypes: ["payment_charge"],
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      consumerGroups: [],
      relationships: [],
      createdAt: now,
      updatedAt: now,
    };

    const output = architectureMessagingEngine.analyzeTopology(topology);
    const idempotencyFinding = output.findings.find((f) => f.id.includes("idempotency-gap"));
    expect(idempotencyFinding).toBeDefined();
    expect(idempotencyFinding?.severity).toBe("critical");

    const replayHazardFinding = output.findings.find((f) => f.id.includes("replay-hazard-payment"));
    expect(replayHazardFinding).toBeDefined();
    expect(replayHazardFinding?.severity).toBe("critical");
  });

  it("detects impossible global ordering on multi-partition topics", () => {
    const topology: MessagingTopology = {
      id: "topo-ordering",
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
          id: "d-ordered",
          brokerId: "b1",
          name: "ledger.events",
          type: "topic",
          eventContractIds: [],
          deliverySemantics: "at_least_once",
          orderingScope: "global", // Impossible with 12 partitions
          partitioning: {
            partitionCount: 12,
            partitionKeyField: "accountId",
            assignmentStrategy: "hash",
            rebalanceAssumption: "cooperative_incremental",
          },
          retention: { retentionHours: 168, cleanupPolicy: "compact", isDurableStorage: true },
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      producers: [],
      consumers: [],
      consumerGroups: [],
      relationships: [],
      createdAt: now,
      updatedAt: now,
    };

    const output = architectureMessagingEngine.analyzeTopology(topology);
    const orderingFinding = output.findings.find((f) => f.id.includes("ordering-violation"));
    expect(orderingFinding).toBeDefined();
    expect(orderingFinding?.severity).toBe("critical");
  });
});
