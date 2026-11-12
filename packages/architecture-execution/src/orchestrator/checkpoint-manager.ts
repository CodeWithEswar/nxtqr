import { RuntimeStateHelper, type ModeledRuntimeState } from "../domain/runtime-state";
import type { VisualizationFrame } from "../domain/execution-trace";
import { computeDeterministicDigest, DeterministicPrng } from "./deterministic-id";
import type { SimulationCheckpoint } from "./orchestrator-schemas";

function computeStateHash(
  stepIndex: number,
  virtualTimeMs: number,
  runtimeState: ModeledRuntimeState,
  activeNodeIds: string[]
): string {
  const payload = JSON.stringify({
    stepIndex,
    virtualTimeMs,
    activeNodeIds,
    runtimeState,
  });
  return `chk_${computeDeterministicDigest(payload)}`;
}

/**
 * Deterministic Snapshot Checkpoint Manager for fast forward-replay and exact seek equivalence.
 */
export class CheckpointManager {
  public static buildCheckpoints(
    frames: VisualizationFrame[],
    interval = 10,
    seed: string | number = 42,
    maxCheckpoints = 250
  ): SimulationCheckpoint[] {
    if (!Array.isArray(frames) || frames.length === 0) return [];

    const safeInterval = Math.max(1, Math.floor(interval));
    const prng = new DeterministicPrng(seed);
    const checkpoints: SimulationCheckpoint[] = [];

    for (let i = 0; i < frames.length; i += 1) {
      prng.next();
      const isBoundary = i === 0 || i === frames.length - 1 || i % safeInterval === 0;
      if (!isBoundary) continue;

      if (checkpoints.length >= maxCheckpoints) {
        break;
      }

      const frame = frames[i]!;
      const clonedState = RuntimeStateHelper.cloneState(
        frame.runtimeState || RuntimeStateHelper.createInitialState()
      );
      checkpoints.push({
        stepIndex: i,
        virtualTimeMs: frame.virtualTimeMs,
        prngState: prng.getState(),
        stateHash: computeStateHash(i, frame.virtualTimeMs, clonedState, frame.activeNodeIds || []),
        runtimeState: clonedState,
        activeNodeIds: [...(frame.activeNodeIds || [])],
        activeEdgeIds: [...(frame.activeEdgeIds || [])],
      });
    }

    return checkpoints;
  }

  /**
   * Restores the closest prior checkpoint and deterministically replays forward to `targetStepIndex`.
   */
  public static seekWithCheckpointReplay(
    frames: VisualizationFrame[],
    checkpoints: SimulationCheckpoint[],
    targetStepIndex: number
  ): {
    frame: VisualizationFrame | null;
    restoredFromCheckpointStep: number;
    replayedSteps: number;
    stateHash: string;
    prngStateAtTarget: number;
  } {
    if (!Array.isArray(frames) || frames.length === 0) {
      return {
        frame: null,
        restoredFromCheckpointStep: 0,
        replayedSteps: 0,
        stateHash: "chk_empty",
        prngStateAtTarget: 0,
      };
    }

    const clamped = Math.max(0, Math.min(frames.length - 1, Math.floor(targetStepIndex)));

    let nearest: SimulationCheckpoint | null = null;
    for (const cp of checkpoints) {
      if (cp.stepIndex <= clamped && (!nearest || cp.stepIndex > nearest.stepIndex)) {
        nearest = cp;
      }
    }

    const startStep = nearest ? nearest.stepIndex : 0;
    const prng = new DeterministicPrng(42);
    if (nearest) {
      prng.setState(nearest.prngState);
    }

    let currentState = nearest
      ? RuntimeStateHelper.cloneState(nearest.runtimeState)
      : RuntimeStateHelper.createInitialState();

    let replayedSteps = 0;
    for (let idx = startStep + 1; idx <= clamped; idx += 1) {
      prng.next();
      const frame = frames[idx]!;
      currentState = RuntimeStateHelper.cloneState(frame.runtimeState || currentState);
      replayedSteps += 1;
    }

    const targetFrame = frames[clamped]!;
    const finalHash = computeStateHash(
      clamped,
      targetFrame.virtualTimeMs,
      currentState,
      targetFrame.activeNodeIds || []
    );

    return {
      frame: {
        ...targetFrame,
        runtimeState: currentState,
      },
      restoredFromCheckpointStep: startStep,
      replayedSteps,
      stateHash: finalHash,
      prngStateAtTarget: prng.getState(),
    };
  }
}

