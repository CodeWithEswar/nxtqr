"use client";

import React, { useState } from "react";
import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  SimulationResult,
  TimelineStepSnapshot,
} from "@nxtqr/architecture-intelligence";

export interface SimulationInspectorProps {
  nodes: BaseNode[];
  simulationResult: SimulationResult;
  currentStep: TimelineStepSnapshot;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  className?: string;
}

export function SimulationInspector({
  nodes,
  simulationResult,
  currentStep,
  selectedComponentId,
  onSelectComponent,
  className = "",
}: SimulationInspectorProps) {
  const [tab, setTab] = useState<"blast" | "journeys" | "recovery">("blast");

  const blastRadius = simulationResult.blastRadius;
  const recovery = simulationResult.recovery;
  const cascadingRisks = simulationResult.cascadingRisks;
  const findings = simulationResult.findings;

  const selectedNode = selectedComponentId
    ? nodes.find((n) => n.id === selectedComponentId)
    : null;

  const selectedSnapshot = selectedComponentId
    ? currentStep.componentStates[selectedComponentId]
    : null;

  return (
    <div className={`flex flex-col h-full bg-surface-01 border border-border-default rounded-md overflow-hidden ${className}`}>
      {/* Top Header Tabs */}
      <div className="flex border-b border-border-subtle bg-surface-02 p-1 gap-1">
        <button
          type="button"
          onClick={() => setTab("blast")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
            tab === "blast"
              ? "bg-surface-04 text-white font-semibold shadow-level-1 border border-border-default"
              : "text-text-muted hover:text-white"
          }`}
        >
          Blast Radius ({blastRadius.blastRadiusScore}%)
        </button>
        <button
          type="button"
          onClick={() => setTab("journeys")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
            tab === "journeys"
              ? "bg-surface-04 text-white font-semibold shadow-level-1 border border-border-default"
              : "text-text-muted hover:text-white"
          }`}
        >
          Journeys
        </button>
        <button
          type="button"
          onClick={() => setTab("recovery")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
            tab === "recovery"
              ? "bg-surface-04 text-white font-semibold shadow-level-1 border border-border-default"
              : "text-text-muted hover:text-white"
          }`}
        >
          Recovery & SLA
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-4 text-xs">
        {tab === "blast" && (
          <div className="space-y-3.5">
            {/* Blast Radius Score Card */}
            <div className="p-3 bg-surface-02 border border-border-subtle rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium">Model Blast Radius</span>
                <span className="text-base font-bold text-white font-mono">
                  {blastRadius.blastRadiusScore}%
                </span>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="h-2 w-full bg-surface-03 rounded-md overflow-hidden flex border border-border-subtle">
                <div
                  style={{ width: `${(blastRadius.directlyImpactedNodeIds.length / nodes.length) * 100}%` }}
                  className="bg-red-500"
                  title="Direct Failures"
                />
                <div
                  style={{ width: `${(blastRadius.indirectlyImpactedNodeIds.length / nodes.length) * 100}%` }}
                  className="bg-orange-500"
                  title="Cascading Degradations"
                />
                <div
                  style={{ width: `${(blastRadius.unaffectedNodeIds.length / nodes.length) * 100}%` }}
                  className="bg-neutral-600"
                  title="Unaffected Components"
                />
              </div>

              <div className="grid grid-cols-3 text-[10px] font-mono text-center pt-1">
                <div>
                  <span className="text-red-400 font-bold">{blastRadius.directlyImpactedNodeIds.length}</span> Direct
                </div>
                <div>
                  <span className="text-orange-400 font-bold">{blastRadius.indirectlyImpactedNodeIds.length}</span> Cascading
                </div>
                <div>
                  <span className="text-text-muted font-bold">{blastRadius.unaffectedNodeIds.length}</span> Isolated
                </div>
              </div>
            </div>

            {/* Selected Component Inspector Card */}
            {selectedNode && selectedSnapshot && (
              <div className="p-3 bg-surface-02 border border-border-default rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    {(selectedNode.data?.label as string) || selectedNode.id}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md ${
                      selectedSnapshot.state === "healthy"
                        ? "bg-green-950/80 text-green-300 border border-green-800"
                        : selectedSnapshot.state === "degraded"
                        ? "bg-orange-950/80 text-orange-300 border border-orange-800"
                        : "bg-red-950/80 text-red-300 border border-red-800"
                    }`}
                  >
                    {selectedSnapshot.state}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] font-mono text-text-secondary">
                  <div className="flex justify-between">
                    <span>Replicas Active:</span>
                    <span className="text-white">{selectedSnapshot.activeReplicas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Circuit Breaker:</span>
                    <span className={selectedSnapshot.isCircuitOpen ? "text-orange-400" : "text-text-muted"}>
                      {selectedSnapshot.isCircuitOpen ? "OPEN (Tripped)" : "CLOSED"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latency Multiplier:</span>
                    <span className="text-white">{selectedSnapshot.latencyMultiplier}x</span>
                  </div>
                  {selectedSnapshot.reason && (
                    <div className="pt-1 text-[10px] text-text-muted italic">
                      "{selectedSnapshot.reason}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Component State List at Current Timestamp */}
            <div className="space-y-2">
              <span className="text-text-secondary font-medium">All Components at T={currentStep.timestampMs / 1000}s:</span>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {nodes.map((node) => {
                  const state = currentStep.componentStates[node.id];
                  const isSelected = selectedComponentId === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => onSelectComponent(node.id)}
                      className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-surface-04 border-border-strong text-white"
                          : "bg-surface-02 border-border-subtle hover:bg-surface-03"
                      }`}
                    >
                      <span className="font-mono text-[11px] truncate max-w-[160px]">
                        {(node.data?.label as string) || node.id}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md ${
                          state?.state === "healthy"
                            ? "text-neutral-400"
                            : state?.state === "degraded"
                            ? "bg-orange-950/60 text-orange-300"
                            : "bg-red-950/60 text-red-300"
                        }`}
                      >
                        {state?.state || "healthy"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "journeys" && (
          <div className="space-y-3">
            <span className="text-text-secondary font-medium">Critical Business Journeys</span>
            <div className="space-y-2">
              {simulationResult.journeyResults.map((j) => {
                const currentStatus = currentStep.journeyStatuses[j.journeyId] || j.status;
                const isAvail = currentStatus === "available";
                const isDegr = currentStatus === "degraded";

                return (
                  <div
                    key={j.journeyId}
                    className="p-3 bg-surface-02 border border-border-subtle rounded-md space-y-2"
                  >
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>{j.name}</span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${
                          isAvail
                            ? "bg-green-950/70 text-green-300 border border-green-800"
                            : isDegr
                            ? "bg-orange-950/70 text-orange-300 border border-orange-800"
                            : "bg-red-950/70 text-red-300 border border-red-800"
                        }`}
                      >
                        {currentStatus}
                      </span>
                    </div>

                    {j.failedStepDescription && !isAvail && (
                      <p className="text-[11px] text-red-300/90 font-mono">
                        ⚠️ {j.failedStepDescription}
                      </p>
                    )}

                    <div className="text-[10px] text-text-muted font-mono">
                      Impacted Components: {j.affectedComponentIds.length > 0 ? j.affectedComponentIds.join(", ") : "None (Fully Operational)"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "recovery" && (
          <div className="space-y-3.5">
            {/* SLA Assessment Card */}
            <div className="p-3 bg-surface-02 border border-border-subtle rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium">Declared Recovery Target</span>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${
                    recovery.rtoMet
                      ? "bg-green-950/70 text-green-300 border border-green-800"
                      : "bg-red-950/70 text-red-300 border border-red-800"
                  }`}
                >
                  {recovery.rtoMet ? "RTO Compliant" : "RTO Breached"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-text-secondary">
                <div>Detection Window: <span className="text-white">{recovery.modeledDetectionTimeMs / 1000}s</span></div>
                <div>Failover Latency: <span className="text-white">{recovery.modeledFailoverTimeMs / 1000}s</span></div>
                <div>Warm Restart: <span className="text-white">{recovery.modeledRestartTimeMs / 1000}s</span></div>
                <div>Total Recovery: <span className="text-white font-semibold">{recovery.totalModeledRecoveryMs / 1000}s</span></div>
              </div>
            </div>

            {/* Cascading Failure Risks */}
            {cascadingRisks.length > 0 && (
              <div className="space-y-2">
                <span className="text-text-secondary font-medium">Systemic Cascade Risks:</span>
                {cascadingRisks.map((cr, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-red-950/20 border border-red-900/40 rounded-md space-y-1"
                  >
                    <div className="flex items-center justify-between text-red-300 font-semibold text-[11px]">
                      <span>{cr.type.replace(/_/g, " ").toUpperCase()}</span>
                      <span className="text-[9px] uppercase px-1 py-0.5 bg-red-950/80 rounded-md">
                        {cr.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      {cr.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Actionable Resilience Findings */}
            <div className="space-y-2">
              <span className="text-text-secondary font-medium">Resilience Recommendations:</span>
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 bg-surface-02 border border-border-subtle rounded-md space-y-1"
                >
                  <div className="font-semibold text-white text-[11px]">{f.title}</div>
                  <p className="text-[10px] text-text-muted leading-relaxed">{f.explanation}</p>
                  <div className="pt-1 text-[10px] text-text-secondary font-mono">
                    <span className="text-white font-semibold">Fix:</span> {f.remediationRecommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
