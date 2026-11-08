import ELK, { type ElkNode, type ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

const elk = new ELK();

export interface LayoutOptions {
  direction?: "RIGHT" | "DOWN";
  nodeSpacing?: number;
  layerSpacing?: number;
}

export async function layoutGraphWithElk(
  nodes: BaseNode[],
  edges: BaseEdge[],
  options: LayoutOptions = {}
): Promise<{ nodes: BaseNode[]; edges: BaseEdge[] }> {
  const { direction = "RIGHT", nodeSpacing = 40, layerSpacing = 80 } = options;

  const elkNodes: ElkNode[] = nodes.map((node) => ({
    id: node.id,
    width: 220,
    height: 90,
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
      "elk.direction": direction,
      "elk.spacing.nodeNode": String(nodeSpacing),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(layerSpacing),
      "elk.edgeRouting": "SPLINES",
    },
    children: elkNodes,
    edges: elkEdges,
  };

  try {
    const layouted = await elk.layout(graph);
    if (!layouted.children) {
      return { nodes, edges };
    }

    const positionMap = new Map<string, { x: number; y: number }>();
    for (const child of layouted.children) {
      if (child.id && typeof child.x === "number" && typeof child.y === "number") {
        positionMap.set(child.id, { x: child.x, y: child.y });
      }
    }

    const updatedNodes = nodes.map((n) => {
      const pos = positionMap.get(n.id);
      return pos ? { ...n, position: pos } : n;
    });

    return { nodes: updatedNodes, edges };
  } catch (err) {
    console.error("[ELK Layout] Layout failed:", err);
    return { nodes, edges };
  }
}

