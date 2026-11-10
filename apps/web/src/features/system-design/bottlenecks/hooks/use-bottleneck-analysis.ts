"use client";

import * as React from "react";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import {
  bottleneckEngine,
  DEFAULT_WORKLOAD_SCENARIOS,
  type BottleneckReport,
  type WorkloadScenario,
  type BottleneckFinding,
  type BottleneckType,
} from "@nxtqr/architecture-intelligence";

export function useBottleneckAnalysis() {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const selectNode = useGraphEditorStore((s) => s.selectNode);
  const selectEdge = useGraphEditorStore((s) => s.selectEdge);

  const [selectedScenarioKey, setSelectedScenarioKey] = React.useState<string>("normal_traffic");
  const [activeScenario, setActiveScenario] = React.useState<WorkloadScenario>(
    DEFAULT_WORKLOAD_SCENARIOS.normal_traffic
  );

  const [typeFilter, setTypeFilter] = React.useState<"all" | BottleneckType>("all");
  const [severityFilter, setSeverityFilter] = React.useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeFindingId, setActiveFindingId] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState<boolean>(false);

  // Switch scenario preset
  const selectScenario = React.useCallback((key: string) => {
    setSelectedScenarioKey(key);
    const preset = DEFAULT_WORKLOAD_SCENARIOS[key];
    if (preset) {
      setActiveScenario(JSON.parse(JSON.stringify(preset)));
    }
  }, []);

  // Update scenario parameter
  const updateScenarioParameter = React.useCallback(
    (paramKey: keyof WorkloadScenario["parameters"], value: any) => {
      setActiveScenario((prev) => ({
        ...prev,
        parameters: {
          ...prev.parameters,
          [paramKey]: value,
        },
      }));
    },
    []
  );

  // Debounced analysis report calculation
  const [report, setReport] = React.useState<BottleneckReport>(() =>
    bottleneckEngine.analyzeGraph(nodes, edges, activeScenario)
  );

  React.useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const updated = bottleneckEngine.analyzeGraph(nodes, edges, activeScenario);
      setReport(updated);
      setIsAnalyzing(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges, activeScenario]);

  // Filtered findings
  const filteredFindings = React.useMemo(() => {
    return report.findings.filter((f) => {
      if (typeFilter !== "all" && f.bottleneckType !== typeFilter) return false;
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
  }, [report, typeFilter, severityFilter, searchQuery]);

  const focusFinding = React.useCallback(
    (finding: BottleneckFinding) => {
      setActiveFindingId(finding.id);

      if (finding.affectedEdgeIds.length > 0) {
        selectEdge(finding.affectedEdgeIds[0]);
      } else if (finding.affectedNodeIds.length > 0) {
        selectNode(finding.affectedNodeIds[0]);
      }
    },
    [selectNode, selectEdge]
  );

  const reanalyze = React.useCallback(() => {
    bottleneckEngine.reset();
    const updated = bottleneckEngine.analyzeGraph(nodes, edges, activeScenario);
    setReport(updated);
  }, [nodes, edges, activeScenario]);

  return {
    report,
    findings: filteredFindings,
    rawFindings: report.findings,
    selectedScenarioKey,
    activeScenario,
    selectScenario,
    updateScenarioParameter,
    typeFilter,
    setTypeFilter,
    severityFilter,
    setSeverityFilter,
    searchQuery,
    setSearchQuery,
    activeFindingId,
    setActiveFindingId,
    focusFinding,
    reanalyze,
    isAnalyzing,
  };
}
