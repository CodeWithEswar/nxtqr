import type { BaseNode } from "@nxtqr/graph-schema";
import type { AnalyzerContext, DimensionAssessment, HealthFinding } from "../contracts/health.types";
import type { IAnalyzer } from "./analyzer-interface";
import { calculateDimensionScore } from "../scoring/score-calculator";

export class OperationsAnalyzer implements IAnalyzer {
  public analyze(context: AnalyzerContext): DimensionAssessment {
    const { nodes, index, scoringPolicy } = context;
    const findings: HealthFinding[] = [];
    const assumptionsEvaluated: string[] = [];

    const evidenceCount = nodes.length;

    // Check if system has observability components modeled
    let hasLogging = false;
    let hasMetrics = false;

    for (const node of nodes) {
      const type = node.type.toLowerCase();
      if (type.includes("log") || type.includes("logging")) hasLogging = true;
      if (type.includes("metric") || type.includes("monitoring")) hasMetrics = true;
      if (type.includes("tracing") || type.includes("telemetry") || type.includes("apm")) {
        hasMetrics = true;
      }
    }

    assumptionsEvaluated.push("System-wide observability infrastructure check");

    // Rule 1: Missing Centralized Observability in Multi-Service System
    if (index.computeIds.length >= 3 && !hasLogging && !hasMetrics) {
      findings.push({
        id: "OPS-OBS-001:system",
        ruleId: "OPS-OBS-001",
        dimension: "operations",
        severity: "medium",
        title: "Missing Centralized Observability Infrastructure",
        explanation: `The architecture contains ${index.computeIds.length} compute services but does not model a centralized Log Aggregator, Metrics Collector, or Distributed Tracing pipeline. Diagnosing production outages across distributed services will be difficult.`,
        evidence: [
          {
            kind: "capability",
            expectedValue: "Centralized logging or metrics",
            actualValue: "None modeled",
            description: `No telemetry nodes present in multi-service graph.`,
          },
        ],
        affectedNodeIds: index.computeIds,
        affectedEdgeIds: [],
        assumptions: ["Assumes telemetry is not handled by an unmodeled cloud vendor agent."],
        confidence: "medium",
        recommendationIds: ["REC-OPS-001"],
        documentationId: "distributed-tracing",
      });
    }

    // Rule 2: Load Balancer without Health Checks
    for (const lbId of index.entryPointIds) {
      const lbNode = index.nodeMap.get(lbId);
      if (lbNode && lbNode.type.toLowerCase().includes("load-balancer")) {
        const data = lbNode.data || {};
        assumptionsEvaluated.push(`Load Balancer ${lbId} active health check check`);

        if (data.healthChecksEnabled === false || data.healthCheck === false) {
          findings.push({
            id: `OPS-HEALTH-001:${lbId}`,
            ruleId: "OPS-HEALTH-001",
            dimension: "operations",
            severity: "medium",
            title: `Health Checks Disabled on Load Balancer: ${lbNode.label || lbNode.type}`,
            explanation: `Load balancer "${lbNode.label || lbNode.type}" has automated health checks explicitly disabled. Unhealthy backend instances will continue receiving live user traffic.`,
            evidence: [
              {
                kind: "node",
                elementId: lbId,
                propertyKey: "healthChecksEnabled",
                expectedValue: true,
                actualValue: false,
                description: `Load balancer health checks are disabled.`,
              },
            ],
            affectedNodeIds: [lbId],
            affectedEdgeIds: [],
            assumptions: ["Assumes external DNS failover does not monitor individual backend instances."],
            confidence: "high",
            recommendationIds: ["REC-OPS-002"],
            documentationId: "load-balancer",
          });
        }
      }
    }

    // Rule 3: Monitoring without Alert Notification Channels
    for (const node of nodes) {
      if (node.type.includes("monitoring") || node.type.includes("metrics")) {
        const downstream = index.getDownstreamNodes(node.id);
        const hasAlerting = downstream.some((d: BaseNode) => d.type.includes("alert") || d.type.includes("notification"));
        assumptionsEvaluated.push(`Monitoring node ${node.id} alert channel check`);

        if (!hasAlerting && downstream.length === 0) {
          findings.push({
            id: `OPS-ALERT-001:${node.id}`,
            ruleId: "OPS-ALERT-001",
            dimension: "operations",
            severity: "low",
            title: `Monitoring without Alert Notification Channel: ${node.label || node.type}`,
            explanation: `Monitoring component "${node.label || node.type}" is not connected to an alerting mechanism or notification channel. Degraded system health will not trigger on-call alerts.`,
            evidence: [
              {
                kind: "node",
                elementId: node.id,
                description: `Monitoring system has no connected alert manager or notification sinks.`,
              },
            ],
            affectedNodeIds: [node.id],
            affectedEdgeIds: [],
            assumptions: ["Assumes internal dashboard polling without active push alerting."],
            confidence: "medium",
            recommendationIds: ["REC-OPS-003"],
            documentationId: "alert-manager",
          });
        }
      }
    }

    const summary =
      findings.length === 0
        ? "Architecture incorporates comprehensive operational telemetry, health checks, and alerting readiness."
        : `Identified ${findings.length} operational readiness gaps such as missing centralized telemetry or disabled health probes.`;

    return calculateDimensionScore(
      "operations",
      findings,
      evidenceCount,
      assumptionsEvaluated,
      summary,
      scoringPolicy
    );
  }
}
