import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";
import type { GraphOperation } from "../../../scalability/schemas/scalability.schemas";

export class FailoverStrategy implements IRecommendationStrategy {
  public readonly id = "strat_failover_readiness";
  public readonly name = "Automated Failover & Health Probes";
  public readonly category = "availability";
  public readonly description = "Deploy automated consensus failover controllers and container liveness/readiness probes to achieve zero-touch recovery from node crashes.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap } = context;

    const failoverFindings = group.findings.filter(
      (f) =>
        f.ruleId === "REL-RECOV-001" ||
        f.ruleId === "REL-RECOV-002" ||
        f.ruleId === "SPOF-FAILOVER-AUTOMATED" ||
        f.category === "recovery" ||
        f.category === "failover"
    );

    if (failoverFindings.length === 0) return null;

    const targetNodeId = group.primaryNodeId;
    const targetNode = targetNodeId ? nodeMap.get(targetNodeId) : undefined;
    if (!targetNode) return null;

    const proposedOperations: GraphOperation[] = [
      {
        type: "update_node_config",
        nodeId: targetNode.id,
        configUpdates: {
          automatedFailover: true,
          healthProbes: {
            liveness: { path: "/healthz", intervalSeconds: 10, timeoutSeconds: 3 },
            readiness: { path: "/ready", intervalSeconds: 5, failureThreshold: 3 },
          },
          failoverController: "raft-consensus-quorum",
        },
      },
    ];

    return {
      isApplicable: true,
      feasibility: "applicable",
      title: `Deploy Automated Failover Controller & Probes for ${targetNode.label || targetNode.id}`,
      summary: `Equip "${targetNode.label || targetNode.id}" with automated consensus failover (e.g. Patroni / Raft quorum) and container liveness/readiness probes to switch primary leadership seamlessly in < 30 seconds upon hardware or host degradation.`,
      priority: "critical",
      benefits: [
        "Cuts Mean Time to Recovery (MTTR) from 30+ minutes of manual on-call paging down to sub-30 seconds automated failover.",
        "Ensures unready or crashing containers are automatically pulled from load balancer rotation.",
        "Guarantees continuous write availability across physical node or cloud zone termination.",
      ],
      tradeoffs: [
        "Requires odd number of quorum voters (minimum 3) to prevent split-brain dual-primary writes.",
        "Transient 5–15 second in-flight write rejection window during primary election.",
      ],
      tradeoffDetails: {
        reliability: "positive",
        performance: "neutral",
        scalability: "neutral",
        security: "neutral",
        dataConsistency: "positive",
        operationalComplexity: "medium",
        costDirection: "neutral",
        reversibility: "high",
        tradeoffNotes: [
          "Mandate fencing / STONITH (Shoot The Other Node In The Head) to prevent split-brain writes during network partitions.",
        ],
      },
      assumptions: [
        "Infrastructure cluster deployment supports multi-node quorum orchestration.",
      ],
      prerequisites: [
        "Deploy a minimum of 3 quorum consensus nodes to avoid split-brain hazard.",
      ],
      conflictsWith: [
        "two-node-unfenced-replication",
      ],
      dependsOn: [],
      proposedOperations,
      documentationId: "automated-failover-orchestration",
    };
  }
}
