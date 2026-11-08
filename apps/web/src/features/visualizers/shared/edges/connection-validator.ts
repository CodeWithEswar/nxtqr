import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

export interface ConnectionValidationResult {
  isValid: boolean;
  reason?: string;
}

export function validateGraphConnection(
  connection: {
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  },
  nodes: BaseNode[],
  existingEdges: BaseEdge[]
): ConnectionValidationResult {
  const { source, target, sourceHandle, targetHandle } = connection;

  // 1. Prevent connecting node to itself
  if (source === target) {
    return { isValid: false, reason: "Self-referential cycles are disallowed on this canvas." };
  }

  // 2. Validate nodes exist
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  if (!sourceNode || !targetNode) {
    return { isValid: false, reason: "Connected node does not exist in graph." };
  }

  // 3. Prevent duplicate edge between identical handles
  const isDuplicate = existingEdges.some(
    (e) =>
      e.source === source &&
      e.target === target &&
      e.sourceHandle === (sourceHandle ?? undefined) &&
      e.targetHandle === (targetHandle ?? undefined)
  );

  if (isDuplicate) {
    return { isValid: false, reason: "A connection already exists between these handles." };
  }

  // 4. Validate output cannot connect into output
  if (sourceNode.type === "output" && !targetNode.ports?.some((p) => p.type === "input")) {
    return { isValid: false, reason: "Cannot route from an egress sink node." };
  }

  return { isValid: true };
}

