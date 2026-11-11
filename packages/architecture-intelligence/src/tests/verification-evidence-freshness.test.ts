import { describe, it, expect } from "vitest";
import { VerificationEvidenceResolver } from "../verification/evaluator/evidence-resolver";
import type { VerificationEvidence } from "../verification/contracts/verification.types";

describe("Phase 05.3.28: Evidence Resolver & Freshness Verification", () => {
  it("marks fresh evidence as supplied and fresh", () => {
    const catalog: VerificationEvidence[] = [
      {
        id: "ev-fresh",
        evidenceType: "security_audit_log",
        source: "siem://vault",
        owner: "sec-ops",
        architectureRevisionId: "rev-1",
        observedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours old
        importedAt: new Date().toISOString(),
        contentHash: "sha256:abc",
        freshnessWindowHours: 24,
        isVerified: true,
      },
    ];

    const results = VerificationEvidenceResolver.evaluateEvidence(["security_audit_log"], catalog);
    expect(results).toHaveLength(1);
    expect(results[0].isSupplied).toBe(true);
    expect(results[0].isFresh).toBe(true);
    expect(results[0].isVerified).toBe(true);
    expect(results[0].ageHours).toBeLessThan(3);
  });

  it("identifies stale evidence when age exceeds freshness window", () => {
    const catalog: VerificationEvidence[] = [
      {
        id: "ev-stale",
        evidenceType: "database_restore_drill",
        source: "s3://backups/drill",
        owner: "data-plat",
        architectureRevisionId: "rev-1",
        observedAt: new Date(Date.now() - 100 * 3600 * 1000).toISOString(), // 100 hours old
        importedAt: new Date().toISOString(),
        contentHash: "sha256:xyz",
        freshnessWindowHours: 24, // window is 24 hours
        isVerified: true,
      },
    ];

    const results = VerificationEvidenceResolver.evaluateEvidence(["database_restore_drill"], catalog);
    expect(results).toHaveLength(1);
    expect(results[0].isSupplied).toBe(true);
    expect(results[0].isFresh).toBe(false);
    expect(results[0].notes[0]).toContain("stale");
  });

  it("flags missing evidence when required type is not present", () => {
    const catalog: VerificationEvidence[] = [];

    const results = VerificationEvidenceResolver.evaluateEvidence(["penetration_test_report"], catalog);
    expect(results).toHaveLength(1);
    expect(results[0].isSupplied).toBe(false);
    expect(results[0].isFresh).toBe(false);
    expect(results[0].notes[0]).toContain("absent from evidence catalog");
  });
});
