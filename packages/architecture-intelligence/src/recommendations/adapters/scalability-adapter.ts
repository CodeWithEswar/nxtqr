import type { ScalabilityRecommendation } from "../../scalability/schemas/scalability.schemas";
import type { UnifiedFinding, UnifiedSeverity } from "../contracts/recommendations.types";

export class ScalabilityAdapter {
  public static adapt(recs: ScalabilityRecommendation[]): UnifiedFinding[] {
    if (!recs) return [];

    return recs.map((r) => {
      let severity: UnifiedSeverity = "medium";
      if (r.rankScore >= 80) severity = "high";
      else if (r.rankScore >= 50) severity = "medium";
      else severity = "low";

      return {
        id: `unified_scale_${r.id}`,
        sourceEngine: "scalability",
        ruleId: r.strategy,
        severity,
        confidence: r.confidence,
        category: "scalability-constraint",
        title: r.title,
        explanation: r.summary,
        affectedNodeIds: r.affectedNodeIds || [],
        affectedEdgeIds: r.affectedEdgeIds || [],
        evidence: r.evidence || [],
        assumptions: r.assumptions || [],
        remediationHint: r.benefits.join("; "),
        rawFindingId: r.id,
      };
    });
  }
}
