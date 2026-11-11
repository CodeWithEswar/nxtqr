import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type { ArchitectureDecisionRecord } from "../contracts/adr.types";
import type { EvidenceReference } from "../contracts/report.types";
import type { ReportAnalysisContext } from "../contracts/engine.types";

export class EvidenceCollector {
  public static collectEvidence(
    nodes: BaseNode[],
    edges: BaseEdge[],
    context?: ReportAnalysisContext,
    adrs?: ArchitectureDecisionRecord[]
  ): EvidenceReference[] {
    const evidenceList: EvidenceReference[] = [];
    const seenIds = new Set<string>();

    const addRef = (ref: EvidenceReference) => {
      if (!seenIds.has(ref.id)) {
        seenIds.add(ref.id);
        evidenceList.push(ref);
      }
    };

    // 1. Nodes evidence
    for (const node of nodes) {
      const nodeData = (node.data || {}) as Record<string, any>;
      const label = (nodeData.label as string) || node.id;
      addRef({
        id: `ev-node-${node.id}`,
        kind: "node",
        title: `Component: ${label}`,
        sourceEngine: "topology",
        summary: `Architecture node of type '${node.type || "default"}' with ${nodeData.category || "service"} role.`,
        elementId: node.id,
      });
    }

    // 2. Edges evidence
    for (const edge of edges) {
      const edgeData = (edge.data || {}) as Record<string, any>;
      const protocol = edgeData.protocol || "TCP";
      addRef({
        id: `ev-edge-${edge.id}`,
        kind: "edge",
        title: `Connection: ${edge.source} -> ${edge.target}`,
        sourceEngine: "topology",
        summary: `Dependency edge using ${protocol} protocol.`,
        elementId: edge.id,
      });
    }

    // 3. Health Assessment evidence
    if (context?.health) {
      for (const finding of context.health.allFindings || []) {
        addRef({
          id: `ev-health-${finding.id}`,
          kind: "finding",
          title: `Health Finding: ${finding.ruleId}`,
          sourceEngine: "health_analysis",
          summary: finding.explanation || "Health assessment finding",
          severity: (finding.severity as any) || "medium",
          elementId: finding.affectedNodeIds?.[0] || finding.affectedEdgeIds?.[0],
        });
      }
    }

    // 4. Bottleneck evidence
    if (context?.bottlenecks) {
      for (const b of context.bottlenecks.findings || []) {
        const nodeId = b.affectedNodeIds?.[0] || b.id;
        addRef({
          id: `ev-bottleneck-${b.id}`,
          kind: "finding",
          title: `Bottleneck: ${b.title || nodeId}`,
          sourceEngine: "bottleneck_detection",
          summary: b.explanation || `Bottleneck detected at ${nodeId} (${b.bottleneckType})`,
          severity: b.severity as any,
          elementId: nodeId,
        });
      }
    }

    // 5. SPOF evidence
    if (context?.spof) {
      for (const sp of context.spof.findings || []) {
        addRef({
          id: `ev-spof-${sp.id}`,
          kind: "finding",
          title: `Failure Risk: ${sp.title}`,
          sourceEngine: "failure_analysis",
          summary: sp.explanation,
          severity: sp.severity || "high",
          elementId: sp.affectedNodeIds?.[0],
        });
      }
    }

    // 6. Security Analysis evidence
    if (context?.security) {
      for (const f of context.security.findings || []) {
        addRef({
          id: `ev-sec-${f.id}`,
          kind: "finding",
          title: `Security: ${f.title}`,
          sourceEngine: "security_analysis",
          summary: f.explanation || "Security posture finding",
          severity: f.severity as any,
          elementId: f.affectedNodeIds?.[0] || f.affectedEdgeIds?.[0],
        });
      }
    }

    // 7. Reliability evidence
    if (context?.reliability) {
      for (const f of context.reliability.findings || []) {
        addRef({
          id: `ev-rel-${f.id}`,
          kind: "finding",
          title: `Reliability: ${f.title}`,
          sourceEngine: "reliability_analysis",
          summary: f.explanation || `Reliability finding in ${f.affectedNodeIds?.[0] || f.id}`,
          severity: f.severity as any,
          elementId: f.affectedNodeIds?.[0],
        });
      }
    }

    // 8. Scalability evidence
    if (context?.scalability) {
      for (const r of context.scalability.recommendations || []) {
        addRef({
          id: `ev-scale-${r.id}`,
          kind: "recommendation",
          title: `Scalability: ${r.title}`,
          sourceEngine: "scalability_analysis",
          summary: r.summary || "Scalability bottleneck recommendation",
          severity: "medium",
          elementId: r.affectedNodeIds?.[0],
        });
      }
    }

    // 9. Unified Recommendations evidence
    if (context?.recommendations) {
      for (const rec of context.recommendations.recommendations || []) {
        addRef({
          id: `ev-rec-${rec.id}`,
          kind: "recommendation",
          title: `Recommendation: ${rec.title}`,
          sourceEngine: "recommendation_engine",
          summary: rec.summary || "Unified recommendation",
          severity: rec.priority as any,
          elementId: rec.affectedNodeIds?.[0],
        });
      }
    }

    // 10. Comparison evidence
    if (context?.comparison) {
      for (const ch of context.comparison.changes || []) {
        const targetId = ch.candidateId || ch.baselineId || ch.id;
        addRef({
          id: `ev-comp-${ch.id}`,
          kind: "comparison",
          title: `Diff: ${ch.label || targetId}`,
          sourceEngine: "architecture_comparison",
          summary: `${ch.kind.toUpperCase()}: ${ch.changedFields.join(", ") || targetId}`,
          elementId: targetId,
        });
      }
    }

    // 11. Capacity evidence
    if (context?.capacity) {
      for (const sat of context.capacity.findings || []) {
        addRef({
          id: `ev-cap-${sat.id}`,
          kind: "capacity",
          title: `Capacity: ${sat.title}`,
          sourceEngine: "capacity_planning",
          summary: `${sat.explanation} (Projected: ${sat.projectedDemandRps} RPS at ${sat.forecastIntervalLabel}).`,
          severity: sat.severity,
          elementId: sat.affectedNodeId,
        });
      }
    }

    // 12. Cost evidence
    if (context?.costOptimizations) {
      for (const opt of context.costOptimizations) {
        addRef({
          id: `ev-cost-${opt.id}`,
          kind: "cost",
          title: `Cost Optimization: ${opt.title}`,
          sourceEngine: "cost_estimation",
          summary: `${opt.summary} (Potential savings: $${opt.estimatedMonthlySavings}/mo)`,
          severity: "info",
          elementId: opt.affectedNodeIds?.[0],
        });
      }
    }

    // 13. Architecture Decision Records evidence
    if (adrs) {
      for (const adr of adrs) {
        addRef({
          id: `ev-adr-${adr.id}`,
          kind: "adr",
          title: `ADR-${String(adr.decisionNumber).padStart(4, "0")}: ${adr.title}`,
          sourceEngine: "adr_registry",
          summary: `[${adr.status.toUpperCase()}] ${adr.decision}`,
        });
      }
    }

    return evidenceList;
  }
}
