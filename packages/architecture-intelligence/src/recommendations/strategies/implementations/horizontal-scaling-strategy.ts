import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";
import type { GraphOperation } from "../../../scalability/schemas/scalability.schemas";

export class HorizontalScalingStrategy implements IRecommendationStrategy {
  public readonly id = "strat_horizontal_scaling";
  public readonly name = "Horizontal Compute Scaling";
  public readonly category = "scalability";
  public readonly description = "Scale stateless application compute instances behind a load balancer to match workload concurrency demands.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap } = context;

    const scaleFindings = group.findings.filter(
      (f) =>
        f.ruleId === "BTK-SRV-001" ||
        f.ruleId === "scale_horizontal" ||
        f.category === "capacity-exhaustion" ||
        f.category === "scalability-constraint"
    );

    if (scaleFindings.length === 0) return null;

    const targetNodeId = group.primaryNodeId;
    const targetNode = targetNodeId ? nodeMap.get(targetNodeId) : undefined;
    if (!targetNode) return null;

    const componentType = ((targetNode.data?.componentType as string) || targetNode.type || "").toLowerCase();
    const isCompute =
      componentType.includes("instance") ||
      componentType.includes("server") ||
      componentType.includes("container") ||
      componentType.includes("compute") ||
      componentType.includes("service");

    if (!isCompute) return null;

    const currentReplicas = Number(targetNode.data?.replicas || 1);
    const targetReplicas = Math.max(3, currentReplicas + 2);

    // Feasibility: check if node has in-memory session state
    const hasLocalSession = targetNode.data?.sessionStorage === "local-memory" || targetNode.data?.isStateful === true;
    const feasibility = hasLocalSession ? "conditional" : "applicable";
    const feasibilityReason = hasLocalSession
      ? "Node maintains in-memory session state; horizontal scaling without external session storage (e.g. Redis) will cause lost user sessions when requests hit different instances."
      : "Stateless compute service is primed for linear horizontal scaling behind load balancer.";

    const proposedOperations: GraphOperation[] = [
      {
        type: "adjust_instances",
        nodeId: targetNode.id,
        newReplicas: targetReplicas,
      },
    ];

    return {
      isApplicable: true,
      feasibility,
      feasibilityReason,
      title: `Scale Replicas for ${targetNode.label || targetNode.id} (${currentReplicas} \u2192 ${targetReplicas})`,
      summary: `Scale out compute worker instances for "${targetNode.label || targetNode.id}" from ${currentReplicas} to ${targetReplicas} replicas to eliminate CPU saturation and queue wait times under peak traffic.`,
      priority: "high",
      benefits: [
        `Multiplies concurrency capacity by ${(targetReplicas / currentReplicas).toFixed(1)}\u00d7.`,
        "Eliminates compute worker saturation during traffic surges.",
        "Increases service availability; surviving instances absorb load during individual container restarts.",
      ],
      tradeoffs: [
        "Increases provisioned infrastructure compute cost.",
        "Increases downstream database connection pool demand.",
        hasLocalSession ? "Requires externalizing session state to shared storage before scaling." : "",
      ].filter(Boolean),
      tradeoffDetails: {
        reliability: "positive",
        performance: "positive",
        scalability: "positive",
        security: "neutral",
        dataConsistency: "neutral",
        operationalComplexity: "low",
        costDirection: "increase",
        reversibility: "high",
        tradeoffNotes: [
          "Ensure downstream database connection pool limits can support increased total worker instances.",
        ],
      },
      assumptions: [
        "Compute service instances are stateless or delegate session state to distributed storage.",
      ],
      prerequisites: hasLocalSession ? ["Externalize in-memory session state to distributed session cache (e.g. Redis)."] : [],
      conflictsWith: hasLocalSession ? ["in-memory-stateful-sessions"] : [],
      dependsOn: [],
      proposedOperations,
      documentationId: "horizontal-pod-autoscaling",
    };
  }
}
