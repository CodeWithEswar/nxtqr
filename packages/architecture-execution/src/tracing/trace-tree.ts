import type { TraceSpan } from "../schemas/distributed.schemas";

export interface TraceTreeNode {
  span: TraceSpan;
  children: TraceTreeNode[];
  depth: number;
  isCriticalPath: boolean;
  totalDurationMs: number;
}

export class TraceTreeBuilder {
  public static buildTree(spans: TraceSpan[], criticalPathIds: string[] = []): TraceTreeNode[] {
    if (!spans || spans.length === 0) return [];

    const criticalSet = new Set(criticalPathIds);
    const nodeMap = new Map<string, TraceTreeNode>();

    for (const span of spans) {
      const isCritical = criticalSet.has(span.spanId) || Boolean(span.isCriticalPath);
      const duration = (span.endMs !== undefined ? span.endMs : span.startMs) - span.startMs;
      nodeMap.set(span.spanId, {
        span,
        children: [],
        depth: 0,
        isCriticalPath: isCritical,
        totalDurationMs: duration,
      });
    }

    const roots: TraceTreeNode[] = [];

    for (const span of spans) {
      const node = nodeMap.get(span.spanId)!;
      if (span.parentSpanId && nodeMap.has(span.parentSpanId)) {
        const parent = nodeMap.get(span.parentSpanId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const setDepths = (node: TraceTreeNode, currentDepth: number) => {
      node.depth = currentDepth;
      for (const child of node.children) {
        setDepths(child, currentDepth + 1);
      }
    };

    for (const root of roots) {
      setDepths(root, 0);
    }

    return roots;
  }
}
