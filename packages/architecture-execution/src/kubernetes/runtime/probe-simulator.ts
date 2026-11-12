import type { ProbeConfig } from "../kubernetes-schemas";

export class ProbeSimulator {
  public static evaluateAttempt(config: ProbeConfig, attemptNumber: number): boolean {
    switch (config.modeledBehavior) {
      case "always_pass":
        return true;
      case "always_fail":
        return false;
      case "fail_first_n":
        return attemptNumber > config.failCountTarget;
      case "fail_after_n":
        return attemptNumber <= config.failCountTarget;
      case "intermittent":
        return attemptNumber % 2 === 1;
      default:
        return true;
    }
  }

  public static computeCrashLoopBackOffMs(restartCount: number): number {
    // Scaled virtual backoff in discrete milliseconds (150ms, 300ms, 600ms, 1200ms, capped at 2000ms)
    return Math.min(2000, 150 * Math.pow(2, Math.max(0, restartCount - 1)));
  }
}
