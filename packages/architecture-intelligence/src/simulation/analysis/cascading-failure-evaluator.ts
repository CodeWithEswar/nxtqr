import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  CascadingFailureRisk,
  ComponentStateSnapshot,
  SimulationEvent,
} from "../contracts/simulation.types";

export class CascadingFailureEvaluator {
  /**
   * Identifies modeled systemic risks and cascading amplification phenomena.
   */
  public static evaluate(
    nodes: BaseNode[],
    _edges: BaseEdge[],
    states: Record<string, ComponentStateSnapshot>,
    events: SimulationEvent[]
  ): CascadingFailureRisk[] {
    const risks: CascadingFailureRisk[] = [];

    // 1. Detect Retry Storm Risk
    const retryEvents = events.filter((e) => e.type === "retry_attempted");
    if (retryEvents.length > 5) {
      const targetMap = new Map<string, number>();
      for (const e of retryEvents) {
        targetMap.set(e.targetId, (targetMap.get(e.targetId) || 0) + 1);
      }

      for (const [targetId, count] of targetMap.entries()) {
        if (count >= 3) {
          risks.push({
            type: "retry_storm",
            sourceNodeId: targetId,
            amplifiedNodeIds: [targetId],
            severity: "critical",
            explanation: `Downstream component #${targetId} is subjected to ${count} uncoordinated retry requests during outage, creating a destructive retry storm that impedes recovery.`,
          });
        }
      }
    }

    // 2. Detect Cache Miss Surge
    for (const node of nodes) {
      const type = (node.type || "").toLowerCase();
      if (type.includes("cache") || type.includes("redis")) {
        const cacheState = states[node.id];
        if (cacheState && cacheState.state !== "healthy") {
          // Find database connected downstream of cache or sibling
          const connectedDbs = nodes.filter((n) => {
            const nType = (n.type || "").toLowerCase();
            return nType.includes("database") || nType.includes("postgres") || nType.includes("sql");
          });

          if (connectedDbs.length > 0) {
            risks.push({
              type: "cache_miss_surge",
              sourceNodeId: node.id,
              amplifiedNodeIds: connectedDbs.map((d) => d.id),
              severity: "high",
              explanation: `Cache #${node.id} degradation causes 100% of read traffic to stampede directly into primary database storage, causing potential database CPU saturation.`,
            });
          }
        }
      }
    }

    // 3. Detect Queue Backlog Congestion
    for (const node of nodes) {
      const type = (node.type || "").toLowerCase();
      if (type.includes("queue") || type.includes("kafka") || type.includes("sqs")) {
        const qState = states[node.id];
        if (qState && (qState.unprocessedBacklog || 0) > 200) {
          risks.push({
            type: "queue_backlog_amplification",
            sourceNodeId: node.id,
            amplifiedNodeIds: [node.id],
            severity: "medium",
            explanation: `Message queue #${node.id} accumulated ${qState.unprocessedBacklog} unprocessed messages due to worker processing latency.`,
          });
        }
      }
    }

    return risks;
  }
}
