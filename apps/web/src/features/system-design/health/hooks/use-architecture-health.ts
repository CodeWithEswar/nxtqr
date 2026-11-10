"use client";

import * as React from "react";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import {
  architectureHealthEngine,
  type HealthAssessmentReport,
  type HealthDimension,
  type HealthSeverity,
  type HealthFinding,
} from "@nxtqr/architecture-intelligence";

export function useArchitectureHealth() {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const selectNode = useGraphEditorStore((s) => s.selectNode);
  const selectEdge = useGraphEditorStore((s) => s.selectEdge);

  const [dimensionFilter, setDimensionFilter] = React.useState<"all" | HealthDimension>("all");
  const [severityFilter, setSeverityFilter] = React.useState<"all" | HealthSeverity>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeFindingId, setActiveFindingId] = React.useState<string | null>(null);
  const [isAssessing, setIsAssessing] = React.useState<boolean>(false);

  // Debounced assessment calculation
  const [report, setReport] = React.useState<HealthAssessmentReport>(() =>
    architectureHealthEngine.assessGraph(nodes, edges)
  );

  React.useEffect(() => {
    setIsAssessing(true);
    const timer = setTimeout(() => {
      const updated = architectureHealthEngine.assessGraph(nodes, edges);
      setReport(updated);
      setIsAssessing(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges]);

  // Filtered findings
  const filteredFindings = React.useMemo(() => {
    return report.allFindings.filter((f) => {
      if (dimensionFilter !== "all" && f.dimension !== dimensionFilter) return false;
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
  }, [report, dimensionFilter, severityFilter, searchQuery]);

  const focusFinding = React.useCallback(
    (finding: HealthFinding) => {
      setActiveFindingId(finding.id);

      if (finding.affectedEdgeIds.length > 0) {
        selectEdge(finding.affectedEdgeIds[0]);
      } else if (finding.affectedNodeIds.length > 0) {
        selectNode(finding.affectedNodeIds[0]);
      }
    },
    [selectNode, selectEdge]
  );

  const reassess = React.useCallback(() => {
    architectureHealthEngine.reset();
    const updated = architectureHealthEngine.assessGraph(nodes, edges);
    setReport(updated);
  }, [nodes, edges]);

  return {
    report,
    findings: filteredFindings,
    rawFindings: report.allFindings,
    dimensionFilter,
    setDimensionFilter,
    severityFilter,
    setSeverityFilter,
    searchQuery,
    setSearchQuery,
    activeFindingId,
    setActiveFindingId,
    focusFinding,
    reassess,
    isAssessing,
  };
}
