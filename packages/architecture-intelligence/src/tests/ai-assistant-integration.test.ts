import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { aiOrchestrator } from "../ai-assistant/orchestration/ai-orchestrator";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import type { AIStreamChunk } from "../ai-assistant/contracts/ai-assistant.types";

describe("AI Architecture Assistant - Multi-Engine Integration Tests", () => {
  const nodes: BaseNode[] = [
    {
      id: "client_web",
      type: "web-app",
      position: { x: 50, y: 150 },
      label: "Web App Client",
      data: { tier: "client" },
    },
    {
      id: "gateway_public",
      type: "api-gateway",
      position: { x: 250, y: 150 },
      label: "Public API Gateway",
      data: { replicas: 2, tlsTermination: true, authRequired: true },
    },
    {
      id: "order_service",
      type: "compute-service",
      position: { x: 450, y: 150 },
      label: "Order Service",
      data: { replicas: 1, maxRps: 500 },
    },
    {
      id: "orders_postgres",
      type: "relational-database",
      position: { x: 650, y: 150 },
      label: "Orders Postgres (Single Instance)",
      data: { replicas: 1, maxRps: 300, readOnlyReplicas: 0 },
    },
  ];

  const edges: BaseEdge[] = [
    {
      id: "edge_client_gw",
      source: "client_web",
      target: "gateway_public",
      data: { protocol: "https", isAsync: false, tls: true },
    },
    {
      id: "edge_gw_orders",
      source: "gateway_public",
      target: "order_service",
      data: { protocol: "http", isAsync: false },
    },
    {
      id: "edge_orders_db",
      source: "order_service",
      target: "orders_postgres",
      data: { protocol: "tcp", isAsync: false },
    },
  ];

  describe("Read-Only Intelligence Tools Execution", () => {
    const execCtx = {
      projectId: "proj_test",
      architectureId: "arch_test",
      graphRevision: "rev_001",
      nodes,
      edges,
    };

    it("executes get_architecture_summary tool accurately", async () => {
      const res = await architectureToolRegistry.executeTool("get_architecture_summary", {}, execCtx);
      expect(res.success).toBe(true);
      expect((res.result as any).totalNodes).toBe(4);
      expect((res.result as any).totalEdges).toBe(3);
    });

    it("executes get_component_details tool for specific target", async () => {
      const res = await architectureToolRegistry.executeTool(
        "get_component_details",
        { nodeId: "order_service" },
        execCtx
      );
      expect(res.success).toBe(true);
      expect((res.result as any).id).toBe("order_service");
      expect((res.result as any).incomingConnections).toHaveLength(1);
      expect((res.result as any).outgoingConnections).toHaveLength(1);
    });

    it("executes get_spof_findings and traces blast radius", async () => {
      const res = await architectureToolRegistry.executeTool("get_spof_findings", {}, execCtx);
      expect(res.success).toBe(true);
      expect((res.result as any).spofCount).toBeGreaterThanOrEqual(1);
    });

    it("executes get_bottleneck_findings and returns performance limits", async () => {
      const res = await architectureToolRegistry.executeTool("get_bottleneck_findings", {}, execCtx);
      expect(res.success).toBe(true);
      expect((res.result as any).bottlenecks).toBeDefined();
    });

    it("executes get_documentation tool for redis-cache", async () => {
      const res = await architectureToolRegistry.executeTool(
        "get_documentation",
        { query: "redis-cache" },
        execCtx
      );
      expect(res.success).toBe(true);
      expect((res.result as any).type).toBeDefined();
    });
  });

  describe("End-to-End Orchestrator Flow with Streaming", () => {
    it("handles SPOF investigation question with streaming chunks and verified citations", async () => {
      const chunks: AIStreamChunk[] = [];
      const response = await aiOrchestrator.processRequest(
        {
          projectId: "proj_test",
          architectureId: "arch_test",
          message: "What are the single points of failure in my system?",
          graphRevision: "rev_001",
          mode: "analyze",
        },
        nodes,
        edges,
        [],
        (chunk) => chunks.push(chunk)
      );

      expect(response.message.content).toContain("Single Point of Failure");
      expect(response.citations.length).toBeGreaterThan(0);

      // Verify stream chunk sequence
      const types = chunks.map((c) => c.type);
      expect(types).toContain("tool_call_start");
      expect(types).toContain("tool_call_result");
      expect(types).toContain("token");
      expect(types).toContain("citation");
      expect(types).toContain("done");
    });

    it("generates and deterministically validates What-If proposal when user asks to add cache", async () => {
      const chunks: AIStreamChunk[] = [];
      const response = await aiOrchestrator.processRequest(
        {
          projectId: "proj_test",
          architectureId: "arch_test",
          message: "Can you propose and add a cache in front of the database to offload read traffic?",
          graphRevision: "rev_001",
          mode: "propose",
        },
        nodes,
        edges,
        [],
        (chunk) => chunks.push(chunk)
      );

      expect(response.proposal).toBeDefined();
      expect(response.proposal?.title).toContain("Caching");
      expect(response.proposal?.validationStatus).toBe("valid");
      expect(response.proposal?.operations.length).toBeGreaterThan(0);

      // Ensure proposal chunk was streamed
      const proposalChunk = chunks.find((c) => c.type === "proposal");
      expect(proposalChunk).toBeDefined();
      expect(proposalChunk?.proposal?.validationStatus).toBe("valid");
    });
  });
});
