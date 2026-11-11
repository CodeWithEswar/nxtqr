/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Verification Coverage Analyzer
 */

import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  ArchitectureRequirement,
  ArchitectureTest,
  VerificationEvidence,
  VerificationCoverageResult,
} from "../contracts/verification.types";

export class CoverageAnalyzer {
  /**
   * Computes comprehensive verification coverage across requirements, components, and evidence.
   */
  public static calculateCoverage(
    requirements: ArchitectureRequirement[],
    tests: ArchitectureTest[],
    nodes: BaseNode[],
    evidenceCatalog: VerificationEvidence[]
  ): VerificationCoverageResult {
    // 1. Requirement Coverage
    const totalRequirementsCount = requirements.length;
    const coveredReqs = requirements.filter((req) =>
      tests.some((t) => t.requirementIds && t.requirementIds.includes(req.id))
    );
    const coveredRequirementsCount = coveredReqs.length;
    const requirementCoveragePercent =
      totalRequirementsCount > 0
        ? Math.round((coveredRequirementsCount / totalRequirementsCount) * 100)
        : 100;

    // 2. Component Coverage
    const totalComponentsCount = nodes.length;
    const coveredNodeIds = new Set<string>();

    for (const test of tests) {
      if (test.scope.level === "architecture" || test.scope.level === "project") {
        nodes.forEach((n) => coveredNodeIds.add(n.id));
      } else if (test.scope.level === "component") {
        if (test.scope.targetIds && test.scope.targetIds.length > 0) {
          test.scope.targetIds.forEach((id) => coveredNodeIds.add(id));
        } else {
          // Category-wide matching
          nodes.forEach((n) => {
            if (test.category === "database" && (n.data as any)?.nodeType === "database") {
              coveredNodeIds.add(n.id);
            } else if (
              test.category === "messaging" &&
              ((n.data as any)?.nodeType === "queue" || (n.data as any)?.nodeType === "topic")
            ) {
              coveredNodeIds.add(n.id);
            } else if (test.category === "network" && (n.data as any)?.nodeType === "gateway") {
              coveredNodeIds.add(n.id);
            }
          });
        }
      }
    }

    const testedComponentsCount = Math.min(coveredNodeIds.size, totalComponentsCount);
    const componentCoveragePercent =
      totalComponentsCount > 0
        ? Math.round((testedComponentsCount / totalComponentsCount) * 100)
        : 100;

    // 3. Evidence Coverage
    const requiredEvidenceTypes = new Set<string>();
    for (const test of tests) {
      test.requiredEvidenceTypes.forEach((et) => requiredEvidenceTypes.add(et));
    }

    const suppliedEvidenceTypes = new Set<string>(evidenceCatalog.map((e) => e.evidenceType));

    let suppliedCount = 0;
    for (const reqType of requiredEvidenceTypes) {
      if (suppliedEvidenceTypes.has(reqType)) {
        suppliedCount++;
      }
    }

    const evidenceCoveragePercent =
      requiredEvidenceTypes.size > 0
        ? Math.round((suppliedCount / requiredEvidenceTypes.size) * 100)
        : 100;

    return {
      totalRequirementsCount,
      coveredRequirementsCount,
      requirementCoveragePercent,
      totalComponentsCount,
      testedComponentsCount,
      componentCoveragePercent,
      evidenceTypesRequiredCount: requiredEvidenceTypes.size,
      evidenceTypesSuppliedCount: suppliedCount,
      evidenceCoveragePercent,
    };
  }
}

