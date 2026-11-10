import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type { WorkloadScenario } from "../contracts/bottleneck.types";

export interface NodeTrafficDemand {
  totalRps: number;
  readRps: number;
  writeRps: number;
  messageArrivalRate?: number;
  bandwidthMbps: number;
}

export class TrafficResolver {
  public static resolveTraffic(
    nodes: BaseNode[],
    _edges: BaseEdge[],
    index: GraphIndex,
    scenario: WorkloadScenario
  ): Map<string, NodeTrafficDemand> {
    const demandMap = new Map<string, NodeTrafficDemand>();
    for (const node of nodes) {
      demandMap.set(node.id, {
        totalRps: 0,
        readRps: 0,
        writeRps: 0,
        bandwidthMbps: 0,
      });
    }

    const {
      ingressRps,
      peakMultiplier,
      readRatio,
      avgRequestSizeBytes,
      avgResponseSizeBytes,
      cacheHitRate,
      retryAmplificationFactor = 1.0,
    } = scenario.parameters;

    const effectiveIngressRps = ingressRps * peakMultiplier;
    const initialReadRps = effectiveIngressRps * readRatio;
    const initialWriteRps = effectiveIngressRps * (1 - readRatio);

    // Identify starting entry points
    let startNodeIds = index.entryPointIds;
    if (startNodeIds.length === 0) {
      const zeroInDegree = nodes.filter((n) => index.getInDegree(n.id) === 0).map((n) => n.id);
      startNodeIds = zeroInDegree.length > 0 ? zeroInDegree : nodes.map((n) => n.id);
    }

    // Split ingress demand across starting entry points
    const perIngressRps = effectiveIngressRps / Math.max(1, startNodeIds.length);
    const perIngressRead = initialReadRps / Math.max(1, startNodeIds.length);
    const perIngressWrite = initialWriteRps / Math.max(1, startNodeIds.length);

    for (const startId of startNodeIds) {
      const cur = demandMap.get(startId);
      if (cur) {
        cur.totalRps += perIngressRps;
        cur.readRps += perIngressRead;
        cur.writeRps += perIngressWrite;
      }
    }

    // Queue-based BFS propagation along valid data-plane edges
    const queue: string[] = [...startNodeIds];
    const visitCount = new Map<string, number>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const count = (visitCount.get(currentId) || 0) + 1;
      visitCount.set(currentId, count);

      // Prevent infinite loops on cyclic service graphs
      if (count > 10) continue;

      const currentDemand = demandMap.get(currentId)!;
      const outgoingEdges = index.forwardEdges.get(currentId) || [];

      // Filter out non-traffic edges
      const dataEdges = outgoingEdges.filter(
        (e) =>
          e.relationshipKind !== "containment" &&
          e.relationshipKind !== "annotation" &&
          e.relationshipKind !== "control-plane" &&
          e.relationshipKind !== "observability"
      );

      if (dataEdges.length === 0) continue;

      // Check if current node is a load balancer (divides traffic among targets)
      const currentNode = index.nodeMap.get(currentId);
      const isLoadBalancer = currentNode?.type.toLowerCase().includes("load-balancer");

      for (const edge of dataEdges) {
        const targetNode = index.nodeMap.get(edge.targetId);
        if (!targetNode) continue;

        const targetDemand = demandMap.get(edge.targetId);
        if (!targetDemand) continue;

        let propagatedRps = currentDemand.totalRps * retryAmplificationFactor;
        let propagatedRead = currentDemand.readRps * retryAmplificationFactor;
        let propagatedWrite = currentDemand.writeRps * retryAmplificationFactor;

        // If load balancer, distribute traffic equally
        if (isLoadBalancer) {
          propagatedRps /= dataEdges.length;
          propagatedRead /= dataEdges.length;
          propagatedWrite /= dataEdges.length;
        }

        // Cache behavior: downstream database receives only cache misses + writes
        const isTargetCache = index.cacheIds.includes(edge.targetId);
        const isTargetDatabase = index.dataStoreIds.includes(edge.targetId);

        if (isTargetCache) {
          // Cache absorbs reads
          targetDemand.totalRps += propagatedRead;
          targetDemand.readRps += propagatedRead;
          queue.push(edge.targetId);
        } else if (isTargetDatabase) {
          // If the upstream is a cache or if a cache is present in parallel
          const upstreams = index.getUpstreamNodes(edge.targetId);
          const hasCacheUpstream = upstreams.some((u) => index.cacheIds.includes(u.id));

          if (hasCacheUpstream) {
            const cacheMissRead = propagatedRead * (1 - cacheHitRate);
            targetDemand.totalRps += cacheMissRead + propagatedWrite;
            targetDemand.readRps += cacheMissRead;
            targetDemand.writeRps += propagatedWrite;
          } else {
            targetDemand.totalRps += propagatedRps;
            targetDemand.readRps += propagatedRead;
            targetDemand.writeRps += propagatedWrite;
          }
          queue.push(edge.targetId);
        } else {
          // Normal service propagation
          targetDemand.totalRps += propagatedRps;
          targetDemand.readRps += propagatedRead;
          targetDemand.writeRps += propagatedWrite;
          queue.push(edge.targetId);
        }
      }
    }

    // Compute estimated network bandwidth demand per node (Mbps)
    for (const [nodeId, demand] of demandMap.entries()) {
      const avgPayload = (avgRequestSizeBytes + avgResponseSizeBytes) / 2;
      const bytesPerSec = demand.totalRps * avgPayload;
      const mbps = (bytesPerSec * 8) / 1_000_000;
      demand.bandwidthMbps = Math.round(mbps * 100) / 100;

      // For message queues, track message arrival rate
      if (index.queueIds.includes(nodeId)) {
        demand.messageArrivalRate = demand.totalRps;
      }
    }

    return demandMap;
  }
}
