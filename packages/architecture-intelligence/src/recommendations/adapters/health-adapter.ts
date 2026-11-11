import type { HealthFinding } from "../../contracts/health.types";
import type { UnifiedFinding } from "../contracts/recommendations.types";

export class HealthAdapter {
  public static adapt(findings: HealthFinding[]): UnifiedFinding[] {
    if (!findings) return [];

    return findings.map((f) => ({
      id: `unified_health_${f.id}`,
      sourceEngine: "health",
      ruleId: f.ruleId,
      severity: f.severity,
      confidence: f.confidence,
      category: f.dimension,
      title: f.title,
      explanation: f.explanation,
      affectedNodeIds: f.affectedNodeIds || [],
      affectedEdgeIds: f.affectedEdgeIds || [],
      evidence: f.evidence || [],
      assumptions: f.assumptions || [],
      remediationHint: undefined,
      rawFindingId: f.id,
    }));
  }
}
