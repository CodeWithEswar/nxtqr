"use client";

/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Privacy Findings List Component
 */

import React, { useState } from "react";
import type { PrivacyFinding, CrossBorderTransferFinding } from "@nxtqr/architecture-intelligence";
import { FilterIcon } from "@nxtqr/icons";

interface PrivacyFindingsProps {
  findings: PrivacyFinding[];
  transfers: CrossBorderTransferFinding[];
}

export function PrivacyFindings({ findings, transfers }: PrivacyFindingsProps) {
  const [activeTab, setActiveTab] = useState<"findings" | "transfers">("findings");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredFindings = findings.filter((f) => {
    if (severityFilter === "all") return true;
    return f.severity === severityFilter;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-surface-04 text-foreground border border-border-strong font-bold";
      case "high":
        return "bg-surface-03 text-foreground border border-border-default font-semibold";
      case "medium":
        return "bg-surface-02 text-text-secondary border border-border-subtle";
      default:
        return "bg-surface-01 text-text-muted border border-border-subtle";
    }
  };

  return (
    <div className="bg-surface-01 border border-border-default rounded-md overflow-hidden text-xs">
      {/* Header Tabs */}
      <div className="flex items-center justify-between p-3 border-b border-border-default bg-surface-02">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("findings")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === "findings"
                ? "bg-surface-04 text-foreground border border-border-strong font-semibold"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Privacy & Governance Findings ({findings.length})
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === "transfers"
                ? "bg-surface-04 text-foreground border border-border-strong font-semibold"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Cross-Border & External Transfers ({transfers.length})
          </button>
        </div>

        {activeTab === "findings" && (
          <div className="flex items-center space-x-1.5 text-[11px]">
            <FilterIcon className="w-3 h-3 text-text-muted" />
            {(["all", "critical", "high", "medium"] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded-md capitalize transition-colors ${
                  severityFilter === sev
                    ? "bg-surface-04 text-foreground font-semibold border border-border-strong"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="divide-y divide-border-subtle max-h-72 overflow-y-auto">
        {activeTab === "findings" ? (
          filteredFindings.length === 0 ? (
            <div className="p-4 text-center text-text-muted">
              No privacy findings matching the selected filter.
            </div>
          ) : (
            filteredFindings.map((finding) => (
              <div key={finding.id} className="p-3 space-y-1.5 hover:bg-surface-02 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md uppercase tracking-wider font-mono ${getSeverityBadge(
                        finding.severity
                      )}`}
                    >
                      {finding.severity}
                    </span>
                    <h4 className="font-semibold text-foreground text-xs">{finding.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    {finding.category}
                  </span>
                </div>

                <p className="text-[11px] text-text-muted">{finding.description}</p>

                <div className="text-[11px] text-text-secondary pt-1 flex items-start space-x-1.5">
                  <span className="font-semibold text-foreground shrink-0">Remediation:</span>
                  <span>{finding.remediation}</span>
                </div>
              </div>
            ))
          )
        ) : transfers.length === 0 ? (
          <div className="p-4 text-center text-text-muted">
            No cross-border or third-party transfers detected.
          </div>
        ) : (
          transfers.map((transfer, idx) => (
            <div
              key={`${transfer.flowId}-${idx}`}
              className="p-3 space-y-1 hover:bg-surface-02 transition-colors text-[11px]"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {transfer.sourceComponentId} → {transfer.destinationComponentId}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md uppercase font-mono ${
                    transfer.requiresReview
                      ? "bg-surface-04 text-foreground border border-border-strong font-bold"
                      : "bg-surface-02 text-text-muted border border-border-subtle"
                  }`}
                >
                  {transfer.requiresReview ? "Review Required" : "Standard"}
                </span>
              </div>

              <div className="text-text-muted flex items-center space-x-4">
                <span>
                  Jurisdiction: {transfer.sourceCountry || "—"} → {transfer.destinationCountry || "—"}
                </span>
                <span>Third Party: {transfer.isThirdParty ? `Yes (${transfer.recipientName || "External"})` : "No"}</span>
              </div>

              <p className="text-text-secondary text-[11px]">{transfer.notes}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

