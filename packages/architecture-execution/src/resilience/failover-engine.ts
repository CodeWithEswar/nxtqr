import type { FailoverPolicy } from "./fault-schemas";
import type { ModeledRuntimeState } from "../domain/runtime-state";

export interface FailoverEvaluation {
  selected: boolean;
  selectedTargetId?: string;
  reason: string;
  evaluatedTargets: {
    targetId: string;
    healthy: boolean;
    status: string;
  }[];
}

export class FailoverEngine {
  /**
   * Evaluates failover targets when a primary component is unavailable or degraded.
   */
  public static evaluateFailover(
    runtimeState: ModeledRuntimeState,
    policy: FailoverPolicy
  ): FailoverEvaluation {
    const evaluated: FailoverEvaluation["evaluatedTargets"] = [];

    // Evaluate each configured secondary target in priority order
    for (const secondaryId of policy.secondaryTargetIds) {
      const health = runtimeState.componentHealth[secondaryId] || "healthy";
      const cb = runtimeState.circuitBreakers[secondaryId];
      const isCbOpen = cb?.state === "open";

      const isHealthy = health !== "unavailable" && !isCbOpen;
      const statusDesc = isCbOpen
        ? "circuit_open"
        : health === "unavailable"
        ? "target_unavailable"
        : health === "degraded"
        ? "degraded_standby"
        : "healthy_standby";

      evaluated.push({
        targetId: secondaryId,
        healthy: isHealthy,
        status: statusDesc,
      });

      if (isHealthy) {
        return {
          selected: true,
          selectedTargetId: secondaryId,
          reason: `Primary ${policy.primaryTargetId} failed. Successfully failed over to standby target ${secondaryId} (${statusDesc}).`,
          evaluatedTargets: evaluated,
        };
      }
    }

    return {
      selected: false,
      reason: `Failover exhausted: no healthy standby candidates found for primary ${policy.primaryTargetId}. Evaluated: [${evaluated.map((e) => `${e.targetId}: ${e.status}`).join(", ")}].`,
      evaluatedTargets: evaluated,
    };
  }
}
