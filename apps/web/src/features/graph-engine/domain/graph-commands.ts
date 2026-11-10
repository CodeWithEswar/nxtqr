import type { BaseNode, BaseEdge, NodePosition } from "../schemas/graph.schema";

export type CommandType =
  | "ADD_NODE"
  | "DELETE_NODES"
  | "MOVE_NODES"
  | "ADD_EDGE"
  | "DELETE_EDGE"
  | "UPDATE_NODE_CONFIG"
  | "AUTO_LAYOUT"
  | "APPLY_WHAT_IF_PLAN";

export interface GraphCommandContext {
  getNodes: () => BaseNode[];
  setNodes: (nodes: BaseNode[]) => void;
  getEdges: () => BaseEdge[];
  setEdges: (edges: BaseEdge[]) => void;
  selectNodes: (ids: string[]) => void;
}

export interface GraphCommand {
  type: CommandType;
  description: string;
  execute: (ctx: GraphCommandContext) => void;
  undo: (ctx: GraphCommandContext) => void;
}

/**
 * 1. AddNodeCommand: Adds a single node to the canvas
 */
export class AddNodeCommand implements GraphCommand {
  type: CommandType = "ADD_NODE";
  description: string;

  constructor(private node: BaseNode) {
    this.description = `Add ${node.label || node.type} node`;
  }

  execute(ctx: GraphCommandContext): void {
    const nodes = ctx.getNodes();
    ctx.setNodes([...nodes, this.node]);
    ctx.selectNodes([this.node.id]);
  }

  undo(ctx: GraphCommandContext): void {
    const nodes = ctx.getNodes();
    const edges = ctx.getEdges();
    ctx.setNodes(nodes.filter((n) => n.id !== this.node.id));
    ctx.setEdges(edges.filter((e) => e.source !== this.node.id && e.target !== this.node.id));
    ctx.selectNodes([]);
  }
}

/**
 * 2. DeleteNodesCommand: Deletes one or more nodes and their incident edges
 */
export class DeleteNodesCommand implements GraphCommand {
  type: CommandType = "DELETE_NODES";
  description: string;
  private deletedNodes: BaseNode[] = [];
  private deletedEdges: BaseEdge[] = [];

  constructor(private nodeIds: string[]) {
    this.description = `Delete ${nodeIds.length} node${nodeIds.length > 1 ? "s" : ""}`;
  }

  execute(ctx: GraphCommandContext): void {
    const nodes = ctx.getNodes();
    const edges = ctx.getEdges();

    this.deletedNodes = nodes.filter((n) => this.nodeIds.includes(n.id));
    this.deletedEdges = edges.filter(
      (e) => this.nodeIds.includes(e.source) || this.nodeIds.includes(e.target),
    );

    ctx.setNodes(nodes.filter((n) => !this.nodeIds.includes(n.id)));
    ctx.setEdges(
      edges.filter(
        (e) => !this.nodeIds.includes(e.source) && !this.nodeIds.includes(e.target),
      ),
    );
    ctx.selectNodes([]);
  }

  undo(ctx: GraphCommandContext): void {
    const nodes = ctx.getNodes();
    const edges = ctx.getEdges();

    ctx.setNodes([...nodes, ...this.deletedNodes]);
    ctx.setEdges([...edges, ...this.deletedEdges]);
    ctx.selectNodes(this.nodeIds);
  }
}

/**
 * 3. MoveNodesCommand: Groups continuous drag movement into a single undoable transaction
 */
export class MoveNodesCommand implements GraphCommand {
  type: CommandType = "MOVE_NODES";
  description: string;

  constructor(
    private moves: {
      nodeId: string;
      from: NodePosition;
      to: NodePosition;
    }[],
  ) {
    this.description = `Move ${moves.length} node${moves.length > 1 ? "s" : ""}`;
  }

  execute(ctx: GraphCommandContext): void {
    const nodes = ctx.getNodes();
    const moveMap = new Map(this.moves.map((m) => [m.nodeId, m.to]));

    ctx.setNodes(
      nodes.map((n) => {
        const nextPos = moveMap.get(n.id);
        return nextPos ? { ...n, position: nextPos } : n;
      }),
    );
  }

  undo(ctx: GraphCommandContext): void {
    const nodes = ctx.getNodes();
    const revertMap = new Map(this.moves.map((m) => [m.nodeId, m.from]));

    ctx.setNodes(
      nodes.map((n) => {
        const prevPos = revertMap.get(n.id);
        return prevPos ? { ...n, position: prevPos } : n;
      }),
    );
  }
}

