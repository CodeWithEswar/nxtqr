import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  FindingNormalizer,
  CorrelationEngine,
  ConflictDetector,
  RecommendationDependencyGraph,
  ImprovementPlanner,
  UnifiedWhatIfEngine,
  recommendationEngine,
  strategyRegistry,
} from "../index";

describe("Unified Intelligent Architecture Recommendations Engine (Phase 05.3.8)", () => {
  it("normalizes findings from multiple disparate engines into unified contracts", () => {
    const normalized = FindingNormalizer.normalizeAll({
      healthFindings: [
        {
          id: "hf-1",
          ruleId: "HEALTH-SCAL-001",
          dimension: "scalability",
          severity: "high",
          title: "Insufficient Read Capacity",
          explanation: "Database read operations exceed single-instance IOPS.",
          affectedNodeIds: ["db_primary"],
          affectedEdgeIds: [],
          evidence: [{ kind: "node", description: "High read load on db_primary" }],
          assumptions: [],
          confidence: "high",
          recommendationIds: [],
        },
      ],
      bottleneckFindings: [
        {
          id: "btk-1",
          ruleId: "BTK-DB-001",
          category: "database-contention",
          severity: "critical",
          title: "Database Read Saturation",
          explanation: "Throughput demand (1200 RPS) exceeds capacity (400 RPS).",
          affectedNodeIds: ["db_primary"],
          affectedEdgeIds: [],
          evidence: [{ kind: "node", description: "Database is at 300% saturation" }],
          assumptions: [],
          confidence: "high",
          remediation: "Add read replicas or application cache.",
        },
      ],
      failureFindings: [
        {
          id: "spof-1",
          ruleId: "SPOF-SINGLE-INSTANCE",
          category: "single-point-of-failure",
          severity: "critical",
          title: "Database Single Point of Failure",
          explanation: "Loss of db_primary halts all user workflows.",
          affectedNodeIds: ["db_primary"],
          affectedEdgeIds: [],
          evidence: [{ kind: "node", description: "db_primary has no replicas" }],
          assumptions: [],
          confidence: "high",
          remediation: "Deploy multi-AZ replication.",
        },
      ],
    } as any);

    expect(normalized.findings).toHaveLength(3);
    expect(normalized.findingsByEngine.health).toBe(1);
    expect(normalized.findingsByEngine.bottlenecks).toBe(1);
    expect(normalized.findingsByEngine.spof).toBe(1);
    expect(normalized.findings[0].affectedNodeIds).toContain("db_primary");
  });

  it("correlates multi-engine findings and classifies supported root cause", () => {
    const nodes: BaseNode[] = [
      {
        id: "db_primary",
        type: "infrastructure",
        position: { x: 300, y: 100 },
        data: { componentType: "relational-database", label: "Primary Database" },
      },
    ];
    const edges: BaseEdge[] = [];

    const { findings } = FindingNormalizer.normalizeAll({
      bottleneckFindings: [
        {
          id: "b1",
          ruleId: "BTK-DB-001",
          category: "database-contention",
          severity: "critical",
          title: "Database Saturated",
          explanation: "High read demand",
          affectedNodeIds: ["db_primary"],
          affectedEdgeIds: [],
          evidence: [],
          assumptions: [],
          confidence: "high",
        },
      ],
      failureFindings: [
        {
          id: "f1",
          ruleId: "SPOF-SINGLE-INSTANCE",
          category: "single-point-of-failure",
          severity: "high",
          title: "SPOF Database",
          explanation: "No read replicas",
          affectedNodeIds: ["db_primary"],
          affectedEdgeIds: [],
          evidence: [],
          assumptions: [],
          confidence: "high",
        },
      ],
    } as any);

    const groups = CorrelationEngine.correlateFindings(findings, nodes, edges);
    expect(groups).toHaveLength(1);
    expect(groups[0].primaryNodeId).toBe("db_primary");
    expect(groups[0].sourceEngines).toContain("bottlenecks");
    expect(groups[0].sourceEngines).toContain("spof");
    expect(groups[0].rootCauseCandidate.type).toBe("supported-root-cause");
    expect(groups[0].rootCauseCandidate.title).toContain("Single-Instance Read/Write Saturation");
  });

  it("evaluates strategies, deduplicates recommendations, and calculates explainable rankings", () => {
    const nodes: BaseNode[] = [
      {
        id: "web_api",
        type: "infrastructure",
        position: { x: 100, y: 100 },
        data: { componentType: "api-gateway", label: "API Gateway" },
      },
      {
        id: "db_orders",
        type: "infrastructure",
        position: { x: 400, y: 100 },
        data: { componentType: "relational-database", label: "Orders DB" },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "web_api", target: "db_orders", data: { isSynchronous: true } },
    ];

    const report = recommendationEngine.generateRecommendations(nodes, edges, {
      bottleneckFindings: [
        {
          id: "b_db",
          ruleId: "BTK-DB-001",
          category: "database-contention",
          severity: "critical",
          title: "Database Read Saturation",
          explanation: "Excessive reads",
          affectedNodeIds: ["db_orders"],
          affectedEdgeIds: [],
          evidence: [{ kind: "node", description: "Heavy read saturation" }],
          assumptions: [],
          confidence: "high",
        },
      ],
      reliabilityFindings: [
        {
          id: "r_backpressure",
          ruleId: "REL-BACK-001",
          category: "backpressure",
          severity: "high",
          title: "Missing Ingress Rate Limiting",
          explanation: "Public ingress unthrottled",
          affectedNodeIds: ["web_api"],
          affectedEdgeIds: [],
          evidence: [],
          assumptions: [],
          confidence: "high",
        },
      ],
    } as any);

    expect(report.recommendations.length).toBeGreaterThanOrEqual(2);
    expect(report.summary.totalRecommendations).toBe(report.recommendations.length);

    // Verify database recommendation exists (caching or replicas)
    const dbRec = report.recommendations.find((r) => r.affectedNodeIds.includes("db_orders"));
    expect(dbRec).toBeDefined();
    expect(dbRec?.benefits.length).toBeGreaterThan(0);
    expect(dbRec?.tradeoffs.length).toBeGreaterThan(0);
    expect(dbRec?.tradeoffDetails.performance).toBe("positive");

    // Verify rate limiting recommendation exists
    const rateRec = report.recommendations.find((r) => r.affectedNodeIds.includes("web_api"));
    expect(rateRec).toBeDefined();
    expect(rateRec?.strategyId).toBe("strat_rate_limiting");
  });

  it("detects conflicting recommendations (e.g. Caching vs Read Replicas competing on same node)", () => {
    const nodes: BaseNode[] = [
      {
        id: "db_sql",
        type: "infrastructure",
        position: { x: 300, y: 100 },
        data: { componentType: "relational-database", label: "SQL Database" },
      },
    ];

    const recA = strategyRegistry.get("strat_caching")!.evaluate({
      nodes,
      edges: [],
      group: {
        id: "g1",
        primaryNodeId: "db_sql",
        sharedComponentIds: ["db_sql"],
        sourceEngines: ["bottlenecks"],
        findings: [
          {
            id: "f1",
            sourceEngine: "bottlenecks",
            ruleId: "BTK-DB-001",
            severity: "critical",
            confidence: "high",
            category: "database-contention",
            title: "Read Saturation",
            explanation: "Overloaded",
            affectedNodeIds: ["db_sql"],
            affectedEdgeIds: [],
            evidence: [],
            assumptions: [],
            rawFindingId: "f1",
          },
        ],
        rootCauseCandidate: {
          type: "supported-root-cause",
          title: "Read saturation",
          explanation: "Database read saturation",
          confidence: "high",
          evidence: [],
        },
      },
      allFindings: [],
      nodeMap: new Map([["db_sql", nodes[0]]]),
      edgeMap: new Map(),
    })!;

    const recB = strategyRegistry.get("strat_read_replicas")!.evaluate({
      nodes,
      edges: [],
      group: {
        id: "g1",
        primaryNodeId: "db_sql",
        sharedComponentIds: ["db_sql"],
        sourceEngines: ["bottlenecks"],
        findings: [],
        rootCauseCandidate: {
          type: "supported-root-cause",
          title: "Read saturation",
          explanation: "Database read saturation",
          confidence: "high",
          evidence: [],
        },
      },
      allFindings: [],
      nodeMap: new Map([["db_sql", nodes[0]]]),
      edgeMap: new Map(),
    })!;

    const conflicts = ConflictDetector.detectConflicts(
      [
        {
          id: "rec_caching_db_sql",
          strategyId: "strat_caching",
          title: recA.title,
          summary: recA.summary,
          sourceFindingIds: ["f1"],
          sourceEngines: ["bottlenecks"],
          affectedNodeIds: ["db_sql"],
          affectedEdgeIds: [],
          evidence: [],
          assumptions: [],
          prerequisites: [],
          dependsOn: [],
          benefits: recA.benefits,
          tradeoffs: recA.tradeoffs,
          tradeoffDetails: recA.tradeoffDetails,
          conflictsWith: [],
          feasibility: "applicable",
          confidence: "high",
          priority: "high",
          score: 80,
          proposedOperations: recA.proposedOperations,
          lifecycleState: "new",
        },
        {
          id: "rec_replicas_db_sql",
          strategyId: "strat_read_replicas",
          title: recB.title,
          summary: recB.summary,
          sourceFindingIds: ["f1"],
          sourceEngines: ["bottlenecks"],
          affectedNodeIds: ["db_sql"],
          affectedEdgeIds: [],
          evidence: [],
          assumptions: [],
          prerequisites: [],
          dependsOn: [],
          benefits: recB.benefits,
          tradeoffs: recB.tradeoffs,
          tradeoffDetails: recB.tradeoffDetails,
          conflictsWith: [],
          feasibility: "applicable",
          confidence: "high",
          priority: "high",
          score: 75,
          proposedOperations: recB.proposedOperations,
          lifecycleState: "new",
        },
      ],
      nodes
    );

    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].conflictType).toBe("direct-incompatibility");
    expect(conflicts[0].explanation).toContain("propose separate infrastructure layers");
  });

  it("resolves recommendation prerequisite ordering and detects cycles", () => {
    // Rec 1: Externalize session state
    // Rec 2: Horizontal scaling (depends on Rec 1)
    // Rec 3: Load distribution (depends on Rec 2)
    const rec1 = { id: "rec_session", dependsOn: [] } as any;
    const rec2 = { id: "rec_scale", dependsOn: ["rec_session"] } as any;
    const rec3 = { id: "rec_lb", dependsOn: ["rec_scale"] } as any;

    const result = RecommendationDependencyGraph.resolveOrder([rec3, rec1, rec2]);
    expect(result.hasCycles).toBe(false);
    expect(result.orderedRecommendationIds).toEqual(["rec_session", "rec_scale", "rec_lb"]);

    // Test cycle detection: A depends on B, B depends on A
    const cyclicA = { id: "rec_a", dependsOn: ["rec_b"] } as any;
    const cyclicB = { id: "rec_b", dependsOn: ["rec_a"] } as any;
    const cyclicResult = RecommendationDependencyGraph.resolveOrder([cyclicA, cyclicB]);
    expect(cyclicResult.hasCycles).toBe(true);
    expect(cyclicResult.cycles.length).toBeGreaterThan(0);
  });

  it("builds dependency-aware improvement plan and estimates complexity", () => {
    const recA = {
      id: "rec_a",
      strategyId: "strat_session",
      title: "Externalize Session",
      proposedOperations: [{ type: "update_node_config", nodeId: "srv", configUpdates: {} }],
      dependsOn: [],
      affectedNodeIds: ["srv"],
    } as any;

    const recB = {
      id: "rec_b",
      strategyId: "strat_horizontal_scaling",
      title: "Scale Instances",
      proposedOperations: [{ type: "adjust_instances", nodeId: "srv", newReplicas: 3 }],
      dependsOn: ["rec_a"],
      affectedNodeIds: ["srv"],
    } as any;

    const plan = ImprovementPlanner.createPlan([recB, recA], []);
    expect(plan.isExecutable).toBe(true);
    expect(plan.orderedSteps).toHaveLength(2);
    expect(plan.orderedSteps[0].recommendationId).toBe("rec_a");
    expect(plan.orderedSteps[1].recommendationId).toBe("rec_b");
    expect(plan.orderedSteps[1].prerequisitesMet).toBe(true);
    expect(plan.totalOperations).toBe(2);
  });

  it("previews proposed architecture changes non-destructively and runs validation", () => {
    const originalNodes: BaseNode[] = [
      {
        id: "web_srv",
        type: "infrastructure",
        position: { x: 100, y: 100 },
        data: { componentType: "compute-instance", label: "Web Server" },
      },
      {
        id: "orders_db",
        type: "infrastructure",
        position: { x: 400, y: 100 },
        data: { componentType: "relational-database", label: "Orders Database" },
      },
    ];

    const originalEdges: BaseEdge[] = [
      { id: "e_srv_db", source: "web_srv", target: "orders_db", data: { protocol: "tcp" } },
    ];

    const recommendation = {
      id: "rec_cache",
      strategyId: "strat_caching",
      title: "Add Cache",
      proposedOperations: [
        {
          type: "insert_mediator" as const,
          replaceEdgeId: "e_srv_db",
          mediatorNode: {
            id: "redis_cache",
            type: "infrastructure",
            position: { x: 250, y: 100 },
            label: "Redis Cache",
            data: { componentType: "in-memory-cache" },
          },
          inboundEdge: { id: "e1_cache", data: { protocol: "tcp" } },
          outboundEdge: { id: "e2_cache", data: { protocol: "tcp" } },
        },
      ],
    } as any;

    const preview = UnifiedWhatIfEngine.previewRecommendation(
      originalNodes,
      originalEdges,
      recommendation
    );

    // Verify original nodes and edges are NOT mutated
    expect(originalNodes).toHaveLength(2);
    expect(originalEdges).toHaveLength(1);

    // Verify proposed graph has added mediator
    expect(preview.proposedNodes).toHaveLength(3);
    expect(preview.addedNodes.some((n) => n.id === "redis_cache")).toBe(true);
    expect(preview.removedEdgeIds).toContain("e_srv_db");
    expect(preview.isValidated).toBe(true);
  });
});
