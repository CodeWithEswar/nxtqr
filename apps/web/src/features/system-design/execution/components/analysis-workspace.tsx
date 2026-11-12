"use client";

import * as React from "react";
import {
  ANALYSIS_PRESET_METADATA,
  cloneRevisionImmutable,
  createAnalysisPresetExperiment,
  type AnalysisExperiment,
  type AnalysisPresetId,
  type ModeledAnalysisRuntimeState,
} from "@nxtqr/architecture-execution";
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nxtqr/ui";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  CloseIcon,
  LayersIcon,
  PlayIcon,
  ShieldIcon,
  TerminalIcon,
} from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";

type AnalysisTabId =
  | "compare_diff"
  | "bottlenecks"
  | "reliability"
  | "tradeoffs"
  | "recommendations"
  | "adr_report"
  | "invariants";

export function AnalysisWorkspace() {
  const isOpen = useExecutionStore((s) => s.isAnalysisWorkspaceOpen);
  const toggleWorkspace = useExecutionStore((s) => s.toggleAnalysisWorkspace);
  const activeExperiment = useExecutionStore((s) => s.activeAnalysisExperiment);
  const setAnalysisExperiment = useExecutionStore(
    (s) => s.setAnalysisExperiment
  );
  const runAnalysisExperiment = useExecutionStore(
    (s) => s.runAnalysisExperiment
  );
  const currentFrame = useExecutionStore((s) => s.playbackState.currentFrame);
  const trace = useExecutionStore((s) => s.trace);

  const [activeTab, setActiveTab] =
    React.useState<AnalysisTabId>("compare_diff");
  const [selectedPreset, setSelectedPreset] = React.useState<AnalysisPresetId>(
    "ana_monolith_vs_replicated"
  );
  const [adrStatusOverride, setAdrStatusOverride] = React.useState<
    "Proposed" | "Accepted" | "Rejected"
  >("Proposed");

  const analysisState: ModeledAnalysisRuntimeState | undefined =
    currentFrame?.runtimeState?.analysisState ??
    trace?.frames[trace.frames.length - 1]?.runtimeState?.analysisState;

  const workingExp: AnalysisExperiment = React.useMemo(
    () =>
      activeExperiment ?? createAnalysisPresetExperiment(selectedPreset),
    [activeExperiment, selectedPreset]
  );

  if (!isOpen) return null;

  const handleSelectPreset = (id: AnalysisPresetId) => {
    setSelectedPreset(id);
    setAdrStatusOverride("Proposed");
    const next = createAnalysisPresetExperiment(id);
    setAnalysisExperiment(next);
    runAnalysisExperiment(next);
  };

  const handleAdjustWorkload = (delta: number) => {
    const updated: AnalysisExperiment = {
      ...workingExp,
      workloadRps: Math.max(50, Math.min(5000, workingExp.workloadRps + delta)),
    };
    setAnalysisExperiment(updated);
    runAnalysisExperiment(updated);
  };

  const handleFaultChange = (
    faultType: AnalysisExperiment["fault"]["type"]
  ) => {
    const updated: AnalysisExperiment = {
      ...workingExp,
      fault: { ...workingExp.fault, type: faultType },
    };
    setAnalysisExperiment(updated);
    runAnalysisExperiment(updated);
  };

  const handleToggleScoring = () => {
    const updated: AnalysisExperiment = {
      ...workingExp,
      scoringEnabled: !workingExp.scoringEnabled,
    };
    setAnalysisExperiment(updated);
    runAnalysisExperiment(updated);
  };

  const handleCounterfactualHardening = () => {
    const nextCand = cloneRevisionImmutable(
      workingExp.candidateRevision,
      `${workingExp.candidateRevision.revisionId}_v2`,
      `${workingExp.candidateRevision.label} + Hardened Multi-AZ`
    );
    nextCand.components = nextCand.components.map((c) =>
      c.kind === "database"
        ? {
            ...c,
            multiAz: true,
            replicas: Math.max(2, c.replicas + 1),
            replicationMode: "quorum",
          }
        : {
            ...c,
            multiAz: true,
            replicas: Math.min(workingExp.candidateRevision.maxReplicas, c.replicas + 1),
          }
    );
    const updated: AnalysisExperiment = {
      ...workingExp,
      candidateRevision: nextCand,
    };
    setAnalysisExperiment(updated);
    runAnalysisExperiment(updated);
  };

  const base = analysisState?.baselineMetrics;
  const cand = analysisState?.candidateMetrics;

  return (
    <div
      data-testid="analysis-workspace"
      className="fixed bottom-4 right-4 z-40 w-[900px] max-w-[calc(100vw-2rem)] max-h-[84vh] flex flex-col bg-surface-01 border border-border-default rounded-md shadow-level-2 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-surface-02 border-b border-border-subtle">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-03 border border-border-default shrink-0">
            <LayersIcon className="w-3.5 h-3.5 text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-foreground truncate">
                Architecture Trade-Offs, Reliability &amp; Design Decision Explorer
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] font-mono rounded-md border-border-strong bg-surface-03 text-text-secondary"
              >
                40 Presets · Phase 05.4.22
              </Badge>
            </div>
            <p className="text-[10px] font-mono text-text-muted truncate">
              Immutable Revisions · Causal Bottlenecks · Failure Domains &amp; SPOF · Evidence-Linked ADRs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Select
            value={(workingExp.presetId as AnalysisPresetId) ?? selectedPreset}
            onValueChange={(v) => handleSelectPreset(v as AnalysisPresetId)}
          >
            <SelectTrigger
              aria-label="Architecture Analysis Preset"
              className="h-7 w-[250px] text-[11px] font-mono bg-surface-03 border-border-default rounded-md"
            >
              <SelectValue placeholder="Choose architecture experiment" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default rounded-md max-h-72">
              {ANALYSIS_PRESET_METADATA.map((p) => (
                <SelectItem
                  key={p.id}
                  value={p.id}
                  className="text-[11px] font-mono"
                >
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={() => runAnalysisExperiment(workingExp)}
            className="h-7 px-2.5 text-[11px] font-mono rounded-md bg-foreground text-background hover:bg-foreground/90 gap-1"
          >
            <PlayIcon className="w-3 h-3" />
            Run
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleWorkspace(false)}
            aria-label="Close Analysis Workspace"
            className="h-7 w-7 p-0 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Interactive Experiment Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-surface-01 border-b border-border-subtle text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Workload:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdjustWorkload(-100)}
              className="h-6 px-1.5 text-[10px] font-mono rounded-md border-border-default bg-surface-03"
            >
              -100
            </Button>
            <span className="text-foreground font-semibold min-w-[74px] text-center">
              {workingExp.workloadRps} req/s
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdjustWorkload(100)}
              className="h-6 px-1.5 text-[10px] font-mono rounded-md border-border-default bg-surface-03"
            >
              +100
            </Button>
          </div>

          <div className="flex items-center gap-1.5 border-l border-border-subtle pl-3">
            <span className="text-text-muted">Fault:</span>
            <Select
              value={workingExp.fault.type}
              onValueChange={(v) =>
                handleFaultChange(v as AnalysisExperiment["fault"]["type"])
              }
            >
              <SelectTrigger
                aria-label="Injected Failure Scenario"
                className="h-6 w-[145px] text-[10px] font-mono bg-surface-03 border-border-default rounded-md"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-02 border-border-default rounded-md">
                {[
                  "none",
                  "az_outage",
                  "db_outage",
                  "cache_stampede",
                  "retry_storm",
                  "region_outage",
                  "queue_overload",
                ].map((f) => (
                  <SelectItem
                    key={f}
                    value={f}
                    className="text-[10px] font-mono"
                  >
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleScoring}
            className="h-6 px-2 text-[10px] font-mono rounded-md border-border-default bg-surface-03 text-foreground"
          >
            Composite Score: {workingExp.scoringEnabled ? "ON" : "OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCounterfactualHardening}
            className="h-6 px-2 text-[10px] font-mono rounded-md border-border-default bg-surface-03 hover:bg-surface-04 text-foreground"
          >
            Counterfactual: Harden Candidate
          </Button>
        </div>
      </div>

      {/* 6 KPI Comparison Strip */}
      {analysisState && base && cand ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-3 py-2.5 bg-surface-01 border-b border-border-subtle">
          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              COMPLETED THROUGHPUT
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              {base.completedRps} → {cand.completedRps}
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              req/s · Cap {cand.effectiveCapacityRps}
            </div>
          </div>

          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              TAIL LATENCY p95
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              {base.p95LatencyMs} → {cand.p95LatencyMs} ms
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              p99 {cand.p99LatencyMs}ms · err {(cand.errorRate * 100).toFixed(1)}%
            </div>
          </div>

          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              SIM AVAILABILITY
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              {(base.simulatedAvailability * 100).toFixed(1)}% →{" "}
              {(cand.simulatedAvailability * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              SPOFs flagged: {analysisState.spofs.length}
            </div>
          </div>

          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              SYNTHETIC COST/MO
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              ${base.estimatedMonthlyCostUsd} → ${cand.estimatedMonthlyCostUsd}
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              {cand.costPerSuccessfulRequestUsd !== null
                ? `$${cand.costPerSuccessfulRequestUsd}/ok`
                : "N/A (0 ok)"}
            </div>
          </div>

          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              HARD CONSTRAINTS
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              {analysisState.candidateConstraintChecks.filter((c) => c.passed).length}/
              {analysisState.candidateConstraintChecks.length} PASS
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              {analysisState.scorecard.candidateConstraintsPassed
                ? "Candidate Compliant"
                : "Violations Flagged"}
            </div>
          </div>

          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              DECISION &amp; SCORE
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              {analysisState.adr.id} · {adrStatusOverride}
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              {analysisState.scorecard.scoringEnabled
                ? `Score ${analysisState.scorecard.baselineComposite} → ${analysisState.scorecard.candidateComposite}`
                : "Composite Hidden"}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3 py-4 text-xs font-mono text-text-muted border-b border-border-subtle">
          Click Run or choose any of the 40 architecture experiments to evaluate Baseline vs Candidate revisions.
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 bg-surface-02 border-b border-border-subtle">
        {(
          [
            { id: "compare_diff", label: "Compare & Diff" },
            { id: "bottlenecks", label: "Latency & Bottlenecks" },
            { id: "reliability", label: "Reliability & SPOF" },
            { id: "tradeoffs", label: "Trade-Offs & Constraints" },
            { id: "recommendations", label: "Recommendations" },
            { id: "adr_report", label: "ADR & Report" },
            { id: "invariants", label: "Invariants" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "px-2 py-1 rounded-md text-[11px] font-mono border transition-colors",
              activeTab === t.id
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                : "bg-transparent border-transparent text-text-muted hover:text-foreground hover:bg-surface-03"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface-01">
        {analysisState && base && cand && activeTab === "compare_diff" && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="font-semibold text-foreground">
                  Semantic Architecture Diff ({analysisState.diff.baselineHash} →{" "}
                  {analysisState.diff.candidateHash})
                </span>
                <span className="text-[10px] text-text-muted">
                  {analysisState.diff.summary}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted mb-1">Added / Removed Nodes</div>
                  <div className="text-foreground">
                    + {analysisState.diff.addedComponents.join(", ") || "None"}
                  </div>
                  <div className="text-text-secondary">
                    - {analysisState.diff.removedComponents.join(", ") || "None"}
                  </div>
                </div>
                <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted mb-1">Modified Components</div>
                  {analysisState.diff.modifiedComponents.length === 0 ? (
                    <div className="text-text-secondary">None</div>
                  ) : (
                    analysisState.diff.modifiedComponents.map((m) => (
                      <div key={m.componentId} className="text-foreground">
                        {m.componentId}: {m.changes.join("; ")}
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted mb-1">Edges &amp; Policy Deltas</div>
                  <div className="text-foreground">
                    {[
                      ...analysisState.diff.changedEdges,
                      ...analysisState.diff.policyChanges,
                    ].join(" | ") || "No edge/policy change"}
                  </div>
                </div>
              </div>
            </div>

            {analysisState.statisticalSummary && (
              <div className="p-2.5 rounded-md bg-surface-02 border border-border-default text-[11px] font-mono">
                <span className="font-semibold text-foreground">
                  Multi-Seed Repetition ({analysisState.statisticalSummary.seedCount} seeds):
                </span>{" "}
                <span className="text-text-secondary">
                  Candidate p95 mean {analysisState.statisticalSummary.candidateP95MeanMs}ms · median{" "}
                  {analysisState.statisticalSummary.candidateP95MedianMs}ms · stddev{" "}
                  {analysisState.statisticalSummary.candidateP95StdDevMs}ms · mean Sim Avail{" "}
                  {(analysisState.statisticalSummary.candidateAvailabilityMean * 100).toFixed(2)}%
                </span>
              </div>
            )}

            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="text-xs font-mono font-semibold text-foreground">
                Simulation Capability Adapters
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] font-mono">
                {analysisState.capabilities.map((cap) => (
                  <div
                    key={cap.id}
                    className="p-2 rounded-md bg-surface-03 border border-border-subtle flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="text-foreground font-semibold">{cap.name}</div>
                      <div className="text-text-muted mt-0.5">{cap.limitations}</div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono rounded-md border-border-default shrink-0"
                    >
                      {cap.available ? "Active" : "Out of Scope"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {analysisState && base && cand && activeTab === "bottlenecks" && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="text-xs font-mono font-semibold text-foreground">
                Latency Attribution &amp; Critical Path (Candidate)
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px] font-mono">
                {Object.entries(cand.latencyAttributionMs).map(([k, v]) => (
                  <div
                    key={k}
                    className="p-1.5 rounded-md bg-surface-03 border border-border-subtle"
                  >
                    <div className="text-text-muted uppercase">{k}</div>
                    <div className="text-foreground font-semibold">{v} ms</div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-mono text-text-secondary">
                Critical Path: {cand.criticalPathComponentIds.join(" → ")}
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="text-xs font-mono font-semibold text-foreground">
                Ranked Bottleneck Diagnosis ({analysisState.bottlenecks.length})
              </div>
              {analysisState.bottlenecks.length === 0 ? (
                <div className="text-[11px] font-mono text-text-muted">
                  No saturated resource bottleneck detected under this workload.
                </div>
              ) : (
                analysisState.bottlenecks.map((bn) => (
                  <div
                    key={`${bn.id}-${bn.evidenceIds[0]}`}
                    className="p-2 rounded-md bg-surface-03 border border-border-subtle text-[11px] font-mono space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {bn.componentId} · {bn.limitingResource} ({bn.role})
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono rounded-md border-border-strong bg-surface-04"
                      >
                        Rank {bn.rankingScore} · {bn.saturationPct}% sat
                      </Badge>
                    </div>
                    <div className="text-text-secondary">{bn.explanation}</div>
                    <div className="text-[10px] text-text-muted">
                      Evidence: {bn.evidenceIds.join(", ")} · +{bn.latencyImpactMs}ms impact
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {analysisState && base && cand && activeTab === "reliability" && (
          <div className="space-y-3">
            {(!base.availabilityAssumptionsHeld ||
              !cand.availabilityAssumptionsHeld) && (
              <div className="p-2.5 rounded-md bg-surface-03 border border-border-strong flex items-start gap-2 text-xs font-mono">
                <AlertTriangleIcon className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">
                    Analytical Availability Guardrail Active (Shared Failure Domain Detected)
                  </div>
                  <div className="text-text-secondary text-[11px] mt-0.5">
                    {!cand.availabilityAssumptionsHeld
                      ? cand.availabilityCaveat
                      : base.availabilityCaveat}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-mono">
              <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1">
                <div className="font-semibold text-foreground">
                  Baseline Reliability &amp; DR Readiness
                </div>
                <div className="text-text-secondary">
                  Simulated Availability: {(base.simulatedAvailability * 100).toFixed(2)}%
                </div>
                <div className="text-text-secondary">
                  Analytical Estimate:{" "}
                  {base.analyticalAvailability !== null
                    ? `${(base.analyticalAvailability * 100).toFixed(4)}%`
                    : "N/A (Shared SPOF / Single-AZ)"}
                </div>
                <div className="text-text-muted text-[10px]">
                  RPO: {base.achievedRpoSec ?? "Unbounded"}s · RTO:{" "}
                  {base.achievedRtoSec ?? "Unbounded"}s
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1">
                <div className="font-semibold text-foreground">
                  Candidate Reliability &amp; DR Readiness
                </div>
                <div className="text-text-secondary">
                  Simulated Availability: {(cand.simulatedAvailability * 100).toFixed(2)}%
                </div>
                <div className="text-text-secondary">
                  Analytical Estimate:{" "}
                  {cand.analyticalAvailability !== null
                    ? `${(cand.analyticalAvailability * 100).toFixed(4)}%`
                    : "N/A (Shared SPOF / Single-AZ)"}
                </div>
                <div className="text-text-muted text-[10px]">
                  RPO: {cand.achievedRpoSec ?? "Unbounded"}s · RTO:{" "}
                  {cand.achievedRtoSec ?? "Unbounded"}s
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="text-xs font-mono font-semibold text-foreground">
                Single Points of Failure &amp; Failure Domains ({analysisState.spofs.length})
              </div>
              {analysisState.spofs.map((spof, idx) => (
                <div
                  key={`${spof.id}-${idx}`}
                  className="p-2 rounded-md bg-surface-03 border border-border-subtle text-[10px] font-mono space-y-0.5"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">
                      {spof.componentId} ({spof.failureDomain})
                    </span>
                    <span className="text-text-secondary">{spof.severity}</span>
                  </div>
                  <div className="text-text-secondary">{spof.explanation}</div>
                  <div className="text-text-muted">Mitigation: {spof.mitigationPath}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisState && activeTab === "tradeoffs" && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="text-xs font-mono font-semibold text-foreground">
                Hard Constraint Compliance (Never Hidden Behind Composite Scores)
              </div>
              {analysisState.candidateConstraintChecks.map((c) => (
                <div
                  key={c.constraintId}
                  className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-md bg-surface-03 border border-border-subtle text-[10px] font-mono"
                >
                  <span className="text-foreground font-semibold">{c.label}</span>
                  <span className="text-text-secondary">
                    Observed {c.actualValue} vs {c.requiredValue} ·{" "}
                    <strong className={c.passed ? "text-success" : "text-destructive"}>
                      {c.passed ? "PASS" : "FAIL"}
                    </strong>
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {analysisState.tradeOffs.map((to) => (
                <div
                  key={to.id}
                  className="p-2.5 rounded-md bg-surface-02 border border-border-default text-[10px] font-mono space-y-1"
                >
                  <div className="font-semibold text-foreground text-[11px]">
                    {to.dimensionA} vs {to.dimensionB}
                  </div>
                  <div className="text-text-secondary">Base: {to.baselineSummary}</div>
                  <div className="text-foreground">Cand: {to.candidateSummary}</div>
                  <div className="text-text-muted">{to.summary}</div>
                </div>
              ))}
            </div>

            {analysisState.scorecard.scoringEnabled && (
              <div className="p-2.5 rounded-md bg-surface-02 border border-border-subtle text-[10px] font-mono space-y-1">
                <div className="font-semibold text-foreground">
                  Transparent Scorecard Disclosure
                </div>
                <div className="text-text-muted">
                  Formula: {analysisState.scorecard.formulaDescription}
                </div>
              </div>
            )}
          </div>
        )}

        {analysisState && activeTab === "recommendations" && (
          <div className="space-y-2">
            {analysisState.recommendations.length === 0 ? (
              <div className="p-3 rounded-md bg-surface-02 border border-border-default text-xs font-mono text-text-muted">
                No unmitigated bottleneck or SPOF triggers further recommendations.
              </div>
            ) : (
              analysisState.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-2.5 rounded-md bg-surface-02 border border-border-default text-[11px] font-mono space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">
                      {rec.title} ({rec.category})
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono rounded-md border-border-strong bg-surface-03"
                    >
                      {rec.validationStatus}
                    </Badge>
                  </div>
                  <div className="text-text-secondary">
                    Problem: {rec.observedProblem}
                  </div>
                  <div className="text-foreground">
                    Proposed: {rec.proposedChangeDescription}
                  </div>
                  <div className="text-text-muted text-[10px]">
                    Effect: {rec.expectedEffect} · Trade-off: {rec.tradeOff} · Evidence:{" "}
                    {rec.evidenceIds.join(", ")}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {analysisState && activeTab === "adr_report" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-md bg-surface-02 border border-border-default text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <TerminalIcon className="w-3.5 h-3.5 text-text-secondary" />
                <span className="font-semibold text-foreground">
                  {analysisState.adr.id} Review Status
                </span>
              </div>
              <div className="flex items-center gap-1">
                {(["Proposed", "Accepted", "Rejected"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAdrStatusOverride(st)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-mono border",
                      adrStatusOverride === st
                        ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                        : "bg-surface-03 border-border-subtle text-text-muted"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <pre className="p-3 rounded-md bg-surface-02 border border-border-default text-[10px] font-mono text-text-secondary whitespace-pre-wrap overflow-x-auto max-h-56">
              {analysisState.adr.markdownText}
            </pre>

            <pre className="p-3 rounded-md bg-surface-02 border border-border-subtle text-[10px] font-mono text-text-muted whitespace-pre-wrap overflow-x-auto max-h-40">
              {analysisState.executiveReportMarkdown}
            </pre>
          </div>
        )}

        {analysisState && activeTab === "invariants" && (
          <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldIcon className="w-3.5 h-3.5 text-text-secondary" />
                Architecture Decision Correctness Invariants
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-mono rounded-md border-border-strong bg-surface-03"
              >
                {analysisState.invariants.allPassed
                  ? "ALL INVARIANTS PASSED"
                  : `${analysisState.invariants.violations.length} VIOLATION(S)`}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono">
              {(
                [
                  ["Baseline revision immutable", analysisState.invariants.baselineImmutableOk],
                  ["Candidate independently versioned", analysisState.invariants.candidateVersionedOk],
                  ["Units & dimensions normalized", analysisState.invariants.unitsNormalizedOk],
                  ["No fabricated analytical metrics", analysisState.invariants.noFabricatedMetricsOk],
                  ["Findings backed by evidence", analysisState.invariants.findingsHaveEvidenceOk],
                  ["Recommendations backed by evidence", analysisState.invariants.recommendationsHaveEvidenceOk],
                  ["Shared dependencies not treated independent", analysisState.invariants.sharedDependenciesNotIndependentOk],
                  ["Hard constraints never hidden", analysisState.invariants.constraintsNotHiddenOk],
                  ["ADR evidence & revision hashes valid", analysisState.invariants.adrLinksValidOk],
                ] as const
              ).map(([label, ok]) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-2 rounded-md bg-surface-03 border border-border-subtle"
                >
                  <span className="text-text-secondary">{label}</span>
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <CheckCircleIcon
                      className={cn(
                        "w-3.5 h-3.5",
                        ok ? "text-success" : "text-destructive"
                      )}
                    />
                    {ok ? "PASS" : "FAIL"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
