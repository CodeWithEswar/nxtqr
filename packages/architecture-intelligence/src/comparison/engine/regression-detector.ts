import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  ArchitectureChange,
  ArchitecturalRegression,
  EngineAnalysisComparison,
} from "../contracts/comparison.types";

export class RegressionDetector {
  public static detectRegressions(
    _baselineNodes: BaseNode[],
    candidateNodes: BaseNode[],
    _baselineEdges: BaseEdge[],
    _candidateEdges: BaseEdge[],
    changes: ArchitectureChange[],
    analysisComparison: EngineAnalysisComparison
  ): ArchitecturalRegression[] {
    const regressions: ArchitecturalRegression[] = [];

    // 1. Direct Configuration & Structural Regressions from Changes
    for (const change of changes) {
      if (change.kind === "modified" && change.entityType === "node") {
        for (const delta of change.fieldDeltas) {
          const key = delta.fieldPath.toLowerCase();

          // A. Multi-AZ / High Availability removed
          if (
            (key === "multiaz" || key === "highavailability" || key === "automatedfailover") &&
            delta.baselineValue === true &&
            delta.candidateValue === false
          ) {
            regressions.push({
              id: `reg_ha_disabled_${change.candidateId}`,
              ruleId: "REG-REL-001",
              title: `High Availability / Multi-AZ Disabled on "${change.label}"`,
              explanation: `Component "${change.label}" had automated multi-AZ replication enabled in baseline, but it has been disabled in the candidate architecture. This reintroduces a single point of failure.`,
              category: "resilience",
              severity: "critical",
              classification: "supported-regression",
              affectedNodeIds: [change.candidateId || ""],
              affectedEdgeIds: [],
              evidence: [
                {
                  kind: "property",
                  elementId: change.candidateId,
                  propertyKey: delta.fieldPath,
                  expectedValue: true,
                  actualValue: false,
                  description: "High Availability disabled in candidate configuration",
                },
              ],
            });
          }

          // B. Database Read Replicas Reduced to Zero
          if (
            (key === "readreplicas" || key === "replicacount") &&
            typeof delta.baselineValue === "number" &&
            typeof delta.candidateValue === "number" &&
            delta.candidateValue < delta.baselineValue &&
            delta.candidateValue === 0
          ) {
            regressions.push({
              id: `reg_replicas_zero_${change.candidateId}`,
              ruleId: "REG-SCAL-001",
              title: `All Read Replicas Removed from "${change.label}"`,
              explanation: `Database had ${delta.baselineValue} read replicas in baseline, but candidate reduces replicas to 0. All read query throughput will now saturate the primary database.`,
              category: "scalability",
              severity: "high",
              classification: "supported-regression",
              affectedNodeIds: [change.candidateId || ""],
              affectedEdgeIds: [],
              evidence: [
                {
                  kind: "property",
                  elementId: change.candidateId,
                  propertyKey: delta.fieldPath,
                  expectedValue: delta.baselineValue,
                  actualValue: 0,
                  description: "Read replicas eliminated",
                },
              ],
            });
          }

          // C. Authentication or TLS Disabled
          if (
            (key.includes("auth") || key.includes("tls") || key.includes("encrypt")) &&
            (delta.baselineValue === true || delta.baselineValue === "oauth2-jwt" || delta.baselineValue === "mtls") &&
            (delta.candidateValue === false || delta.candidateValue === "none" || delta.candidateValue === "anonymous")
          ) {
            regressions.push({
              id: `reg_sec_disabled_${change.candidateId}`,
              ruleId: "REG-SEC-001",
              title: `Security Control Disabled on "${change.label}"`,
              explanation: `Security property "${delta.fieldPath}" was enforced in baseline (${JSON.stringify(delta.baselineValue)}) but has been relaxed to ${JSON.stringify(delta.candidateValue)} in candidate.`,
              category: "security",
              severity: "critical",
              classification: "supported-regression",
              affectedNodeIds: [change.candidateId || ""],
              affectedEdgeIds: [],
              evidence: [
                {
                  kind: "property",
                  elementId: change.candidateId,
                  propertyKey: delta.fieldPath,
                  expectedValue: delta.baselineValue,
                  actualValue: delta.candidateValue,
                  description: "Security authentication or encryption removed",
                },
              ],
            });
          }

          // D. Excessive Retries Added Without Jitter (Retry Storm Risk)
          if (
            key.includes("retry") &&
            typeof delta.baselineValue === "number" &&
            typeof delta.candidateValue === "number" &&
            delta.candidateValue > delta.baselineValue &&
            delta.candidateValue > 3
          ) {
            regressions.push({
              id: `reg_retry_storm_${change.candidateId}`,
              ruleId: "REG-REL-002",
              title: `Excessive Retry Limit Configured on "${change.label}"`,
              explanation: `Retry attempts increased from ${delta.baselineValue} to ${delta.candidateValue}. Bounded retries without full exponential backoff and jitter amplify downstream overload during outages.`,
              category: "reliability",
              severity: "medium",
              classification: "potential-regression",
              affectedNodeIds: [change.candidateId || ""],
              affectedEdgeIds: [],
              evidence: [
                {
                  kind: "property",
                  elementId: change.candidateId,
                  propertyKey: delta.fieldPath,
                  expectedValue: "<= 3",
                  actualValue: delta.candidateValue,
                  description: "High retry count risks retry storm amplification",
                },
              ],
            });
          }
        }
      }

      // 2. Newly Added Unprotected Public Ingress
      if (change.kind === "added" && change.entityType === "node") {
        const cNode = candidateNodes.find((n) => n.id === change.candidateId);
        const isDb = ["relational-database", "nosql-database"].includes(
          (cNode?.data?.componentType as string) || ""
        );
        const isPublic = Boolean(cNode?.data?.publiclyAccessible || cNode?.data?.internetFacing);

        if (isDb && isPublic) {
          regressions.push({
            id: `reg_public_db_${change.candidateId}`,
            ruleId: "REG-SEC-002",
            title: `Direct Public Exposure of Database "${change.label}"`,
            explanation: `Added datastore "${change.label}" is flagged as directly internet-facing without an intermediary API gateway or private VPC isolation.`,
            category: "security",
            severity: "critical",
            classification: "supported-regression",
            affectedNodeIds: [change.candidateId || ""],
            affectedEdgeIds: [],
            evidence: [
              {
                kind: "node",
                elementId: change.candidateId,
                description: "Database is directly exposed to public traffic",
              },
            ],
          });
        }
      }

      // 3. Removal of Circuit Breakers or DLQs
      if (change.kind === "removed" && change.entityType === "node") {
        const isQueue = change.nodeType?.includes("queue") || change.nodeType?.includes("dlq");
        if (isQueue) {
          regressions.push({
            id: `reg_queue_removed_${change.baselineId}`,
            ruleId: "REG-REL-003",
            title: `Asynchronous Buffer / Queue Decommissioned ("${change.label}")`,
            explanation: `Removing buffer "${change.label}" directly couples upstream producers to downstream consumers, eliminating backpressure tolerance.`,
            category: "resilience",
            severity: "medium",
            classification: "potential-regression",
            affectedNodeIds: [change.baselineId || ""],
            affectedEdgeIds: [],
            evidence: [
              {
                kind: "node",
                elementId: change.baselineId,
                description: "Message buffer removed from topology",
              },
            ],
          });
        }
      }
    }

    // 4. Regressions inferred from Cross-Engine Analysis Deltas
    if (analysisComparison.spof && analysisComparison.spof.newSpofNodeIds.length > 0) {
      for (const spofId of analysisComparison.spof.newSpofNodeIds) {
        if (!regressions.some((r) => r.affectedNodeIds.includes(spofId))) {
          regressions.push({
            id: `reg_new_spof_${spofId}`,
            ruleId: "REG-SPOF-001",
            title: `New Single Point of Failure Introduced (#${spofId})`,
            explanation: `Candidate architecture introduces node "${spofId}" as an unredundant dependency on the critical path.`,
            category: "resilience",
            severity: "high",
            classification: "supported-regression",
            affectedNodeIds: [spofId],
            affectedEdgeIds: [],
            evidence: [
              {
                kind: "node",
                elementId: spofId,
                description: "Node identified as new single point of failure",
              },
            ],
          });
        }
      }
    }

    return regressions;
  }
}
