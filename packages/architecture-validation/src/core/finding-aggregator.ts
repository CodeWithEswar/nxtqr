import type {
  ValidationFinding,
  GraphValidationSummary,
  ValidationCategory,
} from "../contracts/validation.types";
import { getDocumentationLink } from "../messages/validation-messages";

export class FindingAggregator {
  public static deduplicateFindings(findings: readonly ValidationFinding[]): ValidationFinding[] {
    const seen = new Set<string>();
    const deduplicated: ValidationFinding[] = [];

    for (const f of findings) {
      const key = `${f.ruleId}:${f.sourceNodeId ?? ""}:${f.targetNodeId ?? ""}:${f.sourcePortId ?? ""}:${f.targetPortId ?? ""}:${f.edgeId ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        // Enrich with documentation path if needed
        const enriched = { ...f };
        if (f.documentationId && !f.documentationPath) {
          const doc = getDocumentationLink(f.documentationId);
          if (doc) enriched.documentationPath = doc.path;
        }
        deduplicated.push(enriched);
      }
    }

    return deduplicated;
  }

  public static computeSummary(
    findings: readonly ValidationFinding[],
    componentCount: number,
    connectionCount: number,
  ): GraphValidationSummary {
    let errors = 0;
    let warnings = 0;
    let info = 0;

    const byCategory: Record<ValidationCategory, number> = {
      component: 0,
      connection: 0,
      relationship: 0,
      structural: 0,
      dependency: 0,
      integrity: 0,
    };

    for (const f of findings) {
      if (f.severity === "error") errors++;
      else if (f.severity === "warning") warnings++;
      else if (f.severity === "info") info++;

      if (byCategory[f.category] !== undefined) {
        byCategory[f.category]++;
      }
    }

    return {
      totalFindings: findings.length,
      errors,
      warnings,
      info,
      byCategory,
      componentCount,
      connectionCount,
      isValid: errors === 0,
    };
  }

  public static groupByNode(
    findings: readonly ValidationFinding[],
  ): Record<string, ValidationFinding[]> {
    const grouped: Record<string, ValidationFinding[]> = {};

    for (const f of findings) {
      if (f.sourceNodeId) {
        if (!grouped[f.sourceNodeId]) grouped[f.sourceNodeId] = [];
        grouped[f.sourceNodeId].push(f);
      }
      if (f.targetNodeId && f.targetNodeId !== f.sourceNodeId) {
        if (!grouped[f.targetNodeId]) grouped[f.targetNodeId] = [];
        grouped[f.targetNodeId].push(f);
      }
    }

    return grouped;
  }

  public static groupByEdge(
    findings: readonly ValidationFinding[],
  ): Record<string, ValidationFinding[]> {
    const grouped: Record<string, ValidationFinding[]> = {};

    for (const f of findings) {
      if (f.edgeId) {
        if (!grouped[f.edgeId]) grouped[f.edgeId] = [];
        grouped[f.edgeId].push(f);
      }
    }

    return grouped;
  }
}
