import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type { ExecutionTrace } from "../domain/execution-trace";
import { computeDeterministicDigest } from "./deterministic-id";
import type {
  FindingSeverity,
  SimulationCapabilityId,
  TopologyCapabilityInspection,
  UnifiedFinding,
} from "./orchestrator-schemas";

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

function makeFinding(
  input: Omit<UnifiedFinding, "id">
): UnifiedFinding {
  const id = `finding_${computeDeterministicDigest(input.dedupeKey).slice(0, 12)}`;
  return { id, ...input };
}

/**
 * Deduplicates and normalizes findings across topology structure, SPOFs, traffic bottlenecks,
 * zero-trust denials, fault injection outages, and capability warnings.
 */
export class UnifiedFindingsAggregator {
  public static aggregate(params: {
    nodes: BaseNode[];
    edges: BaseEdge[];
    trace?: ExecutionTrace | null;
    capabilityInspection?: TopologyCapabilityInspection;
    additionalFindings?: UnifiedFinding[];
  }): UnifiedFinding[] {
    const { nodes, edges, trace, capabilityInspection, additionalFindings = [] } = params;
    const byKey = new Map<string, UnifiedFinding>();

    const upsert = (finding: UnifiedFinding) => {
      const existing = byKey.get(finding.dedupeKey);
      if (!existing) {
        byKey.set(finding.dedupeKey, finding);
        return;
      }
      // Keep higher severity and merge evidence IDs deterministically
      const winner = SEVERITY_RANK[finding.severity] > SEVERITY_RANK[existing.severity] ? finding : existing;
      byKey.set(finding.dedupeKey, {
        ...winner,
        affectedNodeIds: Array.from(new Set([...existing.affectedNodeIds, ...finding.affectedNodeIds])),
        affectedEdgeIds: Array.from(new Set([...existing.affectedEdgeIds, ...finding.affectedEdgeIds])),
        evidenceEventSequences: Array.from(
          new Set([...existing.evidenceEventSequences, ...finding.evidenceEventSequences])
        ).sort((a, b) => a - b),
        evidenceSpanIds: Array.from(new Set([...existing.evidenceSpanIds, ...finding.evidenceSpanIds])),
      });
    };

    // 1. Structural SPOF & connectivity findings
    for (const node of nodes) {
      const data = (node.data || {}) as Record<string, unknown>;
      const kind = String(data.componentType || node.type || "service").toLowerCase();
      const replicas = typeof data.replicas === "number" ? data.replicas : undefined;
      if ((kind === "database" || kind === "service" || kind === "load-balancer") && replicas === 1) {
        upsert(
          makeFinding({
            dedupeKey: `spof:single-replica:${node.id}`,
            severity: kind === "database" ? "high" : "medium",
            capabilityId: "architecture-analysis",
            category: "reliability",
            title: `Single Replica SPOF on ${node.label || node.id}`,
            summary: `Component "${node.label || node.id}" (${kind}) is configured with replicas=1 and introduces a single point of failure.`,
            remediation:
              kind === "database"
                ? "Configure Multi-AZ standby replication or read replicas with automated failover."
                : "Increase replica count >= 2 behind a health-checked load balancer.",
            provenance: "topology-derived",
            affectedNodeIds: [node.id],
            affectedEdgeIds: edges
              .filter((e) => e.source === node.id || e.target === node.id)
              .map((e) => e.id),
            evidenceEventSequences: [],
            evidenceSpanIds: [],
          })
        );
      }
    }

    if (capabilityInspection) {
      for (const warn of capabilityInspection.topologyWarnings) {
        upsert(
          makeFinding({
            dedupeKey: `topology:warning:${warn}`,
            severity: "medium",
            capabilityId: "core-flow",
            category: "validation",
            title: "Topology Validation Warning",
            summary: warn,
            remediation: "Connect components cleanly or inspect missing node/edge references in the canvas.",
            provenance: "topology-derived",
            affectedNodeIds: [],
            affectedEdgeIds: [],
            evidenceEventSequences: [],
            evidenceSpanIds: [],
          })
        );
      }
    }

    // 2. Trace event evidence aggregation
    if (trace) {
      const spanIds = (trace.spans || []).slice(0, 5).map((s) => s.spanId);

      for (const evt of trace.events) {
        const rec = evt as unknown as Record<string, unknown>;
        const targetNodeId =
          typeof rec.nodeId === "string"
            ? rec.nodeId
            : typeof rec.targetNodeId === "string"
              ? rec.targetNodeId
              : typeof rec.dbNodeId === "string"
                ? rec.dbNodeId
                : undefined;

        if (
          evt.type.includes("blocked") ||
          evt.type.includes("denied") ||
          rec.outcome === "deny"
        ) {
          upsert(
            makeFinding({
              dedupeKey: `security:deny:${targetNodeId || "gateway"}`,
              severity: "high",
              capabilityId: "zero-trust" as SimulationCapabilityId,
              category: "security",
              title: `Access Denied / Policy Block${targetNodeId ? ` at ${targetNodeId}` : ""}`,
              summary: evt.explanation,
              remediation:
                "Verify caller identity, JWT/mTLS claims, and least-privilege RBAC rules; blocked calls halt downstream execution.",
              provenance: "observed-simulated",
              affectedNodeIds: targetNodeId ? [targetNodeId] : [],
              affectedEdgeIds: [],
              evidenceEventSequences: [evt.sequence],
              evidenceSpanIds: spanIds,
            })
          );
        }

        if (
          evt.type.includes("failed") ||
          evt.type.includes("outage") ||
          evt.type.includes("circuit.opened") ||
          evt.type === "database.operation.failed"
        ) {
          upsert(
            makeFinding({
              dedupeKey: `resilience:failure:${targetNodeId || evt.type}`,
              severity: "critical",
              capabilityId: "resilience",
              category: "reliability",
              title: `Failure / Outage Observed${targetNodeId ? ` on ${targetNodeId}` : ""}`,
              summary: evt.explanation,
              remediation:
                "Inspect circuit-breaker thresholds, retry jitter budgets, and standby replica failover readiness.",
              provenance: "observed-simulated",
              affectedNodeIds: targetNodeId ? [targetNodeId] : [],
              affectedEdgeIds: [],
              evidenceEventSequences: [evt.sequence],
              evidenceSpanIds: spanIds,
            })
          );
        }

        if (evt.type.includes("rate_limit") || evt.type.includes("shed") || evt.type.includes("throttled")) {
          upsert(
            makeFinding({
              dedupeKey: `capacity:throttle:${targetNodeId || "ingress"}`,
              severity: "medium",
              capabilityId: "traffic-control",
              category: "bottleneck",
              title: `Traffic Throttling / Load Shedding Active`,
              summary: evt.explanation,
              remediation:
                "Adjust token bucket burst capacity or scale constrained downstream bottlenecks before raising ingress limits.",
              provenance: "observed-simulated",
              affectedNodeIds: targetNodeId ? [targetNodeId] : [],
              affectedEdgeIds: [],
              evidenceEventSequences: [evt.sequence],
              evidenceSpanIds: spanIds,
            })
          );
        }
      }

      if (trace.performanceSummary) {
        const ps = trace.performanceSummary;
        const unsatisified = ps.failedRequests + ps.rejectedRequests + ps.timedOutRequests;
        const failureRate = ps.totalRequests > 0 ? (unsatisified / ps.totalRequests) * 100 : 0;
        const primaryBottleneck = ps.bottlenecks?.[0];
        if (failureRate > 5 || (primaryBottleneck && primaryBottleneck.severity !== "healthy")) {
          upsert(
            makeFinding({
              dedupeKey: `capacity:error-rate:${trace.snapshotHash}`,
              severity: failureRate > 25 ? "critical" : "high",
              capabilityId: "capacity",
              category: "bottleneck",
              title: `Elevated Error / Shed Rate (${failureRate.toFixed(1)}%)`,
              summary: `Simulated throughput completed ${ps.successfulRequests}/${ps.totalRequests} requests with ${ps.rejectedRequests} rejected and ${ps.failedRequests} failed.`,
              remediation:
                "Scale the constrained bottleneck node (lowest capacity/RPS tier) rather than only over-provisioning stateless ingress.",
              provenance: "observed-simulated",
              affectedNodeIds: primaryBottleneck ? [primaryBottleneck.nodeId] : [],
              affectedEdgeIds: [],
              evidenceEventSequences: [],
              evidenceSpanIds: spanIds,
            })
          );
        }
      }
    }

    for (const f of additionalFindings) {
      upsert(f);
    }

    return Array.from(byKey.values()).sort((a, b) => {
      const rankDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      if (rankDiff !== 0) return rankDiff;
      return a.id.localeCompare(b.id);
    });
  }
}
