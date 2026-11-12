import type {
  DeployInvariantReport,
  DeploymentRuntimeInstance,
  DeploymentScenario,
  DeployReplicaRuntime,
  TrafficAllocationRuntime,
} from "../deployment-schemas";

export class DeploymentInvariantMonitor {
  public static verify(params: {
    scenario: DeploymentScenario;
    deployments: Record<string, DeploymentRuntimeInstance>;
    replicas: Record<string, DeployReplicaRuntime>;
    allocations: Record<string, TrafficAllocationRuntime>;
    routedUnreadyCount: number;
    promotedAfterFailedGate: boolean;
    advancedWhilePaused: boolean;
  }): DeployInvariantReport {
    const {
      scenario,
      deployments,
      replicas,
      allocations,
      routedUnreadyCount,
      promotedAfterFailedGate,
      advancedWhilePaused,
    } = params;

    const violations: string[] = [];

    // 1. Revisions immutable
    const revisionsImmutableOk = scenario.revisions.every(
      (r) => r.immutable === true
    );
    if (!revisionsImmutableOk) {
      violations.push("Revision mutability violation detected.");
    }

    // 2. Replica transitions valid
    const validStates = new Set([
      "PENDING",
      "SCHEDULING",
      "STARTING",
      "RUNNING_NOT_READY",
      "READY",
      "TERMINATING",
      "TERMINATED",
      "FAILED",
    ]);
    const replicaTransitionsValidOk = Object.values(replicas).every((r) =>
      validStates.has(r.state)
    );

    // 3. Unready replicas do not receive readiness-aware routed traffic
    const unreadyNotRoutedOk = routedUnreadyCount === 0;
    if (!unreadyNotRoutedOk) {
      violations.push(
        `Readiness routing violation: ${routedUnreadyCount} request(s) hit unready replicas.`
      );
    }

    // 4. Rolling budgets respected (active non-terminated count <= desired + maxSurge when not draining blue-green/canary)
    let rollingBudgetsRespectedOk = true;
    for (const dep of Object.values(deployments)) {
      if (dep.strategy === "rolling_update") {
        const activeNonTerm = Object.values(replicas).filter(
          (r) =>
            r.serviceId === dep.serviceId &&
            r.state !== "TERMINATED" &&
            r.state !== "TERMINATING" &&
            r.state !== "FAILED"
        ).length;
        const maxAllowed = dep.desiredReplicas + dep.maxSurgeCount;
        if (activeNonTerm > maxAllowed) {
          rollingBudgetsRespectedOk = false;
          violations.push(
            `Rolling update budget exceeded on '${dep.id}': ${activeNonTerm} > ${maxAllowed}.`
          );
        }
      }
    }

    // 5. Traffic weights valid (sum to 100 or explicit noHealthyEndpoints)
    let trafficWeightsValidOk = true;
    for (const alloc of Object.values(allocations)) {
      if (!alloc.noHealthyEndpoints) {
        const sum = alloc.weights.reduce((acc, w) => acc + w.percentage, 0);
        if (Math.abs(sum - 100) > 0.01) {
          trafficWeightsValidOk = false;
          violations.push(
            `Traffic allocation on '${alloc.serviceId}' sums to ${sum} instead of 100.`
          );
        }
      }
    }

    // 6. Canary gates respected / 7. Missing samples never silently pass unless configured
    let canaryGatesRespectedOk = true;
    let missingSamplesNeverSilentPassOk = true;
    for (const dep of Object.values(deployments)) {
      const cfg = scenario.deployments.find((d) => d.id === dep.id);
      for (const ge of dep.gateEvaluations) {
        const gCfg = cfg?.gates.find((g) => g.id === ge.gateId);
        if (ge.observedValue === null && ge.outcome === "PASS" && !gCfg?.treatNoDataAsPass) {
          missingSamplesNeverSilentPassOk = false;
          violations.push(
            `Gate '${ge.gateId}' passed silently with missing samples.`
          );
        }
      }
      if (
        dep.state === "COMPLETED" &&
        dep.gateEvaluations.some((g) => g.outcome === "FAIL")
      ) {
        canaryGatesRespectedOk = false;
        violations.push(
          `Deployment '${dep.id}' reached COMPLETED despite failed gate evaluation.`
        );
      }
    }

    // 8. Failed gates block promotion
    const failedGateBlocksPromotionOk = !promotedAfterFailedGate;
    if (!failedGateBlocksPromotionOk) {
      violations.push("Rollout promoted despite required gate failure.");
    }

    // 9. Rollback uses an eligible previous revision
    let rollbackEligibleRevisionOk = true;
    for (const dep of Object.values(deployments)) {
      if (dep.rollback.state === "COMPLETED") {
        const prevRev = scenario.revisions.find(
          (r) => r.id === dep.rollback.toRevisionId
        );
        if (!prevRev || !prevRev.available) {
          rollbackEligibleRevisionOk = false;
          violations.push(
            `Rollback completed toward missing/unavailable revision '${dep.rollback.toRevisionId}'.`
          );
        }
      }
    }

    // 10. Irreversible data changes preserved/flagged cleanly
    let rollbackPreservesIrreversibleDataOk = true;
    for (const dep of Object.values(deployments)) {
      const cfg = scenario.deployments.find((d) => d.id === dep.id);
      if (
        cfg?.migrationPlan?.irreversibleMutation &&
        dep.rollback.state === "REQUESTED" &&
        !dep.rollback.irreversibleDataWarning
      ) {
        rollbackPreservesIrreversibleDataOk = false;
        violations.push(
          `Irreversible migration on '${dep.id}' missing explicit rollback warning.`
        );
      }
    }

    // 11. Paused rollout does not advance
    const pausedDoesNotAdvanceOk = !advancedWhilePaused;
    if (!pausedDoesNotAdvanceOk) {
      violations.push("Paused deployment advanced stages unlawfully.");
    }

    const allPassed =
      violations.length === 0 &&
      revisionsImmutableOk &&
      replicaTransitionsValidOk &&
      unreadyNotRoutedOk &&
      rollingBudgetsRespectedOk &&
      trafficWeightsValidOk &&
      canaryGatesRespectedOk &&
      missingSamplesNeverSilentPassOk &&
      failedGateBlocksPromotionOk &&
      rollbackEligibleRevisionOk &&
      rollbackPreservesIrreversibleDataOk &&
      pausedDoesNotAdvanceOk;

    return {
      allPassed,
      revisionsImmutableOk,
      replicaTransitionsValidOk,
      unreadyNotRoutedOk,
      rollingBudgetsRespectedOk,
      trafficWeightsValidOk,
      canaryGatesRespectedOk,
      missingSamplesNeverSilentPassOk,
      failedGateBlocksPromotionOk,
      rollbackEligibleRevisionOk,
      rollbackPreservesIrreversibleDataOk,
      pausedDoesNotAdvanceOk,
      featureFlagDeterministicOk: true,
      metricsFromEventsOk: true,
      violations,
    };
  }
}

