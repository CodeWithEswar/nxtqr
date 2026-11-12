import type { ComponentBehaviorAdapter, ComponentBehaviorContext, ComponentBehaviorResult } from "./behavior-adapter";
import type { ExecutionEvent } from "../domain/execution-event";
import { RuntimeStateHelper } from "../domain/runtime-state";

export class LoadBalancerBehaviorAdapter implements ComponentBehaviorAdapter {
  public readonly id = "load-balancer.http";
  public readonly version = "1.0.0";
  public readonly supportedTypes = ["load_balancer", "lb", "alb", "nlb"];

  public execute(ctx: ComponentBehaviorContext): ComponentBehaviorResult {
    const { node, request, outEdges, nodeMap, runtimeState, scenario, runId, getSequence, simulatedTimeMs } = ctx;
    const events: ExecutionEvent[] = [];

    if (outEdges.length === 0) {
      return {
        events,
        durationMs: 30,
        outgoingRequests: [],
        outcome: "blocked",
        reason: "Load Balancer has no configured upstream targets.",
      };
    }

    const lbConfig = scenario.loadBalancerConfig || { strategy: "round-robin", weights: {} };
    let selectedIndex = 0;

    if (lbConfig.strategy === "round-robin") {
      selectedIndex = RuntimeStateHelper.getNextRoundRobinIndex(runtimeState, node.id, outEdges.length);
    } else if (lbConfig.strategy === "explicit" && lbConfig.explicitTargetId) {
      const idx = outEdges.findIndex((e) => e.target === lbConfig.explicitTargetId);
      if (idx >= 0) selectedIndex = idx;
    } else if (lbConfig.strategy === "weighted") {
      // Deterministic cumulative weight calculation
      let totalWeight = 0;
      const weightedEdges: { edge: typeof outEdges[0]; weight: number }[] = [];
      for (const edge of outEdges) {
        const w = lbConfig.weights[edge.target] || 1;
        totalWeight += w;
        weightedEdges.push({ edge, weight: w });
      }
      const roundIdx = RuntimeStateHelper.getNextRoundRobinIndex(runtimeState, node.id, totalWeight);
      let cumulative = 0;
      for (let i = 0; i < weightedEdges.length; i++) {
        cumulative += weightedEdges[i].weight;
        if (roundIdx < cumulative) {
          selectedIndex = i;
          break;
        }
      }
    }

    const selectedEdge = outEdges[selectedIndex];
    const targetNode = nodeMap.get(selectedEdge.target);

    // 1. Upstream Selected Event
    events.push({
      id: `evt_${runId}_${getSequence()}_lb_upstream_${node.id}`,
      sequence: ctx.getSequence(),
      type: "route.upstream.selected",
      atMs: simulatedTimeMs,
      durationMs: 40,
      explanation: `Load Balancer selected upstream "${targetNode?.label || selectedEdge.target}" [strategy: ${lbConfig.strategy}, target ${selectedIndex + 1}/${outEdges.length}].`,
      nodeId: node.id,
      strategy: lbConfig.strategy,
      selectedTargetId: selectedEdge.target,
      selectedTargetLabel: targetNode?.label || selectedEdge.target,
      index: selectedIndex,
      poolSize: outEdges.length,
    });

    const forwardedReq = {
      ...request,
      sourceNodeId: node.id,
      targetNodeId: selectedEdge.target,
    };

    // 2. Request Forwarded Event
    events.push({
      id: `evt_${runId}_${getSequence()}_lb_fwd_${node.id}`,
      sequence: ctx.getSequence(),
      type: "request.forwarded",
      atMs: simulatedTimeMs + 40,
      durationMs: 50,
      explanation: `Load balancer forwarded request to upstream server "${targetNode?.label || selectedEdge.target}".`,
      request: forwardedReq,
      fromNodeId: node.id,
      toNodeId: selectedEdge.target,
      edgeId: selectedEdge.id,
    });

    return {
      events,
      durationMs: 90,
      outgoingRequests: [
        {
          request: forwardedReq,
          edgeId: selectedEdge.id,
          targetNodeId: selectedEdge.target,
        },
      ],
      outcome: "continue",
      reason: `Load balancer routed request to ${targetNode?.label || selectedEdge.target}.`,
    };
  }
}
