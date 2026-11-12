import type {
  AutoscalingPolicy,
  AutoscalingState,
  ServiceInstance,
  ServiceCapacityConfig,
} from "./traffic-schemas";
import { WorkerPool } from "./worker-pool";

export interface AutoscalingEvaluationResult {
  action: "none" | "scale_out" | "scale_in";
  fromInstances: number;
  toInstances: number;
  readyAtMs?: number;
  newInstance?: ServiceInstance;
  removedInstanceId?: string;
  reason: string;
}

export class AutoscalingEngine {
  public static initializeState(nodeId: string, initialInstances: number): AutoscalingState {
    return {
      serviceNodeId: nodeId,
      currentInstances: initialInstances,
      targetInstances: initialInstances,
      pendingProvisionings: [],
      lastScaleActionAtMs: -10000,
    };
  }

  /**
   * Evaluates worker pool utilization and determines whether to scale out or in.
   */
  public static evaluateScaling(
    policy: AutoscalingPolicy,
    capacityConfig: ServiceCapacityConfig,
    state: AutoscalingState,
    instances: ServiceInstance[],
    atMs: number
  ): AutoscalingEvaluationResult {
    if (!policy.enabled) {
      return { action: "none", fromInstances: instances.length, toInstances: instances.length, reason: "Autoscaling disabled." };
    }

    // Clean up finished pending provisionings
    state.pendingProvisionings = state.pendingProvisionings.filter((p) => p.readyAtMs > atMs);

    const activeCount = instances.filter((i) => i.status === "healthy").length;
    const pendingCount = state.pendingProvisionings.length;
    const effectiveCount = activeCount + pendingCount;

    // Check cooldown
    if (atMs - state.lastScaleActionAtMs < policy.cooldownMs) {
      return { action: "none", fromInstances: activeCount, toInstances: activeCount, reason: "Cooldown active." };
    }

    const currentUtilization = WorkerPool.calculateUtilization(instances);

    // Scale-out evaluation
    if (currentUtilization >= policy.scaleOutThresholdPercent && effectiveCount < policy.maxInstances) {
      const newIndex = instances.length;
      const newInstanceId = `inst_${policy.serviceNodeId}_${newIndex + 1}`;

      const newInstance: ServiceInstance = {
        id: newInstanceId,
        serviceNodeId: policy.serviceNodeId,
        instanceIndex: newIndex,
        workerCount: capacityConfig.workersPerInstance,
        busyWorkers: 0,
        activeRequests: 0,
        status: policy.provisioningDelayMs === 0 ? "healthy" : "degraded",
        createdAtMs: atMs,
      };

      const readyAtMs = atMs + policy.provisioningDelayMs;
      if (policy.provisioningDelayMs > 0) {
        state.pendingProvisionings.push({
          instanceId: newInstanceId,
          readyAtMs,
        });
      }

      state.lastScaleActionAtMs = atMs;
      state.targetInstances = effectiveCount + 1;

      return {
        action: "scale_out",
        fromInstances: activeCount,
        toInstances: activeCount + 1,
        readyAtMs,
        newInstance,
        reason: `Utilization (${currentUtilization}%) exceeded scale-out threshold (${policy.scaleOutThresholdPercent}%). Adding instance ${newInstanceId}.`,
      };
    }

    // Scale-in evaluation
    if (currentUtilization <= policy.scaleInThresholdPercent && activeCount > policy.minInstances && pendingCount === 0) {
      // Pick the instance with 0 active requests if possible
      const idleInstance = instances.find((i) => i.status === "healthy" && i.activeRequests === 0) || instances[instances.length - 1];

      state.lastScaleActionAtMs = atMs;
      state.targetInstances = activeCount - 1;

      return {
        action: "scale_in",
        fromInstances: activeCount,
        toInstances: activeCount - 1,
        removedInstanceId: idleInstance.id,
        reason: `Utilization (${currentUtilization}%) fell below scale-in threshold (${policy.scaleInThresholdPercent}%). Removing idle instance ${idleInstance.id}.`,
      };
    }

    return {
      action: "none",
      fromInstances: activeCount,
      toInstances: activeCount,
      reason: `Utilization (${currentUtilization}%) is within bounds [${policy.scaleInThresholdPercent}%, ${policy.scaleOutThresholdPercent}%].`,
    };
  }
}
