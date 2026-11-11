/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Finding Normalizer & Fingerprinting Engine
 */

import type { NormalizedFinding, FindingSeverity } from "../contracts/orchestration.types";

export interface RawFindingInput {
  id?: string;
  sourceAnalyzerId: string;
  category: string;
  severity: FindingSeverity | string;
  title: string;
  description: string;
  affectedComponentIds?: string[];
  evidenceIds?: string[];
  confidence?: "verified" | "modeled" | "assumed" | "unknown";
  remediationRecommendation?: string;
}

export class OrchestrationFindingNormalizer {
  /**
   * Generates a stable fingerprint based on analyzer, category, sorted affected components, and title key.
   */
  public static computeFingerprint(
    sourceAnalyzerId: string,
    category: string,
    affectedComponentIds: string[],
    title: string
  ): string {
    const sortedComponents = [...affectedComponentIds].sort().join(",");
    const simplifiedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 40);
    return `${sourceAnalyzerId}:${category}:[${sortedComponents}]:${simplifiedTitle}`;
  }

  /**
   * Normalizes raw finding inputs into deterministic NormalizedFinding models.
   */
  public static normalize(input: RawFindingInput): NormalizedFinding {
    const severity: FindingSeverity = this.normalizeSeverity(input.severity);
    const affectedComponentIds = input.affectedComponentIds ? [...input.affectedComponentIds] : [];
    const evidenceIds = input.evidenceIds ? [...input.evidenceIds] : [];
    const confidence = input.confidence || "modeled";

    const fingerprint = this.computeFingerprint(
      input.sourceAnalyzerId,
      input.category,
      affectedComponentIds,
      input.title
    );

    return {
      id: input.id || `find-${fingerprint}`,
      sourceAnalyzerId: input.sourceAnalyzerId,
      category: input.category,
      severity,
      title: input.title,
      description: input.description,
      affectedComponentIds,
      evidenceIds,
      confidence,
      remediationRecommendation: input.remediationRecommendation,
      fingerprint,
    };
  }

  private static normalizeSeverity(severity: string): FindingSeverity {
    const s = severity?.toLowerCase();
    if (s === "critical" || s === "fatal" || s === "blocker") return "critical";
    if (s === "high" || s === "error") return "high";
    if (s === "medium" || s === "warn" || s === "warning") return "medium";
    if (s === "low" || s === "minor") return "low";
    return "informational";
  }
}
