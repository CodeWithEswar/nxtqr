import { describe, it, expect } from "vitest";
import { OrchestrationFindingNormalizer as FindingNormalizer } from "../orchestration/correlation/finding-normalizer";
import { FindingCorrelator } from "../orchestration/correlation/finding-correlator";
import { ContradictionDetector } from "../orchestration/correlation/contradiction-detector";
import { AnalysisContextBuilder } from "../orchestration/execution/context-builder";
import type { NormalizedFinding } from "../orchestration/contracts/orchestration.types";

describe("Phase 05.3.29: Finding Correlation & Contradiction Detection", () => {
  it("normalizes and produces stable fingerprints", () => {
    const f1 = FindingNormalizer.normalize({
      sourceAnalyzerId: "arch.spof",
      category: "spof",
      severity: "critical",
      title: "Unmitigated database SPOF",
      description: "Database db-1 has no replica",
      affectedComponentIds: ["node-db-1"],
    });

    const f2 = FindingNormalizer.normalize({
      sourceAnalyzerId: "arch.spof",
      category: "spof",
      severity: "critical",
      title: "Unmitigated database SPOF",
      description: "Duplicate report",
      affectedComponentIds: ["node-db-1"],
    });

    expect(f1.fingerprint).toBe(f2.fingerprint);
  });

  it("deduplicates identical findings and clusters compound vulnerabilities into CorrelationGroup", () => {
    const rawFindings: NormalizedFinding[] = [
      {
        id: "f1",
        sourceAnalyzerId: "arch.spof",
        category: "spof",
        severity: "critical",
        title: "Single Point of Failure on Payment Gateway",
        description: "Payment service is an articulation point.",
        affectedComponentIds: ["svc-payment"],
        evidenceIds: ["ev-1"],
        confidence: "verified",
        fingerprint: "spof:svc-payment",
      },
      {
        id: "f2",
        sourceAnalyzerId: "arch.spof",
        category: "spof",
        severity: "critical",
        title: "Single Point of Failure on Payment Gateway",
        description: "Duplicate report",
        affectedComponentIds: ["svc-payment"],
        evidenceIds: ["ev-2"],
        confidence: "verified",
        fingerprint: "spof:svc-payment",
      },
      {
        id: "f3",
        sourceAnalyzerId: "arch.bottlenecks",
        category: "bottlenecks",
        severity: "high",
        title: "High IOPS Saturation on Payment Gateway",
        description: "Throughput exceeds 5000 rps.",
        affectedComponentIds: ["svc-payment"],
        evidenceIds: ["ev-3"],
        confidence: "modeled",
        fingerprint: "bottlenecks:svc-payment",
      },
    ];

    const result = FindingCorrelator.correlate(rawFindings);

    // Should deduplicate f1 and f2 into 1 finding, merging evidence
    expect(result.deduplicatedFindings.length).toBe(2);
    const spofFinding = result.deduplicatedFindings.find((f) => f.sourceAnalyzerId === "arch.spof");
    expect(spofFinding?.evidenceIds).toContain("ev-1");
    expect(spofFinding?.evidenceIds).toContain("ev-2");

    // Should create a correlation group for svc-payment
    expect(result.correlationGroups.length).toBe(1);
    expect(result.correlationGroups[0].sharedComponentIds).toContain("svc-payment");
    expect(result.correlationGroups[0].findingsCount).toBe(2);

    // Should derive a unified recommendation
    expect(result.unifiedRecommendations.length).toBeGreaterThanOrEqual(1);
    expect(result.unifiedRecommendations[0].affectedComponentIds).toContain("svc-payment");
  });

  it("detects redundancy conflict between SPOF and HA assertions", () => {
    const context = AnalysisContextBuilder.build({ nodes: [], edges: [] });

    const findings: NormalizedFinding[] = [
      {
        id: "f-spof",
        sourceAnalyzerId: "architecture.spof",
        category: "spof",
        severity: "critical",
        title: "Single Point of Failure on db-primary",
        description: "Node db-primary has no failover replica.",
        affectedComponentIds: ["db-primary"],
        evidenceIds: [],
        confidence: "verified",
        fingerprint: "spof:db-primary",
      },
      {
        id: "f-rel",
        sourceAnalyzerId: "architecture.reliability",
        category: "reliability",
        severity: "low",
        title: "Redundant replica active on db-primary",
        description: "Multi-zone failover configured.",
        affectedComponentIds: ["db-primary"],
        evidenceIds: [],
        confidence: "modeled",
        fingerprint: "rel:db-primary",
      },
    ];

    const contradictions = ContradictionDetector.detectContradictions(findings, context);
    expect(contradictions.length).toBe(1);
    expect(contradictions[0].type).toBe("redundancy_conflict");
    expect(contradictions[0].affectedComponentIds).toContain("db-primary");
    expect(contradictions[0].involvedAnalyzerIds).toContain("architecture.spof");
    expect(contradictions[0].involvedAnalyzerIds).toContain("architecture.reliability");
  });
});
