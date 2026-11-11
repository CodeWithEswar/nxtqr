import type { BottleneckFinding } from "../../bottlenecks/contracts/bottleneck.types";
import type { UnifiedFinding } from "../contracts/recommendations.types";

export class BottleneckAdapter {
  public static adapt(findings: BottleneckFinding[]): UnifiedFinding[] {
    if (!findings) return [];

    return findings.map((f) => ({
      id: `unified_btk_${f.id}`,
      sourceEngine: "bottlenecks",
      ruleId: f.ruleId,
      severity: f.severity,
      confidence: f.confidence,
      category: f.bottleneckType,
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
