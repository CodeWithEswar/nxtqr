"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  CloseIcon,
  PlayIcon,
  ShieldIcon,
} from "@nxtqr/icons";
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import { useExecutionStore } from "../store/execution-store";
import {
  RESILIENCE_PRESET_DEFINITIONS,
  ResiliencePresetFactory,
  type ResiliencePresetId,
  type FailureScenario,
} from "@nxtqr/architecture-execution";

export interface FaultScenarioDialogProps {
  onClose?: () => void;
}

export function FaultScenarioDialog({ onClose }: FaultScenarioDialogProps) {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);

  const activeFailureScenario = useExecutionStore((s) => s.activeFailureScenario);
  const activePresetId = useExecutionStore((s) => s.activePresetId);
  const setScenarioPreset = useExecutionStore((s) => s.setScenarioPreset);
  const setFailureScenario = useExecutionStore((s) => s.setFailureScenario);
  const toggleFaultScenarioDialog = useExecutionStore((s) => s.toggleFaultScenarioDialog);
  const runResilienceSimulation = useExecutionStore((s) => s.runResilienceSimulation);

  const [selectedPresetId, setSelectedPresetId] = React.useState<ResiliencePresetId>(
    (activePresetId as ResiliencePresetId) || "database_outage"
  );
  const [activeTab, setActiveTab] = React.useState<"presets" | "policies" | "blast_radius">("presets");

  // Local scenario state for customization
  const [scenarioState, setScenarioState] = React.useState<FailureScenario>(() => {
    if (activeFailureScenario) return activeFailureScenario;
    return ResiliencePresetFactory.createScenario(selectedPresetId, nodes, edges);
  });

  const handleSelectPreset = (presetId: ResiliencePresetId) => {
    setSelectedPresetId(presetId);
    const newScenario = ResiliencePresetFactory.createScenario(presetId, nodes, edges);
    setScenarioState(newScenario);
    setScenarioPreset(presetId, nodes, edges);
  };

  const handleTargetChange = (faultIndex: number, newTargetId: string) => {
    setScenarioState((prev) => {
      const updatedFaults = [...prev.faults];
      if (updatedFaults[faultIndex]) {
        const targetNode = nodes.find((n) => n.id === newTargetId);
        updatedFaults[faultIndex] = {
          ...updatedFaults[faultIndex],
          target: {
            ...updatedFaults[faultIndex].target,
            targetId: newTargetId,
            targetLabel: targetNode?.label || newTargetId,
          },
        };
      }
      return { ...prev, faults: updatedFaults };
    });
  };

  const handleRunSimulation = () => {
    setFailureScenario(scenarioState);
    toggleFaultScenarioDialog(false);
    runResilienceSimulation(nodes, edges, scenarioState);
  };

  const selectedPresetDef = RESILIENCE_PRESET_DEFINITIONS.find((p) => p.id === selectedPresetId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fault-scenario-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-none p-4 select-none"
    >
      <div className="w-full max-w-2xl bg-surface-02 border border-border-default rounded-md shadow-level-2 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-01 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-4 h-4 text-text-secondary" />
            <h3 id="fault-scenario-title" className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
              Fault Injection & Resilience Simulation
            </h3>
            <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-text-secondary">
              Deterministic Chaos
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleFaultScenarioDialog(false))}
            className="h-6 w-6 p-0 text-text-muted hover:text-foreground rounded"
            title="Close"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-border-subtle bg-surface-01 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={cn(
              "px-3 py-1.5 text-xs font-mono border-b-2 transition-colors",
              activeTab === "presets"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-text-muted hover:text-text-secondary"
            )}
          >
            Scenario Presets (10)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("policies")}
            className={cn(
              "px-3 py-1.5 text-xs font-mono border-b-2 transition-colors",
              activeTab === "policies"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-text-muted hover:text-text-secondary"
            )}
          >
            Resilience Policies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("blast_radius")}
            className={cn(
              "px-3 py-1.5 text-xs font-mono border-b-2 transition-colors",
              activeTab === "blast_radius"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-text-muted hover:text-text-secondary"
            )}
          >
            Fault Targets & Parameters
          </button>
        </div>

        {/* Dialog Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {activeTab === "presets" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {RESILIENCE_PRESET_DEFINITIONS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={cn(
                      "p-2.5 rounded-md text-left border transition-all flex flex-col justify-between gap-1.5",
                      selectedPresetId === preset.id
                        ? "bg-surface-04 border-border-strong shadow-level-3"
                        : "bg-surface-01 border-border-default hover:border-border-hover hover:bg-surface-03"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-mono font-medium text-foreground">
                          {preset.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[8px] font-mono border-border-default text-text-muted shrink-0"
                        >
                          {preset.category}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-text-muted line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    <div className="text-[9px] font-mono text-text-secondary border-t border-border-subtle pt-1 mt-1">
                      Fault: <span className="text-foreground">{preset.primaryFaultType}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedPresetDef && (
                <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1.5">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <AlertTriangleIcon className="w-3.5 h-3.5 text-text-secondary" />
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                      Modeled Behavior & Observation
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {selectedPresetDef.keyObservation}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "policies" && (
            <div className="space-y-4">
              {/* Retry Policy */}
              <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
                    Retry Policy Configuration
                  </span>
                  <Badge variant="outline" className="text-[9px] font-mono border-border-default text-text-secondary">
                    Exponential Backoff + Jitter
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted block">Max Attempts</label>
                    <div className="p-1.5 bg-surface-02 border border-border-default rounded-md text-foreground">
                      3 attempts
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted block">Initial Delay</label>
                    <div className="p-1.5 bg-surface-02 border border-border-default rounded-md text-foreground">
                      150ms
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted block">Backoff Strategy</label>
                    <div className="p-1.5 bg-surface-02 border border-border-default rounded-md text-foreground">
                      Exponential (2x)
                    </div>
                  </div>
                </div>
              </div>

              {/* Circuit Breaker Policy */}
              <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
                    Circuit Breaker (3-State Machine)
                  </span>
                  <Badge variant="outline" className="text-[9px] font-mono border-border-default text-text-secondary">
                    Closed ➔ Open ➔ Half-Open
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted block">Failure Threshold</label>
                    <div className="p-1.5 bg-surface-02 border border-border-default rounded-md text-foreground">
                      3 errors to trip
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted block">Open Cooldown</label>
                    <div className="p-1.5 bg-surface-02 border border-border-default rounded-md text-foreground">
                      3000ms
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted block">Probe Successes</label>
                    <div className="p-1.5 bg-surface-02 border border-border-default rounded-md text-foreground">
                      2 to close
                    </div>
                  </div>
                </div>
              </div>

              {/* Failover Policy */}
              <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
                    Dynamic Standby Failover
                  </span>
                  <Badge variant="outline" className="text-[9px] font-mono border-border-default text-text-secondary">
                    Active Standby Route
                  </Badge>
                </div>
                <p className="text-[11px] text-text-muted">
                  Routes traffic to healthy replica node if primary target status becomes UNAVAILABLE or Circuit Breaker is OPEN.
                </p>
              </div>
            </div>
          )}

          {activeTab === "blast_radius" && (
            <div className="space-y-3">
              <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider block">
                Injected Fault Definitions
              </span>

              {scenarioState.faults.map((fault, idx) => (
                <div
                  key={fault.id}
                  className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-foreground">
                      {fault.name}
                    </span>
                    <Badge variant="outline" className="text-[9px] font-mono border-border-default text-text-secondary">
                      {fault.type}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                      Target Component / Edge
                    </label>
                    <Select
                      value={fault.target.targetId}
                      onValueChange={(val) => handleTargetChange(idx, val)}
                    >
                      <SelectTrigger className="h-8 w-full font-mono text-xs bg-surface-02 border-border-default hover:border-border-hover text-foreground">
                        <SelectValue placeholder="Select target..." />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2 z-[70]">
                        {nodes.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            Node: {n.label || n.id} ({String((n.data as any)?.componentType || n.type || "service")})
                          </SelectItem>
                        ))}
                        {edges.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            Edge: {e.label || e.id} ({e.source} ➔ {e.target})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-mono text-text-muted">
                    <span>Start: {fault.startAtMs}ms</span>
                    <span>Duration: {fault.durationMs ? `${fault.durationMs}ms` : "Permanent"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-01 border-t border-border-subtle shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleFaultScenarioDialog(false))}
            className="text-xs font-mono text-text-muted hover:text-foreground"
          >
            Cancel
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleRunSimulation}
            className="h-8 px-4 text-xs font-mono font-semibold rounded-md gap-1.5 bg-foreground text-background hover:bg-neutral-200"
          >
            <PlayIcon className="w-3.5 h-3.5" />
            <span>Inject Faults & Run Simulation</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
