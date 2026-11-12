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
  type FailureScenario,
  type ResiliencePresetId,
  type ScenarioComparison,
  type TrafficScenario,
  type TrafficPresetId,
  type SimulationComparison,
  ExecutionSnapshotManager,
  ExecutionPlanner,
  PlaybackController,
  getScenarioPreset,
  getDistributedScenarioPreset,
  ResiliencePresetFactory,
  ResilienceSimulationEngine,
  RESILIENCE_PRESET_DEFINITIONS,
  TrafficPresetFactory,
  TrafficSimulationEngine,
  TRAFFIC_PRESET_DEFINITIONS,
  type DatabaseScenario,
  type DatabaseScenarioPresetId,
  DATABASE_PRESET_METADATA,
  createDatabasePresetScenario,
  DatabaseExecutionEngine,
  type CacheScenario,
  type CacheScenarioPresetId,
  CACHE_PRESET_METADATA,
  createCachePresetScenario,
  CacheExecutionEngine,
  type SecurityScenario,
  type SecurityScenarioPresetId,
  SECURITY_PRESET_METADATA,
  createSecurityPresetScenario,
  SecurityExecutionEngine,
  type StreamingScenario,
  type StreamingScenarioPresetId,
  STREAMING_PRESET_METADATA,
  createStreamingPresetScenario,
  StreamingExecutionEngine,
  type KubernetesScenario,
  type KubernetesScenarioPresetId,
  KUBERNETES_PRESET_METADATA,
  createKubernetesPresetScenario,
  KubernetesExecutionEngine,
  type GlobalNetworkScenario,
  type GlobalNetworkPresetId,
  GLOBAL_NETWORK_PRESET_METADATA,
  createGlobalNetworkPresetScenario,
  GlobalNetworkExecutionEngine,
  type ServiceMeshScenario,
  type ServiceMeshPresetId,
  SERVICE_MESH_PRESET_METADATA,
  createServiceMeshPresetScenario,
  ServiceMeshExecutionEngine,
  type RaftScenario,
  type RaftPresetId,
  RAFT_PRESET_METADATA,
  createRaftPresetScenario,
  RaftExecutionEngine,
  type DistributedTransactionScenario,
  type DistributedTransactionPresetId,
  DISTRIBUTED_TRANSACTION_PRESET_METADATA,
  createDistributedTransactionPresetScenario,
  DistributedTransactionExecutionEngine,
  type StorageScenario,
  type DistributedStoragePresetId,
  DISTRIBUTED_STORAGE_PRESET_METADATA,
  createDistributedStoragePresetScenario,
  DistributedStorageExecutionEngine,
  type TrafficControlScenario,
  type TrafficControlPresetId,
  TRAFFIC_CONTROL_PRESET_METADATA,
  createTrafficControlPresetScenario,
  TrafficControlExecutionEngine,
  type ObservabilityScenario,
  type ObservabilityPresetId,
  OBS_PRESET_METADATA,
  createObservabilityPresetScenario,
  ObservabilityExecutionEngine,
  type ZeroTrustScenario,
  type ZeroTrustPresetId,
  ZERO_TRUST_PRESET_METADATA,
  createZeroTrustPresetScenario,
  ZeroTrustExecutionEngine,
  type DeploymentScenario,
  type DeploymentPresetId,
  DEPLOYMENT_PRESET_METADATA,
  createDeploymentPresetScenario,
  DeploymentExecutionEngine,
  type DisasterRecoveryScenario,
  type DisasterRecoveryPresetId,
  DISASTER_RECOVERY_PRESET_METADATA,
  createDisasterRecoveryPresetScenario,
  DisasterRecoveryExecutionEngine,
  type CapacityScenario,
  type CapacityPresetId,
  CAPACITY_PRESET_METADATA,
  buildCapacityPresetScenario,
  CapacityExecutionEngine,
  type AnalysisExperiment,
  type AnalysisPresetId,
  ANALYSIS_PRESET_METADATA,
  createAnalysisPresetExperiment,
  ArchitectureAnalysisExecutionEngine,
  type PracticeScenario,
  type PracticePresetId,
  type ChallengeAttempt,
  PRACTICE_PRESET_METADATA,
  createPracticePresetScenario,
  PracticeExecutionEngine,
} from "@nxtqr/architecture-execution";

export type AllScenarioPresetId =
  | ScenarioPresetId
  | DistributedScenarioPresetId
  | ResiliencePresetId
  | TrafficPresetId
  | DatabaseScenarioPresetId
  | CacheScenarioPresetId
  | SecurityScenarioPresetId
  | StreamingScenarioPresetId
  | KubernetesScenarioPresetId
  | GlobalNetworkPresetId
  | ServiceMeshPresetId
  | RaftPresetId
  | DistributedTransactionPresetId
  | DistributedStoragePresetId
  | TrafficControlPresetId
  | ObservabilityPresetId
  | ZeroTrustPresetId
  | DeploymentPresetId
  | DisasterRecoveryPresetId
  | CapacityPresetId
  | AnalysisPresetId
  | PracticePresetId;

