import type { BaseNode, BaseEdge } from "../schemas/graph.schema";

export interface ConnectionValidationParams {
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
  nodes: BaseNode[];
  edges: BaseEdge[];
  allowSelfConnections?: boolean;
  allowCycles?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validatePortConnection(params: ConnectionValidationParams): ValidationResult {
  const {
    sourceNodeId,
    targetNodeId,
    sourceHandleId,
    targetHandleId,
    nodes,
    edges,
    allowSelfConnections = false,
    allowCycles = true,
  } = params;

  // 1. Prevent self-connections unless explicitly allowed
  if (!allowSelfConnections && sourceNodeId === targetNodeId) {
    return {
      valid: false,
      reason: "Self-connections are not allowed on this node.",
    };
  }

  // 2. Validate source node existence
  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  if (!sourceNode) {
    return { valid: false, reason: `Source node "${sourceNodeId}" not found.` };
  }

  // 3. Validate target node existence
  const targetNode = nodes.find((n) => n.id === targetNodeId);
  if (!targetNode) {
    return { valid: false, reason: `Target node "${targetNodeId}" not found.` };
  }

  // 4. Prevent duplicate edges between the same ports
  const isDuplicate = edges.some(
    (e) =>
      e.source === sourceNodeId &&
      e.target === targetNodeId &&
      (e.sourceHandle ?? null) === (sourceHandleId ?? null) &&
      (e.targetHandle ?? null) === (targetHandleId ?? null),
  );

  if (isDuplicate) {
    return {
      valid: false,
      reason: "An identical connection between these ports already exists.",
    };
  }

  // 5. Port direction compatibility check
  if (sourceHandleId && sourceNode.ports) {
    const sourcePort = sourceNode.ports.find((p) => p.id === sourceHandleId);
    if (sourcePort && sourcePort.type === "input") {
      return {
        valid: false,
        reason: `Port "${sourcePort.name}" is an input port and cannot be an outbound source.`,
      };
    }
  }

  if (targetHandleId && targetNode.ports) {
    const targetPort = targetNode.ports.find((p) => p.id === targetHandleId);
    if (targetPort && targetPort.type === "output") {
      return {
        valid: false,
        reason: `Port "${targetPort.name}" is an output port and cannot receive inbound connections.`,
      };
    }

    // Check target port capacity
    const capacity = targetPort?.capacity ?? 1;
    const existingInboundCount = edges.filter(
      (e) => e.target === targetNodeId && e.targetHandle === targetHandleId,
    ).length;

    if (existingInboundCount >= capacity) {
      return {
        valid: false,
        reason: `Target port "${targetPort?.name ?? targetHandleId}" has reached maximum capacity (${capacity}).`,
      };
    }
  }

  // 6. Optional cycle detection
  if (!allowCycles && formsCycle(sourceNodeId, targetNodeId, edges)) {
    return {
      valid: false,
      reason: "This connection would create a closed loop/cycle which is not permitted.",
    };
  }

  return { valid: true };
}

function formsCycle(sourceId: string, targetId: string, edges: BaseEdge[]): boolean {
  // If we can reach sourceId from targetId, adding sourceId -> targetId creates a cycle
  const visited = new Set<string>();
  const queue = [targetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === sourceId) {
      return true;
    }

    if (!visited.has(current)) {
      visited.add(current);
      const downstream = edges
        .filter((e) => e.source === current)
        .map((e) => e.target);
      queue.push(...downstream);
    }
  }

  return false;
}

