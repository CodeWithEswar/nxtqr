import type { ComponentBehaviorAdapter, ComponentBehaviorContext, ComponentBehaviorResult } from "./behavior-adapter";
import type { ExecutionEvent } from "../domain/execution-event";
import type { GatewayRouteRule } from "../schemas/behavior.schemas";

export class GatewayBehaviorAdapter implements ComponentBehaviorAdapter {
  public readonly id = "gateway.http";
  public readonly version = "1.0.0";
  public readonly supportedTypes = ["gateway", "api_gateway", "reverse_proxy", "ingress"];

  public execute(ctx: ComponentBehaviorContext): ComponentBehaviorResult {
    const { node, request, outEdges, nodeMap, scenario, runId, getSequence, simulatedTimeMs } = ctx;
    const events: ExecutionEvent[] = [];

    // 1. Request Received at Gateway
    events.push({
      id: `evt_${runId}_${getSequence()}_req_rcvd_${node.id}`,
      sequence: ctx.getSequence(),
      type: "request.received",
      atMs: simulatedTimeMs,
      durationMs: 30,
      explanation: `Gateway "${node.label || node.id}" received ${request.method} ${request.path}. Evaluating route table...`,
      request,
      nodeId: node.id,
      nodeLabel: node.label || node.id,
    });

    if (outEdges.length === 0) {
      const response = {
        requestId: request.id,
        status: 502,
        headers: { "content-type": "application/json" },
        body: { error: "Bad Gateway", message: "No downstream services connected to API Gateway." },
        sourceNodeId: node.id,
        destinationNodeId: request.sourceNodeId,
        latencyMs: 30,
      };
      return {
        events,
        durationMs: 30,
        outgoingRequests: [],
        response,
        outcome: "respond",
        reason: "Gateway has no connected downstream services (HTTP 502 Bad Gateway).",
      };
    }

    // Sort rules by priority (higher priority number first)
    const rules = [...(scenario.gatewayRules || [])].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let matchedRule: GatewayRouteRule | null = null;

    for (const rule of rules) {
      if (!rule.methods.includes(request.method)) continue;

      if (rule.matchType === "exact" && rule.pathPattern === request.path) {
        matchedRule = rule;
        break;
      }
      if (rule.matchType === "prefix" && request.path.startsWith(rule.pathPattern)) {
        matchedRule = rule;
        break;
      }
      if (rule.matchType === "parameterized") {
        const regexStr = "^" + rule.pathPattern.replace(/:[a-zA-Z0-9_]+/g, "[^/]+") + "$";
        if (new RegExp(regexStr).test(request.path)) {
          matchedRule = rule;
          break;
        }
      }
    }

    // Default route fallback if no explicit rule matches, but outEdges exist
    let selectedEdge = outEdges[0];
    let selectedTargetNode = nodeMap.get(selectedEdge.target);

    if (matchedRule) {
      const explicitEdge = outEdges.find((e) => e.target === matchedRule!.targetNodeId);
      if (explicitEdge) {
        selectedEdge = explicitEdge;
        selectedTargetNode = nodeMap.get(selectedEdge.target);
      }
      events.push({
        id: `evt_${runId}_${getSequence()}_route_match_${node.id}`,
        sequence: ctx.getSequence(),
        type: "route.match.selected",
        atMs: simulatedTimeMs + 30,
        durationMs: 40,
        explanation: `Gateway matched route "${matchedRule.pathPattern}" (${matchedRule.matchType}) -> targeting "${selectedTargetNode?.label || matchedRule.targetNodeId}".`,
        nodeId: node.id,
        ruleId: matchedRule.id,
        pattern: matchedRule.pathPattern,
        targetNodeId: matchedRule.targetNodeId,
        targetNodeLabel: selectedTargetNode?.label || matchedRule.targetNodeId,
        decisionReason: `Rule "${matchedRule.id}" matched ${request.method} ${request.path}.`,
      });
    } else if (scenario.presetId === "gateway-404") {
      // Explicit 404 scenario
      events.push({
        id: `evt_${runId}_${getSequence()}_route_fail_${node.id}`,
        sequence: ctx.getSequence(),
        type: "route.match.failed",
        atMs: simulatedTimeMs + 30,
        durationMs: 40,
        explanation: `No route matching path "${request.path}" was found in API Gateway route table.`,
        nodeId: node.id,
        path: request.path,
        method: request.method,
        decisionReason: `Path "${request.path}" not found in configured route definitions.`,
      });

      const response = {
        requestId: request.id,
        status: 404,
        headers: { "content-type": "application/json" },
        body: { error: "Not Found", message: `Cannot ${request.method} ${request.path}` },
        sourceNodeId: node.id,
        destinationNodeId: request.sourceNodeId,
        latencyMs: 70,
      };

      return {
        events,
        durationMs: 70,
        outgoingRequests: [],
        response,
        outcome: "respond",
        reason: `Route not found for "${request.path}" (HTTP 404).`,
      };
    } else {
      // Default to first downstream service
      events.push({
        id: `evt_${runId}_${getSequence()}_route_default_${node.id}`,
        sequence: ctx.getSequence(),
        type: "route.match.selected",
        atMs: simulatedTimeMs + 30,
        durationMs: 40,
        explanation: `Gateway routed to primary downstream service "${selectedTargetNode?.label || selectedEdge.target}".`,
        nodeId: node.id,
        ruleId: "default",
        pattern: "/*",
        targetNodeId: selectedEdge.target,
        targetNodeLabel: selectedTargetNode?.label || selectedEdge.target,
        decisionReason: `Default route selected first downstream target.`,
      });
    }

    const forwardedReq = {
      ...request,
      sourceNodeId: node.id,
      targetNodeId: selectedEdge.target,
    };

    events.push({
      id: `evt_${runId}_${getSequence()}_req_fwd_${node.id}`,
      sequence: ctx.getSequence(),
      type: "request.forwarded",
      atMs: simulatedTimeMs + 70,
      durationMs: 50,
      explanation: `Gateway forwarded request to "${selectedTargetNode?.label || selectedEdge.target}" along wire "${selectedEdge.label || selectedEdge.id}".`,
      request: forwardedReq,
      fromNodeId: node.id,
      toNodeId: selectedEdge.target,
      edgeId: selectedEdge.id,
    });

    return {
      events,
      durationMs: 120,
      outgoingRequests: [
        {
          request: forwardedReq,
          edgeId: selectedEdge.id,
          targetNodeId: selectedEdge.target,
        },
      ],
      outcome: "continue",
      reason: `Forwarded to ${selectedTargetNode?.label || selectedEdge.target}.`,
    };
  }
}

