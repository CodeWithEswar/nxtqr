"use client";

/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Policy Evaluation Detailed Inspector
 */

import React from "react";
import type {
  GovernancePolicy,
  PolicyEvaluation,
  EvidenceArtifact,
  PolicyException,
} from "@nxtqr/architecture-intelligence";
import {
  ShieldIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  HelpCircleIcon,
  CalendarIcon,
  TerminalIcon,
  BookOpenIcon,
  ChevronRightIcon,
} from "@nxtqr/icons";

export interface PolicyEvaluationInspectorProps {
  policy: GovernancePolicy;
  evaluations: PolicyEvaluation[];
  evidence: EvidenceArtifact[];
  exceptions: PolicyException[];
  onRequestException?: (policyId: string) => void;
}

export function PolicyEvaluationInspector({
  policy,
  evaluations,
  evidence,
  exceptions,
  onRequestException,
}: PolicyEvaluationInspectorProps) {
  const policyEvaluations = evaluations.filter((e) => e.policyId === policy.id);

  // Status computation
  const hasFail = policyEvaluations.some((e) => e.status === "fail");
  const hasUnknown = policyEvaluations.some((e) => e.status === "unknown");
  const allPass = policyEvaluations.length > 0 && policyEvaluations.every((e) => e.status === "pass");

  const overallStatus = hasFail ? "fail" : hasUnknown ? "unknown" : allPass ? "pass" : "not_applicable";

  // Active exception lookup
  const activeException = exceptions.find(
    (ex) => ex.policyId === policy.id && ex.status === "approved" && !ex.isExpired
  );

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white overflow-y-auto">
      {/* Policy Header Banner */}
      <div className="p-4 bg-[#080808] border-b border-[#262626]">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-semibold text-white bg-[#141414] border border-[#262626] px-2 py-0.5 rounded-md">
                {policy.id}
              </span>
              <span className="text-[11px] font-mono uppercase text-[#858585]">
                v{policy.version}
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border ${
                  policy.severity === "critical"
                    ? "text-[#ef4444] bg-[#0D0D0D] border-[#262626]"
                    : policy.severity === "high"
                    ? "text-[#f97316] bg-[#0D0D0D] border-[#262626]"
                    : "text-[#B5B5B5] bg-[#0D0D0D] border-[#262626]"
                }`}
              >
                {policy.severity}
              </span>
              <span className="text-[11px] font-mono text-[#858585] uppercase">
                {policy.category}
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {policy.title}
            </h2>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end gap-1.5">
            {overallStatus === "pass" && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#22c55e] bg-[#080808] border border-[#262626] px-2.5 py-1 rounded-md">
                <CheckCircleIcon size={14} /> EVALUATION PASSED
              </div>
            )}
            {overallStatus === "fail" && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#ef4444] bg-[#080808] border border-[#262626] px-2.5 py-1 rounded-md">
                <AlertCircleIcon size={14} /> POLICY VIOLATION
              </div>
            )}
            {overallStatus === "unknown" && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#eab308] bg-[#080808] border border-[#262626] px-2.5 py-1 rounded-md">
                <HelpCircleIcon size={14} /> UNKNOWN (NO PROOF)
              </div>
            )}
            {overallStatus === "not_applicable" && (
              <div className="text-xs font-mono text-[#858585] bg-[#080808] border border-[#262626] px-2.5 py-1 rounded-md">
                NOT APPLICABLE
              </div>
            )}

            {activeException && (
              <span className="text-[10px] font-mono text-[#eab308] bg-[#141414] border border-[#262626] px-2 py-0.5 rounded-md">
                Approved Waiver Active: {activeException.id}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-[#B5B5B5] leading-relaxed mt-2">
          {policy.description}
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Resource Evaluations Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B5B5B5] flex items-center gap-2">
              <TerminalIcon size={14} /> Target Resource Evaluations ({policyEvaluations.length})
            </h3>
            {hasFail && !activeException && onRequestException && (
              <button
                onClick={() => onRequestException(policy.id)}
                className="text-[11px] font-mono text-white bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] px-2.5 py-1 rounded-md transition-colors"
              >
                Request Time-Bound Waiver
              </button>
            )}
          </div>

          <div className="border border-[#262626] rounded-md overflow-hidden bg-[#080808]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D0D0D] border-b border-[#262626] text-[#858585] font-mono text-[11px]">
                <tr>
                  <th className="p-2.5">Resource Target</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Evaluation Rationale</th>
                  <th className="p-2.5">Evidence Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {policyEvaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#0D0D0D] transition-colors">
                    <td className="p-2.5 font-mono text-white">
                      {ev.resourceName || ev.resourceId || "system"}
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">
                      {ev.status === "pass" && (
                        <span className="text-[#22c55e]">PASS</span>
                      )}
                      {ev.status === "fail" && (
                        <span className="text-[#ef4444]">
                          FAIL {ev.hasActiveException && "(Waiver)"}
                        </span>
                      )}
                      {ev.status === "unknown" && (
                        <span className="text-[#eab308]">UNKNOWN</span>
                      )}
                      {ev.status === "not_applicable" && (
                        <span className="text-[#858585]">N/A</span>
                      )}
                    </td>
                    <td className="p-2.5 text-[#B5B5B5] leading-snug">
                      {ev.explanation}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-[#858585]">
                      {ev.evidenceIds.length > 0
                        ? ev.evidenceIds.join(", ")
                        : ev.missingEvidenceTypes.length > 0
                        ? `Missing: [${ev.missingEvidenceTypes.join(", ")}]`
                        : "None required"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Exception / Compensating Controls Card */}
        {activeException && (
          <div className="p-3.5 bg-[#080808] border border-[#262626] rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} className="text-[#eab308]" />
                <span className="text-xs font-semibold text-white">
                  Active Time-Bound Policy Exception: {activeException.id}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#858585]">
                Expires: {activeException.expirationDate.split("T")[0]}
              </span>
            </div>

            <p className="text-xs text-[#B5B5B5]">
              <strong>Justification:</strong> {activeException.justification}
            </p>

            {activeException.compensatingControls.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666]">
                  Verified Compensating Controls
                </span>
                {activeException.compensatingControls.map((cc) => (
                  <div
                    key={cc.id}
                    className="p-2 bg-[#0D0D0D] border border-[#202020] rounded-md text-xs"
                  >
                    <div className="flex items-center justify-between text-[#FFFFFF] font-medium mb-0.5">
                      <span>{cc.title}</span>
                      <span className="text-[10px] font-mono text-[#22c55e]">
                        [{cc.reviewStatus.toUpperCase()}]
                      </span>
                    </div>
                    <p className="text-[11px] text-[#858585]">{cc.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Required Evidence Artifacts */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B5B5B5] flex items-center gap-2">
            <ShieldIcon size={14} /> Required Evidence Proof
          </h3>

          {policy.requiredEvidenceTypes.length === 0 ? (
            <div className="p-3 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#858585]">
              This policy evaluates structural graph attributes directly and does not mandate external runtime telemetry or audit artifacts.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {policy.requiredEvidenceTypes.map((reqType) => {
                const matched = evidence.filter((ev) => ev.evidenceType === reqType);

                return (
                  <div
                    key={reqType}
                    className="p-3 bg-[#080808] border border-[#262626] rounded-md space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium text-white">
                        {reqType}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${
                          matched.length > 0
                            ? "text-[#22c55e] border-[#262626] bg-[#0D0D0D]"
                            : "text-[#eab308] border-[#262626] bg-[#0D0D0D]"
                        }`}
                      >
                        {matched.length > 0 ? "RESOLVED" : "MISSING PROOF"}
                      </span>
                    </div>

                    {matched.map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[11px] font-mono text-[#858585] space-y-0.5 pt-1 border-t border-[#1A1A1A]"
                      >
                        <div className="flex justify-between">
                          <span>Artifact:</span>
                          <span className="text-white">{ev.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hash:</span>
                          <span className="truncate max-w-[140px]">{ev.integrityHash}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Validity:</span>
                          <span>{ev.freshnessWindowSeconds / 3600}h window</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actionable Remediation Guidance */}
        <div className="p-3.5 bg-[#080808] border border-[#262626] rounded-md space-y-2">
          <div className="flex items-center gap-2">
            <ChevronRightIcon size={14} className="text-white" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Remediation Guidance
            </h3>
          </div>
          <p className="text-xs text-[#B5B5B5] leading-relaxed">
            {policy.remediationGuidance}
          </p>
        </div>

        {/* Framework Reference Mappings */}
        {policy.controlMappings && policy.controlMappings.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B5B5B5] flex items-center gap-2">
              <BookOpenIcon size={14} /> Standard Compliance Control Alignments
            </h3>

            <div className="space-y-2">
              {policy.controlMappings.map((cm, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#080808] border border-[#262626] rounded-md space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {cm.framework.frameworkName}
                      </span>
                      <span className="text-[11px] font-mono text-[#B5B5B5] bg-[#141414] border border-[#202020] px-1.5 py-0.5 rounded-md">
                        {cm.framework.controlId}: {cm.framework.controlTitle}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[#B5B5B5] border border-[#262626] px-1.5 py-0.5 rounded-md bg-[#0D0D0D]">
                      {cm.supportStrength.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#858585]">
                    {cm.coverageNotes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
