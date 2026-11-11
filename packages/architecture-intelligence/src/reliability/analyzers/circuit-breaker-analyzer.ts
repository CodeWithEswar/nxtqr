import type { IReliabilityAnalyzer, ReliabilityContext } from "../contracts/reliability.types";
import type { ReliabilityFinding } from "../schemas/reliability.schemas";

export class CircuitBreakerAnalyzer implements IReliabilityAnalyzer {
  public readonly category = "circuit-breaker";

  public analyze(context: ReliabilityContext): ReliabilityFinding[] {
    const findings: ReliabilityFinding[] = [];

    for (const edge of context.edges) {
      const edgeData = (edge.data || {}) as Record<string, unknown>;
      const isAsync = edgeData.isSynchronous === false || edgeData.protocol === "amqp" || edgeData.protocol === "kafka";
      if (isAsync) continue;

      const sourceNode = context.nodeMap.get(edge.source);
      const targetNode = context.nodeMap.get(edge.target);
      if (!sourceNode || !targetNode) continue;

      const targetData = (targetNode.data || {}) as Record<string, unknown>;
      const targetType = String(targetData.componentType || targetNode.type || "");
      const isExternal = targetType.includes("external") || targetData.isExternal === true || targetType.includes("payment");
      const targetProfile = context.nodeProfiles[edge.target];
      if (!targetProfile) continue;

      const isCritical = targetProfile.criticality === "mission-critical" || isExternal;

      // REL-CB-001: Unprotected Critical or External Dependency Lacks Circuit Breaker
      if (isCritical && !targetProfile.hasCircuitBreaker) {
        findings.push({
          id: `REL-CB-001-${edge.id}`,
          ruleId: "REL-CB-001",
          category: "circuit-breaker",
          severity: "high",
          classification: "configuration-gap",
          title: `Unprotected Critical Call: "${sourceNode.label || edge.source}" to "${targetNode.label || edge.target}" Lacks Circuit Breaker`,
          explanation: `The synchronous dependency from "${sourceNode.label || edge.source}" to "${targetNode.label || edge.target}" is mission-critical/external, but lacks a circuit breaker failure containment policy. When "${targetNode.label || edge.target}" becomes unresponsive, calling threads will hang until timeout, rapidly draining caller connection pools and triggering cascading failure.`,
          affectedNodeIds: [edge.source, edge.target],
          affectedEdgeIds: [edge.id],
          evidence: [
            {
              kind: "edge",
              elementId: edge.id,
              propertyKey: "hasCircuitBreaker",
              expectedValue: true,
              actualValue: false,
              description: "No circuit breaker (failure threshold, open duration, half-open probes) is modeled on this critical connection.",
            },
          ],
          assumptions: [
            "External or downstream dependencies can suffer intermittent degradation or network partitions.",
          ],
          confidence: "high",
          propagationChain: [edge.source, edge.target],
          remediation: "Deploy a circuit breaker with a 50% failure rate threshold over a 10s rolling window, and a 5s half-open recovery probe duration.",
          remediationAction: "add_circuit_breaker",
        });
      }

      // REL-CB-002: Circuit Breaker Configured Without Fallback Strategy
      if (targetProfile.hasCircuitBreaker && !targetProfile.hasFallback) {
        findings.push({
          id: `REL-CB-002-${targetNode.id}`,
          ruleId: "REL-CB-002",
          category: "circuit-breaker",
          severity: "medium",
          classification: "configuration-gap",
          title: `Circuit Breaker on "${targetNode.label || targetNode.id}" Has No Defined Fallback Path`,
          explanation: `Component "${targetNode.label || targetNode.id}" has circuit breaking protection, but no degraded fallback handler is specified. When the breaker trips open, callers receive hard 503/500 errors instead of serving cached data, default values, or queued tasks.`,
          affectedNodeIds: [targetNode.id],
          affectedEdgeIds: [edge.id],
          evidence: [
            {
              kind: "property",
              elementId: targetNode.id,
              propertyKey: "hasFallback",
              expectedValue: true,
              actualValue: false,
              description: "Circuit breaker is active without a declared fallback response or secondary path.",
            },
          ],
          assumptions: [
            "User experience is degraded when upstream services return unhandled raw error responses.",
          ],
          confidence: "medium",
          propagationChain: [edge.source, edge.target],
          remediation: "Provide a graceful degradation fallback (e.g. return stale cache, stub response, or enqueue for asynchronous processing).",
          remediationAction: "add_fallback",
        });
      }
    }

    return findings;
  }
}

