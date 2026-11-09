import ELK, { type ElkNode, type ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { BaseNode, BaseEdge, NodePosition } from "../schemas/graph.schema";

let elkInstance: InstanceType<typeof ELK> | null = null;

function getElkInstance(): InstanceType<typeof ELK> {
  if (!elkInstance) {
    elkInstance = new ELK();
  }
  return elkInstance;
}

export type LayoutDirection = "LR" | "TB" | "RL" | "BT";

export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeSpacing?: number;
  layerSpacing?: number;
}

const DIRECTION_MAP: Record<LayoutDirection, string> = {
  LR: "RIGHT",
  TB: "DOWN",
  RL: "LEFT",
  BT: "UP",
};

export async function computeElkLayout(
  nodes: BaseNode[],
  edges: BaseEdge[],
  options: LayoutOptions = {},
): Promise<Map<string, NodePosition>> {
  if (nodes.length === 0) {
    return new Map();
  }

  const { direction = "LR", nodeSpacing = 50, layerSpacing = 100 } = options;
  const elkDirection = DIRECTION_MAP[direction] ?? "RIGHT";

  const elkNodes: ElkNode[] = nodes.map((node) => ({
    id: node.id,
    width: node.dimensions?.width ?? 200,
    height: node.dimensions?.height ?? 80,
  }));

  const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": elkDirection,
      "elk.spacing.nodeNode": String(nodeSpacing),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(layerSpacing),
      "elk.edgeRouting": "SPLINES",
    },
    children: elkNodes,
    edges: elkEdges,
  };

  try {
    const elk = getElkInstance();
    const layouted = await elk.layout(graph);
    const positionMap = new Map<string, NodePosition>();

    if (layouted.children) {
      for (const child of layouted.children) {
        if (child.id && typeof child.x === "number" && typeof child.y === "number") {
          positionMap.set(child.id, {
            x: Math.round(child.x),
            y: Math.round(child.y),
          });
        }
      }
    }

    return positionMap;
  } catch (err) {
    console.error("[GraphLayout] ELK calculation failed:", err);
    // Return unchanged current positions on failure
    const fallbackMap = new Map<string, NodePosition>();
    nodes.forEach((n) => fallbackMap.set(n.id, n.position));
    return fallbackMap;
  }
}

