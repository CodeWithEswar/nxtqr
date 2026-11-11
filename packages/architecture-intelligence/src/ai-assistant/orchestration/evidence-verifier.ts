import type { AICitation, AIExecutionContext } from "../contracts/ai-assistant.types";

export class EvidenceVerifier {
  /**
   * Validates citations against the actual architecture context.
   * Filters out hallucinations and enriches valid citations with real labels.
   */
  public static verifyCitations(
    citations: AICitation[],
    context: AIExecutionContext
  ): { validCitations: AICitation[]; invalidCount: number } {
    if (!citations || citations.length === 0) {
      return { validCitations: [], invalidCount: 0 };
    }

    const nodeMap = new Map(context.nodes.map((n) => [n.id, n]));
    const edgeMap = new Map(context.edges.map((e) => [e.id, e]));

    const valid: AICitation[] = [];
    let invalid = 0;

    for (const cite of citations) {
      switch (cite.type) {
        case "node": {
          const node = nodeMap.get(cite.targetId);
          if (node) {
            valid.push({
              ...cite,
              label: cite.label || (node.label || (node.data as any)?.label || node.id),
              category: node.type,
            });
          } else {
            invalid++;
          }
          break;
        }

        case "edge": {
          const edge = edgeMap.get(cite.targetId);
          if (edge) {
            valid.push({
              ...cite,
              label: cite.label || `${edge.source} → ${edge.target}`,
            });
          } else {
            invalid++;
          }
          break;
        }

        case "finding":
        case "recommendation":
        case "doc":
        case "comparison": {
          // Verify non-empty targetId
          if (cite.targetId && cite.targetId.trim().length > 0) {
            valid.push(cite);
          } else {
            invalid++;
          }
          break;
        }

        default:
          invalid++;
      }
    }

    return {
      validCitations: valid,
      invalidCount: invalid,
    };
  }

  /**
   * Scans text for markdown references like `[node:checkout-db]` or `[finding:SPOF-001]`
   * and extracts candidate citations automatically.
   */
  public static extractImplicitCitations(
    text: string,
    context: AIExecutionContext
  ): AICitation[] {
    const citations: AICitation[] = [];
    const seen = new Set<string>();

    // 1. Check for node mentions by ID in backticks or words: e.g. `auth-service`
    for (const node of context.nodes) {
      if (seen.has(node.id)) continue;
      // Match `nodeId` or #nodeId
      const regex = new RegExp(`(\`${node.id}\`|#${node.id}|\\b${node.id}\\b)`, "i");
      if (regex.test(text)) {
        seen.add(node.id);
        citations.push({
          type: "node",
          targetId: node.id,
          label: (node.label || (node.data as any)?.label || node.id) as string,
          category: node.type,
        });
      }
    }

    return citations;
  }
}
