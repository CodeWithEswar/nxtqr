"use client";

import * as React from "react";
import {
  CloseIcon,
  PlayIcon,
  DatabaseIcon,
  CheckIcon,
  AlertTriangleIcon,
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
  CACHE_PRESET_METADATA,
  type CacheScenarioPresetId,
  type CacheEntry,
  createCachePresetScenario,
  ShardRouter,
} from "@nxtqr/architecture-execution";

export interface CacheExecutionWorkspaceProps {
  onClose?: () => void;
}

type TabType = "entries" | "eviction" | "strategies" | "concurrency" | "distributed";

export function CacheExecutionWorkspace({ onClose }: CacheExecutionWorkspaceProps) {
  const isCacheWorkspaceOpen = useExecutionStore((s) => s.isCacheWorkspaceOpen);
  const toggleCacheWorkspace = useExecutionStore((s) => s.toggleCacheWorkspace);
  const activeCacheScenario = useExecutionStore((s) => s.activeCacheScenario);
  const playbackState = useExecutionStore((s) => s.playbackState);
  const runCacheSimulation = useExecutionStore((s) => s.runCacheSimulation);

  const [activeTab, setActiveTab] = React.useState<TabType>("entries");
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [testShardKey, setTestShardKey] = React.useState<string>("products:42");

  if (!isCacheWorkspaceOpen) {
    return null;
  }

  const currentFrame = playbackState.currentFrame;
  const cacheState = currentFrame?.runtimeState?.cacheState;
  const metrics = cacheState?.metrics;
  const entriesRecord = cacheState?.entries || {};
  const entriesList: CacheEntry[] = Object.values(entriesRecord);
  const selectedEntry = selectedKey ? entriesRecord[selectedKey] : entriesList[0];

  const handleSelectPreset = (presetId: CacheScenarioPresetId) => {
    const sc = createCachePresetScenario(presetId);
    runCacheSimulation(sc);
  };

  const handleRunSimulation = () => {
    const sc = activeCacheScenario || createCachePresetScenario("basic_cache_hit");
    runCacheSimulation(sc);
  };

  const handleClose = () => {
    if (onClose) onClose();
    else toggleCacheWorkspace(false);
  };

  const currentCapacity = activeCacheScenario?.configuration.capacity || 10;
  const currentCount = entriesList.length;
  const capacityPercent = Math.min(100, Math.round((currentCount / currentCapacity) * 100));

  // Shard routing for interactive explorer
  const shardResult = ShardRouter.routeKey(testShardKey || "products:42", 4);

  return (
    <div
      role="region"
      aria-label="Cache Execution Workspace"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface-01 border-t border-border-default shadow-level-3 flex flex-col max-h-[500px] h-[500px] select-none transition-transform"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-02 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-surface-03 border border-border-default text-text-secondary">
            <DatabaseIcon className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold tracking-wider uppercase text-foreground">
                Cache Execution & Consistency Engine
              </span>
              <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 bg-surface-03 border-border-default text-text-secondary">
                Phase 05.4.7
              </Badge>
              {activeCacheScenario && (
                <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 bg-surface-03 border-border-subtle text-text-muted">
                  {activeCacheScenario.configuration.cachingStrategy.replace(/_/g, " ").toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="text-[11px] text-text-muted font-mono truncate max-w-xl">
              {activeCacheScenario?.description || "Deterministic cache simulation, eviction policies, and distributed consistency."}
            </div>
          </div>
        </div>

        {/* Preset Selector & Simulation Controls */}
        <div className="flex items-center gap-2">
          <div className="w-64">
            <Select
              value={activeCacheScenario?.id || "basic_cache_hit"}
              onValueChange={(val) => handleSelectPreset(val as CacheScenarioPresetId)}
            >
              <SelectTrigger className="h-7 text-[11px] font-mono bg-surface-02 border-border-default text-foreground">
                <SelectValue placeholder="Select cache preset..." />
              </SelectTrigger>
              <SelectContent className="bg-surface-02 border-border-default text-foreground max-h-72">
                {Object.values(CACHE_PRESET_METADATA).map((meta) => (
                  <SelectItem
                    key={meta.id}
                    value={meta.id}
                    className="text-xs font-mono text-text-secondary focus:bg-surface-03 focus:text-foreground cursor-pointer"
                  >
                    <span className="font-medium text-foreground">{meta.title}</span>
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
        <div className="flex items-center gap-6 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Hit Rate:</span>
            <span className={cn("font-semibold", (metrics?.hitRate || 0) >= 70 ? "text-foreground" : "text-text-secondary")}>
              {metrics ? `${metrics.hitRate}%` : "0%"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Hits / Misses:</span>
            <span className="text-foreground font-semibold">
              {metrics?.hitCount || 0}
            </span>
            <span className="text-text-muted">/</span>
            <span className="text-text-secondary font-semibold">
              {metrics?.missCount || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Evictions:</span>
            <span className={cn("font-semibold", (metrics?.evictionCount || 0) > 0 ? "text-foreground" : "text-text-muted")}>
              {metrics?.evictionCount || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Coalesced:</span>
            <span className={cn("font-semibold", (metrics?.coalescedRequestsCount || 0) > 0 ? "text-foreground" : "text-text-muted")}>
              {metrics?.coalescedRequestsCount || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Stale Reads:</span>
            <span className={cn("font-semibold", (metrics?.staleReadsCount || 0) > 0 ? "text-text-secondary" : "text-text-muted")}>
              {metrics?.staleReadsCount || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Capacity:</span>
            <span className="text-foreground font-semibold">
              {currentCount} / {currentCapacity} entries ({capacityPercent}%)
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-surface-02 p-0.5 rounded-md border border-border-subtle">
          {(
            [
              { id: "entries", label: "Entries & Inspector" },
              { id: "eviction", label: "Eviction Policies" },
              { id: "strategies", label: "Caching Strategies" },
              { id: "concurrency", label: "Concurrency & Stampede" },
              { id: "distributed", label: "Distributed & Replicas" },
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
        {/* Tab 1: Entries & Inspector */}
        {activeTab === "entries" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left: Active Entries Table */}
            <div className="col-span-8 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Active Cache Entries ({entriesList.length})
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  Memory Used: {metrics?.currentBytesUsed || 0} B
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                {entriesList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-text-muted font-mono text-xs">
                    <DatabaseIcon className="w-8 h-8 mb-2 text-text-disabled" />
                    <span>Cache memory is currently empty.</span>
                    <span className="text-[10px] mt-1 text-text-disabled">Run simulation or select a preset to populate.</span>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle bg-surface-03 text-[11px] text-text-muted">
                        <th className="p-2 font-medium">Key</th>
                        <th className="p-2 font-medium">Value Preview</th>
                        <th className="p-2 font-medium">Size</th>
                        <th className="p-2 font-medium">TTL Remaining</th>
                        <th className="p-2 font-medium">Hits</th>
                        <th className="p-2 font-medium">Ver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entriesList.map((entry) => {
                        const isSelected = (selectedKey || entriesList[0]?.key) === entry.key;
                        const remaining = entry.expiresAtMs
                          ? Math.max(0, entry.expiresAtMs - (currentFrame?.virtualTimeMs || 0))
                          : null;

                        return (
                          <tr
                            key={entry.key}
                            onClick={() => setSelectedKey(entry.key)}
                            className={cn(
                              "border-b border-border-subtle/50 cursor-pointer transition-colors",
                              isSelected
                                ? "bg-surface-04 border-border-strong text-foreground font-medium"
                                : "hover:bg-surface-03 text-text-secondary"
                            )}
                          >
                            <td className="p-2 font-semibold text-foreground">{entry.key}</td>
                            <td className="p-2 truncate max-w-[200px] text-text-muted">
                              {typeof entry.value === "object" ? JSON.stringify(entry.value) : String(entry.value)}
                            </td>
                            <td className="p-2 text-text-muted">{entry.sizeBytes} B</td>
                            <td className="p-2">
                              {remaining !== null ? (
                                <span className={cn(remaining === 0 ? "text-text-disabled" : "text-text-secondary")}>
                                  {remaining}ms
                                </span>
                              ) : (
                                <span className="text-text-muted">∞</span>
                              )}
                            </td>
                            <td className="p-2 text-text-secondary">{entry.accessCount}x</td>
                            <td className="p-2 text-text-muted">v{entry.version || 1}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right: Selected Entry Detail Inspector */}
            <div className="col-span-4 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Entry Detail Inspector
                </span>
                {selectedEntry && (
                  <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 bg-surface-04 border-border-default text-foreground">
                    v{selectedEntry.version || 1}
                  </Badge>
                )}
              </div>
              <div className="flex-1 overflow-auto p-3 text-xs font-mono space-y-3">
                {selectedEntry ? (
                  <>
                    <div>
                      <div className="text-[10px] text-text-muted uppercase">Key</div>
                      <div className="text-sm font-semibold text-foreground break-all">{selectedEntry.key}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted uppercase">Stored Value (JSON)</div>
                      <pre className="mt-1 p-2 bg-surface-01 border border-border-subtle rounded-md text-[11px] text-text-secondary overflow-auto max-h-36">
                        {JSON.stringify(selectedEntry.value, null, 2)}
                      </pre>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-surface-03 border border-border-subtle rounded-md">
                        <div className="text-[10px] text-text-muted">Size</div>
                        <div className="font-semibold text-foreground">{selectedEntry.sizeBytes} bytes</div>
                      </div>
                      <div className="p-2 bg-surface-03 border border-border-subtle rounded-md">
                        <div className="text-[10px] text-text-muted">Access Count</div>
                        <div className="font-semibold text-foreground">{selectedEntry.accessCount} hits</div>
                      </div>
                      <div className="p-2 bg-surface-03 border border-border-subtle rounded-md">
                        <div className="text-[10px] text-text-muted">Created At</div>
                        <div className="text-text-secondary">{selectedEntry.createdAtMs}ms virtual</div>
                      </div>
                      <div className="p-2 bg-surface-03 border border-border-subtle rounded-md">
                        <div className="text-[10px] text-text-muted">Last Accessed</div>
                        <div className="text-text-secondary">{selectedEntry.lastAccessedAtMs}ms virtual</div>
                      </div>
                    </div>
                    {selectedEntry.expiresAtMs && (
                      <div className="p-2 bg-surface-03 border border-border-subtle rounded-md">
                        <div className="text-[10px] text-text-muted">Expiration Policy</div>
                        <div className="text-text-secondary">
                          Expires at {selectedEntry.expiresAtMs}ms virtual
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-48 text-text-muted text-xs">
                    Select an entry to view metadata
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Eviction Policies */}
        {activeTab === "eviction" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left: Policy & Capacity Overview */}
            <div className="col-span-6 flex flex-col h-full bg-surface-02 border border-border-default rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <div>
                  <h3 className="text-xs font-mono font-semibold uppercase text-foreground">
                    Active Eviction Policy: {activeCacheScenario?.configuration.evictionPolicy.toUpperCase() || "LRU"}
                  </h3>
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">
                    Deterministic tie-breaking using insertionSequence and timestamps.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono bg-surface-03 border-border-default text-text-secondary">
                  Max: {currentCapacity} entries
                </Badge>
              </div>

              {/* Capacity Progress Gauge */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">Memory Capacity Utilization</span>
                  <span className="font-semibold text-foreground">{capacityPercent}%</span>
                </div>
                <div className="w-full h-2 bg-surface-03 rounded-full overflow-hidden border border-border-subtle">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      capacityPercent >= 90 ? "bg-foreground" : "bg-text-secondary"
                    )}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>{currentCount} items in memory</span>
                  <span>{currentCapacity - currentCount} slots remaining</span>
                </div>
              </div>

              {/* Supported Policy Rules Card */}
              <div className="p-3 bg-surface-03 border border-border-subtle rounded-md font-mono text-xs space-y-2">
                <span className="text-[11px] font-semibold text-text-secondary uppercase">
                  Policy Eviction Criteria
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-surface-01 rounded-md border border-border-subtle">
                    <span className="font-semibold text-foreground">LRU (Least Recently Used)</span>
                    <p className="text-[10px] text-text-muted mt-1">
                      Evicts oldest <code className="text-foreground">lastAccessedAtMs</code>. Tie-breaker: lowest <code className="text-foreground">insertionSequence</code>.
                    </p>
                  </div>
                  <div className="p-2 bg-surface-01 rounded-md border border-border-subtle">
                    <span className="font-semibold text-foreground">LFU (Least Frequently Used)</span>
                    <p className="text-[10px] text-text-muted mt-1">
                      Evicts lowest <code className="text-foreground">accessCount</code>. Tie-breaker: oldest <code className="text-foreground">lastAccessedAtMs</code>.
                    </p>
                  </div>
                  <div className="p-2 bg-surface-01 rounded-md border border-border-subtle">
                    <span className="font-semibold text-foreground">FIFO (First In First Out)</span>
                    <p className="text-[10px] text-text-muted mt-1">
                      Evicts lowest <code className="text-foreground">insertionSequence</code> regardless of frequency or recency.
                    </p>
                  </div>
                  <div className="p-2 bg-surface-01 rounded-md border border-border-subtle">
                    <span className="font-semibold text-foreground">NoEviction</span>
                    <p className="text-[10px] text-text-muted mt-1">
                      Rejects writes when full with Out-Of-Memory error simulation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Candidate Eviction Ranking & Last Decision */}
            <div className="col-span-6 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Eviction Candidate Ranking (Next Victim to Evict)
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  Total Evictions: {metrics?.evictionCount || 0}
                </span>
              </div>
              <div className="flex-1 overflow-auto p-3 space-y-3 font-mono text-xs">
                {/* Last Eviction Decision Banner */}
                {cacheState?.lastEvictionDecision ? (
                  <div className="p-3 bg-surface-03 border border-border-strong rounded-md space-y-1 shadow-level-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span>Last Victim Evicted:</span>
                      <Badge variant="outline" className="text-[10px] bg-surface-04 border-border-strong text-foreground">
                        {cacheState.lastEvictionDecision.victimKey}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-text-secondary">
                      {cacheState.lastEvictionDecision.reason}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-surface-03 border border-border-subtle rounded-md text-[11px] text-text-muted">
                    No eviction triggered yet. When capacity exceeds limit, victim selection will appear here.
                  </div>
                )}

                {/* Candidate Ranking List */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-text-muted uppercase">
                    Ranked by eviction vulnerability:
                  </span>
                  {entriesList.length === 0 ? (
                    <div className="text-text-disabled text-xs py-4 text-center">No entries in cache</div>
                  ) : (
                    entriesList.map((e, idx) => (
                      <div
                        key={e.key}
                        className="flex items-center justify-between p-2 bg-surface-01 border border-border-subtle rounded-md text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted font-bold">#{idx + 1}</span>
                          <span className="font-semibold text-foreground">{e.key}</span>
                        </div>
                        <div className="flex items-center gap-4 text-text-secondary">
                          <span>Hits: {e.accessCount}</span>
                          <span>Last: {e.lastAccessedAtMs}ms</span>
                          <span>Seq: {e.insertionSequence}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Caching Strategies */}
        {activeTab === "strategies" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Strategy Flow Explanation */}
            <div className="col-span-7 flex flex-col h-full bg-surface-02 border border-border-default rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <div>
                  <h3 className="text-xs font-mono font-semibold uppercase text-foreground">
                    Pattern: {activeCacheScenario?.configuration.cachingStrategy.replace(/_/g, " ").toUpperCase() || "CACHE-ASIDE"}
                  </h3>
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">
                    Modeled data flow between Client, Cache Node, and Backing Persistent Store.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono bg-surface-03 border-border-default text-text-secondary">
                  DB Reads: {metrics?.databaseReadsCount || 0} | Writes: {metrics?.databaseWritesCount || 0}
                </Badge>
              </div>

              {/* Strategy Step Diagram */}
              <div className="p-3 bg-surface-03 border border-border-subtle rounded-md font-mono text-xs space-y-3">
                <span className="text-[11px] font-semibold text-text-secondary uppercase">
                  Execution Step Sequence
                </span>
                <div className="space-y-2 text-[11px]">
                  <div className="p-2 bg-surface-01 rounded-md border border-border-subtle flex items-start gap-2">
                    <span className="font-bold text-foreground">1.</span>
                    <div>
                      <span className="font-medium text-foreground">Lookup Request:</span>
                      <p className="text-text-muted text-[10px]">Client queries Cache Node for requested key (1ms latency).</p>
                    </div>
                  </div>
                  <div className="p-2 bg-surface-01 rounded-md border border-border-subtle flex items-start gap-2">
                    <span className="font-bold text-foreground">2.</span>
                    <div>
                      <span className="font-medium text-foreground">Hit/Miss Evaluation:</span>
                      <p className="text-text-muted text-[10px]">If present and unexpired, return payload. If absent or expired, initiate fallback.</p>
                    </div>
                  </div>
                  <div className="p-2 bg-surface-01 rounded-md border border-border-subtle flex items-start gap-2">
                    <span className="font-bold text-foreground">3.</span>
                    <div>
                      <span className="font-medium text-foreground">Persistent Store Query:</span>
                      <p className="text-text-muted text-[10px]">On miss, query backing database fixture table (15ms roundtrip latency).</p>
                    </div>
                  </div>
                  <div className="p-2 bg-surface-01 rounded-md border border-border-subtle flex items-start gap-2">
                    <span className="font-bold text-foreground">4.</span>
                    <div>
                      <span className="font-medium text-foreground">Repopulation & Version Assignment:</span>
                      <p className="text-text-muted text-[10px]">Write returned row to Cache with TTL, updating version and insertion sequence.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Write-Behind Deferred Flush Queue */}
            <div className="col-span-5 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Write-Behind Deferred Queue
                </span>
                <Badge variant="outline" className="text-[10px] font-mono bg-surface-04 border-border-default text-text-secondary">
                  Queue: {cacheState?.writeBehindQueue.length || 0}
                </Badge>
              </div>
              <div className="flex-1 overflow-auto p-3 font-mono text-xs space-y-2">
                <p className="text-[11px] text-text-muted">
                  Asynchronous deferred write queue flushes batches periodically to database storage without blocking client response.
                </p>
                {cacheState?.writeBehindQueue && cacheState.writeBehindQueue.length > 0 ? (
                  cacheState.writeBehindQueue.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 bg-surface-01 border border-border-subtle rounded-md text-[11px] flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{item.key}</div>
                        <div className="text-[10px] text-text-muted">Queued at {item.queuedAtMs}ms</div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-surface-03 border-border-subtle text-text-secondary">
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-text-disabled text-xs">
                    <span>Queue is currently empty</span>
                    <span className="text-[10px] mt-1">Select &apos;Write-Behind&apos; preset to view deferred writes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Concurrency & Stampede */}
        {activeTab === "concurrency" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Stampede vs Coalescing Comparison */}
            <div className="col-span-7 flex flex-col h-full bg-surface-02 border border-border-default rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <div>
                  <h3 className="text-xs font-mono font-semibold uppercase text-foreground">
                    Single-Flight Request Coalescing vs Thundering Herd
                  </h3>
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">
                    Eliminates duplicate backend load during sudden traffic spikes on cold keys.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono bg-surface-03 border-border-default text-text-secondary">
                  Coalesced: {metrics?.coalescedRequestsCount || 0}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-surface-03 border border-border-subtle rounded-md space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <AlertTriangleIcon className="w-3.5 h-3.5 text-text-secondary" />
                    <span>Cache Stampede (Disabled)</span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Without coalescing, 5 concurrent requests for an expired/absent key all trigger separate database reads, causing high I/O saturation and connection spikes.
                  </p>
                </div>

                <div className="p-3 bg-surface-03 border border-border-strong rounded-md space-y-2 shadow-level-2">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <CheckIcon className="w-3.5 h-3.5 text-foreground" />
                    <span>SingleFlight (Enabled)</span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    With coalescing, the 1st request becomes leader and fetches data. Remaining 4 followers wait on leader result and receive shared payload without hitting the DB.
                  </p>
                </div>
              </div>

              {/* Stale-While-Revalidate Status */}
              <div className="p-3 bg-surface-03 border border-border-subtle rounded-md font-mono text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-[11px] uppercase">
                    Stale-While-Revalidate (SWR) Grace Window
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-surface-01 border-border-subtle text-text-secondary">
                    Window: 200ms
                  </Badge>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Allows serving expired cache entries instantly with 1ms response latency while an asynchronous background refresh queries persistent storage and updates cache state.
                </p>
              </div>
            </div>

            {/* Active Single-Flight Groups */}
            <div className="col-span-5 flex flex-col h-full bg-surface-02 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-surface-03 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-text-secondary">
                  Active Coalescing In-Flight Groups
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  Window: 50ms
                </span>
              </div>
              <div className="flex-1 overflow-auto p-3 font-mono text-xs space-y-2">
                {cacheState?.activeCoalescingGroups && Object.keys(cacheState.activeCoalescingGroups).length > 0 ? (
                  Object.values(cacheState.activeCoalescingGroups).map((g) => (
                    <div
                      key={g.key}
                      className="p-2.5 bg-surface-01 border border-border-strong rounded-md space-y-1.5 shadow-level-2"
                    >
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-foreground">{g.key}</span>
                        <Badge variant="outline" className="text-[10px] bg-surface-03 border-border-subtle text-foreground">
                          {g.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-text-secondary">
                        Leader: <code className="text-foreground">{g.leaderRequestId}</code>
                      </div>
                      <div className="text-[10px] text-text-muted">
                        Waiting Followers: {g.waitingRequestIds.length > 0 ? g.waitingRequestIds.join(", ") : "none"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-text-disabled text-xs">
                    <span>No active coalescing groups in flight</span>
                    <span className="text-[10px] mt-1">Select &apos;Single-Flight Request Coalescing&apos; preset</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Distributed & Replicas */}
        {activeTab === "distributed" && (
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left: Primary-Replica Topology */}
            <div className="col-span-7 flex flex-col h-full bg-surface-02 border border-border-default rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <div>
                  <h3 className="text-xs font-mono font-semibold uppercase text-foreground">
                    Replication Topology & Replication Lag
                  </h3>
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">
                    Asynchronous WAL replication delay and stale read detection.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono bg-surface-03 border-border-default text-text-secondary">
                  Replicas: {Object.keys(cacheState?.replicas || {}).length}
                </Badge>
              </div>

              {/* Replicas List */}
              <div className="space-y-2 font-mono text-xs">
                {Object.values(cacheState?.replicas || {}).map((rep) => (
                  <div
                    key={rep.replicaId}
                    className="p-3 bg-surface-03 border border-border-subtle rounded-md space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{rep.replicaId}</span>
                      <Badge variant="outline" className="text-[10px] bg-surface-04 border-border-subtle text-text-secondary">
                        Lag: {rep.currentLagMs}ms
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted">
                      <div>Status: <span className="text-foreground">{rep.status}</span></div>
                      <div>Last Applied Version: <span className="text-foreground">v{rep.lastAppliedVersion}</span></div>
                      <div>Pending Replications: <span className="text-foreground">{rep.pendingReplicationCount}</span></div>
                      <div>Replicated Entries: <span className="text-foreground">{Object.keys(rep.entries).length}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Sharding Calculator Explorer */}
            <div className="col-span-5 flex flex-col h-full bg-surface-02 border border-border-default rounded-md p-4 space-y-3">
              <div className="border-b border-border-subtle pb-2">
                <h3 className="text-xs font-mono font-semibold uppercase text-foreground">
                  FNV-1a Consistent Shard Routing
                </h3>
                <p className="text-[11px] text-text-muted font-mono mt-0.5">
                  Calculates deterministic shard node hash placement.
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <label className="text-[10px] text-text-muted uppercase">Test Cache Key</label>
                <input
                  type="text"
                  value={testShardKey}
                  onChange={(e) => setTestShardKey(e.target.value)}
                  placeholder="e.g. products:42 or orders:999"
                  className="w-full px-2.5 py-1.5 bg-surface-01 border border-border-default rounded-md text-foreground text-xs focus:outline-none focus:border-border-strong font-mono"
                />

                <div className="p-3 bg-surface-03 border border-border-subtle rounded-md space-y-2 mt-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-muted">Target Node:</span>
                    <span className="font-bold text-foreground">{shardResult.shardNodeId}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-muted">Shard Index:</span>
                    <span className="font-semibold text-text-secondary">{shardResult.shardIndex} / 4</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-muted">FNV-1a Hash:</span>
                    <span className="font-mono text-[10px] text-text-muted">{shardResult.hash}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
