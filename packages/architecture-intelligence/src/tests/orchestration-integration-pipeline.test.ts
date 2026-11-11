import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { ArchitectureOrchestrationEngine } from "../orchestration/engine/orchestration-engine";
import { AnalysisResultCache } from "../orchestration/execution/result-cache";
import { AnalyzerRegistry } from "../orchestration/registry/analyzer-registry";

describe("Phase 05.3.29: Orchestration End-to-End Pipeline Integration", () => {
  const testNodes: BaseNode[] = [
    {
      id: "client-web",
      type: "client",
      position: { x: 0, y: 0 },
      data: { label: "Web Client", componentKind: "client" },
    },
    {
      id: "gw-api",
      type: "gateway",
      position: { x: 200, y: 0 },
      data: { label: "API Gateway", componentKind: "gateway" },
    },
    {
      id: "svc-orders",
      type: "service",
      position: { x: 400, y: -100 },
      data: { label: "Orders Service", componentKind: "compute" },
    },
    {
      id: "svc-payments",
      type: "service",
      position: { x: 400, y: 100 },
      data: { label: "Payments Service", componentKind: "compute" },
    },
    {
      id: "db-primary",
      type: "database",
      position: { x: 600, y: 0 },
      data: { label: "Primary Database", componentKind: "datastore" },
    },
  ];

  const testEdges: BaseEdge[] = [
    {
      id: "e1",
      source: "client-web",
      target: "gw-api",
      data: { isSynchronous: true, relationshipKind: "http" },
    },
    {
      id: "e2",
      source: "gw-api",
      target: "svc-orders",
      data: { isSynchronous: true, relationshipKind: "http" },
    },
    {
      id: "e3",
      source: "gw-api",
      target: "svc-payments",
      data: { isSynchronous: true, relationshipKind: "http" },
    },
    {
      id: "e4",
      source: "svc-orders",
      target: "db-primary",
      data: { isSynchronous: true, relationshipKind: "database" },
    },
    {
      id: "e5",
      source: "svc-payments",
      target: "db-primary",
      data: { isSynchronous: true, relationshipKind: "database" },
    },
  ];

  it("orchestrates standard analyzers and produces a unified assessment", async () => {
    const customCache = new AnalysisResultCache();
    const customRegistry = new AnalyzerRegistry();
    const engine = new ArchitectureOrchestrationEngine(customRegistry, customCache);

    const assessment = await engine.orchestrateAnalysis({
      projectId: "proj-integration",
      architectureId: "arch-e-commerce",
      nodes: testNodes,
      edges: testEdges,
      configuration: {
        maxConcurrency: 3,
        enableCache: true,
      },
    });

    if (assessment.completenessStatus !== "completed") {
      for (const r of assessment.analyzerRuns) {
        if (r.status === "failed") {
          console.error(`Failed analyzer ${r.analyzerId}: ${r.errorMessage}`);
        }
      }
    }

    expect(assessment.completenessStatus).toBe("completed");
    expect(assessment.analyzersRun).toBeGreaterThanOrEqual(5);
    expect(assessment.analyzersCompleted).toBeGreaterThanOrEqual(5);
    expect(assessment.analyzersFailed).toBe(0);
    expect(assessment.executionDurationMs).toBeGreaterThan(0);
    expect(assessment.healthScore).toBeGreaterThanOrEqual(0);
    expect(assessment.healthScore).toBeLessThanOrEqual(100);

    // Verify findings and recommendations
    expect(assessment.findings).toBeDefined();
    expect(assessment.recommendations).toBeDefined();

    // Re-run with cache enabled -> analyzersCached should be equal to analyzersRun
    const cachedAssessment = await engine.orchestrateAnalysis({
      projectId: "proj-integration",
      architectureId: "arch-e-commerce",
      nodes: testNodes,
      edges: testEdges,
      configuration: {
        maxConcurrency: 3,
        enableCache: true,
      },
    });

    expect(cachedAssessment.completenessStatus).toBe("completed");
    expect(cachedAssessment.analyzersCached).toBe(assessment.analyzersRun);
    expect(cachedAssessment.analyzersCompleted).toBe(0);
  });
});
