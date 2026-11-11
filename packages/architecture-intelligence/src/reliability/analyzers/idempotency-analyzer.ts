import type { IReliabilityAnalyzer, ReliabilityContext } from "../contracts/reliability.types";
import type { ReliabilityFinding } from "../schemas/reliability.schemas";

export class IdempotencyAnalyzer implements IReliabilityAnalyzer {
  public readonly category = "idempotency";

  public analyze(context: ReliabilityContext): ReliabilityFinding[] {
    const findings: ReliabilityFinding[] = [];

    for (const node of context.nodes) {
      const raw = (node.data || {}) as Record<string, unknown>;
      const componentType = String(raw.componentType || node.type || "");
      const isPaymentOrOrder =
        componentType.includes("payment") ||
        componentType.includes("order") ||
        componentType.includes("checkout") ||
        raw.isPaymentGateway === true ||
        raw.isOrderService === true;

      const profile = context.nodeProfiles[node.id];
      if (!profile) continue;

      // REL-IDEM-001: Mutating financial/order transaction lacks idempotency
      if (isPaymentOrOrder && !profile.isIdempotent && !raw.idempotencyKey) {
        findings.push({
          id: `REL-IDEM-001-${node.id}`,
          ruleId: "REL-IDEM-001",
          category: "idempotency",
          severity: "critical",
          classification: "modeled-conflict",
          title: `Mutating Financial/Order Service "${node.label || node.id}" Lacks Idempotency Protection`,
          explanation: `Component "${node.label || node.id}" handles financial or state-altering mutations without a declared idempotency key policy or response deduplication cache. If an upstream client experiences a network timeout after the server commits the transaction, an automated client retry will cause duplicate charges or duplicate order fulfillment.`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: (context.incomingEdgesMap.get(node.id) || []).map((e) => e.id),
          evidence: [
            {
              kind: "property",
              elementId: node.id,
              propertyKey: "isIdempotent",
              expectedValue: true,
              actualValue: false,
              description: "No idempotency key or deduplication storage modeled on mutating transaction endpoint.",
            },
          ],
          assumptions: [
            "Network drops frequently occur on the response path after the server has already executed the database commit.",
          ],
          confidence: "high",
          propagationChain: [node.id],
          remediation: "Require an `Idempotency-Key` header with transactional lock and response caching in a fast distributed store (e.g. Redis) for 24-48 hours.",
          remediationAction: "enable_idempotency",
        });
      }

      // REL-IDEM-002: External Webhook Intake Without Deduplication
      const isWebhookConsumer =
        componentType.includes("webhook") ||
        raw.isWebhookHandler === true ||
        String(raw.label || "").toLowerCase().includes("webhook");

      if (isWebhookConsumer && !profile.isIdempotent && !raw.deduplicationEnabled) {
        findings.push({
          id: `REL-IDEM-002-${node.id}`,
          ruleId: "REL-IDEM-002",
          category: "idempotency",
          severity: "high",
          classification: "potential-risk",
          title: `External Webhook Intake "${node.label || node.id}" Lacks Event Deduplication`,
          explanation: `Webhook endpoint "${node.label || node.id}" receives third-party events without an event deduplication mechanism. External providers (e.g. Stripe, GitHub, Twilio) use at-least-once delivery semantics and frequently deliver duplicate webhook events during network retries.`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: (context.incomingEdgesMap.get(node.id) || []).map((e) => e.id),
          evidence: [
            {
              kind: "property",
              elementId: node.id,
              propertyKey: "deduplicationEnabled",
              expectedValue: true,
              actualValue: false,
              description: "No event ID tracking or message deduplication modeled on external webhook handler.",
            },
          ],
          assumptions: [
            "External payment and messaging providers guarantee at-least-once delivery, not exactly-once.",
          ],
          confidence: "high",
          propagationChain: [node.id],
          remediation: "Store processed event IDs with unique database constraints or Redis TTL keys to discard duplicate webhook deliveries.",
          remediationAction: "enable_idempotency",
        });
      }
    }

    return findings;
  }
}

