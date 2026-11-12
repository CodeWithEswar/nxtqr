"use client";

import * as React from "react";
import {
  ActivityIcon,
  CloseIcon,
  CpuIcon,
  DatabaseIcon,
  LayersIcon,
  PlayIcon,
  RefreshIcon,
  ShieldIcon,
} from "@nxtqr/icons";
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";
import {
  DEPLOYMENT_PRESET_METADATA,
  compareDeploymentStrategies,
  createDeploymentPresetScenario,
  type DeploymentPresetId,
  type DeploymentStrategy,
} from "@nxtqr/architecture-execution";

type DeploymentTab =
  | "topology_revisions"
  | "replicas_probes"
  | "progressive_gates"
  | "compatibility_flags"
  | "rollback_incidents_compare"
  | "invariants_metrics";

const STRATEGY_QUICK_OPTIONS: Array<{
  id: DeploymentStrategy;
  label: string;
}> = [
  { id: "canary", label: "Canary" },
  { id: "rolling_update", label: "Rolling Update" },
  { id: "blue_green", label: "Blue-Green" },
  { id: "recreate", label: "Recreate" },
];

const COMPARE_PAIRS: Array<{
  id: string;
  label: string;
  baseline: DeploymentPresetId;
  variant: DeploymentPresetId;
}> = [
  {
    id: "rec_vs_roll",
    label: "Recreate Downtime vs Rolling Update",
    baseline: "recreate_downtime",
    variant: "rolling_update_success",
  },
  {
    id: "roll_vs_bg",
    label: "Rolling Update vs Blue-Green",
    baseline: "rolling_update_success",
    variant: "blue_green_success",
  },
  {
    id: "can_err_vs_ok",
    label: "Canary Error Regression vs Healthy Canary",
    baseline: "canary_error_regression",
    variant: "multi_stage_canary",
  },
  {
    id: "canary_vs_immediate",
    label: "Multi-Stage Canary vs Recreate Immediate Cutover",
    baseline: "recreate_success",
    variant: "multi_stage_canary",
  },
];

function badgeToneClass(
  kind: "good" | "bad" | "warn" | "neutral"
): string {
  switch (kind) {
    case "good":
      return "border-border-strong bg-surface-04 text-foreground";
    case "bad":
      return "border-border-strong bg-surface-03 text-text-secondary";
    case "warn":
      return "border-border-default bg-surface-03 text-text-secondary";
    default:
      return "border-border-subtle bg-surface-01 text-text-muted";
  }
}

