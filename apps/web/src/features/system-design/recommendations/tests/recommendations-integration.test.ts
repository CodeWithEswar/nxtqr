import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  recommendationEngine,
  UnifiedWhatIfEngine,
  strategyRegistry,
} from "@nxtqr/architecture-intelligence";

describe("Unified Recommendations Web Integration Test", () => {
  const nodes: BaseNode[] = [
    {
      id: "gw_1",
      type: "infrastructure",
      position: { x: 0, y: 0 },
      data: { componentType: "api-gateway", label: "Public Gateway", rateLimitingEnabled: false },
    },
    {
      id: "api_1",
      type: "infrastructure",
      position: { x: 200, y: 0 },
      data: { componentType: "compute-instance", label: "Core API", retries: 4 },
    },
    {
      id: "db_1",
      type: "infrastructure",
      position: { x: 400, y: 0 },
      data: { componentType: "relational-database", label: "PostgreSQL Database", readReplicas: 0 },
    },
  ];

  const edges: BaseEdge[] = [
    {
      id: "e1",
      source: "gw_1",
      target: "api_1",
      sourceHandle: "upstream-service-out",
      targetHandle: "network-ingress-in",
      data: { isSynchronous: true, protocol: "http" },
    },
    {
      id: "e2",
      source: "api_1",
      target: "db_1",
      sourceHandle: "database-client-out",
      targetHandle: "sql-connection-in",
      data: { isSynchronous: true, protocol: "tcp" },
    },
  ];

  it("evaluates recommendations from multi-engine inputs and computes rankings", () => {
    const report = recommendationEngine.generateRecommendations(nodes, edges, {
      bottleneckFindings: [
        {
          id: "btk-1",
          ruleId: "BTK-DB-001",
          bottleneckType: "database_contention",
          severity: "critical",
          title: "Database Saturation",
          explanation: "High read load",
          affectedNodeIds: ["db_1"],
          affectedEdgeIds: [],
          evidence: [],
          assumptions: [],
          calculations: [],
          recommendationIds: [],
          tradeOffs: [],
          confidence: "high",
        },
      ],
      reliabilityFindings: [
        {
          id: "rel-1",
          ruleId: "REL-BACK-001",
          category: "backpressure",
          severity: "high",
          classification: "configuration-gap",
          title: "Missing Ingress Rate Limiting",
          explanation: "Public gateway unthrottled",
          affectedNodeIds: ["gw_1"],
          affectedEdgeIds: [],
          evidence: [],
          assumptions: [],
          confidence: "high",
          propagationChain: [],
          remediation: "Configure rate limiting on ingress",
          remediationAction: "enable_backpressure",
        },
      ],
    });

    expect(report.recommendations.length).toBeGreaterThanOrEqual(2);
    expect(report.recommendations[0].score).toBeGreaterThan(0);
    expect(report.summary.totalRecommendations).toBe(report.recommendations.length);
  });

  it("creates a non-destructive What-If plan with validated graph operations", () => {
    const rec = strategyRegistry.get("strat_rate_limiting")!.evaluate({
      nodes,
      edges,
      group: {
        id: "g_rate",
        primaryNodeId: "gw_1",
        sharedComponentIds: ["gw_1"],
        sourceEngines: ["reliability"],
        findings: [
          {
            id: "f_rel",
            sourceEngine: "reliability",
            ruleId: "REL-BACK-001",
            category: "backpressure",
            severity: "high",
            confidence: "high",
            title: "Missing Rate Limiting",
            explanation: "Ingress is unthrottled",
            affectedNodeIds: ["gw_1"],
            affectedEdgeIds: [],
            evidence: [],
            assumptions: [],
            rawFindingId: "f_rel",
          },
        ],
        rootCauseCandidate: {
          type: "supported-root-cause",
          title: "Unthrottled Ingress",
          explanation: "Missing rate limiting",
          confidence: "high",
          evidence: [],
        },
      },
      allFindings: [],
      nodeMap: new Map([["gw_1", nodes[0]]]),
      edgeMap: new Map(),
    })!;

    const preview = UnifiedWhatIfEngine.previewRecommendation(nodes, edges, {
      id: "rec_rate_gw_1",
      strategyId: "strat_rate_limiting",
      title: rec.title,
      summary: rec.summary,
      sourceFindingIds: [],
      sourceEngines: ["reliability"],
      affectedNodeIds: ["gw_1"],
      affectedEdgeIds: [],
      evidence: [],
      assumptions: [],
      prerequisites: [],
      dependsOn: [],
      benefits: rec.benefits,
      tradeoffs: rec.tradeoffs,
      tradeoffDetails: rec.tradeoffDetails,
      conflictsWith: [],
      feasibility: "applicable",
      confidence: "high",
      priority: "high",
      score: 85,
      proposedOperations: rec.proposedOperations,
      lifecycleState: "new",
    });

    expect(preview.isValidated).toBe(true);
    expect(preview.modifiedNodes.some((n) => n.id === "gw_1")).toBe(true);
  });
});
