import type {
  BaseNode,
  BaseEdge,
  ClipboardPayload,
} from "../schemas/graph.schema";
import { ClipboardPayloadSchema, CURRENT_GRAPH_SCHEMA_VERSION } from "../schemas/graph.schema";

let memoryClipboard: ClipboardPayload | null = null;

export const CLIPBOARD_PASTE_OFFSET = { x: 40, y: 40 };

export function copyGraphSelection(
  selectedNodeIds: string[],
  nodes: BaseNode[],
  edges: BaseEdge[],
): ClipboardPayload | null {
  if (selectedNodeIds.length === 0) return null;

  const copiedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
  if (copiedNodes.length === 0) return null;

  // Only copy edges whose BOTH source AND target are in the selected set
  const copiedEdges = edges.filter(
    (e) => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target),
  );

  const payload: ClipboardPayload = {
    version: CURRENT_GRAPH_SCHEMA_VERSION,
    nodes: copiedNodes,
    edges: copiedEdges,
    copiedAt: new Date().toISOString(),
  };

  memoryClipboard = payload;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    } catch {
      // In-memory fallback
    }
  }

  return payload;
}

export function parseClipboardPayload(jsonString: string): ClipboardPayload | null {
  try {
    const raw = JSON.parse(jsonString);
    const parsed = ClipboardPayloadSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function getClipboardData(): ClipboardPayload | null {
  return memoryClipboard;
}

export function preparePastedEntities(
  payload: ClipboardPayload,
  offset = CLIPBOARD_PASTE_OFFSET,
): { nodes: BaseNode[]; edges: BaseEdge[] } {
  const idMap = new Map<string, string>();

  // 1. Generate new IDs and update positions
  const newNodes: BaseNode[] = payload.nodes.map((node) => {
    const newId = `node_${crypto.randomUUID().slice(0, 8)}`;
    idMap.set(node.id, newId);

    return {
      ...node,
      id: newId,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      label: node.label ? `${node.label} (Copy)` : undefined,
    };
  });

  // 2. Remap edge endpoints to point to the new node IDs
  const newEdges: BaseEdge[] = payload.edges
    .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
    .map((edge) => {
      const newEdgeId = `edge_${crypto.randomUUID().slice(0, 8)}`;
      return {
        ...edge,
        id: newEdgeId,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
      };
    });

  return { nodes: newNodes, edges: newEdges };
}

