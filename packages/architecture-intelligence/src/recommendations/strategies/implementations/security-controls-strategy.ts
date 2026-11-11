import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";
import type { GraphOperation } from "../../../scalability/schemas/scalability.schemas";

export class SecurityControlsStrategy implements IRecommendationStrategy {
  public readonly id = "strat_security_controls";
  public readonly name = "Trust Boundary Enforcement & Encryption in Transit";
  public readonly category = "security";
  public readonly description = "Enforce mutual TLS (mTLS), strict API authentication, and encrypted transit protocols across trust boundary connections.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap, edgeMap } = context;

    const secFindings = group.findings.filter(
      (f) =>
        f.sourceEngine === "security" ||
        f.ruleId.startsWith("SEC-") ||
        f.category === "transport-security" ||
        f.category === "authentication" ||
        f.category === "trust-boundary"
    );

    if (secFindings.length === 0) return null;

    const targetNodeId = group.primaryNodeId;
    const targetNode = targetNodeId ? nodeMap.get(targetNodeId) : undefined;
    const targetEdgeId = group.primaryEdgeId || secFindings[0].affectedEdgeIds[0];
    const targetEdge = targetEdgeId ? edgeMap.get(targetEdgeId) : undefined;

    const proposedOperations: GraphOperation[] = [];

    if (targetNode) {
      proposedOperations.push({
        type: "update_node_config",
        nodeId: targetNode.id,
        configUpdates: {
          authenticationRequired: true,
          authScheme: "jwt-oauth2",
          tlsEnforced: true,
          minTlsVersion: "TLS_1_3",
        },
      });
    }

    if (targetEdge) {
      proposedOperations.push({
        type: "update_node_config",
        nodeId: targetEdge.source,
        configUpdates: {
          enforceTlsInTransit: true,
        },
      });
    }

    return {
      isApplicable: true,
      feasibility: "applicable",
      title: `Enforce TLS & Strict Authentication on ${targetNode?.label || targetEdgeId || "Trust Boundary"}`,
      summary: `Upgrade unencrypted or unauthenticated network paths traversing trust boundaries to enforce TLS 1.3 encryption in transit, cryptographic signature verification, and OAuth2/JWT token validation.`,
      priority: "critical",
      benefits: [
        "Eliminates man-in-the-middle eavesdropping and tampering across network boundaries.",
        "Guarantees that only authorized clients and authenticated service principals can invoke internal endpoints.",
        "Ensures compliance with zero-trust architecture standards (SOC2, HIPAA, PCI-DSS).",
      ],
      tradeoffs: [
        "Adds minor cryptographic handshake overhead (~1–2ms on initial connection setup).",
        "Requires automated certificate rotation (e.g. Let's Encrypt / Vault PKI) and token validation logic.",
      ],
      tradeoffDetails: {
        reliability: "neutral",
        performance: "neutral",
        scalability: "neutral",
        security: "positive",
        dataConsistency: "neutral",
        operationalComplexity: "medium",
        costDirection: "neutral",
        reversibility: "high",
        tradeoffNotes: [
          "Use connection pooling with HTTP/2 or HTTP/3 to reuse TLS connections and eliminate repeated handshakes.",
        ],
      },
      assumptions: [
        "Target service endpoints support HTTPS/gRPC TLS termination.",
      ],
      prerequisites: [
        "Provision trusted CA certificates and token signing keys.",
      ],
      conflictsWith: [],
      dependsOn: [],
      proposedOperations,
      documentationId: "transport-security-and-auth",
    };
  }
}
