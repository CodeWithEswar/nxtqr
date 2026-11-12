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
  DISASTER_RECOVERY_PRESET_METADATA,
  compareRecoveryStrategies,
  createDisasterRecoveryPresetScenario,
  type DisasterRecoveryPresetId,
  type RecoveryArchitecture,
} from "@nxtqr/architecture-execution";

type DrTab =
  | "regions_failover"
  | "replication_rpo"
  | "backups_restore"
  | "dependencies_failback"
  | "drill_incidents_compare"
  | "invariants";

const ARCH_QUICK_OPTIONS: Array<{
  id: RecoveryArchitecture;
  label: string;
  preset: DisasterRecoveryPresetId;
}> = [
  { id: "active_passive", label: "Active-Passive", preset: "auto_failover_success" },
  { id: "active_active", label: "Active-Active", preset: "healthy_active_active" },
  { id: "warm_standby", label: "Warm Standby", preset: "warm_standby" },
  { id: "cold_standby", label: "Cold Standby", preset: "cold_standby" },
  { id: "backup_only", label: "Backup-Only", preset: "backup_restoration" },
];

const COMPARE_PAIRS: Array<{
  id: string;
  label: string;
  baseline: DisasterRecoveryPresetId;
  variant: DisasterRecoveryPresetId;
}> = [
  {
    id: "cold_vs_warm",
    label: "Cold Standby vs Warm Standby",
    baseline: "cold_standby",
    variant: "warm_standby",
  },
  {
    id: "async_vs_sync",
    label: "Async Write Loss vs Sync Zero Loss",
    baseline: "acknowledged_write_loss",
    variant: "zero_acknowledged_loss",
  },
  {
    id: "dns_vs_glb",
    label: "Stale DNS TTL vs Global Load Balancer",
    baseline: "stale_dns_cache",
    variant: "glb_failover",
  },
  {
    id: "backup_vs_passive",
    label: "Backup-Only Restore vs Active-Passive Failover",
    baseline: "backup_restoration",
    variant: "auto_failover_success",
  },
];

