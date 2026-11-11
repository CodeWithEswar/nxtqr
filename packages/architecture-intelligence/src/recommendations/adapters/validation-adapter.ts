import type { GraphValidationResult } from "@nxtqr/architecture-validation";
import type { UnifiedFinding, UnifiedSeverity } from "../contracts/recommendations.types";

export class ValidationAdapter {
  public static adapt(result: GraphValidationResult): UnifiedFinding[] {
    if (!result) return [];

    const findings = result.findings || [];
    return findings.map((f, index) => {
      let severity: UnifiedSeverity = "medium";
      if (f.severity === "error") severity = "critical";
      else if (f.severity === "warning") severity = "high";
      else if (f.severity === "info") severity = "low";

      const affectedNodes: string[] = [];
      if (f.sourceNodeId) affectedNodes.push(f.sourceNodeId);
      if (f.targetNodeId) affectedNodes.push(f.targetNodeId);

      const affectedEdges: string[] = [];
      if (f.edgeId) affectedEdges.push(f.edgeId);

      return {
        id: `unified_val_${f.id || f.ruleId}_${index}`,
        sourceEngine: "validation",
        ruleId: f.ruleId,
        severity,
        confidence: "high",
        category: f.category || "architecture-integrity",
        title: f.title || `Validation Constraint: ${f.ruleId}`,
        explanation: f.explanation || f.message,
        affectedNodeIds: affectedNodes,
        affectedEdgeIds: affectedEdges,
        evidence: [
          {
            kind: "node",
            propertyKey: "validationFinding",
            actualValue: f.ruleId,
            description: f.message,
          },
        ],
        assumptions: ["Graph must comply with typed port, connection, and topology constraints."],
        remediationHint: f.suggestedActions?.[0]?.label,
        rawFindingId: f.id || `${f.ruleId}_${index}`,
      };
    });
  }
}
