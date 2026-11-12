import { create } from "zustand";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  type ExecutionConfiguration,
  type ExecutionRun,
  type ExecutionTrace,
  type PlaybackSpeed,
  type PlaybackState,
  type BehaviorScenario,
  type ScenarioPresetId,
  type DistributedScenarioConfig,
  type DistributedScenarioPresetId,
  ExecutionSnapshotManager,
  ExecutionPlanner,
  PlaybackController,
  getScenarioPreset,
  getDistributedScenarioPreset,
} from "@nxtqr/architecture-execution";

export type AllScenarioPresetId = ScenarioPresetId | DistributedScenarioPresetId;

export interface ExecutionStoreState {
  // Mode toggles
  isExecutionModeActive: boolean;
  isTimelineOpen: boolean;
  isDistributedTimelineOpen: boolean;
  isTraceWaterfallOpen: boolean;
  isSequenceViewOpen: boolean;
  isConfigDialogOpen: boolean;
  isExecutionInspectorOpen: boolean;

  // Active configuration & behavioral scenario
  configuration: ExecutionConfiguration;
  scenario: BehaviorScenario;
  distributedScenario: DistributedScenarioConfig | null;
  activePresetId: AllScenarioPresetId;

  // Active run & trace
  activeRun: ExecutionRun | null;
  trace: ExecutionTrace | null;

  // Playback state
  playbackState: PlaybackState;
  selectedEventId: string | null;

  // Actions
  toggleExecutionMode: (active?: boolean) => void;
  toggleTimeline: (open?: boolean) => void;
  toggleDistributedTimeline: (open?: boolean) => void;
  toggleTraceWaterfall: (open?: boolean) => void;
  toggleSequenceView: (open?: boolean) => void;
  toggleConfigDialog: (open?: boolean) => void;
  toggleExecutionInspector: (open?: boolean) => void;
  setEntryNodeId: (nodeId: string) => void;
  setScenarioPreset: (presetId: AllScenarioPresetId) => void;
  updateScenario: (partial: Partial<BehaviorScenario>) => void;
  updateConfiguration: (partial: Partial<ExecutionConfiguration>) => void;
  setSelectedBranch: (nodeId: string, edgeOrTargetId: string) => void;
  selectEvent: (eventId: string | null) => void;

  // Playback actions
  runExecution: (
    nodes: BaseNode[],
    edges: BaseEdge[],
    architectureId?: string,
    revisionId?: string
  ) => boolean;
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  restart: () => void;
  nextStep: () => void;
  previousStep: () => void;
  seekToStep: (index: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
}

const defaultConfiguration: ExecutionConfiguration = {
  version: 1,
  entryNodeId: "",
  request: {
    id: "req_init",
    method: "GET",
    path: "/api/v1/flow",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_trace_001",
    },
  },
  routing: {
    mode: "deterministic",
    selectedBranches: {},
  },
  limits: {
    maxEvents: 100,
    maxHops: 50,
    maxDurationMs: 30000,
  },
  timing: {
    nodeDurationMs: 300,
    edgeDurationMs: 400,
  },
};

const initialPlaybackState: PlaybackState = {
  status: "idle",
  currentStepIndex: 0,
  totalSteps: 0,
  speed: 1,
  currentFrame: null,
  progress: 0,
  isLooping: false,
};

// Singleton controller reference decoupled from React re-renders
let playbackController: PlaybackController | null = null;

