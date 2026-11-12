import type { KubernetesHpaPolicy, HpaRuntimeState, Pod } from "../kubernetes-schemas";

export class HpaAutoscalingEngine {
  /**
   * Computes HPA desired replicas relative to requested CPU across running/ready pods.
   * Formula: ceil(currentReadyReplicas * (observedCpuPct / targetCpuUtilizationPct))
   */
  public static evaluate(
    deploymentId: string,
    policy: KubernetesHpaPolicy,
    currentDesiredReplicas: number,
    readyPods: Pod[],
    totalDemandMillicores: number,
    prevHpaState: HpaRuntimeState | undefined,
    atMs: number
  ): {
    nextState: HpaRuntimeState;
    recommendedReplicas: number;
    clampedReplicas: number;
    scaleChanged: boolean;
  } {
    const activeCount = Math.max(1, readyPods.length);
    const totalRequestedCpu = Math.max(
      1,
      readyPods.reduce((acc, p) => acc + p.requests.cpuMillicores, 0) ||
        currentDesiredReplicas * 250
    );

    const observedCpuUtilizationPct = Math.round((totalDemandMillicores / totalRequestedCpu) * 100);
    const ratio = observedCpuUtilizationPct / Math.max(1, policy.targetCpuUtilizationPct);

    // Deadband tolerance +-10% to prevent unnecessary flapping when near target
    let rawRecommended = currentDesiredReplicas;
    if (Math.abs(1 - ratio) > 0.1) {
      rawRecommended = Math.ceil(activeCount * ratio);
    }

    const clampedReplicas = Math.max(
      policy.minReplicas,
      Math.min(policy.maxReplicas, rawRecommended)
    );

    // Check scale-down stabilization window
    const isScaleDown = clampedReplicas < currentDesiredReplicas;
    const withinStabilization =
      isScaleDown &&
      prevHpaState?.lastScaleAtMs !== undefined &&
      atMs - prevHpaState.lastScaleAtMs < policy.stabilizationWindowMs;

    const finalDesired = withinStabilization ? currentDesiredReplicas : clampedReplicas;
    const scaleChanged = finalDesired !== currentDesiredReplicas;

    let reason = `Observed ${observedCpuUtilizationPct}% CPU vs target ${policy.targetCpuUtilizationPct}% (demand ${Math.round(totalDemandMillicores)}m / requested ${totalRequestedCpu}m).`;
    if (withinStabilization) {
      reason += ` Scale-down to ${clampedReplicas} held by ${policy.stabilizationWindowMs}ms stabilization window.`;
    } else if (scaleChanged) {
      reason += ` Scaling ${currentDesiredReplicas} -> ${finalDesired} replicas.`;
    } else {
      reason += ` Remaining at ${currentDesiredReplicas} replicas.`;
    }

    return {
      nextState: {
        deploymentId,
        enabled: policy.enabled,
        currentReplicas: readyPods.length,
        desiredReplicas: finalDesired,
        recommendedReplicas: rawRecommended,
        observedCpuUtilizationPct,
        targetCpuUtilizationPct: policy.targetCpuUtilizationPct,
        minReplicas: policy.minReplicas,
        maxReplicas: policy.maxReplicas,
        lastScaleAtMs: scaleChanged ? atMs : prevHpaState?.lastScaleAtMs,
        stabilizationActive: withinStabilization,
        lastDecisionReason: reason,
      },
      recommendedReplicas: rawRecommended,
      clampedReplicas,
      scaleChanged,
    };
  }
}
