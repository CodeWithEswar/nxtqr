import { describe, it, expect } from "vitest";
import { architectureMessagingEngine } from "../messaging/engine/messaging-engine";
import {
  MessagingTopology,
  MessagingDestination,
  MessagingProducer,
  MessagingConsumer,
  MessagingRelationship,
} from "../messaging/contracts/messaging.types";
import { EventFlowTraversal } from "../messaging/workflows/event-flow-traversal";

describe("Phase 05.3.21: Messaging Engine Performance Benchmarks", () => {
  const now = new Date().toISOString();

  it("analyzes 1,000 messaging relationships in < 250ms", () => {
    const destinations: MessagingDestination[] = [];
    const producers: MessagingProducer[] = [];
    const consumers: MessagingConsumer[] = [];
    const relationships: MessagingRelationship[] = [];

    // 100 destinations, each with 5 producers and 5 consumers = 1,000 relationships
    for (let i = 0; i < 100; i++) {
      const destId = `dest-bench-${i}`;
      destinations.push({
        id: destId,
        brokerId: "broker-bench",
        name: `topic.bench.${i}`,
        type: "topic",
        eventContractIds: [],
        deliverySemantics: "at_least_once",
        orderingScope: "partition",
        partitioning: {
          partitionCount: 4,
          partitionKeyField: "id",
          assignmentStrategy: "hash",
          rebalanceAssumption: "cooperative_incremental",
        },
        retention: { retentionHours: 24, cleanupPolicy: "delete", isDurableStorage: true },
        provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
      });

      for (let p = 0; p < 5; p++) {
        const prodId = `prod-bench-${i}-${p}`;
        producers.push({
          id: prodId,
          serviceId: `service-producer-${p}`,
          destinationId: destId,
          eventTypesPublished: [`Event_${p}`],
          publicationRateRps: 100,
          usesTransactionalOutbox: true,
          deliveryGuarantee: "at_least_once_outbox",
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        });

        relationships.push({
          id: `rel-pub-${i}-${p}`,
          sourceId: `service-producer-${p}`,
          destinationId: destId,
          kind: "publishes_to",
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        });
      }

      for (let c = 0; c < 5; c++) {
        const consId = `cons-bench-${i}-${c}`;
        consumers.push({
          id: consId,
          serviceId: `service-consumer-${c}`,
          destinationId: destId,
          workerConcurrency: 2,
          eventTypesConsumed: [`Event_${c}`],
          avgProcessingTimeMs: 20,
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
            idempotencyKeyField: "id",
            deduplicationStore: "redis",
            scope: "consumer_service",
            provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
          },
          usesInboxDeduplication: true,
          hasSideEffects: false,
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        });

        relationships.push({
          id: `rel-sub-${i}-${c}`,
          sourceId: destId,
          destinationId: `service-consumer-${c}`,
          kind: "consumes_from",
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        });
      }
    }

    const topology: MessagingTopology = {
      id: "topo-perf-1000",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      brokers: [
        {
          id: "broker-bench",
          name: "Benchmark Broker",
          technology: "apache_kafka",
          clusterMode: "clustered",
          isMultiRegion: false,
          capabilities: architectureMessagingEngine.getCapabilityRegistry().getCapabilities("apache_kafka"),
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      destinations,
      producers,
      consumers,
      consumerGroups: [],
      relationships,
      createdAt: now,
      updatedAt: now,
    };

    const startTime = performance.now();
    const output = architectureMessagingEngine.analyzeTopology(topology);
    const durationMs = performance.now() - startTime;

    expect(output.summary.destinationCount).toBe(100);
    expect(output.summary.producerCount).toBe(500);
    expect(output.summary.consumerCount).toBe(500);
    expect(durationMs).toBeLessThan(250);
  });

  it("traverses event flows across 500 nodes in < 100ms", () => {
    const traversal = new EventFlowTraversal();
    const destinations: MessagingDestination[] = [];
    const producers: MessagingProducer[] = [];
    const consumers: MessagingConsumer[] = [];

    for (let i = 0; i < 50; i++) {
      const destId = `flow-dest-${i}`;
      destinations.push({
        id: destId,
        brokerId: "b-1",
        name: `topic.flow.${i}`,
        type: "topic",
        eventContractIds: [],
        deliverySemantics: "at_least_once",
        orderingScope: "partition",
        retention: { retentionHours: 24, cleanupPolicy: "delete", isDurableStorage: true },
        provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
      });

      producers.push({
        id: `flow-prod-${i}`,
        serviceId: `service-${i}`,
        destinationId: destId,
        eventTypesPublished: [`EventFlow_${i}`],
        usesTransactionalOutbox: true,
        deliveryGuarantee: "at_least_once_outbox",
        provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
      });

      consumers.push({
        id: `flow-cons-${i}`,
        serviceId: `service-${(i + 1) % 50}`,
        destinationId: destId,
        workerConcurrency: 2,
        eventTypesConsumed: [`EventFlow_${i}`],
        avgProcessingTimeMs: 25,
        ackMode: "explicit",
        retryPolicy: {
          maxAttempts: 2,
          initialDelayMs: 50,
          maxDelayMs: 500,
          backoffStrategy: "exponential_jitter",
          jitterPct: 20,
        },
        idempotency: {
          isConfigured: true,
          deduplicationStore: "redis",
          scope: "consumer_service",
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
        usesInboxDeduplication: true,
        hasSideEffects: false,
        provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
      });
    }

    const topology: MessagingTopology = {
      id: "topo-traversal-perf",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      brokers: [
        {
          id: "b-1",
          name: "Kafka",
          technology: "apache_kafka",
          clusterMode: "clustered",
          isMultiRegion: false,
          capabilities: architectureMessagingEngine.getCapabilityRegistry().getCapabilities("apache_kafka"),
          provenance: { source: "modeled", timestamp: now, graphRevision: "r1", confirmed: false },
        },
      ],
      destinations,
      producers,
      consumers,
      consumerGroups: [],
      relationships: [],
      createdAt: now,
      updatedAt: now,
    };

    const startTime = performance.now();
    const result = traversal.traverse(topology, { maxPaths: 50, maxDepth: 6 });
    const durationMs = performance.now() - startTime;

    expect(result.traces.length).toBeGreaterThan(0);
    expect(durationMs).toBeLessThan(100);
  });
});