function toneClass(kind: "good" | "bad" | "warn" | "neutral"): string {
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

export function DisasterRecoveryWorkspace() {
  const toggleDisasterRecoveryWorkspace = useExecutionStore(
    (s) => s.toggleDisasterRecoveryWorkspace
  );
  const activeDisasterRecoveryScenario = useExecutionStore(
    (s) => s.activeDisasterRecoveryScenario
  );
  const setDisasterRecoveryScenario = useExecutionStore(
    (s) => s.setDisasterRecoveryScenario
  );
  const setScenarioPreset = useExecutionStore((s) => s.setScenarioPreset);
  const runDisasterRecoverySimulation = useExecutionStore(
    (s) => s.runDisasterRecoverySimulation
  );
  const currentFrame = useExecutionStore((s) => s.playbackState.currentFrame);
  const trace = useExecutionStore((s) => s.trace);

  const [activeTab, setActiveTab] =
    React.useState<DrTab>("regions_failover");
  const [comparePairId, setComparePairId] =
    React.useState<string>("cold_vs_warm");

  const scenario = React.useMemo(
    () =>
      activeDisasterRecoveryScenario ??
      createDisasterRecoveryPresetScenario("auto_failover_success"),
    [activeDisasterRecoveryScenario]
  );

  React.useEffect(() => {
    if (!currentFrame?.runtimeState?.disasterRecoveryState) {
      runDisasterRecoverySimulation(scenario);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drState = React.useMemo(() => {
    if (currentFrame?.runtimeState?.disasterRecoveryState) {
      return currentFrame.runtimeState.disasterRecoveryState;
    }
    const lastFrame = trace?.frames?.[trace.frames.length - 1];
    return lastFrame?.runtimeState?.disasterRecoveryState ?? null;
  }, [currentFrame, trace]);

  const regionsList = React.useMemo(
    () => (drState ? Object.values(drState.regions) : []),
    [drState]
  );
  const streamsList = React.useMemo(
    () => (drState ? Object.values(drState.replicationStreams) : []),
    [drState]
  );
  const dependenciesList = React.useMemo(
    () => (drState ? Object.values(drState.dependencies) : []),
    [drState]
  );

  const comparison = React.useMemo(() => {
    const pair =
      COMPARE_PAIRS.find((p) => p.id === comparePairId) ?? COMPARE_PAIRS[0]!;
    return compareRecoveryStrategies(
      createDisasterRecoveryPresetScenario(pair.baseline),
      createDisasterRecoveryPresetScenario(pair.variant)
    );
  }, [comparePairId]);

  const handleInjectOutage = () => {
    const atMs = Math.min(
      scenario.limits.maxVirtualDurationMs - 80,
      Math.max(80, drState?.virtualTimeMs ?? 120)
    );
    const updated = {
      ...scenario,
      failures: [
        ...scenario.failures,
        {
          id: `f_ui_outage_${Date.now()}`,
          atMs,
          type: "region_outage" as const,
          targetRegionId: scenario.regions[0]?.id ?? "us-east-1",
          description: `Injected regional outage on ${scenario.regions[0]?.id ?? "us-east-1"}`,
        },
      ],
    };
    setDisasterRecoveryScenario(updated);
    runDisasterRecoverySimulation(updated);
  };

  const handleCommand = (
    cmd: "trigger_restore" | "trigger_failback" | "pause_failover" | "resume_failover"
  ) => {
    const atMs = Math.min(
      scenario.limits.maxVirtualDurationMs - 40,
      Math.max(100, drState?.virtualTimeMs ?? 200)
    );
    const updated = {
      ...scenario,
      commands: [
        ...scenario.commands,
        {
          id: `cmd_ui_${cmd}_${Date.now()}`,
          atMs,
          command: cmd,
          targetRegionId:
            cmd === "trigger_failback"
              ? scenario.regions[0]?.id
              : scenario.regions[1]?.id,
          description: `Operator issued ${cmd}`,
        },
      ],
    };
    setDisasterRecoveryScenario(updated);
    runDisasterRecoverySimulation(updated);
  };

  const metrics = drState?.metrics;
  const primaryObj = drState?.objectiveEvaluations[0];

  return (
    <div
      role="region"
      aria-label="Distributed Disaster Recovery, Multi-Region Failover & Business Continuity Workspace"
      className="fixed bottom-4 right-4 z-40 w-[960px] max-w-[calc(100vw-2rem)] h-[660px] max-h-[calc(100vh-5rem)] flex flex-col rounded-md bg-surface-02 border border-border-default shadow-level-2 overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-surface-01 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <DatabaseIcon className="w-4 h-4 text-foreground shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-mono font-semibold text-foreground truncate">
              Disaster Recovery & Business Continuity Studio
            </h2>
            <p className="text-[10px] font-mono text-text-muted truncate">
              Multi-Region Failover · Fencing · RPO/RTO · Replication Lag · PITR Restore · Failback
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <Select
            value={scenario.presetId ?? "auto_failover_success"}
            onValueChange={(val) =>
              setScenarioPreset(val as DisasterRecoveryPresetId)
            }
          >
            <SelectTrigger className="h-7 w-[220px] text-[10px] font-mono bg-surface-03 border-border-default rounded-md">
              <SelectValue placeholder="DR Scenario Preset (40)" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default rounded-md max-h-[340px]">
              {DISASTER_RECOVERY_PRESET_METADATA.map((meta) => (
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
            onClick={handleInjectOutage}
            className="h-7 px-2 text-[10px] font-mono bg-surface-01 border-border-default hover:bg-surface-03 rounded-md"
          >
            Inject Outage
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCommand("trigger_restore")}
            className="h-7 px-2 text-[10px] font-mono bg-surface-01 border-border-default hover:bg-surface-03 rounded-md"
          >
            Restore
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCommand("trigger_failback")}
            className="h-7 px-2 text-[10px] font-mono bg-surface-01 border-border-default hover:bg-surface-03 rounded-md gap-1"
          >
            <RefreshIcon className="w-3 h-3" />
            Failback
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => runDisasterRecoverySimulation(scenario)}
            className="h-7 px-2.5 text-[10px] font-mono bg-foreground text-background hover:bg-neutral-200 rounded-md gap-1"
          >
            <PlayIcon className="w-3 h-3" />
            Run
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDisasterRecoveryWorkspace(false)}
            aria-label="Close Disaster Recovery Workspace"
            className="h-7 w-7 p-0 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Recovery Architecture Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border-subtle bg-surface-01 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-text-muted uppercase">
            Architecture:
          </span>
          {ARCH_QUICK_OPTIONS.map((opt) => {
            const isSelected = drState?.architecture === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScenarioPreset(opt.preset)}
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
          t={drState?.virtualTimeMs ?? 0}ms · step{" "}
          {currentFrame ? currentFrame.frameIndex + 1 : 0}/
          {trace?.frames.length ?? 0}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 px-3 py-2 border-b border-border-subtle bg-surface-01 shrink-0">
        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Failover State
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground truncate">
            {drState?.failover.state ?? "IDLE"}
          </div>
          <div className="text-[9px] font-mono text-text-secondary truncate">
            {drState?.architecture ?? "active_passive"}
          </div>
        </div>

        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            RPO (Actual / Target)
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {primaryObj?.achievedRpoMs !== null &&
            primaryObj?.achievedRpoMs !== undefined
              ? `${primaryObj.achievedRpoMs}ms`
              : "unmet"}{" "}
            / {primaryObj?.targetRpoMs ?? 0}ms
          </div>
          <div className="text-[9px] font-mono text-text-secondary">
            {primaryObj?.rpoMet ? "Objective Met" : "Exceeded / Unmet"}
          </div>
        </div>

        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            RTO (Actual / Target)
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {primaryObj?.achievedRtoMs !== null &&
            primaryObj?.achievedRtoMs !== undefined
              ? `${primaryObj.achievedRtoMs}ms`
              : "unmet"}{" "}
            / {primaryObj?.targetRtoMs ?? 0}ms
          </div>
          <div className="text-[9px] font-mono text-text-secondary">
            {primaryObj?.rtoMet ? "Objective Met" : "Exceeded / Unmet"}
          </div>
        </div>

        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Data & Req Loss
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {metrics?.missingAcknowledgedWrites ?? 0} ack writes
          </div>
          <div className="text-[9px] font-mono text-text-secondary">
            Lost reqs: {metrics?.lostRequests ?? 0}
          </div>
        </div>

        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Fencing & Lag
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            Epoch {drState?.fencing.epoch ?? 1} · {metrics?.maxReplicationLagMs ?? 0}ms
          </div>
          <div className="text-[9px] font-mono text-text-secondary">
            {drState?.fencing.splitBrainRisk ? "SPLIT-BRAIN RISK" : "Fencing Safe"}
          </div>
        </div>

        <div className="px-2 py-1.5 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Backups & Standby
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {metrics?.backupsValidCount ?? 0} ok / {metrics?.backupsCorruptCount ?? 0} bad
          </div>
          <div className="text-[9px] font-mono text-text-secondary">
            Util: {metrics?.standbyUtilizationPct ?? 0}%
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border-subtle bg-surface-01 overflow-x-auto shrink-0">
        {(
          [
            { id: "regions_failover", label: "Regions, Routing & Failover" },
            { id: "replication_rpo", label: "Replication & RPO / Data Loss" },
            { id: "backups_restore", label: "Backups, Chains & PITR Restore" },
            { id: "dependencies_failback", label: "Dependencies, Capacity & Failback" },
            { id: "drill_incidents_compare", label: "Drill Report, Incidents & Compare" },
            { id: "invariants", label: "Invariants (16)" },
          ] as Array<{ id: DrTab; label: string }>
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
        {!drState ? (
          <div className="p-4 rounded-md bg-surface-01 border border-border-subtle text-text-muted text-[11px]">
            Select a Disaster Recovery preset or click Run to execute a deterministic simulation.
          </div>
        ) : null}

        {/* TAB 1: REGIONS, ROUTING & FAILOVER */}
        {drState && activeTab === "regions_failover" && (
          <div className="space-y-3">
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

            {/* Region Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {regionsList.map((reg) => (
                <div
                  key={reg.id}
                  className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5 text-[10px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground">
                      {reg.label} ({reg.role.toUpperCase()})
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] rounded-md",
                        toneClass(
                          reg.state === "HEALTHY" || reg.state === "RESTORED"
                            ? "good"
                            : reg.state === "UNAVAILABLE"
                              ? "bad"
                              : "warn"
                        )
                      )}
                    >
                      {reg.state}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-text-secondary">
                    <div>
                      Zones: {reg.activeZones}/{reg.totalZones} healthy
                    </div>
                    <div>Provisioned: {reg.provisionedPct}%</div>
                    <div>
                      Load / Cap: {reg.currentLoadRps} / {reg.effectiveCapacityRps} rps
                    </div>
                    <div>
                      Weight (Obs):{" "}
                      {drState.routing.regionalWeightsPct[reg.id] ?? 0}% (
                      {drState.routing.observedTrafficPct[reg.id] ?? 0}%)
                    </div>
                  </div>
                  {reg.overloaded && (
                    <div className="text-foreground font-semibold">
                      CAPACITY SHORTFALL: Shedding requests (errRate{" "}
                      {(reg.errorRate * 100).toFixed(1)}%)
                    </div>
                  )}
                  {reg.sessionsLostCount > 0 && (
                    <div className="text-text-secondary">
                      Region-local sessions invalidated: {reg.sessionsLostCount}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Routing Convergence & Fencing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1 text-[10px]">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ActivityIcon className="w-3.5 h-3.5" />
                  Global Traffic Routing Convergence ({drState.routing.strategy})
                </div>
                <div className="text-text-secondary">
                  DNS TTL: {drState.routing.dnsTtlMs}ms · Stale clients:{" "}
                  {drState.routing.staleClientsPct}% · Converged:{" "}
                  {drState.routing.converged ? "YES" : "CONVERGING"}
                </div>
                <div className="text-text-secondary">
                  Window Requests: {drState.routing.successfulRequestsDuringWindow} ok /{" "}
                  {drState.routing.failedRequestsDuringWindow} failed
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1 text-[10px]">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldIcon className="w-3.5 h-3.5" />
                  Primary Fencing & Split-Brain Guard
                </div>
                <div className="text-text-secondary">
                  Holder: {drState.fencing.holderRegionId} · Epoch:{" "}
                  {drState.fencing.epoch} · Mode: {drState.fencing.mode}
                </div>
                <div className="text-text-secondary">
                  Established: {drState.fencing.fencingEstablished ? "YES" : "NO"} · Stale writes rejected: {drState.fencing.staleWritesRejected}
                </div>
                {drState.fencing.splitBrainRisk && (
                  <div className="text-foreground font-semibold">
                    SPLIT-BRAIN WARNING: {drState.fencing.splitBrainReason}
                  </div>
                )}
              </div>
            </div>

            {/* Failover State Timeline */}
            <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-text-secondary font-semibold">
                  Failover Orchestration Timeline ({drState.failover.state})
                </span>
                {drState.failover.failureReason && (
                  <span className="text-[10px] text-foreground">
                    {drState.failover.failureReason}
                  </span>
                )}
              </div>
              {drState.failover.timeline.length === 0 ? (
                <div className="text-[10px] text-text-muted">
                  No failover phase triggered at t={drState.virtualTimeMs}ms.
                </div>
              ) : (
                drState.failover.timeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-[10px] text-text-secondary flex items-center gap-2"
                  >
                    <span className="text-text-muted w-[54px] shrink-0">
                      [{item.atMs}ms]
                    </span>
                    <span className="text-foreground font-semibold">
                      {item.phase}
                    </span>
                    <span className="truncate">{item.summary}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REPLICATION & RPO / DATA LOSS */}
        {drState && activeTab === "replication_rpo" && (
          <div className="space-y-3">
            {streamsList.map((st) => (
              <div
                key={st.streamId}
                className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5 text-[10px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Stream {st.sourceRegionId} → {st.targetRegionId} ({st.mode})
                  </span>
                  {st.blockedBySyncQuorum && (
                    <Badge
                      variant="outline"
                      className="text-[9px] border-border-strong bg-surface-03 text-foreground rounded-md"
                    >
                      SYNC QUORUM BLOCKED WRITES
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-text-secondary">
                  <div>Primary Committed: LSN {st.primaryCommittedLsn}</div>
                  <div>Secondary Received: LSN {st.secondaryReceivedLsn}</div>
                  <div>Secondary Applied: LSN {st.secondaryAppliedLsn}</div>
                  <div>Secondary Durable: LSN {st.secondaryDurableLsn}</div>
                  <div>Record Lag: {st.recordLag} writes</div>
                  <div>Byte Lag: {st.byteLag} B</div>
                  <div>Time Lag: {st.timeLagMs}ms</div>
                  <div>Durable Flush Lag: {st.durableLagMs}ms</div>
                </div>
              </div>
            ))}

            {/* RPO / RTO Objective Evaluations */}
            <div className="rounded-md bg-surface-01 border border-border-default overflow-hidden">
              <div className="px-2.5 py-1.5 bg-surface-03 border-b border-border-subtle text-[10px] uppercase text-text-secondary">
                Recovery Objective (RPO / RTO) & Data-Loss Analysis
              </div>
              <div className="divide-y divide-border-subtle">
                {drState.objectiveEvaluations.map((ev) => (
                  <div key={ev.objectiveId} className="p-2.5 space-y-1 text-[10px]">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold text-foreground">
                        Service: {ev.serviceId}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] rounded-md",
                          toneClass(
                            ev.dataLossClassification === "NO_ACKNOWLEDGED_LOSS"
                              ? "good"
                              : "bad"
                          )
                        )}
                      >
                        {ev.dataLossClassification}
                      </Badge>
                    </div>
                    <div className="text-text-secondary">
                      RPO: {ev.achievedRpoMs ?? "unmet"}ms vs Target{" "}
                      {ev.targetRpoMs}ms ({ev.rpoMet ? "MET" : "EXCEEDED"}) ·
                      RTO: {ev.achievedRtoMs ?? "unmet"}ms vs Target{" "}
                      {ev.targetRtoMs}ms ({ev.rtoMet ? "MET" : "EXCEEDED"})
                    </div>
                    <div className="text-text-secondary">
                      Missing Acknowledged Writes: {ev.missingAcknowledgedWrites} · Missing Unacknowledged: {ev.missingUnacknowledgedWrites}
                    </div>
                    <div className="text-text-muted">
                      {ev.rpoMeasurementNote} | {ev.rtoMeasurementNote}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {drState.conflicts.length > 0 && (
              <div className="rounded-md bg-surface-01 border border-border-default p-2.5 space-y-1 text-[10px]">
                <div className="font-semibold text-foreground uppercase">
                  Active-Active Multi-Writer Conflicts ({drState.conflicts.length})
                </div>
                {drState.conflicts.map((c) => (
                  <div key={c.id} className="text-text-secondary">
                    [{c.atMs}ms] {c.key} ({c.resolution}): {c.explanation}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BACKUPS, CHAINS & PITR RESTORE */}
        {drState && activeTab === "backups_restore" && (
          <div className="space-y-3">
            {/* Active Restore State */}
            <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <LayersIcon className="w-3.5 h-3.5" />
                  Snapshot Restore & Point-in-Time Log Replay ({drState.restore.state})
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] rounded-md",
                    toneClass(
                      drState.restore.state === "COMPLETED"
                        ? "good"
                        : drState.restore.state === "FAILED"
                          ? "bad"
                          : "neutral"
                    )
                  )}
                >
                  Integrity Verified: {drState.restore.integrityVerified ? "YES" : "NO"}
                </Badge>
              </div>
              <div className="text-text-secondary">
                Backup: {drState.restore.backupId || "none"} · Target Region:{" "}
                {drState.restore.targetRegionId} · Applied LSN:{" "}
                {drState.restore.logsAppliedLsn} · Records Restored:{" "}
                {drState.restore.recordsRestored}
              </div>
              {drState.lastChainValidation && (
                <div className="text-text-secondary">
                  Chain Validation: {drState.lastChainValidation.reason}
                </div>
              )}
              {drState.restore.failureReason && (
                <div className="text-foreground font-semibold">
                  Error: {drState.restore.failureReason}
                </div>
              )}
            </div>

            {/* Backup Catalog */}
            <div className="rounded-md bg-surface-01 border border-border-default overflow-hidden">
              <div className="px-2.5 py-1.5 bg-surface-03 border-b border-border-subtle text-[10px] uppercase text-text-secondary">
                Cross-Region Backup Catalog ({drState.backups.length})
              </div>
              {drState.backups.length === 0 ? (
                <div className="p-2.5 text-[10px] text-text-muted">
                  No backups scheduled/created yet at t={drState.virtualTimeMs}ms.
                </div>
              ) : (
                <div className="divide-y divide-border-subtle max-h-[260px] overflow-y-auto">
                  {drState.backups.map((b) => (
                    <div
                      key={b.id}
                      className="px-2.5 py-1.5 flex items-center justify-between gap-2 text-[10px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-foreground">
                          {b.id}
                        </span>
                        <span className="text-text-muted">
                          {b.type} · LSN {b.includedLogPosition} · @{b.storageRegionId}
                          {b.parentBackupId ? ` · parent=${b.parentBackupId}` : ""}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] rounded-md",
                          toneClass(b.integrity === "valid" ? "good" : "bad")
                        )}
                      >
                        {b.integrity.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DEPENDENCIES, CAPACITY & FAILBACK */}
        {drState && activeTab === "dependencies_failback" && (
          <div className="space-y-3">
            <div className="rounded-md bg-surface-01 border border-border-default overflow-hidden">
              <div className="px-2.5 py-1.5 bg-surface-03 border-b border-border-subtle text-[10px] uppercase text-text-secondary flex items-center gap-1.5">
                <CpuIcon className="w-3.5 h-3.5" />
                Dependency Recovery DAG, Cache Warmup & Queue Backlog ({dependenciesList.length})
              </div>
              <div className="divide-y divide-border-subtle">
                {dependenciesList.map((dep) => (
                  <div
                    key={dep.serviceId}
                    className="px-2.5 py-2 flex items-center justify-between gap-2 text-[10px]"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-foreground">
                        {dep.label} ({dep.serviceId}) · {dep.tier}
                      </div>
                      <div className="text-text-muted">
                        deps: {dep.dependencyIds.join(", ") || "none"} · cold penalty:{" "}
                        {dep.cacheColdPenaltyMs}ms · queue depth: {dep.queueBacklogDepth}
                      </div>
                      {dep.degradedReason && (
                        <div className="text-text-secondary">
                          {dep.degradedReason}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] rounded-md shrink-0",
                        toneClass(dep.recovered ? "good" : "bad")
                      )}
                    >
                      {dep.recovered ? "RECOVERED" : "BLOCKED"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Failback State */}
            <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Original Region Failback State Machine ({drState.failback.state})
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] rounded-md",
                    toneClass(
                      drState.failback.state === "COMPLETED"
                        ? "good"
                        : drState.failback.state === "FAILED"
                          ? "bad"
                          : "neutral"
                    )
                  )}
                >
                  Catchup {drState.failback.replicationCatchupPct}%
                </Badge>
              </div>
              <div className="text-text-secondary">
                Original: {drState.failback.originalRegionId} ↔ Active Standby:{" "}
                {drState.failback.activeStandbyRegionId} · Rebuild:{" "}
                {drState.failback.dataRebuildProgressPct}%
              </div>
              {drState.failback.failureReason && (
                <div className="text-foreground font-semibold">
                  Safety Guard Blocked Failback: {drState.failback.failureReason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: DRILL REPORT, INCIDENTS & COMPARE */}
        {drState && activeTab === "drill_incidents_compare" && (
          <div className="space-y-3">
            {/* Drill Report */}
            <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-2 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Disaster Recovery Drill Report
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] rounded-md",
                    toneClass(drState.drillReport.objectivesMet ? "good" : "bad")
                  )}
                >
                  {drState.drillReport.objectivesMet
                    ? "OBJECTIVES PASSED"
                    : "GAPS DETECTED"}
                </Badge>
              </div>
              {drState.drillReport.successfulControls.map((c, i) => (
                <div key={i} className="text-text-secondary">
                  + {c}
                </div>
              ))}
              {drState.drillReport.failedControls.map((c, i) => (
                <div key={i} className="text-foreground font-semibold">
                  - {c}
                </div>
              ))}
              {drState.drillReport.recommendations.length > 0 && (
                <div className="border-t border-border-subtle pt-1.5 text-text-muted">
                  Recommendations: {drState.drillReport.recommendations.join(" · ")}
                </div>
              )}
            </div>

            {/* Correlated Incidents */}
            <div className="rounded-md bg-surface-01 border border-border-default overflow-hidden">
              <div className="px-2.5 py-1.5 bg-surface-03 border-b border-border-subtle text-[10px] uppercase text-text-secondary">
                Recovery Incidents ({drState.incidents.length})
              </div>
              {drState.incidents.length === 0 ? (
                <div className="p-2.5 text-[10px] text-text-muted">
                  No disaster incidents triggered yet.
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {drState.incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="px-2.5 py-1.5 flex items-center justify-between text-[10px]"
                    >
                      <span className="text-foreground">{inc.summary}</span>
                      <Badge
                        variant="outline"
                        className="text-[9px] rounded-md border-border-default text-text-secondary"
                      >
                        {inc.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strategy Comparison */}
            <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-2 text-[10px]">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-foreground uppercase">
                  Recovery Strategy Comparison
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1">
                  <div className="font-semibold text-foreground truncate">
                    Baseline: {comparison.baselineLabel}
                  </div>
                  <div className="text-text-secondary">
                    RPO: {comparison.baselineMetrics.achievedRpoMs ?? "unmet"}ms
                  </div>
                  <div className="text-text-secondary">
                    RTO: {comparison.baselineMetrics.achievedRtoMs ?? "unmet"}ms
                  </div>
                  <div className="text-text-secondary">
                    Lost Reqs: {comparison.baselineMetrics.lostRequests}
                  </div>
                </div>
                <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1">
                  <div className="font-semibold text-foreground truncate">
                    Variant: {comparison.variantLabel}
                  </div>
                  <div className="text-text-secondary">
                    RPO: {comparison.variantMetrics.achievedRpoMs ?? "unmet"}ms
                  </div>
                  <div className="text-text-secondary">
                    RTO: {comparison.variantMetrics.achievedRtoMs ?? "unmet"}ms
                  </div>
                  <div className="text-text-secondary">
                    Lost Reqs: {comparison.variantMetrics.lostRequests}
                  </div>
                </div>
                <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1">
                  <div className="font-semibold text-foreground">Delta</div>
                  <div className="text-text-secondary">
                    RPO Delta:{" "}
                    {comparison.deltas.achievedRpoMsDelta !== null
                      ? `${comparison.deltas.achievedRpoMsDelta}ms`
                      : "n/a"}
                  </div>
                  <div className="text-text-secondary">
                    RTO Delta:{" "}
                    {comparison.deltas.achievedRtoMsDelta !== null
                      ? `${comparison.deltas.achievedRtoMsDelta}ms`
                      : "n/a"}
                  </div>
                  <div className="text-text-secondary">
                    Lost Req Delta: {comparison.deltas.lostRequestsDelta}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: INVARIANTS (16) */}
        {drState && activeTab === "invariants" && (
          <div className="space-y-2">
            <div className="p-2.5 rounded-md bg-surface-01 border border-border-default flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">
                16 Disaster Recovery Correctness Invariants
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] rounded-md",
                  toneClass(drState.invariants.allPassed ? "good" : "bad")
                )}
              >
                {drState.invariants.allPassed
                  ? "ALL 16 INVARIANTS PASSED"
                  : `${drState.invariants.violations.length} VIOLATIONS`}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {(
                [
                  ["Valid Region Health Transitions", drState.invariants.regionTransitionsValidOk],
                  ["Monotonic Replication Positions", drState.invariants.replicationMonotonicOk],
                  ["Durable <= Received LSN", drState.invariants.durableNeverExceedsReceivedOk],
                  ["Valid Grounded Recovery Points", drState.invariants.recoveryPointsValidOk],
                  ["Complete Backup Chains Before Restore", drState.invariants.backupChainsCompleteOk],
                  ["Corrupted Backups Never Pass", drState.invariants.corruptBackupsNeverPassOk],
                  ["Ordered Idempotent Log Replay", drState.invariants.logReplayOrderedOk],
                  ["Fencing Blocks Stale Primary Writes", drState.invariants.fencingBlocksStaleWritesOk],
                  ["Promotion Safety Enforced", drState.invariants.promotionSafetyRespectedOk],
                  ["Split-Brain Risk Modeled Explicitly", drState.invariants.splitBrainExplicitOk],
                  ["Routing Weights Sum to 100%", drState.invariants.routingConvergenceValidOk],
                  ["Service Verification Precedes Completion", drState.invariants.serviceVerificationRequiredOk],
                  ["RPO Derived from Recoverable Data", drState.invariants.rpoDerivedFromDataOk],
                  ["RTO Derived from Observed Events", drState.invariants.rtoDerivedFromEventsOk],
                  ["Failback Requires Catchup Validation", drState.invariants.failbackValidatedOk],
                  ["Dependency Cycle Check Enforced", drState.invariants.cycleCheckEnforcedOk],
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
                      toneClass(ok ? "good" : "bad")
                    )}
                  >
                    {ok ? "PASS" : "FAIL"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

