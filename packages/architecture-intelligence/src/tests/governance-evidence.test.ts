import { describe, it, expect } from "vitest";
import { EvidenceResolver } from "../governance/evaluator/evidence-resolver";
import type { EvidenceArtifact } from "../governance/contracts/governance.types";

describe("Phase 05.3.25 — Evidence Resolver & Freshness Window Enforcement", () => {
  const now = new Date();
  const nowIso = now.toISOString();

  it("computes deterministic reproducible content hash", () => {
    const contentA = { tlsVersion: "TLS_1_3", cipher: "AES_256_GCM", port: 443 };
    const contentB = { port: 443, cipher: "AES_256_GCM", tlsVersion: "TLS_1_3" }; // Different key order

    const hashA = EvidenceResolver.computeIntegrityHash(contentA);
    const hashB = EvidenceResolver.computeIntegrityHash(contentB);

    expect(hashA).toBe(hashB);
    expect(hashA.startsWith("sha256-")).toBe(true);
  });

  it("resolves fresh evidence matching required types", () => {
    const evidenceArtifacts: EvidenceArtifact[] = [
      {
        id: "ev-sec-1",
        evidenceType: "security_configuration",
        sourceIdentifier: "config_check",
        resourceId: "service-a",
        observedAt: nowIso,
        freshnessWindowSeconds: 3600, // 1 hour
        integrityHash: "sha256-test",
        content: { tlsEnforced: true },
        owner: "SecOps",
        provenance: {
          source: "system_guardrail",
          author: "Scanner",
          timestamp: nowIso,
          confirmed: true,
        },
      },
    ];

    const result = EvidenceResolver.resolveEvidence(
      ["security_configuration"],
      evidenceArtifacts,
      "service-a",
      nowIso
    );

    expect(result.isComplete).toBe(true);
    expect(result.missingTypes.length).toBe(0);
    expect(result.staleEvidenceIds.length).toBe(0);
    expect(result.evidenceIds).toContain("ev-sec-1");
    expect(result.resolvedContext.tlsEnforced).toBe(true);
  });

  it("detects expired/stale evidence exceeding freshness window", () => {
    const pastDate = new Date(now.getTime() - 48 * 3600 * 1000).toISOString(); // 48 hours ago

    const staleEvidence: EvidenceArtifact = {
      id: "ev-stale-1",
      evidenceType: "backup_verification",
      sourceIdentifier: "backup_check",
      resourceId: "db-prod",
      observedAt: pastDate,
      freshnessWindowSeconds: 86400, // 24 hours validity
      integrityHash: "sha256-backup",
      content: { backupVerified: true },
      owner: "DBA",
      provenance: {
        source: "system_guardrail",
        author: "BackupBot",
        timestamp: pastDate,
        confirmed: true,
      },
    };

    const result = EvidenceResolver.resolveEvidence(
      ["backup_verification"],
      [staleEvidence],
      "db-prod",
      nowIso
    );

    expect(result.isComplete).toBe(false);
    expect(result.staleEvidenceIds).toContain("ev-stale-1");
  });

  it("identifies missing required evidence types", () => {
    const result = EvidenceResolver.resolveEvidence(
      ["security_configuration", "telemetry_metric", "database_schema"],
      [], // Empty evidence
      "service-x",
      nowIso
    );

    expect(result.isComplete).toBe(false);
    expect(result.missingTypes).toEqual([
      "security_configuration",
      "telemetry_metric",
      "database_schema",
    ]);
  });
});