export interface ExecutionStoreState {
  // Mode toggles
  isExecutionModeActive: boolean;
  isTimelineOpen: boolean;
  isDistributedTimelineOpen: boolean;
  isTraceWaterfallOpen: boolean;
  isSequenceViewOpen: boolean;
  isConfigDialogOpen: boolean;
  isExecutionInspectorOpen: boolean;
  isFaultScenarioDialogOpen: boolean;
  isScenarioComparisonOpen: boolean;
  isFaultInspectorOpen: boolean;
  isTrafficWorkspaceOpen: boolean;
  isTrafficScenarioDialogOpen: boolean;
  isTrafficComparisonOpen: boolean;
  isDatabaseWorkspaceOpen: boolean;
  isCacheWorkspaceOpen: boolean;
  isSecurityWorkspaceOpen: boolean;
  isStreamingWorkspaceOpen: boolean;
  isKubernetesWorkspaceOpen: boolean;
  isGlobalNetworkWorkspaceOpen: boolean;
  isServiceMeshWorkspaceOpen: boolean;
  isRaftWorkspaceOpen: boolean;
  isDistributedTxWorkspaceOpen: boolean;
  isDistributedStorageWorkspaceOpen: boolean;
  isTrafficControlWorkspaceOpen: boolean;
  isObservabilityWorkspaceOpen: boolean;
  isZeroTrustWorkspaceOpen: boolean;
  isDeploymentWorkspaceOpen: boolean;
  isDisasterRecoveryWorkspaceOpen: boolean;
  isCapacityWorkspaceOpen: boolean;
  isAnalysisWorkspaceOpen: boolean;
  isPracticeWorkspaceOpen: boolean;

  // Active configuration & behavioral scenario
  configuration: ExecutionConfiguration;
  scenario: BehaviorScenario;
  distributedScenario: DistributedScenarioConfig | null;
  activeFailureScenario: FailureScenario | null;
  activeTrafficScenario: TrafficScenario | null;
  activeDatabaseScenario: DatabaseScenario | null;
  activeCacheScenario: CacheScenario | null;
  activeSecurityScenario: SecurityScenario | null;
  activeStreamingScenario: StreamingScenario | null;
  activeKubernetesScenario: KubernetesScenario | null;
  activeGlobalNetworkScenario: GlobalNetworkScenario | null;
  activeServiceMeshScenario: ServiceMeshScenario | null;
  activeRaftScenario: RaftScenario | null;
  activeDistributedTxScenario: DistributedTransactionScenario | null;
  activeDistributedStorageScenario: StorageScenario | null;
  activeTrafficControlScenario: TrafficControlScenario | null;
  activeObservabilityScenario: ObservabilityScenario | null;
  activeZeroTrustScenario: ZeroTrustScenario | null;
  activeDeploymentScenario: DeploymentScenario | null;
  activeDisasterRecoveryScenario: DisasterRecoveryScenario | null;
  activeCapacityScenario: CapacityScenario | null;
  activeAnalysisExperiment: AnalysisExperiment | null;
  activePracticeScenario: PracticeScenario | null;
  practiceAttempts: ChallengeAttempt[];
  activePresetId: AllScenarioPresetId;

