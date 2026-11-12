"use client";

import * as React from "react";
import {
  LayersIcon,
  CloseIcon,
  PlayIcon,
  ShieldIcon,
  ActivityIcon,
  CpuIcon,
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
  RAFT_PRESET_METADATA,
  type RaftPresetId,
  createRaftPresetScenario,
  type RaftNodeRuntimeState,
  type RaftMessageEnvelope,
  type RaftVoteInspectionRecord,
  type RaftClientCommandStatus,
} from "@nxtqr/architecture-execution";

type RaftWorkspaceTab =
  | "cluster"
  | "votes"
  | "logs"
  | "statemachine"
  | "network"
  | "invariants";

function roleBadgeLabel(node: RaftNodeRuntimeState): string {
  if (!node.online) return "CRASHED";
  if (node.role === "leader") return "LEADER";
  if (node.role === "candidate") return "CANDIDATE";
  return "FOLLOWER";
}

function formatCommandSummary(cmd: { op: string; key: string; value?: string | number }): string {
  if (cmd.op === "DELETE") return `DEL ${cmd.key}`;
  if (cmd.op === "INCREMENT") return `INC ${cmd.key} +${cmd.value ?? 1}`;
  return `SET ${cmd.key}=${String(cmd.value ?? "")}`;
}

export function RaftWorkspace() {
  const toggleRaftWorkspace = useExecutionStore((s) => s.toggleRaftWorkspace);
  const activeRaftScenario = useExecutionStore((s) => s.activeRaftScenario);
  const setRaftScenario = useExecutionStore((s) => s.setRaftScenario);
  const runRaftSimulation = useExecutionStore((s) => s.runRaftSimulation);
  const trace = useExecutionStore((s) => s.trace);
  const currentStepIndex = useExecutionStore((s) => s.playbackState.currentStepIndex);

  const [activeTab, setActiveTab] = React.useState<RaftWorkspaceTab>("cluster");
  const [selectedPreset, setSelectedPreset] = React.useState<RaftPresetId>(
    (activeRaftScenario?.presetId as RaftPresetId) || "healthy_three_node_cluster"
  );

  React.useEffect(() => {
    if (!activeRaftScenario) {
      const initial = createRaftPresetScenario(selectedPreset);
      setRaftScenario(initial);
    } else if (
      activeRaftScenario.presetId &&
      RAFT_PRESET_METADATA.some((p) => p.id === activeRaftScenario.presetId)
    ) {
      setSelectedPreset(activeRaftScenario.presetId as RaftPresetId);
    }
  }, [activeRaftScenario, selectedPreset, setRaftScenario]);

  const activeScenario =
    activeRaftScenario || createRaftPresetScenario(selectedPreset);

  const currentFrame = trace?.frames?.[currentStepIndex];
  const raftState = currentFrame?.runtimeState?.raftState;
  const metrics = raftState?.metrics;
  const nodesList: RaftNodeRuntimeState[] = raftState
    ? Object.values(raftState.nodes)
    : [];
  const messagesList: RaftMessageEnvelope[] = raftState
    ? raftState.recentMessages
    : [];
  const votesList: RaftVoteInspectionRecord[] = raftState
    ? raftState.recentVotes
    : [];
  const clientCommands: RaftClientCommandStatus[] = raftState
    ? raftState.clientCommands
    : [];
  const activePartitions = raftState?.activePartitions ?? [];
  const invariants = raftState?.invariants;

  const leaderNode = nodesList.find((n) => n.role === "leader" && n.online) ?? null;
  const maxLogLen = Math.max(
    1,
    ...nodesList.map((n) => n.persistent.log.length)
  );

  const handlePresetChange = (value: string) => {
    const presetId = value as RaftPresetId;
    setSelectedPreset(presetId);
    const next = createRaftPresetScenario(presetId);
    setRaftScenario(next);
    runRaftSimulation(next);
  };

  const handleTogglePreVote = () => {
    const next = {
      ...activeScenario,
      extensions: {
        ...activeScenario.extensions,
        preVoteEnabled: !activeScenario.extensions.preVoteEnabled,
      },
    };
    setRaftScenario(next);
    runRaftSimulation(next);
  };

  const handleToggleCheckQuorum = () => {
    const next = {
      ...activeScenario,
      extensions: {
        ...activeScenario.extensions,
        checkQuorumEnabled: !activeScenario.extensions.checkQuorumEnabled,
      },
    };
    setRaftScenario(next);
    runRaftSimulation(next);
  };

  const handleRunSimulation = () => {
    runRaftSimulation(activeScenario);
  };

  return (
    <div
      role="region"
      aria-label="Distributed Consensus & Raft Protocol Workspace"
      className={cn(
        "fixed bottom-4 left-4 right-4 z-40 h-[450px] max-w-[1260px] mx-auto",
        "bg-surface-01 border border-border-default rounded-md shadow-level-2 flex flex-col overflow-hidden"
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-surface-02">
        <div className="flex items-center gap-2 min-w-0">
          <LayersIcon className="w-4 h-4 text-text-secondary shrink-0" />
          <span className="text-xs font-semibold text-foreground tracking-tight truncate">
            Distributed Consensus, Leader Election &amp; Raft Protocol Simulator
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-border-default text-text-muted rounded-md shrink-0"
          >
            {metrics
              ? `Term #${metrics.currentMaxTerm} · Quorum ${metrics.majorityQuorum}/${metrics.clusterSize} · Leader: ${metrics.currentLeaderId ?? "None"}`
              : "Ready"}
          </Badge>
          {invariants && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-mono rounded-md shrink-0",
                invariants.allPassed
                  ? "border-border-default text-text-secondary"
                  : "border-destructive text-destructive"
              )}
            >
              {invariants.allPassed
                ? "Invariants: PASS"
                : `Violations: ${invariants.violations.length}`}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-7 w-[250px] text-[11px] font-mono bg-surface-03 border-border-default text-foreground rounded-md">
              <SelectValue placeholder="Select Raft consensus scenario preset" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default text-foreground rounded-md max-h-[340px]">
              {RAFT_PRESET_METADATA.map((meta) => (
                <SelectItem
                  key={meta.id}
                  value={meta.id}
                  className="text-[11px] font-mono focus:bg-surface-04"
                >
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRunSimulation}
            className="h-7 px-2.5 text-[11px] font-mono bg-foreground text-background hover:bg-text-secondary rounded-md gap-1.5"
          >
            <PlayIcon className="w-3 h-3" />
            <span>Run Raft Sim</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRaftWorkspace(false)}
            aria-label="Close Raft Consensus Workspace"
            className="h-7 w-7 p-0 text-text-muted hover:text-foreground hover:bg-surface-03 rounded-md"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs + Protocol Extension Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-border-subtle bg-surface-01">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              { id: "cluster", label: "Cluster & Election" },
              { id: "votes", label: "Votes & Quorum" },
              { id: "logs", label: "Log Replication Matrix" },
              { id: "statemachine", label: "State Machine & Client Ops" },
              { id: "network", label: "Network, RPCs & Faults" },
              { id: "invariants", label: "Protocol Invariants" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-surface-04 text-foreground font-semibold border border-border-strong shadow-level-3"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-02 border border-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <button
            type="button"
            onClick={handleTogglePreVote}
            className={cn(
              "px-2 py-1 rounded-md border transition-colors",
              activeScenario.extensions.preVoteEnabled
                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
            )}
          >
            Pre-Vote: {activeScenario.extensions.preVoteEnabled ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={handleToggleCheckQuorum}
            className={cn(
              "px-2 py-1 rounded-md border transition-colors",
              activeScenario.extensions.checkQuorumEnabled
                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
            )}
          >
            CheckQuorum: {activeScenario.extensions.checkQuorumEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Live Step Explanation Strip */}
      <div className="px-3 py-1.5 border-b border-border-subtle bg-surface-02 flex items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <ActivityIcon className="w-3.5 h-3.5 text-text-secondary shrink-0" />
          <span className="text-foreground font-semibold truncate">
            {currentFrame?.stepTitle ?? activeScenario.name}
          </span>
          <span className="text-text-muted truncate hidden sm:inline">
            — {currentFrame?.stepExplanation ?? activeScenario.description}
          </span>
        </div>
        <span className="text-text-secondary shrink-0">
          {currentFrame ? `t=${currentFrame.virtualTimeMs}ms · Frame ${currentStepIndex + 1}/${trace?.frames.length ?? 0}` : "Press Run Raft Sim"}
        </span>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-3 bg-surface-01">
        {!raftState ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <CpuIcon className="w-6 h-6 text-text-muted" />
            <p className="text-xs font-mono text-text-secondary">
              No Raft simulation trace loaded yet. Select a preset or click &quot;Run Raft Sim&quot;.
            </p>
          </div>
        ) : (
          <>
            {/* TAB 1: Cluster & Election */}
            {activeTab === "cluster" && (
              <div className="space-y-3">
                {/* Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {[
                    { label: "Cluster Size", val: `${metrics?.clusterSize ?? 0} nodes` },
                    { label: "Majority Quorum", val: `${metrics?.majorityQuorum ?? 0} votes` },
                    { label: "Highest Term", val: `#${metrics?.currentMaxTerm ?? 0}` },
                    { label: "Current Leader", val: metrics?.currentLeaderId ?? "None" },
                    { label: "Elections / Changes", val: `${metrics?.electionCount ?? 0} / ${metrics?.leaderChanges ?? 0}` },
                    { label: "RPC Deliv / Drop", val: `${metrics?.rpcDeliveredCount ?? 0} / ${metrics?.rpcDroppedCount ?? 0}` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-2 rounded-md bg-surface-02 border border-border-subtle"
                    >
                      <div className="text-[10px] font-mono text-text-muted uppercase">
                        {item.label}
                      </div>
                      <div className="text-xs font-mono font-semibold text-foreground mt-0.5 truncate">
                        {item.val}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Node Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {nodesList.map((node) => {
                    const isLeader = node.online && node.role === "leader";
                    const isCandidate = node.online && node.role === "candidate";
                    const isIsolated = activePartitions.some(
                      (g) => g.length === 1 && g[0] === node.id
                    );
                    return (
                      <div
                        key={node.id}
                        className={cn(
                          "p-2.5 rounded-md border flex flex-col gap-1.5 transition-colors",
                          isLeader
                            ? "bg-surface-04 border-border-strong shadow-level-3"
                            : isCandidate
                              ? "bg-surface-03 border-border-hover"
                              : "bg-surface-02 border-border-default",
                          !node.online && "opacity-60"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-mono font-semibold text-foreground">
                            {node.label}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-mono rounded-md",
                              isLeader
                                ? "border-border-strong bg-surface-03 text-foreground font-semibold"
                                : !node.online
                                  ? "border-destructive text-destructive"
                                  : "border-border-default text-text-secondary"
                            )}
                          >
                            {roleBadgeLabel(node)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                          <span className="text-text-muted">Term:</span>
                          <span className="text-foreground text-right">#{node.persistent.currentTerm}</span>

                          <span className="text-text-muted">VotedFor:</span>
                          <span className="text-text-secondary text-right truncate">
                            {node.persistent.votedFor ?? "null"}
                          </span>

                          <span className="text-text-muted">Log Length:</span>
                          <span className="text-foreground text-right">{node.persistent.log.length}</span>

                          <span className="text-text-muted">Commit / Applied:</span>
                          <span className="text-foreground text-right">
                            {node.volatile.commitIndex} / {node.volatile.lastApplied}
                          </span>

                          <span className="text-text-muted">Votes Recv:</span>
                          <span className="text-text-secondary text-right">
                            {node.votesReceived.length}/{metrics?.majorityQuorum ?? 0}
                          </span>
                        </div>

                        {isIsolated && (
                          <div className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-surface-03 border border-border-default text-text-secondary text-center">
                            Partition Isolated
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Votes & Quorum */}
            {activeTab === "votes" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {nodesList.map((node) => {
                    const quorum = metrics?.majorityQuorum ?? 2;
                    const tally = node.votesReceived.length;
                    return (
                      <div
                        key={node.id}
                        className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-foreground font-semibold">
                            {node.label} ({roleBadgeLabel(node)})
                          </span>
                          <span className="text-text-secondary">
                            Votes: {tally} / {quorum}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-md bg-surface-01 border border-border-subtle overflow-hidden">
                          <div
                            className="h-full bg-text-secondary transition-all"
                            style={{ width: `${Math.min(100, (tally / quorum) * 100)}%` }}
                          />
                        </div>
                        <div className="text-[10px] font-mono text-text-muted">
                          Grantors: {node.votesReceived.length > 0 ? node.votesReceived.join(", ") : "None"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-md border border-border-default bg-surface-02 overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-border-subtle text-[11px] font-mono font-semibold text-foreground">
                    RequestVote Evaluations &amp; Log Freshness Checks ({votesList.length})
                  </div>
                  <div className="divide-y divide-border-subtle max-h-[200px] overflow-y-auto">
                    {votesList.length === 0 ? (
                      <div className="p-3 text-[11px] font-mono text-text-muted">
                        No RequestVote RPCs recorded at this frame yet.
                      </div>
                    ) : (
                      votesList.map((v, idx) => (
                        <div
                          key={`${v.atMs}-${v.voterId}-${v.candidateId}-${idx}`}
                          className="px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted">t={v.atMs}ms</span>
                            <span className="text-foreground">
                              {v.voterId} → {v.candidateId} (T{v.term}
                              {v.isPreVote ? " PreVote" : ""})
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] rounded-md",
                                v.voteGranted
                                  ? "border-border-strong text-foreground"
                                  : "border-border-default text-text-muted"
                              )}
                            >
                              {v.voteGranted ? "GRANTED" : "DENIED"}
                            </Badge>
                          </div>
                          <div className="text-text-secondary">
                            Cand({v.candidateLastLogTerm}:{v.candidateLastLogIndex}) vs Voter(
                            {v.voterLastLogTerm}:{v.voterLastLogIndex}) · {v.explanation}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Log Replication Matrix */}
            {activeTab === "logs" && (
              <div className="space-y-3">
                {leaderNode?.leader && (
                  <div className="p-2 rounded-md bg-surface-02 border border-border-subtle flex flex-wrap items-center gap-3 text-[10px] font-mono">
                    <span className="text-foreground font-semibold">
                      Leader Cursors ({leaderNode.label}):
                    </span>
                    {Object.keys(leaderNode.leader.nextIndex).map((peerId) => (
                      <span key={peerId} className="text-text-secondary">
                        {peerId}: next={leaderNode.leader!.nextIndex[peerId]}, match=
                        {leaderNode.leader!.matchIndex[peerId]}
                      </span>
                    ))}
                  </div>
                )}

                <div className="rounded-md border border-border-default bg-surface-02 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px] font-mono">
                    <thead>
                      <tr className="border-b border-border-subtle bg-surface-03 text-text-secondary">
                        <th className="p-2">Node (Role · C/A)</th>
                        {Array.from({ length: maxLogLen }, (_, i) => i + 1).map((idx) => (
                          <th key={idx} className="p-2 min-w-[140px]">
                            Index #{idx}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {nodesList.map((node) => (
                        <tr key={node.id}>
                          <td className="p-2 font-semibold text-foreground whitespace-nowrap">
                            {node.label}{" "}
                            <span className="text-text-muted">
                              ({roleBadgeLabel(node)} · C:{node.volatile.commitIndex} / A:
                              {node.volatile.lastApplied})
                            </span>
                          </td>
                          {Array.from({ length: maxLogLen }, (_, i) => i + 1).map((idx) => {
                            const entry = node.persistent.log.find((e) => e.index === idx);
                            if (!entry) {
                              return (
                                <td key={idx} className="p-2 text-text-disabled">
                                  [empty]
                                </td>
                              );
                            }
                            const isApplied = idx <= node.volatile.lastApplied;
                            const isCommitted = idx <= node.volatile.commitIndex;
                            return (
                              <td key={idx} className="p-2">
                                <div
                                  className={cn(
                                    "p-1.5 rounded-md border",
                                    isApplied
                                      ? "bg-surface-04 border-border-strong text-foreground"
                                      : isCommitted
                                        ? "bg-surface-03 border-border-hover text-foreground"
                                        : "bg-surface-01 border-border-subtle text-text-secondary"
                                  )}
                                >
                                  <div>
                                    T{entry.term} · {formatCommandSummary(entry.command)}
                                  </div>
                                  <div className="text-[9px] text-text-muted mt-0.5">
                                    {isApplied
                                      ? "APPLIED"
                                      : isCommitted
                                        ? "COMMITTED"
                                        : "UNCOMMITTED"}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: State Machine & Client Ops */}
            {activeTab === "statemachine" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-md border border-border-default bg-surface-02 p-2.5 space-y-2">
                  <div className="text-[11px] font-mono font-semibold text-foreground">
                    Deterministic KV State Machine Replicas
                  </div>
                  <div className="space-y-2 max-h-[230px] overflow-y-auto">
                    {nodesList.map((node) => {
                      const entries = Object.entries(node.stateMachine);
                      return (
                        <div
                          key={node.id}
                          className="p-2 rounded-md bg-surface-01 border border-border-subtle text-[10px] font-mono"
                        >
                          <div className="flex items-center justify-between text-foreground font-semibold mb-1">
                            <span>{node.label}</span>
                            <span className="text-text-muted">
                              lastApplied={node.volatile.lastApplied}
                            </span>
                          </div>
                          {entries.length === 0 ? (
                            <span className="text-text-disabled">{"{}"} (no applied entries)</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {entries.map(([k, v]) => (
                                <span
                                  key={k}
                                  className="px-1.5 py-0.5 rounded-md bg-surface-03 border border-border-default text-text-secondary"
                                >
                                  {k}={String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-md border border-border-default bg-surface-02 p-2.5 space-y-2">
                  <div className="text-[11px] font-mono font-semibold text-foreground">
                    Client Command Tracking ({clientCommands.length})
                  </div>
                  <div className="space-y-1.5 max-h-[230px] overflow-y-auto">
                    {clientCommands.length === 0 ? (
                      <div className="text-[11px] font-mono text-text-muted">
                        No client KV commands scheduled in this preset.
                      </div>
                    ) : (
                      clientCommands.map((cmd) => (
                        <div
                          key={cmd.commandId}
                          className="p-2 rounded-md bg-surface-01 border border-border-subtle text-[10px] font-mono space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-foreground font-semibold">
                              {cmd.commandId} (t={cmd.atMs}ms)
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] rounded-md",
                                cmd.status === "applied" || cmd.status === "committed"
                                  ? "border-border-strong text-foreground"
                                  : cmd.status === "uncertain"
                                    ? "border-warning text-warning"
                                    : "border-border-default text-text-muted"
                              )}
                            >
                              {cmd.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-text-secondary">{cmd.summary}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Network, RPCs & Faults */}
            {activeTab === "network" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-md border border-border-default bg-surface-02 p-2.5 space-y-2">
                  <div className="text-[11px] font-mono font-semibold text-foreground">
                    Network Topology &amp; Partitions
                  </div>
                  <div className="text-[10px] font-mono text-text-secondary space-y-1">
                    <div>Base RPC Latency: {activeScenario.network.baseLatencyMs + raftState.addedNetworkLatencyMs}ms</div>
                    <div>Drop Probability: {activeScenario.network.packetLossProbability}</div>
                    <div>Reorder Probability: {activeScenario.network.reorderProbability}</div>
                    <div>Duplicate Probability: {activeScenario.network.duplicateProbability}</div>
                  </div>
                  <div className="pt-1 border-t border-border-subtle space-y-1 text-[10px] font-mono">
                    <div className="text-foreground font-semibold">Active Partitions:</div>
                    {activePartitions.length === 0 ? (
                      <div className="text-text-muted">Connected Mesh (No Partitions)</div>
                    ) : (
                      activePartitions.map((grp, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 rounded-md bg-surface-03 border border-border-default text-text-secondary"
                        >
                          Group {idx + 1}: [{grp.join(", ")}]
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 rounded-md border border-border-default bg-surface-02 p-2.5 space-y-2">
                  <div className="text-[11px] font-mono font-semibold text-foreground">
                    Recent RPC Envelopes ({messagesList.length})
                  </div>
                  <div className="space-y-1 max-h-[225px] overflow-y-auto">
                    {messagesList.length === 0 ? (
                      <div className="text-[11px] font-mono text-text-muted">
                        No RPC messages traced yet.
                      </div>
                    ) : (
                      [...messagesList].reverse().slice(0, 40).map((msg) => (
                        <div
                          key={msg.id}
                          className="px-2 py-1 rounded-md bg-surface-01 border border-border-subtle flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">
                              {msg.from} → {msg.to}
                            </span>
                            <span className="text-text-secondary">
                              {msg.message.kind} (T{msg.message.term})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted">
                              {msg.sentAtMs}ms → {msg.deliverAtMs}ms
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] rounded-md",
                                msg.status === "delivered"
                                  ? "border-border-strong text-foreground"
                                  : msg.status === "dropped"
                                    ? "border-destructive text-destructive"
                                    : "border-border-default text-text-muted"
                              )}
                            >
                              {msg.status.toUpperCase()}
                              {msg.dropReason ? ` (${msg.dropReason})` : ""}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Protocol Invariants */}
            {activeTab === "invariants" && invariants && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {[
                    {
                      name: "Election Safety",
                      desc: "At most one leader per term",
                      ok: invariants.electionSafetyOk,
                    },
                    {
                      name: "Term Monotonicity",
                      desc: "Persistent currentTerm never decreases",
                      ok: invariants.termMonotonicityOk,
                    },
                    {
                      name: "Commit Monotonicity",
                      desc: "commitIndex never regresses",
                      ok: invariants.commitMonotonicityOk,
                    },
                    {
                      name: "Log Matching",
                      desc: "Same (index, term) => identical prefix",
                      ok: invariants.logMatchingOk,
                    },
                    {
                      name: "State Machine Safety",
                      desc: "Applied log entries identical at same index",
                      ok: invariants.stateMachineSafetyOk,
                    },
                  ].map((inv) => (
                    <div
                      key={inv.name}
                      className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <ShieldIcon className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-mono rounded-md",
                            inv.ok
                              ? "border-border-strong text-foreground"
                              : "border-destructive text-destructive"
                          )}
                        >
                          {inv.ok ? "VERIFIED" : "VIOLATED"}
                        </Badge>
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-foreground">
                        {inv.name}
                      </div>
                      <div className="text-[10px] font-mono text-text-muted">
                        {inv.desc}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-md border border-border-default bg-surface-02 p-3 text-[11px] font-mono">
                  {invariants.violations.length === 0 ? (
                    <div className="text-text-secondary">
                      All 5 core Raft safety &amp; state machine invariants verified across every state transition up to t={raftState.virtualTimeMs}ms.
                    </div>
                  ) : (
                    <ul className="space-y-1 text-destructive">
                      {invariants.violations.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

