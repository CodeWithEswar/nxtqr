"use client";

import React from "react";
import type { ArchitectureReport, ReportSection } from "@nxtqr/architecture-intelligence";

interface ReportPreviewProps {
  report: ArchitectureReport;
  activeSectionId: string | null;
}

export function ReportPreview({ report, activeSectionId }: ReportPreviewProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[#000000] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Document Header */}
        <header className="border-b border-[#262626] pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#B5B5B5]">
              {report.status.toUpperCase()}
            </span>
            <span className="text-[11px] font-mono text-[#858585]">
              v{report.versionNumber} • Rev {report.graphRevision}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">{report.title}</h1>
          {report.subtitle && <p className="text-sm text-[#858585] mb-4">{report.subtitle}</p>}

          <div className="flex flex-wrap gap-4 text-xs font-mono text-[#858585] pt-3 border-t border-[#1A1A1A]">
            <div>
              Audience: <strong className="text-[#B5B5B5] font-normal">{report.audience}</strong>
            </div>
            <div>
              Generated: <strong className="text-[#B5B5B5] font-normal">{report.generatedAt.split("T")[0]}</strong>
            </div>
            <div>
              Author: <strong className="text-[#B5B5B5] font-normal">{report.author}</strong>
            </div>
            <div>
              Evidence Citations:{" "}
              <strong className="text-[#B5B5B5] font-normal">{report.evidence.length} items</strong>
            </div>
          </div>
        </header>

        {/* Sections */}
        <div className="space-y-6">
          {report.sections
            .filter((s) => s.isEnabled)
            .map((section) => (
              <SectionRenderer
                key={section.id}
                section={section}
                isActive={activeSectionId === section.id}
              />
            ))}
        </div>

        {/* Evidence Appendix */}
        {report.evidence.length > 0 && (
          <section className="mt-12 pt-8 border-t border-[#262626]">
            <h3 className="text-base font-semibold text-white mb-2">Evidence Appendix & Traceability</h3>
            <p className="text-xs text-[#858585] mb-4">
              All findings and metrics in this report are mathematically grounded and derived from verified
              architecture intelligence models.
            </p>
            <div className="rounded-md border border-[#262626] bg-[#080808] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D0D0D] border-b border-[#262626] text-[#858585] font-mono">
                  <tr>
                    <th className="py-2 px-3 font-medium">Ref ID</th>
                    <th className="py-2 px-3 font-medium">Source Engine</th>
                    <th className="py-2 px-3 font-medium">Kind</th>
                    <th className="py-2 px-3 font-medium">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {report.evidence.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#0D0D0D]">
                      <td className="py-2 px-3 font-mono text-[11px] text-[#858585]">{ev.id}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#B5B5B5]">{ev.sourceEngine}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#858585]">
                          {ev.kind}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#B5B5B5]">{ev.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function SectionRenderer({ section, isActive }: { section: ReportSection; isActive: boolean }) {
  return (
    <article
      id={section.id}
      className={`rounded-md border p-6 transition-colors ${
        isActive ? "border-[#404040] bg-[#0A0A0A]" : "border-[#262626] bg-[#080808]"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-white">{section.title}</h2>
        <span className="text-[10px] font-mono text-[#858585] uppercase tracking-wider">
          {section.kind}
        </span>
      </div>

      {section.description && <p className="text-xs text-[#858585] italic mb-4">{section.description}</p>}

      {/* Dynamic Section Content */}
      <div className="text-xs text-[#B5B5B5]">
        {section.kind === "overview" && (
          <div className="space-y-4">
            <div>
              <span className="block font-medium text-white mb-1">Primary Purpose</span>
              <p>{section.content.primaryPurpose}</p>
            </div>
            <div>
              <span className="block font-medium text-white mb-1">Subsystems</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {section.content.subsystems.map((sub, idx) => (
                  <div key={idx} className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    <div className="font-medium text-white">{sub.name}</div>
                    <div className="text-[11px] text-[#858585] mt-1">{sub.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section.kind === "diagram" && (
          <div className="space-y-2">
            <div
              className="w-full bg-[#0D0D0D] rounded-md border border-[#262626] p-4 flex items-center justify-center overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: section.content.svgContent }}
            />
            <div className="flex items-center justify-between text-[11px] text-[#858585] font-mono">
              <span>Scope: {section.content.scope}</span>
              <span>
                {section.content.nodeCount} nodes • {section.content.edgeCount} edges
              </span>
            </div>
          </div>
        )}

        {section.kind === "components" && (
          <div className="rounded-md border border-[#1A1A1A] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D0D0D] border-b border-[#1A1A1A] text-[#858585] font-mono">
                <tr>
                  <th className="py-2 px-3">Component</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3 text-center">Replicas</th>
                  <th className="py-2 px-3">Tech</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]">
                {section.content.components.map((comp) => (
                  <tr key={comp.id} className="hover:bg-[#0D0D0D]">
                    <td className="py-2 px-3 font-medium text-white">{comp.label}</td>
                    <td className="py-2 px-3 font-mono text-[11px]">{comp.type}</td>
                    <td className="py-2 px-3">{comp.category}</td>
                    <td className="py-2 px-3 text-center font-mono">{comp.replicas}</td>
                    <td className="py-2 px-3">{comp.technology || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section.kind === "dependencies" && (
          <div className="rounded-md border border-[#1A1A1A] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D0D0D] border-b border-[#1A1A1A] text-[#858585] font-mono">
                <tr>
                  <th className="py-2 px-3">Source</th>
                  <th className="py-2 px-3">Target</th>
                  <th className="py-2 px-3">Protocol</th>
                  <th className="py-2 px-3">Behavior</th>
                  <th className="py-2 px-3">Criticality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]">
                {section.content.dependencies.map((dep) => (
                  <tr key={dep.id} className="hover:bg-[#0D0D0D]">
                    <td className="py-2 px-3 text-white">{dep.sourceLabel}</td>
                    <td className="py-2 px-3 text-white">{dep.targetLabel}</td>
                    <td className="py-2 px-3 font-mono text-[11px]">{dep.protocol || "TCP"}</td>
                    <td className="py-2 px-3">{dep.failureBehavior || "blocks_caller"}</td>
                    <td className="py-2 px-3 font-mono text-[11px]">{dep.criticality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section.kind === "health" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
              <div className="text-3xl font-bold font-mono text-white">
                {section.content.overallScore}
                <span className="text-xs font-normal text-[#858585]">/100</span>
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-[#858585]">Assessment Status</div>
                <div className="text-sm font-semibold text-white">{section.content.status.toUpperCase()}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {Object.entries(section.content.pillarScores).map(([pillar, score]) => (
                <div key={pillar} className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-center">
                  <div className="text-[10px] font-mono text-[#858585] uppercase">{pillar}</div>
                  <div className="text-lg font-bold font-mono text-white mt-1">{score}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section.kind === "cost" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                <div className="text-xs text-[#858585]">Monthly Estimate</div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {section.content.totalMonthlyCost}
                </div>
              </div>
              <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                <div className="text-xs text-[#858585]">Annualized Cost</div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {section.content.totalAnnualCost}
                </div>
              </div>
            </div>
            {section.content.topSavingsOpportunities.length > 0 && (
              <div>
                <span className="block font-medium text-white mb-2">Top Cost Optimization Opportunities</span>
                <div className="space-y-2">
                  {section.content.topSavingsOpportunities.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-between"
                    >
                      <span>{opt.title}</span>
                      <span className="font-mono text-white font-medium">{opt.estimatedMonthlySavings}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {section.kind === "recommendations" && (
          <div className="space-y-3">
            {section.content.items.map((rec) => (
              <div key={rec.id} className="p-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-white">
                    {rec.priority.toUpperCase()}
                  </span>
                  <span className="font-medium text-white">{rec.title}</span>
                </div>
                <p className="text-xs text-[#858585] mt-2">{rec.summary}</p>
              </div>
            ))}
          </div>
        )}

        {section.kind === "adrs" && (
          <div className="space-y-3">
            {section.content.adrs.length === 0 ? (
              <p className="text-xs text-[#858585]">No architecture decision records logged for this system yet.</p>
            ) : (
              section.content.adrs.map((adr) => (
                <div key={adr.id} className="p-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      ADR-{String(adr.decisionNumber).padStart(4, "0")}: {adr.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#B5B5B5]">
                      {adr.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-[#858585]">
                    <span className="font-medium text-[#B5B5B5]">Context:</span> {adr.context}
                  </div>
                  <div className="text-xs text-[#858585]">
                    <span className="font-medium text-[#B5B5B5]">Decision:</span> {adr.decision}
                  </div>
                  <div className="text-xs text-[#858585]">
                    <span className="font-medium text-[#B5B5B5]">Consequences:</span>{" "}
                    {adr.consequences.positive.join("; ")}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {section.kind === "text" && (
          <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] whitespace-pre-wrap font-mono text-xs text-[#B5B5B5]">
            {section.content.markdownContent}
          </div>
        )}
      </div>
    </article>
  );
}
