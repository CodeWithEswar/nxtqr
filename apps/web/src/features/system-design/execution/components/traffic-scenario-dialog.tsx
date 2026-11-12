"use client";

import * as React from "react";
import {
  ActivityIcon,
  CloseIcon,
  PlayIcon,
  DatabaseIcon,
  CpuIcon,
  LayersIcon,
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
  TRAFFIC_PRESET_DEFINITIONS,
  TrafficPresetFactory,
  type TrafficPresetId,
  type TrafficScenario,
  type QueueAdmissionPolicy,
  type LoadBalancingStrategy,
} from "@nxtqr/architecture-execution";

export interface TrafficScenarioDialogProps {
  onClose?: () => void;
}

export function TrafficScenarioDialog({ onClose }: TrafficScenarioDialogProps) {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);

  const activeTrafficScenario = useExecutionStore((s) => s.activeTrafficScenario);
  const toggleTrafficScenarioDialog = useExecutionStore((s) => s.toggleTrafficScenarioDialog);
  const runTrafficSimulation = useExecutionStore((s) => s.runTrafficSimulation);
  const setTrafficScenario = useExecutionStore((s) => s.setTrafficScenario);

  const [selectedPresetId, setSelectedPresetId] = React.useState<TrafficPresetId>("low_steady_traffic");
  const [activeTab, setActiveTab] = React.useState<"presets" | "workload" | "capacity" | "scaling">("presets");

  // Local scenario state
  const [scenarioState, setScenarioState] = React.useState<TrafficScenario>(() => {
    if (activeTrafficScenario) {
      return JSON.parse(JSON.stringify(activeTrafficScenario));
    }
    return TrafficPresetFactory.createPreset("low_steady_traffic", nodes, edges);
  });

  const handleSelectPreset = (presetId: TrafficPresetId) => {
    setSelectedPresetId(presetId);
    const newScenario = TrafficPresetFactory.createPreset(presetId, nodes, edges);
    setScenarioState(newScenario);
  };

  const handleApplyAndRun = () => {
    setTrafficScenario(scenarioState);
    runTrafficSimulation(nodes, edges, scenarioState);
    if (onClose) {
      onClose();
    } else {
      toggleTrafficScenarioDialog(false);
    }
  };

  const activePresetDef = TRAFFIC_PRESET_DEFINITIONS.find((p) => p.id === selectedPresetId);

  // Grouped presets
  const steadyPresets = TRAFFIC_PRESET_DEFINITIONS.filter((p) => p.category === "Steady State");
  const burstPresets = TRAFFIC_PRESET_DEFINITIONS.filter((p) => p.category === "Burst & Spike");
  const scalingPresets = TRAFFIC_PRESET_DEFINITIONS.filter((p) => p.category === "Protection & Scaling");
  const bottleneckPresets = TRAFFIC_PRESET_DEFINITIONS.filter((p) => p.category === "Bottleneck");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="traffic-scenario-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-none p-4 select-none"
    >
      <div className="w-full max-w-4xl bg-surface-02 border border-border-default rounded-md shadow-level-2 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-01 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-text-secondary" />
            <h2 id="traffic-scenario-title" className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
              Live Traffic & Capacity Simulation Configuration
            </h2>
            <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-text-secondary">
              Virtual Clock · Discrete Event
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleTrafficScenarioDialog(false))}
            className="h-6 w-6 p-0 text-text-muted hover:text-foreground rounded"
            title="Close"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-subtle px-4 bg-surface-01 shrink-0">
          {(
            [
              { id: "presets", label: "Traffic Presets (10)" },
              { id: "workload", label: "Workload Profile & Users" },
              { id: "capacity", label: "Service Concurrency & Queues" },
              { id: "scaling", label: "Rate Limits & Autoscaling" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-2.5 px-3 text-xs font-mono font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-foreground text-foreground bg-surface-02"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {activeTab === "presets" && (
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-text-secondary">
                Select a standardized traffic benchmark preset to test capacity, saturation, backpressure, or autoscaling.
              </div>

              {/* Preset Cards by Category */}
              <div className="space-y-3">
                <CategoryGroup
                  title="Steady-State Profiles"
                  presets={steadyPresets}
                  selectedId={selectedPresetId}
                  onSelect={handleSelectPreset}
                />
                <CategoryGroup
                  title="Burst, Spikes & Flash Sales"
                  presets={burstPresets}
                  selectedId={selectedPresetId}
                  onSelect={handleSelectPreset}
                />
                <CategoryGroup
                  title="Protection, Queuing & Autoscaling"
                  presets={scalingPresets}
                  selectedId={selectedPresetId}
                  onSelect={handleSelectPreset}
                />
                <CategoryGroup
                  title="Bottleneck & Saturation Stress Tests"
                  presets={bottleneckPresets}
                  selectedId={selectedPresetId}
                  onSelect={handleSelectPreset}
                />
              </div>

              {/* Active Preset Detail Panel */}
              {activePresetDef && (
                <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {activePresetDef.name}
                    </span>
                    <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-text-secondary">
                      {activePresetDef.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-mono text-text-secondary">
                    {activePresetDef.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-[10px] font-mono text-text-muted">
                    <div>
                      <span className="text-text-muted">Workload:</span>{" "}
                      <span className="text-foreground">{activePresetDef.workloadSummary}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Key Observation:</span>{" "}
                      <span className="text-foreground">{activePresetDef.keyObservation}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "workload" && (
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-text-secondary">
                Configure incoming arrival rate, workload shape (open-loop) or virtual user behaviors (closed-loop).
              </div>

              {/* Mode Selection */}
              <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2">
                <span className="text-xs font-mono font-semibold text-foreground block">
                  Workload Mode
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setScenarioState({ ...scenarioState, mode: "open_loop" })}
                    className={cn(
                      "h-8 text-xs font-mono border",
                      scenarioState.mode === "open_loop"
                        ? "bg-surface-03 border-border-strong text-foreground font-semibold"
                        : "border-border-default text-text-muted"
                    )}
                  >
                    Open-Loop Arrival (Rate Driven)
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setScenarioState({
                        ...scenarioState,
                        mode: "closed_loop",
                        virtualUsers: scenarioState.virtualUsers || {
                          userCount: 40,
                          thinkTimeMs: 500,
                        },
                      })
                    }
                    className={cn(
                      "h-8 text-xs font-mono border",
                      scenarioState.mode === "closed_loop"
                        ? "bg-surface-03 border-border-strong text-foreground font-semibold"
                        : "border-border-default text-text-muted"
                    )}
                  >
                    Closed-Loop (Virtual Users)
                  </Button>
                </div>
              </div>

              {/* Workload Profile Parameters */}
              <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-3">
                <span className="text-xs font-mono font-semibold text-foreground block">
                  Profile Shape & Timing
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                      Pattern
                    </label>
                    <Select
                      value={scenarioState.workload.type}
                      onValueChange={(val: any) => {
                        if (val === "constant") {
                          setScenarioState({
                            ...scenarioState,
                            workload: { type: "constant", requestsPerSecond: 100 },
                          });
                        } else if (val === "burst") {
                          setScenarioState({
                            ...scenarioState,
                            workload: {
                              type: "burst",
                              baselineRps: 50,
                              burstRps: 500,
                              startAtMs: 2000,
                              durationMs: 4000,
                            },
                          });
                        } else if (val === "ramp") {
                          setScenarioState({
                            ...scenarioState,
                            workload: {
                              type: "ramp",
                              startRps: 20,
                              endRps: 400,
                              durationMs: 8000,
                            },
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs font-mono bg-surface-02 border-border-default">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-02 border-border-default">
                        <SelectItem value="constant">Constant</SelectItem>
                        <SelectItem value="ramp">Gradual Ramp</SelectItem>
                        <SelectItem value="burst">Sudden Burst</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                      Simulated Duration (ms)
                    </label>
                    <input
                      type="number"
                      value={scenarioState.durationMs}
                      onChange={(e) =>
                        setScenarioState({
                          ...scenarioState,
                          durationMs: Math.max(1000, Number(e.target.value)),
                        })
                      }
                      className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground focus:outline-none focus:border-border-strong"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                      Max Request Cap
                    </label>
                    <input
                      type="number"
                      value={scenarioState.limits.maxRequests}
                      onChange={(e) =>
                        setScenarioState({
                          ...scenarioState,
                          limits: {
                            ...scenarioState.limits,
                            maxRequests: Math.max(10, Number(e.target.value)),
                          },
                        })
                      }
                      className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground focus:outline-none focus:border-border-strong"
                    />
                  </div>
                </div>

                {scenarioState.workload.type === "constant" && (
                  <div>
                    <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                      Requests Per Second (RPS)
                    </label>
                    <input
                      type="number"
                      value={scenarioState.workload.requestsPerSecond}
                      onChange={(e) =>
                        setScenarioState({
                          ...scenarioState,
                          workload: {
                            type: "constant",
                            requestsPerSecond: Math.max(1, Number(e.target.value)),
                          },
                        })
                      }
                      className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground focus:outline-none focus:border-border-strong"
                    />
                  </div>
                )}

                {scenarioState.workload.type === "burst" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                        Baseline RPS
                      </label>
                      <input
                        type="number"
                        value={scenarioState.workload.baselineRps}
                        onChange={(e) => {
                          if (scenarioState.workload.type === "burst") {
                            setScenarioState({
                              ...scenarioState,
                              workload: {
                                ...scenarioState.workload,
                                baselineRps: Number(e.target.value),
                              },
                            });
                          }
                        }}
                        className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                        Burst Peak RPS
                      </label>
                      <input
                        type="number"
                        value={scenarioState.workload.burstRps}
                        onChange={(e) => {
                          if (scenarioState.workload.type === "burst") {
                            setScenarioState({
                              ...scenarioState,
                              workload: {
                                ...scenarioState.workload,
                                burstRps: Number(e.target.value),
                              },
                            });
                          }
                        }}
                        className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "capacity" && (
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-text-secondary">
                Configure finite worker pool sizes, processing duration distributions, and FIFO queue admission policies.
              </div>

              {/* Service capacity cards */}
              {Object.keys(scenarioState.capacities).length > 0 ? (
                Object.entries(scenarioState.capacities).map(([nodeId, cap]) => (
                  <div key={nodeId} className="p-3 rounded-md bg-surface-01 border border-border-default space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle">
                      <div className="flex items-center gap-2">
                        <DatabaseIcon className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="text-xs font-mono font-semibold text-foreground">
                          {nodeId}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted">
                        Total Capacity: {cap.initialInstances * cap.workersPerInstance} concurrent workers
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                          Instances
                        </label>
                        <input
                          type="number"
                          value={cap.initialInstances}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setScenarioState({
                              ...scenarioState,
                              capacities: {
                                ...scenarioState.capacities,
                                [nodeId]: { ...cap, initialInstances: val },
                              },
                            });
                          }}
                          className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                          Workers / Instance
                        </label>
                        <input
                          type="number"
                          value={cap.workersPerInstance}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setScenarioState({
                              ...scenarioState,
                              capacities: {
                                ...scenarioState.capacities,
                                [nodeId]: { ...cap, workersPerInstance: val },
                              },
                            });
                          }}
                          className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                          Base Latency (ms)
                        </label>
                        <input
                          type="number"
                          value={cap.baseProcessingTimeMs}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setScenarioState({
                              ...scenarioState,
                              capacities: {
                                ...scenarioState.capacities,
                                [nodeId]: { ...cap, baseProcessingTimeMs: val },
                              },
                            });
                          }}
                          className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                          Queue Capacity
                        </label>
                        <input
                          type="number"
                          value={cap.queueCapacity}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            setScenarioState({
                              ...scenarioState,
                              capacities: {
                                ...scenarioState.capacities,
                                [nodeId]: { ...cap, queueCapacity: val },
                              },
                            });
                          }}
                          className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                          Admission Policy
                        </label>
                        <Select
                          value={cap.admissionPolicy}
                          onValueChange={(val: QueueAdmissionPolicy) => {
                            setScenarioState({
                              ...scenarioState,
                              capacities: {
                                ...scenarioState.capacities,
                                [nodeId]: { ...cap, admissionPolicy: val },
                              },
                            });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs font-mono bg-surface-02 border-border-default">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-02 border-border-default">
                            <SelectItem value="reject_when_full">Reject When Full (HTTP 429/503)</SelectItem>
                            <SelectItem value="wait">Wait (Bounded FIFO)</SelectItem>
                            <SelectItem value="drop_tail">Drop Tail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                          Load Balancing
                        </label>
                        <Select
                          value={cap.loadBalancing}
                          onValueChange={(val: LoadBalancingStrategy) => {
                            setScenarioState({
                              ...scenarioState,
                              capacities: {
                                ...scenarioState.capacities,
                                [nodeId]: { ...cap, loadBalancing: val },
                              },
                            });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs font-mono bg-surface-02 border-border-default">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-02 border-border-default">
                            <SelectItem value="round_robin">Round Robin</SelectItem>
                            <SelectItem value="least_active">Least Active Requests</SelectItem>
                            <SelectItem value="weighted">Weighted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-md bg-surface-01 border border-border-default text-center text-text-muted text-xs font-mono">
                  Default node capacities will automatically be inferred from active canvas components.
                </div>
              )}
            </div>
          )}

          {activeTab === "scaling" && (
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-text-secondary">
                Configure Token Bucket rate limiting and reactive autoscaling policies.
              </div>

              {/* Rate Limiters */}
              <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <CpuIcon className="w-3.5 h-3.5 text-text-secondary" />
                    <span className="text-xs font-mono font-semibold text-foreground">
                      Token Bucket Rate Limiting
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-text-secondary">
                    Active on Ingress
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                      Bucket Capacity
                    </label>
                    <input
                      type="number"
                      defaultValue={150}
                      onChange={(e) => {
                        const cap = Math.max(1, Number(e.target.value));
                        const entryId = scenarioState.entryNodeId;
                        setScenarioState({
                          ...scenarioState,
                          rateLimiters: {
                            ...scenarioState.rateLimiters,
                            [entryId]: {
                              nodeId: entryId,
                              algorithm: "token_bucket",
                              capacity: cap,
                              refillRatePerSec: 80,
                              windowMs: 1000,
                              rejectStatusCode: 429,
                            },
                          },
                        });
                      }}
                      className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                      Refill Rate (tokens/s)
                    </label>
                    <input
                      type="number"
                      defaultValue={80}
                      onChange={(e) => {
                        const refill = Math.max(1, Number(e.target.value));
                        const entryId = scenarioState.entryNodeId;
                        setScenarioState({
                          ...scenarioState,
                          rateLimiters: {
                            ...scenarioState.rateLimiters,
                            [entryId]: {
                              nodeId: entryId,
                              algorithm: "token_bucket",
                              capacity: 150,
                              refillRatePerSec: refill,
                              windowMs: 1000,
                              rejectStatusCode: 429,
                            },
                          },
                        });
                      }}
                      className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                      Reject Status Code
                    </label>
                    <input
                      type="number"
                      defaultValue={429}
                      disabled
                      className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-text-muted cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Autoscaling Policies */}
              <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <LayersIcon className="w-3.5 h-3.5 text-text-secondary" />
                    <span className="text-xs font-mono font-semibold text-foreground">
                      Horizontal Pod Autoscaler (HPA)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-text-secondary">
                    Threshold & Cooldown
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                      Min Instances
                    </label>
                    <input
                      type="number"
                      defaultValue={2}
                      className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                      Max Instances
                    </label>
                    <input
                      type="number"
                      defaultValue={6}
                      className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                      Scale-Out Target %
                    </label>
                    <input
                      type="number"
                      defaultValue={75}
                      className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-text-muted block mb-1">
                      Provisioning Delay (ms)
                    </label>
                    <input
                      type="number"
                      defaultValue={1500}
                      className="w-full h-8 px-2 bg-surface-02 border border-border-default rounded-md text-xs font-mono text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-surface-01 border-t border-border-subtle flex items-center justify-between shrink-0">
          <div className="text-[10px] font-mono text-text-muted">
            100% Deterministic Virtual Time Simulation · Seed: #{scenarioState.seed}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose || (() => toggleTrafficScenarioDialog(false))}
              className="h-8 text-xs font-mono border border-border-default hover:bg-surface-03"
            >
              Cancel
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleApplyAndRun}
              className="h-8 text-xs font-mono bg-foreground text-background hover:bg-neutral-200 font-semibold"
            >
              <PlayIcon className="w-3.5 h-3.5 mr-1.5" />
              Apply & Run Traffic Simulation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryGroup({
  title,
  presets,
  selectedId,
  onSelect,
}: {
  title: string;
  presets: typeof TRAFFIC_PRESET_DEFINITIONS;
  selectedId: string;
  onSelect: (id: TrafficPresetId) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-mono uppercase text-text-muted font-semibold tracking-wider">
        {title}
      </span>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            className={cn(
              "p-2.5 rounded-md border cursor-pointer transition-all flex flex-col justify-between text-left",
              selectedId === preset.id
                ? "bg-surface-03 border-border-strong shadow-level-1"
                : "bg-surface-01 border-border-subtle hover:border-border-default hover:bg-surface-02"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-foreground">
                  {preset.name}
                </span>
                {selectedId === preset.id && (
                  <Badge variant="outline" className="text-[8px] font-mono border-border-strong text-foreground">
                    Selected
                  </Badge>
                )}
              </div>
              <p className="text-[10px] font-mono text-text-muted mt-1 line-clamp-2">
                {preset.description}
              </p>
            </div>
            <div className="text-[9px] font-mono text-text-secondary mt-2 pt-1 border-t border-border-subtle">
              {preset.workloadSummary}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
