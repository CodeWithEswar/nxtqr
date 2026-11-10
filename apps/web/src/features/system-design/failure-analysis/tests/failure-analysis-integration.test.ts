import { describe, it, expect, beforeEach } from "vitest";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import { failureAnalysisEngine } from "@nxtqr/architecture-intelligence";
import type { BaseNode, BaseEdge } from "@/features/graph-engine/schemas/graph.schema";

describe("Failure Analysis & SPOF Detection - Graph Editor Store Integration", () => {
  beforeEach(() => {
    failureAnalysisEngine.reset();
    useGraphEditorStore.setState({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      isFailureAnalysisOpen: false,
      failureAnalysisPanelWidth: 360,
    });
  });

  it("toggles and updates failure analysis panel state in graph editor store", () => {
    expect(useGraphEditorStore.getState().isFailureAnalysisOpen).toBe(false);

    useGraphEditorStore.getState().toggleFailureAnalysis();
    expect(useGraphEditorStore.getState().isFailureAnalysisOpen).toBe(true);

    useGraphEditorStore.getState().setFailureAnalysisOpen(false);
    expect(useGraphEditorStore.getState().isFailureAnalysisOpen).toBe(false);

    useGraphEditorStore.getState().setFailureAnalysisPanelWidth(440);
    expect(useGraphEditorStore.getState().failureAnalysisPanelWidth).toBe(440);
  });

  it("evaluates failure report for nodes loaded into graph editor store", () => {
    const gateway: BaseNode = {
      id: "gw_1",
      type: "api-gateway",
      position: { x: 100, y: 100 },
      data: {
        componentType: "api-gateway",
        replicas: 1, // single instance cut vertex
      },
    };

    const service: BaseNode = {
      id: "svc_1",
      type: "container-service",
      position: { x: 300, y: 100 },
      data: {
        componentType: "container-service",
        replicas: 1,
      },
    };

    const database: BaseNode = {
      id: "db_1",
      type: "relational-database",
      position: { x: 500, y: 100 },
      data: {
        componentType: "relational-database",
        multiAz: false,
        readReplicas: 0,
      },
    };

    const e1: BaseEdge = {
      id: "e1",
      source: "gw_1",
      target: "svc_1",
      data: { protocol: "HTTPS", relationshipKind: "request-response" },
    };

    const e2: BaseEdge = {
      id: "e2",
      source: "svc_1",
      target: "db_1",
      data: { protocol: "SQL", relationshipKind: "database-access" },
    };

    useGraphEditorStore.setState({ nodes: [gateway, service, database], edges: [e1, e2] });

    const nodes = useGraphEditorStore.getState().nodes;
    const edges = useGraphEditorStore.getState().edges;

    const report = failureAnalysisEngine.analyzeGraph(nodes, edges);

    expect(report.metrics.totalComponents).toBe(3);
    expect(report.metrics.spofCount).toBeGreaterThan(0);

    const dbSpof = report.findings.find((f) => f.ruleId === "DB-SPOF-001");
    expect(dbSpof).toBeDefined();

    // Select the finding's target node in store
    if (dbSpof) {
      useGraphEditorStore.getState().selectNode(dbSpof.affectedNodeIds[0]);
      expect(useGraphEditorStore.getState().selectedNodeIds).toEqual(["db_1"]);
    }
  });

  it("calculates blast radius interactively for a failed node", () => {
    const nodes: BaseNode[] = [
      { id: "edge_gw", type: "api-gateway", position: { x: 0, y: 0 }, data: { replicas: 1 } },
      { id: "api_server", type: "container-service", position: { x: 200, y: 0 }, data: { replicas: 1 } },
      { id: "db_primary", type: "relational-database", position: { x: 400, y: 0 }, data: { multiAz: true } },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "edge_gw", target: "api_server", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e2", source: "api_server", target: "db_primary", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ];

    useGraphEditorStore.setState({ nodes, edges });

    const blast = failureAnalysisEngine.calculateBlastRadius("db_primary", nodes, edges);
    expect(blast.targetId).toBe("db_primary");
    expect(blast.directImpactedNodeIds).toContain("api_server");
    expect(blast.indirectImpactedNodeIds).toContain("edge_gw");
    expect(blast.blastRadiusScore).toBeGreaterThan(0);
  });
});
