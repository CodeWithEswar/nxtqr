import type { IReliabilityAnalyzer, ReliabilityContext } from "../contracts/reliability.types";
import type { ReliabilityFinding } from "../schemas/reliability.schemas";

export class RecoveryAnalyzer implements IReliabilityAnalyzer {
  public readonly category = "recovery";

  public analyze(context: ReliabilityContext): ReliabilityFinding[] {
    const findings: ReliabilityFinding[] = [];

    for (const node of context.nodes) {
      const raw = (node.data || {}) as Record<string, unknown>;
      const componentType = String(raw.componentType || node.type || "");

      // REL-RECOV-001: HA Database Without Automated Failover
      const isDatabase =
        componentType.includes("database") ||
        componentType.includes("postgres") ||
        componentType.includes("mysql") ||
        raw.isDatabase === true;

      const hasReplicas = Number(raw.replicas || 0) > 1 || raw.readReplicas !== undefined;
      const hasAutoFailover = raw.automatedFailover === true || raw.failoverController === true;

      if (isDatabase && hasReplicas && !hasAutoFailover) {
        findings.push({
          id: `REL-RECOV-001-${node.id}`,
          ruleId: "REL-RECOV-001",
          category: "recovery",
          severity: "high",
          classification: "configuration-gap",
          title: `Database "${node.label || node.id}" Has Replicas But Lacks Automated Failover Controller`,
          explanation: `Database "${node.label || node.id}" models secondary replicas, but does not specify an automated health-check probe or consensus failover controller (e.g. Patroni, Orchestrator, or cloud multi-AZ failover). In the event of primary database crash, failover will stall indefinitely pending manual human intervention.`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: (context.incomingEdgesMap.get(node.id) || []).map((e) => e.id),
          evidence: [
            {
              kind: "property",
              elementId: node.id,
              propertyKey: "automatedFailover",
              expectedValue: true,
              actualValue: false,
              description: "Replicated database cluster lacks automated health probe and election controller.",
            },
          ],
          assumptions: [
            "Manual failover during unplanned outages incurs significantly longer recovery time (RTO > 30 minutes).",
          ],
          confidence: "high",
          propagationChain: [node.id],
          remediation: "Configure automated leader election and failover controller with quorum consensus to achieve RTO < 30 seconds.",
          remediationAction: "custom",
        });
      }

      // REL-RECOV-002: Container/Compute Service Lacking Readiness & Liveness Probes
      const isCompute =
        componentType.includes("compute") ||
        componentType.includes("container") ||
        componentType.includes("serverless") ||
        raw.isCompute === true;

      const hasProbes = raw.readinessProbe === true || raw.healthCheckPath !== undefined;
      if (isCompute && !hasProbes && raw.exposure !== "internal_only") {
        findings.push({
          id: `REL-RECOV-002-${node.id}`,
          ruleId: "REL-RECOV-002",
          category: "recovery",
          severity: "medium",
          classification: "configuration-gap",
          title: `Missing Health Check & Readiness Probes on "${node.label || node.id}"`,
          explanation: `Service "${node.label || node.id}" does not declare a readiness or liveness health check probe. If the service experiences deadlocks, OOM memory pressure, or slow startup hydration, load balancers will continue routing live user traffic to unhealthy containers.`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: (context.incomingEdgesMap.get(node.id) || []).map((e) => e.id),
          evidence: [
            {
              kind: "property",
              elementId: node.id,
              propertyKey: "readinessProbe",
              expectedValue: true,
              actualValue: false,
              description: "No readiness or liveness HTTP/TCP health probe declared.",
            },
          ],
          assumptions: [
            "Containers can crash or enter deadlocked states while maintaining an open TCP socket.",
          ],
          confidence: "high",
          propagationChain: [node.id],
          remediation: "Define an HTTP readiness endpoint (/health/ready) and liveness endpoint (/health/live) with a 5-second probe interval.",
          remediationAction: "custom",
        });
      }
    }

    return findings;
  }
}

