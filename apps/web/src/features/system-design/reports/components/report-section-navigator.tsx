"use client";

import React from "react";
import type { ReportSection, ReportSectionKind, ReportTemplate } from "@nxtqr/architecture-intelligence";
import { CheckIcon } from "@nxtqr/icons";

interface ReportSectionNavigatorProps {
  sections: ReportSection[];
  activeTemplate: ReportTemplate;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  onToggleSection: (kind: ReportSectionKind) => void;
}

export function ReportSectionNavigator({
  sections,
  activeTemplate,
  activeSectionId,
  onSelectSection,
  onToggleSection,
}: ReportSectionNavigatorProps) {
  const allSectionKinds: Array<{ kind: ReportSectionKind; label: string }> = [
    { kind: "overview", label: "Executive Overview" },
    { kind: "diagram", label: "Architecture Topology Diagram" },
    { kind: "components", label: "Components & Inventory" },
    { kind: "dependencies", label: "Runtime Dependencies" },
    { kind: "data_flows", label: "Data Flows & Boundaries" },
    { kind: "validation", label: "Structural Validation" },
    { kind: "health", label: "6-Pillar System Health" },
    { kind: "bottlenecks", label: "Bottlenecks & Critical Paths" },
    { kind: "spof", label: "Single Points of Failure" },
    { kind: "security", label: "Security & Threat Posture" },
    { kind: "scalability", label: "Scalability & Elasticity" },
    { kind: "reliability", label: "Reliability & Resilience" },
    { kind: "recommendations", label: "Unified Recommendations" },
    { kind: "comparison", label: "Architecture Comparison" },
    { kind: "capacity", label: "Capacity & Saturation" },
    { kind: "cost", label: "Cost Modeling & Savings" },
    { kind: "adrs", label: "Architecture Decision Records" },
    { kind: "text", label: "Review Notes & Sign-off" },
  ];

  const enabledSet = new Set(sections.map((s) => s.kind));

  return (
    <aside className="w-80 border-r border-[#262626] bg-[#080808] flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 border-b border-[#262626]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs uppercase font-mono tracking-wider text-[#858585]">Report Outline</span>
          <span className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#B5B5B5]">
            {sections.length} active
          </span>
        </div>
        <p className="text-xs text-[#858585]">
          Template: <strong className="text-white font-medium">{activeTemplate.name}</strong>
        </p>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {allSectionKinds.map(({ kind, label }) => {
          const isEnabled = enabledSet.has(kind);
          const isRequired = activeTemplate.requiredSections.includes(kind);
          const matchedSection = sections.find((s) => s.kind === kind);
          const isSelected = matchedSection ? activeSectionId === matchedSection.id : false;

          return (
            <div
              key={kind}
              onClick={() => {
                if (matchedSection) {
                  onSelectSection(matchedSection.id);
                }
              }}
              className={`group flex items-center justify-between px-3 py-2 rounded-md text-xs cursor-pointer border transition-colors ${
                isSelected
                  ? "bg-[#1A1A1A] border-[#404040] text-white"
                  : "bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#333333] text-[#B5B5B5] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <button
                  type="button"
                  title={isRequired ? "Required by template" : isEnabled ? "Disable section" : "Enable section"}
                  disabled={isRequired}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSection(kind);
                  }}
                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                    isEnabled
                      ? isRequired
                        ? "bg-[#262626] border-[#333333] text-[#858585] cursor-not-allowed"
                        : "bg-[#1A1A1A] border-[#333333] text-white hover:bg-[#262626]"
                      : "bg-[#080808] border-[#262626] text-transparent hover:border-[#404040]"
                  }`}
                >
                  {isEnabled && <CheckIcon size={12} />}
                </button>
                <span className={`truncate ${!isEnabled ? "text-[#666666] line-through" : ""}`}>
                  {label}
                </span>
              </div>

              {isRequired && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-[#141414] border border-[#262626] text-[#858585]">
                  REQ
                </span>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
