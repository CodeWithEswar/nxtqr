import { describe, it, expect } from "vitest";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import { NextRequest } from "next/server";
import { useExecutionStore } from "../store/execution-store";
import { POST as orchestratePost } from "@/app/api/architecture/simulations/orchestrate/route";

const SAMPLE_NODES: BaseNode[] = [
  { id: "gw_1", type: "api-gateway", position: { x: 0, y: 0 }, label: "Gateway", data: { componentType: "api-gateway", capacityRps: 2000 } },
  { id: "svc_1", type: "service", position: { x: 200, y: 0 }, label: "API Service", data: { componentType: "service", capacityRps: 600 } },
  { id: "db_1", type: "database", position: { x: 400, y: 0 }, label: "Postgres", data: { componentType: "database", capacityRps: 300, replicas: 1 } },
];

const SAMPLE_EDGES: BaseEdge[] = [
  { id: "e_1", source: "gw_1", target: "svc_1", type: "smoothstep", data: {} },
  { id: "e_2", source: "svc_1", target: "db_1", type: "smoothstep", data: {} },
];

describe("Phase 05.4.25 Unified Workspace Store & Hardened API Integration", () => {
  it("integrates capability inspection, cross-module pipeline, checkpoints, and timeline search in useExecutionStore", () => {
    const store = useExecutionStore.getState();

    store.toggleUnifiedStudio(true);
    expect(useExecutionStore.getState().isUnifiedStudioOpen).toBe(true);

    const inspection = store.inspectTopologyCapabilities(SAMPLE_NODES, SAMPLE_EDGES);
    expect(inspection.supportedCapabilities.length).toBeGreaterThan(0);

    const pipelineResult = store.runCrossModulePipeline(SAMPLE_NODES, SAMPLE_EDGES, {
      incomingRps: 200,
      seed: 42,
    });
    expect(pipelineResult.outcome).toBe("success");
    expect(useExecutionStore.getState().trace?.runId).toBe(pipelineResult.runId);
    expect(useExecutionStore.getState().unifiedFindings.length).toBeGreaterThanOrEqual(1);

    const runRec = store.runUnifiedSimulation(SAMPLE_NODES, SAMPLE_EDGES, {
      incomingRps: 200,
      checkpointInterval: 2,
    });
    expect(runRec.state).toBe("completed");
    expect(useExecutionStore.getState().unifiedRunRecord?.checkpoints.length).toBeGreaterThanOrEqual(2);

    store.seekUnifiedCheckpoint(1);
    expect(useExecutionStore.getState().playbackState.currentStepIndex).toBe(1);

    store.setTimelineSearchQuery("Postgres");
    expect(useExecutionStore.getState().timelineSearchQuery).toBe("Postgres");

    store.cancelUnifiedSimulation(runRec.runId);
    store.stop();
  });

  it("enforces authentication, payload validation, and orchestration execution on POST /api/architecture/simulations/orchestrate", async () => {
    // 1. Unauthenticated request blocked cleanly with 401
    const unauthReq = new NextRequest("http://localhost:3000/api/architecture/simulations/orchestrate", {
      method: "POST",
      body: JSON.stringify({ mode: "inspect", nodes: SAMPLE_NODES, edges: SAMPLE_EDGES }),
    });
    const unauthRes = await orchestratePost(unauthReq);
    expect(unauthRes.status).toBe(401);

    // 2. Malformed JSON rejected cleanly with 400
    const badJsonReq = new NextRequest("http://localhost:3000/api/architecture/simulations/orchestrate", {
      method: "POST",
      headers: { "x-nxtqr-test-user": "11111111-1111-1111-1111-111111111111" },
      body: "{bad-json",
    });
    const badJsonRes = await orchestratePost(badJsonReq);
    expect(badJsonRes.status).toBe(400);

    // 3. Valid inspect request returns canonical capability inspection
    const inspectReq = new NextRequest("http://localhost:3000/api/architecture/simulations/orchestrate", {
      method: "POST",
      headers: { "x-nxtqr-test-user": "11111111-1111-1111-1111-111111111111" },
      body: JSON.stringify({ mode: "inspect", nodes: SAMPLE_NODES, edges: SAMPLE_EDGES }),
    });
    const inspectRes = await orchestratePost(inspectReq);
    expect(inspectRes.status).toBe(200);
    const inspectBody = (await inspectRes.json()) as { mode: string; inspection: { nodeCount: number } };
    expect(inspectBody.mode).toBe("inspect");
    expect(inspectBody.inspection.nodeCount).toBe(3);

    // 4. Valid pipeline request returns security-denied short-circuit when denyAuth=true
    const denyReq = new NextRequest("http://localhost:3000/api/architecture/simulations/orchestrate", {
      method: "POST",
      headers: { "x-nxtqr-test-user": "11111111-1111-1111-1111-111111111111" },
      body: JSON.stringify({
        mode: "pipeline",
        nodes: SAMPLE_NODES,
        edges: SAMPLE_EDGES,
        config: { incomingRps: 250, denyAuth: true },
      }),
    });
    const denyRes = await orchestratePost(denyReq);
    expect(denyRes.status).toBe(200);
    const denyBody = (await denyRes.json()) as {
      outcome: string;
      terminalStatusCode: number;
      deliveredRps: number;
    };
    expect(denyBody.outcome).toBe("blocked-security");
    expect(denyBody.terminalStatusCode).toBe(403);
    expect(denyBody.deliveredRps).toBe(0);
  });
});
