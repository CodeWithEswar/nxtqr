import type { IReliabilityAnalyzer, ReliabilityContext } from "../contracts/reliability.types";
import type { ReliabilityFinding } from "../schemas/reliability.schemas";

export class BulkheadAnalyzer implements IReliabilityAnalyzer {
  public readonly category = "bulkhead";

  public analyze(context: ReliabilityContext): ReliabilityFinding[] {
    const findings: ReliabilityFinding[] = [];

    for (const node of context.nodes) {
      const profile = context.nodeProfiles[node.id];
      if (!profile) continue;

      const outgoing = context.outgoingEdgesMap.get(node.id) || [];
      if (outgoing.length < 2) continue;

      // Check if targets have mixed criticalities (e.g. mission-critical checkout vs optional analytics/search)
      const targetProfiles = outgoing
        .map((e) => ({ edge: e, profile: context.nodeProfiles[e.target], node: context.nodeMap.get(e.target) }))
        .filter((item) => item.profile !== undefined && item.node !== undefined);

      const hasCritical = targetProfiles.some((t) => t.profile?.criticality === "mission-critical");
      const hasNonCritical = targetProfiles.some((t) => t.profile?.criticality === "optional" || t.profile?.criticality === "supporting");

      if (hasCritical && hasNonCritical && !profile.hasBulkhead) {
        const criticalNames = targetProfiles.filter((t) => t.profile?.criticality === "mission-critical").map((t) => t.node?.label || t.node?.id);
        const nonCriticalNames = targetProfiles.filter((t) => t.profile?.criticality !== "mission-critical").map((t) => t.node?.label || t.node?.id);

        findings.push({
          id: `REL-BULK-001-${node.id}`,
          ruleId: "REL-BULK-001",
          category: "bulkhead",
          severity: "high",
          classification: "potential-risk",
          title: `Bulkhead Isolation Missing on "${node.label || node.id}": Shared Resource Starvation Risk`,
          explanation: `Service "${node.label || node.id}" simultaneously coordinates mission-critical operations (${criticalNames.join(", ")}) and non-critical operations (${nonCriticalNames.join(", ")}) without bulkhead isolation. If a non-critical downstream dependency slows down, its pending requests can saturate the common thread pool or connection pool, starving critical transaction processing.`,
          affectedNodeIds: [node.id, ...targetProfiles.map((t) => t.node!.id)],
          affectedEdgeIds: outgoing.map((e) => e.id),
          evidence: [
            {
              kind: "property",
              elementId: node.id,
              propertyKey: "hasBulkhead",
              expectedValue: true,
              actualValue: false,
              description: "Heterogeneous workloads share an unpartitioned thread/connection pool.",
            },
          ],
          assumptions: [
            "HTTP and database connection pools are shared across all controller routes in the service.",
          ],
          confidence: "high",
          propagationChain: [node.id],
          remediation: "Isolate worker threads and HTTP connection pools using dedicated bulkheads or bounded semaphore queues per downstream dependency.",
          remediationAction: "isolate_bulkhead",
        });
      }
    }

    return findings;
  }
}

