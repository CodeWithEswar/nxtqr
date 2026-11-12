import type {
  ServiceCapacityConfig,
  ServiceInstance,
} from "./traffic-schemas";
import { DeterministicRandom } from "../resilience/deterministic-random";

export class WorkerPool {
  /**
   * Initializes service instances according to ServiceCapacityConfig.
   */
  public static initializeInstances(
    config: ServiceCapacityConfig,
    atMs = 0
  ): ServiceInstance[] {
    const instances: ServiceInstance[] = [];
    const count = Math.max(1, config.initialInstances);

    for (let i = 0; i < count; i++) {
      instances.push({
        id: `inst_${config.serviceNodeId}_${i + 1}`,
        serviceNodeId: config.serviceNodeId,
        instanceIndex: i,
        workerCount: config.workersPerInstance,
        busyWorkers: 0,
        activeRequests: 0,
        status: "healthy",
        createdAtMs: atMs,
      });
    }

    return instances;
  }

  /**
   * Evaluates if any worker slot is available across the instances.
   */
  public static hasAvailableWorker(instances: ServiceInstance[]): boolean {
    return instances.some(
      (inst) => inst.status === "healthy" && inst.busyWorkers < inst.workerCount
    );
  }

  /**
   * Finds the first available instance with an idle worker slot.
   */
  public static findAvailableInstance(
    instances: ServiceInstance[]
  ): ServiceInstance | undefined {
    return instances.find(
      (inst) => inst.status === "healthy" && inst.busyWorkers < inst.workerCount
    );
  }

  /**
   * Allocates a worker slot on the selected instance.
   */
  public static acquireWorker(instance: ServiceInstance): boolean {
    if (instance.busyWorkers >= instance.workerCount) {
      return false;
    }
    instance.busyWorkers++;
    instance.activeRequests++;
    return true;
  }

  /**
   * Releases a worker slot on the instance.
   */
  public static releaseWorker(instance: ServiceInstance): void {
    instance.busyWorkers = Math.max(0, instance.busyWorkers - 1);
    instance.activeRequests = Math.max(0, instance.activeRequests - 1);
  }

  /**
   * Calculates overall utilization percent across a collection of instances.
   */
  public static calculateUtilization(instances: ServiceInstance[]): number {
    const totalWorkers = instances.reduce((sum, inst) => sum + inst.workerCount, 0);
    if (totalWorkers === 0) return 0;

    const totalBusy = instances.reduce((sum, inst) => sum + inst.busyWorkers, 0);
    return Math.round((totalBusy / totalWorkers) * 100);
  }

  /**
   * Calculates processing duration for a request based on configured distribution.
   */
  public static computeProcessingDuration(
    config: ServiceCapacityConfig,
    rng: DeterministicRandom
  ): number {
    const base = config.baseProcessingTimeMs;

    switch (config.processingDistribution) {
      case "constant":
        return Math.max(1, Math.round(base));

      case "uniform": {
        // Uniform in [0.7 * base, 1.3 * base]
        const factor = 0.7 + rng.next() * 0.6;
        return Math.max(1, Math.round(base * factor));
      }

      case "exponential": {
        // Inverted transform sampling for exponential distribution: -ln(U) * mean
        const u = Math.max(0.001, rng.next());
        const duration = -Math.log(u) * base;
        // Clamp to prevent unbounded tail extremes in discrete simulations
        return Math.max(1, Math.min(Math.round(base * 5), Math.round(duration)));
      }
    }
  }
}
