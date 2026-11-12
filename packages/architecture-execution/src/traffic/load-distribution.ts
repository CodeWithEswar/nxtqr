import type {
  ServiceInstance,
  LoadBalancingStrategy,
} from "./traffic-schemas";

export class LoadDistributionEngine {
  private static roundRobinCounters = new Map<string, number>();

  /**
   * Selects a target service instance based on the specified load-balancing strategy.
   */
  public static selectInstance(
    nodeId: string,
    instances: ServiceInstance[],
    strategy: LoadBalancingStrategy,
    weights?: Record<string, number>
  ): ServiceInstance | undefined {
    const healthyInstances = instances.filter((i) => i.status === "healthy");
    if (healthyInstances.length === 0) {
      return undefined;
    }

    switch (strategy) {
      case "round_robin": {
        const counter = this.roundRobinCounters.get(nodeId) || 0;
        const selected = healthyInstances[counter % healthyInstances.length];
        this.roundRobinCounters.set(nodeId, counter + 1);
        return selected;
      }

      case "least_active": {
        // Find instance with minimum active requests; tie-break on lower instance index
        let best = healthyInstances[0];
        for (let i = 1; i < healthyInstances.length; i++) {
          const candidate = healthyInstances[i];
          if (
            candidate.activeRequests < best.activeRequests ||
            (candidate.activeRequests === best.activeRequests && candidate.instanceIndex < best.instanceIndex)
          ) {
            best = candidate;
          }
        }
        return best;
      }

      case "weighted": {
        if (!weights || Object.keys(weights).length === 0) {
          // Fallback to round robin if weights not configured
          return this.selectInstance(nodeId, healthyInstances, "round_robin");
        }
        const totalWeight = healthyInstances.reduce((sum, inst) => sum + (weights[inst.id] || 1), 0);
        const counter = this.roundRobinCounters.get(nodeId) || 0;
        let point = counter % totalWeight;
        this.roundRobinCounters.set(nodeId, counter + 1);

        for (const inst of healthyInstances) {
          const w = weights[inst.id] || 1;
          if (point < w) return inst;
          point -= w;
        }
        return healthyInstances[0];
      }
    }
  }

  public static reset(): void {
    this.roundRobinCounters.clear();
  }
}