  // Active run & trace
  activeRun: ExecutionRun | null;
  trace: ExecutionTrace | null;
  baselineTrace: ExecutionTrace | null;
  scenarioComparison: ScenarioComparison | null;
  trafficComparison: SimulationComparison | null;

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
  toggleFaultScenarioDialog: (open?: boolean) => void;
  toggleScenarioComparison: (open?: boolean) => void;
  toggleFaultInspector: (open?: boolean) => void;
  toggleTrafficWorkspace: (open?: boolean) => void;
  toggleTrafficScenarioDialog: (open?: boolean) => void;
  toggleTrafficComparison: (open?: boolean) => void;
  toggleDatabaseWorkspace: (open?: boolean) => void;
  toggleCacheWorkspace: (open?: boolean) => void;
  toggleSecurityWorkspace: (open?: boolean) => void;
  toggleStreamingWorkspace: (open?: boolean) => void;
  toggleKubernetesWorkspace: (open?: boolean) => void;
  toggleGlobalNetworkWorkspace: (open?: boolean) => void;
  toggleServiceMeshWorkspace: (open?: boolean) => void;
  toggleRaftWorkspace: (open?: boolean) => void;
  toggleDistributedTxWorkspace: (open?: boolean) => void;
  toggleDistributedStorageWorkspace: (open?: boolean) => void;
  toggleTrafficControlWorkspace: (open?: boolean) => void;
  toggleObservabilityWorkspace: (open?: boolean) => void;
  toggleZeroTrustWorkspace: (open?: boolean) => void;
  toggleDeploymentWorkspace: (open?: boolean) => void;
  toggleDisasterRecoveryWorkspace: (open?: boolean) => void;
  toggleCapacityWorkspace: (open?: boolean) => void;
  toggleAnalysisWorkspace: (open?: boolean) => void;
  togglePracticeWorkspace: (open?: boolean) => void;
  setEntryNodeId: (nodeId: string) => void;
  setScenarioPreset: (presetId: AllScenarioPresetId, nodes?: BaseNode[], edges?: BaseEdge[]) => void;
  setFailureScenario: (scenario: FailureScenario | null) => void;
  setTrafficScenario: (scenario: TrafficScenario | null) => void;
  setDatabaseScenario: (scenario: DatabaseScenario | null) => void;
  setCacheScenario: (scenario: CacheScenario | null) => void;
  setSecurityScenario: (scenario: SecurityScenario | null) => void;
  setStreamingScenario: (scenario: StreamingScenario | null) => void;
  setKubernetesScenario: (scenario: KubernetesScenario | null) => void;
  setGlobalNetworkScenario: (scenario: GlobalNetworkScenario | null) => void;
  setServiceMeshScenario: (scenario: ServiceMeshScenario | null) => void;
  setRaftScenario: (scenario: RaftScenario | null) => void;
  setDistributedTxScenario: (scenario: DistributedTransactionScenario | null) => void;
  setDistributedStorageScenario: (scenario: StorageScenario | null) => void;
  setTrafficControlScenario: (scenario: TrafficControlScenario | null) => void;
  setObservabilityScenario: (scenario: ObservabilityScenario | null) => void;
  setZeroTrustScenario: (scenario: ZeroTrustScenario | null) => void;
  setDeploymentScenario: (scenario: DeploymentScenario | null) => void;
  setDisasterRecoveryScenario: (scenario: DisasterRecoveryScenario | null) => void;
  setCapacityScenario: (scenario: CapacityScenario | null) => void;
  setAnalysisExperiment: (experiment: AnalysisExperiment | null) => void;
  setPracticeScenario: (scenario: PracticeScenario | null) => void;
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
  runResilienceSimulation: (
    nodes: BaseNode[],
    edges: BaseEdge[],
    scenario: FailureScenario,
    architectureId?: string,
    revisionId?: string
  ) => boolean;
  runTrafficSimulation: (
    nodes: BaseNode[],
    edges: BaseEdge[],
    scenario: TrafficScenario,
    architectureId?: string,
    revisionId?: string
  ) => boolean;
  runDatabaseSimulation: (scenario: DatabaseScenario) => boolean;
  executeCustomDatabaseQuery: (sql: string) => boolean;
  runCacheSimulation: (scenario: CacheScenario) => boolean;
  runSecuritySimulation: (scenario: SecurityScenario) => boolean;
  runStreamingSimulation: (scenario: StreamingScenario) => boolean;
  runKubernetesSimulation: (scenario: KubernetesScenario) => boolean;
  runGlobalNetworkSimulation: (scenario: GlobalNetworkScenario) => boolean;
  runServiceMeshSimulation: (scenario: ServiceMeshScenario) => boolean;
  runRaftSimulation: (scenario: RaftScenario) => boolean;
  runDistributedTxSimulation: (scenario: DistributedTransactionScenario) => boolean;
  runDistributedStorageSimulation: (scenario: StorageScenario) => boolean;
  runTrafficControlSimulation: (scenario: TrafficControlScenario) => boolean;
  runObservabilitySimulation: (scenario: ObservabilityScenario) => boolean;
  runZeroTrustSimulation: (scenario: ZeroTrustScenario) => boolean;
  runDeploymentSimulation: (scenario: DeploymentScenario) => boolean;
  runDisasterRecoverySimulation: (scenario: DisasterRecoveryScenario) => boolean;
  runCapacitySimulation: (scenario: CapacityScenario) => boolean;
  runAnalysisExperiment: (experiment: AnalysisExperiment) => boolean;
  runPracticeScenario: (scenario: PracticeScenario) => boolean;
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
    isFaultScenarioDialogOpen: false,
    isScenarioComparisonOpen: false,
    isFaultInspectorOpen: false,
    isTrafficWorkspaceOpen: false,
    isTrafficScenarioDialogOpen: false,
    isTrafficComparisonOpen: false,
    isDatabaseWorkspaceOpen: false,
    isCacheWorkspaceOpen: false,
    isSecurityWorkspaceOpen: false,
    isStreamingWorkspaceOpen: false,
    isKubernetesWorkspaceOpen: false,
    isGlobalNetworkWorkspaceOpen: false,
    isServiceMeshWorkspaceOpen: false,
    isRaftWorkspaceOpen: false,
    isDistributedTxWorkspaceOpen: false,
    isDistributedStorageWorkspaceOpen: false,
    isTrafficControlWorkspaceOpen: false,
    isObservabilityWorkspaceOpen: false,
    isZeroTrustWorkspaceOpen: false,
    isDeploymentWorkspaceOpen: false,
    isDisasterRecoveryWorkspaceOpen: false,
    isCapacityWorkspaceOpen: false,
    isAnalysisWorkspaceOpen: false,
    isPracticeWorkspaceOpen: false,
    configuration: defaultConfiguration,
    scenario: getScenarioPreset("cache-miss"),
    distributedScenario: null,
    activeFailureScenario: null,
    activeTrafficScenario: null,
    activeDatabaseScenario: null,
    activeCacheScenario: null,
    activeSecurityScenario: null,
    activeStreamingScenario: null,
    activeKubernetesScenario: null,
    activeGlobalNetworkScenario: null,
    activeServiceMeshScenario: null,
    activeRaftScenario: null,
    activeDistributedTxScenario: null,
    activeDistributedStorageScenario: null,
    activeTrafficControlScenario: null,
    activeObservabilityScenario: null,
    activeZeroTrustScenario: null,
    activeDeploymentScenario: null,
    activeDisasterRecoveryScenario: null,
    activeCapacityScenario: null,
    activeAnalysisExperiment: null,
    activePracticeScenario: null,
    practiceAttempts: [],
    activePresetId: "cache-miss",
    activeRun: null,
    trace: null,
    baselineTrace: null,
    scenarioComparison: null,
    trafficComparison: null,
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
          isFaultScenarioDialogOpen: false,
          isScenarioComparisonOpen: false,
          isFaultInspectorOpen: false,
          isTrafficWorkspaceOpen: false,
          isTrafficScenarioDialogOpen: false,
          isTrafficComparisonOpen: false,
          isDatabaseWorkspaceOpen: false,
          isCacheWorkspaceOpen: false,
          isSecurityWorkspaceOpen: false,
          isStreamingWorkspaceOpen: false,
          isKubernetesWorkspaceOpen: false,
          isGlobalNetworkWorkspaceOpen: false,
          isServiceMeshWorkspaceOpen: false,
          isRaftWorkspaceOpen: false,
          isDistributedTxWorkspaceOpen: false,
          isDistributedStorageWorkspaceOpen: false,
          isTrafficControlWorkspaceOpen: false,
          isObservabilityWorkspaceOpen: false,
          isZeroTrustWorkspaceOpen: false,
          isDeploymentWorkspaceOpen: false,
          isDisasterRecoveryWorkspaceOpen: false,
          isCapacityWorkspaceOpen: false,
          isAnalysisWorkspaceOpen: false,
          isPracticeWorkspaceOpen: false,
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