export function DeploymentWorkspace() {
  const toggleDeploymentWorkspace = useExecutionStore(
    (s) => s.toggleDeploymentWorkspace
  );
  const activeDeploymentScenario = useExecutionStore(
    (s) => s.activeDeploymentScenario
  );
  const setDeploymentScenario = useExecutionStore(
    (s) => s.setDeploymentScenario
  );
  const setScenarioPreset = useExecutionStore((s) => s.setScenarioPreset);
  const runDeploymentSimulation = useExecutionStore(
    (s) => s.runDeploymentSimulation
  );
  const currentFrame = useExecutionStore((s) => s.playbackState.currentFrame);
  const trace = useExecutionStore((s) => s.trace);

  const [activeTab, setActiveTab] =
    React.useState<DeploymentTab>("topology_revisions");
  const [comparePairId, setComparePairId] = React.useState<string>("rec_vs_roll");

  const scenario = React.useMemo(
    () =>
      activeDeploymentScenario ??
      createDeploymentPresetScenario("multi_stage_canary"),
    [activeDeploymentScenario]
  );

  // Auto-run default deployment scenario when opened without an active deployment trace
  React.useEffect(() => {
    if (!currentFrame?.runtimeState?.deploymentState) {
      runDeploymentSimulation(scenario);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const depState = React.useMemo(() => {
    if (currentFrame?.runtimeState?.deploymentState) {
      return currentFrame.runtimeState.deploymentState;
    }
    const lastFrame = trace?.frames?.[trace.frames.length - 1];
    return lastFrame?.runtimeState?.deploymentState ?? null;
  }, [currentFrame, trace]);

  const deploymentsList = React.useMemo(
    () => (depState ? Object.values(depState.deployments) : []),
    [depState]
  );
  const primaryDep = deploymentsList[0] ?? null;

  const revisionsList = React.useMemo(
    () => (depState ? Object.values(depState.revisions) : []),
    [depState]
  );
  const replicasList = React.useMemo(
    () => (depState ? Object.values(depState.replicas) : []),
    [depState]
  );
  const allocationsList = React.useMemo(
    () => (depState ? Object.values(depState.trafficAllocations) : []),
    [depState]
  );
  const statsList = React.useMemo(
    () => (depState ? Object.values(depState.revisionStats) : []),
    [depState]
  );

  const comparison = React.useMemo(() => {
    const pair =
      COMPARE_PAIRS.find((p) => p.id === comparePairId) ?? COMPARE_PAIRS[0]!;
    return compareDeploymentStrategies(
      createDeploymentPresetScenario(pair.baseline),
      createDeploymentPresetScenario(pair.variant)
    );
  }, [comparePairId]);

  const handleInjectCommand = (
    cmd: "pause" | "resume" | "manual_rollback"
  ) => {
    const atMs = Math.max(
      20,
      Math.min(
        scenario.limits.maxVirtualDurationMs - 40,
        depState ? depState.virtualTimeMs : 120
      )
    );
    const updated = {
      ...scenario,
      commands: [
        ...scenario.commands,
        {
          id: `cmd_ui_${cmd}_${Date.now()}`,
          atMs,
          command: cmd,
          description: `Operator ${cmd.replace("_", " ")} at ${atMs}ms`,
        },
      ],
    };
    setDeploymentScenario(updated);
    runDeploymentSimulation(updated);
  };

  const handleQuickStrategySwitch = (strategy: DeploymentStrategy) => {
    const basePreset: DeploymentPresetId =
      strategy === "canary"
        ? "multi_stage_canary"
        : strategy === "rolling_update"
          ? "rolling_update_success"
          : strategy === "blue_green"
            ? "blue_green_success"
            : "recreate_downtime";
    setScenarioPreset(basePreset);
  };

  const metrics = depState?.metrics;

  return (
    <div
      role="region"
      aria-label="Distributed Deployment, Blue-Green, Canary & Progressive Delivery Workspace"
      className="fixed bottom-4 right-4 z-40 w-[960px] max-w-[calc(100vw-2rem)] h-[660px] max-h-[calc(100vh-5rem)] flex flex-col rounded-md bg-surface-02 border border-border-default shadow-level-2 overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-surface-01 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <LayersIcon className="w-4 h-4 text-foreground shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-mono font-semibold text-foreground truncate">
              Distributed Deployment & Progressive Delivery Studio
            </h2>
            <p className="text-[10px] font-mono text-text-muted truncate">
              Recreate · Rolling · Blue-Green · Canary Gates · Health Probes · Feature Flags · Rollback
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <Select
            value={scenario.presetId ?? "multi_stage_canary"}
            onValueChange={(val) =>
              setScenarioPreset(val as DeploymentPresetId)
            }
          >
            <SelectTrigger className="h-7 w-[220px] text-[10px] font-mono bg-surface-03 border-border-default rounded-md">
              <SelectValue placeholder="Deployment Preset (36)" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default rounded-md max-h-[340px]">
              {DEPLOYMENT_PRESET_METADATA.map((meta) => (
                <SelectItem
                  key={meta.id}
                  value={meta.id}
                  className="text-[10px] font-mono"
                >
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInjectCommand("pause")}
            title="Schedule operator PAUSE command on active rollout"
            className="h-7 px-2 text-[10px] font-mono bg-surface-01 border-border-default hover:bg-surface-03 rounded-md"
          >
            Pause
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInjectCommand("resume")}
            title="Schedule operator RESUME command on paused rollout"
            className="h-7 px-2 text-[10px] font-mono bg-surface-01 border-border-default hover:bg-surface-03 rounded-md"
          >
            Resume
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInjectCommand("manual_rollback")}
            title="Trigger manual operator rollback to stable revision"
            className="h-7 px-2 text-[10px] font-mono bg-surface-01 border-border-default hover:bg-surface-03 rounded-md gap-1"
          >
            <RefreshIcon className="w-3 h-3" />
            Rollback
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => runDeploymentSimulation(scenario)}
            className="h-7 px-2.5 text-[10px] font-mono bg-foreground text-background hover:bg-neutral-200 rounded-md gap-1"
          >
            <PlayIcon className="w-3 h-3" />
            Run
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDeploymentWorkspace(false)}
            aria-label="Close Deployment Workspace"
            className="h-7 w-7 p-0 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Strategy Quick Switcher Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border-subtle bg-surface-01 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-text-muted uppercase">
            Quick Strategy:
          </span>
          {STRATEGY_QUICK_OPTIONS.map((opt) => {
            const isSelected = primaryDep?.strategy === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleQuickStrategySwitch(opt.id)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-mono rounded-md border transition-colors",
                  isSelected
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                    : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground hover:bg-surface-03"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="text-[10px] font-mono text-text-muted">
          t={depState?.virtualTimeMs ?? 0}ms · step{" "}
          {currentFrame ? currentFrame.frameIndex + 1 : 0}/
          {trace?.frames.length ?? 0}
        </div>
      </div>

      {/* KPI Strip (6 Compact Monochrome Cards) */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 px-3 py-2 border-b border-border-subtle bg-surface-01 shrink-0">
        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            State & Stage
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground truncate">
            {primaryDep?.state ?? "PENDING"}
          </div>
          <div className="text-[9px] font-mono text-text-secondary truncate">
            {primaryDep?.currentStageId
              ? `${primaryDep.currentStageId} (${primaryDep.targetCandidateWeightPct}%)`
              : `${primaryDep?.strategy ?? "n/a"} · ${primaryDep?.targetCandidateWeightPct ?? 0}%`}
          </div>
        </div>

        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Ready / Replicas
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {metrics?.readyReplicas ?? 0} / {metrics?.totalReplicas ?? 0}
          </div>
          <div className="text-[9px] font-mono text-text-secondary">
            Unready: {metrics?.unreadyReplicas ?? 0}
          </div>
        </div>

        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Cand / Stable Err
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {((metrics?.candidateErrorRate ?? 0) * 100).toFixed(2)}%
          </div>
          <div className="text-[9px] font-mono text-text-secondary">
            Stable: {((metrics?.stableErrorRate ?? 0) * 100).toFixed(2)}%
          </div>
        </div>

        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Cand / Stable p95
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {metrics?.candidateP95Ms ?? 0} ms
          </div>
          <div className="text-[9px] font-mono text-text-secondary">
            Stable: {metrics?.stableP95Ms ?? 0} ms
          </div>
        </div>

        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Gates P / F / Hold
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {metrics?.gatesPassed ?? 0} / {metrics?.gatesFailed ?? 0} /{" "}
            {metrics?.gatesInconclusiveOrNoData ?? 0}
          </div>
          <div className="text-[9px] font-mono text-text-secondary">
            Reqs: {metrics?.totalRequests ?? 0}
          </div>
        </div>

        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Restarts & Time
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {metrics?.restartsTriggered ?? 0} restarts
          </div>
          <div className="text-[9px] font-mono text-text-secondary">
            Dur:{" "}
            {metrics?.deploymentDurationMs !== null &&
            metrics?.deploymentDurationMs !== undefined
              ? `${metrics.deploymentDurationMs}ms`
              : metrics?.rollbackDurationMs !== null &&
                  metrics?.rollbackDurationMs !== undefined
                ? `RB ${metrics.rollbackDurationMs}ms`
                : "Active"}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border-subtle bg-surface-01 overflow-x-auto shrink-0">
        {(
          [
            { id: "topology_revisions", label: "Topology & Revisions" },
            { id: "replicas_probes", label: "Replicas & Health Probes" },
            { id: "progressive_gates", label: "Progressive & Gates" },
            { id: "compatibility_flags", label: "Compatibility & Flags" },
            {
              id: "rollback_incidents_compare",
              label: "Rollback, Incidents & Compare",
            },
            { id: "invariants_metrics", label: "Invariants & Metrics" },
          ] as Array<{ id: DeploymentTab; label: string }>
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-mono rounded-md whitespace-nowrap transition-colors border",
              activeTab === tab.id
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                : "bg-transparent border-transparent text-text-muted hover:text-foreground hover:bg-surface-03"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
        {!depState ? (
          <div className="p-4 rounded-md bg-surface-01 border border-border-subtle text-text-muted text-[11px]">
            Click Run or pick a Deployment Preset above to generate a deterministic rollout trace.
          </div>
        ) : null}

        {/* TAB 1: TOPOLOGY & REVISIONS */}
        {depState && activeTab === "topology_revisions" && (
          <div className="space-y-3">
            {/* Active Event Banner */}
            {currentFrame?.stepExplanation && (
              <div className="px-3 py-2 rounded-md bg-surface-01 border border-border-default flex items-center justify-between gap-2">
                <div className="text-[11px] text-foreground">
                  <span className="text-text-muted mr-2">
                    [{currentFrame.virtualTimeMs}ms]
                  </span>
                  {currentFrame.stepExplanation}
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] border-border-default text-text-secondary rounded-md shrink-0"
                >
                  {currentFrame.stepTitle}
                </Badge>
              </div>
            )}

            {/* Traffic Allocation Strip */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase text-text-muted flex items-center gap-1.5">
                <ActivityIcon className="w-3.5 h-3.5" />
                Weighted Traffic Allocation & Endpoint Routing
              </div>
              {allocationsList.map((alloc) => (
                <div
                  key={alloc.serviceId}
                  className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-foreground">
                        Service: {alloc.serviceId}
                      </span>
                      {alloc.noHealthyEndpoints && (
                        <Badge
                          variant="outline"
                          className="text-[9px] border-border-strong bg-surface-03 text-foreground rounded-md"
                        >
                          NO HEALTHY ENDPOINTS (DOWNTIME WINDOW)
                        </Badge>
                      )}
                      {alloc.propagationPendingUntilMs &&
                        depState.virtualTimeMs < alloc.propagationPendingUntilMs && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-border-default bg-surface-03 text-text-secondary rounded-md"
                          >
                            Propagation pending until{" "}
                            {alloc.propagationPendingUntilMs}ms
                          </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                      {alloc.weights.map((w) => (
                        <span key={w.revisionId}>
                          {w.revisionId}: {w.percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-md overflow-hidden bg-surface-03 border border-border-inset flex">
                    {alloc.noHealthyEndpoints ? (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-text-muted">
                        0% Ready Endpoints Available
                      </div>
                    ) : (
                      alloc.weights
                        .filter((w) => w.percentage > 0)
                        .map((w, idx) => (
                          <div
                            key={w.revisionId}
                            style={{ width: `${w.percentage}%` }}
                            className={cn(
                              "h-full flex items-center justify-center text-[9px] truncate transition-all",
                              idx === 0
                                ? "bg-surface-04 text-text-secondary border-r border-border-default"
                                : "bg-foreground text-background font-semibold"
                            )}
                          >
                            {w.percentage >= 10
                              ? `${w.revisionId} (${w.percentage}%)`
                              : ""}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Deployment & Revision Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {deploymentsList.map((dep) => (
                <div
                  key={dep.id}
                  className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-foreground">
                      {dep.serviceId} ({dep.id})
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] rounded-md",
                        badgeToneClass(
                          dep.state === "COMPLETED"
                            ? "good"
                            : dep.state === "FAILED" || dep.state === "ROLLED_BACK"
                              ? "bad"
                              : "warn"
                        )
                      )}
                    >
                      {dep.state}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-text-secondary">
                    <div>Strategy: {dep.strategy}</div>
                    <div>
                      Blue/Green:{" "}
                      <span className="text-foreground font-semibold">
                        {dep.activeEnvironment.toUpperCase()}
                      </span>
                    </div>
                    <div>Stable Rev: {dep.stableRevisionId}</div>
                    <div>Candidate Rev: {dep.candidateRevisionId}</div>
                    <div>
                      Target Weight: {dep.targetCandidateWeightPct}% (Obs:{" "}
                      {dep.observedCandidateWeightPct}%)
                    </div>
                    <div>
                      Surge/Unavail Budget: +{dep.maxSurgeCount} / -
                      {dep.maxUnavailableCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Immutable Revisions Table */}
            <div className="rounded-md bg-surface-01 border border-border-default overflow-hidden">
              <div className="px-2.5 py-1.5 bg-surface-03 border-b border-border-subtle text-[10px] uppercase text-text-secondary">
                Immutable Application Revisions & Telemetry
              </div>
              <div className="divide-y divide-border-subtle">
                {revisionsList.map((rev) => {
                  const st = statsList.find((s) => s.revisionId === rev.id);
                  return (
                    <div
                      key={rev.id}
                      className="px-2.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[10px]"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-md border-border-strong text-foreground text-[9px]"
                        >
                          {rev.version}
                        </Badge>
                        <span className="font-semibold text-foreground">
                          {rev.id} ({rev.serviceId})
                        </span>
                        <span className="text-text-muted">
                          artifact={rev.artifactId} · desired={rev.desiredReplicas}
                        </span>
                        {!rev.available && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-border-strong bg-surface-03 text-text-secondary rounded-md"
                          >
                            UNAVAILABLE
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-text-secondary">
                        <span>Reqs: {st?.requests ?? 0}</span>
                        <span>Errs: {st?.errors ?? 0}</span>
                        <span>
                          Err%: {((st?.errorRate ?? 0) * 100).toFixed(2)}%
                        </span>
                        <span>p95: {st?.p95LatencyMs ?? 0}ms</span>
                        <span>Share: {st?.observedSharePct ?? 0}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REPLICAS & HEALTH PROBES */}
        {depState && activeTab === "replicas_probes" && (
          <div className="space-y-3">
            {/* Capacity & Budgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {deploymentsList.map((dep) => (
                <div
                  key={dep.id}
                  className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1 text-[10px]"
                >
                  <div className="font-semibold text-foreground">
                    {dep.serviceId} Capacity & Budgets
                  </div>
                  <div className="text-text-secondary">
                    Ready Stable: {dep.readyStableReplicas} · Ready Candidate:{" "}
                    {dep.readyCandidateReplicas}
                  </div>
                  <div className="text-text-secondary">
                    Desired: {dep.desiredReplicas} · Available:{" "}
                    {dep.availableReplicas} · Surge: {dep.surgeReplicas}/
                    {dep.maxSurgeCount} · Unavail: {dep.unavailableReplicas}/
                    {dep.maxUnavailableCount}
                  </div>
                  {dep.pendingCapacityReplicas > 0 && (
                    <div className="text-foreground font-semibold">
                      PENDING CAPACITY: {dep.pendingCapacityReplicas} replica(s) unschedulable
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Replica Matrix */}
            <div className="rounded-md bg-surface-01 border border-border-default overflow-hidden">
              <div className="px-2.5 py-1.5 bg-surface-03 border-b border-border-subtle text-[10px] uppercase text-text-secondary flex items-center gap-1.5">
                <CpuIcon className="w-3.5 h-3.5" />
                Replica Lifecycle & Connection Draining Matrix ({replicasList.length})
              </div>
              <div className="divide-y divide-border-subtle max-h-[240px] overflow-y-auto">
                {replicasList.map((rep) => (
                  <div
                    key={rep.id}
                    className="px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-foreground">
                        {rep.id}
                      </span>
                      <span className="text-text-muted">
                        rev={rep.revisionId} · {rep.region}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] rounded-md",
                          badgeToneClass(
                            rep.state === "READY"
                              ? "good"
                              : rep.state === "FAILED" || rep.state === "TERMINATED"
                                ? "bad"
                                : "warn"
                          )
                        )}
                      >
                        {rep.state}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-text-secondary">
                      <span>
                        Startup:{rep.startupPassed ? "OK" : ".."} Ready:
                        {rep.readinessPassed ? "OK" : "NO"} Live:
                        {rep.livenessPassed ? "OK" : "FAIL"}
                      </span>
                      <span>Restarts: {rep.restartCount}</span>
                      {rep.longLivedSessions > 0 && (
                        <span className="text-foreground">
                          LongLived: {rep.longLivedSessions}
                        </span>
                      )}
                      {rep.nextRestartAtMs && (
                        <span>Backoff until {rep.nextRestartAtMs}ms</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Probes */}
            <div className="rounded-md bg-surface-01 border border-border-default overflow-hidden">
              <div className="px-2.5 py-1.5 bg-surface-03 border-b border-border-subtle text-[10px] uppercase text-text-secondary">
                Recent Health Probes (Startup · Readiness · Liveness)
              </div>
              <div className="divide-y divide-border-subtle max-h-[180px] overflow-y-auto">
                {depState.recentProbes.length === 0 ? (
                  <div className="px-2.5 py-2 text-[10px] text-text-muted">
                    No probe events captured yet at t={depState.virtualTimeMs}ms.
                  </div>
                ) : (
                  depState.recentProbes
                    .slice()
                    .reverse()
                    .map((p) => (
                      <div
                        key={p.id}
                        className="px-2.5 py-1.5 flex items-center justify-between gap-2 text-[10px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted">[{p.atMs}ms]</span>
                          <span className="font-semibold text-foreground">
                            {p.replicaId}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] rounded-md border-border-default text-text-secondary"
                          >
                            {p.probeType}
                          </Badge>
                          <span className="text-text-secondary truncate">
                            {p.transitionNote}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] rounded-md",
                            badgeToneClass(p.passed ? "good" : "bad")
                          )}
                        >
                          {p.passed ? "PASS" : "FAIL"} (ok={p.consecutiveSuccesses}
                          /fail={p.consecutiveFailures})
                        </Badge>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROGRESSIVE & GATES */}
        {depState && activeTab === "progressive_gates" && (
          <div className="space-y-3">
            {/* Caveats Notice */}
            <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1">
              <div className="text-[10px] font-semibold uppercase text-text-secondary">
                Statistical & Rollout Precision Caveats
              </div>
              {depState.caveats.map((c, idx) => (
                <div key={idx} className="text-[10px] text-text-muted">
                  • {c}
                </div>
              ))}
            </div>

            {deploymentsList.map((dep) => (
              <div
                key={dep.id}
                className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">
                    {dep.serviceId} Progressive Stages & Promotion Gates
                  </span>
                  <span className="text-[10px] text-text-secondary">
                    Stage {dep.currentStageIndex + 1}/{Math.max(1, dep.totalStages)}{" "}
                    {dep.paused ? `(PAUSED: ${dep.pauseReason ?? "Manual"})` : ""}
                  </span>
                </div>

                {/* Gate Evaluation Cards */}
                {dep.gateEvaluations.length === 0 ? (
                  <div className="text-[10px] text-text-muted">
                    Strategy uses readiness cutover ({dep.strategy}); no progressive canary gates active.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {dep.gateEvaluations.map((g) => (
                      <div
                        key={g.gateId}
                        className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1 text-[10px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground truncate">
                            {g.gateName}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] rounded-md",
                              badgeToneClass(
                                g.outcome === "PASS"
                                  ? "good"
                                  : g.outcome === "FAIL"
                                    ? "bad"
                                    : "warn"
                              )
                            )}
                          >
                            {g.outcome}
                          </Badge>
                        </div>
                        <div className="text-text-secondary">
                          Threshold: {g.thresholdLabel} · Samples: {g.sampleCount}{" "}
                          · Streak: {g.consecutivePasses}
                        </div>
                        <div className="text-text-secondary">
                          Observed:{" "}
                          {g.observedValue !== null ? g.observedValue : "n/a"} vs
                          Baseline:{" "}
                          {g.baselineValue !== null ? g.baselineValue : "n/a"}
                        </div>
                        <div className="text-text-muted">{g.explanation}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stage Timeline */}
                <div className="border-t border-border-subtle pt-2 space-y-1">
                  <div className="text-[9px] uppercase text-text-muted">
                    Deployment Timeline
                  </div>
                  {dep.timeline.map((t, idx) => (
                    <div
                      key={idx}
                      className="text-[10px] text-text-secondary flex items-center gap-2"
                    >
                      <span className="text-text-muted w-[54px] shrink-0">
                        [{t.atMs}ms]
                      </span>
                      <span className="text-foreground font-semibold">
                        {t.kind}
                      </span>
                      <span className="truncate">{t.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: COMPATIBILITY & FLAGS */}
        {depState && activeTab === "compatibility_flags" && (
          <div className="space-y-3">
            {/* Database & API/Event Compatibility */}
            <div className="rounded-md bg-surface-01 border border-border-default overflow-hidden">
              <div className="px-2.5 py-1.5 bg-surface-03 border-b border-border-subtle text-[10px] uppercase text-text-secondary flex items-center gap-1.5">
                <DatabaseIcon className="w-3.5 h-3.5" />
                Schema Migration (Expand-and-Contract), Contract Compatibility & Regions
              </div>
              <div className="divide-y divide-border-subtle">
                {deploymentsList.map((dep) => (
                  <div key={dep.id} className="p-2.5 space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {dep.serviceId} ({dep.id})
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] rounded-md",
                          badgeToneClass(
                            dep.compatibilityStatus === "compatible"
                              ? "good"
                              : "bad"
                          )
                        )}
                      >
                        {dep.compatibilityStatus}
                      </Badge>
                    </div>
                    <div className="text-text-secondary">
                      Migration Mode: {dep.migrationStatus}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(dep.regionalStatus).map(
                        ([region, rs]) => (
                          <div
                            key={region}
                            className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle text-[10px]"
                          >
                            {region}: {rs.weightPct}% ·{" "}
                            {rs.rolledBack
                              ? "ROLLED_BACK"
                              : rs.healthy
                                ? "HEALTHY"
                                : "DEGRADED"}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deterministic Feature Flags */}
            <div className="rounded-md bg-surface-01 border border-border-default overflow-hidden">
              <div className="px-2.5 py-1.5 bg-surface-03 border-b border-border-subtle text-[10px] uppercase text-text-secondary">
                Feature Flag Deterministic Evaluation ({depState.featureFlags.length})
              </div>
              {depState.featureFlags.length === 0 ? (
                <div className="p-2.5 text-[10px] text-text-muted">
                  No feature flags attached to this scenario.
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {depState.featureFlags.map((ff) => (
                    <div key={ff.key} className="p-2.5 space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          flag: {ff.key} (rev {ff.revision})
                        </span>
                        {ff.misconfigured && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-border-strong bg-surface-03 text-foreground rounded-md"
                          >
                            MISCONFIGURED RULE / STALE EXPOSURE
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                        {ff.sampleResults.map((sr) => (
                          <div
                            key={sr.identityId}
                            className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle text-text-secondary"
                          >
                            <div className="text-foreground font-semibold">
                              {sr.identityId} → {sr.enabled ? "ON" : "OFF"}
                            </div>
                            <div className="text-[9px] text-text-muted truncate">
                              cohort={sr.cohort} · {sr.region} · {sr.ruleMatched}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ROLLBACK, INCIDENTS & COMPARE */}
        {depState && activeTab === "rollback_incidents_compare" && (
          <div className="space-y-3">
            {/* Rollback State Machine */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {deploymentsList.map((dep) => (
                <div
                  key={dep.id}
                  className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5 text-[10px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      Rollback State: {dep.serviceId}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] rounded-md",
                        badgeToneClass(
                          dep.rollback.state === "COMPLETED"
                            ? "good"
                            : dep.rollback.state === "FAILED"
                              ? "bad"
                              : "neutral"
                        )
                      )}
                    >
                      {dep.rollback.state}
                    </Badge>
                  </div>
                  <div className="text-text-secondary">
                    From {dep.rollback.fromRevisionId} → To{" "}
                    {dep.rollback.toRevisionId}
                  </div>
                  {dep.rollback.reason && (
                    <div className="text-text-secondary">
                      Reason: {dep.rollback.reason}
                    </div>
                  )}
                  {dep.rollback.failureReason && (
                    <div className="text-foreground font-semibold">
                      Failure: {dep.rollback.failureReason}
                    </div>
                  )}
                  {dep.rollback.irreversibleDataWarning && (
                    <div className="px-2 py-1 rounded-md bg-surface-03 border border-border-strong text-foreground">
                      WARNING: Rollback restores code/routing only; irreversible schema or persisted data mutations are NOT undone.
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Deployment Incidents */}
            <div className="rounded-md bg-surface-01 border border-border-default overflow-hidden">
              <div className="px-2.5 py-1.5 bg-surface-03 border-b border-border-subtle text-[10px] uppercase text-text-secondary">
                Correlated Deployment Incidents ({depState.incidents.length})
              </div>
              {depState.incidents.length === 0 ? (
                <div className="p-2.5 text-[10px] text-text-muted">
                  No rollout-triggered incidents detected in this run.
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {depState.incidents.map((inc) => (
                    <div key={inc.id} className="p-2.5 space-y-1 text-[10px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {inc.summary}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-[9px] rounded-md border-border-default text-text-secondary"
                          >
                            {inc.causalStatus}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[9px] rounded-md border-border-strong text-foreground"
                          >
                            {inc.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-text-muted">
                        Correlated Revision: {inc.correlatedRevisionId} · Detected at{" "}
                        {inc.detectedAtMs}ms
                        {inc.resolvedAtMs !== undefined
                          ? ` · Resolved at ${inc.resolvedAtMs}ms`
                          : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Side-by-Side Strategy Comparison */}
            <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] uppercase text-text-secondary font-semibold">
                  Side-by-Side Deployment Strategy Comparison
                </span>
                <Select
                  value={comparePairId}
                  onValueChange={setComparePairId}
                >
                  <SelectTrigger className="h-7 w-[280px] text-[10px] font-mono bg-surface-03 border-border-default rounded-md">
                    <SelectValue placeholder="Comparison Pair" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-02 border-border-default rounded-md">
                    {COMPARE_PAIRS.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className="text-[10px] font-mono"
                      >
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
                <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1">
                  <div className="font-semibold text-foreground truncate">
                    Baseline: {comparison.baselineLabel}
                  </div>
                  <div className="text-text-secondary">
                    Cand Err:{" "}
                    {(comparison.baselineMetrics.candidateErrorRate * 100).toFixed(2)}%
                  </div>
                  <div className="text-text-secondary">
                    Cand p95: {comparison.baselineMetrics.candidateP95Ms} ms
                  </div>
                  <div className="text-text-secondary">
                    Completed: {comparison.baselineMetrics.completedDeployments} ·
                    Rolled Back:{" "}
                    {comparison.baselineMetrics.rolledBackDeployments}
                  </div>
                </div>

                <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1">
                  <div className="font-semibold text-foreground truncate">
                    Variant: {comparison.variantLabel}
                  </div>
                  <div className="text-text-secondary">
                    Cand Err:{" "}
                    {(comparison.variantMetrics.candidateErrorRate * 100).toFixed(2)}%
                  </div>
                  <div className="text-text-secondary">
                    Cand p95: {comparison.variantMetrics.candidateP95Ms} ms
                  </div>
                  <div className="text-text-secondary">
                    Completed: {comparison.variantMetrics.completedDeployments} ·
                    Rolled Back:{" "}
                    {comparison.variantMetrics.rolledBackDeployments}
                  </div>
                </div>

                <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1">
                  <div className="font-semibold text-foreground">
                    Comparison Delta
                  </div>
                  <div className="text-text-secondary">
                    Err Rate Delta:{" "}
                    {(comparison.deltas.errorRateDelta * 100).toFixed(2)} pp
                  </div>
                  <div className="text-text-secondary">
                    p95 Latency Delta: {comparison.deltas.candidateP95MsDelta} ms
                  </div>
                  <div className="text-text-secondary">
                    Duration Delta:{" "}
                    {comparison.deltas.durationMsDelta !== null
                      ? `${comparison.deltas.durationMsDelta} ms`
                      : "n/a"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: INVARIANTS & METRICS */}
        {depState && activeTab === "invariants_metrics" && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-md bg-surface-01 border border-border-default flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldIcon className="w-4 h-4 text-foreground" />
                <span className="text-[11px] font-semibold text-foreground">
                  14 Deployment Correctness Invariants
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] rounded-md",
                  badgeToneClass(depState.invariants.allPassed ? "good" : "bad")
                )}
              >
                {depState.invariants.allPassed
                  ? "ALL 14 INVARIANTS PASSED"
                  : `${depState.invariants.violations.length} VIOLATIONS`}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {(
                [
                  ["Immutable Revisions", depState.invariants.revisionsImmutableOk],
                  [
                    "Valid Replica Lifecycle Transitions",
                    depState.invariants.replicaTransitionsValidOk,
                  ],
                  [
                    "Unready Replicas Excluded from Routing",
                    depState.invariants.unreadyNotRoutedOk,
                  ],
                  [
                    "Rolling Update Surge & Unavailable Budgets",
                    depState.invariants.rollingBudgetsRespectedOk,
                  ],
                  [
                    "Traffic Weights Non-Negative & Balanced (100%)",
                    depState.invariants.trafficWeightsValidOk,
                  ],
                  [
                    "Canary Promotion Respects Gate Requirements",
                    depState.invariants.canaryGatesRespectedOk,
                  ],
                  [
                    "Missing Telemetry Never Silently Treated as Pass",
                    depState.invariants.missingSamplesNeverSilentPassOk,
                  ],
                  [
                    "Failed Gates Block Stage Promotion",
                    depState.invariants.failedGateBlocksPromotionOk,
                  ],
                  [
                    "Rollback Selects Eligible Revision / Fails Explicitly",
                    depState.invariants.rollbackEligibleRevisionOk,
                  ],
                  [
                    "Irreversible Data Preserved on Rollback",
                    depState.invariants.rollbackPreservesIrreversibleDataOk,
                  ],
                  [
                    "Paused Rollout Does Not Advance",
                    depState.invariants.pausedDoesNotAdvanceOk,
                  ],
                  [
                    "Deterministic Feature Flag Bucket Evaluation",
                    depState.invariants.featureFlagDeterministicOk,
                  ],
                  [
                    "Deployment Metrics Derived Strictly from Events",
                    depState.invariants.metricsFromEventsOk,
                  ],
                ] as Array<[string, boolean]>
              ).map(([label, ok]) => (
                <div
                  key={label}
                  className="px-2.5 py-1.5 rounded-md bg-surface-01 border border-border-subtle flex items-center justify-between text-[10px]"
                >
                  <span className="text-text-secondary">{label}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] rounded-md",
                      badgeToneClass(ok ? "good" : "bad")
                    )}
                  >
                    {ok ? "PASS" : "FAIL"}
                  </Badge>
                </div>
              ))}
            </div>

            {depState.invariants.violations.length > 0 && (
              <div className="p-2.5 rounded-md bg-surface-01 border border-border-strong space-y-1 text-[10px] text-foreground">
                <div className="font-semibold">Invariant Violations:</div>
                {depState.invariants.violations.map((v, i) => (
                  <div key={i}>• {v}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

