export interface TraceFrame {
  index: number;
  timestamp: number;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  nodeStates: Record<string, unknown>;
  logs: string[];
}

export interface ExecutionTrace {
  id: string;
  projectId: string;
  simulationId: string;
  totalFrames: number;
  frames: TraceFrame[];
  createdAt: string;
}

export interface TraceScrubberState {
  currentFrameIndex: number;
  isPlaying: boolean;
  playbackSpeed: number; // 1x, 2x, etc.
}
