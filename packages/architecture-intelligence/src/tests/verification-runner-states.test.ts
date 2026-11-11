import { describe, it, expect, beforeEach } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { TestRunner } from "../verification/evaluator/test-runner";
import type { ArchitectureTest, VerificationEvidence } from "../verification/contracts/verification.types";

describe("Phase 05.3.28: Test Runner Four-State Evaluation", () => {
  beforeEach(() => {
    TestRunner.clearCache();
  });

  const nodes: BaseNode[] = [
    {
      id: "api-gw",
      type: "custom",
      position: { x: 0, y: 0 },
      data: { label: "API Gateway", nodeType: "gateway", tlsEnforced: true },
    },
    {
      id: "primary-db",
      type: "custom",
      position: { x: 200, y: 0 },
      data: { label: "PostgreSQL Primary", nodeType: "database", backupPolicy: { exists: true } },
    },
  ];

  const edges: BaseEdge[] = [
    { id: "e1", source: "api-gw", target: "primary-db", type: "smoothstep", data: {} },
  ];

  const freshEvidence: VerificationEvidence[] = [
    {
      id: "ev-1",
      evidenceType: "backup_verification",
      source: "audit-vault",
      owner: "data-team",
      architectureRevisionId: "rev-1",
      observedAt: new Date().toISOString(),
      importedAt: new Date().toISOString(),
      contentHash: "sha256:123",
      freshnessWindowHours: 24,
      isVerified: true,
    },
  ];

  it("yields 'pass' when assertion and required evidence are satisfied", () => {
    const test: ArchitectureTest = {
      id: "TEST-PASS",
      projectId: "p1",
      version: "1.0.0",
      title: "Database Backup Test",
      description: "Database must have backup policy and evidence",
      category: "database",
      scope: { level: "component", targetIds: ["primary-db"] },
      assertion: { operator: "exists", path: "data.backupPolicy" },
      severity: "critical",
      status: "active",
      requirementIds: [],
      requiredEvidenceTypes: ["backup_verification"],
      createdBy: "tester",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { results, summary } = TestRunner.runTests({
      tests: [test],
      nodes,
      edges,
      evidenceCatalog: freshEvidence,
    });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("pass");
    expect(summary.passed).toBe(1);
    expect(summary.passRatePercent).toBe(100);
  });

  it("yields 'fail' when assertion fails on an applicable component", () => {
    const test: ArchitectureTest = {
      id: "TEST-FAIL",
      projectId: "p1",
      version: "1.0.0",
      title: "Enforce Multi-Region Database",
      description: "Database must be deployed in eu-central-1",
      category: "database",
      scope: { level: "component", targetIds: ["primary-db"] },
      assertion: { operator: "equals", path: "data.region", targetValue: "eu-central-1" },
      severity: "high",
      status: "active",
      requirementIds: [],
      requiredEvidenceTypes: [],
      createdBy: "tester",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { results, summary } = TestRunner.runTests({
      tests: [test],
      nodes,
      edges,
      evidenceCatalog: freshEvidence,
    });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("fail");
    expect(summary.failed).toBe(1);
    expect(summary.passRatePercent).toBe(0);
  });

  it("yields 'unknown' when required evidence is missing", () => {
    const test: ArchitectureTest = {
      id: "TEST-UNKNOWN",
      projectId: "p1",
      version: "1.0.0",
      title: "Missing Audit Evidence",
      description: "Requires compliance audit log",
      category: "security",
      scope: { level: "component", targetIds: ["api-gw"] },
      assertion: { operator: "exists", path: "data.tlsEnforced" },
      severity: "high",
      status: "active",
      requirementIds: [],
      requiredEvidenceTypes: ["missing_compliance_evidence"],
      createdBy: "tester",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { results, summary } = TestRunner.runTests({
      tests: [test],
      nodes,
      edges,
      evidenceCatalog: freshEvidence,
    });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("unknown");
    expect(results[0].explanation).toContain("Missing required evidence");
    expect(summary.unknown).toBe(1);
  });

  it("yields 'not_applicable' when target component is absent or environment does not match", () => {
    const test: ArchitectureTest = {
      id: "TEST-NA",
      projectId: "p1",
      version: "1.0.0",
      title: "Staging Only Test",
      description: "Applies to staging environment",
      category: "security",
      scope: { level: "component", environment: "staging", targetIds: ["api-gw"] },
      assertion: { operator: "exists", path: "data.tlsEnforced" },
      severity: "low",
      status: "active",
      requirementIds: [],
      requiredEvidenceTypes: [],
      createdBy: "tester",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { results, summary } = TestRunner.runTests({
      tests: [test],
      nodes,
      edges,
      evidenceCatalog: freshEvidence,
      environment: "production",
    });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("not_applicable");
    expect(summary.notApplicable).toBe(1);
  });
});

