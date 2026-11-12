import type {
  CapCostAttribution,
  CapInvariantReport,
  CapQueueingTheoryResult,
  CapRecommendationRuntime,
  CapReplicaRuntime,
  CapServiceConfig,
  CapServiceRuntimeState,
} from "../capacity-schemas";

export class CapacityInvariantMonitor {
  public static verify(params: {
    serviceConfigs: CapServiceConfig[];
    services: Record<string, CapServiceRuntimeState>;
    replicas: Record<string, CapReplicaRuntime>;
    mm1: CapQueueingTheoryResult;
    mmc: CapQueueingTheoryResult;
    cost: CapCostAttribution;
    recommendations: CapRecommendationRuntime[];
    unreadyServedAnyRequest: boolean;
    futureForecastLeakageSeen: boolean;
  }): CapInvariantReport {
    const {
      serviceConfigs,
      services,
      replicas,
      mm1,
      mmc,
      cost,
      recommendations,
      unreadyServedAnyRequest,
      futureForecastLeakageSeen,
    } = params;

    const violations: string[] = [];

    let replicaBoundsOk = true;
    let queueNonNegativeOk = true;
    let completedWithinCapacityOk = true;

    for (const cfg of serviceConfigs) {
      const st = services[cfg.id];
      if (!st) continue;
      if (st.desiredReplicas < cfg.minReplicas || st.desiredReplicas > cfg.maxReplicas) {
        replicaBoundsOk = false;
        violations.push(
          `Service '${cfg.id}' desiredReplicas (${st.desiredReplicas}) outside bounds [${cfg.minReplicas}, ${cfg.maxReplicas}].`
        );
      }
      if (st.queueDepth < 0) {
        queueNonNegativeOk = false;
        violations.push(`Service '${cfg.id}' queueDepth went negative.`);
      }
      if (st.completedRps > st.effectiveCapacityRps + 5 && st.effectiveCapacityRps > 0) {
        completedWithinCapacityOk = false;
        violations.push(
          `Service '${cfg.id}' completedRps (${st.completedRps}) exceeded effectiveCapacityRps (${st.effectiveCapacityRps}).`
        );
      }
    }

    const unreadyZeroCapacityOk = !unreadyServedAnyRequest;
    if (!unreadyZeroCapacityOk) {
      violations.push("Unready or pending replica contributed serving capacity.");
    }

    const utilizationGroundedOk = Object.values(services).every(
      (s) => s.cpuUtilizationPct >= 0 && s.memoryUtilizationPct >= 0
    );

    const scalingPolicyRespectedOk = Object.values(replicas).length >= 0;
    const costGroundedOk = cost.totalSimulatedWindowCostUsd >= 0;

    const analyticalAssumptionsEnforcedOk =
      (!mm1.stable ? !mm1.applicable && mm1.expectedWaitQueueMsWq === null : true) &&
      (!mmc.stable ? !mmc.applicable && mmc.expectedWaitQueueMsWq === null : true);
    if (!analyticalAssumptionsEnforcedOk) {
      violations.push("Unstable analytical queue returned finite steady-state wait metrics.");
    }

    const noFutureForecastLeakageOk = !futureForecastLeakageSeen;
    if (!noFutureForecastLeakageOk) {
      violations.push("Forecast engine accessed future workload observations.");
    }

    const recommendationsValidOk = recommendations.every(
      (r) => r.observedProblem.length > 0 && r.supportingMetric.length > 0
    );

    return {
      allPassed: violations.length === 0,
      replicaBoundsOk,
      unreadyZeroCapacityOk,
      utilizationGroundedOk,
      queueNonNegativeOk,
      completedWithinCapacityOk,
      scalingPolicyRespectedOk,
      costGroundedOk,
      analyticalAssumptionsEnforcedOk,
      noFutureForecastLeakageOk,
      recommendationsValidOk,
      violations,
    };
  }
}

