"use client";

import * as React from "react";
import {
  CpuIcon,
  DatabaseIcon,
  CloseIcon,
  PlayIcon,
  ShieldIcon,
  ActivityIcon,
  LayersIcon,
  RefreshIcon,
} from "@nxtqr/icons";
import {
  Button,
  Badge,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";
import {
  DISTRIBUTED_STORAGE_PRESET_METADATA,
  type DistributedStoragePresetId,
  createDistributedStoragePresetScenario,
  resolveShardForKey,
  hashKeyCanonical,
  resolveRingNodeForHash,
  type PartitionStrategy,
  type StorageNodeRuntime,
  type LogicalShardRuntime,
  type PhysicalReplicaRuntime,
} from "@nxtqr/architecture-execution";

type StorageWorkspaceTab =
  | "placement"
  | "ring_lookup"
  | "quorums_ops"
  | "lag_repair"
  | "migrations_hot"
  | "invariants";

const STRATEGY_LABEL: Record<PartitionStrategy, string> = {
  hash_modulo: "Hash Modulo",
  range: "Range",
  consistent_hash: "Consistent Hash",
};

export function DistributedStorageWorkspace() {
  const toggleDistributedStorageWorkspace = useExecutionStore(
    (s) => s.toggleDistributedStorageWorkspace
  );
  const activeDistributedStorageScenario = useExecutionStore(
    (s) => s.activeDistributedStorageScenario
  );
  const setDistributedStorageScenario = useExecutionStore(
    (s) => s.setDistributedStorageScenario
  );
  const runDistributedStorageSimulation = useExecutionStore(
    (s) => s.runDistributedStorageSimulation
  );
  const trace = useExecutionStore((s) => s.trace);
  const currentStepIndex = useExecutionStore(
    (s) => s.playbackState.currentStepIndex
  );

  const [activeTab, setActiveTab] = React.useState<StorageWorkspaceTab>("placement");
  const [selectedPreset, setSelectedPreset] =
    React.useState<DistributedStoragePresetId>(
      (activeDistributedStorageScenario?.presetId as DistributedStoragePresetId) ||
        "basic_hash_partitioning"
    );
  const [lookupKey, setLookupKey] = React.useState<string>("customer-42");

  React.useEffect(() => {
    if (!activeDistributedStorageScenario) {
      const initial = createDistributedStoragePresetScenario(selectedPreset);
      setDistributedStorageScenario(initial);
    } else if (
      activeDistributedStorageScenario.presetId &&
      DISTRIBUTED_STORAGE_PRESET_METADATA.some(
        (p) => p.id === activeDistributedStorageScenario.presetId
      )
    ) {
      setSelectedPreset(
        activeDistributedStorageScenario.presetId as DistributedStoragePresetId
      );
    }
  }, [activeDistributedStorageScenario, selectedPreset, setDistributedStorageScenario]);

  const activeScenario =
    activeDistributedStorageScenario ||
    createDistributedStoragePresetScenario(selectedPreset);

  const currentFrame = trace?.frames?.[currentStepIndex];
  const storageState = currentFrame?.runtimeState?.distributedStorageState;
  const metrics = storageState?.metrics;

  const nodesList: StorageNodeRuntime[] = storageState
    ? Object.values(storageState.nodes)
    : [];
  const shardsList: LogicalShardRuntime[] = storageState
    ? Object.values(storageState.shards)
    : [];
  const replicasList: PhysicalReplicaRuntime[] = storageState
    ? Object.values(storageState.replicas)
    : [];

  const hashRing = storageState?.hashRing ?? [];
  const recentOps = storageState?.recentOperations ?? [];
  const conflicts = storageState?.conflicts ?? [];
  const repairs = storageState?.repairs ?? [];
  const migrations = storageState?.migrations ?? [];
  const hotKeys = storageState?.hotKeys ?? [];
  const caveats = storageState?.consistencyCaveats ?? [];
  const invariants = storageState?.invariants;

  // Interactive Key Lookup resolution against the live current frame state
  const liveKeyResolution = React.useMemo(() => {
    if (!storageState || Object.keys(storageState.shards).length === 0) {
      return null;
    }
    const route = resolveShardForKey(
      lookupKey || "customer-42",
      storageState.strategy,
      storageState.shards,
      storageState.hashRing
    );
    const shard = storageState.shards[route.shardId];
    const hash32 = hashKeyCanonical(lookupKey || "customer-42");
    const ringNode = resolveRingNodeForHash(storageState.hashRing, hash32);
    return {
      ...route,
      hash32,
      ringNode,
      primaryNodeId: shard?.primaryNodeId ?? null,
      replicaNodeIds: shard?.replicaNodeIds ?? [],
      epoch: shard?.ownershipEpoch ?? 1,
    };
  }, [lookupKey, storageState]);

  const handlePresetChange = (value: string) => {
    const presetId = value as DistributedStoragePresetId;
    setSelectedPreset(presetId);
    const scenario = createDistributedStoragePresetScenario(presetId);
    setDistributedStorageScenario(scenario);
    runDistributedStorageSimulation(scenario);
  };

  const handleCycleStrategy = () => {
    const order: PartitionStrategy[] = ["hash_modulo", "range", "consistent_hash"];
    const nextIdx = (order.indexOf(activeScenario.partitioning.strategy) + 1) % order.length;
    const nextStrategy = order[nextIdx]!;
    const next = {
      ...activeScenario,
      partitioning: {
        ...activeScenario.partitioning,
        strategy: nextStrategy,
      },
    };
    setDistributedStorageScenario(next);
    runDistributedStorageSimulation(next);
  };

  const handleToggleReplicationMode = () => {
    const nextMode =
      activeScenario.replication.mode === "leader_based"
        ? "leaderless"
        : "leader_based";
    const next = {
      ...activeScenario,
      replication:
        nextMode === "leaderless"
          ? {
              mode: "leaderless" as const,
              replicationFactor: activeScenario.replication.replicationFactor,
              readQuorum: 2,
              writeQuorum: 2,
              readPolicy: "quorum" as const,
              writePolicy: "quorum" as const,
              conflictResolution: "version_vector" as const,
              readRepairEnabled: true,
              hintedHandoffEnabled: true,
              antiEntropyEnabled: false,
              tombstoneRetentionMs: 500,
            }
          : {
              mode: "leader_based" as const,
              replicationFactor: activeScenario.replication.replicationFactor,
              readPolicy: "leader" as const,
              writePolicy: "replica_threshold" as const,
              requiredReplicaAcks: 2,
              baseReplicaLagMs: 10,
              antiEntropyEnabled: false,
            },
    };
    setDistributedStorageScenario(next);
    runDistributedStorageSimulation(next);
  };

  const handleRunSimulation = () => {
    runDistributedStorageSimulation(activeScenario);
  };

  return (
    <div
      role="region"
      aria-label="Distributed Storage, Sharding, Replication & Rebalancing Workspace"
      className={cn(
        "fixed bottom-4 left-4 right-4 z-40 h-[460px] max-w-[1260px] mx-auto",
        "bg-surface-01 border border-border-default rounded-md shadow-level-2 flex flex-col overflow-hidden"
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-surface-02">
        <div className="flex items-center gap-2 min-w-0">
          <CpuIcon className="w-4 h-4 text-text-secondary shrink-0" />
          <span className="text-xs font-semibold text-foreground tracking-tight truncate">
            Distributed Storage, Sharding, Replication &amp; Rebalancing Simulator
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-border-default text-text-muted rounded-md shrink-0"
          >
            {STRATEGY_LABEL[storageState?.strategy ?? activeScenario.partitioning.strategy]}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-border-default text-text-muted rounded-md shrink-0"
          >
            {storageState?.replicationMode ?? activeScenario.replication.mode}
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
              <SelectValue placeholder="Select storage preset" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default text-foreground rounded-md max-h-[300px]">
              {DISTRIBUTED_STORAGE_PRESET_METADATA.map((preset) => (
                <SelectItem
                  key={preset.id}
                  value={preset.id}
                  className="text-[11px] font-mono focus:bg-surface-04 rounded-md"
                >
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCycleStrategy}
            className="h-7 px-2 text-[10px] font-mono bg-surface-03 border-border-default hover:border-border-hover text-foreground rounded-md gap-1"
            title="Switch Partition Strategy (Hash Modulo / Range / Consistent Hash)"
          >
            <RefreshIcon className="w-3 h-3 text-text-secondary" />
            Strategy: {STRATEGY_LABEL[activeScenario.partitioning.strategy]}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleReplicationMode}
            className="h-7 px-2 text-[10px] font-mono bg-surface-03 border-border-default hover:border-border-hover text-foreground rounded-md"
            title="Toggle Leader-Based vs Leaderless Quorum Replication"
          >
            Mode:{" "}
            {activeScenario.replication.mode === "leader_based"
              ? "Leader"
              : "Leaderless"}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleRunSimulation}
            className="h-7 px-2.5 text-[11px] font-medium bg-foreground text-background hover:bg-foreground/90 rounded-md gap-1"
          >
            <PlayIcon className="w-3 h-3" />
            Run
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleDistributedStorageWorkspace(false)}
            className="h-7 w-7 text-text-muted hover:text-foreground hover:bg-surface-03 rounded-md"
            aria-label="Close Distributed Storage Workspace"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs + Frame Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-border-subtle bg-surface-01">
        <div className="flex items-center gap-1 flex-wrap">
          {(
            [
              { id: "placement", label: "Placement & Matrix" },
              { id: "ring_lookup", label: "Hash Ring & Key Lookup" },
              { id: "quorums_ops", label: "Reads, Writes & Quorums" },
              { id: "lag_repair", label: "Lag, Conflicts & Repair" },
              { id: "migrations_hot", label: "Rebalance & Hot Shards" },
              { id: "invariants", label: "Invariants & Metrics" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors border",
                activeTab === tab.id
                  ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                  : "bg-transparent border-transparent text-text-muted hover:text-foreground hover:bg-surface-03"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
          <span>
            t = {storageState?.virtualTimeMs ?? 0}ms
          </span>
          <span>
            Nodes:{" "}
            <span className="text-foreground">
              {metrics?.onlineNodes ?? 0}/{metrics?.totalNodes ?? 0}
            </span>
          </span>
          <span>
            Shards: <span className="text-foreground">{metrics?.logicalShards ?? 0}</span>
          </span>
          <span>
            Moved:{" "}
            <span className="text-foreground">{metrics?.dataMovedBytes ?? 0}B</span>
          </span>
        </div>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 bg-black">
        {!storageState ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 border border-border-subtle bg-surface-01 rounded-md p-6">
            <CpuIcon className="w-6 h-6 text-text-muted" />
            <p className="text-xs text-text-secondary font-medium">
              Click Run or pick one of the 34 presets to trace sharding, quorums, failures, and live rebalancing.
            </p>
            <Button
              size="sm"
              onClick={handleRunSimulation}
              className="mt-1 h-7 px-3 text-[11px] bg-foreground text-background rounded-md"
            >
              Start Simulation
            </Button>
          </div>
        ) : (
          <>
            {/* Tab 1: Placement & Matrix */}
            {activeTab === "placement" && (
              <div className="space-y-3">
                {storageState.placementViolations.length > 0 && (
                  <div className="border border-destructive/60 bg-surface-02 rounded-md p-2.5 text-[10px] font-mono text-destructive">
                    Placement Policy Notice: {storageState.placementViolations.join(" · ")}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {nodesList.map((n) => {
                    const usagePct = Math.min(
                      100,
                      Math.round((n.usedRecords / Math.max(1, n.capacityRecords)) * 100)
                    );
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "border rounded-md p-2.5 space-y-2",
                          n.online
                            ? "bg-surface-02 border-border-default"
                            : "bg-surface-01 border-border-strong opacity-75"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-semibold text-foreground">
                              {n.label}
                            </div>
                            <div className="text-[10px] font-mono text-text-muted">
                              {n.region} · {n.zone} · {n.joined ? "Joined" : "Not Joined"}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono rounded-md",
                              !n.joined
                                ? "border-border-default text-text-muted"
                                : n.online
                                  ? "border-border-strong text-foreground bg-surface-04"
                                  : "border-destructive text-destructive"
                            )}
                          >
                            {!n.joined ? "STAGED" : n.online ? "ONLINE" : "DOWN"}
                          </Badge>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1">
                            <span>Records: {n.usedRecords}/{n.capacityRecords}</span>
                            <span>{usagePct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-04 rounded-md overflow-hidden border border-border-subtle">
                            <div
                              className="h-full bg-foreground transition-all"
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-[10px] font-mono text-text-secondary space-y-0.5">
                          <div>
                            Primary shards:{" "}
                            <span className="text-foreground">
                              {n.ownedShardIds.length > 0 ? n.ownedShardIds.join(", ") : "None"}
                            </span>
                          </div>
                          <div>
                            Hosted replicas:{" "}
                            <span className="text-text-secondary">
                              {n.hostedReplicaShardIds.length > 0
                                ? n.hostedReplicaShardIds.join(", ")
                                : "None"}
                            </span>
                          </div>
                          <div className="text-text-muted">
                            Ops cap R/W: {n.readCapacityOps}/{n.writeCapacityOps} · Throttled:{" "}
                            <span className={n.throttledOps > 0 ? "text-destructive" : "text-foreground"}>
                              {n.throttledOps}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Logical Shards Matrix */}
                <div className="border border-border-default bg-surface-02 rounded-md overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-border-subtle bg-surface-03 flex items-center justify-between text-[11px] font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <LayersIcon className="w-3.5 h-3.5 text-text-secondary" />
                      Logical Shard Ownership &amp; Epoch Matrix ({shardsList.length})
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      Active partitions: {storageState.activePartitions.length}
                    </span>
                  </div>
                  <div className="divide-y divide-border-subtle">
                    {shardsList.map((shard) => (
                      <div
                        key={shard.shardId}
                        className={cn(
                          "px-3 py-2 grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px] font-mono items-center",
                          shard.retired && "opacity-55"
                        )}
                      >
                        <div className="text-foreground font-semibold">
                          {shard.shardId}
                          {shard.minKey !== undefined && shard.maxKey !== undefined && (
                            <span className="text-text-muted ml-1">
                              [{shard.minKey}..{shard.maxKey}]
                            </span>
                          )}
                          {shard.retired && (
                            <Badge variant="outline" className="ml-1.5 text-[9px] rounded-md border-border-default">
                              RETIRED
                            </Badge>
                          )}
                        </div>
                        <div className="text-text-secondary">
                          Primary:{" "}
                          <span className="text-foreground">
                            {shard.primaryNodeId ?? "leaderless / none"}
                          </span>
                        </div>
                        <div className="text-text-secondary">
                          Replicas: {shard.replicaNodeIds.join(", ") || "—"}
                        </div>
                        <div className="text-text-muted">
                          Epoch: <span className="text-foreground">e{shard.ownershipEpoch}</span>
                        </div>
                        <div className="text-text-muted">
                          Recs/Reqs:{" "}
                          <span className="text-foreground">
                            {shard.recordCount}/{shard.requestCount}
                          </span>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className="text-[9px] rounded-md border-border-default text-text-secondary"
                          >
                            {shard.migrationState}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Hash Ring & Key Lookup */}
            {activeTab === "ring_lookup" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Interactive Key Lookup Inspector */}
                <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <DatabaseIcon className="w-3.5 h-3.5 text-text-secondary" />
                      Interactive Key Placement Simulator
                    </div>
                    <span className="text-[10px] font-mono text-text-muted">
                      FNV-1a Canonical Hash
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      value={lookupKey}
                      onChange={(e) => setLookupKey(e.target.value)}
                      placeholder="Enter key (e.g. customer-42, order:101, 3200)..."
                      className="h-8 text-xs font-mono bg-surface-03 border-border-default text-foreground rounded-md"
                    />
                    {["customer-42", "order:101", "hotkey:flash-sale", "3200"].map((sample) => (
                      <Button
                        key={sample}
                        variant="outline"
                        size="sm"
                        onClick={() => setLookupKey(sample)}
                        className="h-8 px-2 text-[10px] font-mono bg-surface-03 border-border-default rounded-md shrink-0"
                      >
                        {sample}
                      </Button>
                    ))}
                  </div>

                  {liveKeyResolution && (
                    <div className="border border-border-subtle bg-surface-01 rounded-md p-2.5 space-y-1.5 text-[11px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-text-muted">32-bit FNV-1a Hash</span>
                        <span className="text-foreground">{liveKeyResolution.hash32}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Resolved Logical Shard</span>
                        <span className="text-foreground font-semibold">
                          {liveKeyResolution.shardId} (epoch e{liveKeyResolution.epoch})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Primary Owner Node</span>
                        <span className="text-foreground">
                          {liveKeyResolution.primaryNodeId ?? "leaderless"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Replica Set</span>
                        <span className="text-text-secondary">
                          {liveKeyResolution.replicaNodeIds.join(", ") || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Consistent Ring Clockwise Node</span>
                        <span className="text-text-secondary">
                          {liveKeyResolution.ringNode ?? "—"}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-border-subtle text-[10px] text-text-muted">
                        {liveKeyResolution.explanation}
                      </div>
                    </div>
                  )}
                </div>

                {/* Monochrome Circular SVG Hash Ring */}
                <div className="border border-border-default bg-surface-02 rounded-md p-3 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Consistent Hash Ring ({hashRing.length} vnode tokens)
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      [0 .. 2^32 - 1]
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <svg
                      viewBox="0 0 220 220"
                      className="w-48 h-48 shrink-0"
                      aria-label="Consistent hash ring diagram"
                    >
                      <circle
                        cx="110"
                        cy="110"
                        r="82"
                        fill="none"
                        stroke="#262626"
                        strokeWidth="2"
                      />
                      <circle
                        cx="110"
                        cy="110"
                        r="62"
                        fill="none"
                        stroke="#1A1A1A"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      {hashRing.slice(0, 32).map((tok, i) => {
                        const angle = (tok.token / 4294967296) * Math.PI * 2 - Math.PI / 2;
                        const x = 110 + 82 * Math.cos(angle);
                        const y = 110 + 82 * Math.sin(angle);
                        const lx = 110 + 96 * Math.cos(angle);
                        const ly = 110 + 96 * Math.sin(angle);
                        return (
                          <g key={`${tok.nodeId}-${tok.vnodeIndex}-${i}`}>
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#FFFFFF"
                              stroke="#404040"
                              strokeWidth="1.5"
                            />
                            {tok.vnodeIndex === 0 && (
                              <text
                                x={lx}
                                y={ly}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#B5B5B5"
                                fontSize="8"
                                fontFamily="monospace"
                              >
                                {tok.nodeId.replace("node-", "N")}
                              </text>
                            )}
                          </g>
                        );
                      })}
                      {liveKeyResolution && (
                        (() => {
                          const angle =
                            (liveKeyResolution.hash32 / 4294967296) * Math.PI * 2 -
                            Math.PI / 2;
                          const kx = 110 + 82 * Math.cos(angle);
                          const ky = 110 + 82 * Math.sin(angle);
                          return (
                            <g>
                              <line
                                x1="110"
                                y1="110"
                                x2={kx}
                                y2={ky}
                                stroke="#858585"
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                              />
                              <circle
                                cx={kx}
                                cy={ky}
                                r="5"
                                fill="#FFFFFF"
                                stroke="#404040"
                                strokeWidth="1.5"
                              />
                            </g>
                          );
                        })()
                      )}
                      <text
                        x="110"
                        y="108"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {STRATEGY_LABEL[storageState.strategy]}
                      </text>
                      <text
                        x="110"
                        y="122"
                        textAnchor="middle"
                        fill="#858585"
                        fontSize="8"
                        fontFamily="monospace"
                      >
                        {hashRing.length} tokens
                      </text>
                    </svg>

                    <div className="flex-1 max-h-[190px] overflow-y-auto space-y-1 text-[10px] font-mono">
                      {hashRing.slice(0, 12).map((t, idx) => (
                        <div
                          key={`${t.token}-${idx}`}
                          className="flex justify-between px-2 py-1 bg-surface-01 border border-border-subtle rounded-md"
                        >
                          <span className="text-foreground">
                            {t.nodeId}#v{t.vnodeIndex}
                          </span>
                          <span className="text-text-muted">{t.token}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Reads, Writes & Quorums */}
            {activeTab === "quorums_ops" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 border border-border-default bg-surface-02 rounded-md overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-border-subtle bg-surface-03 flex items-center justify-between text-[11px] font-semibold text-foreground">
                    <span>Operation Trace &amp; Quorum Outcomes ({recentOps.length})</span>
                    <span className="text-[10px] font-mono text-text-muted">
                      Latest on top
                    </span>
                  </div>
                  <div className="divide-y divide-border-subtle max-h-[300px] overflow-y-auto">
                    {recentOps.length === 0 ? (
                      <div className="p-4 text-[11px] font-mono text-text-muted">
                        No read/write operations processed by this step yet.
                      </div>
                    ) : (
                      [...recentOps].reverse().map((op, i) => (
                        <div
                          key={`${op.opId}-${i}`}
                          className="px-3 py-2 text-[10px] font-mono space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-foreground font-semibold">
                              [{op.atMs}ms] {op.kind.toUpperCase()} {op.key} -&gt; {op.shardId}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {op.staleReadDetected && (
                                <Badge variant="outline" className="text-[9px] rounded-md border-warning text-warning">
                                  STALE READ
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] rounded-md",
                                  op.outcome === "acknowledged"
                                    ? "border-border-strong text-foreground"
                                    : op.outcome === "failed" || op.outcome === "throttled"
                                      ? "border-destructive text-destructive"
                                      : "border-warning text-warning"
                                )}
                              >
                                {op.outcome.toUpperCase()} ({op.receivedAcks}/{op.requiredAcks})
                              </Badge>
                            </div>
                          </div>
                          <div className="text-text-muted">{op.reason}</div>
                          {op.returnedValue !== undefined && (
                            <div className="text-text-secondary">
                              Returned: <span className="text-foreground">{op.returnedValue}</span>{" "}
                              ({op.returnedVersion ?? "v?"})
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quorum & Caveats Panel */}
                <div className="space-y-2.5">
                  <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Quorum &amp; Consistency Policy
                    </div>
                    {storageState.quorumConfig ? (
                      <div className="text-[11px] font-mono space-y-1">
                        <div className="flex justify-between">
                          <span className="text-text-muted">N / R / W</span>
                          <span className="text-foreground">
                            {storageState.quorumConfig.n} / {storageState.quorumConfig.r} /{" "}
                            {storageState.quorumConfig.w}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Overlap Rule (R + W &gt; N)</span>
                          <span
                            className={
                              storageState.quorumConfig.overlapStrong
                                ? "text-success"
                                : "text-warning"
                            }
                          >
                            {storageState.quorumConfig.overlapStrong
                              ? "OVERLAP HOLDS"
                              : "EVENTUAL ONLY"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-text-secondary">
                        Mode: Leader-based replication (Read policy:{" "}
                        {activeScenario.replication.mode === "leader_based"
                          ? activeScenario.replication.readPolicy
                          : "—"}
                        )
                      </div>
                    )}
                  </div>

                  <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-1.5">
                    <div className="text-xs font-semibold text-foreground">
                      Modeling Caveats
                    </div>
                    <ul className="space-y-1 text-[10px] font-mono text-text-muted list-disc pl-4">
                      {caveats.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Lag, Conflicts & Repair */}
            {activeTab === "lag_repair" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Physical Replicas & Lag */}
                <div className="border border-border-default bg-surface-02 rounded-md overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-border-subtle bg-surface-03 text-[11px] font-semibold text-foreground">
                    Physical Replica State &amp; Lag ({replicasList.length})
                  </div>
                  <div className="divide-y divide-border-subtle max-h-[300px] overflow-y-auto">
                    {replicasList.map((r) => (
                      <div
                        key={r.replicaId}
                        className="px-3 py-1.5 flex items-center justify-between text-[10px] font-mono"
                      >
                        <div>
                          <span className="text-foreground font-semibold">{r.replicaId}</span>
                          <span className="text-text-muted ml-2">
                            role: {r.role} · seq: {r.latestAppliedSeq}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={r.lagMs > 50 ? "text-warning" : "text-text-secondary"}>
                            lag: {r.lagMs}ms
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] rounded-md",
                              r.healthy
                                ? "border-border-default text-text-muted"
                                : "border-destructive text-destructive"
                            )}
                          >
                            {r.healthy ? "HEALTHY" : "OFFLINE"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conflicts & Repair Tasks */}
                <div className="space-y-3">
                  <div className="border border-border-default bg-surface-02 rounded-md p-2.5 space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Concurrent Write Conflicts ({conflicts.length})
                    </div>
                    {conflicts.length === 0 ? (
                      <div className="text-[10px] font-mono text-text-muted">
                        No concurrent write conflicts observed in this frame.
                      </div>
                    ) : (
                      conflicts.map((c) => (
                        <div
                          key={c.id}
                          className="border border-border-subtle bg-surface-01 rounded-md p-2 text-[10px] font-mono space-y-1"
                        >
                          <div className="flex justify-between text-foreground">
                            <span>Key: {c.key} ({c.shardId})</span>
                            <span>Policy: {c.resolutionPolicy}</span>
                          </div>
                          <div className="text-text-secondary">
                            Competing:{" "}
                            {c.competingValues
                              .map((v) => `${v.nodeId}="${v.value}"`)
                              .join(" vs ")}
                          </div>
                          <div className="text-text-muted">{c.explanation}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border border-border-default bg-surface-02 rounded-md p-2.5 space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Repair Tasks (Read Repair / Hinted Handoff / Anti-Entropy) ({repairs.length})
                    </div>
                    {repairs.length === 0 ? (
                      <div className="text-[10px] font-mono text-text-muted">
                        No repair tasks scheduled or completed yet.
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-[150px] overflow-y-auto">
                        {repairs.map((r) => (
                          <div
                            key={r.id}
                            className="border border-border-subtle bg-surface-01 rounded-md p-2 text-[10px] font-mono"
                          >
                            <div className="flex justify-between">
                              <span className="text-foreground">
                                {r.kind.toUpperCase()} -&gt; {r.targetNodeId} ({r.key})
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] rounded-md",
                                  r.status === "completed"
                                    ? "border-border-strong text-foreground"
                                    : "border-warning text-warning"
                                )}
                              >
                                {r.status}
                              </Badge>
                            </div>
                            <div className="text-text-muted mt-0.5">{r.detail}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Rebalance & Hot Shards */}
            {activeTab === "migrations_hot" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Online Shard Migrations */}
                <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-2.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ActivityIcon className="w-3.5 h-3.5 text-text-secondary" />
                    Online Shard Migrations &amp; Checkpoint Progress ({migrations.length})
                  </div>
                  {migrations.length === 0 ? (
                    <div className="text-[10px] font-mono text-text-muted">
                      No shard migrations active in this scenario.
                    </div>
                  ) : (
                    migrations.map((m) => {
                      const pct = Math.min(
                        100,
                        Math.round((m.copiedRecords / Math.max(1, m.totalRecords)) * 100)
                      );
                      return (
                        <div
                          key={m.id}
                          className="border border-border-subtle bg-surface-01 rounded-md p-2.5 space-y-2 text-[10px] font-mono"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-foreground font-semibold">
                              Shard {m.shardId}: {m.sourceNodeId} -&gt; {m.targetNodeId}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] rounded-md",
                                m.state === "COMPLETED"
                                  ? "border-success text-success"
                                  : m.state === "FAILED"
                                    ? "border-destructive text-destructive"
                                    : "border-border-default text-text-secondary"
                              )}
                            >
                              {m.state}
                            </Badge>
                          </div>

                          <div>
                            <div className="flex justify-between text-text-muted mb-1">
                              <span>
                                Checkpoint: {m.copiedRecords}/{m.totalRecords} recs ({m.copiedBytes}/
                                {m.totalBytes}B)
                              </span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-04 rounded-md overflow-hidden border border-border-subtle">
                              <div
                                className="h-full bg-foreground transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between text-text-muted">
                            <span>Snapshot seq: {m.snapshotSeq}</span>
                            <span>
                              Epoch: e{m.ownershipEpochBefore} -&gt;{" "}
                              {m.ownershipEpochAfter ? `e${m.ownershipEpochAfter}` : "pending"}
                            </span>
                          </div>
                          {m.failureReason && (
                            <div className="text-destructive">{m.failureReason}</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Hot Shards & Hot Keys */}
                <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-2.5">
                  <div className="text-xs font-semibold text-foreground">
                    Hot Partition &amp; Hot Key Skew Analysis
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="border border-border-subtle bg-surface-01 rounded-md p-2">
                      <div className="text-text-muted text-[10px]">Hottest Shard</div>
                      <div className="text-foreground font-semibold mt-0.5">
                        {metrics?.hotShardId ?? "None"}
                      </div>
                    </div>
                    <div className="border border-border-subtle bg-surface-01 rounded-md p-2">
                      <div className="text-text-muted text-[10px]">Hottest Key</div>
                      <div className="text-foreground font-semibold mt-0.5 truncate">
                        {metrics?.hotKey ?? "None"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {hotKeys.length === 0 ? (
                      <div className="text-[10px] font-mono text-text-muted">
                        Traffic uniformly distributed across keys.
                      </div>
                    ) : (
                      hotKeys.map((hk) => (
                        <div
                          key={hk.key}
                          className="flex justify-between px-2.5 py-1.5 bg-surface-01 border border-border-subtle rounded-md text-[10px] font-mono"
                        >
                          <span className="text-foreground">{hk.key}</span>
                          <span className="text-text-secondary">
                            Shard {hk.shardId} · {hk.requests} reqs
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 6: Invariants & Metrics */}
            {activeTab === "invariants" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-2">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldIcon className="w-3.5 h-3.5 text-text-secondary" />
                    Storage Safety Invariants
                  </div>
                  {invariants && (
                    <div className="space-y-1.5 text-[11px] font-mono">
                      {[
                        ["Every Key Mapped", invariants.everyKeyMappedOk],
                        ["Placement Deterministic", invariants.placementDeterministicOk],
                        ["Ownership Epoch Monotonic", invariants.epochMonotonicOk],
                        ["Stale Owner Fenced", invariants.staleOwnerFencedOk],
                        ["Safe Migration Cutover", invariants.cutoverSafetyOk],
                        ["Quorum Overlap / Rules Enforced", invariants.quorumEnforcedOk],
                        ["Tombstone Delete Safety", invariants.tombstoneSafeOk],
                      ].map(([label, ok]) => (
                        <div
                          key={label as string}
                          className="flex items-center justify-between px-2.5 py-1.5 bg-surface-01 border border-border-subtle rounded-md"
                        >
                          <span className="text-text-secondary">{label as string}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] rounded-md",
                              ok
                                ? "border-border-strong text-foreground"
                                : "border-destructive text-destructive"
                            )}
                          >
                            {ok ? "PASS" : "FAIL"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-2">
                  <div className="text-xs font-semibold text-foreground">
                    Modeled Storage Cluster Metrics
                  </div>
                  {metrics && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      {[
                        ["Total Nodes", `${metrics.onlineNodes}/${metrics.totalNodes}`],
                        ["Logical Shards", `${metrics.logicalShards}`],
                        ["Total Replicas", `${metrics.totalReplicas}`],
                        ["Total Records", `${metrics.totalRecords}`],
                        ["Reads Completed", `${metrics.readsCompleted}`],
                        ["Writes Completed", `${metrics.writesCompleted}`],
                        ["Stale Reads", `${metrics.staleReads}`],
                        ["Uncertain Writes", `${metrics.uncertainWrites}`],
                        ["Conflicts Detected", `${metrics.conflictsDetected}`],
                        ["Repairs Completed", `${metrics.repairsCompleted}`],
                        ["Throttled Requests", `${metrics.throttledRequests}`],
                        ["Data Moved (Bytes)", `${metrics.dataMovedBytes}B`],
                        ["Max Replica Lag", `${metrics.maxReplicaLagMs}ms`],
                        [
                          "Avg Latency R / W",
                          `${metrics.avgReadLatencyMs}ms / ${metrics.avgWriteLatencyMs}ms`,
                        ],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="flex justify-between px-2.5 py-1.5 bg-surface-01 border border-border-subtle rounded-md"
                        >
                          <span className="text-text-muted">{k}</span>
                          <span className="text-foreground font-semibold">{v}</span>
                        </div>
                      ))}
                    </div>
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
