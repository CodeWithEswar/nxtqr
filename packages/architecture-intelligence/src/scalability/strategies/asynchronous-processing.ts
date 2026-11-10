import type { IScalabilityStrategyEvaluator, ScalabilityEvaluationContext } from "../contracts/scalability.types";
import type { ScalabilityRecommendation } from "../schemas/scalability.schemas";

export class AsynchronousProcessingEvaluator implements IScalabilityStrategyEvaluator {
  public readonly strategy = "asynchronous-processing";

  public evaluate(context: ScalabilityEvaluationContext): ScalabilityRecommendation[] {
    const recommendations: ScalabilityRecommendation[] = [];

    // Check critical path latency and queue backlog findings
    const latencyFindings = context.bottleneckReport.findings.filter(
      (f) => f.bottleneckType === "latency_critical_path" || f.bottleneckType === "fan_out_amplification"
    );

    for (const finding of latencyFindings) {
      if (finding.affectedNodeIds.length < 2) continue;

      const sourceId = finding.affectedNodeIds[0];
      const targetId = finding.affectedNodeIds[1];
      const sourceNode = context.nodeMap.get(sourceId);
      const targetNode = context.nodeMap.get(targetId);
      if (!sourceNode || !targetNode) continue;

      const sourceLabel = (sourceNode.data?.label as string) || sourceId;
      const targetLabel = (targetNode.data?.label as string) || targetId;

      // Find edge between source and target
      const edge = context.edges.find(
        (e) => (e.source === sourceId && e.target === targetId) || (e.source === targetId && e.target === sourceId)
      );

      const queueNodeId = `queue_${sourceId}_to_${targetId}`;

      recommendations.push({
        id: `REC-SCALE-ASYNC-${sourceId}-${targetId}`,
        strategy: "asynchronous-processing",
        title: `Decouple Synchronous Call Chain via Message Queue (${sourceLabel} → ${targetLabel})`,
        summary: `Direct synchronous RPC/HTTP connection between "${sourceLabel}" and "${targetLabel}" propagates latency and couples availability. Introducing an asynchronous Message Queue levels burst traffic and isolates downstream spikes.`,
        affectedNodeIds: [sourceId, targetId],
        affectedEdgeIds: edge ? [edge.id] : [],
        sourceFindingIds: [finding.id],
        feasibility: "applicable",
        feasibilityReasoning: "Downstream task execution can be modeled as an asynchronous event or background job with at-least-once delivery semantics.",
        evidence: [
          {
            kind: "node",
            elementId: sourceId,
            propertyKey: "latencyCriticalPath",
            expectedValue: "Decoupled Async Queue",
            actualValue: "Synchronous RPC/HTTP",
            description: `Synchronous call blocks client response until downstream processing finishes.`,
          },
        ],
        assumptions: [
          "Client interaction does not require immediate synchronous return value (e.g. order confirmation email, thumbnail generation, invoice processing).",
          "Consumer supports idempotent message processing.",
        ],
        prerequisites: [
          "Deploy a Message Broker or durable Queue (e.g. SQS, RabbitMQ, Kafka).",
          "Implement dead-letter queue (DLQ) and consumer retry policies.",
        ],
        benefits: [
          "Reduces user-facing P99 latency by acknowledging receipt immediately upon queue publish.",
          "Protects downstream workers from burst spikes via queue-based load leveling.",
        ],
        tradeoffs: {
          implementationComplexity: "medium",
          operationalComplexity: "medium",
          reversibility: "moderate",
          reliabilityImplications: "Durable queue guarantees message delivery during temporary consumer outages.",
          securityImplications: "Queue messages must be encrypted at rest and in transit (KMS + TLS).",
          consistencyImplications: "Introduces eventual consistency: processing completes seconds or minutes after publish.",
          costImpact: "Low to moderate cost for managed queue service (AWS SQS, Google Cloud Pub/Sub).",
        },
        confidence: "high",
        rankScore: 86,
        proposedOperations: edge
          ? [
              {
                type: "insert_mediator",
                mediatorNode: {
                  id: queueNodeId,
                  type: "infrastructure",
                  position: {
                    x: Math.round((sourceNode.position.x + targetNode.position.x) / 2),
                    y: Math.round((sourceNode.position.y + targetNode.position.y) / 2) + 60,
                  },
                  label: "Message Queue (Load Leveler)",
                  data: {
                    componentType: "message-queue",
                    label: "Job Queue (SQS/RabbitMQ)",
                    queueType: "fifo",
                    enforcesTls: true,
                  },
                },
                replaceEdgeId: edge.id,
                inProtocol: "amqp",
                outProtocol: "amqp",
              },
            ]
          : [],
        documentationId: "scale-async-queue",
      });
    }

    return recommendations;
  }
}
