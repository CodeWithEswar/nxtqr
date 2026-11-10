import { describe, it, expect, beforeEach } from "vitest";
import { useGraphEditorStore } from "../store/graph-editor-store";
import { architectureValidationEngine } from "@nxtqr/architecture-validation";
import type { BaseNode } from "../schemas/graph.schema";

describe("Architecture Validation Engine - Graph Editor Integration", () => {
  beforeEach(() => {
    architectureValidationEngine.reset();
    useGraphEditorStore.setState({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      canUndo: false,
      canRedo: false,
    });
  });

  it("validates and allows connection from API Gateway to Microservice with HTTPS", () => {
    const gateway: BaseNode = {
      id: "gw_1",
      type: "api-gateway",
      position: { x: 100, y: 100 },
      data: {
        componentType: "api-gateway",
        categoryId: "networking-and-traffic",
        tlsTermination: true,
      },
      ports: [
        { id: "route-out", name: "HTTPS Out", type: "output", dataType: "HTTPS_Request" },
      ],
    };

    const service: BaseNode = {
      id: "svc_1",
      type: "microservice",
      position: { x: 400, y: 100 },
      data: {
        componentType: "microservice",
        categoryId: "compute-and-application-services",
        tlsTermination: true,
      },
      ports: [
        { id: "http-in", name: "HTTP(S) In", type: "input", dataType: "HTTPS_Request" },
      ],
    };

    useGraphEditorStore.setState({ nodes: [gateway, service] });

    const candidate = {
      sourceNodeId: "gw_1",
      targetNodeId: "svc_1",
      sourceHandleId: "route-out",
      targetHandleId: "http-in",
    };

    const result = architectureValidationEngine.validateConnection(
      candidate,
      [gateway, service],
      [],
    );

    expect(result.valid).toBe(true);
    expect(result.decision).toBe("allowed");
    expect(result.resolvedRelationship).toBe("request-response");
    expect(result.resolvedProtocolId).toBe("https");

    // Establish edge via store
    useGraphEditorStore.getState().addEdge({
      id: "edge_1",
      source: "gw_1",
      target: "svc_1",
      sourceHandle: "route-out",
      targetHandle: "http-in",
      data: {
        relationshipKind: result.resolvedRelationship,
        protocol: result.resolvedProtocolId,
      },
    });

    expect(useGraphEditorStore.getState().edges.length).toBe(1);
    expect(useGraphEditorStore.getState().canUndo).toBe(true);
  });

  it("strictly rejects invalid connections such as connecting two output ports", () => {
    const clientA: BaseNode = {
      id: "client_1",
      type: "web-browser",
      position: { x: 100, y: 100 },
      data: { componentType: "web-browser", categoryId: "clients-and-user-interfaces" },
      ports: [{ id: "out_a", name: "Out A", type: "output", dataType: "HTTP_Request" }],
    };

    const clientB: BaseNode = {
      id: "client_2",
      type: "mobile-application",
      position: { x: 400, y: 100 },
      data: { componentType: "mobile-application", categoryId: "clients-and-user-interfaces" },
      ports: [{ id: "out_b", name: "Out B", type: "output", dataType: "HTTP_Request" }],
    };

    const res = architectureValidationEngine.validateConnection(
      {
        sourceNodeId: "client_1",
        targetNodeId: "client_2",
        sourceHandleId: "out_a",
        targetHandleId: "out_b",
      },
      [clientA, clientB],
      [],
    );

    expect(res.valid).toBe(false);
    expect(res.decision).toBe("rejected");
    expect(res.findings.some((f) => f.ruleId === "DIR-002-BOTH-OUTPUTS")).toBe(true);
  });

  it("supports undo and redo for established edges while preserving graph integrity", () => {
    const nodeA: BaseNode = {
      id: "node_a",
      type: "application-server",
      position: { x: 100, y: 100 },
      data: { componentType: "application-server", categoryId: "compute-and-application-services" },
      ports: [{ id: "out", name: "Out", type: "output", dataType: "HTTP_Request" }],
    };

    const nodeB: BaseNode = {
      id: "node_b",
      type: "redis-cache",
      position: { x: 400, y: 100 },
      data: { componentType: "redis-cache", categoryId: "caching-and-performance" },
      ports: [{ id: "in", name: "In", type: "input", dataType: "Redis_Command" }],
    };

    useGraphEditorStore.setState({ nodes: [nodeA, nodeB] });

    useGraphEditorStore.getState().addEdge({
      id: "edge_ab",
      source: "node_a",
      target: "node_b",
      sourceHandle: "out",
      targetHandle: "in",
      data: { relationshipKind: "cache-access", protocol: "redis" },
    });

    expect(useGraphEditorStore.getState().edges.length).toBe(1);

    // Undo edge
    useGraphEditorStore.getState().undo();
    expect(useGraphEditorStore.getState().edges.length).toBe(0);

    // Redo edge
    useGraphEditorStore.getState().redo();
    expect(useGraphEditorStore.getState().edges.length).toBe(1);
    expect(useGraphEditorStore.getState().edges[0].id).toBe("edge_ab");
  });
});
