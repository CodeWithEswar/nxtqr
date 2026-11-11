"use client";

import React, { useState } from "react";
import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  FailureScenario,
  FailureInjectionType,
} from "@nxtqr/architecture-intelligence";
import { SIMULATION_PRESETS } from "@nxtqr/architecture-intelligence";
import {
  PlusIcon,
  TrashIcon,
} from "@nxtqr/icons";

export interface ScenarioBuilderProps {
  nodes: BaseNode[];
  scenario: FailureScenario;
  onScenarioChange: (scenario: FailureScenario) => void;
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  className?: string;
}

export function ScenarioBuilder({
  nodes,
  scenario,
  onScenarioChange,
  selectedPresetId,
  onSelectPreset,
  className = "",
}: ScenarioBuilderProps) {
  const [activeSection, setActiveSection] = useState<"preset" | "injections" | "journeys" | "sla">("preset");

  const handleUpdateDuration = (durationSec: number) => {
    onScenarioChange({
      ...scenario,
      durationMs: Math.max(10, Math.min(300, durationSec)) * 1000,
    });
  };

  const handleAddInjection = () => {
    const firstNode = nodes[0];
    const newInj = {
      id: `inj-${Date.now()}`,
      name: `Failure on ${firstNode?.data?.label || firstNode?.id || "Component"}`,
      type: "component_outage" as FailureInjectionType,
      targetId: firstNode?.id || "node-1",
      targetType: "node" as const,
      startMs: 10_000,
      durationMs: 25_000,
      severity: "critical" as const,
      recoveryBehavior: "automatic" as const,
      parameters: { failoverDelayMs: 15_000 },
    };

    onScenarioChange({
      ...scenario,
      injections: [...scenario.injections, newInj],
    });
  };

  const handleRemoveInjection = (id: string) => {
    if (scenario.injections.length <= 1) return; // Keep at least 1 injection
    onScenarioChange({
      ...scenario,
      injections: scenario.injections.filter((inj) => inj.id !== id),
    });
  };

  return (
    <div className={`flex flex-col h-full bg-surface-01 border border-border-default rounded-md overflow-hidden ${className}`}>
      {/* Header Tabs */}
      <div className="flex border-b border-border-subtle bg-surface-02 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveSection("preset")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
            activeSection === "preset"
              ? "bg-surface-04 text-white font-semibold shadow-level-1 border border-border-default"
              : "text-text-muted hover:text-white"
          }`}
        >
          Presets
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("injections")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
            activeSection === "injections"
              ? "bg-surface-04 text-white font-semibold shadow-level-1 border border-border-default"
              : "text-text-muted hover:text-white"
          }`}
        >
          Injections ({scenario.injections.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("journeys")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
            activeSection === "journeys"
              ? "bg-surface-04 text-white font-semibold shadow-level-1 border border-border-default"
              : "text-text-muted hover:text-white"
          }`}
        >
          Journeys ({scenario.criticalJourneys.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-4 text-xs">
        {activeSection === "preset" && (
          <div className="space-y-3">
            <div className="text-text-secondary">
              Select an industry-standard failure scenario preset to stress-test architecture resilience:
            </div>

            <div className="space-y-2">
              {Object.values(SIMULATION_PRESETS).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPreset(p.id)}
                  className={`p-3 rounded-md border cursor-pointer transition-all ${
                    selectedPresetId === p.id
                      ? "bg-surface-03 border-border-strong text-white shadow-level-3"
                      : "bg-surface-02 border-border-subtle text-text-secondary hover:bg-surface-03 hover:border-border-default"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{p.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-surface-04 border border-border-subtle uppercase">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border-subtle">
              <label className="block text-[11px] text-text-muted mb-1 font-mono">
                Simulation Horizon (Seconds):
              </label>
              <input
                type="number"
                min={10}
                max={300}
                value={scenario.durationMs / 1000}
                onChange={(e) => handleUpdateDuration(Number(e.target.value))}
                className="w-full bg-surface-02 border border-border-default rounded-md px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-border-strong"
              />
            </div>
          </div>
        )}

        {activeSection === "injections" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-medium">Configured Injections</span>
              <button
                type="button"
                onClick={handleAddInjection}
                className="flex items-center gap-1 px-2 py-1 bg-surface-03 hover:bg-surface-04 border border-border-default rounded-md text-[11px] text-white"
              >
                <PlusIcon className="w-3 h-3" />
                <span>Add Failure</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {scenario.injections.map((inj, idx) => (
                <div
                  key={inj.id}
                  className="p-3 bg-surface-02 border border-border-subtle rounded-md space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">#{idx + 1}: {inj.name}</span>
                    {scenario.injections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInjection(inj.id)}
                        className="text-text-muted hover:text-red-400 p-1"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="text-text-muted block mb-0.5">Target Node:</label>
                      <select
                        value={inj.targetId}
                        onChange={(e) => {
                          const updated = scenario.injections.map((i) =>
                            i.id === inj.id ? { ...i, targetId: e.target.value } : i
                          );
                          onScenarioChange({ ...scenario, injections: updated });
                        }}
                        className="w-full bg-surface-03 border border-border-default rounded-md px-2 py-1 text-white font-mono text-[11px]"
                      >
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {(n.data?.label as string) || n.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-text-muted block mb-0.5">Failure Type:</label>
                      <select
                        value={inj.type}
                        onChange={(e) => {
                          const updated = scenario.injections.map((i) =>
                            i.id === inj.id ? { ...i, type: e.target.value as FailureInjectionType } : i
                          );
                          onScenarioChange({ ...scenario, injections: updated });
                        }}
                        className="w-full bg-surface-03 border border-border-default rounded-md px-2 py-1 text-white font-mono text-[11px]"
                      >
                        <option value="component_outage">Component Outage</option>
                        <option value="database_outage">Database Outage</option>
                        <option value="cache_outage">Cache Outage</option>
                        <option value="latency_spike">Latency Spike</option>
                        <option value="network_partition">Network Partition</option>
                        <option value="external_dependency_timeout">External API Timeout</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="text-text-muted block mb-0.5">Start (seconds):</label>
                      <input
                        type="number"
                        min={0}
                        value={inj.startMs / 1000}
                        onChange={(e) => {
                          const updated = scenario.injections.map((i) =>
                            i.id === inj.id ? { ...i, startMs: Number(e.target.value) * 1000 } : i
                          );
                          onScenarioChange({ ...scenario, injections: updated });
                        }}
                        className="w-full bg-surface-03 border border-border-default rounded-md px-2 py-1 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-text-muted block mb-0.5">Duration (seconds):</label>
                      <input
                        type="number"
                        min={1}
                        value={inj.durationMs / 1000}
                        onChange={(e) => {
                          const updated = scenario.injections.map((i) =>
                            i.id === inj.id ? { ...i, durationMs: Number(e.target.value) * 1000 } : i
                          );
                          onScenarioChange({ ...scenario, injections: updated });
                        }}
                        className="w-full bg-surface-03 border border-border-default rounded-md px-2 py-1 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "journeys" && (
          <div className="space-y-3">
            <div className="text-text-secondary">
              Critical user journeys define end-to-end business operations. When any required component fails, the journey becomes unavailable.
            </div>

            <div className="space-y-2">
              {scenario.criticalJourneys.map((j) => (
                <div
                  key={j.id}
                  className="p-3 bg-surface-02 border border-border-subtle rounded-md space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold text-white">
                    <span>{j.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-surface-04 border border-border-subtle rounded-md">
                      {j.criticality}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted">{j.description}</p>
                  <div className="text-[10px] font-mono text-text-secondary">
                    Required: {j.requiredNodeIds.join(" ➔ ")}
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
