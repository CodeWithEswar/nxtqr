"use client";

import * as React from "react";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import {
  architectureValidationEngine,
  type GraphValidationResult,
  type ValidationFinding,
  type ValidationSeverity,
  type ValidationCategory,
  type ConnectionCandidate,
  type ConnectionValidationResult,
} from "@nxtqr/architecture-validation";

export function useArchitectureValidation() {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const selectNode = useGraphEditorStore((s) => s.selectNode);
  const selectEdge = useGraphEditorStore((s) => s.selectEdge);

  const [severityFilter, setSeverityFilter] = React.useState<"all" | ValidationSeverity>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<"all" | ValidationCategory>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeFindingId, setActiveFindingId] = React.useState<string | null>(null);
  const [dismissedFindingIds, setDismissedFindingIds] = React.useState<Set<string>>(new Set());

  // Run graph validation
  const validationResult: GraphValidationResult = React.useMemo(() => {
    return architectureValidationEngine.validateGraph(nodes, edges);
  }, [nodes, edges]);

  // Filtered findings
  const filteredFindings = React.useMemo(() => {
    return validationResult.findings.filter((f) => {
      if (dismissedFindingIds.has(f.id)) return false;
      if (severityFilter !== "all" && f.severity !== severityFilter) return false;
      if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = f.title.toLowerCase().includes(q);
        const matchesMsg = f.message.toLowerCase().includes(q);
        const matchesRule = f.ruleId.toLowerCase().includes(q);
        return matchesTitle || matchesMsg || matchesRule;
      }
      return true;
    });
  }, [validationResult, severityFilter, categoryFilter, searchQuery, dismissedFindingIds]);

  const focusFinding = React.useCallback(
    (finding: ValidationFinding) => {
      setActiveFindingId(finding.id);

      if (finding.edgeId) {
        selectEdge(finding.edgeId);
      } else if (finding.targetNodeId) {
        selectNode(finding.targetNodeId);
      } else if (finding.sourceNodeId) {
        selectNode(finding.sourceNodeId);
      }
    },
    [selectNode, selectEdge],
  );

  const dismissFinding = React.useCallback(
    (findingId: string) => {
      const finding = validationResult.findings.find((f) => f.id === findingId);
      // Hard errors cannot be dismissed per Section 21 of the specification
      if (finding?.severity === "error") return;

      setDismissedFindingIds((prev) => {
        const next = new Set(prev);
        next.add(findingId);
        return next;
      });
    },
    [validationResult],
  );

  const revalidate = React.useCallback(() => {
    architectureValidationEngine.reset();
    setDismissedFindingIds(new Set());
  }, []);

  const validateCandidate = React.useCallback(
    (candidate: ConnectionCandidate): ConnectionValidationResult => {
      return architectureValidationEngine.validateConnection(candidate, nodes, edges);
    },
    [nodes, edges],
  );

  return {
    validationResult,
    findings: filteredFindings,
    rawFindings: validationResult.findings,
    summary: validationResult.summary,
    severityFilter,
    setSeverityFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    activeFindingId,
    setActiveFindingId,
    focusFinding,
    dismissFinding,
    revalidate,
    validateCandidate,
  };
}
