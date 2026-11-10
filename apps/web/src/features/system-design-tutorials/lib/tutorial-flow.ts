import type { BaseEdge } from "@nxtqr/graph-schema";

export const TUTORIAL_FLOW_HOP_MS = 620;

type FlowEdge = Pick<BaseEdge, "id" | "source" | "target">;

export function orderTutorialFlow(edges: readonly FlowEdge[]): string[] {
  const outgoing = new Map<string, FlowEdge[]>();
  const targets = new Set<string>();
  for (const edge of edges) {
    const links = outgoing.get(edge.source);
    if (links) links.push(edge);
    else outgoing.set(edge.source, [edge]);
    targets.add(edge.target);
  }

  const ordered = new Set<string>();
  function follow(source: string) {
    for (const edge of outgoing.get(source) ?? []) {
      if (ordered.has(edge.id)) continue;
      ordered.add(edge.id);
      follow(edge.target);
    }
  }

  for (const source of outgoing.keys()) {
    if (!targets.has(source)) follow(source);
  }
  // Closed loops have no root. Begin those at the first authored edge.
  for (const edge of edges) {
    if (!ordered.has(edge.id)) follow(edge.source);
  }
  return [...ordered];
}
