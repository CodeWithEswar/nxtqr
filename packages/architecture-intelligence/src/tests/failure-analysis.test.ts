import { describe, it, expect, beforeEach } from "vitest";
import { failureAnalysisEngine } from "../failure-analysis";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

describe("Failure Analysis & SPOF Detection Engine (Phase 05.3.4)", () => {
  beforeEach(() => {
    failureAnalysisEngine.reset();
  });

  it("detects single point of failure (SPOF-CUT-001) on graph articulation point / cut-vertex", () => {
    const nodes: BaseNode[] = [
      { id: "client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "gw", type: "api-gateway", position: { x: 100, y: 0 }, data: { replicas: 1 } },
      { id: "auth_svc", type: "container-service", position: { x: 200, y: -50 }, data: { replicas: 1 } },
      { id: "order_svc", type: "container-service", position: { x: 200, y: 50 }, data: { replicas: 1 } },
      { id: "db", type: "relational-database", position: { x: 300, y: 50 }, data: { multiAz: true } },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "client", target: "gw", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e2", source: "gw", target: "auth_svc", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e3", source: "gw", target: "order_svc", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e4", source: "order_svc", target: "db", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ];

    const report = failureAnalysisEngine.analyzeGraph(nodes, edges);

    const gwSpof = report.findings.find((f) => f.ruleId === "SPOF-CUT-001" && f.affectedNodeIds.includes("gw"));
    expect(gwSpof).toBeDefined();
    expect(gwSpof?.classification).toBe("modeled-spof");
    expect(gwSpof?.severity).toBe("critical");
  });

  it("detects shared database single point of failure (SHARED-DEP-001) across multiple services", () => {
    const nodes: BaseNode[] = [
      { id: "svc_a", type: "container-service", position: { x: 0, y: 0 }, data: { replicas: 2 } },
      { id: "svc_b", type: "container-service", position: { x: 0, y: 100 }, data: { replicas: 2 } },
      // Shared standalone database with 0 read replicas and multiAz = false
      { id: "shared_db", type: "relational-database", position: { x: 200, y: 50 }, data: { multiAz: false, readReplicas: 0 } },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "svc_a", target: "shared_db", data: { protocol: "SQL", relationshipKind: "database-access" } },
      { id: "e2", source: "svc_b", target: "shared_db", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ];

    const report = failureAnalysisEngine.analyzeGraph(nodes, edges);

    const sharedDbFinding = report.findings.find((f) => f.ruleId === "SHARED-DEP-001");
    expect(sharedDbFinding).toBeDefined();
    expect(sharedDbFinding?.affectedNodeIds).toContain("shared_db");
    expect(sharedDbFinding?.affectedNodeIds).toContain("svc_a");
    expect(sharedDbFinding?.affectedNodeIds).toContain("svc_b");
  });

  it("detects correlated failure domain risk (SHARED-FDOM-001) when replicas share a single zone", () => {
    const nodes: BaseNode[] = [
      {
        id: "svc_replica_1",
        type: "container-service",
        position: { x: 0, y: 0 },
        data: { redundancyGroupId: "rg_payment", redundancyGroupName: "Payment Pool", availabilityZone: "us-east-1a" },
      },
      {
        id: "svc_replica_2",
        type: "container-service",
        position: { x: 0, y: 100 },
        data: { redundancyGroupId: "rg_payment", redundancyGroupName: "Payment Pool", availabilityZone: "us-east-1a" },
      },
    ];

    const report = failureAnalysisEngine.analyzeGraph(nodes, []);

    const fdomFinding = report.findings.find((f) => f.ruleId === "SHARED-FDOM-001");
    expect(fdomFinding).toBeDefined();
    expect(fdomFinding?.classification).toBe("failure-domain-risk");
  });

  it("detects failover gaps (FAILOVER-GAP-001) when read replica lacks automated failover", () => {
    const nodes: BaseNode[] = [
      {
        id: "primary_db",
        type: "relational-database",
        position: { x: 0, y: 0 },
        data: {
          readReplicas: 2,
          multiAz: false,
          failoverMode: "manual", // manual failover
        },
      },
    ];

    const report = failureAnalysisEngine.analyzeGraph(nodes, []);

    const failoverFinding = report.findings.find((f) => f.ruleId === "FAILOVER-GAP-001");
    expect(failoverFinding).toBeDefined();
    expect(failoverFinding?.severity).toBe("high");
  });

  it("calculates accurate blast radius and affected capabilities when a critical node fails", () => {
    const nodes: BaseNode[] = [
      { id: "client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "gateway", type: "api-gateway", position: { x: 100, y: 0 }, data: { replicas: 1 } },
      { id: "core_service", type: "container-service", position: { x: 200, y: 0 }, data: { replicas: 1 } },
      { id: "database", type: "relational-database", position: { x: 300, y: 0 }, data: { multiAz: true } },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "client", target: "gateway", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e2", source: "gateway", target: "core_service", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e3", source: "core_service", target: "database", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ];

    const blastProfile = failureAnalysisEngine.calculateBlastRadius("database", nodes, edges);

    expect(blastProfile.targetId).toBe("database");
    expect(blastProfile.directImpactedNodeIds).toContain("core_service");
    expect(blastProfile.indirectImpactedNodeIds).toContain("gateway");
    expect(blastProfile.blastRadiusScore).toBeGreaterThan(0);
  });
});