/**
 * 4. AddEdgeCommand: Creates an edge between two nodes/ports
 */
export class AddEdgeCommand implements GraphCommand {
  type: CommandType = "ADD_EDGE";
  description: string;

  constructor(private edge: BaseEdge) {
    this.description = `Connect ${edge.source} -> ${edge.target}`;
  }

  execute(ctx: GraphCommandContext): void {
    const edges = ctx.getEdges();
    ctx.setEdges([...edges, this.edge]);
  }

  undo(ctx: GraphCommandContext): void {
    const edges = ctx.getEdges();
    ctx.setEdges(edges.filter((e) => e.id !== this.edge.id));
  }
}

/**
 * 5. DeleteEdgeCommand: Removes a single edge
 */
export class DeleteEdgeCommand implements GraphCommand {
  type: CommandType = "DELETE_EDGE";
  description: string;
  private deletedEdge?: BaseEdge;

  constructor(private edgeId: string) {
    this.description = `Delete connection ${edgeId}`;
  }

  execute(ctx: GraphCommandContext): void {
    const edges = ctx.getEdges();
    this.deletedEdge = edges.find((e) => e.id === this.edgeId);
    ctx.setEdges(edges.filter((e) => e.id !== this.edgeId));
  }

  undo(ctx: GraphCommandContext): void {
    if (!this.deletedEdge) return;
    const edges = ctx.getEdges();
    ctx.setEdges([...edges, this.deletedEdge]);
  }
}

/**
 * 6. UpdateNodeConfigCommand: Updates label and data payload
 */
export class UpdateNodeConfigCommand implements GraphCommand {
  type: CommandType = "UPDATE_NODE_CONFIG";
  description: string;

  constructor(
    private nodeId: string,
    private prevConfig: { label?: string; description?: string; data: Record<string, unknown> },
    private nextConfig: { label?: string; description?: string; data: Record<string, unknown> },
  ) {
    this.description = `Update node ${nodeId} config`;
  }

  execute(ctx: GraphCommandContext): void {
    const nodes = ctx.getNodes();
    ctx.setNodes(
      nodes.map((n) =>
        n.id === this.nodeId
          ? {
              ...n,
              label: this.nextConfig.label !== undefined ? this.nextConfig.label : n.label,
              description:
                this.nextConfig.description !== undefined
                  ? this.nextConfig.description
                  : n.description,
              data: { ...n.data, ...this.nextConfig.data },
            }
          : n,
      ),
    );
  }

  undo(ctx: GraphCommandContext): void {
    const nodes = ctx.getNodes();
    ctx.setNodes(
      nodes.map((n) =>
        n.id === this.nodeId
          ? {
              ...n,
              label: this.prevConfig.label,
              description: this.prevConfig.description,
              data: { ...this.prevConfig.data },
            }
          : n,
      ),
    );
  }
}

/**
 * 7. AutoLayoutCommand: Applies positions computed by ELK.js
 */
export class AutoLayoutCommand implements GraphCommand {
  type: CommandType = "AUTO_LAYOUT";
  description = "Automatic Layout";

  constructor(
    private prevPositions: Map<string, NodePosition>,
    private nextPositions: Map<string, NodePosition>,
  ) {}

  execute(ctx: GraphCommandContext): void {
    const nodes = ctx.getNodes();
    ctx.setNodes(
      nodes.map((n) => {
        const next = this.nextPositions.get(n.id);
        return next ? { ...n, position: next } : n;
      }),
    );
  }

  undo(ctx: GraphCommandContext): void {
    const nodes = ctx.getNodes();
    ctx.setNodes(
      nodes.map((n) => {
        const prev = this.prevPositions.get(n.id);
        return prev ? { ...n, position: prev } : n;
      }),
    );
  }
}

/**
 * 8. ApplyWhatIfPlanCommand: Atomically applies proposed graph changes from a What-If scalability plan
 */
export class ApplyWhatIfPlanCommand implements GraphCommand {
  type: CommandType = "APPLY_WHAT_IF_PLAN";
  description: string;

  constructor(
    private prevNodes: BaseNode[],
    private prevEdges: BaseEdge[],
    private nextNodes: BaseNode[],
    private nextEdges: BaseEdge[],
    planTitle: string,
  ) {
    this.description = `Apply What-If Plan: ${planTitle}`;
  }

  execute(ctx: GraphCommandContext): void {
    ctx.setNodes(this.nextNodes);
    ctx.setEdges(this.nextEdges);
  }

  undo(ctx: GraphCommandContext): void {
    ctx.setNodes(this.prevNodes);
    ctx.setEdges(this.prevEdges);
  }
}

