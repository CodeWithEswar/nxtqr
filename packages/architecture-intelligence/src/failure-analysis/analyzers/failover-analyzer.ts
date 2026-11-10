import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type {
  FailureFinding,
  RedundancyGroup,
} from "../contracts/failure.types";

export class FailoverAnalyzer {
  public static analyze(
    _nodes: BaseNode[],
    _index: GraphIndex,
    redundancyGroups: Record<string, RedundancyGroup>
  ): FailureFinding[] {
    const findings: FailureFinding[] = [];

    for (const group of Object.values(redundancyGroups)) {
      // 1. Missing Automated Failover (FAILOVER-GAP-001)
      if (
        (group.mode === "active-passive" || group.mode === "primary-replica") &&
        (group.failoverMode === "manual" || group.failoverMode === "none" || group.failoverMode === "unspecified")
      ) {
        findings.push({
          id: `FAILOVER-GAP-001:${group.groupId}`,
          ruleId: "FAILOVER-GAP-001",
          severity: "high",
          classification: "failover-gap",
          title: `Unautomated Failover Gap: ${group.name}`,
          explanation: `Standby / read replica instances exist in "${group.name}", but failover is configured as "${group.failoverMode}". In the event of primary failure, human intervention is required to re-point connection strings and promote the standby, leading to prolonged Mean Time to Recovery (MTTR).`,
          affectedNodeIds: group.memberNodeIds,
          affectedEdgeIds: [],
          affectedCapabilityIds: [],
          evidence: [
            {
              targetType: "node",
              targetId: group.memberNodeIds[0],
              description: `Failover mode is set to "${group.failoverMode}" across ${group.effectiveReplicas} instances.`,
            },
          ],
          assumptions: [
            "Manual failover requires operator availability and DNS propagation time",
          ],
          confidence: "high",
          recommendationIds: ["REC-FAIL-FAILOVER-001"],
          tradeOffs: [
            "Automated failover requires robust fencing / consensus mechanisms to avoid split-brain writes",
          ],
        });
      }

      // 2. Multi-Instance Group Without Health Checks (FAILOVER-HEALTH-001)
      if (group.effectiveReplicas > 1 && !group.healthCheckConfigured) {
        findings.push({
          id: `FAILOVER-HEALTH-001:${group.groupId}`,
          ruleId: "FAILOVER-HEALTH-001",
          severity: "medium",
          classification: "failover-gap",
          title: `Redundant Instances Missing Health Checks: ${group.name}`,
          explanation: `Group "${group.name}" provisions ${group.effectiveReplicas} replicas, but automated health checking / liveness probes are not configured. Upstream load balancers may continue routing traffic to crashed or unresponsive instances.`,
          affectedNodeIds: group.memberNodeIds,
          affectedEdgeIds: [],
          affectedCapabilityIds: [],
          evidence: [
            {
              targetType: "node",
              targetId: group.memberNodeIds[0],
              description: `healthCheckConfigured = false across ${group.effectiveReplicas} replicas.`,
            },
          ],
          assumptions: [
            "Routers require active probes to safely drain unhealthy instances",
          ],
          confidence: "high",
          recommendationIds: ["REC-FAIL-FAILOVER-001"],
          tradeOffs: [
            "Health check probes generate continuous minor request overhead",
          ],
        });
      }
    }

    return findings;
  }
}

