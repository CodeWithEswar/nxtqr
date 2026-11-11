import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { SimulationEvent } from "../contracts/simulation.types";
import type { ComponentStateMachine } from "./component-state-machine";

export interface PropagationOptions {
  scenarioId: string;
  timestampMs: number;
  maxPropagationDepth?: number;
}

export class DependencyPropagationEngine {
  private outgoingEdges = new Map<string, BaseEdge[]>();
  private incomingEdges = new Map<string, BaseEdge[]>();
  private nodeMap = new Map<string, BaseNode>();

  constructor(nodes: BaseNode[], edges: BaseEdge[]) {
    for (const node of nodes) {
      this.nodeMap.set(node.id, node);
      this.outgoingEdges.set(node.id, []);
      this.incomingEdges.set(node.id, []);
    }

    for (const edge of edges) {
      this.outgoingEdges.get(edge.source)?.push(edge);
      this.incomingEdges.get(edge.target)?.push(edge);
    }
  }

  /**
   * Propagates a failure from a failed source node to dependent upstream callers.
   * Traverses incoming edges backwards (since callers depend on the callee).
   */
  public propagateFailure(
    sourceNodeId: string,
    stateMachine: ComponentStateMachine,
    options: PropagationOptions
  ): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const visited = new Set<string>();
    const maxDepth = options.maxPropagationDepth || 12;

    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: sourceNodeId, depth: 0 }];
    visited.add(sourceNodeId);

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;

      const incoming = this.incomingEdges.get(nodeId) || [];
      for (const edge of incoming) {
        const callerId = edge.source;
        if (visited.has(callerId)) continue;

        const callerNode = this.nodeMap.get(callerId);
        if (!callerNode) continue;

        const edgeData = (edge.data || {}) as Record<string, unknown>;
        const isSynchronous = edgeData.isSynchronous !== false; // default true for RPC/REST/SQL
        const isHardDependency = edgeData.isCritical !== false && edgeData.isHardDependency !== false;

        const callerData = (callerNode.data || {}) as Record<string, unknown>;
        const hasCircuitBreaker = Boolean(
          callerData.hasCircuitBreaker || callerData.circuitBreakerConfig
        );
        const hasFallback = Boolean(callerData.hasFallback || callerData.fallbackRoute);

        if (isSynchronous && isHardDependency && !hasFallback) {
          // Failure directly impacts the caller!
          visited.add(callerId);

          if (hasCircuitBreaker) {
            // Circuit breaker activates, fast-failing to protect caller from hanging
            stateMachine.setCircuitBreaker(callerId, true, `Tripped by failed dependency #${nodeId}`);
            events.push({
              id: `cb-trip-${callerId}-${options.timestampMs}`,
              scenarioId: options.scenarioId,
              timestampMs: options.timestampMs,
              sequence: 0,
              type: "circuit_breaker_opened",
              targetId: callerId,
              payload: { trippedByNodeId: nodeId, edgeId: edge.id },
              description: `Circuit breaker on ${callerNode.label || callerId} opened due to unavailable downstream dependency #${nodeId}`,
            });

            // With circuit breaker, the caller enters degraded mode (fast-failing rather than completely freezing)
            stateMachine.setDegraded(callerId, true, "Circuit breaker open on downstream path", 1.5);
          } else {
            // Without circuit breaker or fallback, cascading failure marks caller degraded or unavailable
            stateMachine.setDegraded(
              callerId,
              true,
              `Cascading failure: synchronous dependency #${nodeId} is down`,
              3.0
            );

            events.push({
              id: `prop-${callerId}-${options.timestampMs}`,
              scenarioId: options.scenarioId,
              timestampMs: options.timestampMs,
              sequence: 0,
              type: "failure_propagated",
              targetId: callerId,
              payload: {
                downstreamNodeId: nodeId,
                edgeId: edge.id,
                isSynchronous,
              },
              description: `Failure propagated to caller ${callerNode.label || callerId} because downstream dependency #${nodeId} is unavailable`,
            });
          }

          // Continue propagating up the call chain
          queue.push({ nodeId: callerId, depth: depth + 1 });
        } else if (hasFallback) {
          // Fallback path successfully engages
          events.push({
            id: `fallback-${callerId}-${options.timestampMs}`,
            scenarioId: options.scenarioId,
            timestampMs: options.timestampMs,
            sequence: 0,
            type: "failover_triggered",
            targetId: callerId,
            payload: { failedNodeId: nodeId, fallbackActivated: true },
            description: `${callerNode.label || callerId} engaged fallback route, isolating failure from downstream #${nodeId}`,
          });
          stateMachine.setDegraded(callerId, true, "Running in degraded fallback mode", 1.2);
        }
      }
    }

    return events;
  }
}
