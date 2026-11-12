"use client";

import * as React from "react";
import {
  CAPACITY_PRESET_METADATA,
  buildCapacityPresetScenario,
  compareCapacityConfigurations,
  type CapacityPresetId,
  type CapacityScenario,
  type ModeledCapacityRuntimeState,
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
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  CloseIcon,
  CpuIcon,
  DatabaseIcon,
  LayersIcon,
  PlayIcon,
  ShieldIcon,
} from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";

type CapacityTabId =
  | "services"
  | "queueing"
  | "autoscaling"
  | "bottlenecks"
  | "cost_pareto"
  | "invariants";

export function CapacityWorkspace() {
  const isOpen = useExecutionStore((s) => s.isCapacityWorkspaceOpen);
  const toggleWorkspace = useExecutionStore((s) => s.toggleCapacityWorkspace);
  const activeScenario = useExecutionStore((s) => s.activeCapacityScenario);
  const setCapacityScenario = useExecutionStore((s) => s.setCapacityScenario);
  const runCapacitySimulation = useExecutionStore(
    (s) => s.runCapacitySimulation
  );
  const currentFrame = useExecutionStore((s) => s.playbackState.currentFrame);
  const trace = useExecutionStore((s) => s.trace);

  const [activeTab, setActiveTab] = React.useState<CapacityTabId>("services");
  const [selectedPreset, setSelectedPreset] = React.useState<CapacityPresetId>(
    "cap_hpa_scale_out"
  );

  // Pull capacity runtime state from current playback frame or final trace frame
  const capacityState: ModeledCapacityRuntimeState | undefined =
    currentFrame?.runtimeState?.capacityState ??
    trace?.frames[trace.frames.length - 1]?.runtimeState?.capacityState;

  const workingScenario: CapacityScenario = React.useMemo(
    () =>
      activeScenario ?? buildCapacityPresetScenario(selectedPreset),
    [activeScenario, selectedPreset]
  );

  const comparisonRows = React.useMemo(
    () => compareCapacityConfigurations(workingScenario),
    [workingScenario]
  );

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: CapacityPresetId) => {
    setSelectedPreset(presetId);
    const nextScenario = buildCapacityPresetScenario(presetId);
    setCapacityScenario(nextScenario);
    runCapacitySimulation(nextScenario);
  };

  const handleAdjustIncomingRps = (deltaRps: number) => {
    const primary = workingScenario.workloads[0];
    if (!primary) return;
    const nextBase = Math.max(10, Math.min(2000, primary.baseRequestsPerSecond + deltaRps));
    const updated: CapacityScenario = {
      ...workingScenario,
      workloads: workingScenario.workloads.map((w, idx) =>
        idx === 0
          ? {
              ...w,
              baseRequestsPerSecond: nextBase,
              peakRequestsPerSecond: w.peakRequestsPerSecond
                ? Math.max(nextBase, w.peakRequestsPerSecond + deltaRps)
                : undefined,
            }
          : w
      ),
    };
    setCapacityScenario(updated);
    runCapacitySimulation(updated);
  };

  const handleAdjustTargetUtil = (nextTargetPct: number) => {
    const clamped = Math.max(30, Math.min(95, nextTargetPct));
    const updated: CapacityScenario = {
      ...workingScenario,
      scalingPolicies: workingScenario.scalingPolicies.map((p, idx) =>
        idx === 0
          ? {
              ...p,
              mode: p.mode === "fixed" ? "hpa_reactive" : p.mode,
              targetCpuUtilizationPct: clamped,
            }
          : p
      ),
    };
    setCapacityScenario(updated);
    runCapacitySimulation(updated);
  };

  const handleApplySuggestedReplicas = (replicasCount: number) => {
    const svc = workingScenario.services[0];
    if (!svc) return;
    const bounded = Math.max(
      svc.minReplicas,
      Math.min(svc.maxReplicas, replicasCount)
    );
    const updated: CapacityScenario = {
      ...workingScenario,
      services: workingScenario.services.map((s, idx) =>
        idx === 0 ? { ...s, initialReplicas: bounded } : s
      ),
    };
    setCapacityScenario(updated);
    runCapacitySimulation(updated);
  };

  const primaryWorkloadRps =
    workingScenario.workloads[0]?.baseRequestsPerSecond ?? 120;
  const primaryTargetCpu =
    workingScenario.scalingPolicies[0]?.targetCpuUtilizationPct ?? 70;
  const recommendedReplicas =
    capacityState && capacityState.services[workingScenario.services[0]?.id ?? ""]
      ? Math.max(
          workingScenario.services[0]?.minReplicas ?? 1,
          Math.ceil(
            (capacityState.metrics.incomingRps || primaryWorkloadRps) /
              Math.max(
                10,
                ((workingScenario.services[0]?.workerConcurrencyPerReplica ??
                  16) *
                  1000) /
                  Math.max(
                    1,
                    (workingScenario.services[0]?.baseServiceTimeMs ?? 20) * 4
                  ) *
                  (primaryTargetCpu / 100)
              )
          )
        )
      : workingScenario.services[0]?.initialReplicas ?? 3;

  const servicesList = capacityState
    ? Object.values(capacityState.services)
    : [];
  const replicasList = capacityState
    ? Object.values(capacityState.replicas)
    : [];

  return (
    <div
      data-testid="capacity-workspace"
      className="fixed bottom-4 right-4 z-40 w-[860px] max-w-[calc(100vw-2rem)] max-h-[82vh] flex flex-col bg-surface-01 border border-border-default rounded-md shadow-level-2 overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-surface-02 border-b border-border-subtle">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-03 border border-border-default shrink-0">
            <ActivityIcon className="w-3.5 h-3.5 text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-foreground truncate">
                Distributed Capacity Planning, Queueing &amp; Cost Engine
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] font-mono rounded-md border-border-strong bg-surface-03 text-text-secondary"
              >
                45 Presets · Phase 05.4.21
              </Badge>
            </div>
            <p className="text-[10px] font-mono text-text-muted truncate">
              M/M/1 &amp; M/M/c Erlang-C · HPA &amp; Predictive Scaling · Synthetic Cost Attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Select
            value={(workingScenario.presetId as CapacityPresetId) ?? selectedPreset}
            onValueChange={(val) => handleSelectPreset(val as CapacityPresetId)}
          >
            <SelectTrigger
              aria-label="Capacity Scenario Preset"
              className="h-7 w-[250px] text-[11px] font-mono bg-surface-03 border-border-default rounded-md"
            >
              <SelectValue placeholder="Choose capacity preset" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default rounded-md max-h-72">
              {CAPACITY_PRESET_METADATA.map((preset) => (
                <SelectItem
                  key={preset.id}
                  value={preset.id}
                  className="text-[11px] font-mono"
                >
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={() => runCapacitySimulation(workingScenario)}
            className="h-7 px-2.5 text-[11px] font-mono rounded-md bg-foreground text-background hover:bg-foreground/90 gap-1"
          >
            <PlayIcon className="w-3 h-3" />
            Run
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleWorkspace(false)}
            aria-label="Close Capacity Workspace"
            className="h-7 w-7 p-0 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Interactive Playground Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-surface-01 border-b border-border-subtle">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Workload:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdjustIncomingRps(-50)}
              className="h-6 px-1.5 text-[10px] font-mono rounded-md border-border-default bg-surface-03 hover:bg-surface-04"
            >
              -50
            </Button>
            <span className="text-foreground font-semibold min-w-[68px] text-center">
              {primaryWorkloadRps} req/s
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdjustIncomingRps(50)}
              className="h-6 px-1.5 text-[10px] font-mono rounded-md border-border-default bg-surface-03 hover:bg-surface-04"
            >
              +50
            </Button>
          </div>

          <div className="flex items-center gap-1.5 border-l border-border-subtle pl-3">
            <span className="text-text-muted">Target Util:</span>
            {[60, 70, 80].map((tgt) => (
              <button
                key={tgt}
                type="button"
                onClick={() => handleAdjustTargetUtil(tgt)}
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-mono border transition-colors",
                  primaryTargetCpu === tgt
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                    : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
                )}
              >
                {tgt}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-text-muted">
            Suggested Target:{" "}
            <span className="text-foreground font-semibold">
              {recommendedReplicas} replicas
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApplySuggestedReplicas(recommendedReplicas)}
            className="h-6 px-2 text-[10px] font-mono rounded-md border-border-default bg-surface-03 hover:bg-surface-04 text-foreground"
          >
            Apply Replicas ({recommendedReplicas})
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {capacityState ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-3 py-2.5 bg-surface-01 border-b border-border-subtle">
          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              TRAFFIC vs CAPACITY
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              {capacityState.metrics.incomingRps} /{" "}
              {capacityState.metrics.effectiveCapacityRps}
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              req/s · {capacityState.metrics.headroomPct}% headroom
            </div>
          </div>

          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              REPLICAS / NODES
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              {capacityState.metrics.readyReplicas} ready ·{" "}
              {capacityState.metrics.pendingReplicas} pend
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              {capacityState.cluster.nodeCount} nodes · CPU{" "}
              {capacityState.metrics.avgCpuUtilizationPct}%
            </div>
          </div>

          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              QUEUE &amp; p95
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              {capacityState.metrics.p95LatencyMs} ms
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              Q={capacityState.metrics.activeQueueDepth} · shed{" "}
              {capacityState.metrics.rejectedRequests}
            </div>
          </div>

          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              M/M/c UTIL (ρ)
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              {capacityState.queueingAnalysis.mmc.rhoUtilization}
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              {capacityState.queueingAnalysis.mmc.applicable
                ? "Erlang-C Valid"
                : "Unstable ρ ≥ 1"}
            </div>
          </div>

          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              SCALING &amp; SLO
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              {capacityState.metrics.scalingEventsCount} scaled
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              {capacityState.metrics.sloViolationsCount} SLO ticks
            </div>
          </div>

          <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
            <div className="text-[10px] font-mono text-text-muted">
              EST. MONTHLY COST
            </div>
            <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
              ${capacityState.metrics.projectedMonthlyCostUsd}
            </div>
            <div className="text-[10px] font-mono text-text-secondary">
              {capacityState.cost.costPerSuccessfulRequestUsd !== null
                ? `$${capacityState.cost.costPerSuccessfulRequestUsd}/ok`
                : "N/A (0 ok)"}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3 py-4 text-xs font-mono text-text-muted border-b border-border-subtle">
          Click Run or pick one of the 45 capacity presets to execute a deterministic capacity simulation.
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 bg-surface-02 border-b border-border-subtle">
        {(
          [
            { id: "services", label: "Services & Replicas" },
            { id: "queueing", label: "Queueing Theory" },
            { id: "autoscaling", label: "Autoscaling & Forecast" },
            { id: "bottlenecks", label: "Bottlenecks & Right-Sizing" },
            { id: "cost_pareto", label: "Cost, Pareto & Compare" },
            { id: "invariants", label: "Invariants" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors",
              activeTab === t.id
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                : "bg-transparent border-transparent text-text-muted hover:text-foreground hover:bg-surface-03"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface-01">
        {capacityState && activeTab === "services" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {servicesList.map((svc) => (
                <div
                  key={svc.id}
                  className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CpuIcon className="w-3.5 h-3.5 text-text-secondary" />
                      <span className="text-xs font-mono font-semibold text-foreground">
                        {svc.label} ({svc.id})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono rounded-md border-border-default bg-surface-03"
                      >
                        {svc.readyReplicas}/{svc.desiredReplicas} ready
                      </Badge>
                      {svc.sloViolated && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono rounded-md border-border-strong bg-surface-04 text-destructive"
                        >
                          SLO Breach
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div>
                      <div className="flex justify-between text-text-secondary">
                        <span>CPU Demand</span>
                        <span>
                          {svc.cpuUtilizationPct}% {svc.throttled ? "(Throttled)" : ""}
                        </span>
                      </div>
                      <div className="h-1.5 mt-1 rounded-md bg-surface-04 overflow-hidden">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${Math.min(100, svc.cpuUtilizationPct)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-text-secondary">
                        <span>Memory Limit</span>
                        <span>
                          {svc.memoryUtilizationPct}% {svc.oomRisk ? "(OOM Risk)" : ""}
                        </span>
                      </div>
                      <div className="h-1.5 mt-1 rounded-md bg-surface-04 overflow-hidden">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${Math.min(100, svc.memoryUtilizationPct)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-text-secondary">
                        <span>Worker Pool</span>
                        <span>{svc.workerUtilizationPct}%</span>
                      </div>
                      <div className="h-1.5 mt-1 rounded-md bg-surface-04 overflow-hidden">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${Math.min(100, svc.workerUtilizationPct)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-text-secondary">
                        <span>DB Connection Pool</span>
                        <span>{svc.connectionUtilizationPct}%</span>
                      </div>
                      <div className="h-1.5 mt-1 rounded-md bg-surface-04 overflow-hidden">
                        <div
                          className="h-full bg-foreground"
                          style={{
                            width: `${Math.min(100, svc.connectionUtilizationPct)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-border-subtle text-[10px] font-mono text-text-muted">
                    <span>
                      In: {svc.incomingRps} · Done: {svc.completedRps} · Shed:{" "}
                      {svc.rejectedRps} req/s
                    </span>
                    <span>
                      p50 {svc.p50LatencyMs}ms · p95 {svc.p95LatencyMs}ms · p99{" "}
                      {svc.p99LatencyMs}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Cluster & Replica Table */}
            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-semibold text-foreground">
                  Cluster Scheduling &amp; Replica Lifecycle ({replicasList.length})
                </span>
                <span className="text-text-muted">
                  Allocated CPU {capacityState.cluster.allocatedCpuMillicores}/
                  {capacityState.cluster.allocatableCpuMillicores}m · Pending{" "}
                  {capacityState.cluster.fragmentedPendingPods}
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {replicasList.slice(0, 24).map((rep) => (
                  <div
                    key={rep.id}
                    className="p-1.5 rounded-md bg-surface-03 border border-border-subtle text-[10px] font-mono"
                  >
                    <div className="flex justify-between">
                      <span className="text-foreground truncate">{rep.id}</span>
                      <span className="text-text-secondary">{rep.state}</span>
                    </div>
                    <div className="text-text-muted mt-0.5">
                      {rep.nodeId} · CPU {rep.cpuUtilizationPct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {capacityState && activeTab === "queueing" && (
          <div className="space-y-3">
            {(!capacityState.queueingAnalysis.mmc.applicable ||
              !capacityState.queueingAnalysis.mm1.applicable) && (
              <div className="p-2.5 rounded-md bg-surface-03 border border-border-strong flex items-start gap-2 text-xs font-mono">
                <AlertTriangleIcon className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">
                    Queueing Theory Steady-State Guardrail Triggered (ρ ≥ 1.0)
                  </div>
                  <div className="text-text-secondary text-[11px] mt-0.5">
                    {capacityState.queueingAnalysis.mmc.caveat}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {[
                capacityState.queueingAnalysis.mm1,
                capacityState.queueingAnalysis.mmc,
              ].map((q) => (
                <div
                  key={q.model}
                  className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2 text-[11px] font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      Analytical Model: {q.model}{" "}
                      {q.model === "MMc" ? `(c=${q.servers} servers)` : "(1 pooled server)"}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono rounded-md border-border-default bg-surface-03"
                    >
                      ρ = {q.rhoUtilization} · {q.applicable ? "Stable" : "Unbounded"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="p-1.5 rounded-md bg-surface-03 border border-border-subtle">
                      <div className="text-text-muted">Prob. Wait (Erlang-C)</div>
                      <div className="text-foreground font-semibold">
                        {(q.probWaitErlangC * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-1.5 rounded-md bg-surface-03 border border-border-subtle">
                      <div className="text-text-muted">Expected Queue Wait (Wq)</div>
                      <div className="text-foreground font-semibold">
                        {q.expectedWaitQueueMsWq !== null
                          ? `${q.expectedWaitQueueMsWq} ms`
                          : "N/A (ρ ≥ 1)"}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-md bg-surface-03 border border-border-subtle">
                      <div className="text-text-muted">Total Residence Time (W)</div>
                      <div className="text-foreground font-semibold">
                        {q.expectedTotalTimeMsW !== null
                          ? `${q.expectedTotalTimeMsW} ms`
                          : "N/A (ρ ≥ 1)"}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-md bg-surface-03 border border-border-subtle">
                      <div className="text-text-muted">Little&apos;s Law (L = λ·W)</div>
                      <div className="text-foreground font-semibold">
                        {q.littlesLawL !== null ? `${q.littlesLawL} req` : "N/A (Unstable)"}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted">{q.caveat}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {capacityState && activeTab === "autoscaling" && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
                <LayersIcon className="w-3.5 h-3.5 text-text-secondary" />
                Autoscaling Decision Timeline ({capacityState.scalingDecisions.length})
              </div>
              {capacityState.scalingDecisions.length === 0 ? (
                <div className="text-[11px] font-mono text-text-muted">
                  No replica scale transitions executed during this scenario (fixed policy or within deadband tolerance).
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {capacityState.scalingDecisions.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-md bg-surface-03 border border-border-subtle text-[10px] font-mono"
                    >
                      <div>
                        <span className="text-foreground font-semibold">
                          t={d.atMs}ms · {d.serviceId} ({d.mode})
                        </span>
                        <div className="text-text-secondary mt-0.5">{d.reason}</div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono rounded-md border-border-strong bg-surface-04"
                      >
                        {d.fromReplicas} → {d.toReplicas} replicas
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-foreground">
                  Past-Only Forecasting Audit (Zero Future Leakage)
                </span>
                <span className="text-[10px] text-text-muted">
                  Evaluated from strictly causal history[0..t-1]
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {capacityState.forecastPoints.map((fp) => (
                  <div
                    key={fp.atMs}
                    className="p-1.5 rounded-md bg-surface-03 border border-border-subtle text-[10px] font-mono"
                  >
                    <div className="text-text-muted">t={fp.atMs}ms</div>
                    <div className="text-foreground">
                      Obs {fp.observedRps} / Fcst {fp.forecastNextRps}
                    </div>
                    <div className="text-text-secondary">
                      Err {fp.forecastErrorPct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {capacityState && activeTab === "bottlenecks" && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
                <DatabaseIcon className="w-3.5 h-3.5 text-text-secondary" />
                Detected Capacity Bottlenecks ({capacityState.bottlenecks.length})
              </div>
              {capacityState.bottlenecks.length === 0 ? (
                <div className="text-[11px] font-mono text-text-muted">
                  No saturated resource or downstream dependency bottleneck detected at final state.
                </div>
              ) : (
                capacityState.bottlenecks.map((bn, idx) => (
                  <div
                    key={`${bn.serviceId}-${bn.limitingResource}-${idx}`}
                    className="p-2 rounded-md bg-surface-03 border border-border-default text-[11px] font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {bn.serviceId} · {bn.limitingResource}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono rounded-md border-border-strong bg-surface-04"
                      >
                        {bn.saturationPct}% saturated · {bn.affectedRps} req/s
                      </Badge>
                    </div>
                    <div className="text-text-secondary">{bn.explanation}</div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="text-xs font-mono font-semibold text-foreground">
                Evidence-Backed Capacity &amp; Right-Sizing Recommendations
              </div>
              {capacityState.recommendations.length === 0 ? (
                <div className="text-[11px] font-mono text-text-muted">
                  Fleet utilization is within target headroom envelope; no resize action needed.
                </div>
              ) : (
                capacityState.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2 rounded-md bg-surface-03 border border-border-subtle text-[11px] font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {rec.observedProblem}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono rounded-md border-border-default"
                      >
                        Confidence: {rec.confidence}
                      </Badge>
                    </div>
                    <div className="text-text-secondary">
                      Metric: {rec.supportingMetric}
                    </div>
                    <div className="text-foreground">
                      Action: {rec.suggestedChange}
                    </div>
                    <div className="text-text-muted text-[10px]">
                      Effect: {rec.expectedEffect} · Trade-off: {rec.tradeOff}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {capacityState && activeTab === "cost_pareto" && (
          <div className="space-y-3">
            {/* Cost Breakdown */}
            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="font-semibold text-foreground">
                  Synthetic Time-Based Cost Attribution ({capacityState.cost.currency})
                </span>
                <span className="text-[10px] text-text-muted">
                  {capacityState.cost.provenanceLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono">
                <div className="p-1.5 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted">Compute Window</div>
                  <div className="text-foreground font-semibold">
                    ${capacityState.cost.computeCostUsd}
                  </div>
                </div>
                <div className="p-1.5 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted">Memory Window</div>
                  <div className="text-foreground font-semibold">
                    ${capacityState.cost.memoryCostUsd}
                  </div>
                </div>
                <div className="p-1.5 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted">Requests + Net</div>
                  <div className="text-foreground font-semibold">
                    $
                    {(
                      capacityState.cost.requestCostUsd +
                      capacityState.cost.networkCostUsd
                    ).toFixed(4)}
                  </div>
                </div>
                <div className="p-1.5 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted">Monthly Run Rate</div>
                  <div className="text-foreground font-semibold">
                    ${capacityState.cost.projectedMonthlyCostUsd}
                  </div>
                </div>
                <div className="p-1.5 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted">Cost / Good Req</div>
                  <div className="text-foreground font-semibold">
                    {capacityState.cost.costPerSuccessfulRequestUsd !== null
                      ? `$${capacityState.cost.costPerSuccessfulRequestUsd}`
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Pareto Frontier */}
            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="text-xs font-mono font-semibold text-foreground">
                Pareto Frontier (Replicas vs Monthly Cost vs Est. p95 vs Headroom)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] font-mono">
                  <thead>
                    <tr className="border-b border-border-subtle text-text-muted">
                      <th className="py-1 pr-2">Replicas</th>
                      <th className="py-1 pr-2">Est. Monthly USD</th>
                      <th className="py-1 pr-2">Cap (req/s)</th>
                      <th className="py-1 pr-2">Est. p95 (ms)</th>
                      <th className="py-1 pr-2">Headroom</th>
                      <th className="py-1 pr-2">Frontier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capacityState.paretoFrontier.map((c) => (
                      <tr
                        key={c.replicas}
                        className="border-b border-border-subtle/50 text-foreground"
                      >
                        <td className="py-1 pr-2 font-semibold">{c.replicas}</td>
                        <td className="py-1 pr-2">${c.monthlyComputeCostUsd}</td>
                        <td className="py-1 pr-2">{c.effectiveCapacityRps}</td>
                        <td className="py-1 pr-2">{c.estimatedP95Ms}ms</td>
                        <td className="py-1 pr-2">{c.headroomPct}%</td>
                        <td className="py-1 pr-2">
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono rounded-md border-border-default bg-surface-03"
                          >
                            {c.meetsConstraints
                              ? "Feasible Pareto"
                              : c.paretoEfficient
                                ? "Pareto"
                                : "Dominated"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side-by-Side Strategy Comparison */}
            <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
              <div className="text-xs font-mono font-semibold text-foreground">
                Scaling Strategy Comparison Matrix (Fixed vs HPA vs Predictive vs N+2)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] font-mono">
                  <thead>
                    <tr className="border-b border-border-subtle text-text-muted">
                      <th className="py-1 pr-2">Strategy</th>
                      <th className="py-1 pr-2">Ready Pods</th>
                      <th className="py-1 pr-2">Peak Q</th>
                      <th className="py-1 pr-2">p95 ms</th>
                      <th className="py-1 pr-2">Rejected</th>
                      <th className="py-1 pr-2">Monthly USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr
                        key={row.label}
                        className="border-b border-border-subtle/50 text-foreground"
                      >
                        <td className="py-1 pr-2 font-semibold">{row.label}</td>
                        <td className="py-1 pr-2">{row.finalReadyReplicas}</td>
                        <td className="py-1 pr-2">{row.peakQueueDepth}</td>
                        <td className="py-1 pr-2">{row.p95LatencyMs}ms</td>
                        <td className="py-1 pr-2">{row.rejectedRequests}</td>
                        <td className="py-1 pr-2">
                          ${row.projectedMonthlyCostUsd}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {capacityState && activeTab === "invariants" && (
          <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldIcon className="w-3.5 h-3.5 text-text-secondary" />
                Capacity Verification Invariants
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-mono rounded-md border-border-strong bg-surface-03"
              >
                {capacityState.invariants.allPassed
                  ? "ALL INVARIANTS PASSED"
                  : `${capacityState.invariants.violations.length} VIOLATION(S)`}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono">
              {(
                [
                  ["Replica bounds [min, max]", capacityState.invariants.replicaBoundsOk],
                  [
                    "Unready replicas contribute zero capacity",
                    capacityState.invariants.unreadyZeroCapacityOk,
                  ],
                  [
                    "Utilization derived from modeled demand",
                    capacityState.invariants.utilizationGroundedOk,
                  ],
                  ["Queue depth non-negative", capacityState.invariants.queueNonNegativeOk],
                  [
                    "Completed traffic bounded by capacity",
                    capacityState.invariants.completedWithinCapacityOk,
                  ],
                  [
                    "Scaling policy constraints respected",
                    capacityState.invariants.scalingPolicyRespectedOk,
                  ],
                  [
                    "Time-based cost attribution non-negative",
                    capacityState.invariants.costGroundedOk,
                  ],
                  [
                    "Analytical M/M/1 & M/M/c stability enforced",
                    capacityState.invariants.analyticalAssumptionsEnforcedOk,
                  ],
                  [
                    "Forecast uses zero future observations",
                    capacityState.invariants.noFutureForecastLeakageOk,
                  ],
                  [
                    "Recommendations cite concrete evidence",
                    capacityState.invariants.recommendationsValidOk,
                  ],
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

