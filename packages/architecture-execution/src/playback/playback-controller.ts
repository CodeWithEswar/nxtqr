import type { PlaybackSpeed, PlaybackStatus } from "../schemas/execution.schemas";
import type { ExecutionTrace, VisualizationFrame } from "../domain/execution-trace";
import { PlaybackStateMachine } from "./playback-machine";

export interface PlaybackState {
  status: PlaybackStatus;
  currentStepIndex: number;
  totalSteps: number;
  speed: PlaybackSpeed;
  currentFrame: VisualizationFrame | null;
  progress: number; // 0.0 to 1.0
  isLooping: boolean;
  errorMessage?: string;
}

export type PlaybackListener = (state: PlaybackState) => void;

export class PlaybackController {
  private machine = new PlaybackStateMachine("idle");
  private trace: ExecutionTrace | null = null;
  private currentStepIndex = 0;
  private speed: PlaybackSpeed = 1;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<PlaybackListener>();
  private isLooping = false;
  private errorMessage?: string;

  constructor(speed: PlaybackSpeed = 1) {
    this.speed = speed;
  }

  public loadTrace(trace: ExecutionTrace): void {
    this.stop();
    this.trace = trace;
    this.currentStepIndex = 0;
    this.errorMessage = undefined;
    this.machine = new PlaybackStateMachine("ready");
    this.notify();
  }

  public getState(): PlaybackState {
    const totalSteps = this.trace?.frames.length || 0;
    const currentFrame =
      this.trace && totalSteps > 0 && this.currentStepIndex < totalSteps
        ? this.trace.frames[this.currentStepIndex]
        : null;

    const progress = totalSteps > 1 ? this.currentStepIndex / (totalSteps - 1) : totalSteps === 1 ? 1 : 0;

    return {
      status: this.machine.getStatus(),
      currentStepIndex: this.currentStepIndex,
      totalSteps,
      speed: this.speed,
      currentFrame,
      progress,
      isLooping: this.isLooping,
      errorMessage: this.errorMessage,
    };
  }

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    for (const l of this.listeners) {
      try {
        l(state);
      } catch (err) {
        console.error("PlaybackListener error:", err);
      }
    }
  }

  public play(): void {
    if (!this.trace || this.trace.frames.length === 0) return;

    if (this.currentStepIndex >= this.trace.frames.length - 1) {
      this.currentStepIndex = 0;
    }

    if (this.machine.canTransition("PLAY")) {
      this.machine.transition("PLAY");
      this.scheduleNextTick();
      this.notify();
    }
  }

  public pause(): void {
    this.clearTimer();
    if (this.machine.canTransition("PAUSE")) {
      this.machine.transition("PAUSE");
      this.notify();
    }
  }

  public resume(): void {
    if (this.machine.canTransition("RESUME")) {
      this.machine.transition("RESUME");
      this.scheduleNextTick();
      this.notify();
    }
  }

  public stop(): void {
    this.clearTimer();
    this.currentStepIndex = 0;
    if (this.machine.canTransition("STOP")) {
      this.machine.transition("STOP");
    }
    this.notify();
  }

  public restart(): void {
    this.clearTimer();
    this.currentStepIndex = 0;
    if (this.machine.canTransition("RESTART")) {
      this.machine.transition("RESTART");
    }
    this.notify();
  }

  public nextStep(): void {
    if (!this.trace) return;
    this.clearTimer();

    if (this.currentStepIndex < this.trace.frames.length - 1) {
      this.currentStepIndex++;
      if (this.machine.canTransition("STEP")) {
        this.machine.transition("STEP");
      }
      this.notify();
    } else if (this.machine.canTransition("COMPLETE")) {
      this.machine.transition("COMPLETE");
      this.notify();
    }
  }

  public previousStep(): void {
    if (!this.trace) return;
    this.clearTimer();

    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      if (this.machine.canTransition("STEP")) {
        this.machine.transition("STEP");
      }
      this.notify();
    }
  }

  public seekToStep(stepIndex: number): void {
    if (!this.trace) return;
    this.clearTimer();

    const clamped = Math.max(0, Math.min(stepIndex, this.trace.frames.length - 1));
    this.currentStepIndex = clamped;

    if (this.currentStepIndex === this.trace.frames.length - 1) {
      if (this.machine.canTransition("COMPLETE")) {
        this.machine.transition("COMPLETE");
      }
    } else if (this.machine.canTransition("STEP")) {
      this.machine.transition("STEP");
    }

    this.notify();
  }

  public setSpeed(speed: PlaybackSpeed): void {
    this.speed = speed;
    if (this.machine.getStatus() === "playing") {
      this.clearTimer();
      this.scheduleNextTick();
    }
    this.notify();
  }

  public setLooping(isLooping: boolean): void {
    this.isLooping = isLooping;
    this.notify();
  }

  private scheduleNextTick(): void {
    this.clearTimer();
    if (!this.trace || this.machine.getStatus() !== "playing") return;

    const currentFrame = this.trace.frames[this.currentStepIndex];
    const duration = currentFrame?.activeEvent?.durationMs || 300;
    const scaledDurationMs = Math.max(50, Math.round(duration / this.speed));

    this.timer = setTimeout(() => {
      this.advancePlayTick();
    }, scaledDurationMs);
  }

  private advancePlayTick(): void {
    if (!this.trace || this.machine.getStatus() !== "playing") return;

    if (this.currentStepIndex < this.trace.frames.length - 1) {
      this.currentStepIndex++;
      this.notify();
      this.scheduleNextTick();
    } else {
      if (this.isLooping) {
        this.currentStepIndex = 0;
        this.notify();
        this.scheduleNextTick();
      } else {
        if (this.machine.canTransition("COMPLETE")) {
          this.machine.transition("COMPLETE");
        }
        this.notify();
      }
    }
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public destroy(): void {
    this.clearTimer();
    this.listeners.clear();
    this.trace = null;
  }
}

