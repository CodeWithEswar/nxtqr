"use client";

import * as React from "react";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import {
  failureAnalysisEngine,
  type FailureAnalysisReport,
  type FailureFinding,
  type FailureClassification,
  type HealthSeverity,
  type BlastRadiusReport,
} from "@nxtqr/architecture-intelligence";

export function useFailureAnalysis() {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const selectNode = useGraphEditorStore((s) => s.selectNode);
  const selectEdge = useGraphEditorStore((s) => s.selectEdge);

  const [classificationFilter, setClassificationFilter] = React.useState<"all" | FailureClassification>("all");
  const [severityFilter, setSeverityFilter] = React.useState<"all" | HealthSeverity>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeFindingId, setActiveFindingId] = React.useState<string | null>(null);
  const [selectedBlastNodeId, setSelectedBlastNodeId] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState<boolean>(false);

  // Debounced report generation
  const [report, setReport] = React.useState<FailureAnalysisReport>(() =>
    failureAnalysisEngine.analyzeGraph(nodes, edges)
  );

  React.useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const updated = failureAnalysisEngine.analyzeGraph(nodes, edges);
      setReport(updated);
      setIsAnalyzing(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges]);

  // Filtered findings
  const filteredFindings = React.useMemo(() => {
    return report.findings.filter((f) => {
      if (classificationFilter !== "all" && f.classification !== classificationFilter) return false;
      if (severityFilter !== "all" && f.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = f.title.toLowerCase().includes(q);
        const matchesExpl = f.explanation.toLowerCase().includes(q);
        const matchesRule = f.ruleId.toLowerCase().includes(q);
        return matchesTitle || matchesExpl || matchesRule;
      }
      return true;
    });
  }, [report, classificationFilter, severityFilter, searchQuery]);

  // Selected Blast Radius Profile
  const activeBlastProfile: BlastRadiusReport | null = React.useMemo(() => {
    if (!selectedBlastNodeId) {
      // Default to first cut-vertex or first node with findings
      const firstSPOF = report.findings.find((f) => f.affectedNodeIds.length > 0);
      const targetId = firstSPOF ? firstSPOF.affectedNodeIds[0] : nodes[0]?.id;
      if (!targetId) return null;
      return report.blastRadiusProfiles[targetId] || null;
    }
    return report.blastRadiusProfiles[selectedBlastNodeId] || null;
  }, [selectedBlastNodeId, report, nodes]);

  const focusFinding = React.useCallback(
    (finding: FailureFinding) => {
      setActiveFindingId(finding.id);

      if (finding.affectedEdgeIds.length > 0) {
        selectEdge(finding.affectedEdgeIds[0]);
      } else if (finding.affectedNodeIds.length > 0) {
        selectNode(finding.affectedNodeIds[0]);
        setSelectedBlastNodeId(finding.affectedNodeIds[0]);
      }
    },
    [selectNode, selectEdge]
  );

  const reanalyze = React.useCallback(() => {
    failureAnalysisEngine.reset();
    const updated = failureAnalysisEngine.analyzeGraph(nodes, edges);
    setReport(updated);
  }, [nodes, edges]);

  return {
    report,
    findings: filteredFindings,
    rawFindings: report.findings,
    classificationFilter,
    setClassificationFilter,
    severityFilter,
    setSeverityFilter,
    searchQuery,
    setSearchQuery,
    activeFindingId,
    setActiveFindingId,
    selectedBlastNodeId,
    setSelectedBlastNodeId,
    activeBlastProfile,
    focusFinding,
    reanalyze,
    isAnalyzing,
  };
}
