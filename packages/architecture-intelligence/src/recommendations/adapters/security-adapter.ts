import type { SecurityFinding } from "../../security-analysis/schemas/security.schemas";
import type { UnifiedFinding } from "../contracts/recommendations.types";

export class SecurityAdapter {
  public static adapt(findings: SecurityFinding[]): UnifiedFinding[] {
    if (!findings) return [];

    return findings.map((f) => ({
      id: `unified_sec_${f.id}`,
      sourceEngine: "security",
      ruleId: f.ruleId,
      severity: f.severity,
      confidence: f.confidence,
      category: f.category,
      title: f.title,
      explanation: f.explanation,
      affectedNodeIds: f.affectedNodeIds || [],
      affectedEdgeIds: f.affectedEdgeIds || [],
      evidence: f.evidence || [],
      assumptions: f.assumptions || [],
      remediationHint: f.recommendationIds?.join("; ") || undefined,
      rawFindingId: f.id,
    }));
  }
}
