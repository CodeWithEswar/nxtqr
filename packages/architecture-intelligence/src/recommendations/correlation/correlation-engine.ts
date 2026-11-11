import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  UnifiedFinding,
  CorrelatedFindingGroup,
  AnalysisEngineSource,
} from "../contracts/recommendations.types";
import { RootCauseAnalyzer } from "./root-cause-analyzer";

export class CorrelationEngine {
  public static correlateFindings(
    findings: UnifiedFinding[],
    nodes: BaseNode[],
    edges: BaseEdge[]
  ): CorrelatedFindingGroup[] {
    if (findings.length === 0) return [];

    // Map node/edge IDs to findings
    const nodeFindingsMap = new Map<string, UnifiedFinding[]>();
    const edgeFindingsMap = new Map<string, UnifiedFinding[]>();
    const unassociatedFindings: UnifiedFinding[] = [];

    for (const finding of findings) {
      let associated = false;
      for (const nId of finding.affectedNodeIds) {
        if (!nodeFindingsMap.has(nId)) nodeFindingsMap.set(nId, []);
        nodeFindingsMap.get(nId)!.push(finding);
        associated = true;
      }
      for (const eId of finding.affectedEdgeIds) {
        if (!edgeFindingsMap.has(eId)) edgeFindingsMap.set(eId, []);
        edgeFindingsMap.get(eId)!.push(finding);
        associated = true;
      }
      if (!associated) {
        unassociatedFindings.push(finding);
      }
    }

    const processedFindingIds = new Set<string>();
    const groups: CorrelatedFindingGroup[] = [];

    // 1. Group by Nodes with multiple overlapping findings (with deterministic tie-breaker)
    const sortedNodeEntries = Array.from(nodeFindingsMap.entries()).sort(
      (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
    );

    for (const [nodeId, nodeFindings] of sortedNodeEntries) {
      const activeFindings = nodeFindings.filter((f) => !processedFindingIds.has(f.id));
      if (activeFindings.length === 0) continue;

      // Collect all connected findings across shared affected nodes
      const groupFindings = [...activeFindings];
      for (const f of activeFindings) {
        processedFindingIds.add(f.id);
      }

      const sharedNodes = new Set<string>([nodeId]);
      for (const f of groupFindings) {
        for (const n of f.affectedNodeIds) sharedNodes.add(n);
      }

      const sources = Array.from(
        new Set(groupFindings.map((f) => f.sourceEngine))
      ) as AnalysisEngineSource[];

      const rootCause = RootCauseAnalyzer.evaluateRootCause(
        nodeId,
        groupFindings,
        nodes,
        edges
      );

      groups.push({
        id: `corr_group_node_${nodeId}`,
        primaryNodeId: nodeId,
        sharedComponentIds: Array.from(sharedNodes),
        sourceEngines: sources,
        findings: groupFindings,
        rootCauseCandidate: rootCause,
      });
    }

    // 2. Group by remaining Edges
    for (const [edgeId, edgeFindings] of edgeFindingsMap.entries()) {
      const activeFindings = edgeFindings.filter((f) => !processedFindingIds.has(f.id));
      if (activeFindings.length === 0) continue;

      for (const f of activeFindings) {
        processedFindingIds.add(f.id);
      }

      const edge = edges.find((e) => e.id === edgeId);
      const sharedNodes = edge ? [edge.source, edge.target] : [];
      const sources = Array.from(
        new Set(activeFindings.map((f) => f.sourceEngine))
      ) as AnalysisEngineSource[];

      const rootCause = RootCauseAnalyzer.evaluateRootCause(
        edge?.source,
        activeFindings,
        nodes,
        edges
      );

      groups.push({
        id: `corr_group_edge_${edgeId}`,
        primaryEdgeId: edgeId,
        primaryNodeId: edge?.source,
        sharedComponentIds: sharedNodes,
        sourceEngines: sources,
        findings: activeFindings,
        rootCauseCandidate: rootCause,
      });
    }

    // 3. Any leftover unassociated findings form individual groups
    for (const f of unassociatedFindings) {
      if (processedFindingIds.has(f.id)) continue;
      processedFindingIds.add(f.id);

      groups.push({
        id: `corr_group_isolated_${f.id}`,
        sharedComponentIds: f.affectedNodeIds,
        sourceEngines: [f.sourceEngine],
        findings: [f],
        rootCauseCandidate: {
          type: "insufficient-evidence",
          title: `Standalone Finding: ${f.title}`,
          explanation: f.explanation,
          confidence: f.confidence,
          evidence: f.evidence.map((e) => e.description),
        },
      });
    }

    return groups;
  }
}
