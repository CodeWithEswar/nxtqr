import type { IScalabilityStrategyEvaluator, ScalabilityEvaluationContext } from "../contracts/scalability.types";
import type { ScalabilityRecommendation } from "../schemas/scalability.schemas";

const HORIZONTALLY_SCALABLE_TYPES = new Set([
  "compute-instance",
  "container-service",
  "serverless-function",
  "api-gateway",
  "reverse-proxy",
  "web-server",
]);

export class HorizontalScalingEvaluator implements IScalabilityStrategyEvaluator {
  public readonly strategy = "horizontal-scaling";

  public evaluate(context: ScalabilityEvaluationContext): ScalabilityRecommendation[] {
    const recommendations: ScalabilityRecommendation[] = [];

    for (const [nodeId, utilization] of Object.entries(context.bottleneckReport.nodeUtilization)) {
      if (utilization.status !== "exceeding_capacity" && utilization.status !== "near_saturation") {
        continue;
      }

      const node = context.nodeMap.get(nodeId);
      if (!node) continue;

      const rawData = (node.data || {}) as Record<string, unknown>;
      const componentType = (rawData.componentType as string) || node.type || "";
      const label = (rawData.label as string) || nodeId;

      if (!HORIZONTALLY_SCALABLE_TYPES.has(componentType)) {
        continue;
      }

      const currentReplicas = Math.max(1, Number(rawData.replicas || 1));
      const demandRps = utilization.demandRps;
      const capacityRps = utilization.declaredCapacityRps || 1000;

      // Recommended replicas: ceil(demand / (capacityPerReplica * efficiencyFactor))
      const capacityPerReplica = capacityRps / currentReplicas;
      const efficiencyFactor = 0.85; // Sub-linear scaling assumption
      const targetReplicas = Math.max(
        currentReplicas + 1,
        Math.ceil((demandRps * 1.2) / (capacityPerReplica * efficiencyFactor))
      );

      // Check statefulness
      const isStateful = Boolean(
        rawData.isStateful ||
        rawData.localDiskSession ||
        rawData.requiresStickySessions
      );

      const feasibility = isStateful ? "conditional" : "applicable";
      const feasibilityReasoning = isStateful
        ? `Component "${label}" maintains local session or disk state. Horizontal scaling requires externalizing session state into a distributed cache or shared store.`
        : `Component "${label}" is stateless and supports horizontal instance scale-out.`;

      const sourceFindings = context.bottleneckReport.findings
        .filter((f) => f.affectedNodeIds.includes(nodeId))
        .map((f) => f.id);

      recommendations.push({
        id: `REC-SCALE-HORIZ-${nodeId}`,
        strategy: "horizontal-scaling",
        title: `Scale Out Service Instances (${label} from ${currentReplicas}x to ${targetReplicas}x Replicas)`,
        summary: `Workload demand of ${Math.round(demandRps)} req/s exceeds current single/multi-instance capacity (${Math.round(capacityRps)} req/s). Scaling to ${targetReplicas} instances relieves CPU/concurrency saturation.`,
        affectedNodeIds: [nodeId],
        affectedEdgeIds: (context.incomingEdgesMap.get(nodeId) || []).map((e) => e.id),
        sourceFindingIds: sourceFindings,
        feasibility,
        feasibilityReasoning,
        evidence: [
          {
            kind: "metric",
            elementId: nodeId,
            propertyKey: "utilizationRatio",
            expectedValue: "< 0.80",
            actualValue: utilization.utilizationRatio,
            description: `Current utilization is ${(Number(utilization.utilizationRatio || 1) * 100).toFixed(0)}% under scenario "${context.scenario.name}".`,
          },
        ],
        assumptions: [
          "Downstream dependencies (databases, auth providers) have sufficient connection pool head-room to support added caller replicas.",
          `Scaling efficiency modeled at ${(efficiencyFactor * 100).toFixed(0)}% due to connection pooling overhead.`,
        ],
        prerequisites: [
          "Ensure requests are distributed via an upstream Load Balancer or API Gateway.",
          "Verify session state is stateless or stored in an external cache.",
        ],
        benefits: [
          `Increases throughput headroom by ~${Math.round(((targetReplicas / currentReplicas) * efficiencyFactor - 1) * 100)}%.`,
          "Improves fault tolerance by distributing workload across multiple failure domains.",
        ],
        tradeoffs: {
          implementationComplexity: "low",
          operationalComplexity: isStateful ? "medium" : "low",
          reversibility: "easy",
          reliabilityImplications: "Improves resilience against single-container failures.",
          securityImplications: "Requires uniform IAM and secret distribution across all instances.",
          consistencyImplications: "No impact if service is stateless.",
          costImpact: "Proportional compute cost increase for additional running instances.",
        },
        confidence: "high",
        rankScore: 85 + (utilization.status === "exceeding_capacity" ? 10 : 0),
        proposedOperations: [
          {
            type: "adjust_instances",
            nodeId,
            newReplicas: targetReplicas,
          },
        ],
        documentationId: "scale-horizontal",
      });
    }

    return recommendations;
  }
}
