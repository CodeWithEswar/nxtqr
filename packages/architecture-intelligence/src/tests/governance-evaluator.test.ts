import { describe, it, expect } from "vitest";
import { PolicyEvaluator } from "../governance/evaluator/policy-evaluator";
import type { GovernancePolicy, EvidenceArtifact } from "../governance/contracts/governance.types";

describe("Phase 05.3.25 — Four-State Policy Evaluator & Applicability", () => {
  const samplePolicy: GovernancePolicy = {
    id: "POL-TEST-001",
    organizationId: "org-1",
    version: "1.0.0",
    title: "Production Databases Must Be Encrypted At Rest",
    description: "All database instances in production must enforce encryption at rest.",
    category: "security",
    severity: "critical",
    status: "active",
    scope: {
      level: "organization",
      organizationId: "org-1",
      environments: ["production"],
      componentTypes: ["database", "storage"],
    },
    rule: {
      id: "r-enc",
      targetProperty: "isEncryptedAtRest",
      operator: "equals",
      expectedValue: true,
    },
    requiredEvidenceTypes: ["security_configuration"],
    remediationGuidance: "Enable KMS customer-managed key encryption on storage volumes.",
    provenance: {
      source: "system_guardrail",
      author: "Test Suite",
      timestamp: new Date().toISOString(),
      confirmed: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("evaluates to 'not_applicable' when resource environment does not match scope", () => {
    const result = PolicyEvaluator.evaluatePolicy(
      samplePolicy,
      [],
      [],
      {
        environment: "development",
        componentType: "database",
        isEncryptedAtRest: false,
      },
      "dev-db-1",
      "Development DB"
    );

    expect(result.status).toBe("not_applicable");
    expect(result.isApplicable).toBe(false);
    expect(result.applicableReason).toContain("Policy targets environments [production]");
  });

  it("evaluates to 'not_applicable' when resource component type does not match scope", () => {
    const result = PolicyEvaluator.evaluatePolicy(
      samplePolicy,
      [],
      [],
      {
        environment: "production",
        componentType: "message_queue",
        isEncryptedAtRest: false,
      },
      "prod-queue-1",
      "Production Queue"
    );

    expect(result.status).toBe("not_applicable");
    expect(result.isApplicable).toBe(false);
    expect(result.applicableReason).toContain("Policy targets component types [database, storage]");
  });

  it("evaluates to 'unknown' when required evidence is missing (cannot assume pass)", () => {
    const result = PolicyEvaluator.evaluatePolicy(
      samplePolicy,
      [], // No evidence provided
      [],
      {
        environment: "production",
        componentType: "database",
        isEncryptedAtRest: true, // target property claims true, but no verified proof exists
      },
      "prod-db-1",
      "Production DB"
    );

    expect(result.status).toBe("unknown");
    expect(result.isApplicable).toBe(true);
    expect(result.missingEvidenceTypes).toContain("security_configuration");
    expect(result.explanation).toContain("missing evidence cannot be assumed to pass");
  });

  it("evaluates to 'pass' when applicable, verified evidence exists, and rule passes", () => {
    const freshEvidence: EvidenceArtifact = {
      id: "ev-db-1",
      evidenceType: "security_configuration",
      sourceIdentifier: "aws_rds_config_audit",
      resourceId: "prod-db-1",
      observedAt: new Date().toISOString(),
      freshnessWindowSeconds: 86400,
      integrityHash: "sha256-abcdef1234567890",
      content: { isEncryptedAtRest: true, kmsKeyId: "arn:aws:kms:us-east-1:1234:key/db-key" },
      owner: "SecOps",
      provenance: {
        source: "system_guardrail",
        author: "NXTQR Scanner",
        timestamp: new Date().toISOString(),
        confirmed: true,
      },
    };

    const result = PolicyEvaluator.evaluatePolicy(
      samplePolicy,
      [freshEvidence],
      [],
      {
        environment: "production",
        componentType: "database",
        isEncryptedAtRest: true,
      },
      "prod-db-1",
      "Production DB"
    );

    expect(result.status).toBe("pass");
    expect(result.isApplicable).toBe(true);
    expect(result.evidenceIds).toContain("ev-db-1");
  });

  it("evaluates to 'fail' when applicable, evidence is present, but rule is violated", () => {
    const freshEvidence: EvidenceArtifact = {
      id: "ev-db-unencrypted",
      evidenceType: "security_configuration",
      sourceIdentifier: "aws_rds_config_audit",
      resourceId: "prod-db-2",
      observedAt: new Date().toISOString(),
      freshnessWindowSeconds: 86400,
      integrityHash: "sha256-1122334455667788",
      content: { isEncryptedAtRest: false },
      owner: "SecOps",
      provenance: {
        source: "system_guardrail",
        author: "NXTQR Scanner",
        timestamp: new Date().toISOString(),
        confirmed: true,
      },
    };

    const result = PolicyEvaluator.evaluatePolicy(
      samplePolicy,
      [freshEvidence],
      [],
      {
        environment: "production",
        componentType: "database",
        isEncryptedAtRest: false,
      },
      "prod-db-2",
      "Production DB Unencrypted"
    );

    expect(result.status).toBe("fail");
    expect(result.isApplicable).toBe(true);
    expect(result.explanation).toContain("Policy rule violated");

    // Converts to normalized finding
    const finding = PolicyEvaluator.toFinding(result, samplePolicy);
    expect(finding).not.toBeNull();
    expect(finding?.severity).toBe("critical");
    expect(finding?.affectedResourceIds).toContain("prod-db-2");
    expect(finding?.remediation).toBe(samplePolicy.remediationGuidance);
  });
});
