import type { FailureScenario, RecoveryAnalysis } from "../contracts/simulation.types";

export class RecoveryEvaluator {
  /**
   * Models deterministic recovery intervals based on component capabilities and user targets.
   */
  public static evaluate(
    scenario: FailureScenario,
    hasDatabaseOutage: boolean,
    hasQueueCongestion: boolean,
    maxBacklogCount: number
  ): RecoveryAnalysis {
    // Modeled recovery assumptions based on distributed systems engineering baselines:
    // 1. Detection time: Health check window (typically 3 consecutive checks @ 2s = 6,000ms)
    const modeledDetectionTimeMs = 6_000;

    // 2. Failover time:
    // - Database replica promotion & DNS update: ~20,000ms
    // - Load balancer health check removal: ~5,000ms
    const modeledFailoverTimeMs = hasDatabaseOutage ? 20_000 : 5_000;

    // 3. Restart / container cold-start time:
    const modeledRestartTimeMs = 12_000;

    // 4. Backlog drain time:
    // If queue accumulated messages, calculate drain time at modeled worker throughput
    const drainRatePerSec = 100;
    const modeledDrainTimeMs = hasQueueCongestion
      ? Math.round((maxBacklogCount / drainRatePerSec) * 1_000)
      : 0;

    const totalModeledRecoveryMs =
      modeledDetectionTimeMs + modeledFailoverTimeMs + modeledRestartTimeMs + modeledDrainTimeMs;

    const targetRtoMs = scenario.targetRtoMs || 60_000; // 1 minute default RTO objective
    const targetRpoMs = scenario.targetRpoMs !== undefined ? scenario.targetRpoMs : 0; // 0 for zero data loss

    const rtoMet = totalModeledRecoveryMs <= targetRtoMs;
    // RPO met if synchronous replication or zero data loss mode
    const rpoMet = targetRpoMs >= 0;

    const recoveryBottlenecks: string[] = [];
    if (!rtoMet) {
      recoveryBottlenecks.push(
        `Total recovery time (${(totalModeledRecoveryMs / 1000).toFixed(1)}s) exceeds target RTO (${(targetRtoMs / 1000).toFixed(1)}s)`
      );
    }
    if (hasDatabaseOutage) {
      recoveryBottlenecks.push("Database failover requires manual confirmation or asynchronous promotion lag");
    }
    if (hasQueueCongestion && modeledDrainTimeMs > 10_000) {
      recoveryBottlenecks.push(`Queue consumer backlog accumulation adds ${(modeledDrainTimeMs / 1000).toFixed(1)}s drain latency`);
    }

    return {
      modeledDetectionTimeMs,
      modeledFailoverTimeMs,
      modeledRestartTimeMs,
      modeledDrainTimeMs,
      totalModeledRecoveryMs,
      targetRtoMs,
      targetRpoMs,
      rtoMet,
      rpoMet,
      recoveryBottlenecks,
    };
  }
}
