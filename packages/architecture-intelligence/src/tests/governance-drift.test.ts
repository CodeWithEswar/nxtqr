import { describe, it, expect } from "vitest";
import { GovernanceDriftAnalyzer } from "../governance/analysis/governance-drift-analyzer";
import type {
  GovernanceBaseline,
  PolicyEvaluation,
  PolicyException,
} from "../governance/contracts/governance.types";

describe("Phase 05.3.25 — Governance Baseline & Architecture Drift Detection", () => {
  const now = new Date();
  const nowIso = now.toISOString();

  it("detects regressions: new policy violation on previously passing resource", () => {
    const baselineEvaluation: PolicyEvaluation = {
      id: "eval-sec-1-prod",
      policyId: "POL-SEC-001",
      policyVersion: "1.0.0",
      policyTitle: "No Public Ingress Without Gateway",
      category: "security",
      severity: "critical",
      resourceId: "api-service",
      status: "pass",
      isApplicable: true,
      evidenceIds: ["ev-1"],
      missingEvidenceTypes: [],
      explanation: "Passed",
      remediationGuidance: "Guidance",
      hasActiveException: false,
      evaluatedAt: new Date(Date.now() - 86400000).toISOString(),
      evaluatorVersion: "1.0.0",
    };

    const baseline: GovernanceBaseline = {
      id: "base-v1",
      projectId: "proj-1",
      architectureRevision: "rev-1",
      bundleVersions: { "bundle-baseline": "1.0.0" },
      evaluations: [baselineEvaluation],
      activeExceptionIds: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      createdBy: "ArchLead",
    };

    // Current evaluation: now FAILING
    const currentEvaluation: PolicyEvaluation = {
      ...baselineEvaluation,
      status: "fail",
      explanation: "Public IP directly attached to api-service without gateway termination.",
      evaluatedAt: nowIso,
    };

    const drift = GovernanceDriftAnalyzer.analyzeDrift(
      baseline,
      [currentEvaluation],
      [],
      "rev-2",
      undefined,
      { currentTimestamp: nowIso }
    );

    expect(drift.hasRegressions).toBe(true);
    expect(drift.totalNewViolations).toBe(1);
    expect(drift.driftItems[0].driftType).toBe("new_policy_violation");
    expect(drift.driftItems[0].resourceId).toBe("api-service");
  });

  it("detects resolved violations: previously failing policy now passes", () => {
    const baselineEvaluation: PolicyEvaluation = {
      id: "eval-rel-1-db",
      policyId: "POL-REL-001",
      policyVersion: "1.0.0",
      policyTitle: "Multi-AZ Deployment Required",
      category: "reliability",
      severity: "high",
      resourceId: "postgres-db",
      status: "fail",
      isApplicable: true,
      evidenceIds: [],
      missingEvidenceTypes: [],
      explanation: "Single AZ deployment",
      remediationGuidance: "Configure standby in AZ 2",
      hasActiveException: false,
      evaluatedAt: new Date(Date.now() - 86400000).toISOString(),
      evaluatorVersion: "1.0.0",
    };

    const baseline: GovernanceBaseline = {
      id: "base-v1",
      projectId: "proj-1",
      architectureRevision: "rev-1",
      bundleVersions: {},
      evaluations: [baselineEvaluation],
      activeExceptionIds: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      createdBy: "ArchLead",
    };

    const currentEvaluation: PolicyEvaluation = {
      ...baselineEvaluation,
      status: "pass",
      explanation: "Multi-AZ replica provisioned across us-east-1a and us-east-1b.",
      evaluatedAt: nowIso,
    };

    const drift = GovernanceDriftAnalyzer.analyzeDrift(
      baseline,
      [currentEvaluation],
      [],
      "rev-2",
      undefined,
      { currentTimestamp: nowIso }
    );

    expect(drift.totalResolvedViolations).toBe(1);
    expect(drift.hasRegressions).toBe(false);
    expect(drift.driftItems[0].driftType).toBe("resolved_violation");
  });

  it("detects expired exceptions from baseline", () => {
    const baseline: GovernanceBaseline = {
      id: "base-v1",
      projectId: "proj-1",
      architectureRevision: "rev-1",
      bundleVersions: {},
      evaluations: [],
      activeExceptionIds: ["EX-TEMP-001"],
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      createdBy: "ArchLead",
    };

    const expiredException: PolicyException = {
      id: "EX-TEMP-001",
      policyId: "POL-SEC-002",
      policyVersion: "1.0.0",
      resourceScope: ["*"],
      justification: "Temporary 14-day exemption for migration.",
      compensatingControls: [],
      requesterId: "dev-1",
      status: "approved",
      startDate: new Date(Date.now() - 86400000 * 15).toISOString(),
      expirationDate: new Date(Date.now() - 86400000).toISOString(), // Expired 1 day ago
      isExpired: true,
      auditHistory: [],
      provenance: {
        source: "system_guardrail",
        author: "Lead",
        timestamp: nowIso,
        confirmed: true,
      },
    };

    const drift = GovernanceDriftAnalyzer.analyzeDrift(
      baseline,
      [],
      [expiredException],
      "rev-2",
      undefined,
      { currentTimestamp: nowIso }
    );

    expect(drift.totalExpiredExceptions).toBe(1);
    expect(drift.hasRegressions).toBe(true);
    expect(drift.driftItems.some((i) => i.driftType === "expired_exception")).toBe(true);
  });
});

