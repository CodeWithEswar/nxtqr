"use client";

import * as React from "react";
import {
  PlayIcon,
  PauseIcon,
  RefreshIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CloseIcon,
  SlidersIcon,
  ActivityIcon,
  LayersIcon,
  TerminalIcon,
  ShieldIcon,
  DatabaseIcon,
  CpuIcon,
} from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import type { PlaybackSpeed } from "@nxtqr/architecture-execution";

export interface ExecutionToolbarProps {
  className?: string;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4];

export function ExecutionToolbar({ className }: ExecutionToolbarProps) {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);

  const isExecutionModeActive = useExecutionStore((s) => s.isExecutionModeActive);
  const isTimelineOpen = useExecutionStore((s) => s.isTimelineOpen);
  const isDistributedTimelineOpen = useExecutionStore((s) => s.isDistributedTimelineOpen);
  const isTraceWaterfallOpen = useExecutionStore((s) => s.isTraceWaterfallOpen);
  const isSequenceViewOpen = useExecutionStore((s) => s.isSequenceViewOpen);
  const isExecutionInspectorOpen = useExecutionStore((s) => s.isExecutionInspectorOpen);
  const status = useExecutionStore((s) => s.playbackState.status);
  const currentStepIndex = useExecutionStore((s) => s.playbackState.currentStepIndex);
  const totalStepsRaw = useExecutionStore((s) => s.playbackState.totalSteps);
  const speed = useExecutionStore((s) => s.playbackState.speed);
  const runExecution = useExecutionStore((s) => s.runExecution);
  const pause = useExecutionStore((s) => s.pause);
  const resume = useExecutionStore((s) => s.resume);
  const stop = useExecutionStore((s) => s.stop);
  const restart = useExecutionStore((s) => s.restart);
  const nextStep = useExecutionStore((s) => s.nextStep);
  const previousStep = useExecutionStore((s) => s.previousStep);
  const seekToStep = useExecutionStore((s) => s.seekToStep);
  const setSpeed = useExecutionStore((s) => s.setSpeed);
  const toggleTimeline = useExecutionStore((s) => s.toggleTimeline);
  const toggleDistributedTimeline = useExecutionStore((s) => s.toggleDistributedTimeline);
  const toggleTraceWaterfall = useExecutionStore((s) => s.toggleTraceWaterfall);
  const toggleSequenceView = useExecutionStore((s) => s.toggleSequenceView);
  const toggleConfigDialog = useExecutionStore((s) => s.toggleConfigDialog);
  const toggleExecutionInspector = useExecutionStore((s) => s.toggleExecutionInspector);
  const toggleFaultScenarioDialog = useExecutionStore((s) => s.toggleFaultScenarioDialog);
  const toggleScenarioComparison = useExecutionStore((s) => s.toggleScenarioComparison);
  const isFaultScenarioDialogOpen = useExecutionStore((s) => s.isFaultScenarioDialogOpen);
  const isScenarioComparisonOpen = useExecutionStore((s) => s.isScenarioComparisonOpen);
  const activeFailureScenario = useExecutionStore((s) => s.activeFailureScenario);
  const scenarioComparison = useExecutionStore((s) => s.scenarioComparison);
  const toggleTrafficScenarioDialog = useExecutionStore((s) => s.toggleTrafficScenarioDialog);
  const toggleTrafficWorkspace = useExecutionStore((s) => s.toggleTrafficWorkspace);
  const toggleTrafficComparison = useExecutionStore((s) => s.toggleTrafficComparison);
  const isTrafficWorkspaceOpen = useExecutionStore((s) => s.isTrafficWorkspaceOpen);
  const isTrafficScenarioDialogOpen = useExecutionStore((s) => s.isTrafficScenarioDialogOpen);
  const activeTrafficScenario = useExecutionStore((s) => s.activeTrafficScenario);
  const trafficComparison = useExecutionStore((s) => s.trafficComparison);
  const isDatabaseWorkspaceOpen = useExecutionStore((s) => s.isDatabaseWorkspaceOpen);
  const toggleDatabaseWorkspace = useExecutionStore((s) => s.toggleDatabaseWorkspace);
  const activeDatabaseScenario = useExecutionStore((s) => s.activeDatabaseScenario);
  const isCacheWorkspaceOpen = useExecutionStore((s) => s.isCacheWorkspaceOpen);
  const toggleCacheWorkspace = useExecutionStore((s) => s.toggleCacheWorkspace);
  const activeCacheScenario = useExecutionStore((s) => s.activeCacheScenario);
  const isSecurityWorkspaceOpen = useExecutionStore((s) => s.isSecurityWorkspaceOpen);
  const toggleSecurityWorkspace = useExecutionStore((s) => s.toggleSecurityWorkspace);
  const activeSecurityScenario = useExecutionStore((s) => s.activeSecurityScenario);
  const isStreamingWorkspaceOpen = useExecutionStore((s) => s.isStreamingWorkspaceOpen);
  const toggleStreamingWorkspace = useExecutionStore((s) => s.toggleStreamingWorkspace);
  const activeStreamingScenario = useExecutionStore((s) => s.activeStreamingScenario);
  const isKubernetesWorkspaceOpen = useExecutionStore((s) => s.isKubernetesWorkspaceOpen);
  const toggleKubernetesWorkspace = useExecutionStore((s) => s.toggleKubernetesWorkspace);
  const activeKubernetesScenario = useExecutionStore((s) => s.activeKubernetesScenario);
  const isGlobalNetworkWorkspaceOpen = useExecutionStore((s) => s.isGlobalNetworkWorkspaceOpen);
  const toggleGlobalNetworkWorkspace = useExecutionStore((s) => s.toggleGlobalNetworkWorkspace);
  const activeGlobalNetworkScenario = useExecutionStore((s) => s.activeGlobalNetworkScenario);
  const isServiceMeshWorkspaceOpen = useExecutionStore((s) => s.isServiceMeshWorkspaceOpen);
  const toggleServiceMeshWorkspace = useExecutionStore((s) => s.toggleServiceMeshWorkspace);
  const activeServiceMeshScenario = useExecutionStore((s) => s.activeServiceMeshScenario);
  const isRaftWorkspaceOpen = useExecutionStore((s) => s.isRaftWorkspaceOpen);
  const toggleRaftWorkspace = useExecutionStore((s) => s.toggleRaftWorkspace);
  const activeRaftScenario = useExecutionStore((s) => s.activeRaftScenario);
  const isDistributedTxWorkspaceOpen = useExecutionStore((s) => s.isDistributedTxWorkspaceOpen);
  const toggleDistributedTxWorkspace = useExecutionStore((s) => s.toggleDistributedTxWorkspace);
  const activeDistributedTxScenario = useExecutionStore((s) => s.activeDistributedTxScenario);
  const isDistributedStorageWorkspaceOpen = useExecutionStore(
    (s) => s.isDistributedStorageWorkspaceOpen
  );
  const toggleDistributedStorageWorkspace = useExecutionStore(
    (s) => s.toggleDistributedStorageWorkspace
  );
  const activeDistributedStorageScenario = useExecutionStore(
    (s) => s.activeDistributedStorageScenario
  );
  const isTrafficControlWorkspaceOpen = useExecutionStore(
    (s) => s.isTrafficControlWorkspaceOpen
  );
  const toggleTrafficControlWorkspace = useExecutionStore(
    (s) => s.toggleTrafficControlWorkspace
  );
  const activeTrafficControlScenario = useExecutionStore(
    (s) => s.activeTrafficControlScenario
  );
  const isObservabilityWorkspaceOpen = useExecutionStore(
    (s) => s.isObservabilityWorkspaceOpen
  );
  const toggleObservabilityWorkspace = useExecutionStore(
    (s) => s.toggleObservabilityWorkspace
  );
  const activeObservabilityScenario = useExecutionStore(
    (s) => s.activeObservabilityScenario
  );
  const isZeroTrustWorkspaceOpen = useExecutionStore(
    (s) => s.isZeroTrustWorkspaceOpen
  );
  const toggleZeroTrustWorkspace = useExecutionStore(
    (s) => s.toggleZeroTrustWorkspace
  );
  const activeZeroTrustScenario = useExecutionStore(
    (s) => s.activeZeroTrustScenario
  );
  const isDeploymentWorkspaceOpen = useExecutionStore(
    (s) => s.isDeploymentWorkspaceOpen
  );
  const toggleDeploymentWorkspace = useExecutionStore(
    (s) => s.toggleDeploymentWorkspace
  );
  const activeDeploymentScenario = useExecutionStore(
    (s) => s.activeDeploymentScenario
  );

  const isPlaying = status === "playing";
  const isCompleted = status === "completed";
  const currentStep = currentStepIndex + 1;
  const totalSteps = totalStepsRaw || 1;

  const handleRunOrTogglePlay = () => {
    if (!isExecutionModeActive || status === "idle" || status === "stopped") {
      runExecution(nodes, edges);
    } else if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  return (
    <div
      role="toolbar"
      aria-label="Interactive Architecture Execution Controls"
      className={cn(
        "flex items-center gap-1.5 p-1 rounded-md bg-surface-02 border border-border-default shadow-level-2 select-none z-30 transition-all duration-200",
        className
      )}
    >
      {/* 1. Mode Indicator / Badge */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 border-r border-border-subtle shrink-0">
        <span
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            isExecutionModeActive
              ? isPlaying
                ? "bg-emerald-400 animate-pulse"
                : isCompleted
                  ? "bg-neutral-400"
                  : "bg-amber-400"
              : "bg-text-disabled"
          )}
          aria-hidden="true"
        />
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary font-semibold">
          Guided Flow
        </span>
      </div>

      {/* 2. Primary Run / Play / Pause Control */}
      <Button
        variant={isPlaying ? "outline" : "default"}
        size="sm"
        onClick={handleRunOrTogglePlay}
        title={
          !isExecutionModeActive
            ? "Run Architecture Request Flow (Space)"
            : isPlaying
              ? "Pause Execution (Space)"
              : "Resume Execution (Space)"
        }
        className={cn(
          "h-7 px-2.5 text-xs font-mono font-medium rounded-md gap-1.5 transition-colors",
          !isPlaying && "bg-foreground text-background hover:bg-neutral-200 border-transparent",
          isPlaying && "border-border-default hover:bg-surface-03 text-foreground"
        )}
      >
        {isPlaying ? (
          <>
            <PauseIcon className="w-3.5 h-3.5" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <PlayIcon className="w-3.5 h-3.5" />
            <span>{!isExecutionModeActive ? "Run Flow" : isCompleted ? "Replay" : "Resume"}</span>
          </>
        )}
      </Button>

      {/* 3. Step Controls (Active Mode Only) */}
      {isExecutionModeActive && (
        <>
          <div className="flex items-center gap-0.5 border-l border-border-subtle pl-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousStep}
              disabled={currentStepIndex <= 0}
              title="Previous Execution Step (← Left Arrow)"
              className="h-7 w-7 p-0 text-text-secondary hover:text-foreground hover:bg-surface-03 rounded-md disabled:opacity-40"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={nextStep}
              disabled={currentStepIndex >= totalSteps - 1}
              title="Next Execution Step (→ Right Arrow)"
              className="h-7 w-7 p-0 text-text-secondary hover:text-foreground hover:bg-surface-03 rounded-md disabled:opacity-40"
            >
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={restart}
              title="Restart Execution from Step 1"
              className="h-7 w-7 p-0 text-text-secondary hover:text-foreground hover:bg-surface-03 rounded-md"
            >
              <RefreshIcon className="w-3 h-3" />
            </Button>
          </div>

          {/* 4. Interactive Scrubber / Step Counter */}
          <div className="flex items-center gap-2 px-2 border-l border-border-subtle">
            <span className="font-mono text-[10px] text-text-muted whitespace-nowrap">
              Step <span className="text-foreground font-semibold">{currentStep}</span>/{totalSteps}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(0, totalSteps - 1)}
              value={currentStepIndex}
              onChange={(e) => seekToStep(Number(e.target.value))}
              aria-label="Seek Execution Step"
              className="w-20 h-1 bg-surface-04 rounded appearance-none cursor-pointer accent-foreground"
            />
          </div>

          {/* 5. Speed Multiplier Dropdown */}
          <div className="flex items-center gap-0.5 border-l border-border-subtle pl-1.5">
            {SPEED_OPTIONS.map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSpeed(spd)}
                title={`Playback speed ${spd}x`}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors",
                  speed === spd
                    ? "bg-surface-04 text-foreground font-semibold border border-border-strong shadow-level-3"
                    : "text-text-muted hover:text-text-secondary hover:bg-surface-03"
                )}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* 6. Timeline, Distributed Views & Inspector Toggles */}
          <div className="flex items-center gap-1 border-l border-border-subtle pl-1.5">
            <Button
              variant={isTimelineOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => toggleTimeline()}
              title="Toggle Linear Execution Timeline"
              className={cn(
                "h-7 px-2 text-[10px] font-mono rounded-md gap-1",
                isTimelineOpen && "bg-surface-04 border border-border-strong text-foreground shadow-level-3"
              )}
            >
              <ActivityIcon className="w-3 h-3" />
              <span className="hidden sm:inline">Timeline</span>
            </Button>

            <Button
              variant={isDistributedTimelineOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => toggleDistributedTimeline()}
              title="Toggle Multi-Lane Distributed Timeline"
              className={cn(
                "h-7 px-2 text-[10px] font-mono rounded-md gap-1",
                isDistributedTimelineOpen && "bg-surface-04 border border-border-strong text-foreground shadow-level-3"
              )}
            >
              <ActivityIcon className="w-3 h-3" />
              <span className="hidden sm:inline">Lanes</span>
            </Button>

            <Button
              variant={isTraceWaterfallOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => toggleTraceWaterfall()}
              title="Toggle Distributed Trace Waterfall"
              className={cn(
                "h-7 px-2 text-[10px] font-mono rounded-md gap-1",
                isTraceWaterfallOpen && "bg-surface-04 border border-border-strong text-foreground shadow-level-3"
              )}
            >
              <LayersIcon className="w-3 h-3" />
              <span className="hidden sm:inline">Waterfall</span>
            </Button>

            <Button
              variant={isSequenceViewOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => toggleSequenceView()}
              title="Toggle Distributed Sequence Diagram"
              className={cn(
                "h-7 px-2 text-[10px] font-mono rounded-md gap-1",
                isSequenceViewOpen && "bg-surface-04 border border-border-strong text-foreground shadow-level-3"
              )}
            >
              <TerminalIcon className="w-3 h-3" />
              <span className="hidden sm:inline">Sequence</span>
            </Button>

            <Button
              variant={isExecutionInspectorOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => toggleExecutionInspector()}
              title="Toggle Step Inspector"
              className={cn(
                "h-7 px-2 text-[10px] font-mono rounded-md gap-1",
                isExecutionInspectorOpen && "bg-surface-04 border border-border-strong text-foreground shadow-level-3"
              )}
            >
              <SlidersIcon className="w-3 h-3" />
              <span className="hidden sm:inline">Inspector</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={stop}
              title="Stop & Exit Execution (Esc)"
              className="h-7 w-7 p-0 text-text-muted hover:text-foreground hover:bg-surface-03 rounded-md"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        </>
      )}

      {/* 7. Request Config & Fault Scenario Dialog Triggers */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleConfigDialog()}
        title="Configure Request & Route Branching"
        className="h-7 px-2 text-text-muted hover:text-foreground hover:bg-surface-03 rounded-md font-mono text-[10px] gap-1 border-l border-border-subtle ml-0.5"
      >
        <SlidersIcon className="w-3 h-3" />
        <span className="hidden md:inline">Config</span>
      </Button>

      <Button
        variant={isFaultScenarioDialogOpen || activeFailureScenario ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleFaultScenarioDialog()}
        title="Configure Failure Injection & Resilience Policies"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          activeFailureScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <ShieldIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">
          {activeFailureScenario ? `Faults (${activeFailureScenario.faults.length})` : "Faults"}
        </span>
      </Button>

      {/* Traffic Sim Button */}
      <Button
        variant={isTrafficScenarioDialogOpen || activeTrafficScenario ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleTrafficScenarioDialog()}
        title="Configure Live Traffic Simulation & Load Distributions"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          activeTrafficScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <ActivityIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">
          {activeTrafficScenario ? "Traffic Sim" : "Traffic"}
        </span>
      </Button>

      {/* Performance Workspace Button */}
      <Button
        variant={isTrafficWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleTrafficWorkspace()}
        title="Toggle Performance & Traffic Dashboard Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isTrafficWorkspaceOpen
            ? "bg-surface-04 border border-border-strong text-foreground shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <ActivityIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden lg:inline">Perf</span>
      </Button>

      {/* Database Execution Workspace Button */}
      <Button
        variant={isDatabaseWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleDatabaseWorkspace()}
        title="Toggle Database Query Execution, Plan & Concurrency Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isDatabaseWorkspaceOpen || activeDatabaseScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <LayersIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">DB Exec</span>
      </Button>

      {/* Cache Execution Workspace Button */}
      <Button
        variant={isCacheWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleCacheWorkspace()}
        title="Toggle Cache Execution, Eviction & Consistency Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isCacheWorkspaceOpen || activeCacheScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <DatabaseIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">Cache</span>
      </Button>

      {/* Security Request Flow Workspace Button */}
      <Button
        variant={isSecurityWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleSecurityWorkspace()}
        title="Toggle API Gateway, Authentication, Authorization & Security Request Flow Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isSecurityWorkspaceOpen || activeSecurityScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <ShieldIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">Security</span>
      </Button>

      {/* Streaming Event & Partition Workspace Button */}
      <Button
        variant={isStreamingWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleStreamingWorkspace()}
        title="Toggle Event Streaming, Kafka Partitions & Consumer Groups Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isStreamingWorkspaceOpen || activeStreamingScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <CpuIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">Streams</span>
      </Button>

      {/* Kubernetes Orchestration & Scheduling Workspace Button */}
      <Button
        variant={isKubernetesWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleKubernetesWorkspace()}
        title="Toggle Kubernetes Scheduling, Container Orchestration & Deployment Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isKubernetesWorkspaceOpen || activeKubernetesScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <LayersIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">K8s</span>
      </Button>

      {/* Global DNS, CDN & Traffic Distribution Workspace Button */}
      <Button
        variant={isGlobalNetworkWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleGlobalNetworkWorkspace()}
        title="Toggle DNS Resolution, CDN Edge Routing & Global Network Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isGlobalNetworkWorkspaceOpen || activeGlobalNetworkScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <ActivityIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">Global</span>
      </Button>

      {/* Microservices, Service Mesh & Resilience Workspace Button */}
      <Button
        variant={isServiceMeshWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleServiceMeshWorkspace()}
        title="Toggle Microservices Communication, Service Mesh & Resilience Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isServiceMeshWorkspaceOpen || activeServiceMeshScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <ShieldIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">Mesh</span>
      </Button>

      {/* Raft Consensus & Leader Election Workspace Button */}
      <Button
        variant={isRaftWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleRaftWorkspace()}
        title="Toggle Distributed Consensus & Raft Protocol Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isRaftWorkspaceOpen || activeRaftScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <LayersIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">Raft</span>
      </Button>

      {/* Distributed Transactions (2PC & Sagas) Workspace Button */}
      <Button
        variant={isDistributedTxWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleDistributedTxWorkspace()}
        title="Toggle Distributed Transactions (2PC, Sagas & Recovery) Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isDistributedTxWorkspaceOpen || activeDistributedTxScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <DatabaseIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">2PC/Saga</span>
      </Button>

      {/* Distributed Storage, Sharding & Rebalancing Workspace Button */}
      <Button
        variant={isDistributedStorageWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleDistributedStorageWorkspace()}
        title="Toggle Distributed Storage, Sharding & Rebalancing Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isDistributedStorageWorkspaceOpen || activeDistributedStorageScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <CpuIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">Storage</span>
      </Button>

      {/* Traffic Control, Rate Limiting & Load Shedding Workspace Button */}
      <Button
        variant={isTrafficControlWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleTrafficControlWorkspace()}
        title="Toggle Rate Limiting, Backpressure & Load Shedding Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isTrafficControlWorkspaceOpen || activeTrafficControlScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <ActivityIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">Rate/Shed</span>
      </Button>

      {/* Observability, Traces, Logs, SLOs & Incident RCA Workspace Button */}
      <Button
        variant={isObservabilityWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleObservabilityWorkspace()}
        title="Toggle Distributed Observability, Traces, Logs, SLOs & Incident RCA Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isObservabilityWorkspaceOpen || activeObservabilityScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <TerminalIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">Obs/RCA</span>
      </Button>

      {/* Zero Trust Security & Threat Modeling Workspace Button */}
      <Button
        variant={isZeroTrustWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleZeroTrustWorkspace()}
        title="Toggle Distributed Zero Trust, Trust Boundaries & Threat Modeling Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isZeroTrustWorkspaceOpen || activeZeroTrustScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <ShieldIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">ZeroTrust</span>
      </Button>

      {/* Distributed Deployment, Blue-Green, Canary & Progressive Delivery Workspace Button */}
      <Button
        variant={isDeploymentWorkspaceOpen ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleDeploymentWorkspace()}
        title="Toggle Distributed Deployment, Blue-Green, Canary & Progressive Delivery Workspace"
        className={cn(
          "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
          isDeploymentWorkspaceOpen || activeDeploymentScenario
            ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
            : "text-text-muted hover:text-foreground hover:bg-surface-03"
        )}
      >
        <LayersIcon className="w-3 h-3 text-text-secondary" />
        <span className="hidden md:inline">Deploy</span>
      </Button>

      {trafficComparison && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleTrafficComparison()}
          title="Compare Baseline vs Scaled Traffic Run"
          className="h-7 px-2 text-[10px] font-mono rounded-md gap-1 text-text-secondary hover:text-foreground hover:bg-surface-03 border border-border-subtle"
        >
          <ActivityIcon className="w-3 h-3 text-text-secondary" />
          <span className="hidden lg:inline">Traffic Delta</span>
        </Button>
      )}

      {scenarioComparison && (
        <Button
          variant={isScenarioComparisonOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={() => toggleScenarioComparison()}
          title="View Baseline vs Failure Resilience Delta"
          className={cn(
            "h-7 px-2 text-[10px] font-mono rounded-md gap-1 transition-colors",
            isScenarioComparisonOpen
              ? "bg-surface-04 border border-border-strong text-foreground shadow-level-3"
              : "text-text-muted hover:text-foreground hover:bg-surface-03"
          )}
        >
          <ActivityIcon className="w-3 h-3 text-text-secondary" />
          <span className="hidden lg:inline">Compare</span>
        </Button>
      )}
    </div>
  );
}
