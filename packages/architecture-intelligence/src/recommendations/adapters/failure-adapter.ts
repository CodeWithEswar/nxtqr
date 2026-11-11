import type { FailureFinding } from "../../failure-analysis/contracts/failure.types";
import type { UnifiedFinding } from "../contracts/recommendations.types";

export class FailureAdapter {
  public static adapt(findings: FailureFinding[]): UnifiedFinding[] {
    if (!findings) return [];

    return findings.map((f) => ({
      id: `unified_spof_${f.id}`,
      sourceEngine: "spof",
      ruleId: f.ruleId,
      severity: f.severity,
      confidence: f.confidence,
      category: f.classification,
      title: f.title,
      explanation: f.explanation,
      affectedNodeIds: f.affectedNodeIds || [],
      affectedEdgeIds: f.affectedEdgeIds || [],
      evidence: (f.evidence || []).map((ev) => ({
        kind: (ev.targetType === "graph" ? "node" : ev.targetType) as any,
        elementId: ev.targetId,
        description: ev.description,
        actualValue: ev.value,
      })),
      assumptions: f.assumptions || [],
      remediationHint: f.recommendationIds?.join("; ") || undefined,
      rawFindingId: f.id,
    }));
  }
}
