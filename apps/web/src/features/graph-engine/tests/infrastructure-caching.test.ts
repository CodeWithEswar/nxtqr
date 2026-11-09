import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  CACHING_AND_PERFORMANCE_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_CACHING_SLUGS = [
  "redis-cache",
  "memcached-cache",
  "application-cache",
  "distributed-cache",
  "session-cache",
  "query-cache",
  "read-through-cache",
  "write-through-cache",
  "write-behind-cache",
  "rate-limit-store",
] as const;

describe("Phase 05.1.6 — Caching & Performance Infrastructure Library", () => {
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
    it("registers the canonical category 'caching-and-performance'", () => {
      const category = infrastructureRegistry.getCategory(CACHING_AND_PERFORMANCE_CATEGORY_ID);
      expect(category).toBeDefined();
      expect(category?.name).toBe("Caching & Performance");
      expect(category?.order).toBe(6);
    });

    it("registers exactly the 10 required Caching & Performance component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(CACHING_AND_PERFORMANCE_CATEGORY_ID);
      expect(components.length).toBe(10);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_CACHING_SLUGS].sort());
    });

    it("ensures every Caching & Performance component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_CACHING_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Node Factory & Graph Schema Compliance", () => {
    it("creates valid BaseNode instances conforming to @nxtqr/graph-schema", () => {
      for (const slug of EXPECTED_CACHING_SLUGS) {
        const node = infrastructureRegistry.createInfrastructureNode(slug, {
          position: { x: 300, y: 400 },
          label: `Cache Node ${slug}`,
        });

        const parseResult = BaseNodeSchema.safeParse(node);
        expect(
          parseResult.success,
          `Node created for "${slug}" failed BaseNodeSchema validation: ${JSON.stringify(
            (parseResult as any).error?.errors
          )}`
        ).toBe(true);

        expect(node.type).toBe(slug);
        expect(node.position).toEqual({ x: 300, y: 400 });
        expect(node.label).toBe(`Cache Node ${slug}`);
        expect(node.ports).toBeDefined();
        expect(node.ports!.length).toBeGreaterThanOrEqual(1);
        expect(node.data.isInfrastructure).toBe(true);
        expect(node.data.categoryId).toBe(CACHING_AND_PERFORMANCE_CATEGORY_ID);
      }
    });

    it("correctly assigns protocol-aware ports for Redis Cache and Write-Behind Cache", () => {
      const redisNode = infrastructureRegistry.createInfrastructureNode("redis-cache");
      expect(redisNode.ports).toBeDefined();

      const clientIn = redisNode.ports?.find((p) => p.id === "client-ops-in");
      expect(clientIn).toBeDefined();
      expect(clientIn?.type).toBe("input");
      expect(clientIn?.dataType).toBe("Redis_RESP_Protocol");

      const replOut = redisNode.ports?.find((p) => p.id === "replication-sync-out");
      expect(replOut).toBeDefined();
      expect(replOut?.type).toBe("output");
      expect(replOut?.dataType).toBe("Redis_Replication_Stream");

      const writeBehindNode = infrastructureRegistry.createInfrastructureNode("write-behind-cache");
      expect(writeBehindNode.ports).toBeDefined();

      const fastAckOut = writeBehindNode.ports?.find((p) => p.id === "immediate-ack-out");
      expect(fastAckOut).toBeDefined();
      expect(fastAckOut?.type).toBe("output");
      expect(fastAckOut?.dataType).toBe("Immediate_Ack");

      const batchFlushOut = writeBehindNode.ports?.find((p) => p.id === "deferred-flush-out");
      expect(batchFlushOut).toBeDefined();
      expect(batchFlushOut?.type).toBe("output");
      expect(batchFlushOut?.dataType).toBe("Batch_Persistence_Stream");
    });
  });

  describe("3. Canvas Store Integration & Node Operations", () => {
    it("adds all 10 caching components to the store and verifies selection", () => {
      const store = useGraphEditorStore.getState();

      for (let i = 0; i < EXPECTED_CACHING_SLUGS.length; i++) {
        const slug = EXPECTED_CACHING_SLUGS[i];
        const node = infrastructureRegistry.createInfrastructureNode(slug, {
          position: { x: i * 80, y: i * 40 },
        });
        store.addNode(node);
      }

      const stateAfterAdd = useGraphEditorStore.getState();
      expect(stateAfterAdd.nodes.length).toBe(10);

      // Select specific node
      const firstId = stateAfterAdd.nodes[0].id;
      stateAfterAdd.selectNode(firstId, false);
      expect(useGraphEditorStore.getState().selectedNodeIds).toEqual([firstId]);

      // Move node via command batch
      stateAfterAdd.moveNodesBatch([
        { nodeId: firstId, from: { x: 0, y: 0 }, to: { x: 500, y: 600 } },
      ]);
      const movedNode = useGraphEditorStore.getState().nodes.find((n) => n.id === firstId);
      expect(movedNode?.position).toEqual({ x: 500, y: 600 });

      // Duplicate node
      stateAfterAdd.duplicateSelected();
      const stateAfterDupe = useGraphEditorStore.getState();
      expect(stateAfterDupe.nodes.length).toBe(11);
      const duplicatedNode = stateAfterDupe.nodes.find((n) => n.id !== firstId && n.type === stateAfterAdd.nodes[0].type);
      expect(duplicatedNode).toBeDefined();

      // Delete duplicated node
      stateAfterDupe.selectNode(duplicatedNode!.id, false);
      stateAfterDupe.deleteSelected();
      expect(useGraphEditorStore.getState().nodes.length).toBe(10);
    });

    it("supports undo and redo when modifying cache node configurations", () => {
      const store = useGraphEditorStore.getState();
      const redisNode = infrastructureRegistry.createInfrastructureNode("redis-cache", {
        position: { x: 100, y: 100 },
        label: "Redis Primary",
      });
      store.addNode(redisNode);

      expect(useGraphEditorStore.getState().nodes.length).toBe(1);

      // Update node configuration
      store.updateNodeConfig(redisNode.id, {
        label: "Redis Sentinel Cluster",
        data: {
          ...redisNode.data,
          memoryAllocationMb: 32768,
          deploymentMode: "sentinel-ha",
        },
      });

      const updated = useGraphEditorStore.getState().nodes[0];
      expect(updated.label).toBe("Redis Sentinel Cluster");
      expect((updated.data as any).memoryAllocationMb).toBe(32768);
      expect((updated.data as any).deploymentMode).toBe("sentinel-ha");

      // Verify undo capability
      expect(useGraphEditorStore.getState().canUndo).toBe(true);
      useGraphEditorStore.getState().undo();

      const undone = useGraphEditorStore.getState().nodes[0];
      expect(undone.label).toBe("Redis Primary");
      expect((undone.data as any).memoryAllocationMb).toBe(8192);

      // Verify redo capability
      expect(useGraphEditorStore.getState().canRedo).toBe(true);
      useGraphEditorStore.getState().redo();

      const redone = useGraphEditorStore.getState().nodes[0];
      expect(redone.label).toBe("Redis Sentinel Cluster");
      expect((redone.data as any).memoryAllocationMb).toBe(32768);
    });
  });

  describe("4. End-to-End Cache-to-Database Topology Construction", () => {
    it("constructs an interconnected App Server -> Read-Through Cache -> PostgreSQL Database topology", () => {
      const store = useGraphEditorStore.getState();

      const appServer = infrastructureRegistry.createInfrastructureNode("application-server", {
        position: { x: 50, y: 150 },
        label: "Core API Worker",
      });
      const readThrough = infrastructureRegistry.createInfrastructureNode("read-through-cache", {
        position: { x: 300, y: 150 },
        label: "Transparent Cache Tier",
      });
      const postgres = infrastructureRegistry.createInfrastructureNode("postgresql", {
        position: { x: 600, y: 150 },
        label: "Backing Relational Storage",
      });

      store.addNode(appServer);
      store.addNode(readThrough);
      store.addNode(postgres);

      // 1. App Server -> Read-Through Cache
      store.addEdge({
        id: "edge_app_to_cache",
        source: appServer.id,
        sourceHandle: "service-http-out",
        target: readThrough.id,
        targetHandle: "read-request-in",
        data: {},
      });

      // 2. Read-Through Cache -> PostgreSQL Database (Cache Miss Fetch)
      store.addEdge({
        id: "edge_cache_to_db_fetch",
        source: readThrough.id,
        sourceHandle: "backing-store-fetch-out",
        target: postgres.id,
        targetHandle: "client-connection-in",
        data: {},
      });

      // 3. PostgreSQL Database -> Read-Through Cache (Fresh Data Response)
      store.addEdge({
        id: "edge_db_to_cache_data",
        source: postgres.id,
        sourceHandle: "wal-sender-out",
        target: readThrough.id,
        targetHandle: "backing-store-data-in",
        data: {},
      });

      const current = useGraphEditorStore.getState();
      expect(current.nodes.length).toBe(3);
      expect(current.edges.length).toBe(3);

      // Ensure each node conforms to BaseNodeSchema
      for (const n of current.nodes) {
        const parseRes = BaseNodeSchema.safeParse(n);
        expect(parseRes.success).toBe(true);
      }
    });

    it("verifies multi-category coexistence across Categories 01 to 06", () => {
      const store = useGraphEditorStore.getState();

      // Collect one sample component from all 6 categories
      const samples = [
        ...infrastructureRegistry.listComponentsByCategory("clients-and-user-interfaces").slice(0, 1),
        ...infrastructureRegistry.listComponentsByCategory("dns-cdn-edge").slice(0, 1),
        ...infrastructureRegistry.listComponentsByCategory("networking-and-traffic").slice(0, 1),
        ...infrastructureRegistry.listComponentsByCategory("compute-and-application-services").slice(0, 1),
        ...infrastructureRegistry.listComponentsByCategory("databases-and-persistence").slice(0, 1),
        ...infrastructureRegistry.listComponentsByCategory("caching-and-performance").slice(0, 1),
      ];

      expect(samples.length).toBe(6);

      for (let i = 0; i < samples.length; i++) {
        const comp = samples[i];
        const node = infrastructureRegistry.createInfrastructureNode(comp.id, {
          position: { x: i * 120, y: i * 60 },
          label: `${comp.display.name} #${i + 1}`,
        });
        store.addNode(node);
      }

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(6);

      const categoryIds = new Set(state.nodes.map((n) => n.data.categoryId));
      expect(categoryIds.size).toBe(6);
      expect(categoryIds.has("clients-and-user-interfaces")).toBe(true);
      expect(categoryIds.has("dns-cdn-edge")).toBe(true);
      expect(categoryIds.has("networking-and-traffic")).toBe(true);
      expect(categoryIds.has("compute-and-application-services")).toBe(true);
      expect(categoryIds.has("databases-and-persistence")).toBe(true);
      expect(categoryIds.has("caching-and-performance")).toBe(true);
    });
  });
});
