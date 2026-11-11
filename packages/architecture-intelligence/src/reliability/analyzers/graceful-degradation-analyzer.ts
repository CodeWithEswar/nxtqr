import type { IReliabilityAnalyzer, ReliabilityContext } from "../contracts/reliability.types";
import type { ReliabilityFinding } from "../schemas/reliability.schemas";

export class GracefulDegradationAnalyzer implements IReliabilityAnalyzer {
  public readonly category = "graceful-degradation";

  public analyze(context: ReliabilityContext): ReliabilityFinding[] {
    const findings: ReliabilityFinding[] = [];

    for (const edge of context.edges) {
      const targetNode = context.nodeMap.get(edge.target);
      const sourceNode = context.nodeMap.get(edge.source);
      if (!targetNode || !sourceNode) continue;

      const targetProfile = context.nodeProfiles[edge.target];
      if (!targetProfile) continue;

      const rawTarget = (targetNode.data || {}) as Record<string, unknown>;
      const componentType = String(rawTarget.componentType || targetNode.type || "");

      // REL-DEGR-001: Missing Fallback on Non-Critical / Optional Dependency
      const isOptional =
        targetProfile.criticality === "optional" ||
        rawTarget.isOptional === true ||
        componentType.includes("analytics") ||
        componentType.includes("recommendation") ||
        componentType.includes("telemetry") ||
        componentType.includes("notification");

      if (isOptional && !targetProfile.hasFallback) {
        findings.push({
          id: `REL-DEGR-001-${edge.id}`,
          ruleId: "REL-DEGR-001",
          category: "graceful-degradation",
          severity: "medium",
          classification: "configuration-gap",
          title: `Missing Graceful Fallback for Optional Dependency "${targetNode.label || edge.target}"`,
          explanation: `Service "${sourceNode.label || edge.source}" depends on non-critical dependency "${targetNode.label || edge.target}" without a degraded fallback mode. If "${targetNode.label || edge.target}" fails, the primary user flow will crash despite the dependency being non-essential.`,
          affectedNodeIds: [edge.source, edge.target],
          affectedEdgeIds: [edge.id],
          evidence: [
            {
              kind: "node",
              elementId: targetNode.id,
              propertyKey: "hasFallback",
              expectedValue: true,
              actualValue: false,
              description: "Non-critical feature lacks fallback to default data or non-blocking async execution.",
            },
          ],
          assumptions: [
            "User transactions should proceed successfully even when auxiliary features are degraded.",
          ],
          confidence: "high",
          propagationChain: [edge.source, edge.target],
          remediation: "Wrap call in a try/catch or circuit breaker that degrades gracefully to cached or static default content.",
          remediationAction: "add_fallback",
        });
      }

      // REL-DEGR-002: Unsafe Fallback on Financial / Mutating Operation
      const isFinancial =
        componentType.includes("payment") ||
        rawTarget.isPaymentGateway === true ||
        String(rawTarget.label || "").toLowerCase().includes("payment");

      const edgeData = (edge.data || {}) as Record<string, unknown>;
      if (isFinancial && (edgeData.fallbackAction === "approve" || edgeData.fallbackStatus === "success")) {
        findings.push({
          id: `REL-DEGR-002-${edge.id}`,
          ruleId: "REL-DEGR-002",
          category: "graceful-degradation",
          severity: "critical",
          classification: "modeled-conflict",
          title: `Unsafe Degraded Fallback: Financial Transaction Automatically Approved on Failure`,
          explanation: `Payment dependency "${targetNode.label || edge.target}" is configured to mark transactions as successful or approved on provider failure. This violates basic business and financial correctness, exposing the system to catastrophic ledger loss.`,
          affectedNodeIds: [edge.source, edge.target],
          affectedEdgeIds: [edge.id],
          evidence: [
            {
              kind: "edge",
              elementId: edge.id,
              propertyKey: "fallbackAction",
              expectedValue: "fail_closed_or_pend",
              actualValue: "approve",
              description: "Financial transactions must never degrade open to approved state.",
            },
          ],
          assumptions: [
            "Payment providers that fail must be marked as pending manual review or explicitly rejected.",
          ],
          confidence: "high",
          propagationChain: [edge.source, edge.target],
          remediation: "Fail closed on payment provider degradation: return 'pending' or 'declined' status with transactional compensation.",
          remediationAction: "custom",
        });
      }
    }

    return findings;
  }
}