export const useExecutionStore = create<ExecutionStoreState>((set, get) => {
  const ensureController = () => {
    if (!playbackController) {
      playbackController = new PlaybackController(get().playbackState.speed);
      playbackController.subscribe((pbState) => {
        set({
          playbackState: pbState,
          selectedEventId: pbState.currentFrame?.activeEvent.id || null,
        });
      });
    }
    return playbackController;
  };

  return {
    isExecutionModeActive: false,
    isTimelineOpen: false,
    isDistributedTimelineOpen: false,
    isTraceWaterfallOpen: false,
    isSequenceViewOpen: false,
    isConfigDialogOpen: false,
    isExecutionInspectorOpen: false,
    configuration: defaultConfiguration,
    scenario: getScenarioPreset("cache-miss"),
    distributedScenario: null,
    activePresetId: "cache-miss",
    activeRun: null,
    trace: null,
    playbackState: initialPlaybackState,
    selectedEventId: null,

    toggleExecutionMode: (active) => {
      const nextActive = active !== undefined ? active : !get().isExecutionModeActive;
      if (!nextActive) {
        playbackController?.stop();
        set({
          isExecutionModeActive: false,
          isTimelineOpen: false,
          isDistributedTimelineOpen: false,
          isTraceWaterfallOpen: false,
          isSequenceViewOpen: false,
          isExecutionInspectorOpen: false,
        });
      } else {
        set({ isExecutionModeActive: true });
      }
    },

    toggleTimeline: (open) => {
      set({ isTimelineOpen: open !== undefined ? open : !get().isTimelineOpen });
    },

    toggleDistributedTimeline: (open) => {
      set({
        isDistributedTimelineOpen:
          open !== undefined ? open : !get().isDistributedTimelineOpen,
      });
    },

    toggleTraceWaterfall: (open) => {
      set({
        isTraceWaterfallOpen:
          open !== undefined ? open : !get().isTraceWaterfallOpen,
      });
    },

    toggleSequenceView: (open) => {
      set({
        isSequenceViewOpen:
          open !== undefined ? open : !get().isSequenceViewOpen,
      });
    },

    toggleConfigDialog: (open) => {
      set({ isConfigDialogOpen: open !== undefined ? open : !get().isConfigDialogOpen });
    },

    toggleExecutionInspector: (open) => {
      set({
        isExecutionInspectorOpen:
          open !== undefined ? open : !get().isExecutionInspectorOpen,
      });
    },

    setEntryNodeId: (nodeId: string) => {
      set((state) => ({
        configuration: {
          ...state.configuration,
          entryNodeId: nodeId,
        },
      }));
    },

    setScenarioPreset: (presetId) => {
      const isDistributed =
        presetId === "parallel-fanout" ||
        presetId === "async-queue-workers" ||
        presetId === "message-retry-dlq" ||
        presetId === "fanin-partial-failure" ||
        presetId === "custom-distributed";

      if (isDistributed) {
        const distPreset = getDistributedScenarioPreset(presetId as DistributedScenarioPresetId);
        set((state) => ({
          activePresetId: presetId,
          distributedScenario: distPreset,
          configuration: {
            ...state.configuration,
            presetId,
            distributedScenario: distPreset,
            request: {
              ...state.configuration.request,
              method: distPreset.entryRequest.method as any,
              path: distPreset.entryRequest.path,
              body: distPreset.entryRequest.body,
              headers: distPreset.entryRequest.headers,
            },
          },
        }));
        return;
      }

      const preset = getScenarioPreset(presetId as ScenarioPresetId);
      set((state) => ({
        activePresetId: presetId,
        scenario: preset,
        distributedScenario: null,
        configuration: {
          ...state.configuration,
          presetId,
          scenario: preset,
          distributedScenario: undefined,
          request: {
            ...state.configuration.request,
            path:
              presetId === "cache-miss" || presetId === "cache-hit"
                ? "/api/products/42"
                : presetId === "database-write"
                  ? "/api/orders"
                  : state.configuration.request.path,
            method: presetId === "database-write" ? "POST" : "GET",
          },
        },
      }));
    },

    updateScenario: (partial) => {
      set((state) => ({
        scenario: {
          ...state.scenario,
          ...partial,
        },
      }));
    },

    updateConfiguration: (partial) => {
      set((state) => ({
        configuration: {
          ...state.configuration,
          ...partial,
        },
      }));
    },

    setSelectedBranch: (nodeId: string, edgeOrTargetId: string) => {
      set((state) => ({
        configuration: {
          ...state.configuration,
          routing: {
            ...state.configuration.routing,
            selectedBranches: {
              ...state.configuration.routing.selectedBranches,
              [nodeId]: edgeOrTargetId,
            },
          },
        },
      }));
    },

    selectEvent: (eventId: string | null) => {
      set({ selectedEventId: eventId });
      if (eventId && get().trace) {
        const frameIndex = get().trace!.frames.findIndex((f) => f.activeEvent.id === eventId);
        if (frameIndex !== -1 && playbackController) {
          playbackController.seekToStep(frameIndex);
        }
      }
    },

    runExecution: (nodes, edges, architectureId = "arch_canvas", revisionId = "rev_v1") => {
      const { configuration, activePresetId } = get();

      // Fallback: if no entry node selected, pick first input or first node
      let activeEntryNodeId = configuration.entryNodeId;
      if (!activeEntryNodeId || !nodes.some((n) => n.id === activeEntryNodeId)) {
        const inputNode = nodes.find((n) => n.type === "input" || n.type === "client");
        activeEntryNodeId = inputNode ? inputNode.id : nodes[0]?.id || "";
        set((state) => ({
          configuration: {
            ...state.configuration,
            entryNodeId: activeEntryNodeId,
          },
        }));
      }

      if (!activeEntryNodeId) {
        return false;
      }

      const activeConfig: ExecutionConfiguration = {
        ...configuration,
        entryNodeId: activeEntryNodeId,
        scenario: get().scenario,
        distributedScenario: get().distributedScenario || undefined,
        presetId: activePresetId,
      };

      // 1. Snapshot creation & validation
      const snapshot = ExecutionSnapshotManager.createSnapshot(
        architectureId,
        revisionId,
        "Active Canvas Architecture",
        nodes,
        edges,
        activeConfig
      );

      // 2. Deterministic execution trace planning
      const trace = ExecutionPlanner.planExecution(snapshot, activeConfig);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId,
        architectureRevisionId: revisionId,
        snapshotHash: snapshot.snapshotHash,
        configuration: activeConfig,
        trace,
        createdAt: new Date().toISOString(),
      };

      // 3. Initialize Controller & State
      const controller = ensureController();
      controller.loadTrace(trace);

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        playbackState: controller.getState(),
      });

      // Automatically play trace
      controller.play();
      return true;
    },

    play: () => {
      ensureController().play();
    },

    pause: () => {
      ensureController().pause();
    },

    resume: () => {
      ensureController().resume();
    },

    stop: () => {
      ensureController().stop();
      set({
        isExecutionModeActive: false,
        playbackState: {
          ...initialPlaybackState,
          status: "stopped",
        },
      });
    },

    restart: () => {
      ensureController().restart();
    },

    nextStep: () => {
      ensureController().nextStep();
    },

    previousStep: () => {
      ensureController().previousStep();
    },

    seekToStep: (index: number) => {
      ensureController().seekToStep(index);
    },

    setSpeed: (speed: PlaybackSpeed) => {
      ensureController().setSpeed(speed);
      set((state) => ({
        playbackState: {
          ...state.playbackState,
          speed,
        },
      }));
    },
  };
});