    toggleFaultScenarioDialog: (open) => {
      set({
        isFaultScenarioDialogOpen:
          open !== undefined ? open : !get().isFaultScenarioDialogOpen,
      });
    },

    toggleScenarioComparison: (open) => {
      set({
        isScenarioComparisonOpen:
          open !== undefined ? open : !get().isScenarioComparisonOpen,
      });
    },

    toggleFaultInspector: (open) => {
      set({
        isFaultInspectorOpen:
          open !== undefined ? open : !get().isFaultInspectorOpen,
      });
    },

    toggleTrafficWorkspace: (open) => {
      set({
        isTrafficWorkspaceOpen:
          open !== undefined ? open : !get().isTrafficWorkspaceOpen,
      });
    },

    toggleTrafficScenarioDialog: (open) => {
      set({
        isTrafficScenarioDialogOpen:
          open !== undefined ? open : !get().isTrafficScenarioDialogOpen,
      });
    },

    toggleTrafficComparison: (open) => {
      set({
        isTrafficComparisonOpen:
          open !== undefined ? open : !get().isTrafficComparisonOpen,
      });
    },

    toggleDatabaseWorkspace: (open) => {
      set({
        isDatabaseWorkspaceOpen:
          open !== undefined ? open : !get().isDatabaseWorkspaceOpen,
      });
    },

    toggleCacheWorkspace: (open) => {
      set({
        isCacheWorkspaceOpen:
          open !== undefined ? open : !get().isCacheWorkspaceOpen,
      });
    },

    toggleSecurityWorkspace: (open) => {
      set({
        isSecurityWorkspaceOpen:
          open !== undefined ? open : !get().isSecurityWorkspaceOpen,
      });
    },

    toggleStreamingWorkspace: (open) => {
      set({
        isStreamingWorkspaceOpen:
          open !== undefined ? open : !get().isStreamingWorkspaceOpen,
      });
    },

    toggleKubernetesWorkspace: (open) => {
      set({
        isKubernetesWorkspaceOpen:
          open !== undefined ? open : !get().isKubernetesWorkspaceOpen,
      });
    },

    toggleGlobalNetworkWorkspace: (open) => {
      set({
        isGlobalNetworkWorkspaceOpen:
          open !== undefined ? open : !get().isGlobalNetworkWorkspaceOpen,
      });
    },

    toggleServiceMeshWorkspace: (open) => {
      set({
        isServiceMeshWorkspaceOpen:
          open !== undefined ? open : !get().isServiceMeshWorkspaceOpen,
      });
    },

    toggleRaftWorkspace: (open) => {
      set({
        isRaftWorkspaceOpen:
          open !== undefined ? open : !get().isRaftWorkspaceOpen,
      });
    },

    toggleDistributedTxWorkspace: (open) => {
      set({
        isDistributedTxWorkspaceOpen:
          open !== undefined ? open : !get().isDistributedTxWorkspaceOpen,
      });
    },

    toggleDistributedStorageWorkspace: (open) => {
      set({
        isDistributedStorageWorkspaceOpen:
          open !== undefined ? open : !get().isDistributedStorageWorkspaceOpen,
      });
    },

    toggleTrafficControlWorkspace: (open) => {
      set({
        isTrafficControlWorkspaceOpen:
          open !== undefined ? open : !get().isTrafficControlWorkspaceOpen,
      });
    },

    toggleObservabilityWorkspace: (open) => {
      set({
        isObservabilityWorkspaceOpen:
          open !== undefined ? open : !get().isObservabilityWorkspaceOpen,
      });
    },

    toggleZeroTrustWorkspace: (open) => {
      set({
        isZeroTrustWorkspaceOpen:
          open !== undefined ? open : !get().isZeroTrustWorkspaceOpen,
      });
    },

    toggleDeploymentWorkspace: (open) => {
      set({
        isDeploymentWorkspaceOpen:
          open !== undefined ? open : !get().isDeploymentWorkspaceOpen,
      });
    },

    toggleDisasterRecoveryWorkspace: (open) => {
      set({
        isDisasterRecoveryWorkspaceOpen:
          open !== undefined ? open : !get().isDisasterRecoveryWorkspaceOpen,
      });
    },

    toggleCapacityWorkspace: (open) => {
      set({
        isCapacityWorkspaceOpen:
          open !== undefined ? open : !get().isCapacityWorkspaceOpen,
      });
    },

    toggleAnalysisWorkspace: (open) => {
      set({
        isAnalysisWorkspaceOpen:
          open !== undefined ? open : !get().isAnalysisWorkspaceOpen,
      });
    },

