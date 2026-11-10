import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { infrastructureRegistry, type InfrastructureComponentDefinition } from "@nxtqr/node-registry";
import { computeStronglyConnectedComponents, type SccResult } from "../algorithms/cycles";
import { findArticulationPoints, type ArticulationResult } from "../algorithms/articulation-points";
import { findLongestPaths, type CriticalPath } from "../algorithms/critical-paths";
import { extractBoundaries, findTrustBoundaryCrossings, type BoundaryInfo, type TrustCrossing } from "../algorithms/failure-domains";

export interface EdgeConnectionInfo {
  edgeId: string;
  sourceId: string;
  targetId: string;
  isSynchronous: boolean;
  relationshipKind: string;
  protocol?: string;
}

export class GraphIndex {
  public readonly nodeMap = new Map<string, BaseNode>();
  public readonly edgeMap = new Map<string, BaseEdge>();
  public readonly infraDefMap = new Map<string, InfrastructureComponentDefinition | undefined>();

  // Adjacency
  public readonly forwardAdj = new Map<string, string[]>();
  public readonly backwardAdj = new Map<string, string[]>();
  public readonly forwardEdges = new Map<string, EdgeConnectionInfo[]>();
  public readonly undirectedAdj = new Map<string, string[]>();

  // Classifications
  public readonly entryPointIds: string[] = [];
  public readonly dataStoreIds: string[] = [];
  public readonly computeIds: string[] = [];
  public readonly queueIds: string[] = [];
  public readonly cacheIds: string[] = [];
  public readonly gatewayIds: string[] = [];

  // Precomputed graph algorithm results
  public readonly sccResult: SccResult;
  public readonly articulationResult: ArticulationResult;
  public readonly criticalPaths: CriticalPath[];
  public readonly boundaries: BoundaryInfo[];
  public readonly trustCrossings: TrustCrossing[];

  constructor(public readonly nodes: BaseNode[], public readonly edges: BaseEdge[]) {
    // 1. Populate node map & component definitions
    for (const node of nodes) {
      this.nodeMap.set(node.id, node);
      const def = infrastructureRegistry.getComponent(node.type);
      this.infraDefMap.set(node.id, def);

      this.forwardAdj.set(node.id, []);
      this.backwardAdj.set(node.id, []);
      this.forwardEdges.set(node.id, []);
      this.undirectedAdj.set(node.id, []);

      // Classify node roles based on type & capabilities
      const type = node.type.toLowerCase();
      const caps = def?.capabilities || [];

      if (
        type.includes("browser") ||
        type.includes("mobile") ||
        type.includes("desktop") ||
        type.includes("client") ||
        type.includes("ingress") ||
        type.includes("load-balancer") ||
        type.includes("api-gateway") ||
        caps.includes("traffic-distribution") ||
        caps.includes("client-interface")
      ) {
        this.entryPointIds.push(node.id);
      }

      if (
        type.includes("database") ||
        type.includes("db") ||
        type.includes("storage") ||
        caps.includes("persistence") ||
        caps.includes("relational-storage") ||
        caps.includes("nosql-storage")
      ) {
        this.dataStoreIds.push(node.id);
      }

      if (
        type.includes("cache") ||
        caps.includes("in-memory-caching") ||
        caps.includes("caching")
      ) {
        this.cacheIds.push(node.id);
      }

      if (
        type.includes("queue") ||
        type.includes("topic") ||
        type.includes("kafka") ||
        type.includes("rabbitmq") ||
        caps.includes("message-buffering") ||
        caps.includes("pub-sub")
      ) {
        this.queueIds.push(node.id);
      }

      if (
        type.includes("gateway") ||
        type.includes("proxy") ||
        caps.includes("api-routing")
      ) {
        this.gatewayIds.push(node.id);
      }

      if (
        type.includes("service") ||
        type.includes("worker") ||
        type.includes("container") ||
        type.includes("serverless") ||
        caps.includes("compute-execution")
      ) {
        this.computeIds.push(node.id);
      }
    }

    // 2. Populate edge mappings & adjacency
    for (const edge of edges) {
      this.edgeMap.set(edge.id, edge);
      const src = edge.source;
      const tgt = edge.target;

      if (!this.nodeMap.has(src) || !this.nodeMap.has(tgt)) continue;

      const relKind = (edge.data?.relationshipKind as string) || "request-response";
      const protocol = (edge.data?.protocol as string) || (edge.data?.protocolFamily as string) || "HTTPS";
      
      // Determine if edge represents synchronous communication
      const isSync =
        relKind === "request-response" ||
        relKind === "database-access" ||
        relKind === "cache-access" ||
        protocol.toUpperCase() === "HTTP" ||
        protocol.toUpperCase() === "HTTPS" ||
        protocol.toUpperCase() === "REST" ||
        protocol.toUpperCase() === "GRPC";

      this.forwardAdj.get(src)?.push(tgt);
      this.backwardAdj.get(tgt)?.push(src);

      this.forwardEdges.get(src)?.push({
        edgeId: edge.id,
        sourceId: src,
        targetId: tgt,
        isSynchronous: isSync,
        relationshipKind: relKind,
        protocol,
      });

      // Filter out structural annotation/containment edges from undirected communication graph
      if (relKind !== "containment" && relKind !== "annotation") {
        this.undirectedAdj.get(src)?.push(tgt);
        this.undirectedAdj.get(tgt)?.push(src);
      }
    }

    // 3. Compute Graph Algorithms
    const nodeIds = nodes.map((n) => n.id);
    this.sccResult = computeStronglyConnectedComponents(nodeIds, this.forwardAdj);
    this.articulationResult = findArticulationPoints(nodeIds, this.undirectedAdj);
    this.boundaries = extractBoundaries(nodes);
    this.trustCrossings = findTrustBoundaryCrossings(edges, this.boundaries);

    // Compute critical paths from identified entry points (or all nodes if no entry points)
    const criticalPathSources = this.entryPointIds.length > 0 ? this.entryPointIds : nodeIds;
    const syncAdj = new Map<string, Array<{ targetId: string; isSynchronous: boolean; latencyMs?: number }>>();
    for (const node of nodes) {
      syncAdj.set(
        node.id,
        (this.forwardEdges.get(node.id) || []).map((e) => ({
          targetId: e.targetId,
          isSynchronous: e.isSynchronous,
          latencyMs: (this.nodeMap.get(e.targetId)?.data?.latencyMs as number) ?? 5,
        }))
      );
    }
    this.criticalPaths = findLongestPaths(criticalPathSources, syncAdj);
  }

  public getInDegree(nodeId: string): number {
    return this.backwardAdj.get(nodeId)?.length || 0;
  }

  public getOutDegree(nodeId: string): number {
    return this.forwardAdj.get(nodeId)?.length || 0;
  }

  public getDownstreamNodes(nodeId: string): BaseNode[] {
    const targets = this.forwardAdj.get(nodeId) || [];
    return targets.map((id) => this.nodeMap.get(id)).filter(Boolean) as BaseNode[];
  }

  public getUpstreamNodes(nodeId: string): BaseNode[] {
    const sources = this.backwardAdj.get(nodeId) || [];
    return sources.map((id) => this.nodeMap.get(id)).filter(Boolean) as BaseNode[];
  }

  public isArticulationPoint(nodeId: string): boolean {
    return this.articulationResult.articulationPoints.has(nodeId);
  }
}
