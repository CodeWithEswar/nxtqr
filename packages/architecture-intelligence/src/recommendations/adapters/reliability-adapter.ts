import type { ReliabilityFinding } from "../../reliability/schemas/reliability.schemas";
import type { UnifiedFinding } from "../contracts/recommendations.types";

export class ReliabilityAdapter {
  public static adapt(findings: ReliabilityFinding[]): UnifiedFinding[] {
    if (!findings) return [];

    return findings.map((f) => ({
      id: `unified_rel_${f.id}`,
      sourceEngine: "reliability",
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
      remediationHint: f.remediation,
      rawFindingId: f.id,
    }));
  }
}
