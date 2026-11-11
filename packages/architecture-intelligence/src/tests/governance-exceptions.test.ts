import { describe, it, expect } from "vitest";
import { PolicyEvaluator } from "../governance/evaluator/policy-evaluator";
import type { GovernancePolicy, EvidenceArtifact, PolicyException } from "../governance/contracts/governance.types";

describe("Phase 05.3.25 — Time-Bound Policy Exceptions & Waivers", () => {
  const testPolicy: GovernancePolicy = {
    id: "POL-SEC-MTLS",
    organizationId: "org-1",
    version: "1.0.0",
    title: "Strict Internal mTLS Service Mesh",
    description: "East-west service traffic must use mutual TLS.",
    category: "security",
    severity: "high",
    status: "active",
    scope: {
      level: "organization",
      organizationId: "org-1",
    },
    rule: {
      id: "r-mtls",
      targetProperty: "hasMtlsEnabled",
      operator: "equals",
      expectedValue: true,
    },
    requiredEvidenceTypes: ["security_configuration"],
    remediationGuidance: "Enable Linkerd/Istio strict mTLS sidecar injection.",
    provenance: {
      source: "system_guardrail",
      author: "Security Architect",
      timestamp: new Date().toISOString(),
      confirmed: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const freshEvidence: EvidenceArtifact = {
    id: "ev-mtls-1",
    evidenceType: "security_configuration",
    sourceIdentifier: "mesh_audit",
    resourceId: "legacy-billing",
    observedAt: new Date().toISOString(),
    freshnessWindowSeconds: 86400,
    integrityHash: "sha256-mtls-test",
    content: { hasMtlsEnabled: false },
    owner: "MeshOps",
    provenance: {
      source: "system_guardrail",
      author: "MeshOps",
      timestamp: new Date().toISOString(),
      confirmed: true,
    },
  };

  it("retains raw 'fail' status when approved active exception exists, but marks hasActiveException true", () => {
    const activeException: PolicyException = {
      id: "EX-MTLS-001",
      policyId: "POL-SEC-MTLS",
      policyVersion: "1.0.0",
      resourceScope: ["legacy-billing"],
      justification: "Legacy billing service awaiting Q3 migration to v2.",
      compensatingControls: [
        {
          id: "cc-1",
          title: "VPC Network Boundary Isolation",
          description: "Isolated to private subnets with strict security groups.",
          owner: "InfraTeam",
          evidenceArtifactIds: ["ev-mtls-1"],
          reviewStatus: "verified",
        },
      ],
      requesterId: "dev-lead",
      approverId: "ciso",
      status: "approved",
      startDate: new Date(Date.now() - 86400000).toISOString(),
      expirationDate: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days future
      isExpired: false,
      auditHistory: [
        {
          action: "approved",
          performedBy: "ciso",
          timestamp: new Date().toISOString(),
          notes: "Approved compensating controls until Q3.",
        },
      ],
      provenance: {
        source: "system_guardrail",
        author: "CISO",
        timestamp: new Date().toISOString(),
        confirmed: true,
      },
    };

    const evaluation = PolicyEvaluator.evaluatePolicy(
      testPolicy,
      [freshEvidence],
      [activeException],
      { hasMtlsEnabled: false },
      "legacy-billing",
      "Legacy Billing Service"
    );

    // CRITICAL REQUIREMENT: Raw status remains 'fail' — not artificially converted to 'pass'
    expect(evaluation.status).toBe("fail");
    expect(evaluation.hasActiveException).toBe(true);
    expect(evaluation.exceptionId).toBe("EX-MTLS-001");
    expect(evaluation.explanation).toContain("[Approved Time-Bound Exception: EX-MTLS-001]");
  });

  it("does not suppress violation when exception is expired", () => {
    const expiredException: PolicyException = {
      id: "EX-MTLS-EXPIRED",
      policyId: "POL-SEC-MTLS",
      policyVersion: "1.0.0",
      resourceScope: ["legacy-billing"],
      justification: "Expired waiver.",
      compensatingControls: [],
      requesterId: "dev-lead",
      approverId: "ciso",
      status: "approved",
      startDate: new Date(Date.now() - 86400000 * 60).toISOString(),
      expirationDate: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
      isExpired: true,
      auditHistory: [],
      provenance: {
        source: "system_guardrail",
        author: "CISO",
        timestamp: new Date().toISOString(),
        confirmed: true,
      },
    };

    const evaluation = PolicyEvaluator.evaluatePolicy(
      testPolicy,
      [freshEvidence],
      [expiredException],
      { hasMtlsEnabled: false },
      "legacy-billing",
      "Legacy Billing Service"
    );

    expect(evaluation.status).toBe("fail");
    expect(evaluation.hasActiveException).toBe(false);
    expect(evaluation.exceptionId).toBeUndefined();
  });

  it("does not match exception if resource is outside exception resourceScope", () => {
    const scopedException: PolicyException = {
      id: "EX-MTLS-OTHER",
      policyId: "POL-SEC-MTLS",
      policyVersion: "1.0.0",
      resourceScope: ["other-service"], // Does not match legacy-billing
      justification: "Other service exception.",
      compensatingControls: [],
      requesterId: "dev-lead",
      status: "approved",
      startDate: new Date(Date.now() - 86400000).toISOString(),
      expirationDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      isExpired: false,
      auditHistory: [],
      provenance: {
        source: "system_guardrail",
        author: "CISO",
        timestamp: new Date().toISOString(),
        confirmed: true,
      },
    };

    const evaluation = PolicyEvaluator.evaluatePolicy(
      testPolicy,
      [freshEvidence],
      [scopedException],
      { hasMtlsEnabled: false },
      "legacy-billing",
      "Legacy Billing Service"
    );

    expect(evaluation.status).toBe("fail");
    expect(evaluation.hasActiveException).toBe(false);
  });
});
