import type { PlaybackStatus } from "../schemas/execution.schemas";

export type PlaybackAction =
  | "PREPARE"
  | "READY"
  | "PLAY"
  | "PAUSE"
  | "RESUME"
  | "STEP"
  | "COMPLETE"
  | "STOP"
  | "RESTART"
  | "ERROR";

export class PlaybackStateMachine {
  private currentStatus: PlaybackStatus = "idle";

  constructor(initialStatus: PlaybackStatus = "idle") {
    this.currentStatus = initialStatus;
  }

  public getStatus(): PlaybackStatus {
    return this.currentStatus;
  }

  public canTransition(action: PlaybackAction): boolean {
    switch (action) {
      case "PREPARE":
        return this.currentStatus === "idle" || this.currentStatus === "stopped" || this.currentStatus === "completed" || this.currentStatus === "error";
      case "READY":
        return this.currentStatus === "preparing";
      case "PLAY":
        return this.currentStatus === "ready" || this.currentStatus === "paused" || this.currentStatus === "completed" || this.currentStatus === "stopped";
      case "PAUSE":
        return this.currentStatus === "playing";
      case "RESUME":
        return this.currentStatus === "paused";
      case "STEP":
        return this.currentStatus === "ready" || this.currentStatus === "paused" || this.currentStatus === "completed";
      case "COMPLETE":
        return this.currentStatus === "playing" || this.currentStatus === "paused";
      case "STOP":
        return this.currentStatus !== "idle";
      case "RESTART":
        return this.currentStatus !== "idle" && this.currentStatus !== "preparing";
      case "ERROR":
        return true;
      default:
        return false;
    }
  }

  public transition(action: PlaybackAction): PlaybackStatus {
    if (!this.canTransition(action)) {
      throw new Error(`Invalid playback transition: cannot execute action "${action}" from state "${this.currentStatus}".`);
    }

    switch (action) {
      case "PREPARE":
        this.currentStatus = "preparing";
        break;
      case "READY":
        this.currentStatus = "ready";
        break;
      case "PLAY":
      case "RESUME":
        this.currentStatus = "playing";
        break;
      case "PAUSE":
        this.currentStatus = "paused";
        break;
      case "STEP":
        this.currentStatus = "paused";
        break;
      case "COMPLETE":
        this.currentStatus = "completed";
        break;
      case "STOP":
        this.currentStatus = "stopped";
        break;
      case "RESTART":
        this.currentStatus = "ready";
        break;
      case "ERROR":
        this.currentStatus = "error";
        break;
    }

    return this.currentStatus;
  }
}

