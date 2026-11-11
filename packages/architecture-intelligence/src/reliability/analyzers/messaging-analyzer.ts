import type { IReliabilityAnalyzer, ReliabilityContext } from "../contracts/reliability.types";
import type { ReliabilityFinding } from "../schemas/reliability.schemas";

export class MessagingAnalyzer implements IReliabilityAnalyzer {
  public readonly category = "messaging";

  public analyze(context: ReliabilityContext): ReliabilityFinding[] {
    const findings: ReliabilityFinding[] = [];

    for (const node of context.nodes) {
      const raw = (node.data || {}) as Record<string, unknown>;
      const componentType = String(raw.componentType || node.type || "");
      const isBroker =
        componentType.includes("queue") ||
        componentType.includes("broker") ||
        componentType.includes("event-bus") ||
        componentType.includes("kafka") ||
        componentType.includes("rabbitmq") ||
        componentType.includes("sqs") ||
        raw.isMessageBroker === true;

      if (!isBroker) continue;

      const profile = context.nodeProfiles[node.id];
      if (!profile) continue;

      // REL-MSG-001: Missing Dead-Letter Queue (DLQ)
      if (!profile.hasDeadLetterQueue) {
        findings.push({
          id: `REL-MSG-001-${node.id}`,
          ruleId: "REL-MSG-001",
          category: "messaging",
          severity: "high",
          classification: "configuration-gap",
          title: `Missing Dead-Letter Queue (DLQ) on Message Broker "${node.label || node.id}"`,
          explanation: `Message broker/queue "${node.label || node.id}" has no Dead-Letter Queue (DLQ) or poison-pill diversion policy. When a consumer encounters an unparseable payload or unrecoverable error, the message will fail processing, return to the queue, and be redelivered in an infinite loop, blocking all valid subsequent messages and exhausting consumer compute.`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: [
            ...(context.incomingEdgesMap.get(node.id) || []).map((e) => e.id),
            ...(context.outgoingEdgesMap.get(node.id) || []).map((e) => e.id),
          ],
          evidence: [
            {
              kind: "property",
              elementId: node.id,
              propertyKey: "hasDeadLetterQueue",
              expectedValue: true,
              actualValue: false,
              description: "No dead-letter queue or max delivery attempt limit modeled on message queue.",
            },
          ],
          assumptions: [
            "Poison pill messages will be retried indefinitely unless routed to a DLQ after max delivery attempts (e.g. 3-5).",
          ],
          confidence: "high",
          propagationChain: [node.id],
          remediation: "Attach a Dead-Letter Queue with maxReceiveCount = 3 and route exhausted messages to the DLQ for manual inspection and alerting.",
          remediationAction: "add_dlq",
        });
      }

      // REL-MSG-002: At-Least-Once Delivery Without Idempotent Consumer
      const outgoingEdges = context.outgoingEdgesMap.get(node.id) || [];
      for (const outEdge of outgoingEdges) {
        const consumerNode = context.nodeMap.get(outEdge.target);
        const consumerProfile = context.nodeProfiles[outEdge.target];
        if (!consumerNode || !consumerProfile) continue;

        if (!consumerProfile.isIdempotent) {
          findings.push({
            id: `REL-MSG-002-${consumerNode.id}`,
            ruleId: "REL-MSG-002",
            category: "messaging",
            severity: "high",
            classification: "potential-risk",
            title: `Queue Consumer "${consumerNode.label || consumerNode.id}" Lacks Idempotent Processing Semantics`,
            explanation: `Consumer "${consumerNode.label || consumerNode.id}" consumes messages from broker "${node.label || node.id}" operating under at-least-once delivery guarantees, but does not implement idempotent message processing. Visibility timeout expirations or worker crashes can result in the same message being delivered more than once, leading to duplicate side effects.`,
            affectedNodeIds: [node.id, consumerNode.id],
            affectedEdgeIds: [outEdge.id],
            evidence: [
              {
                kind: "node",
                elementId: consumerNode.id,
                propertyKey: "isIdempotent",
                expectedValue: true,
                actualValue: false,
                description: "Consumer processes at-least-once deliveries without duplicate suppression.",
              },
            ],
            assumptions: [
              "Message brokers guarantee at-least-once delivery; duplicate deliveries are guaranteed to occur in distributed systems.",
            ],
            confidence: "high",
            propagationChain: [node.id, consumerNode.id],
            remediation: "Implement message deduplication using message ID tracking or conditional database inserts with idempotency keys.",
            remediationAction: "enable_idempotency",
          });
        }
      }
    }

    return findings;
  }
}

