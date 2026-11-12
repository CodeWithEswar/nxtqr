"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Button, Badge } from "@nxtqr/ui";
import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  CloseIcon,
  LayersIcon,
  PlayIcon,
  RefreshIcon,
  ShieldIcon,
  SlidersIcon,
} from "@nxtqr/icons";
import type { SimulationRunConfig } from "@nxtqr/architecture-execution";
import { useExecutionStore } from "../store/execution-store";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

type StudioTab = "capabilities" | "pipeline" | "findings" | "checkpoints";

export function UnifiedStudioDock() {
  const isOpen = useExecutionStore((s) => s.isUnifiedStudioOpen);
  const toggleUnifiedStudio = useExecutionStore((s) => s.toggleUnifiedStudio);
  const capabilityInspection = useExecutionStore((s) => s.capabilityInspection);
  const inspectTopologyCapabilities = useExecutionStore((s) => s.inspectTopologyCapabilities);
  const runCrossModulePipeline = useExecutionStore((s) => s.runCrossModulePipeline);
  const runUnifiedSimulation = useExecutionStore((s) => s.runUnifiedSimulation);
  const seekUnifiedCheckpoint = useExecutionStore((s) => s.seekUnifiedCheckpoint);
  const cancelUnifiedSimulation = useExecutionStore((s) => s.cancelUnifiedSimulation);
  const crossModuleResult = useExecutionStore((s) => s.crossModulePipelineResult);
  const unifiedRunRecord = useExecutionStore((s) => s.unifiedRunRecord);
  const unifiedFindings = useExecutionStore((s) => s.unifiedFindings);

  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const selectNode = useGraphEditorStore((s) => s.selectNode);

  const [activeTab, setActiveTab] = React.useState<StudioTab>("capabilities");
  const [incomingRps, setIncomingRps] = React.useState<number>(300);
  const [denyAuth, setDenyAuth] = React.useState<boolean>(false);
  const [faultKind, setFaultKind] =
    React.useState<SimulationRunConfig["faultKind"]>("none");
  const [lastSeekSummary, setLastSeekSummary] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      inspectTopologyCapabilities(nodes, edges);
    }
  }, [isOpen, nodes, edges, inspectTopologyCapabilities]);

  if (!isOpen) return null;

  const inspection = capabilityInspection;

  const handleRunPipeline = () => {
    runCrossModulePipeline(nodes, edges, {
      incomingRps,
      denyAuth,
      faultKind,
      seed: 42,
    });
    setActiveTab("pipeline");
  };

  const handleRunOrchestrator = () => {
    runUnifiedSimulation(nodes, edges, {
      incomingRps,
      denyAuth,
      faultKind,
      capabilityId: "observability",
      seed: 42,
      checkpointInterval: 2,
    });
    setActiveTab("checkpoints");
  };

  return (
    <section
      aria-label="Unified Simulation Studio Dock"
      className="fixed inset-x-2 bottom-2 md:inset-auto md:right-4 md:bottom-4 md:w-[540px] max-h-[82vh] z-40 flex flex-col bg-[#080808] border border-[#262626] rounded-md shadow-level-2 overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0D0D0D] border-b border-[#202020] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <LayersIcon className="w-4 h-4 text-[#B5B5B5] shrink-0" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground truncate">
            Unified Simulation Studio
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono px-1.5 py-0 h-4 border-[#333333] bg-[#141414] text-[#B5B5B5]"
          >
            05.4.25
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => inspectTopologyCapabilities(nodes, edges)}
            className="h-7 px-2 text-[10px] font-mono rounded-md text-[#B5B5B5] hover:text-foreground hover:bg-[#1A1A1A] border border-[#262626]"
            title="Refresh capability inspection"
          >
            <RefreshIcon className="w-3 h-3 mr-1" />
            Scan
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => toggleUnifiedStudio(false)}
            className="h-7 w-7 p-0 rounded-md text-[#858585] hover:text-foreground hover:bg-[#1A1A1A]"
            aria-label="Close Unified Simulation Studio"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Contextual Tabs */}
      <div
        role="tablist"
        aria-label="Unified Studio Views"
        className="flex items-center gap-1 px-3 py-1.5 bg-[#0D0D0D] border-b border-[#1A1A1A] overflow-x-auto shrink-0"
      >
        {(
          [
            { id: "capabilities", label: `Capabilities (${inspection?.supportedCapabilities.length ?? 0}/24)` },
            { id: "pipeline", label: "Cross-Module Flow" },
            { id: "findings", label: `Findings (${unifiedFindings.length})` },
            { id: "checkpoints", label: "Orchestrator & Checkpoints" },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-mono rounded-md border transition-colors whitespace-nowrap focus-visible:ring-1 focus-visible:ring-[#404040]",
                active
                  ? "bg-[#1A1A1A] border-[#404040] text-foreground font-semibold shadow-level-3"
                  : "bg-[#080808] border-[#202020] text-[#858585] hover:text-foreground hover:border-[#333333]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-dense">
        {activeTab === "capabilities" && (
          <div className="space-y-3">
            {inspection && inspection.topologyWarnings.length > 0 && (
              <div className="p-2.5 bg-[#141414] border border-[#333333] rounded-md space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-amber-400">
                  <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0" />
                  Topology Diagnostics
                </div>
                {inspection.topologyWarnings.map((w, idx) => (
                  <p key={idx} className="text-[11px] text-[#B5B5B5]">
                    {w}
                  </p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#262626]">
                <div className="text-sm font-bold text-foreground">
                  {inspection?.supportedCapabilities.length ?? 0}
                </div>
                <div className="text-[9px] text-[#858585] uppercase">Supported</div>
              </div>
              <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#262626]">
                <div className="text-sm font-bold text-amber-400">
                  {inspection?.partialCapabilities.length ?? 0}
                </div>
                <div className="text-[9px] text-[#858585] uppercase">Partial</div>
              </div>
              <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#262626]">
                <div className="text-sm font-bold text-rose-400">
                  {inspection?.misconfiguredCapabilities.length ?? 0}
                </div>
                <div className="text-[9px] text-[#858585] uppercase">Misconfigured</div>
              </div>
              <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#262626]">
                <div className="text-sm font-bold text-[#666666]">
                  {inspection?.unsupportedCapabilities.length ?? 0}
                </div>
                <div className="text-[9px] text-[#858585] uppercase">Unsupported</div>
              </div>
            </div>

            <div className="space-y-1.5">
              {(inspection
                ? [
                    ...inspection.misconfiguredCapabilities,
                    ...inspection.partialCapabilities,
                    ...inspection.supportedCapabilities,
                    ...inspection.unsupportedCapabilities,
                  ]
                : []
              ).map((cap) => (
                <div
                  key={cap.capabilityId}
                  className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] hover:border-[#333333] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#858585]">
                        {cap.metadata.phase}
                      </span>
                      <span className="text-xs font-medium text-foreground truncate">
                        {cap.metadata.name}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] font-mono uppercase px-1.5 py-0 h-4 border-[#333333]",
                        cap.status === "supported"
                          ? "text-emerald-400 bg-[#141414]"
                          : cap.status === "partial"
                            ? "text-amber-400 bg-[#141414]"
                            : cap.status === "misconfigured"
                              ? "text-rose-400 bg-[#141414]"
                              : "text-[#666666] bg-[#080808]"
                      )}
                    >
                      {cap.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#858585] mt-1">{cap.metadata.scopeNotes}</p>
                  {cap.missingNodeTypes.length > 0 && (
                    <p className="text-[10px] font-mono text-amber-400 mt-1">
                      Requires any: {cap.missingNodeTypes.join(", ")}
                    </p>
                  )}
                  {cap.missingConfigs.length > 0 && (
                    <p className="text-[10px] font-mono text-amber-400 mt-1">
                      {cap.missingConfigs[0]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "pipeline" && (
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#262626] space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <label className="block text-[10px] font-mono text-[#B5B5B5]">
                  Ingress (req/s)
                  <input
                    type="number"
                    min={1}
                    max={50000}
                    value={incomingRps}
                    onChange={(e) => setIncomingRps(Math.max(1, Number(e.target.value) || 1))}
                    className="mt-1 w-full px-2 py-1 rounded-md bg-[#141414] border border-[#333333] text-xs font-mono text-foreground focus:outline-none focus:border-[#404040]"
                  />
                </label>

                <label className="block text-[10px] font-mono text-[#B5B5B5]">
                  Fault Mode
                  <select
                    value={faultKind}
                    onChange={(e) =>
                      setFaultKind(e.target.value as SimulationRunConfig["faultKind"])
                    }
                    className="mt-1 w-full px-2 py-1 rounded-md bg-[#141414] border border-[#333333] text-xs font-mono text-foreground focus:outline-none focus:border-[#404040]"
                  >
                    <option value="none">None (Healthy)</option>
                    <option value="database_outage">Database Outage</option>
                    <option value="service_degraded">Service Degraded</option>
                    <option value="rate_limit_exhausted">Rate Limit Shedding</option>
                  </select>
                </label>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => setDenyAuth(!denyAuth)}
                    className={cn(
                      "px-2 py-1.5 rounded-md border text-[10px] font-mono transition-colors",
                      denyAuth
                        ? "bg-[#1A1A1A] border-[#404040] text-rose-400 font-semibold shadow-level-3"
                        : "bg-[#141414] border-[#262626] text-[#B5B5B5]"
                    )}
                  >
                    Zero Trust: {denyAuth ? "DENY" : "ALLOW"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRunPipeline}
                  disabled={nodes.length === 0}
                  className="h-7 px-3 rounded-md bg-foreground text-background hover:bg-foreground/90 text-[11px] font-mono font-semibold"
                >
                  <PlayIcon className="w-3 h-3 mr-1" />
                  Run End-to-End Pipeline
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRunOrchestrator}
                  disabled={nodes.length === 0}
                  className="h-7 px-3 rounded-md bg-[#141414] border border-[#333333] text-[#B5B5B5] hover:text-foreground text-[11px] font-mono"
                >
                  <SlidersIcon className="w-3 h-3 mr-1" />
                  Orchestrated Run
                </Button>
              </div>
            </div>

            {crossModuleResult ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#262626]">
                    <div className="text-[9px] text-[#858585] uppercase">Outcome</div>
                    <div className="text-xs font-semibold text-foreground mt-0.5">
                      HTTP {crossModuleResult.terminalStatusCode} ({crossModuleResult.outcome})
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#262626]">
                    <div className="text-[9px] text-[#858585] uppercase">Delivered / Req</div>
                    <div className="text-xs font-semibold text-foreground mt-0.5">
                      {crossModuleResult.deliveredRps} / {crossModuleResult.requestedRps} req/s
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#262626]">
                    <div className="text-[9px] text-[#858585] uppercase">Integrity</div>
                    <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                      {crossModuleResult.integrity.valid ? "VERIFIED" : "ISSUES"} (
                      {crossModuleResult.integrity.checkedEvents} evts)
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  {crossModuleResult.hops.map((hop, idx) => (
                    <button
                      key={`${hop.spanId}_${idx}`}
                      type="button"
                      onClick={() => selectNode(hop.nodeId)}
                      className="w-full text-left p-2 rounded-md bg-[#0D0D0D] border border-[#202020] hover:border-[#333333] flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#B5B5B5]">
                            {hop.layer}
                          </span>
                          <span className="text-xs font-medium text-foreground truncate">
                            {hop.nodeLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#858585] mt-0.5 truncate">
                          {hop.explanation}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "font-mono text-[10px] shrink-0",
                          hop.statusCode >= 500
                            ? "text-rose-400"
                            : hop.statusCode >= 400
                              ? "text-amber-400"
                              : "text-emerald-400"
                        )}
                      >
                        {hop.statusCode} · {hop.durationMs}ms
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#202020] text-center text-xs text-[#858585]">
                Run the composed pipeline to verify DNS, Gateway, Auth, Rate Limiting, Load Balancer, Mesh, Cache, Database, Queue &amp; Observability causality.
              </div>
            )}
          </div>
        )}

        {activeTab === "findings" && (
          <div className="space-y-2">
            {unifiedFindings.length === 0 ? (
              <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#202020] text-center space-y-1">
                <CheckCircleIcon className="w-5 h-5 text-emerald-400 mx-auto" />
                <p className="text-xs font-medium text-foreground">No Unified Findings Detected</p>
                <p className="text-[11px] text-[#858585]">
                  Run an orchestrated simulation or cross-module pipeline to collect deduplicated findings.
                </p>
              </div>
            ) : (
              unifiedFindings.map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#262626] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">{f.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono px-1.5 py-0 h-4 border-[#333333] bg-[#141414] text-[#858585]"
                      >
                        {f.provenance}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-mono uppercase px-1.5 py-0 h-4 border-[#333333]",
                          f.severity === "critical" || f.severity === "high"
                            ? "text-rose-400 bg-[#141414]"
                            : "text-amber-400 bg-[#141414]"
                        )}
                      >
                        {f.severity}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#B5B5B5]">{f.summary}</p>
                  <p className="text-[10px] font-mono text-[#858585]">Fix: {f.remediation}</p>
                  {f.affectedNodeIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {f.affectedNodeIds.map((nid) => (
                        <button
                          key={nid}
                          type="button"
                          onClick={() => selectNode(nid)}
                          className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-[#141414] border border-[#262626] hover:border-[#404040] text-foreground"
                        >
                          Focus {nid}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "checkpoints" && (
          <div className="space-y-3">
            {unifiedRunRecord ? (
              <>
                <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#262626] flex items-center justify-between gap-2 font-mono text-[11px]">
                  <div>
                    <div className="text-foreground font-semibold">{unifiedRunRecord.runId}</div>
                    <div className="text-[#858585] text-[10px]">
                      State: {unifiedRunRecord.state.toUpperCase()} ·{" "}
                      {unifiedRunRecord.checkpoints.length} checkpoints ·{" "}
                      {unifiedRunRecord.virtualTimeMs}ms
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelUnifiedSimulation(unifiedRunRecord.runId)}
                    className="h-7 px-2 rounded-md border border-[#333333] bg-[#141414] text-rose-400 text-[10px] font-mono"
                  >
                    <ShieldIcon className="w-3 h-3 mr-1" />
                    Abort Run
                  </Button>
                </div>

                {lastSeekSummary && (
                  <div className="p-2 rounded-md bg-[#141414] border border-[#333333] text-[10px] font-mono text-emerald-400">
                    {lastSeekSummary}
                  </div>
                )}

                <div className="space-y-1">
                  {unifiedRunRecord.checkpoints.map((cp) => (
                    <button
                      key={cp.stepIndex}
                      type="button"
                      onClick={() => {
                        seekUnifiedCheckpoint(cp.stepIndex);
                        setLastSeekSummary(
                          `Restored checkpoint at step ${cp.stepIndex} (hash ${cp.stateHash}) in virtual replay.`
                        );
                      }}
                      className="w-full p-2 rounded-md bg-[#0D0D0D] border border-[#202020] hover:border-[#404040] flex items-center justify-between text-left font-mono text-[10px] transition-colors"
                    >
                      <span className="text-foreground">
                        Step #{cp.stepIndex} · +{cp.virtualTimeMs}ms
                      </span>
                      <span className="text-[#858585]">{cp.stateHash}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#202020] text-center space-y-2">
                <ActivityIcon className="w-5 h-5 text-[#858585] mx-auto" />
                <p className="text-xs text-[#858585]">
                  No orchestrated run active yet. Start one from Cross-Module Flow to inspect checkpoints.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRunOrchestrator}
                  disabled={nodes.length === 0}
                  className="h-7 px-3 rounded-md bg-foreground text-background text-[11px] font-mono font-semibold"
                >
                  Start Orchestrated Run
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

