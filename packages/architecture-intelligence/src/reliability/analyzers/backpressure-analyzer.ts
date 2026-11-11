import type { IReliabilityAnalyzer, ReliabilityContext } from "../contracts/reliability.types";
import type { ReliabilityFinding } from "../schemas/reliability.schemas";

export class BackpressureAnalyzer implements IReliabilityAnalyzer {
  public readonly category = "backpressure";

  public analyze(context: ReliabilityContext): ReliabilityFinding[] {
    const findings: ReliabilityFinding[] = [];

    for (const node of context.nodes) {
      const raw = (node.data || {}) as Record<string, unknown>;
      const componentType = String(raw.componentType || node.type || "");
      const isPublicIngress =
        componentType.includes("gateway") ||
        raw.exposure === "public" ||
        raw.publiclyAccessible === true ||
        String(raw.label || "").toLowerCase().includes("public");

      const profile = context.nodeProfiles[node.id];
      if (!profile) continue;

      // REL-BACK-001: Missing Ingress Rate Limiting & Load Shedding
      if (isPublicIngress && !profile.hasRateLimit) {
        findings.push({
          id: `REL-BACK-001-${node.id}`,
          ruleId: "REL-BACK-001",
          category: "backpressure",
          severity: "high",
          classification: "configuration-gap",
          title: `Missing Ingress Rate Limiting & Load Shedding on "${node.label || node.id}"`,
          explanation: `Public-facing gateway "${node.label || node.id}" lacks rate limiting, token-bucket admission control, or load shedding policies. Under traffic spikes or distributed denial-of-service surges, excess requests will flood internal microservices and databases without bounded admission controls.`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: (context.outgoingEdgesMap.get(node.id) || []).map((e) => e.id),
          evidence: [
            {
              kind: "property",
              elementId: node.id,
              propertyKey: "hasRateLimit",
              expectedValue: true,
              actualValue: false,
              description: "No rate limiting or load shedding policy declared on public ingress gateway.",
            },
          ],
          assumptions: [
            "Ingress traffic can exceed aggregate downstream processing capacity during peak events.",
          ],
          confidence: "high",
          propagationChain: [node.id],
          remediation: "Deploy token-bucket rate limiting (e.g. 100 req/s per IP or API key) and shed excess traffic with HTTP 429 Too Many Requests.",
          remediationAction: "enable_backpressure",
        });
      }
    }

    return findings;
  }
}

