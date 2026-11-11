import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { buildArchitectureContext } from "../ai-assistant/context/context-builder";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import { aiOrchestrator } from "../ai-assistant/orchestration/ai-orchestrator";

function generateTopology(nodeCount: number): { nodes: BaseNode[]; edges: BaseEdge[] } {
  const nodes: BaseNode[] = [];
  const edges: BaseEdge[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const isGateway = i === 0;
    const isDb = i === nodeCount - 1 || i % 20 === 0;
    const type = isGateway ? "api-gateway" : isDb ? "relational-database" : "compute-service";

    nodes.push({
      id: `node_${i}`,
      type,
      position: { x: (i % 20) * 120, y: Math.floor(i / 20) * 120 },
      label: `Component ${i} (${type})`,
      data: {
        replicas: isDb ? 1 : 2,
        tier: isGateway ? "gateway" : isDb ? "data" : "service",
        maxRps: 1000,
      },
    });

    if (i > 0) {
      edges.push({
        id: `edge_${i - 1}_${i}`,
        source: `node_${i - 1}`,
        target: `node_${i}`,
        data: { protocol: "http", isAsync: false },
      });
    }
  }

  return { nodes, edges };
}

describe("AI Architecture Assistant - Performance & Scalability Benchmarks", () => {
  it("benchmarks context building and tool execution on 100-node graph", async () => {
    const { nodes, edges } = generateTopology(100);

    const start = performance.now();
    const context = buildArchitectureContext({
      nodes,
      edges,
      selectedNodeIds: ["node_50"],
      graphRevision: "rev_100",
    });
    const ctxTime = performance.now() - start;

    console.log(`[Assistant Benchmark 100 nodes] Context build time: ${ctxTime.toFixed(2)}ms | Focused nodes: ${context.focusedNodeIds.length}`);
    expect(ctxTime).toBeLessThan(100); // Strict budget < 100ms
    expect(context.focusedNodeIds.length).toBeGreaterThan(0);

    // Test tool execution on 100 nodes
    const toolStart = performance.now();
    const toolRes = await architectureToolRegistry.executeTool("get_architecture_summary", {}, {
      projectId: "p_100",
      architectureId: "a_100",
      graphRevision: "rev_100",
      nodes,
      edges,
    });
    const toolTime = performance.now() - toolStart;
    console.log(`[Assistant Benchmark 100 nodes] Tool execution time: ${toolTime.toFixed(2)}ms`);
    expect(toolRes.success).toBe(true);
    expect(toolTime).toBeLessThan(100);
  });

  it("benchmarks bounded context selection on 500-node graph", async () => {
    const { nodes, edges } = generateTopology(500);

    const start = performance.now();
    const context = buildArchitectureContext({
      nodes,
      edges,
      selectedNodeIds: ["node_250"],
      graphRevision: "rev_500",
    });
    const ctxTime = performance.now() - start;

    console.log(`[Assistant Benchmark 500 nodes] Context build time: ${ctxTime.toFixed(2)}ms | Focused nodes: ${context.focusedNodeIds.length}`);
    expect(ctxTime).toBeLessThan(150);
    expect(context.isPartial).toBe(false); // Focused 1-hop neighborhood was selected
  });

  it("benchmarks large-scale 1,000-node graph summarization and token bounds", async () => {
    const { nodes, edges } = generateTopology(1000);

    const start = performance.now();
    const context = buildArchitectureContext({
      nodes,
      edges,
      graphRevision: "rev_1000",
    });
    const ctxTime = performance.now() - start;

    console.log(`[Assistant Benchmark 1000 nodes] Context build time: ${ctxTime.toFixed(2)}ms | Prompt length: ${context.promptContext.length}`);
    expect(ctxTime).toBeLessThan(250);
    expect(context.isPartial).toBe(true); // Large graph summarized bounded subset
    expect(context.promptContext.length).toBeLessThan(25000); // Strict token budget bounding

    // Run copilot orchestrator turn on 1000 nodes
    const orchStart = performance.now();
    const resp = await aiOrchestrator.processRequest(
      {
        projectId: "p_1000",
        architectureId: "a_1000",
        message: "Give me an architecture overview.",
        graphRevision: "rev_1000",
      },
      nodes,
      edges
    );
    const orchTime = performance.now() - orchStart;
    console.log(`[Assistant Benchmark 1000 nodes] Orchestrator end-to-end turn: ${orchTime.toFixed(2)}ms`);
    expect(resp.message).toBeDefined();
    expect(orchTime).toBeLessThan(600); // Buffer for parallel vitest runs (< 600ms on 1000 nodes)
  });
});
