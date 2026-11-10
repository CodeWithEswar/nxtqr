import { describe, it, expect, beforeEach } from "vitest";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import { architectureHealthEngine } from "@nxtqr/architecture-intelligence";
import type { BaseNode, BaseEdge } from "@/features/graph-engine/schemas/graph.schema";

describe("Architecture Health Analysis - Graph Editor Store Integration", () => {
  beforeEach(() => {
    architectureHealthEngine.reset();
    useGraphEditorStore.setState({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      isHealthOpen: false,
      healthPanelWidth: 340,
    });
  });

  it("toggles and updates health panel state in graph editor store", () => {
    expect(useGraphEditorStore.getState().isHealthOpen).toBe(false);

    useGraphEditorStore.getState().toggleHealth();
    expect(useGraphEditorStore.getState().isHealthOpen).toBe(true);

    useGraphEditorStore.getState().setHealthOpen(false);
    expect(useGraphEditorStore.getState().isHealthOpen).toBe(false);

    useGraphEditorStore.getState().setHealthPanelWidth(420);
    expect(useGraphEditorStore.getState().healthPanelWidth).toBe(420);
  });

  it("evaluates health report for nodes loaded into graph editor store", () => {
    const gateway: BaseNode = {
      id: "gw_1",
      type: "api-gateway",
      position: { x: 100, y: 100 },
      data: {
        componentType: "api-gateway",
        replicas: 2,
        rateLimitingEnabled: true,
        highAvailability: true,
      },
    };

    const service: BaseNode = {
      id: "svc_1",
      type: "container-service",
      position: { x: 300, y: 100 },
      data: {
        componentType: "container-service",
        replicas: 2,
        highAvailability: true,
      },
    };

    const edge: BaseEdge = {
      id: "e1",
      source: "gw_1",
      target: "svc_1",
      data: { protocol: "HTTPS", relationshipKind: "request-response" },
    };

    useGraphEditorStore.setState({ nodes: [gateway, service], edges: [edge] });

    const nodes = useGraphEditorStore.getState().nodes;
    const edges = useGraphEditorStore.getState().edges;

    const report = architectureHealthEngine.assessGraph(nodes, edges);

    expect(report.status).toBe("assessed");
    expect(report.overallScore).toBeGreaterThanOrEqual(80);
    expect(report.metrics.totalComponents).toBe(2);
    expect(report.metrics.totalConnections).toBe(1);
    expect(report.dimensions.security.findings.length).toBe(0);
  });

  it("selects and focuses affected nodes on graph selection change", () => {
    const nodes: BaseNode[] = [
      { id: "client_1", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "db_leak", type: "relational-database", position: { x: 200, y: 0 }, data: {} },
    ];
    const edges: BaseEdge[] = [
      { id: "edge_leak", source: "client_1", target: "db_leak", data: {} },
    ];

    useGraphEditorStore.setState({ nodes, edges });

    const report = architectureHealthEngine.assessGraph(nodes, edges);
    const criticalFinding = report.allFindings.find((f) => f.ruleId === "SEC-EXPOSE-001");

    expect(criticalFinding).toBeDefined();

    // Select the finding's target node
    if (criticalFinding) {
      useGraphEditorStore.getState().selectNode(criticalFinding.affectedNodeIds[0]);
      expect(useGraphEditorStore.getState().selectedNodeIds).toEqual([criticalFinding.affectedNodeIds[0]]);
    }
  });
});
