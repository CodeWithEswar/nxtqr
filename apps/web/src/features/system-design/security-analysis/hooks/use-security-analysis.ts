"use client";

import * as React from "react";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import {
  securityAnalysisEngine,
  type SecurityAnalysisReport,
  type SecurityFinding,
  type SecurityCategory,
  type STRIDECategory,
  type SecurityFindingClassification,
  type HealthSeverity,
} from "@nxtqr/architecture-intelligence";

export function useSecurityAnalysis() {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const selectNode = useGraphEditorStore((s) => s.selectNode);
  const selectEdge = useGraphEditorStore((s) => s.selectEdge);

  const [categoryFilter, setCategoryFilter] = React.useState<"all" | SecurityCategory>("all");
  const [severityFilter, setSeverityFilter] = React.useState<"all" | HealthSeverity>("all");
  const [strideFilter, setStrideFilter] = React.useState<"all" | STRIDECategory>("all");
  const [classificationFilter, setClassificationFilter] = React.useState<"all" | SecurityFindingClassification>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeFindingId, setActiveFindingId] = React.useState<string | null>(null);
  const [selectedBoundaryId, setSelectedBoundaryId] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState<boolean>(false);

  // Debounced report generation
  const [report, setReport] = React.useState<SecurityAnalysisReport>(() =>
    securityAnalysisEngine.analyzeGraph(nodes, edges)
  );

  React.useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const updated = securityAnalysisEngine.analyzeGraph(nodes, edges);
      setReport(updated);
      setIsAnalyzing(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges]);

  // Filtered findings
  const filteredFindings = React.useMemo(() => {
    return report.findings.filter((f) => {
      if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
      if (severityFilter !== "all" && f.severity !== severityFilter) return false;
      if (strideFilter !== "all" && f.strideCategory !== strideFilter) return false;
      if (classificationFilter !== "all" && f.classification !== classificationFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = f.title.toLowerCase().includes(q);
        const matchesExpl = f.explanation.toLowerCase().includes(q);
        const matchesRule = f.ruleId.toLowerCase().includes(q);
        return matchesTitle || matchesExpl || matchesRule;
      }
      return true;
    });
  }, [report, categoryFilter, severityFilter, strideFilter, classificationFilter, searchQuery]);

  // Selected boundary summary
  const selectedBoundary = React.useMemo(() => {
    if (!selectedBoundaryId) return null;
    return report.trustBoundaries.find((b) => b.id === selectedBoundaryId) || null;
  }, [report, selectedBoundaryId]);

  // Highlight elements on the canvas
  const highlightFinding = React.useCallback(
    (finding: SecurityFinding | null) => {
      if (!finding) {
        setActiveFindingId(null);
        return;
      }
      setActiveFindingId(finding.id);
      if (finding.affectedNodeIds.length > 0) {
        selectNode(finding.affectedNodeIds[0]);
      } else if (finding.affectedEdgeIds.length > 0) {
        selectEdge(finding.affectedEdgeIds[0]);
      }
    },
    [selectNode, selectEdge]
  );

  return {
    report,
    isAnalyzing,
    findings: filteredFindings,
    rawFindingsCount: report.findings.length,
    activeFindingId,
    selectedBoundaryId,
    selectedBoundary,
    categoryFilter,
    severityFilter,
    strideFilter,
    classificationFilter,
    searchQuery,
    setCategoryFilter,
    setSeverityFilter,
    setStrideFilter,
    setClassificationFilter,
    setSearchQuery,
    setActiveFindingId,
    setSelectedBoundaryId,
    highlightFinding,
    selectNode,
    selectEdge,
  };
}
