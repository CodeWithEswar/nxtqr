import { describe, it, expect } from "vitest";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import { architectureReportEngine } from "../reports/engine/report-engine";
import { architectureMessagingEngine } from "../messaging/engine/messaging-engine";
import { MessagingTopology } from "../messaging/contracts/messaging.types";
import { ReportExportCoordinator } from "../reports/exporters";

describe("Phase 05.3.21: Cross-Engine Integration (Assistant Tool #24 & Reports)", () => {
  const now = new Date().toISOString();

  const testTopology: MessagingTopology = {
    id: "topo-int",
    projectId: "proj-int",
    architectureId: "arch-int",
    graphRevision: "rev-int-1",
    version: 1,
    brokers: [
      {
        id: "broker-kafka",
        name: "Enterprise Kafka",
        technology: "apache_kafka",
        clusterMode: "clustered",
        isMultiRegion: true,
        capabilities: architectureMessagingEngine.getCapabilityRegistry().getCapabilities("apache_kafka"),
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
      },
    ],
    destinations: [
      {
        id: "topic-orders",
        brokerId: "broker-kafka",
        name: "order.events",
        type: "topic",
        eventContractIds: [],
        deliverySemantics: "at_least_once",
        orderingScope: "partition",
        partitioning: {
          partitionCount: 4,
          partitionKeyField: "orderId",
          assignmentStrategy: "hash",
          rebalanceAssumption: "cooperative_incremental",
        },
        retention: { retentionHours: 168, cleanupPolicy: "delete", isDurableStorage: true },
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
      },
    ],
    producers: [
      {
        id: "prod-order",
        serviceId: "order-service",
        destinationId: "topic-orders",
        eventTypesPublished: ["OrderPlaced"],
        publicationRateRps: 120,
        usesTransactionalOutbox: true,
        deliveryGuarantee: "at_least_once_outbox",
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
      },
    ],
    consumers: [
      {
        id: "cons-billing",
        serviceId: "billing-service",
        destinationId: "topic-orders",
        consumerGroupId: "cg-billing",
        workerConcurrency: 4,
        eventTypesConsumed: ["OrderPlaced"],
        avgProcessingTimeMs: 40,
        ackMode: "explicit",
        retryPolicy: {
          maxAttempts: 3,
          initialDelayMs: 150,
          maxDelayMs: 1500,
          backoffStrategy: "exponential_jitter",
          jitterPct: 20,
        },
        idempotency: {
          isConfigured: true,
          idempotencyKeyField: "orderId",
          deduplicationStore: "database_table",
          windowSeconds: 86400,
          scope: "consumer_service",
          provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
        },
        usesInboxDeduplication: true,
        hasSideEffects: true,
        sideEffectTypes: ["payment_charge"],
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
      },
    ],
    consumerGroups: [
      {
        id: "cg-billing-id",
        groupId: "cg-billing",
        destinationId: "topic-orders",
        consumerServiceIds: ["billing-service"],
        activeWorkersCount: 4,
        provenance: { source: "configured", timestamp: now, graphRevision: "rev-int-1", confirmed: true },
      },
    ],
    relationships: [],
    createdAt: now,
    updatedAt: now,
  };

  it("executes AI Assistant Tool #24 (get_messaging_topology_and_reliability)", async () => {
    const tool = architectureToolRegistry.getTool("get_messaging_topology_and_reliability");
    expect(tool).toBeDefined();

    const result = (await tool!.execute(
      {
        includeRetryStorms: true,
        includeBackpressure: true,
        includeReplaySafety: true,
        includeSagas: true,
      },
      {
        projectId: "proj-int",
        architectureId: "arch-int",
        graphRevision: "rev-int-1",
        nodes: [
          { id: "order-service", type: "service", data: { label: "Order Service" }, position: { x: 0, y: 0 } },
          { id: "billing-service", type: "service", data: { label: "Billing Service" }, position: { x: 100, y: 0 } },
        ],
        edges: [],
        messagingTopology: testTopology,
      }
    )) as Record<string, unknown>;

    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    const summary = result.summary as { brokerCount: number; destinationCount: number };
    expect(summary.brokerCount).toBe(1);
    expect(summary.destinationCount).toBe(1);
  });

  it("composes Architecture Report with messaging_systems section and exports to markdown", async () => {
    const report = architectureReportEngine.generateReport({
      projectId: "proj-int",
      architectureId: "arch-int",
      graphRevision: "rev-int-1",
      title: "Distributed Messaging Architecture Review",
      audience: "engineering",
      author: "Principal Architect",
      nodes: [
        { id: "order-service", type: "service", data: { label: "Order Service" }, position: { x: 0, y: 0 } },
        { id: "billing-service", type: "service", data: { label: "Billing Service" }, position: { x: 100, y: 0 } },
      ],
      edges: [],
      enabledSections: ["overview", "messaging_systems", "adrs"],
      analysisContext: {
        messagingTopology: testTopology,
      },
    });

    const messagingSec = report.sections.find((s) => s.kind === "messaging_systems");
    expect(messagingSec).toBeDefined();

    // Export to Markdown
    const exportResult = ReportExportCoordinator.exportReport(report, { format: "markdown" });
    const markdown = typeof exportResult.content === "string" ? exportResult.content : "";
    expect(markdown).toContain("Enterprise Kafka");
    expect(markdown).toContain("order.events");
    expect(markdown).toContain("Event-Driven Systems & Distributed Messaging Intelligence");
  });
});
