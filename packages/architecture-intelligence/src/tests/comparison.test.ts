import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  comparisonEngine,
  SnapshotResolver,
  IdentityMatcher,
  ConfigurationDiff,
  SemanticDiff,
  RegressionDetector,
} from "../index";

describe("Architecture Comparison & Change Intelligence Engine (Phase 05.3.9)", () => {
  const baseNodes: BaseNode[] = [
    {
      id: "api_gateway",
      type: "infrastructure",
      position: { x: 100, y: 100 },
      data: {
        componentType: "api-gateway",
        authPolicy: "oauth2-jwt",
        rateLimitRps: 1000,
        timeoutMs: 15000,
      },
    },
    {
      id: "user_service",
      type: "infrastructure",
      position: { x: 300, y: 100 },
      data: {
        componentType: "compute-instance",
        instanceCount: 2,
        retries: 2,
      },
    },
    {
      id: "users_db",
      type: "infrastructure",
      position: { x: 500, y: 100 },
      data: {
        componentType: "relational-database",
        multiAz: true,
        readReplicas: 2,
        storageCapacityGb: 200,
      },
    },
  ];

  const baseEdges: BaseEdge[] = [
    {
      id: "e_gw_srv",
      source: "api_gateway",
      target: "user_service",
      data: { protocol: "https", isSynchronous: true },
    },
    {
      id: "e_srv_db",
      source: "user_service",
      target: "users_db",
      data: { protocol: "tcp", isSynchronous: true },
    },
  ];

  it("creates immutable snapshots with deterministic revision hashes", () => {
    const snap1 = SnapshotResolver.createSnapshot({
      title: "Production v1",
      nodes: baseNodes,
      edges: baseEdges,
    });

    const snap2 = SnapshotResolver.createSnapshot({
      title: "Production v1 Copy",
      nodes: baseNodes,
      edges: baseEdges,
    });

    expect(snap1.revision).toBe(snap2.revision);
    expect(snap1.nodes).toHaveLength(3);
    expect(snap1.edges).toHaveLength(2);

    // Verify snapshot immutability
    snap1.nodes[0].position.x = 9999;
    expect(baseNodes[0].position.x).toBe(100);
  });

  it("resolves stable identities and bounds heuristic matching without silent merging", () => {
    const candidateNodes: BaseNode[] = [
      {
        id: "api_gateway",
        type: "infrastructure",
        position: { x: 120, y: 100 },
        data: { componentType: "api-gateway" },
      },
      {
        id: "auth_proxy", // Unmatched candidate
        type: "infrastructure",
        position: { x: 200, y: 50 },
        data: { componentType: "reverse-proxy" },
      },
      {
        id: "user_service_renamed", // Heuristic candidate for user_service
        type: "infrastructure",
        position: { x: 300, y: 100 },
        label: "User Service",
        data: { componentType: "compute-instance" },
      },
    ];

    const match = IdentityMatcher.match(
      baseNodes,
      candidateNodes,
      baseEdges,
      [],
      { allowHeuristicMatching: true }
    );

    // Exact ID match for api_gateway
    expect(match.matchedNodePairs.get("api_gateway")).toBe("api_gateway");

    // users_db was removed in candidate
    expect(match.unmatchedBaselineNodeIds).toContain("users_db");

    // auth_proxy is a new entity
    expect(match.unmatchedCandidateNodeIds).toContain("auth_proxy");
  });

  it("normalizes units and detects typed configuration differences", () => {
    const baseConfig = {
      timeoutMs: 5000,
      storageCapacityGb: 20,
      authEnabled: true,
      label: "Main DB",
    };

    const candConfig = {
      timeoutMs: 5000, // Identical
      storageCapacityGb: 40, // Changed
      authEnabled: "true", // String vs boolean normalization
      label: "Primary PostgreSQL", // Changed
    };

    const diff = ConfigurationDiff.diffConfigs(baseConfig, candConfig);

    expect(diff.changedFields).toContain("storageCapacityGb");
    expect(diff.changedFields).toContain("label");
    expect(diff.changedFields).not.toContain("timeoutMs");
    expect(diff.changedFields).not.toContain("authEnabled"); // normalized to true === true
  });

  it("detects added, removed, modified, and unchanged nodes without false positives on coordinate changes", () => {
    const candidateNodes: BaseNode[] = [
      {
        id: "api_gateway",
        type: "infrastructure",
        position: { x: 999, y: 888 }, // Moved visually only!
        data: { ...baseNodes[0].data },
      },
      {
        id: "user_service",
        type: "infrastructure",
        position: { x: 300, y: 100 },
        data: { ...baseNodes[1].data, instanceCount: 5 }, // Scaled instances
      },
      {
        id: "redis_cache", // Added node
        type: "infrastructure",
        position: { x: 400, y: 100 },
        data: { componentType: "in-memory-cache" },
      },
      // users_db is removed
    ];

    const match = IdentityMatcher.match(baseNodes, candidateNodes, baseEdges, []);
    const changes = SemanticDiff.diff(
      baseNodes,
      candidateNodes,
      baseEdges,
      [],
      match,
      { detectVisualChanges: false } // Ignore visual movement
    );

    const added = changes.filter((c) => c.kind === "added");
    const removed = changes.filter((c) => c.kind === "removed");
    const modified = changes.filter((c) => c.kind === "modified");

    expect(added.some((c) => c.candidateId === "redis_cache")).toBe(true);
    expect(removed.some((c) => c.baselineId === "users_db")).toBe(true);
    expect(modified.some((c) => c.candidateId === "user_service")).toBe(true);

    // api_gateway only moved visually, so with detectVisualChanges: false it should NOT be modified
    expect(modified.some((c) => c.candidateId === "api_gateway")).toBe(false);
  });

  it("detects evidence-backed architectural regressions when HA or security controls are relaxed", () => {
    const candidateNodes: BaseNode[] = [
      {
        id: "api_gateway",
        type: "infrastructure",
        position: { x: 100, y: 100 },
        data: {
          componentType: "api-gateway",
          authPolicy: "anonymous", // Regression: auth removed!
        },
      },
      {
        id: "users_db",
        type: "infrastructure",
        position: { x: 500, y: 100 },
        data: {
          componentType: "relational-database",
          multiAz: false, // Regression: HA disabled!
          readReplicas: 0, // Regression: replicas set to 0!
        },
      },
    ];

    const match = IdentityMatcher.match(baseNodes, candidateNodes, [], []);
    const changes = SemanticDiff.diff(baseNodes, candidateNodes, [], [], match);
    const regressions = RegressionDetector.detectRegressions(
      baseNodes,
      candidateNodes,
      [],
      [],
      changes,
      {}
    );

    expect(regressions.length).toBeGreaterThanOrEqual(3);
    expect(regressions.some((r) => r.ruleId === "REG-REL-001")).toBe(true); // HA disabled
    expect(regressions.some((r) => r.ruleId === "REG-SCAL-001")).toBe(true); // Replicas 0
    expect(regressions.some((r) => r.ruleId === "REG-SEC-001")).toBe(true); // Auth disabled
    expect(regressions.every((r) => r.classification === "supported-regression")).toBe(true);
  });

  it("executes end-to-end architecture comparison with summary and trade-offs", () => {
    const candidateNodes: BaseNode[] = [
      {
        id: "api_gateway",
        type: "infrastructure",
        position: { x: 100, y: 100 },
        data: { ...baseNodes[0].data },
      },
      {
        id: "user_service",
        type: "infrastructure",
        position: { x: 300, y: 100 },
        data: { ...baseNodes[1].data, instanceCount: 4 },
      },
      {
        id: "redis_cache",
        type: "infrastructure",
        position: { x: 400, y: 50 },
        data: { componentType: "in-memory-cache", memoryMb: 4096 },
      },
      {
        id: "users_db",
        type: "infrastructure",
        position: { x: 500, y: 100 },
        data: { ...baseNodes[2].data, readReplicas: 3 },
      },
    ];

    const candidateEdges: BaseEdge[] = [
      ...baseEdges,
      {
        id: "e_srv_cache",
        source: "user_service",
        target: "redis_cache",
        data: { protocol: "tcp", isSynchronous: true },
      },
    ];

    const result = comparisonEngine.compareGraphs(
      baseNodes,
      baseEdges,
      candidateNodes,
      candidateEdges,
      {
        baselineTitle: "Baseline Monolith",
        candidateTitle: "Scaled with Cache",
      }
    );

    expect(result.summary.addedNodesCount).toBe(1);
    expect(result.summary.addedEdgesCount).toBe(1);
    expect(result.summary.modifiedNodesCount).toBe(2);
    expect(result.summary.regressionsCount).toBe(0);
    expect(result.summary.overallAssessment).toBe("improved");
    expect(result.summary.keyTradeoffs.length).toBeGreaterThan(0);
  });
});
