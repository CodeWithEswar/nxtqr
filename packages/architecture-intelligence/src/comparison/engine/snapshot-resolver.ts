import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ArchitectureSnapshot } from "../contracts/comparison.types";
import type { WorkloadScenario } from "../../bottlenecks/contracts/bottleneck.types";

export class SnapshotResolver {
  public static createSnapshot(params: {
    id?: string;
    projectId?: string | null;
    architectureId?: string;
    title: string;
    nodes: BaseNode[];
    edges: BaseEdge[];
    metadata?: Record<string, unknown>;
    workloadScenario?: WorkloadScenario;
    provenance?: ArchitectureSnapshot["provenance"];
  }): ArchitectureSnapshot {
    // Clone deeply to ensure immutability
    const clonedNodes: BaseNode[] = JSON.parse(JSON.stringify(params.nodes || []));
    const clonedEdges: BaseEdge[] = JSON.parse(JSON.stringify(params.edges || []));
    const revision = this.computeRevisionHash(clonedNodes, clonedEdges);

    return {
      id: params.id || `snap_${revision.slice(0, 12)}`,
      projectId: params.projectId || null,
      architectureId: params.architectureId,
      title: params.title || "Architecture Snapshot",
      revision,
      schemaVersion: 1,
      nodes: clonedNodes,
      edges: clonedEdges,
      metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : {},
      workloadScenario: params.workloadScenario
        ? JSON.parse(JSON.stringify(params.workloadScenario))
        : undefined,
      createdAt: new Date().toISOString(),
      provenance: params.provenance || "current-draft",
    };
  }

  public static computeRevisionHash(nodes: BaseNode[], edges: BaseEdge[]): string {
    const sortedNodes = [...nodes]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((n) => {
        const comp = (n.data?.componentType as string) || n.type || "";
        const label = n.label || "";
        const configKeys = Object.keys(n.data || {}).sort().join(",");
        return `${n.id}:${comp}:${label}:${configKeys}`;
      })
      .join("|");

    const sortedEdges = [...edges]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((e) => `${e.id}:${e.source}:${e.target}:${e.sourceHandle || ""}:${e.targetHandle || ""}`)
      .join("|");

    const raw = `${nodes.length}_${edges.length}_${sortedNodes}::${sortedEdges}`;
    return this.hashString(raw);
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

