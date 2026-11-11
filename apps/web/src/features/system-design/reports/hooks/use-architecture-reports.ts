"use client";

import { useState, useMemo, useCallback } from "react";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import {
  architectureReportEngine,
  reportTemplateRegistry,
  ReportExportCoordinator,
  type ArchitectureReport,
  type ReportAudience,
  type ReportSectionKind,
  type ArchitectureDecisionRecord,
  type ReportExportResult,
  type ReportExportOptions,
} from "@nxtqr/architecture-intelligence";

export interface UseArchitectureReportsOptions {
  projectId: string;
  architectureId: string;
  graphRevision: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  initialTemplateId?: string;
  initialAudience?: ReportAudience;
  initialAdrs?: ArchitectureDecisionRecord[];
}

export function useArchitectureReports({
  projectId,
  architectureId,
  graphRevision,
  nodes,
  edges,
  initialTemplateId = "detailed_technical_architecture",
  initialAudience = "engineering",
  initialAdrs = [],
}: UseArchitectureReportsOptions) {
  const [templateId, setTemplateId] = useState<string>(initialTemplateId);
  const [audience, setAudience] = useState<ReportAudience>(initialAudience);
  const [adrs, setAdrs] = useState<ArchitectureDecisionRecord[]>(initialAdrs);
  const [customTitle, setCustomTitle] = useState<string>("");
  const [enabledSections, setEnabledSections] = useState<ReportSectionKind[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState<boolean>(false);
  const [isAdrModalOpen, setIsAdrModalOpen] = useState<boolean>(false);

  // Available templates
  const allTemplates = useMemo(() => reportTemplateRegistry.getAllTemplates(), []);

  const activeTemplate = useMemo(
    () => reportTemplateRegistry.getTemplate(templateId) || allTemplates[0],
    [templateId, allTemplates]
  );

  // Effective enabled sections
  const effectiveSectionKinds = useMemo(() => {
    return reportTemplateRegistry.resolveSectionKinds(
      templateId,
      enabledSections.length > 0 ? enabledSections : undefined
    );
  }, [templateId, enabledSections]);

  // Generate live report
  const report = useMemo<ArchitectureReport>(() => {
    return architectureReportEngine.generateReport({
      projectId,
      architectureId,
      graphRevision,
      nodes,
      edges,
      templateId,
      audience,
      title: customTitle || activeTemplate.name,
      decisions: adrs,
      enabledSections: effectiveSectionKinds,
    });
  }, [
    projectId,
    architectureId,
    graphRevision,
    nodes,
    edges,
    templateId,
    audience,
    customTitle,
    activeTemplate,
    adrs,
    effectiveSectionKinds,
  ]);

  // Validation
  const validation = useMemo(() => {
    return architectureReportEngine.validateReport(report);
  }, [report]);

  // Toggle section
  const toggleSection = useCallback((kind: ReportSectionKind) => {
    setEnabledSections((prev) => {
      const current = prev.length > 0 ? [...prev] : [...activeTemplate.defaultSectionOrder];
      if (current.includes(kind)) {
        // Only remove if not required
        if (activeTemplate.requiredSections.includes(kind)) {
          return current;
        }
        return current.filter((k) => k !== kind);
      } else {
        return [...current, kind];
      }
    });
  }, [activeTemplate]);

  // Add ADR
  const addAdr = useCallback((newAdr: ArchitectureDecisionRecord) => {
    setAdrs((prev) => [...prev, newAdr]);
  }, []);

  // Export
  const exportDocument = useCallback(
    (options: ReportExportOptions): ReportExportResult => {
      return ReportExportCoordinator.exportReport(report, options);
    },
    [report]
  );

  return {
    report,
    validation,
    allTemplates,
    activeTemplate,
    templateId,
    setTemplateId,
    audience,
    setAudience,
    adrs,
    addAdr,
    customTitle,
    setCustomTitle,
    enabledSections: effectiveSectionKinds,
    toggleSection,
    activeSectionId,
    setActiveSectionId,
    isExportDialogOpen,
    setIsExportDialogOpen,
    isAdrModalOpen,
    setIsAdrModalOpen,
    exportDocument,
  };
}
