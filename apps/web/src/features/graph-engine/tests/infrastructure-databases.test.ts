import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  DATABASES_AND_PERSISTENCE_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_DATABASE_SLUGS = [
  "relational-database",
  "postgresql",
  "mysql",
  "distributed-sql-database",
  "document-database",
  "key-value-database",
  "wide-column-database",
  "graph-database",
  "time-series-database",
  "vector-database",
  "in-memory-database",
  "database-primary",
  "read-replica",
  "database-cluster",
  "data-warehouse",
] as const;

describe("Phase 05.1.5 — Databases & Persistence Infrastructure Library", () => {
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
    it("registers the canonical category 'databases-and-persistence'", () => {
      const category = infrastructureRegistry.getCategory(DATABASES_AND_PERSISTENCE_CATEGORY_ID);
      expect(category).toBeDefined();
      expect(category?.name).toBe("Databases & Persistence");
      expect(category?.order).toBe(5);
    });

    it("registers exactly the 15 required Databases & Persistence component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(DATABASES_AND_PERSISTENCE_CATEGORY_ID);
      expect(components.length).toBe(15);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_DATABASE_SLUGS].sort());
    });

    it("ensures every Databases & Persistence component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_DATABASE_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Node Factory & Graph Schema Compliance", () => {
    it("creates valid BaseNode instances conforming to @nxtqr/graph-schema", () => {
      for (const slug of EXPECTED_DATABASE_SLUGS) {
        const node = infrastructureRegistry.createInfrastructureNode(slug, {
          position: { x: 300, y: 400 },
          label: `Database Node ${slug}`,
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
        expect(node.label).toBe(`Database Node ${slug}`);
        expect(node.ports).toBeDefined();
        expect(node.ports!.length).toBeGreaterThanOrEqual(1);
        expect(node.data.isInfrastructure).toBe(true);
        expect(node.data.categoryId).toBe(DATABASES_AND_PERSISTENCE_CATEGORY_ID);
      }
    });

    it("correctly assigns protocol-aware ports for PostgreSQL and Vector Database", () => {
      const pgNode = infrastructureRegistry.createInfrastructureNode("postgresql");
      expect(pgNode.ports).toBeDefined();

      const clientIn = pgNode.ports?.find((p) => p.id === "client-connection-in");
      expect(clientIn).toBeDefined();
      expect(clientIn?.type).toBe("input");
      expect(clientIn?.dataType).toBe("Postgres_Protocol");

      const walOut = pgNode.ports?.find((p) => p.id === "wal-sender-out");
      expect(walOut).toBeDefined();
      expect(walOut?.type).toBe("output");
      expect(walOut?.dataType).toBe("WAL_Stream");

      const vectorNode = infrastructureRegistry.createInfrastructureNode("vector-database");
      expect(vectorNode.ports).toBeDefined();

      const queryIn = vectorNode.ports?.find((p) => p.id === "vector-query-in");
      expect(queryIn).toBeDefined();
      expect(queryIn?.dataType).toBe("Vector_Query");

      const embedIn = vectorNode.ports?.find((p) => p.id === "embedding-ingest-in");
      expect(embedIn).toBeDefined();
      expect(embedIn?.dataType).toBe("Embedding_Payload");
    });

    it("correctly models Primary-Replica topologies with compatible replication stream ports", () => {
      const primaryNode = infrastructureRegistry.createInfrastructureNode("database-primary");
      const replicaNode = infrastructureRegistry.createInfrastructureNode("read-replica");

      const primaryOut = primaryNode.ports?.find((p) => p.id === "replication-stream-out");
      const replicaIn = replicaNode.ports?.find((p) => p.id === "replication-stream-in");

      expect(primaryOut).toBeDefined();
      expect(replicaIn).toBeDefined();
      expect(primaryOut?.dataType).toBe("Replication_Stream");
      expect(replicaIn?.dataType).toBe("Replication_Stream");
    });
  });

  describe("3. Editor Store & Command Integration", () => {
    it("adds database nodes to the store and updates selections cleanly", () => {
      const { addNode, selectNode } = useGraphEditorStore.getState();

      const pgNode = infrastructureRegistry.createInfrastructureNode("postgresql", {
        position: { x: 100, y: 150 },
      });
      addNode(pgNode);

      const redisNode = infrastructureRegistry.createInfrastructureNode("in-memory-database", {
        position: { x: 350, y: 150 },
      });
      addNode(redisNode);

      const stateAfterAdd = useGraphEditorStore.getState();
      expect(stateAfterAdd.nodes.length).toBe(2);

      selectNode(pgNode.id, false);
      expect(useGraphEditorStore.getState().selectedNodeIds).toEqual([pgNode.id]);
    });

    it("updates database component configuration via store commands", () => {
      const { addNode, updateNodeConfig } = useGraphEditorStore.getState();

      const warehouseNode = infrastructureRegistry.createInfrastructureNode("data-warehouse", {
        position: { x: 200, y: 200 },
      });
      addNode(warehouseNode);

      updateNodeConfig(warehouseNode.id, {
        label: "Enterprise Analytics Warehouse",
        data: {
          analyticalEngine: "clickhouse-olap",
          concurrencyLimit: 64,
          assumedDataVolumeTb: 100,
        },
      });

      const updated = useGraphEditorStore.getState().nodes.find((n) => n.id === warehouseNode.id);
      expect(updated?.label).toBe("Enterprise Analytics Warehouse");
      expect((updated?.data as any).analyticalEngine).toBe("clickhouse-olap");
      expect((updated?.data as any).concurrencyLimit).toBe(64);
    });
  });

  describe("4. Multi-Tier End-to-End Persistence Pipeline", () => {
    it("builds a full multi-tier architecture connecting Categories 01 to 05", () => {
      const { addNode, addEdge } = useGraphEditorStore.getState();

      // Category 01: Client
      const browser = infrastructureRegistry.createInfrastructureNode("web-browser", {
        position: { x: 50, y: 100 },
      });
      // Category 03: API Gateway
      const gateway = infrastructureRegistry.createInfrastructureNode("api-gateway", {
        position: { x: 300, y: 100 },
      });
      // Category 04: Backend Microservice
      const service = infrastructureRegistry.createInfrastructureNode("microservice", {
        position: { x: 550, y: 100 },
      });
      // Category 05: Database Primary
      const dbPrimary = infrastructureRegistry.createInfrastructureNode("database-primary", {
        position: { x: 800, y: 50 },
      });
      // Category 05: Read Replica
      const dbReplica = infrastructureRegistry.createInfrastructureNode("read-replica", {
        position: { x: 1050, y: 50 },
      });
      // Category 05: In-Memory Database (Cache)
      const cache = infrastructureRegistry.createInfrastructureNode("in-memory-database", {
        position: { x: 800, y: 250 },
      });
      // Category 05: Vector Database
      const vectorDb = infrastructureRegistry.createInfrastructureNode("vector-database", {
        position: { x: 800, y: 400 },
      });
      // Category 05: Data Warehouse
      const warehouse = infrastructureRegistry.createInfrastructureNode("data-warehouse", {
        position: { x: 1050, y: 400 },
      });

      addNode(browser);
      addNode(gateway);
      addNode(service);
      addNode(dbPrimary);
      addNode(dbReplica);
      addNode(cache);
      addNode(vectorDb);
      addNode(warehouse);

      // Connect Browser -> Gateway
      addEdge({
        id: "edge_browser_gateway",
        source: browser.id,
        target: gateway.id,
        type: "bezier",
        sourceHandle: "https-out",
        targetHandle: "client-traffic-in",
        status: "idle",
        label: "HTTPS Traffic",
        data: {},
      });

      // Connect Gateway -> Service
      addEdge({
        id: "edge_gateway_service",
        source: gateway.id,
        target: service.id,
        type: "bezier",
        sourceHandle: "upstream-service-out",
        targetHandle: "grpc-in",
        status: "idle",
        label: "Routed gRPC",
        data: {},
      });

      // Connect Service -> Primary DB
      addEdge({
        id: "edge_service_db_primary",
        source: service.id,
        target: dbPrimary.id,
        type: "bezier",
        sourceHandle: "data-egress-out",
        targetHandle: "primary-write-in",
        status: "idle",
        label: "Write Transactions",
        data: {},
      });

      // Connect Primary DB -> Read Replica
      addEdge({
        id: "edge_primary_replica",
        source: dbPrimary.id,
        target: dbReplica.id,
        type: "bezier",
        sourceHandle: "replication-stream-out",
        targetHandle: "replication-stream-in",
        status: "idle",
        label: "WAL Streaming",
        data: {},
      });

      // Connect Service -> In-Memory Cache
      addEdge({
        id: "edge_service_cache",
        source: service.id,
        target: cache.id,
        type: "bezier",
        sourceHandle: "data-egress-out",
        targetHandle: "memory-command-in",
        status: "idle",
        label: "Low-Latency Cache",
        data: {},
      });

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(8);
      expect(state.edges.length).toBe(5);
    });
  });

  describe("5. Scalability & Performance Benchmark", () => {
    it("instantiates 1,000 infrastructure nodes across all 5 categories (61 components) in <150ms", () => {
      const allComponents = [
        ...infrastructureRegistry.listComponentsByCategory("clients-and-user-interfaces"),
        ...infrastructureRegistry.listComponentsByCategory("dns-cdn-edge"),
        ...infrastructureRegistry.listComponentsByCategory("networking-and-traffic"),
        ...infrastructureRegistry.listComponentsByCategory("compute-and-application-services"),
        ...infrastructureRegistry.listComponentsByCategory("databases-and-persistence"),
      ];

      expect(allComponents.length).toBe(61);

      const targetCount = 1000;
      const t0 = performance.now();

      const createdNodes = [];
      for (let i = 0; i < targetCount; i++) {
        const comp = allComponents[i % allComponents.length];
        const node = infrastructureRegistry.createInfrastructureNode(comp.id, {
          position: { x: (i % 50) * 40, y: Math.floor(i / 50) * 40 },
          label: `${comp.display.name} #${i + 1}`,
        });
        createdNodes.push(node);
      }

      const elapsed = performance.now() - t0;
      expect(createdNodes.length).toBe(targetCount);
      expect(elapsed).toBeLessThan(150); // Hard threshold: <150ms budget
    });
  });
});

