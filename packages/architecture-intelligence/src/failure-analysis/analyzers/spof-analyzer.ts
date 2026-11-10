import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type {
  FailureFinding,
  ResolvedDependency,
  RedundancyGroup,
  BusinessCapability,
} from "../contracts/failure.types";
import { CriticalityResolver } from "../engine/criticality-resolver";

export class SPOFAnalyzer {
  public static analyze(
    nodes: BaseNode[],
    index: GraphIndex,
    _dependencyMap: Map<string, ResolvedDependency[]>,
    redundancyGroups: Record<string, RedundancyGroup>,
    capabilities: Record<string, BusinessCapability>
  ): FailureFinding[] {
    const findings: FailureFinding[] = [];

    for (const node of nodes) {
      const type = node.type.toLowerCase();
      // Skip edge cases like pure client browsers or informational nodes
      if (type.includes("browser") || type.includes("mobile") || type.includes("desktop")) {
        continue;
      }

      const criticality = CriticalityResolver.resolveNodeCriticality(node, index);
      const isCritical = criticality === "mission-critical" || criticality === "high";

      // Check redundancy
      const nodeGroup = Object.values(redundancyGroups).find((rg) =>
        rg.memberNodeIds.includes(node.id)
      );

      const hasRedundancy = nodeGroup ? nodeGroup.effectiveReplicas > 1 : false;
      const isArticulationPoint = index.isArticulationPoint(node.id);

      // Rule SPOF-CUT-001: Structural Graph Cut-Vertex / Articulation Point
      if (isArticulationPoint && isCritical && !hasRedundancy) {
        findings.push({
          id: `SPOF-CUT-001:${node.id}`,
          ruleId: "SPOF-CUT-001",
          severity: "critical",
          classification: "modeled-spof",
          title: `Single Point of Failure: ${node.label || node.id}`,
          explanation: `Component "${node.label || node.id}" forms a graph cut-vertex on the primary request-response path. Its failure completely disconnects upstream traffic from backend resources with zero surviving redundant paths.`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: [],
          affectedCapabilityIds: Object.keys(capabilities),
          evidence: [
            {
              targetType: "node",
              targetId: node.id,
              description: `Component is a graph articulation point with in-degree ${index.getInDegree(node.id)} and out-degree ${index.getOutDegree(node.id)}.`,
            },
          ],
          assumptions: [
            "Assumes synchronous request execution where callers block on responses",
            "No client-side or gateway fallback path is modeled in the diagram",
          ],
          confidence: "high",
          recommendationIds: ["REC-FAIL-SPOF-001", "REC-FAIL-SPOF-002"],
          tradeOffs: [
            "Adding replicas increases compute costs and requires state synchronization",
            "Introducing asynchronous queues shifts architecture to eventual consistency",
          ],
        });
        continue;
      }

      // Rule SPOF-SRV-001: Single-instance critical compute service
      if (isCritical && !hasRedundancy && (index.computeIds.includes(node.id) || index.gatewayIds.includes(node.id))) {
        findings.push({
          id: `SPOF-SRV-001:${node.id}`,
          ruleId: "SPOF-SRV-001",
          severity: "high",
          classification: "modeled-spof",
          title: `Single Instance Service Without Redundancy: ${node.label || node.id}`,
          explanation: `Service "${node.label || node.id}" operates with a single replica (replicas = 1) under ${criticality} criticality. Any host crash, memory exhaustion, or container restart will interrupt dependent workloads.`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: [],
          affectedCapabilityIds: [],
          evidence: [
            {
              targetType: "node",
              targetId: node.id,
              description: `Declared replicas = ${node.data?.replicas || 1}, highAvailability = ${Boolean(node.data?.highAvailability)}.`,
            },
          ],
          assumptions: [
            "Assumes application does not rely on an external unmodeled auto-healing orchestrator",
          ],
          confidence: "high",
          recommendationIds: ["REC-FAIL-SPOF-001"],
          tradeOffs: [
            "Requires health-checking load balancer and stateless request handling",
          ],
        });
      }
    }

    return findings;
  }
}

