"use client";

import * as React from "react";
import type {
  BenchmarkOperation,
  WorkloadProfile,
  WorkloadStage,
} from "@nxtqr/architecture-intelligence";
import { PlusIcon, TrashIcon, ActivityIcon, SettingsIcon } from "@nxtqr/icons";

export interface WorkloadProfileEditorProps {
  profile: WorkloadProfile;
  operations: BenchmarkOperation[];
  onModelTypeChange: (type: "closed_loop" | "open_loop") => void;
  onUpdateStage: (stageId: string, updates: Partial<WorkloadStage>) => void;
  onAddStage: (stage: WorkloadStage) => void;
  onRemoveStage: (stageId: string) => void;
  onUpdateOperation: (opId: string, updates: Partial<BenchmarkOperation>) => void;
  onAddOperation: (op: BenchmarkOperation) => void;
  onRemoveOperation: (opId: string) => void;
}

export function WorkloadProfileEditor({
  profile,
  operations,
  onModelTypeChange,
  onUpdateStage,
  onAddStage,
  onRemoveStage,
  onUpdateOperation,
  onAddOperation,
  onRemoveOperation,
}: WorkloadProfileEditorProps) {
  const [activeTab, setActiveTab] = React.useState<"stages" | "operations">("stages");

  const handleAddStage = () => {
    const nextIdx = profile.stages.length + 1;
    const isClosed = profile.modelType === "closed_loop";
    const newStage: WorkloadStage = {
      id: `stg-${Date.now()}`,
      name: `Stage ${nextIdx}`,
      stageType: "steady",
      durationSeconds: 60,
      targetVUs: isClosed ? profile.maxVUs : undefined,
      targetRps: !isClosed ? profile.targetRps : undefined,
    };
    onAddStage(newStage);
  };

  const handleAddOperation = () => {
    const nextIdx = operations.length + 1;
    const newOp: BenchmarkOperation = {
      id: `op-${Date.now()}`,
      name: `GET /api/v1/endpoint-${nextIdx}`,
      method: "GET",
      path: `/api/v1/endpoint-${nextIdx}`,
      weight: 20,
      expectedStatus: 200,
    };
    onAddOperation(newOp);
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] border-r border-[#262626] select-none text-xs">
      {/* 1. Model Selector Header */}
      <div className="p-3 bg-[#0D0D0D] border-b border-[#262626] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#858585]">
            Workload Model Type
          </span>
          <span className="font-mono text-[10px] text-[#666666]">
            {profile.modelType === "closed_loop" ? "Concurrency (VUs)" : "Arrival Rate (RPS)"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-0.5 rounded-md bg-[#141414] border border-[#262626]">
          <button
            type="button"
            onClick={() => onModelTypeChange("closed_loop")}
            className={`py-1.5 px-2 rounded-md font-mono text-[11px] font-medium transition-all ${
              profile.modelType === "closed_loop"
                ? "bg-[#262626] text-white shadow-level-1 border border-[#333333]"
                : "text-[#858585] hover:text-white"
            }`}
          >
            Closed-Loop (VUs)
          </button>
          <button
            type="button"
            onClick={() => onModelTypeChange("open_loop")}
            className={`py-1.5 px-2 rounded-md font-mono text-[11px] font-medium transition-all ${
              profile.modelType === "open_loop"
                ? "bg-[#262626] text-white shadow-level-1 border border-[#333333]"
                : "text-[#858585] hover:text-white"
            }`}
          >
            Open-Loop (Arrival Rate)
          </button>
        </div>

        {/* Model summary chip */}
        <p className="text-[11px] text-[#858585] leading-relaxed">
          {profile.modelType === "closed_loop"
            ? "Simulates concurrent virtual users in loops with think time. Throughput is dependent on system response time."
            : "Schedules independent request arrivals. When backend saturates, arrival queues form or iterations drop."}
        </p>
      </div>

      {/* 2. Sub-tabs */}
      <div className="flex items-center border-b border-[#262626] bg-[#0D0D0D] px-2 pt-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("stages")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-medium text-[11px] transition-colors border-t border-x ${
            activeTab === "stages"
              ? "bg-[#141414] border-[#333333] text-white"
              : "border-transparent text-[#858585] hover:text-white"
          }`}
        >
          <ActivityIcon className="w-3.5 h-3.5" />
          Execution Stages ({profile.stages.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("operations")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-medium text-[11px] transition-colors border-t border-x ${
            activeTab === "operations"
              ? "bg-[#141414] border-[#333333] text-white"
              : "border-transparent text-[#858585] hover:text-white"
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          Request Mix &amp; Ops ({operations.length})
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {activeTab === "stages" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#858585]">
                Stage Timeline Sequence
              </span>
              <button
                type="button"
                onClick={handleAddStage}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-[#B5B5B5] hover:text-white text-[10px] font-mono transition-colors"
              >
                <PlusIcon className="w-3 h-3" />
                Add Stage
              </button>
            </div>

            {profile.stages.map((stage, idx) => (
              <div
                key={stage.id}
                className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] hover:border-[#262626] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-[#666666]">#{idx + 1}</span>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => onUpdateStage(stage.id, { name: e.target.value })}
                    className="flex-1 bg-[#141414] border border-[#262626] rounded-md px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#404040]"
                  />
                  {profile.stages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveStage(stage.id)}
                      className="p-1 rounded-md text-[#666666] hover:text-red-400 transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-[#666666] block font-mono">Stage Type</label>
                    <select
                      value={stage.stageType}
                      onChange={(e) => onUpdateStage(stage.id, { stageType: e.target.value as any })}
                      className="w-full bg-[#141414] border border-[#262626] rounded-md px-1.5 py-1 text-[11px] text-[#B5B5B5] focus:outline-none focus:border-[#404040]"
                    >
                      <option value="warmup">Warmup</option>
                      <option value="baseline">Baseline</option>
                      <option value="ramp_up">Ramp-Up</option>
                      <option value="steady">Steady Peak</option>
                      <option value="spike">Spike</option>
                      <option value="recovery">Recovery</option>
                      <option value="cooldown">Cooldown</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#666666] block font-mono">Duration (s)</label>
                    <input
                      type="number"
                      min="1"
                      value={stage.durationSeconds}
                      onChange={(e) =>
                        onUpdateStage(stage.id, { durationSeconds: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-full bg-[#141414] border border-[#262626] rounded-md px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-[#404040]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#666666] block font-mono">
                      {profile.modelType === "closed_loop" ? "Target VUs" : "Target RPS"}
                    </label>
                    {profile.modelType === "closed_loop" ? (
                      <input
                        type="number"
                        min="0"
                        value={stage.targetVUs ?? profile.maxVUs}
                        onChange={(e) =>
                          onUpdateStage(stage.id, { targetVUs: Math.max(0, parseInt(e.target.value) || 0) })
                        }
                        className="w-full bg-[#141414] border border-[#262626] rounded-md px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-[#404040]"
                      />
                    ) : (
                      <input
                        type="number"
                        min="1"
                        value={stage.targetRps ?? profile.targetRps}
                        onChange={(e) =>
                          onUpdateStage(stage.id, { targetRps: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        className="w-full bg-[#141414] border border-[#262626] rounded-md px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-[#404040]"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#858585]">
                Operations &amp; Weights
              </span>
              <button
                type="button"
                onClick={handleAddOperation}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-[#B5B5B5] hover:text-white text-[10px] font-mono transition-colors"
              >
                <PlusIcon className="w-3 h-3" />
                Add Op
              </button>
            </div>

            {operations.map((op) => (
              <div
                key={op.id}
                className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] hover:border-[#262626] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626] font-mono text-[10px] text-emerald-400">
                    {op.method}
                  </span>
                  <input
                    type="text"
                    value={op.path}
                    onChange={(e) => onUpdateOperation(op.id, { path: e.target.value })}
                    className="flex-1 bg-[#141414] border border-[#262626] rounded-md px-2 py-0.5 font-mono text-xs text-white focus:outline-none focus:border-[#404040]"
                  />
                  {operations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveOperation(op.id)}
                      className="p-1 rounded-md text-[#666666] hover:text-red-400 transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-[#666666] block font-mono">Weight (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={op.weight}
                      onChange={(e) =>
                        onUpdateOperation(op.id, { weight: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-full bg-[#141414] border border-[#262626] rounded-md px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-[#404040]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#666666] block font-mono">Expected Status</label>
                    <input
                      type="number"
                      value={op.expectedStatus}
                      onChange={(e) =>
                        onUpdateOperation(op.id, { expectedStatus: parseInt(e.target.value) || 200 })
                      }
                      className="w-full bg-[#141414] border border-[#262626] rounded-md px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-[#404040]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#666666] block font-mono">Target Node</label>
                    <span className="block px-2 py-1 rounded-md bg-[#141414] border border-[#262626] text-[10px] font-mono text-[#858585] truncate">
                      {op.targetComponentId || "unmapped"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
