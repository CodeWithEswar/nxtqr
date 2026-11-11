import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { AssertionInterpreter } from "../verification/evaluator/assertion-interpreter";
import type { ArchitectureAssertion, VerificationEvidence } from "../verification/contracts/verification.types";

describe("Phase 05.3.28: Architecture Assertion AST Interpreter", () => {
  const sampleNodes: BaseNode[] = [
    {
      id: "api-gw",
      type: "custom",
      position: { x: 0, y: 0 },
      data: { label: "API Gateway", nodeType: "gateway", rateLimit: 5000, tlsEnforced: true },
    },
    {
      id: "order-svc",
      type: "custom",
      position: { x: 100, y: 0 },
      data: { label: "Order Service", nodeType: "service", environment: "production" },
    },
    {
      id: "primary-db",
      type: "custom",
      position: { x: 200, y: 0 },
      data: {
        label: "PostgreSQL DB",
        nodeType: "database",
        region: "us-east-1",
        backupPolicy: { type: "snapshot", frequencyHours: 4 },
      },
    },
  ];

  const sampleEdges: BaseEdge[] = [
    { id: "e1", source: "api-gw", target: "order-svc", type: "smoothstep", data: {} },
    { id: "e2", source: "order-svc", target: "primary-db", type: "smoothstep", data: {} },
  ];

  const sampleEvidence: VerificationEvidence[] = [
    {
      id: "ev-1",
      evidenceType: "backup_verification",
      source: "audit-vault",
      owner: "data-team",
      architectureRevisionId: "rev-1",
      observedAt: new Date().toISOString(),
      importedAt: new Date().toISOString(),
      contentHash: "sha256:abc",
      freshnessWindowHours: 24,
      isVerified: true,
    },
  ];

  it("evaluates equals and not_equals correctly", () => {
    const eqAssertion: ArchitectureAssertion = {
      operator: "equals",
      path: "data.tlsEnforced",
      targetValue: true,
    };
    const res1 = AssertionInterpreter.evaluate(eqAssertion, {
      targetNode: sampleNodes[0],
      nodes: sampleNodes,
      edges: sampleEdges,
      evidenceCatalog: sampleEvidence,
    });
    expect(res1.passed).toBe(true);

    const neqAssertion: ArchitectureAssertion = {
      operator: "not_equals",
      path: "data.nodeType",
      targetValue: "database",
    };
    const res2 = AssertionInterpreter.evaluate(neqAssertion, {
      targetNode: sampleNodes[0],
      nodes: sampleNodes,
      edges: sampleEdges,
      evidenceCatalog: sampleEvidence,
    });
    expect(res2.passed).toBe(true);
  });

  it("evaluates exists and missing correctly", () => {
    const existsAssertion: ArchitectureAssertion = {
      operator: "exists",
      path: "data.backupPolicy",
    };
    const res1 = AssertionInterpreter.evaluate(existsAssertion, {
      targetNode: sampleNodes[2],
      nodes: sampleNodes,
      edges: sampleEdges,
      evidenceCatalog: sampleEvidence,
    });
    expect(res1.passed).toBe(true);

    const missingAssertion: ArchitectureAssertion = {
      operator: "missing",
      path: "data.missingProperty",
    };
    const res2 = AssertionInterpreter.evaluate(missingAssertion, {
      targetNode: sampleNodes[2],
      nodes: sampleNodes,
      edges: sampleEdges,
      evidenceCatalog: sampleEvidence,
    });
    expect(res2.passed).toBe(true);
  });

  it("evaluates graph reachability and path exists correctly", () => {
    const reachableAssertion: ArchitectureAssertion = {
      operator: "graph_reachable",
      fromNodeId: "api-gw",
      toNodeId: "primary-db",
    };
    const res1 = AssertionInterpreter.evaluate(reachableAssertion, {
      targetNode: sampleNodes[0],
      nodes: sampleNodes,
      edges: sampleEdges,
      evidenceCatalog: sampleEvidence,
    });
    expect(res1.passed).toBe(true);

    const unreachableAssertion: ArchitectureAssertion = {
      operator: "graph_reachable",
      fromNodeId: "primary-db",
      toNodeId: "api-gw",
    };
    const res2 = AssertionInterpreter.evaluate(unreachableAssertion, {
      targetNode: sampleNodes[2],
      nodes: sampleNodes,
      edges: sampleEdges,
      evidenceCatalog: sampleEvidence,
    });
    expect(res2.passed).toBe(false);
  });

  it("evaluates composite operators (all, any, none)", () => {
    const allAssertion: ArchitectureAssertion = {
      operator: "all",
      children: [
        { operator: "exists", path: "data.rateLimit" },
        { operator: "equals", path: "data.tlsEnforced", targetValue: true },
      ],
    };
    const res = AssertionInterpreter.evaluate(allAssertion, {
      targetNode: sampleNodes[0],
      nodes: sampleNodes,
      edges: sampleEdges,
      evidenceCatalog: sampleEvidence,
    });
    expect(res.passed).toBe(true);
  });
});

