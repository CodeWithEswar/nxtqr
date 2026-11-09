import { describe, it, expect } from "vitest";
import {
  GraphDocumentSchema,
  BaseNodeSchema,
  ClipboardPayloadSchema,
  migrateGraphDocument,
  CURRENT_GRAPH_SCHEMA_VERSION,
} from "./index";

describe("Graph Schema & Migrations", () => {
  it("validates valid graph document structure", () => {
    const doc = {
      id: "doc_123",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "system-design",
      title: "Distributed Cache Architecture",
      nodes: [
        {
          id: "node_1",
          type: "cache",
          position: { x: 100, y: 150 },
          data: { engine: "redis" },
        },
      ],
      edges: [
        {
          id: "edge_1",
          source: "node_1",
          target: "node_2",
          data: {},
        },
      ],
      metadata: {},
    };

    const parsed = GraphDocumentSchema.parse(doc);
    expect(parsed.id).toBe("doc_123");
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.edges).toHaveLength(1);
    expect(parsed.viewport).toEqual({ x: 0, y: 0, zoom: 1.0 }); // defaulted
  });

  it("migrates older document version through migration pipeline", () => {
    const raw = {
      id: "doc_old",
      schemaVersion: 1,
      visualizerType: "rag",
      title: "RAG Pipeline",
      nodes: [],
      edges: [],
    };

    const migrated = migrateGraphDocument(raw);
    expect(migrated.schemaVersion).toBe(CURRENT_GRAPH_SCHEMA_VERSION);
    expect(migrated.title).toBe("RAG Pipeline");
  });

  it("validates clipboard payload with versioned schema and offset positions", () => {
    const clipboardData = {
      version: CURRENT_GRAPH_SCHEMA_VERSION,
      nodes: [
        {
          id: "clip_node_1",
          type: "process",
          position: { x: 50, y: 50 },
          dimensions: { width: 180, height: 80 },
          data: { label: "Worker" },
        },
      ],
      edges: [],
    };

    const parsedNode = BaseNodeSchema.parse(clipboardData.nodes[0]);
    expect(parsedNode.dimensions?.width).toBe(180);
    expect(parsedNode.dimensions?.height).toBe(80);

    const parsedClipboard = ClipboardPayloadSchema.parse(clipboardData);
    expect(parsedClipboard.version).toBe(CURRENT_GRAPH_SCHEMA_VERSION);
    expect(parsedClipboard.nodes).toHaveLength(1);
  });
});
