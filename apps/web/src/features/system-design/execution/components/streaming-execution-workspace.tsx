"use client";

import * as React from "react";
import {
  CpuIcon,
  CloseIcon,
  PlayIcon,
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
import { useExecutionStore } from "../store/execution-store";
import {
  STREAMING_PRESET_METADATA,
  type StreamingScenarioPresetId,
  createStreamingPresetScenario,
  type PartitionRecord,
  type PartitionState,
} from "@nxtqr/architecture-execution";

export interface StreamingExecutionWorkspaceProps {
  onClose?: () => void;
}

type TabType =
  | "partitions"
  | "consumer_groups"
  | "lag_backpressure"
  | "rebalance"
  | "replication"
  | "delivery_dlq";

export function StreamingExecutionWorkspace({
  onClose,
}: StreamingExecutionWorkspaceProps) {
  const isStreamingWorkspaceOpen = useExecutionStore(
    (s) => s.isStreamingWorkspaceOpen
  );
  const toggleStreamingWorkspace = useExecutionStore(
    (s) => s.toggleStreamingWorkspace
  );
  const activeStreamingScenario = useExecutionStore(
    (s) => s.activeStreamingScenario
  );
  const playbackState = useExecutionStore((s) => s.playbackState);
  const runStreamingSimulation = useExecutionStore(
    (s) => s.runStreamingSimulation
  );

  const [activeTab, setActiveTab] = React.useState<TabType>("partitions");
  const [selectedRecord, setSelectedRecord] =
    React.useState<PartitionRecord | null>(null);

  if (!isStreamingWorkspaceOpen) {
    return null;
  }

  const currentFrame = playbackState.currentFrame;
  const streamingState = currentFrame?.runtimeState?.streamingState;
  const metrics = streamingState?.metrics;
  const partitions: Record<string, PartitionState> =
    streamingState?.partitions || {};
  const partitionList: PartitionState[] = Object.values(partitions);
  const consumerGroups = streamingState?.consumerGroups || {};
  const groupList = Object.values(consumerGroups);
  const primaryGroup = groupList[0];
  const dlqRecords = streamingState?.dlqRecords || [];

  const handleSelectPreset = (presetId: StreamingScenarioPresetId) => {
    const sc = createStreamingPresetScenario(presetId);
    runStreamingSimulation(sc);
  };

  const handleRunSimulation = () => {
    const sc =
      activeStreamingScenario ||
      createStreamingPresetScenario("single_partition_basic");
    runStreamingSimulation(sc);
  };

  const handleClose = () => {
    if (onClose) onClose();
    else toggleStreamingWorkspace(false);
  };

  return (
    <div
      role="region"
      aria-label="Event Streaming Execution Workspace"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface-01 border-t border-border-default shadow-level-3 flex flex-col max-h-[520px] h-[520px] select-none transition-transform"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-02 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-surface-03 border border-border-default text-text-secondary">
            <CpuIcon className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold tracking-wider uppercase text-foreground">
                Kafka Partitions & Event Streaming Engine
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-mono py-0 h-4 bg-surface-03 border-border-default text-text-secondary"
              >
                Phase 05.4.9
              </Badge>
              {activeStreamingScenario && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono py-0 h-4 bg-surface-03 border-border-subtle text-text-muted"
                >
                  {activeStreamingScenario.id.replace(/_/g, " ").toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="text-[11px] text-text-muted font-mono truncate max-w-xl">
              {activeStreamingScenario?.description ||
                "Deterministic virtual-time streaming simulation: topics, partitions, consumer groups, lag, rebalance, and retention."}
            </div>
          </div>
        </div>

        {/* Preset Selector & Simulation Controls */}
        <div className="flex items-center gap-2">
          <div className="w-72">
            <Select
              value={activeStreamingScenario?.id || "single_partition_basic"}
              onValueChange={(val) =>
                handleSelectPreset(val as StreamingScenarioPresetId)
              }
            >
              <SelectTrigger className="h-7 text-[11px] font-mono bg-surface-02 border-border-default text-foreground">
                <SelectValue placeholder="Select streaming preset..." />
              </SelectTrigger>
              <SelectContent className="bg-surface-02 border-border-default text-foreground max-h-72">
                {Object.values(STREAMING_PRESET_METADATA).map((meta) => (
                  <SelectItem
                    key={meta.id}
                    value={meta.id}
                    className="text-xs font-mono text-text-secondary focus:bg-surface-03 focus:text-foreground cursor-pointer"
                  >
                    <span className="font-medium text-foreground">
                      {meta.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={handleRunSimulation}
            className="h-7 px-2.5 text-xs font-mono bg-foreground text-background hover:bg-neutral-200 rounded-md gap-1 font-medium"
          >
            <PlayIcon className="w-3 h-3" />
            <span>Simulate</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-7 w-7 p-0 text-text-muted hover:text-foreground hover:bg-surface-03 rounded-md"
            title="Close workspace"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface-03 border-b border-border-subtle text-xs font-mono shrink-0">
        <div className="flex items-center gap-5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Produced:</span>
            <span className="text-foreground font-semibold">
              {metrics?.producedRecords || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Consumed:</span>
            <span className="text-foreground font-semibold">
              {metrics?.consumedRecords || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Committed:</span>
            <span className="text-foreground font-semibold">
              {metrics?.committedRecords || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Total Lag:</span>
            <span
              className={cn(
                "font-semibold",
                (metrics?.totalConsumerLag || 0) > 5
                  ? "text-text-secondary"
                  : "text-foreground"
              )}
            >
              {metrics?.totalConsumerLag || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Rebalances:</span>
            <span className="text-foreground font-semibold">
              {metrics?.rebalanceCount || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Duplicates:</span>
            <span className="text-text-secondary font-semibold">
              {metrics?.reprocessedRecords || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">DLQ Routed:</span>
            <span
              className={cn(
                "font-semibold",
                (metrics?.dlqRoutedRecords || 0) > 0
                  ? "text-text-secondary"
                  : "text-text-muted"
              )}
            >
              {metrics?.dlqRoutedRecords || 0}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-surface-02 p-0.5 rounded-md border border-border-subtle">
          {(
            [
              { id: "partitions", label: "Topic & Partitions" },
              { id: "consumer_groups", label: "Consumer Groups" },
              { id: "lag_backpressure", label: "Lag & Backpressure" },
              { id: "rebalance", label: "Rebalance & Scaling" },
              { id: "replication", label: "Replication & Mesh" },
              { id: "delivery_dlq", label: "Delivery & DLQ" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-surface-04 text-foreground font-semibold shadow-level-3 border border-border-strong"
                  : "text-text-muted hover:text-foreground hover:bg-surface-03"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents Area */}
      <div className="flex-1 overflow-auto p-4 bg-surface-01">
        {/* Tab 1: Topic & Partitions */}
        {activeTab === "partitions" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left: Partition Log Visualizer (8 cols) */}
            <div className="col-span-8 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Append-Only Partition Logs ({partitionList.length} Partitions)
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  Topic: {activeStreamingScenario?.topics[0]?.name || "orders.created"}
                </span>
              </div>

              <div className="p-3 space-y-4 flex-1 overflow-auto font-mono text-xs">
                {partitionList.map((part) => {
                  const position =
                    primaryGroup?.positions[part.id]?.committedNextOffset ?? 0;
                  return (
                    <div
                      key={part.id}
                      className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-xs">
                            Partition {part.partitionIndex} ({part.id})
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 h-3.5 border-border-subtle text-text-muted"
                          >
                            Leader: {part.leaderBrokerId}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 h-3.5 border-border-subtle text-text-muted"
                          >
                            HW: #{part.highWatermark}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-text-muted">
                          Log: [{part.logStartOffset}..{part.nextOffset}] (
                          {part.records.length} records)
                        </span>
                      </div>

                      {/* Horizontal Record Log Track */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                        {part.records.length === 0 ? (
                          <div className="text-[10px] text-text-disabled py-1">
                            (No records appended yet)
                          </div>
                        ) : (
                          part.records.map((rec) => {
                            const isCommitted = rec.offset < position;
                            const isSelected = selectedRecord?.id === rec.id;
                            return (
                              <button
                                key={rec.id}
                                onClick={() => setSelectedRecord(rec)}
                                className={cn(
                                  "px-2 py-1.5 rounded-md border text-left shrink-0 transition-colors flex flex-col gap-0.5 cursor-pointer",
                                  isSelected
                                    ? "bg-surface-04 border-border-strong text-foreground shadow-level-2"
                                    : isCommitted
                                      ? "bg-surface-03 border-border-default text-text-secondary hover:bg-surface-04"
                                      : "bg-surface-01 border-border-subtle text-text-muted hover:border-border-default"
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-[10px] text-foreground">
                                    #{rec.offset}
                                  </span>
                                  {rec.replayed && (
                                    <Badge
                                      variant="outline"
                                      className="text-[8px] py-0 h-3 border-border-subtle text-text-secondary"
                                    >
                                      REPLAY
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[9px] text-text-muted truncate max-w-[80px]">
                                  {rec.key || "keyless"}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Record Inspector (4 cols) */}
            <div className="col-span-4 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Record Inspector
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  {selectedRecord ? `#${selectedRecord.offset}` : "Select record"}
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-auto font-mono text-xs">
                {selectedRecord ? (
                  <div className="space-y-2.5">
                    <div className="p-2 rounded-md bg-surface-01 border border-border-default space-y-1">
                      <div className="text-[10px] text-text-muted uppercase">
                        Record Metadata
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-muted">Topic:</span>
                        <span className="text-foreground">{selectedRecord.topicId}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-muted">Partition:</span>
                        <span className="text-foreground">{selectedRecord.partitionId}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-muted">Monotonic Offset:</span>
                        <span className="text-foreground font-semibold">#{selectedRecord.offset}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-muted">Partition Key:</span>
                        <span className="text-foreground">{selectedRecord.key || "None (Round-Robin)"}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-muted">Producer:</span>
                        <span className="text-foreground">{selectedRecord.producerId}</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                      <div className="text-[10px] text-text-muted uppercase mb-1">
                        Payload Value (JSON)
                      </div>
                      <pre className="text-[10px] text-text-secondary overflow-x-auto max-h-48">
                        {JSON.stringify(selectedRecord.value, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-text-muted text-center">
                    <LayersIcon className="w-8 h-8 mb-2 text-text-disabled" />
                    <span>Click on any record block in the partition logs to inspect its payload and offset metadata.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Consumer Groups */}
        {activeTab === "consumer_groups" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            <div className="col-span-12 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden font-mono text-xs">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">
                  Consumer Group Membership & Exclusive Partition Assignments
                </span>
                <span className="text-[10px] text-text-muted">
                  Strategy: {primaryGroup?.config.assignmentStrategy.toUpperCase()} | Commit: {primaryGroup?.config.commitMode}
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-auto">
                {groupList.map((group) => (
                  <div
                    key={group.config.id}
                    className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-xs">
                          {group.config.name} ({group.config.id})
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] py-0 h-3.5 border-border-subtle text-text-muted"
                        >
                          Generation {group.generation}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] py-0 h-3.5 border-border-default text-text-secondary"
                        >
                          {group.rebalanceState.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-text-muted">
                        Topic: {group.config.topicId}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {group.config.consumers.map((consumer) => {
                        const assigned = group.assignments[consumer.id] || [];
                        const isIdle = assigned.length === 0;
                        return (
                          <div
                            key={consumer.id}
                            className={cn(
                              "p-2 rounded-md border flex items-center justify-between text-[11px]",
                              !consumer.isAlive
                                ? "bg-surface-04 border-border-strong text-text-disabled"
                                : isIdle
                                  ? "bg-surface-01 border-border-subtle text-text-muted opacity-70"
                                  : "bg-surface-01 border-border-subtle text-text-secondary"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  consumer.isAlive
                                    ? isIdle
                                      ? "bg-neutral-500"
                                      : "bg-foreground"
                                    : "bg-neutral-700"
                                )}
                              />
                              <span className="font-semibold text-foreground">
                                {consumer.name} ({consumer.id})
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] py-0 h-3.5 border-border-subtle text-text-muted"
                              >
                                {consumer.isAlive
                                  ? isIdle
                                    ? "IDLE (NO PARTITIONS)"
                                    : "ACTIVE"
                                  : "CRASHED"}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-text-muted">
                                Assigned: [
                                <span className="text-foreground font-semibold">
                                  {assigned.length > 0 ? assigned.join(", ") : "None"}
                                </span>
                                ]
                              </span>
                              <span className="text-[10px] text-text-muted">
                                Process Time: {consumer.processingTimeMs}ms
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Lag & Backpressure */}
        {activeTab === "lag_backpressure" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            <div className="col-span-12 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden font-mono text-xs">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">
                  Partition Log End vs Committed Offset Lag
                </span>
                <span className="text-[10px] text-text-muted">
                  Formula: Committed Lag = LogEndOffset - CommittedNextOffset
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-auto">
                {partitionList.map((part) => {
                  const pos = primaryGroup?.positions[part.id];
                  const committed = pos?.committedNextOffset ?? 0;
                  const logEnd = part.nextOffset;
                  const lag = Math.max(0, logEnd - committed);
                  const progressPct =
                    logEnd === 0 ? 100 : Math.round((committed / logEnd) * 100);

                  return (
                    <div
                      key={part.id}
                      className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-xs">
                            {part.id}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] py-0 h-3.5 font-bold",
                              lag > 0
                                ? "border-border-strong bg-surface-03 text-text-secondary"
                                : "border-border-default text-text-muted"
                            )}
                          >
                            {lag === 0 ? "IN SYNC (0 LAG)" : `${lag} UNCOMMITTED`}
                          </Badge>
                        </div>
                        <span className="text-text-muted text-[11px]">
                          Committed: #{committed} / Log End: #{logEnd}
                        </span>
                      </div>

                      {/* Lag Visual Bar */}
                      <div className="w-full bg-surface-03 h-2 rounded-md overflow-hidden border border-border-subtle">
                        <div
                          className="h-full bg-foreground transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <span>Assigned Consumer: {pos?.consumerId || "None"}</span>
                        <span>Consumption Progress: {progressPct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Rebalance & Scaling */}
        {activeTab === "rebalance" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            <div className="col-span-12 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden font-mono text-xs">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">
                  Consumer Group Rebalance State & Generation History
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 h-4 border-border-default text-text-muted"
                >
                  Status: {primaryGroup?.rebalanceState.toUpperCase()}
                </Badge>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-auto">
                <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Active Generation:</span>
                    <span className="text-foreground font-semibold">
                      Gen {primaryGroup?.generation || 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Assignment Strategy:</span>
                    <span className="text-foreground">
                      {primaryGroup?.config.assignmentStrategy}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Total Rebalances:</span>
                    <span className="text-foreground">
                      {metrics?.rebalanceCount || 0}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">
                    Rebalance Operations Log
                  </div>
                  {(primaryGroup?.history || []).length === 0 ? (
                    <div className="text-[11px] text-text-muted p-3 bg-surface-01 rounded-md border border-border-subtle text-center">
                      No rebalance events occurred in this scenario run.
                    </div>
                  ) : (
                    primaryGroup?.history.map((record) => (
                      <div
                        key={record.id}
                        className="p-2.5 rounded-md bg-surface-01 border border-border-strong space-y-1.5 text-[11px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            Generation {record.generation} Rebalance
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 h-3.5 border-border-subtle text-text-muted"
                          >
                            Trigger: {record.trigger}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-text-secondary">
                          Revoked Partitions: [
                          {record.revokedPartitions.join(", ") || "None"}]
                        </div>
                        <div className="text-[10px] text-text-muted">
                          New Assignments:{" "}
                          {Object.entries(record.newAssignments)
                            .map(([cid, pids]) => `${cid} -> [${pids.join(", ")}]`)
                            .join(" | ")}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Replication & Mesh */}
        {activeTab === "replication" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            <div className="col-span-12 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden font-mono text-xs">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">
                  Broker Cluster Topology & Partition Replication State
                </span>
                <span className="text-[10px] text-text-muted">
                  Replication Factor: 3
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-auto">
                <div className="grid grid-cols-3 gap-3">
                  {(activeStreamingScenario?.cluster.brokers || []).map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        "p-2.5 rounded-md border space-y-1 text-[11px]",
                        b.isAlive
                          ? "bg-surface-01 border-border-default text-text-secondary"
                          : "bg-surface-04 border-border-strong text-foreground opacity-70"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{b.name}</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] py-0 h-3.5 border-border-subtle text-text-muted"
                        >
                          {b.isAlive ? "ONLINE" : "CRASHED"}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-text-muted">
                        Host: {b.host}:{b.port}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">
                    Partition In-Sync Replicas (ISR)
                  </div>
                  {partitionList.map((part) => (
                    <div
                      key={part.id}
                      className="p-2.5 rounded-md bg-surface-01 border border-border-subtle flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-semibold text-foreground">
                          {part.id}
                        </span>
                        <span className="text-text-muted text-[10px] ml-2">
                          Leader: {part.leaderBrokerId} | High Watermark: #{part.highWatermark}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-text-muted">ISR:</span>
                        {part.isrBrokerIds.map((id) => (
                          <Badge
                            key={id}
                            variant="outline"
                            className="text-[9px] py-0 h-3.5 bg-surface-03 border-border-default text-foreground"
                          >
                            {id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Delivery Semantics & DLQ */}
        {activeTab === "delivery_dlq" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            <div className="col-span-12 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden font-mono text-xs">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">
                  Delivery Semantics, Idempotent Deduplication & Dead-Letter Queue
                </span>
                <span className="text-[10px] text-text-muted">
                  DLQ Records: {dlqRecords.length}
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-auto">
                <div className="p-2.5 rounded-md bg-surface-01 border border-border-default space-y-1.5 text-[11px]">
                  <div className="font-semibold text-foreground">
                    Configured Delivery Semantics:{" "}
                    {primaryGroup?.config.commitMode === "manual_before_processing"
                      ? "At-Most-Once (Pre-Commit)"
                      : "At-Least-Once (Post-Commit)"}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {primaryGroup?.config.commitMode === "manual_before_processing"
                      ? "Offsets are committed immediately upon fetch. If consumer crashes during execution, the record is skipped on restart."
                      : "Offsets are committed only after successful processing. Crashes before commit trigger replay/reprocessing on failover."}
                  </div>
                </div>

                {dlqRecords.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">
                      Diverted Dead-Letter Records ({dlqRecords.length})
                    </div>
                    {dlqRecords.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-md bg-surface-01 border border-border-strong flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <div className="font-semibold text-foreground">
                            {r.topicId} &rarr; {r.partitionId} (Offset #{r.offset})
                          </div>
                          <div className="text-[10px] text-text-muted">
                            Record ID: {r.id} | Key: {r.key || "none"}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] py-0 h-3.5 border-border-strong bg-surface-03 text-foreground font-bold"
                        >
                          POISON RECORD
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
