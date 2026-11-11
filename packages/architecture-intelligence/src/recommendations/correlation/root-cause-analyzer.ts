import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  UnifiedFinding,
  RootCauseAssessment,
} from "../contracts/recommendations.types";

export class RootCauseAnalyzer {
  public static evaluateRootCause(
    primaryNodeId: string | undefined,
    findings: UnifiedFinding[],
    nodes: BaseNode[],
    _edges: BaseEdge[]
  ): RootCauseAssessment {
    const node = primaryNodeId ? nodes.find((n) => n.id === primaryNodeId) : undefined;
    const nodeLabel = node?.label || primaryNodeId || "Component";
    const componentType = (node?.data?.componentType as string) || node?.type || "";

    const ruleIds = new Set(findings.map((f) => f.ruleId));
    const categories = new Set(findings.map((f) => f.category));
    const engineSources = new Set(findings.map((f) => f.sourceEngine));

    // 1. Evidence-backed Root Cause: Database Saturation & Read Contention
    // (Converges: Bottleneck + Scalability/Health + SPOF on persistence component)
    const isDb =
      componentType.includes("database") ||
      componentType.includes("postgres") ||
      componentType.includes("sql") ||
      componentType.includes("mongo");

    const hasCapacityPressure =
      ruleIds.has("BTK-DB-001") ||
      ruleIds.has("BTK-RES-001") ||
      categories.has("database-contention") ||
      categories.has("scalability-constraint") ||
      categories.has("capacity-exhaustion");

    const hasSpofOrSingleInstance =
      ruleIds.has("SPOF-SINGLE-INSTANCE") ||
      ruleIds.has("SPOF-CRITICAL-PATH") ||
      categories.has("single-point-of-failure") ||
      categories.has("availability");

    if (isDb && hasCapacityPressure && (hasSpofOrSingleInstance || engineSources.size >= 2)) {
      return {
        type: "supported-root-cause",
        title: `Single-Instance Read/Write Saturation on ${nodeLabel}`,
        explanation: `Converging evidence across ${Array.from(engineSources).join(", ")} indicates that "${nodeLabel}" is operating as a consolidated read/write bottleneck without read replicas or caching. Upstream request delays and throughput ceilings stem directly from this shared resource constraint.`,
        confidence: "high",
        evidence: [
          `Component "${nodeLabel}" is targeted by ${findings.length} findings across multiple intelligence engines.`,
          `Persistent storage node lacks horizontal read replicas or caching offload under the active workload.`,
        ],
      };
    }

    // 2. Evidence-backed Root Cause: Unthrottled Ingress & Missing Backpressure
    const isIngress =
      componentType.includes("gateway") ||
      componentType.includes("load-balancer") ||
      componentType.includes("ingress") ||
      componentType.includes("reverse-proxy");

    const hasIngressExposure =
      ruleIds.has("REL-BACK-001") ||
      ruleIds.has("SEC-AUTH-001") ||
      categories.has("backpressure") ||
      categories.has("exposure") ||
      categories.has("rate-limiting");

    if (isIngress && hasIngressExposure && findings.length >= 2) {
      return {
        type: "supported-root-cause",
        title: `Uncontrolled Public Ingress on ${nodeLabel}`,
        explanation: `Public-facing entrypoint "${nodeLabel}" lacks rate limiting, load shedding, or strict authentication boundaries. Downstream queue backlogs and compute pressure originate from unbounded ingress traffic.`,
        confidence: "high",
        evidence: [
          `Public boundary component exhibits missing rate-limit and boundary controls.`,
          `Downstream compute services are exposed to traffic surges without upstream protection.`,
        ],
      };
    }

    // 3. Evidence-backed Root Cause: Uncontained Cascading Failure Chain
    const hasCascadingOrDeadline =
      ruleIds.has("REL-CASC-001") ||
      ruleIds.has("REL-TIME-002") ||
      ruleIds.has("REL-RETRY-003") ||
      categories.has("cascading-failure") ||
      categories.has("timeout");

    if (hasCascadingOrDeadline && findings.length >= 2) {
      return {
        type: "supported-root-cause",
        title: `Tight Synchronous Coupling & Cascading Failure Propagation`,
        explanation: `Deep synchronous call chain lacking circuit breaking, isolation bulkheads, or aligned deadlines. A degradation in the downstream service inevitably locks caller worker pools.`,
        confidence: "high",
        evidence: [
          `Multiple failure propagation findings identify unbounded call chains.`,
          `Caller timeouts or retries are misaligned with callee response envelopes.`,
        ],
      };
    }

    // 4. Potential Root Cause (2+ converging findings or multi-engine overlap)
    if (findings.length >= 2 && engineSources.size >= 2) {
      return {
        type: "potential-root-cause",
        title: `Architectural Contention on ${nodeLabel}`,
        explanation: `Correlated findings from ${Array.from(engineSources).join(" and ")} indicate that "${nodeLabel}" is a probable contributor to system strain, though further workload tracing is recommended.`,
        confidence: "medium",
        evidence: [
          `${findings.length} findings overlap on component "${nodeLabel}".`,
          `Engines involved: ${Array.from(engineSources).join(", ")}.`,
        ],
      };
    }

    // 5. Single Finding or Pure Proximity: Insufficient Evidence for Root Cause
    return {
      type: "insufficient-evidence",
      title: `Isolated Observation on ${nodeLabel}`,
      explanation: `Finding relates specifically to localized configuration or inspection rules on "${nodeLabel}". Proximity in the graph alone does not establish system-wide causality.`,
      confidence: "low",
      evidence: [
        `Only localized findings detected (${findings.map((f) => f.ruleId).join(", ")}).`,
        `No multi-engine correlation proving upstream or downstream causation.`,
      ],
    };
  }
}
