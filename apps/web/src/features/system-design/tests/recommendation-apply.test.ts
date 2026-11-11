import { describe, it, expect } from "vitest";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import {
  recommendationEngine,
  architectureHealthEngine,
  bottleneckEngine,
  failureAnalysisEngine,
  securityAnalysisEngine,
  scalabilityRecommendationsEngine,
  reliabilityEngine,
  DEFAULT_WORKLOAD_SCENARIOS,
  type MultiEngineAnalysisInputs,
  type WhatIfPlan,
  type RecommendationLifecycle,
} from "@nxtqr/architecture-intelligence";
import { architectureValidationEngine } from "@nxtqr/architecture-validation";

describe("Two-step Recommendation Apply Flow", () => {
  it("simulates applying retry first, then applying graceful degradation", () => {
    // 1. Initial graph with 3 nodes + 1 extra node or config
    const baseNodes = [
      {
        id: "node_input_1",
        type: "input",
        position: { x: 120, y: 160 },
        label: "Ingress Source",
        data: { name: "Ingress Gateway", protocol: "HTTPS" },
      },
      {
        id: "node_process_1",
        type: "process",
        position: { x: 420, y: 160 },
        label: "Transformation Worker",
        data: { name: "Worker 01", concurrency: 4 },
      },
      {
        id: "node_output_1",
        type: "output",
        position: { x: 720, y: 160 },
        label: "Telemetry Sink",
        data: { name: "Sink Egress", persistResult: true, componentType: "telemetry", isOptional: true },
      },
      {
        id: "node_db_1",
        type: "database",
        position: { x: 420, y: 360 },
        label: "Primary Database",
        data: { name: "PostgreSQL Master", storageEngine: "postgres" },
      },
    ];

    const baseEdges = [
      { id: "edge_in_proc", source: "node_input_1", target: "node_process_1", data: {} },
      { id: "edge_proc_out", source: "node_process_1", target: "node_output_1", data: {} },
      { id: "edge_proc_db", source: "node_process_1", target: "node_db_1", data: {} },
      { id: "edge_in_db", source: "node_input_1", target: "node_db_1", data: {} },
    ];

    useGraphEditorStore.setState({ nodes: baseNodes as any, edges: baseEdges as any });
    const scenario = DEFAULT_WORKLOAD_SCENARIOS.normal_traffic;

    const runAnalysis = (overrides?: Map<string, RecommendationLifecycle>) => {
      const curNodes = useGraphEditorStore.getState().nodes;
      const curEdges = useGraphEditorStore.getState().edges;

      const validation = architectureValidationEngine.validateGraph(curNodes, curEdges);
      const health = architectureHealthEngine.assessGraph(curNodes, curEdges);
      const bottlenecks = bottleneckEngine.analyzeGraph(curNodes, curEdges, scenario);
      const failure = failureAnalysisEngine.analyzeGraph(curNodes, curEdges);
      const security = securityAnalysisEngine.analyzeGraph(curNodes, curEdges);
      const scalability = scalabilityRecommendationsEngine.evaluateGraph(curNodes, curEdges, scenario);
      const reliability = reliabilityEngine.analyzeGraph(curNodes, curEdges);

      const inputs: MultiEngineAnalysisInputs = {
        validation,
        healthFindings: health.allFindings,
        bottleneckFindings: bottlenecks.findings,
        failureFindings: failure.findings,
        securityFindings: security.findings,
        scalabilityRecommendations: scalability.recommendations,
        reliabilityFindings: reliability.findings,
      };

      return recommendationEngine.generateRecommendations(curNodes, curEdges, inputs, {
        includeNotApplicable: false,
        lifecycleOverrides: overrides,
      });
    };

    const lifecycleOverrides = new Map<string, RecommendationLifecycle>();

    // Step A: Initial Report
    const reportA = runAnalysis(lifecycleOverrides);
    console.log("=== STEP A: Initial recommendations ===");
    for (const r of reportA.recommendations) {
      console.log(`- [${r.id}] ${r.title} | ${r.lifecycleState}`);
    }

    // Find "Bound Retries & Add Jitter on Ingress Source" (or on input node)
    const retryRec = reportA.recommendations.find(
      (r) => r.strategyId === "strat_retry_timeout" && (r.title.includes("Ingress") || r.id.includes("node_input_1"))
    ) || reportA.recommendations.find((r) => r.strategyId === "strat_retry_timeout");

    expect(retryRec).toBeDefined();
    console.log("Applying retryRec:", retryRec?.id, retryRec?.title);

    // Apply retryRec
    const planA: WhatIfPlan = {
      id: `plan_${retryRec!.id}`,
      recommendationId: retryRec!.id,
      title: retryRec!.title,
      originalGraphRevision: "4_4",
      operations: retryRec!.proposedOperations,
      comparison: {
        beforeCapacityRps: 1000,
        estimatedAfterCapacityRps: 2800,
        capacityGainRatio: 2.8,
        resolvedFindingIds: retryRec!.sourceFindingIds,
        newRiskFindingIds: [],
        complexityScoreDelta: 0,
        notes: [],
      },
      isValidated: true,
      validationErrors: [],
    };

    useGraphEditorStore.getState().applyWhatIfPlan(planA);
    lifecycleOverrides.set(retryRec!.id, "applied");

    // Step B: Report after applying Retry
    const reportB = runAnalysis(lifecycleOverrides);
    console.log("=== STEP B: After applying retry ===");
    for (const r of reportB.recommendations) {
      console.log(`- [${r.id}] ${r.title} | ${r.lifecycleState}`);
    }

    // Now find Graceful Degradation recommendation
    const gracefulRec = reportB.recommendations.find(
      (r) => r.strategyId === "strat_graceful_degradation"
    );

    console.log("Found gracefulRec in Step B:", gracefulRec?.id, gracefulRec?.title, gracefulRec?.lifecycleState);
    expect(gracefulRec).toBeDefined();

    // Now simulate clicking Apply on Graceful Degradation
    console.log("Applying gracefulRec:", gracefulRec!.id, gracefulRec!.title);
    const planB: WhatIfPlan = {
      id: `plan_${gracefulRec!.id}`,
      recommendationId: gracefulRec!.id,
      title: gracefulRec!.title,
      originalGraphRevision: "4_4",
      operations: gracefulRec!.proposedOperations,
      comparison: {
        beforeCapacityRps: 1000,
        estimatedAfterCapacityRps: 2800,
        capacityGainRatio: 2.8,
        resolvedFindingIds: gracefulRec!.sourceFindingIds,
        newRiskFindingIds: [],
        complexityScoreDelta: 0,
        notes: [],
      },
      isValidated: true,
      validationErrors: [],
    };

    useGraphEditorStore.getState().applyWhatIfPlan(planB);
    lifecycleOverrides.set(gracefulRec!.id, "applied");

    // Step C: Report after applying Graceful Degradation
    const reportC = runAnalysis(lifecycleOverrides);
    console.log("=== STEP C: After applying graceful degradation ===");
    for (const r of reportC.recommendations) {
      console.log(`- [${r.id}] ${r.title} | ${r.lifecycleState}`);
    }

    const gracefulRecC = reportC.recommendations.find(
      (r) => r.strategyId === "strat_graceful_degradation"
    );
    console.log("gracefulRecC:", gracefulRecC?.id, gracefulRecC?.title, gracefulRecC?.lifecycleState);

    expect(gracefulRecC?.lifecycleState).toBe("applied");
  });
});
