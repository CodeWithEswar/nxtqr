import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";
import type { GraphOperation } from "../../../scalability/schemas/scalability.schemas";

export class QueueDecouplingStrategy implements IRecommendationStrategy {
  public readonly id = "strat_queue_decoupling";
  public readonly name = "Asynchronous Queue Load Leveling";
  public readonly category = "scalability";
  public readonly description = "Decouple synchronous point-to-point service dependencies with a durable message queue and dead-letter queue (DLQ) to buffer bursty traffic.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap, edges } = context;

    const asyncFindings = group.findings.filter(
      (f) =>
        f.ruleId === "BTK-QUE-001" ||
        f.ruleId === "BTK-SRV-001" ||
        f.ruleId === "REL-CASC-001" ||
        f.ruleId === "REL-MSG-001" ||
        f.ruleId === "scale_async" ||
        f.category === "cascading-failure" ||
        f.category === "messaging" ||
        f.category === "queue-backlog"
    );

    if (asyncFindings.length === 0) return null;

    const targetNodeId = group.primaryNodeId;
    const targetNode = targetNodeId ? nodeMap.get(targetNodeId) : undefined;
    if (!targetNode) return null;

    // Check if edge can be replaced with queue mediator
    const inboundEdges = edges.filter((e) => e.target === targetNode.id);
    const proposedOperations: GraphOperation[] = [];

    if (inboundEdges.length > 0) {
      const edge = inboundEdges[0];
      proposedOperations.push({
        type: "insert_mediator",
        replaceEdgeId: edge.id,
        mediatorNode: {
          id: `queue_${targetNode.id}`,
          type: "infrastructure",
          position: {
            x: Math.round((targetNode.position?.x || 100) - 140),
            y: Math.round(targetNode.position?.y || 100),
          },
          label: `${targetNode.label || targetNode.id} Ingestion Queue`,
          data: {
            componentType: "message-queue",
            deadLetterQueueEnabled: true,
            maxDeliveryAttempts: 5,
            visibilityTimeoutSeconds: 30,
            messageRetentionDays: 7,
          },
        },
        inProtocol: "amqp",
        outProtocol: "amqp",
      });
    } else {
      proposedOperations.push({
        type: "update_node_config",
        nodeId: targetNode.id,
        configUpdates: {
          asyncProcessing: true,
          deadLetterQueueEnabled: true,
          consumerPrefetch: 50,
        },
      });
    }

    return {
      isApplicable: true,
      feasibility: "applicable",
      title: `Decouple Ingestion with Message Queue for ${targetNode.label || targetNode.id}`,
      summary: `Introduce an asynchronous message broker queue with Dead-Letter Queue (DLQ) support in front of "${targetNode.label || targetNode.id}" to buffer peak traffic spikes, level processing load, and isolate producers from consumer downtime.`,
      priority: "high",
      benefits: [
        "Eliminates synchronous blocking caller threads, converting latency to background queuing.",
        "Smooths extreme traffic bursts without overloading downstream consumer instances or databases.",
        "Guarantees message retention and dead-letter poison pill isolation across consumer crashes.",
      ],
      tradeoffs: [
        "Shifts user interaction model from synchronous immediate response to eventual consistency.",
        "Requires polling, websockets, or webhooks for clients needing task completion status.",
      ],
      tradeoffDetails: {
        reliability: "positive",
        performance: "positive",
        scalability: "positive",
        security: "neutral",
        dataConsistency: "variable",
        operationalComplexity: "medium",
        costDirection: "increase",
        reversibility: "medium",
        tradeoffNotes: [
          "Always enable Dead-Letter Queues (DLQ) to prevent infinite redelivery poison pill loops.",
          "Consumers must process messages idempotently.",
        ],
      },
      assumptions: [
        "Workload operations can be performed asynchronously without immediate user return value.",
      ],
      prerequisites: [
        "Configure consumer idempotent message handling before enabling queue ingestion.",
      ],
      conflictsWith: [
        "synchronous-rpc-request-reply-mandate",
      ],
      dependsOn: [],
      proposedOperations,
      alternativeStrategies: [
        {
          strategyId: "strat_rate_limiting",
          title: "Ingress Rate Limiting & Load Shedding",
          explanation: "Drops or throttles incoming requests rather than buffering them in a queue.",
          tradeoffSummary: "Zero queue infrastructure cost, but discards dropped requests instead of processing them.",
        },
      ],
      documentationId: "asynchronous-queuing",
    };
  }
}
