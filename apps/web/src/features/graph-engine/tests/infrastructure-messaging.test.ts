import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_MESSAGING_SLUGS = [
  "message-queue",
  "message-broker",
  "event-bus",
  "pub-sub-topic",
  "event-stream",
  "kafka-broker",
  "rabbitmq-broker",
  "dead-letter-queue",
  "retry-queue",
  "event-consumer",
  "event-producer",
  "webhook-dispatcher",
  "stream-processor",
  "event-store",
] as const;

describe("Phase 05.1.7 — Messaging & Event Systems Infrastructure Library", () => {
  beforeEach(() => {
    useGraphEditorStore.setState({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      canUndo: false,
      canRedo: false,
    });
  });

  describe("1. Registry & Category Inventory", () => {
    it("registers the canonical category 'messaging-and-event-systems'", () => {
      const category = infrastructureRegistry.getCategory(
        MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("Messaging & Event Systems");
      expect(category?.order).toBe(7);
    });

    it("registers exactly the 14 required Messaging & Event Systems component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID
      );
      expect(components.length).toBe(14);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_MESSAGING_SLUGS].sort());
    });

    it("ensures every Messaging component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_MESSAGING_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Node Factory & Graph Schema Compliance", () => {
    it("creates compliant BaseNode instances for all 14 component types", () => {
      EXPECTED_MESSAGING_SLUGS.forEach((slug, index) => {
        const node = infrastructureRegistry.createInfrastructureNode(slug, {
          position: { x: index * 120, y: index * 80 },
        });

        expect(node.id).toBeDefined();
        expect(node.type).toBe(slug);
        expect(node.data.isInfrastructure).toBe(true);
        expect(node.data.categoryId).toBe(MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID);
        expect(node.data.componentType).toBe(slug);
        expect(node.data.environment).toBe("production");
        expect(node.ports?.length).toBeGreaterThanOrEqual(3);

        const parseResult = BaseNodeSchema.safeParse(node);
        expect(
          parseResult.success,
          `Node for ${slug} must pass BaseNodeSchema: ${
            !parseResult.success ? JSON.stringify(parseResult.error) : ""
          }`
        ).toBe(true);
      });
    });
  });

  describe("3. Zustand Graph Store Lifecycle", () => {
    it("adds and selects a Messaging component node in store", () => {
      const node = infrastructureRegistry.createInfrastructureNode("kafka-broker", {
        position: { x: 300, y: 200 },
      });

      const store = useGraphEditorStore.getState();
      store.addNode(node);
      store.selectNode(node.id, false);

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(1);
      expect(state.nodes[0].id).toBe(node.id);
      expect(state.nodes[0].type).toBe("kafka-broker");
      expect(state.selectedNodeIds).toContain(node.id);
    });

    it("updates Messaging component configuration data through store action", () => {
      const node = infrastructureRegistry.createInfrastructureNode("event-stream", {
        position: { x: 100, y: 100 },
      });

      const store = useGraphEditorStore.getState();
      store.addNode(node);

      store.updateNodeConfig(node.id, {
        data: {
          partitionCount: 32,
          retentionHours: 336,
        },
      });

      const updated = useGraphEditorStore.getState().nodes.find((n) => n.id === node.id);
      expect(updated?.data.partitionCount).toBe(32);
      expect(updated?.data.retentionHours).toBe(336);
    });

    it("duplicates and removes Messaging component nodes via command pattern", () => {
      const node = infrastructureRegistry.createInfrastructureNode("webhook-dispatcher", {
        position: { x: 250, y: 350 },
      });

      const store = useGraphEditorStore.getState();
      store.addNode(node);
      store.selectNode(node.id, false);
      store.duplicateSelected();

      const stateAfterDup = useGraphEditorStore.getState();
      expect(stateAfterDup.nodes.length).toBe(2);

      store.deleteSelected();
      const stateAfterDelete = useGraphEditorStore.getState();
      expect(stateAfterDelete.nodes.length).toBe(1);
    });

    it("supports drag moves via moveNodesBatch", () => {
      const node = infrastructureRegistry.createInfrastructureNode("message-queue", {
        position: { x: 10, y: 20 },
      });

      const store = useGraphEditorStore.getState();
      store.addNode(node);

      store.moveNodesBatch([
        {
          nodeId: node.id,
          from: { x: 10, y: 20 },
          to: { x: 450, y: 550 },
        },
      ]);

      const state = useGraphEditorStore.getState();
      expect(state.nodes[0].position).toEqual({ x: 450, y: 550 });
    });
  });

  describe("4. End-to-End Messaging & Event Architecture Topologies", () => {
    it("assembles an Event-Driven Architecture (Producer -> Kafka Broker -> Stream Processor -> Event Store)", () => {
      const producer = infrastructureRegistry.createInfrastructureNode("event-producer", {
        position: { x: 50, y: 150 },
      });
      const kafka = infrastructureRegistry.createInfrastructureNode("kafka-broker", {
        position: { x: 300, y: 150 },
      });
      const stream = infrastructureRegistry.createInfrastructureNode("event-stream", {
        position: { x: 550, y: 150 },
      });
      const processor = infrastructureRegistry.createInfrastructureNode("stream-processor", {
        position: { x: 800, y: 150 },
      });
      const eventStore = infrastructureRegistry.createInfrastructureNode("event-store", {
        position: { x: 1050, y: 150 },
      });

      const store = useGraphEditorStore.getState();
      store.addNode(producer);
      store.addNode(kafka);
      store.addNode(stream);
      store.addNode(processor);
      store.addNode(eventStore);

      // 1. Producer -> Kafka Broker
      store.addEdge({
        id: "edge_producer_to_kafka",
        source: producer.id,
        sourceHandle: "event-emission-out",
        target: kafka.id,
        targetHandle: "producer-in",
        data: {},
      });

      // 2. Kafka Broker -> Event Stream Partition Log
      store.addEdge({
        id: "edge_kafka_to_stream",
        source: kafka.id,
        sourceHandle: "consumer-fetch-out",
        target: stream.id,
        targetHandle: "stream-write-in",
        data: {},
      });

      // 3. Event Stream -> Stream Processor
      store.addEdge({
        id: "edge_stream_to_proc",
        source: stream.id,
        sourceHandle: "stream-read-out",
        target: processor.id,
        targetHandle: "stream-in",
        data: {},
      });

      // 4. Stream Processor -> Event Store (Committed Append)
      store.addEdge({
        id: "edge_proc_to_store",
        source: processor.id,
        sourceHandle: "processed-stream-out",
        target: eventStore.id,
        targetHandle: "event-append-in",
        data: {},
      });

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(5);
      expect(state.edges.length).toBe(4);
    });

    it("assembles a Resilient Retry & Quarantine Workflow (Message Queue -> Retry Queue -> Dead-Letter Queue)", () => {
      const queue = infrastructureRegistry.createInfrastructureNode("message-queue", {
        position: { x: 100, y: 100 },
      });
      const retry = infrastructureRegistry.createInfrastructureNode("retry-queue", {
        position: { x: 350, y: 100 },
      });
      const dlq = infrastructureRegistry.createInfrastructureNode("dead-letter-queue", {
        position: { x: 600, y: 100 },
      });

      const store = useGraphEditorStore.getState();
      store.addNode(queue);
      store.addNode(retry);
      store.addNode(dlq);

      // 1. Message Queue -> Retry Queue (Transient Failure)
      store.addEdge({
        id: "edge_queue_to_retry",
        source: queue.id,
        sourceHandle: "dequeue-out",
        target: retry.id,
        targetHandle: "retry-enqueue-in",
        data: {},
      });

      // 2. Retry Queue -> DLQ (Exhausted Retries)
      store.addEdge({
        id: "edge_retry_to_dlq",
        source: retry.id,
        sourceHandle: "max-retries-dlq-out",
        target: dlq.id,
        targetHandle: "poison-intake-in",
        data: {},
      });

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(3);
      expect(state.edges.length).toBe(2);
    });

    it("verifies multi-category coexistence across Categories 01–07", () => {
      const allComponents = [
        ...infrastructureRegistry.listComponentsByCategory("clients-and-user-interfaces"),
        ...infrastructureRegistry.listComponentsByCategory("dns-cdn-edge"),
        ...infrastructureRegistry.listComponentsByCategory("networking-and-traffic"),
        ...infrastructureRegistry.listComponentsByCategory("compute-and-application-services"),
        ...infrastructureRegistry.listComponentsByCategory("databases-and-persistence"),
        ...infrastructureRegistry.listComponentsByCategory("caching-and-performance"),
        ...infrastructureRegistry.listComponentsByCategory(MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID),
      ];

      // 10 + 10 + 12 + 14 + 15 + 10 + 14 = 85
      expect(allComponents.length).toBe(85);

      const uniqueSlugs = new Set(allComponents.map((c) => c.id));
      expect(uniqueSlugs.size).toBe(85);
    });
  });
});
