import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  SEARCH_AND_DISCOVERY_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_SEARCH_SLUGS = [
  "search-engine",
  "full-text-search-index",
  "search-indexer",
  "autocomplete-service",
  "recommendation-engine",
  "discovery-service",
  "search-cache",
  "query-processor",
] as const;

describe("Phase 05.1.11 — Search & Discovery Infrastructure Library", () => {
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
    it("registers the canonical category 'search-and-discovery'", () => {
      const category = infrastructureRegistry.getCategory(
        SEARCH_AND_DISCOVERY_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("Search & Discovery");
      expect(category?.order).toBe(11);
    });

    it("registers exactly the 8 required Search & Discovery component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        SEARCH_AND_DISCOVERY_CATEGORY_ID
      );
      expect(components.length).toBe(8);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_SEARCH_SLUGS].sort());
    });

    it("ensures every Search & Discovery component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_SEARCH_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Default Configuration & Zod Schemas", () => {
    it("validates all 8 components against their respective Zod config schemas", () => {
      for (const slug of EXPECTED_SEARCH_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def, `Component definition for ${slug} must exist`).toBeDefined();
        if (!def) continue;

        const parseResult = def.configSchema.safeParse(def.defaultConfig);
        expect(
          parseResult.success,
          `Default config for ${slug} failed validation: ${
            !parseResult.success ? JSON.stringify(parseResult.error) : ""
          }`
        ).toBe(true);
      }
    });

    it("ensures no plaintext credentials or sensitive keys exist in default configs", () => {
      for (const slug of EXPECTED_SEARCH_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        const serialized = JSON.stringify(def.defaultConfig).toLowerCase();
        expect(serialized).not.toContain("rawpassword");
        expect(serialized).not.toContain("apikeysecret");
        expect(serialized).not.toContain("privatekey");
        expect(serialized).not.toContain("bearer eyj");
      }
    });
  });

  describe("3. Search Pipeline Connection Semantics & Port Topology", () => {
    it("defines search-accurate input and output ports for every search component", () => {
      for (const slug of EXPECTED_SEARCH_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        expect(def.ports.length).toBeGreaterThanOrEqual(2);

        const hasInput = def.ports.some((p) => p.type === "input");
        const hasOutput = def.ports.some((p) => p.type === "output");
        expect(hasInput, `${slug} must declare at least one input port`).toBe(true);
        expect(hasOutput, `${slug} must declare at least one output port`).toBe(true);

        for (const port of def.ports) {
          expect(port.dataType).toBeTruthy();
          expect(port.capacity).toBeGreaterThan(0);
        }
      }
    });

    it("validates specific port types for core search engine and indexing nodes", () => {
      const searchEngine = infrastructureRegistry.getComponent("search-engine");
      expect(searchEngine).toBeDefined();
      const sePortTypes = searchEngine?.ports.map((p) => p.dataType);
      expect(sePortTypes).toContain("Search_Query");
      expect(sePortTypes).toContain("Search_Result_Set");
      expect(sePortTypes).toContain("Index_Read_Stream");
      expect(sePortTypes).toContain("Search_Cache_Payload");

      const searchIndexer = infrastructureRegistry.getComponent("search-indexer");
      expect(searchIndexer).toBeDefined();
      const siPortTypes = searchIndexer?.ports.map((p) => p.dataType);
      expect(siPortTypes).toContain("Document_Ingestion_Stream");
      expect(siPortTypes).toContain("CDC_Change_Event");
      expect(siPortTypes).toContain("Index_Document_Batch");
      expect(siPortTypes).toContain("DLQ_Payload");

      const queryProc = infrastructureRegistry.getComponent("query-processor");
      expect(queryProc).toBeDefined();
      const qpPortTypes = queryProc?.ports.map((p) => p.dataType);
      expect(qpPortTypes).toContain("Raw_Search_Query");
      expect(qpPortTypes).toContain("Search_Query");
      expect(qpPortTypes).toContain("Query_Execution_Plan");

      const autocomplete = infrastructureRegistry.getComponent("autocomplete-service");
      expect(autocomplete).toBeDefined();
      const acPortTypes = autocomplete?.ports.map((p) => p.dataType);
      expect(acPortTypes).toContain("Autocomplete_Request");
      expect(acPortTypes).toContain("Autocomplete_Response");

      const recsys = infrastructureRegistry.getComponent("recommendation-engine");
      expect(recsys).toBeDefined();
      const recPortTypes = recsys?.ports.map((p) => p.dataType);
      expect(recPortTypes).toContain("User_Signal_Stream");
      expect(recPortTypes).toContain("Candidate_Pool_Stream");
      expect(recPortTypes).toContain("Recommendation_Result");
    });
  });

  describe("4. Graph Editor Store & Lifecycle Integration", () => {
    it("creates, selects, updates, and removes search & discovery nodes in the store", () => {
      const store = useGraphEditorStore.getState();

      // Create a search engine node
      const baseNode = infrastructureRegistry.createInfrastructureNode(
        "search-engine",
        {
          position: { x: 300, y: 200 },
          label: "Primary OpenSearch Cluster",
        }
      );

      store.addNode(baseNode);
      expect(useGraphEditorStore.getState().nodes).toHaveLength(1);

      // Verify node adheres to BaseNodeSchema
      const validated = BaseNodeSchema.safeParse(
        useGraphEditorStore.getState().nodes[0]
      );
      expect(validated.success).toBe(true);

      // Select node
      store.selectNode(baseNode.id, false);
      expect(useGraphEditorStore.getState().selectedNodeIds).toEqual([baseNode.id]);

      // Update node data (e.g. adjust shard count)
      store.updateNodeConfig(baseNode.id, {
        data: {
          ...baseNode.data,
          shardCount: 10,
          replicaCount: 2,
        },
      });

      const updatedNode = useGraphEditorStore.getState().nodes[0];
      expect(updatedNode.data.shardCount).toBe(10);
      expect(updatedNode.data.replicaCount).toBe(2);

      // Remove node
      store.deleteNodeById(baseNode.id);
      expect(useGraphEditorStore.getState().nodes).toHaveLength(0);
    });

    it("builds an end-to-end Search Pipeline graph topology", () => {
      const store = useGraphEditorStore.getState();

      // 1. Raw Query -> Query Processor
      const qpNode = infrastructureRegistry.createInfrastructureNode("query-processor", {
        position: { x: 100, y: 200 },
        label: "Query Tokenizer & Rewriter",
      });

      // 2. Query Processor -> Search Cache
      const cacheNode = infrastructureRegistry.createInfrastructureNode("search-cache", {
        position: { x: 350, y: 150 },
        label: "Redis Bitset Query Cache",
      });

      // 3. Search Cache / Processor -> Search Engine
      const engineNode = infrastructureRegistry.createInfrastructureNode("search-engine", {
        position: { x: 600, y: 200 },
        label: "OpenSearch Cluster",
      });

      // 4. Search Indexer -> Full-Text Search Index
      const indexerNode = infrastructureRegistry.createInfrastructureNode("search-indexer", {
        position: { x: 350, y: 350 },
        label: "CDC Ingestion Pipeline",
      });

      const indexNode = infrastructureRegistry.createInfrastructureNode("full-text-search-index", {
        position: { x: 600, y: 350 },
        label: "Lucene Postings Index",
      });

      store.addNode(qpNode);
      store.addNode(cacheNode);
      store.addNode(engineNode);
      store.addNode(indexerNode);
      store.addNode(indexNode);

      expect(useGraphEditorStore.getState().nodes).toHaveLength(5);

      // Add Pipeline Edges
      store.addEdge({
        id: "edge-qp-cache",
        source: qpNode.id,
        target: cacheNode.id,
        sourceHandle: "processed-query-out",
        targetHandle: "cache-lookup-in",
        data: {},
      });

      store.addEdge({
        id: "edge-cache-engine",
        source: cacheNode.id,
        target: engineNode.id,
        sourceHandle: "cached-result-out",
        targetHandle: "query-in",
        data: {},
      });

      store.addEdge({
        id: "edge-indexer-index",
        source: indexerNode.id,
        target: indexNode.id,
        sourceHandle: "index-batch-out",
        targetHandle: "index-write-in",
        data: {},
      });

      store.addEdge({
        id: "edge-engine-index",
        source: engineNode.id,
        target: indexNode.id,
        sourceHandle: "index-lookup-in",
        targetHandle: "index-read-out",
        data: {},
      });

      expect(useGraphEditorStore.getState().edges).toHaveLength(4);
    });
  });
});
