import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";

export interface ResolvedComponentSummary {
  id: string;
  name: string;
  kind: string;
  category: string;
  tier?: string;
  criticality?: "low" | "medium" | "high" | "critical";
  inDegree: number;
  outDegree: number;
  technologies: string[];
}

export interface ResolvedDependencySummary {
  edgeId: string;
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  protocol: string;
  isSynchronous: boolean;
  isEncrypted: boolean;
}

export interface ResolvedTopologySummary {
  totalNodes: number;
  totalEdges: number;
  componentsByCategory: Record<string, number>;
  componentsByCriticality: Record<string, number>;
  components: ResolvedComponentSummary[];
  dependencies: ResolvedDependencySummary[];
  uniqueProtocols: string[];
  isolatedNodeIds: string[];
}

export class SourceResolver {
  public static resolveTopology(
    nodes: BaseNode[],
    edges: BaseEdge[]
  ): ResolvedTopologySummary {
    const nodeMap = new Map<string, BaseNode>();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    const inDegreeMap = new Map<string, number>();
    const outDegreeMap = new Map<string, number>();

    for (const node of nodes) {
      inDegreeMap.set(node.id, 0);
      outDegreeMap.set(node.id, 0);
    }

    for (const edge of edges) {
      if (outDegreeMap.has(edge.source)) {
        outDegreeMap.set(edge.source, (outDegreeMap.get(edge.source) || 0) + 1);
      }
      if (inDegreeMap.has(edge.target)) {
        inDegreeMap.set(edge.target, (inDegreeMap.get(edge.target) || 0) + 1);
      }
    }

    const componentsByCategory: Record<string, number> = {};
    const componentsByCriticality: Record<string, number> = {};
    const isolatedNodeIds: string[] = [];

    const components: ResolvedComponentSummary[] = nodes.map((node) => {
      const inDeg = inDegreeMap.get(node.id) || 0;
      const outDeg = outDegreeMap.get(node.id) || 0;
      if (inDeg === 0 && outDeg === 0) {
        isolatedNodeIds.push(node.id);
      }

      const nodeData = (node.data || {}) as Record<string, any>;
      const category = (nodeData.category as string) || (node.type as string) || "service";
      const criticality = (nodeData.criticality as any) || "medium";
      const tier = nodeData.tier as string | undefined;

      componentsByCategory[category] = (componentsByCategory[category] || 0) + 1;
      componentsByCriticality[criticality] = (componentsByCriticality[criticality] || 0) + 1;

      const technologies: string[] = [];
      if (nodeData.technology) technologies.push(String(nodeData.technology));
      if (nodeData.runtime) technologies.push(String(nodeData.runtime));
      if (nodeData.databaseType) technologies.push(String(nodeData.databaseType));

      return {
        id: node.id,
        name: (nodeData.label as string) || (nodeData.name as string) || node.id,
        kind: node.type || "default",
        category,
        tier,
        criticality,
        inDegree: inDeg,
        outDegree: outDeg,
        technologies,
      };
    });

    const protocolSet = new Set<string>();
    const dependencies: ResolvedDependencySummary[] = edges.map((edge) => {
      const edgeData = (edge.data || {}) as Record<string, any>;
      const protocol = (edgeData.protocol as string) || (edgeData.label as string) || "TCP";
      protocolSet.add(protocol.toUpperCase());

      const isSynchronous = edgeData.isSynchronous !== undefined
        ? Boolean(edgeData.isSynchronous)
        : !["kafka", "rabbitmq", "sqs", "sns", "pubsub", "async"].includes(protocol.toLowerCase());

      const isEncrypted = edgeData.isEncrypted !== undefined
        ? Boolean(edgeData.isEncrypted)
        : ["https", "tls", "wss", "grpc-tls"].includes(protocol.toLowerCase());

      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      const sourceName = sourceNode
        ? ((sourceNode.data as Record<string, any>)?.label as string) || sourceNode.id
        : edge.source;
      const targetName = targetNode
        ? ((targetNode.data as Record<string, any>)?.label as string) || targetNode.id
        : edge.target;

      return {
        edgeId: edge.id,
        sourceId: edge.source,
        sourceName,
        targetId: edge.target,
        targetName,
        protocol,
        isSynchronous,
        isEncrypted,
      };
    });

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      componentsByCategory,
      componentsByCriticality,
      components,
      dependencies,
      uniqueProtocols: Array.from(protocolSet),
      isolatedNodeIds,
    };
  }
}