    togglePracticeWorkspace: (open) => {
      set({
        isPracticeWorkspaceOpen:
          open !== undefined ? open : !get().isPracticeWorkspaceOpen,
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

    setFailureScenario: (scenario) => {
      set({ activeFailureScenario: scenario });
    },

    setTrafficScenario: (scenario) => {
      set({ activeTrafficScenario: scenario });
    },

    setDatabaseScenario: (scenario) => {
      set({ activeDatabaseScenario: scenario });
    },

    setCacheScenario: (scenario) => {
      set({ activeCacheScenario: scenario });
    },

    setSecurityScenario: (scenario) => {
      set({ activeSecurityScenario: scenario });
    },

    setStreamingScenario: (scenario) => {
      set({ activeStreamingScenario: scenario });
    },

    setKubernetesScenario: (scenario) => {
      set({ activeKubernetesScenario: scenario });
    },

    setGlobalNetworkScenario: (scenario) => {
      set({ activeGlobalNetworkScenario: scenario });
    },

    setServiceMeshScenario: (scenario) => {
      set({ activeServiceMeshScenario: scenario });
    },

    setRaftScenario: (scenario) => {
      set({ activeRaftScenario: scenario });
    },

    setDistributedTxScenario: (scenario) => {
      set({ activeDistributedTxScenario: scenario });
    },

    setDistributedStorageScenario: (scenario) => {
      set({ activeDistributedStorageScenario: scenario });
    },

    setTrafficControlScenario: (scenario) => {
      set({ activeTrafficControlScenario: scenario });
    },

    setObservabilityScenario: (scenario) => {
      set({ activeObservabilityScenario: scenario });
    },

    setZeroTrustScenario: (scenario) => {
      set({ activeZeroTrustScenario: scenario });
    },

    setDeploymentScenario: (scenario) => {
      set({ activeDeploymentScenario: scenario });
    },

    setDisasterRecoveryScenario: (scenario) => {
      set({ activeDisasterRecoveryScenario: scenario });
    },

    setCapacityScenario: (scenario) => {
      set({ activeCapacityScenario: scenario });
    },

    setAnalysisExperiment: (experiment) => {
      set({ activeAnalysisExperiment: experiment });
    },

    setPracticeScenario: (scenario) => {
      set({ activePracticeScenario: scenario });
    },

    setScenarioPreset: (presetId, nodes = [], edges = []) => {
      if (PRACTICE_PRESET_METADATA.some((p) => p.id === presetId)) {
        const scenario = createPracticePresetScenario(
          presetId as PracticePresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activePracticeScenario: scenario,
          activeAnalysisExperiment: null,
          activeCapacityScenario: null,
          activeDisasterRecoveryScenario: null,
          activeDeploymentScenario: null,
          activeZeroTrustScenario: null,
          activeObservabilityScenario: null,
          activeTrafficControlScenario: null,
          activeDistributedStorageScenario: null,
          activeDistributedTxScenario: null,
          activeRaftScenario: null,
          activeServiceMeshScenario: null,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isPracticeWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runPracticeScenario(scenario);
        return;
      }

      if (ANALYSIS_PRESET_METADATA.some((p) => p.id === presetId)) {
        const exp = createAnalysisPresetExperiment(
          presetId as AnalysisPresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activeAnalysisExperiment: exp,
          activePracticeScenario: null,
          activeCapacityScenario: null,
          activeDisasterRecoveryScenario: null,
          activeDeploymentScenario: null,
          activeZeroTrustScenario: null,
          activeObservabilityScenario: null,
          activeTrafficControlScenario: null,
          activeDistributedStorageScenario: null,
          activeDistributedTxScenario: null,
          activeRaftScenario: null,
          activeServiceMeshScenario: null,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isAnalysisWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runAnalysisExperiment(exp);
        return;
      }

      if (CAPACITY_PRESET_METADATA.some((p) => p.id === presetId)) {
        const capScenario = buildCapacityPresetScenario(
          presetId as CapacityPresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activeCapacityScenario: capScenario,
          activeDisasterRecoveryScenario: null,
          activeDeploymentScenario: null,
          activeZeroTrustScenario: null,
          activeObservabilityScenario: null,
          activeTrafficControlScenario: null,
          activeDistributedStorageScenario: null,
          activeDistributedTxScenario: null,
          activeRaftScenario: null,
          activeServiceMeshScenario: null,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isCapacityWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runCapacitySimulation(capScenario);
        return;
      }

      if (DISASTER_RECOVERY_PRESET_METADATA.some((p) => p.id === presetId)) {
        const drScenario = createDisasterRecoveryPresetScenario(
          presetId as DisasterRecoveryPresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activeDisasterRecoveryScenario: drScenario,
          activeDeploymentScenario: null,
          activeZeroTrustScenario: null,
          activeObservabilityScenario: null,
          activeTrafficControlScenario: null,
          activeDistributedStorageScenario: null,
          activeDistributedTxScenario: null,
          activeRaftScenario: null,
          activeServiceMeshScenario: null,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isDisasterRecoveryWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runDisasterRecoverySimulation(drScenario);
        return;
      }

      if (DEPLOYMENT_PRESET_METADATA.some((p) => p.id === presetId)) {
        const depScenario = createDeploymentPresetScenario(
          presetId as DeploymentPresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activeDeploymentScenario: depScenario,
          activeZeroTrustScenario: null,
          activeObservabilityScenario: null,
          activeTrafficControlScenario: null,
          activeDistributedStorageScenario: null,
          activeDistributedTxScenario: null,
          activeRaftScenario: null,
          activeServiceMeshScenario: null,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isDeploymentWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runDeploymentSimulation(depScenario);
        return;
      }

      if (ZERO_TRUST_PRESET_METADATA.some((p) => p.id === presetId)) {
        const ztScenario = createZeroTrustPresetScenario(
          presetId as ZeroTrustPresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activeZeroTrustScenario: ztScenario,
          activeObservabilityScenario: null,
          activeTrafficControlScenario: null,
          activeDistributedStorageScenario: null,
          activeDistributedTxScenario: null,
          activeRaftScenario: null,
          activeServiceMeshScenario: null,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isZeroTrustWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runZeroTrustSimulation(ztScenario);
        return;
      }

      if (OBS_PRESET_METADATA.some((p) => p.id === presetId)) {
        const obsScenario = createObservabilityPresetScenario(
          presetId as ObservabilityPresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activeObservabilityScenario: obsScenario,
          activeTrafficControlScenario: null,
          activeDistributedStorageScenario: null,
          activeDistributedTxScenario: null,
          activeRaftScenario: null,
          activeServiceMeshScenario: null,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isObservabilityWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runObservabilitySimulation(obsScenario);
        return;
      }

      if (TRAFFIC_CONTROL_PRESET_METADATA.some((p) => p.id === presetId)) {
        const tcScenario = createTrafficControlPresetScenario(
          presetId as TrafficControlPresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activeTrafficControlScenario: tcScenario,
          activeDistributedStorageScenario: null,
          activeDistributedTxScenario: null,
          activeRaftScenario: null,
          activeServiceMeshScenario: null,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isTrafficControlWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runTrafficControlSimulation(tcScenario);
        return;
      }

      if (DISTRIBUTED_STORAGE_PRESET_METADATA.some((p) => p.id === presetId)) {
        const storageScenario = createDistributedStoragePresetScenario(
          presetId as DistributedStoragePresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activeDistributedStorageScenario: storageScenario,
          activeTrafficControlScenario: null,
          activeDistributedTxScenario: null,
          activeRaftScenario: null,
          activeServiceMeshScenario: null,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isDistributedStorageWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runDistributedStorageSimulation(storageScenario);
        return;
      }

      if (DISTRIBUTED_TRANSACTION_PRESET_METADATA.some((p) => p.id === presetId)) {
        const txScenario = createDistributedTransactionPresetScenario(
          presetId as DistributedTransactionPresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activeDistributedTxScenario: txScenario,
          activeDistributedStorageScenario: null,
          activeRaftScenario: null,
          activeServiceMeshScenario: null,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isDistributedTxWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runDistributedTxSimulation(txScenario);
        return;
      }

      if (RAFT_PRESET_METADATA.some((p) => p.id === presetId)) {
        const raftScenario = createRaftPresetScenario(presetId as RaftPresetId);
        set((state) => ({
          activePresetId: presetId,
          activeRaftScenario: raftScenario,
          activeServiceMeshScenario: null,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isRaftWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runRaftSimulation(raftScenario);
        return;
      }

      if (SERVICE_MESH_PRESET_METADATA.some((p) => p.id === presetId)) {
        const meshScenario = createServiceMeshPresetScenario(
          presetId as ServiceMeshPresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activeServiceMeshScenario: meshScenario,
          activeGlobalNetworkScenario: null,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isServiceMeshWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runServiceMeshSimulation(meshScenario);
        return;
      }

      if (GLOBAL_NETWORK_PRESET_METADATA.some((p) => p.id === presetId)) {
        const globalScenario = createGlobalNetworkPresetScenario(
          presetId as GlobalNetworkPresetId
        );
        set((state) => ({
          activePresetId: presetId,
          activeGlobalNetworkScenario: globalScenario,
          activeKubernetesScenario: null,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isGlobalNetworkWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runGlobalNetworkSimulation(globalScenario);
        return;
      }

      if (KUBERNETES_PRESET_METADATA.some((p) => p.id === presetId)) {
        const k8sScenario = createKubernetesPresetScenario(presetId as KubernetesScenarioPresetId);
        set((state) => ({
          activePresetId: presetId,
          activeKubernetesScenario: k8sScenario,
          activeStreamingScenario: null,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isKubernetesWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runKubernetesSimulation(k8sScenario);
        return;
      }

      if (presetId in STREAMING_PRESET_METADATA) {
        const streamScenario = createStreamingPresetScenario(presetId as StreamingScenarioPresetId);
        set((state) => ({
          activePresetId: presetId,
          activeStreamingScenario: streamScenario,
          activeSecurityScenario: null,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isStreamingWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runStreamingSimulation(streamScenario);
        return;
      }

      if (presetId in SECURITY_PRESET_METADATA) {
        const securityScenario = createSecurityPresetScenario(presetId as SecurityScenarioPresetId);
        set((state) => ({
          activePresetId: presetId,
          activeSecurityScenario: securityScenario,
          activeCacheScenario: null,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isSecurityWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runSecuritySimulation(securityScenario);
        return;
      }

      if (presetId in CACHE_PRESET_METADATA) {
        const cacheScenario = createCachePresetScenario(presetId as CacheScenarioPresetId);
        set((state) => ({
          activePresetId: presetId,
          activeCacheScenario: cacheScenario,
          activeDatabaseScenario: null,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isCacheWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runCacheSimulation(cacheScenario);
        return;
      }

      if (presetId in DATABASE_PRESET_METADATA) {
        const dbScenario = createDatabasePresetScenario(presetId as DatabaseScenarioPresetId);
        set((state) => ({
          activePresetId: presetId,
          activeDatabaseScenario: dbScenario,
          activeTrafficScenario: null,
          activeFailureScenario: null,
          distributedScenario: null,
          isDatabaseWorkspaceOpen: true,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        get().runDatabaseSimulation(dbScenario);
        return;
      }

      const isTraffic = TRAFFIC_PRESET_DEFINITIONS.some((p) => p.id === presetId);
      if (isTraffic) {
        const trafficScenario = TrafficPresetFactory.createPreset(
          presetId as TrafficPresetId,
          nodes,
          edges
        );
        set((state) => ({
          activePresetId: presetId,
          activeTrafficScenario: trafficScenario,
          activeFailureScenario: null,
          distributedScenario: null,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        return;
      }

      const isResilience = RESILIENCE_PRESET_DEFINITIONS.some((p) => p.id === presetId);
      if (isResilience) {
        const failureScenario = ResiliencePresetFactory.createScenario(
          presetId as ResiliencePresetId,
          nodes,
          edges
        );
        set((state) => ({
          activePresetId: presetId,
          activeFailureScenario: failureScenario,
          activeTrafficScenario: null,
          distributedScenario: null,
          configuration: {
            ...state.configuration,
            presetId,
          },
        }));
        return;
      }

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
          activeFailureScenario: null,
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
        activeFailureScenario: null,
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

      // If a traffic scenario is active, route through traffic simulation engine
      if (get().activeTrafficScenario) {
        return get().runTrafficSimulation(
          nodes,
          edges,
          get().activeTrafficScenario!,
          architectureId,
          revisionId
        );
      }

      // If a failure scenario is active, route through resilience simulation engine
      if (get().activeFailureScenario) {
        return get().runResilienceSimulation(
          nodes,
          edges,
          get().activeFailureScenario!,
          architectureId,
          revisionId
        );
      }

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

    runResilienceSimulation: (nodes, edges, scenario, architectureId = "arch_canvas", revisionId = "rev_v1") => {
      const { configuration } = get();

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

      if (!activeEntryNodeId) return false;

      const activeConfig: ExecutionConfiguration = {
        ...configuration,
        entryNodeId: activeEntryNodeId,
      };

      // 1. Snapshot
      const snapshot = ExecutionSnapshotManager.createSnapshot(
        architectureId,
        revisionId,
        "Active Canvas Architecture",
        nodes,
        edges,
        activeConfig
      );

      // 2. Baseline run without faults
      const cleanScenario: FailureScenario = {
        ...scenario,
        faults: [],
      };
      const baselineTrace = ResilienceSimulationEngine.planResilienceExecution(
        snapshot,
        cleanScenario,
        activeConfig
      );

      // 3. Failure run with faults & policies
      const failureTrace = ResilienceSimulationEngine.planResilienceExecution(
        snapshot,
        scenario,
        activeConfig
      );

      // 4. Comparison report
      const scenarioComparison = ResilienceSimulationEngine.compareScenarios(
        baselineTrace,
        failureTrace,
        cleanScenario,
        scenario
      );

      const run: ExecutionRun = {
        id: failureTrace.runId,
        architectureId,
        architectureRevisionId: revisionId,
        snapshotHash: snapshot.snapshotHash,
        configuration: activeConfig,
        trace: failureTrace,
        createdAt: new Date().toISOString(),
      };

      const controller = ensureController();
      controller.loadTrace(failureTrace);

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace: failureTrace,
        baselineTrace,
        scenarioComparison,
        activeFailureScenario: scenario,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runTrafficSimulation: (nodes, edges, scenario, architectureId = "arch_canvas", revisionId = "rev_v1") => {
      const { configuration } = get();

      let activeEntryNodeId = scenario.entryNodeId || configuration.entryNodeId;
      if (!activeEntryNodeId || !nodes.some((n) => n.id === activeEntryNodeId)) {
        const inputNode = nodes.find((n) => n.type === "input" || n.type === "client" || n.type === "gateway");
        activeEntryNodeId = inputNode ? inputNode.id : nodes[0]?.id || "";
        set((state) => ({
          configuration: {
            ...state.configuration,
            entryNodeId: activeEntryNodeId,
          },
        }));
      }

      if (!activeEntryNodeId) return false;

      const activeConfig: ExecutionConfiguration = {
        ...configuration,
        entryNodeId: activeEntryNodeId,
      };

      const activeScenario: TrafficScenario = {
        ...scenario,
        entryNodeId: activeEntryNodeId,
      };

      // 1. Snapshot
      const snapshot = ExecutionSnapshotManager.createSnapshot(
        architectureId,
        revisionId,
        "Active Canvas Architecture",
        nodes,
        edges,
        activeConfig
      );

      // 2. Baseline run (single instance, no autoscaling) for comparative insight
      const baselineScenario: TrafficScenario = {
        ...activeScenario,
        id: `traffic_baseline_${Date.now()}`,
        name: "Baseline (Single Instance)",
        capacities: Object.fromEntries(
          Object.entries(activeScenario.capacities).map(([k, v]) => [
            k,
            { ...v, initialInstances: 1, queueCapacity: Math.min(v.queueCapacity, 50) },
          ])
        ),
        autoscaling: {},
      };
      const baselineTrace = TrafficSimulationEngine.runTrafficSimulation(
        snapshot,
        baselineScenario,
        activeConfig
      );

      // 3. Target traffic run
      const trafficTrace = TrafficSimulationEngine.runTrafficSimulation(
        snapshot,
        activeScenario,
        activeConfig
      );

      // 4. Comparison report
      const trafficComparison = TrafficSimulationEngine.compareScenarios(
        baselineTrace,
        trafficTrace,
        baselineScenario,
        activeScenario
      );

      const run: ExecutionRun = {
        id: trafficTrace.runId,
        architectureId,
        architectureRevisionId: revisionId,
        snapshotHash: snapshot.snapshotHash,
        configuration: activeConfig,
        trace: trafficTrace,
        createdAt: new Date().toISOString(),
      };

      const controller = ensureController();
      controller.loadTrace(trafficTrace);

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace: trafficTrace,
        baselineTrace,
        trafficComparison,
        activeTrafficScenario: activeScenario,
        isTimelineOpen: true,
        isTrafficWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runDatabaseSimulation: (scenario) => {
      const trace = DatabaseExecutionEngine.executeScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_db_sim",
        architectureRevisionId: "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeDatabaseScenario: scenario,
        isTimelineOpen: true,
        isDatabaseWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    executeCustomDatabaseQuery: (sql) => {
      const { activeDatabaseScenario } = get();
      const base = activeDatabaseScenario || createDatabasePresetScenario("primary_key_lookup");
      const updated: DatabaseScenario = {
        ...base,
        primaryQuery: sql,
      };
      return get().runDatabaseSimulation(updated);
    },

    runCacheSimulation: (scenario) => {
      const trace = CacheExecutionEngine.executeScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_cache_sim",
        architectureRevisionId: "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeCacheScenario: scenario,
        isTimelineOpen: true,
        isCacheWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runSecuritySimulation: (scenario) => {
      const trace = SecurityExecutionEngine.executeScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_sec_sim",
        architectureRevisionId: "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeSecurityScenario: scenario,
        isTimelineOpen: true,
        isSecurityWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runStreamingSimulation: (scenario) => {
      const trace = StreamingExecutionEngine.executeScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_stream_sim",
        architectureRevisionId: "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeStreamingScenario: scenario,
        isTimelineOpen: true,
        isStreamingWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runKubernetesSimulation: (scenario) => {
      const trace = KubernetesExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_k8s_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeKubernetesScenario: scenario,
        isTimelineOpen: true,
        isKubernetesWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runGlobalNetworkSimulation: (scenario) => {
      const trace = GlobalNetworkExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_global_network_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeGlobalNetworkScenario: scenario,
        isTimelineOpen: true,
        isGlobalNetworkWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runServiceMeshSimulation: (scenario) => {
      const trace = ServiceMeshExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_service_mesh_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeServiceMeshScenario: scenario,
        isTimelineOpen: true,
        isServiceMeshWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runRaftSimulation: (scenario) => {
      const trace = RaftExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_raft_consensus_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeRaftScenario: scenario,
        isTimelineOpen: true,
        isRaftWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runDistributedTxSimulation: (scenario) => {
      const trace = DistributedTransactionExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_distributed_tx_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeDistributedTxScenario: scenario,
        isTimelineOpen: true,
        isDistributedTxWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runDistributedStorageSimulation: (scenario) => {
      const trace = DistributedStorageExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_distributed_storage_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeDistributedStorageScenario: scenario,
        isTimelineOpen: true,
        isDistributedStorageWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runTrafficControlSimulation: (scenario) => {
      const trace = TrafficControlExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_traffic_control_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeTrafficControlScenario: scenario,
        isTimelineOpen: true,
        isTrafficControlWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runObservabilitySimulation: (scenario) => {
      const trace = ObservabilityExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_observability_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeObservabilityScenario: scenario,
        isTimelineOpen: true,
        isObservabilityWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runZeroTrustSimulation: (scenario) => {
      const trace = ZeroTrustExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_zero_trust_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeZeroTrustScenario: scenario,
        isTimelineOpen: true,
        isZeroTrustWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runDeploymentSimulation: (scenario) => {
      const trace = DeploymentExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_deployment_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeDeploymentScenario: scenario,
        isTimelineOpen: true,
        isDeploymentWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runDisasterRecoverySimulation: (scenario) => {
      const trace = DisasterRecoveryExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_disaster_recovery_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeDisasterRecoveryScenario: scenario,
        isTimelineOpen: true,
        isDisasterRecoveryWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runCapacitySimulation: (scenario) => {
      const { trace } = CapacityExecutionEngine.runScenario(scenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_capacity_sim",
        architectureRevisionId: scenario.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeCapacityScenario: scenario,
        isTimelineOpen: true,
        isCapacityWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runAnalysisExperiment: (experiment) => {
      const { trace } =
        ArchitectureAnalysisExecutionEngine.runExperiment(experiment);
      const controller = ensureController();
      controller.loadTrace(trace);

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_analysis_sim",
        architectureRevisionId: experiment.architectureRevisionId || "rev_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activeAnalysisExperiment: experiment,
        isTimelineOpen: true,
        isAnalysisWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

      controller.play();
      return true;
    },

    runPracticeScenario: (scenario) => {
      const existingAttempts = get().practiceAttempts;
      const mergedScenario: PracticeScenario = {
        ...scenario,
        previousAttempts:
          scenario.previousAttempts && scenario.previousAttempts.length > 0
            ? scenario.previousAttempts
            : existingAttempts,
      };
      const { trace, state: practiceState } =
        PracticeExecutionEngine.runScenario(mergedScenario);
      const controller = ensureController();
      controller.loadTrace(trace);

      const nextAttempts = existingAttempts.some(
        (a) => a.id === practiceState.attemptRecord.id
      )
        ? existingAttempts.map((a) =>
            a.id === practiceState.attemptRecord.id
              ? practiceState.attemptRecord
              : a
          )
        : [...existingAttempts, practiceState.attemptRecord];

      const run: ExecutionRun = {
        id: trace.runId,
        architectureId: "arch_practice_sim",
        architectureRevisionId:
          scenario.architectureRevisionId || "rev_practice_001",
        snapshotHash: trace.snapshotHash,
        configuration: trace.configuration,
        trace,
        createdAt: new Date().toISOString(),
      };

      set({
        isExecutionModeActive: true,
        activeRun: run,
        trace,
        activePracticeScenario: mergedScenario,
        practiceAttempts: nextAttempts,
        isTimelineOpen: true,
        isPracticeWorkspaceOpen: true,
        playbackState: controller.getState(),
      });

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
