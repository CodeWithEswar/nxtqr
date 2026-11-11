"use client";

import React from "react";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type { ReportAudience } from "@nxtqr/architecture-intelligence";
import { useArchitectureReports } from "../hooks/use-architecture-reports";
import { ReportSectionNavigator } from "./report-section-navigator";
import { ReportPreview } from "./report-preview";
import { ExportDialog } from "./export-dialog";
import { ADREditorModal } from "./adr-editor-modal";
import { PlusIcon, AlertCircleIcon, CheckCircleIcon } from "@nxtqr/icons";

interface ReportWorkspaceProps {
  projectId: string;
  architectureId: string;
  graphRevision: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
}

export function ReportWorkspace({
  projectId,
  architectureId,
  graphRevision,
  nodes,
  edges,
}: ReportWorkspaceProps) {
  const {
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
    toggleSection,
    activeSectionId,
    setActiveSectionId,
    isExportDialogOpen,
    setIsExportDialogOpen,
    isAdrModalOpen,
    setIsAdrModalOpen,
    exportDocument,
  } = useArchitectureReports({
    projectId,
    architectureId,
    graphRevision,
    nodes,
    edges,
  });

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-white overflow-hidden select-none">
      {/* Top Studio Toolbar */}
      <header className="h-14 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-[#858585]">Report Studio</span>
            <span className="text-xs text-[#404040]">/</span>
            <span className="text-xs font-semibold text-white truncate max-w-[200px]">
              {report.title}
            </span>
          </div>

          {/* Template Picker */}
          <div className="flex items-center gap-2 border-l border-[#262626] pl-4">
            <label className="text-[11px] font-mono text-[#858585]">Template:</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="bg-[#141414] border border-[#262626] rounded-md py-1 px-2.5 text-xs text-white focus:outline-none focus:border-[#404040]"
            >
              {allTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Audience Picker */}
          <div className="flex items-center gap-2 border-l border-[#262626] pl-4">
            <label className="text-[11px] font-mono text-[#858585]">Audience:</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as ReportAudience)}
              className="bg-[#141414] border border-[#262626] rounded-md py-1 px-2.5 text-xs text-white focus:outline-none focus:border-[#404040]"
            >
              <option value="engineering">Engineering</option>
              <option value="technical_leadership">Technical Leadership</option>
              <option value="architecture_review">Architecture Review</option>
              <option value="security_review">Security Review</option>
              <option value="operations">Operations & SRE</option>
              <option value="executive_overview">Executive Overview</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Validation Status */}
          <div
            title={`${validation.issues.length} validation issues`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${
              validation.isValid
                ? "bg-[#0D0D0D] border-[#262626] text-[#B5B5B5]"
                : "bg-[#1A0A0A] border-[#551A1A] text-[#FF6666]"
            }`}
          >
            {validation.isValid ? (
              <CheckCircleIcon size={14} />
            ) : (
              <AlertCircleIcon size={14} />
            )}
            <span>{validation.isValid ? "Valid Report" : "Validation Warnings"}</span>
          </div>

          {/* Log ADR */}
          <button
            type="button"
            onClick={() => setIsAdrModalOpen(true)}
            className="flex items-center gap-1.5 py-1 px-3 rounded-md bg-[#141414] border border-[#262626] hover:border-[#404040] text-xs text-[#B5B5B5] hover:text-white transition-colors"
          >
            <PlusIcon size={14} />
            <span>Log ADR</span>
          </button>

          {/* Export Report */}
          <button
            type="button"
            onClick={() => setIsExportDialogOpen(true)}
            className="flex items-center gap-1.5 py-1 px-4 rounded-md bg-[#1A1A1A] border border-[#404040] hover:bg-[#262626] text-xs font-medium text-white transition-colors"
          >
            <span>Export Document</span>
          </button>
        </div>
      </header>

      {/* Main Content (3-Pane Workspace) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Outline / Section Navigator */}
        <ReportSectionNavigator
          sections={report.sections}
          activeTemplate={activeTemplate}
          activeSectionId={activeSectionId}
          onSelectSection={(secId) => {
            setActiveSectionId(secId);
            const el = document.getElementById(secId);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          onToggleSection={toggleSection}
        />

        {/* Center: Live Paginated / Scrolling Preview */}
        <ReportPreview report={report} activeSectionId={activeSectionId} />

        {/* Right: Inspector / Context Pane */}
        <aside className="w-72 border-l border-[#262626] bg-[#080808] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 text-xs text-[#B5B5B5]">
          <div>
            <span className="block text-[11px] font-mono text-[#858585] uppercase tracking-wider mb-1">
              Template Scope
            </span>
            <p className="text-xs text-[#858585]">{activeTemplate.description}</p>
          </div>

          <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-2">
            <span className="block font-medium text-white">Target Audience Context</span>
            <p className="text-[11px] text-[#858585]">
              Adapts technical detail density, explanation depth, and default visible sections without
              concealing architectural trade-offs or security findings.
            </p>
          </div>

          <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-2">
            <span className="block font-medium text-white">Architecture Decisions</span>
            <p className="text-[11px] text-[#858585]">
              {adrs.length} recorded decision(s). Formal records document immutable context and structural
              consequences.
            </p>
          </div>

          {validation.issues.length > 0 && (
            <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-2">
              <span className="block font-medium text-white">Validation Warnings</span>
              <ul className="space-y-1 text-[11px] text-[#858585]">
                {validation.issues.slice(0, 4).map((issue, idx) => (
                  <li key={idx} className="truncate">
                    • {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        report={report}
        onExport={exportDocument}
      />

      <ADREditorModal
        isOpen={isAdrModalOpen}
        onClose={() => setIsAdrModalOpen(false)}
        onSave={addAdr}
        nextDecisionNumber={adrs.length + 1}
      />
    </div>
  );
}
