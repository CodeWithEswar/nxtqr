import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  GraphValidationResult,
  ResolvedNodeContext,
  RuleEvaluationContext,
  ValidationFinding,
} from "../contracts/validation.types";
import { connectionValidator } from "./connection-validator";
import { FindingAggregator } from "./finding-aggregator";
import { ALL_VALIDATION_RULES } from "../rules";

export class GraphValidator {
  private edgeCache = new Map<string, { hash: string; findings: ValidationFinding[] }>();

  public validateGraph(
    nodes: readonly BaseNode[],
    edges: readonly BaseEdge[],
  ): GraphValidationResult {
    const allFindings: ValidationFinding[] = [];
    const nodeMap = new Map<string, BaseNode>(nodes.map((n) => [n.id, n]));
    const contextCache = new Map<string, ResolvedNodeContext>();

    // 1. Validate each edge connection
    for (const edge of edges) {
      const edgeHash = `${edge.id}:${edge.source}:${edge.target}:${edge.sourceHandle ?? ""}:${edge.targetHandle ?? ""}`;
      const cached = this.edgeCache.get(edge.id);

      if (cached && cached.hash === edgeHash) {
        allFindings.push(...cached.findings);
      } else {
        const result = connectionValidator.validateConnection(
          {
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            sourceHandleId: edge.sourceHandle ?? edge.sourcePort,
            targetHandleId: edge.targetHandle ?? edge.targetPort,
            edgeId: edge.id,
          },
          nodes,
          edges,
          nodeMap,
          contextCache,
        );

        const edgeFindings = result.findings.map((f) => ({
          ...f,
          edgeId: edge.id,
        }));

        this.edgeCache.set(edge.id, { hash: edgeHash, findings: edgeFindings });
        allFindings.push(...edgeFindings);
      }
    }

    // 2. Run graph-level rules (e.g. dependency rules, structural containment cycles, public auth)
    const graphContext: RuleEvaluationContext = {
      nodes,
      edges,
    };

    for (const rule of ALL_VALIDATION_RULES) {
      if (rule.category === "structural" || rule.category === "dependency" || rule.category === "component") {
        const outcome = rule.evaluate(graphContext);
        if (outcome) {
          allFindings.push({
            id: `fnd_${rule.id}_graph`,
            ruleId: rule.id,
            category: outcome.category,
            severity: outcome.severity,
            title: outcome.title,
            message: outcome.message,
            explanation: outcome.explanation,
            documentationId: outcome.documentationId,
            suggestedActions: outcome.suggestedActions,
            timestamp: Date.now(),
          });
        }
      }
    }

    const deduplicated = FindingAggregator.deduplicateFindings(allFindings);
    const summary = FindingAggregator.computeSummary(deduplicated, nodes.length, edges.length);
    const findingsByNode = FindingAggregator.groupByNode(deduplicated);
    const findingsByEdge = FindingAggregator.groupByEdge(deduplicated);

    return {
      valid: summary.isValid,
      findings: deduplicated,
      summary,
      findingsByNode,
      findingsByEdge,
      validatedAt: Date.now(),
    };
  }

  public invalidateEdge(edgeId: string): void {
    this.edgeCache.delete(edgeId);
  }

  public clearCache(): void {
    this.edgeCache.clear();
  }
}

export const graphValidator = new GraphValidator();
