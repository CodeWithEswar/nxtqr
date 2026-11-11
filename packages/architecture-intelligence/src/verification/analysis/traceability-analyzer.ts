/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Bidirectional Traceability Analyzer
 */

import type {
  ArchitectureRequirement,
  ArchitectureTest,
  VerificationResult,
  TraceabilityItem,
} from "../contracts/verification.types";

export class TraceabilityAnalyzer {
  /**
   * Constructs a bidirectional traceability matrix mapping requirements to tests, evidence, and results.
   */
  public static buildTraceability(
    requirements: ArchitectureRequirement[],
    tests: ArchitectureTest[],
    results: VerificationResult[]
  ): TraceabilityItem[] {
    const resultMap = new Map<string, VerificationResult>();
    for (const r of results) {
      resultMap.set(r.testId, r);
    }

    return requirements.map((req) => {
      // Find tests linked to this requirement
      const linkedTests = tests.filter(
        (t) => t.requirementIds && t.requirementIds.includes(req.id)
      );

      const linkedTestIds = linkedTests.map((t) => t.id);

      // Determine aggregated latest status
      let latestStatus: TraceabilityItem["latestStatus"] = "no_tests";
      const affectedComponents = new Set<string>();
      const evidenceSet = new Set<string>();

      if (linkedTests.length > 0) {
        const linkedResults = linkedTestIds
          .map((tid) => resultMap.get(tid))
          .filter((r): r is VerificationResult => r !== undefined);

        if (linkedResults.length === 0) {
          latestStatus = "unknown";
        } else if (linkedResults.some((r) => r.status === "fail")) {
          latestStatus = "fail";
        } else if (linkedResults.some((r) => r.status === "unknown")) {
          latestStatus = "unknown";
        } else if (linkedResults.every((r) => r.status === "pass")) {
          latestStatus = "pass";
        } else if (linkedResults.every((r) => r.status === "not_applicable")) {
          latestStatus = "not_applicable";
        } else {
          latestStatus = "pass";
        }

        for (const res of linkedResults) {
          res.affectedComponentIds.forEach((c) => affectedComponents.add(c));
          res.evidenceIds.forEach((e) => evidenceSet.add(e));
        }
      }

      return {
        requirementId: req.id,
        requirementTitle: req.title,
        criticality: req.criticality,
        linkedTestIds,
        latestStatus,
        coveredComponentsCount: affectedComponents.size,
        evidenceAttachedCount: evidenceSet.size,
      };
    });
  }
}

