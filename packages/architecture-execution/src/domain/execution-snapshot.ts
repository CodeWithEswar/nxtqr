import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";

export interface ExecutionSnapshotValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExecutionSnapshot {
  id: string;
  architectureId: string;
  architectureRevisionId: string;
  title: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  snapshotHash: string;
  createdAt: string;
  configuration: ExecutionConfiguration;
}

export class ExecutionSnapshotManager {
  /**
   * Deterministic hash computation using string DJB2 variation for architecture snapshots
   */
  public static computeHash(
    nodes: BaseNode[],
    edges: BaseEdge[],
    revisionId: string,
    entryNodeId: string
  ): string {
    const nodeKeys = nodes
      .map((n) => `${n.id}:${n.type}:${n.label || ""}:${JSON.stringify(n.data || {})}`)
      .sort()
      .join("|");

    const edgeKeys = edges
      .map((e) => `${e.id}:${e.source}->${e.target}:${e.label || ""}`)
      .sort()
      .join("|");

    const raw = `${revisionId}#${entryNodeId}#${nodeKeys}#${edgeKeys}`;
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash + raw.charCodeAt(i)) & 0x7fffffff;
    }
    return `snap_${hash.toString(16)}`;
  }

  /**
   * Captures an immutable snapshot of the active graph.
   */
  public static createSnapshot(
    architectureId: string,
    revisionId: string,
    title: string,
    nodes: BaseNode[],
    edges: BaseEdge[],
    configuration?: ExecutionConfiguration
  ): ExecutionSnapshot {
    // Deep clone nodes and edges to ensure absolute immutability during execution runs
    const clonedNodes: BaseNode[] = JSON.parse(JSON.stringify(nodes));
    const clonedEdges: BaseEdge[] = JSON.parse(JSON.stringify(edges));

    const entryNodeId = configuration?.entryNodeId || clonedNodes[0]?.id || "entry";

    const snapshotHash = this.computeHash(
      clonedNodes,
      clonedEdges,
      revisionId,
      entryNodeId
    );

    return {
      id: `snap_${Date.now()}_${snapshotHash.slice(5, 11)}`,
      architectureId,
      architectureRevisionId: revisionId,
      title,
      nodes: clonedNodes,
      edges: clonedEdges,
      snapshotHash,
      createdAt: new Date().toISOString(),
      configuration: configuration ? JSON.parse(JSON.stringify(configuration)) : ({} as any),
    };
  }

  /**
   * Validates snapshot integrity before starting an execution run.
   */
  public static validateSnapshot(
    snapshot: ExecutionSnapshot
  ): ExecutionSnapshotValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!snapshot.nodes || snapshot.nodes.length === 0) {
      errors.push("Architecture contains no nodes. Add at least one component to execute.");
      return { isValid: false, errors, warnings };
    }

    const nodeIds = new Set(snapshot.nodes.map((n) => n.id));
    if (!snapshot.configuration.entryNodeId) {
      errors.push("No entry node specified in execution configuration.");
    } else if (!nodeIds.has(snapshot.configuration.entryNodeId)) {
      errors.push(
        `Entry node "${snapshot.configuration.entryNodeId}" does not exist in the architecture.`
      );
    }

    // Edge references check
    for (const edge of snapshot.edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge "${edge.id}" references missing source node "${edge.source}".`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge "${edge.id}" references missing target node "${edge.target}".`);
      }
    }

    // Check outgoing edges from entry node
    if (snapshot.configuration.entryNodeId && nodeIds.has(snapshot.configuration.entryNodeId)) {
      const hasOutgoing = snapshot.edges.some(
        (e) => e.source === snapshot.configuration.entryNodeId
      );
      if (!hasOutgoing && snapshot.nodes.length > 1) {
        warnings.push(
          `Entry node "${snapshot.configuration.entryNodeId}" has no outgoing connections. Execution will terminate at the entry node.`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

