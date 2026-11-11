"use client";

/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * React Hook for Studio Distributed Messaging State & Analysis
 */

import { useState, useMemo, useCallback } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  MessagingTopology,
  MessagingBroker,
  MessagingDestination,
  architectureMessagingEngine,
} from "@nxtqr/architecture-intelligence";

export interface UseArchitectureMessagingProps {
  projectId?: string;
  architectureId?: string;
  graphRevision?: string;
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialTopology?: MessagingTopology;
}

export type MessagingTab =
  | "overview"
  | "destinations"
  | "retry_storm"
  | "flows"
  | "sagas"
  | "findings";

export function useArchitectureMessaging(props: UseArchitectureMessagingProps) {
  const {
    projectId = "default-project",
    architectureId = "default-arch",
    graphRevision = "rev-default",
    nodes: _nodes = [],
    edges: _edges = [],
    initialTopology,
  } = props;

  // Build default fallback topology if none supplied
  const defaultTopology: MessagingTopology = useMemo(() => {
    if (initialTopology) return initialTopology;

    const now = new Date().toISOString();
    const brokerId = "broker-primary";
    const destId = "topic-orders";

    return {
      id: `topo-${architectureId}`,
      projectId,
      architectureId,
      graphRevision,
      version: 1,
      brokers: [
        {
          id: brokerId,
          name: "Main Kafka Cluster",
          technology: "apache_kafka",
          clusterMode: "clustered",
          isMultiRegion: false,
          capabilities: architectureMessagingEngine.getCapabilityRegistry().getCapabilities("apache_kafka"),
          provenance: { source: "modeled", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      destinations: [
        {
          id: destId,
          brokerId,
          name: "orders.events",
          type: "topic",
          eventContractIds: [],
          deliverySemantics: "at_least_once",
          orderingScope: "partition",
          partitioning: {
            partitionCount: 6,
            partitionKeyField: "orderId",
            assignmentStrategy: "hash",
            rebalanceAssumption: "cooperative_incremental",
          },
          retention: { retentionHours: 168, cleanupPolicy: "delete", isDurableStorage: true },
          deadLetterDestinationId: "queue-orders-dlq",
          maxDeliveryAttemptsBeforeDeadLetter: 3,
          provenance: { source: "modeled", timestamp: now, graphRevision, confirmed: true },
        },
        {
          id: "queue-orders-dlq",
          brokerId,
          name: "orders.dead-letter",
          type: "queue",
          eventContractIds: [],
          deliverySemantics: "at_least_once",
          orderingScope: "unordered",
          retention: { retentionHours: 336, cleanupPolicy: "delete", isDurableStorage: true },
          provenance: { source: "modeled", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      producers: [
        {
          id: "prod-checkout",
          serviceId: "checkout-service",
          destinationId: destId,
          eventTypesPublished: ["OrderCreated", "OrderCancelled"],
          publicationRateRps: 150,
          usesTransactionalOutbox: true,
          outboxTableName: "order_outbox",
          deliveryGuarantee: "at_least_once_outbox",
          provenance: { source: "modeled", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      consumers: [
        {
          id: "cons-payment",
          serviceId: "payment-service",
          destinationId: destId,
          consumerGroupId: "cg-payment",
          workerConcurrency: 4,
          eventTypesConsumed: ["OrderCreated"],
          avgProcessingTimeMs: 45,
          ackMode: "offset_commit",
          retryPolicy: {
            maxAttempts: 4,
            initialDelayMs: 150,
            maxDelayMs: 2000,
            backoffStrategy: "exponential_jitter",
            jitterPct: 20,
          },
          idempotency: {
            isConfigured: true,
            idempotencyKeyField: "orderId",
            deduplicationStore: "database_table",
            windowSeconds: 86400,
            scope: "consumer_service",
            provenance: { source: "modeled", timestamp: now, graphRevision, confirmed: true },
          },
          usesInboxDeduplication: true,
          inboxTableName: "payment_inbox",
          hasSideEffects: true,
          sideEffectTypes: ["payment_charge"],
          provenance: { source: "modeled", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      consumerGroups: [
        {
          id: "cg-payment-id",
          groupId: "cg-payment",
          destinationId: destId,
          consumerServiceIds: ["payment-service"],
          activeWorkersCount: 4,
          provenance: { source: "modeled", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      relationships: [
        {
          id: "rel-1",
          sourceId: "checkout-service",
          destinationId: destId,
          kind: "publishes_to",
          provenance: { source: "modeled", timestamp: now, graphRevision, confirmed: true },
        },
        {
          id: "rel-2",
          sourceId: destId,
          destinationId: "payment-service",
          kind: "consumes_from",
          provenance: { source: "modeled", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
  }, [initialTopology, architectureId, projectId, graphRevision]);

  const [topology, setTopology] = useState<MessagingTopology>(defaultTopology);
  const [activeTab, setActiveTab] = useState<MessagingTab>("overview");
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | undefined>(
    topology.brokers[0]?.id
  );
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | undefined>(
    topology.destinations[0]?.id
  );
  const [selectedTraceId, setSelectedTraceId] = useState<string | undefined>();
  const [selectedSagaId, setSelectedSagaId] = useState<string | undefined>();
  const [selectedFindingId, setSelectedFindingId] = useState<string | undefined>();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [technologyFilter, setTechnologyFilter] = useState<string>("all");
  const [destinationTypeFilter, setDestinationTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Run comprehensive analysis
  const analysisOutput = useMemo(() => {
    try {
      return architectureMessagingEngine.analyzeTopology(topology);
    } catch (e) {
      console.error("Messaging analysis error:", e);
      return null;
    }
  }, [topology]);

  // Derived selected elements
  const selectedBroker = useMemo(() => {
    return topology.brokers.find((b) => b.id === selectedBrokerId) || topology.brokers[0];
  }, [topology.brokers, selectedBrokerId]);

  const selectedDestination = useMemo(() => {
    return (
      topology.destinations.find((d) => d.id === selectedDestinationId) ||
      topology.destinations[0]
    );
  }, [topology.destinations, selectedDestinationId]);

  const selectedTrace = useMemo(() => {
    if (!analysisOutput || !selectedTraceId) return analysisOutput?.eventFlowTraces[0];
    return analysisOutput.eventFlowTraces.find((t) => t.id === selectedTraceId);
  }, [analysisOutput, selectedTraceId]);

  const selectedSaga = useMemo(() => {
    if (!analysisOutput?.sagas || analysisOutput.sagas.length === 0) return undefined;
    if (!selectedSagaId) return analysisOutput.sagas[0];
    return analysisOutput.sagas.find((s) => s.id === selectedSagaId);
  }, [analysisOutput?.sagas, selectedSagaId]);

  // Filtered collections
  const filteredDestinations = useMemo(() => {
    return topology.destinations.filter((d) => {
      if (destinationTypeFilter !== "all" && d.type !== destinationTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [topology.destinations, destinationTypeFilter, searchQuery]);

  const filteredFindings = useMemo(() => {
    if (!analysisOutput) return [];
    return analysisOutput.findings.filter((f) => {
      if (severityFilter !== "all" && f.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.title.toLowerCase().includes(q) ||
          f.explanation.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [analysisOutput, severityFilter, searchQuery]);

  // Actions
  const updateDestination = useCallback((dest: MessagingDestination) => {
    setTopology((prev) => ({
      ...prev,
      destinations: prev.destinations.map((d) => (d.id === dest.id ? dest : d)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateBroker = useCallback((broker: MessagingBroker) => {
    setTopology((prev) => ({
      ...prev,
      brokers: prev.brokers.map((b) => (b.id === broker.id ? broker : b)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  return {
    topology,
    setTopology,
    analysisOutput,
    activeTab,
    setActiveTab,
    selectedBrokerId,
    setSelectedBrokerId,
    selectedBroker,
    selectedDestinationId,
    setSelectedDestinationId,
    selectedDestination,
    selectedTraceId,
    setSelectedTraceId,
    selectedTrace,
    selectedSagaId,
    setSelectedSagaId,
    selectedSaga,
    selectedFindingId,
    setSelectedFindingId,
    searchQuery,
    setSearchQuery,
    technologyFilter,
    setTechnologyFilter,
    destinationTypeFilter,
    setDestinationTypeFilter,
    severityFilter,
    setSeverityFilter,
    filteredDestinations,
    filteredFindings,
    updateDestination,
    updateBroker,
  };
}
