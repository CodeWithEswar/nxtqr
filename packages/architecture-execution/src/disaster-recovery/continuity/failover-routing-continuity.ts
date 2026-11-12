import type {
  DependencyRecoveryNodeState,
  DisasterRecoveryScenario,
  RecoveryPolicyConfig,
  RegionRuntimeStatus,
  RegionalServiceConfig,
  RoutingConvergenceRuntime,
} from "../disaster-recovery-schemas";

export function detectDependencyCycles(services: RegionalServiceConfig[]): {
  hasCycle: boolean;
  cycleNodes: string[];
} {
  const adj = new Map<string, string[]>();
  const serviceSet = new Set(services.map((s) => s.id));
  for (const s of services) {
    adj.set(
      s.id,
      s.dependencyIds.filter((d) => serviceSet.has(d))
    );
  }

  const state = new Map<string, 0 | 1 | 2>(); // 0 unvisited, 1 visiting, 2 done
  const cycleNodes: string[] = [];

  const dfs = (id: string): boolean => {
    state.set(id, 1);
    for (const dep of adj.get(id) ?? []) {
      const st = state.get(dep) ?? 0;
      if (st === 1) {
        cycleNodes.push(id, dep);
        return true;
      }
      if (st === 0 && dfs(dep)) {
        return true;
      }
    }
    state.set(id, 2);
    return false;
  };

  for (const s of services) {
    if ((state.get(s.id) ?? 0) === 0 && dfs(s.id)) {
      return { hasCycle: true, cycleNodes: Array.from(new Set(cycleNodes)) };
    }
  }

  return { hasCycle: false, cycleNodes: [] };
}

export function stepDependencyRecovery(params: {
  services: RegionalServiceConfig[];
  dependencies: Record<string, DependencyRecoveryNodeState>;
  activeRegionId: string;
  regions: Record<string, RegionRuntimeStatus>;
  failedServiceIds: Set<string>;
  identityOutage: boolean;
  nowMs: number;
  recoveryStartedAtMs: number;
  policy: RecoveryPolicyConfig;
}): {
  mvrRecovered: boolean;
  fullRecovered: boolean;
} {
  const {
    services,
    dependencies,
    activeRegionId,
    regions,
    failedServiceIds,
    identityOutage,
    nowMs,
    recoveryStartedAtMs,
    policy,
  } = params;

  const activeReg = regions[activeRegionId];
  const regHealthy =
    activeReg !== undefined &&
    (activeReg.state === "HEALTHY" ||
      activeReg.state === "DEGRADED" ||
      activeReg.state === "RESTORED");

  // Topological iterations to propagate readiness
  for (let pass = 0; pass < services.length; pass++) {
    for (const s of services) {
      const depState = dependencies[s.id];
      if (!depState) continue;

      const blockedBy: string[] = [];
      if (!regHealthy) {
        blockedBy.push(`region:${activeRegionId}`);
      }
      if (failedServiceIds.has(s.id)) {
        blockedBy.push(`fault:${s.id}`);
      }
      if (identityOutage && (s.kind === "gateway" || s.kind === "application")) {
        blockedBy.push("identity_provider_unavailable");
      }

      for (const reqDepId of s.dependencyIds) {
        if (!dependencies[reqDepId]?.recovered) {
          blockedBy.push(reqDepId);
        }
      }

      const warmupPending =
        s.cacheWarmupDelayMs > 0 &&
        nowMs - recoveryStartedAtMs < s.cacheWarmupDelayMs;

      if (s.kind === "cache" && warmupPending) {
        depState.cacheColdPenaltyMs = 45;
      } else {
        depState.cacheColdPenaltyMs = 0;
      }

      if (s.kind === "queue") {
        depState.queueBacklogDepth =
          blockedBy.length > 0
            ? Math.min(500, depState.queueBacklogDepth + 20)
            : Math.max(0, depState.queueBacklogDepth - 25);
      }

      depState.blockedByIds = blockedBy;
      depState.degradedReason =
        blockedBy.length > 0
          ? `Blocked by: ${blockedBy.join(", ")}`
          : s.cacheWarmupDelayMs > 0 && warmupPending
            ? "Cache cold-start warmup in progress"
            : undefined;
      depState.recovered = blockedBy.length === 0;
    }
  }

  const criticalServices = services.filter(
    (s) => s.tier === "tier_0_critical" || s.tier === "tier_1_high"
  );
  const mvrRecovered = policy.minimumViableRecoveryEnabled
    ? criticalServices.every((s) => dependencies[s.id]?.recovered === true)
    : services.every((s) => dependencies[s.id]?.recovered === true);

  const fullRecovered = services.every(
    (s) => dependencies[s.id]?.recovered === true
  );

  return { mvrRecovered, fullRecovered };
}

export function stepGlobalRoutingAndCapacity(params: {
  nowMs: number;
  scenario: DisasterRecoveryScenario;
  policy: RecoveryPolicyConfig;
  routing: RoutingConvergenceRuntime;
  routingUpdatedAtMs: number | null;
  hasStaleDnsFault: boolean;
  regions: Record<string, RegionRuntimeStatus>;
}): {
  lostRequestsTick: number;
  successfulRequestsTick: number;
  capacityDeficitRps: number;
  convergedNow: boolean;
} {
  const {
    nowMs,
    scenario,
    policy,
    routing,
    routingUpdatedAtMs,
    hasStaleDnsFault,
    regions,
  } = params;

  const totalRps = scenario.trafficRps;
  let stalePct = 0;

  if (routingUpdatedAtMs !== null) {
    const elapsedSinceUpdate = Math.max(0, nowMs - routingUpdatedAtMs);
    if (policy.routingStrategy === "dns_failover") {
      const effectiveTtl = hasStaleDnsFault
        ? policy.dnsTtlMs * 2
        : policy.dnsTtlMs;
      if (effectiveTtl > 0 && elapsedSinceUpdate < effectiveTtl) {
        stalePct = Math.round(
          Math.max(0, 1 - elapsedSinceUpdate / effectiveTtl) * 100
        );
      } else {
        stalePct = 0;
      }
    } else {
      // Global Load Balancer converges cleanly in <= 40ms
      stalePct = elapsedSinceUpdate < 20 ? 15 : 0;
    }
  }

  routing.staleClientsPct = stalePct;
  const newlyConverged =
    routingUpdatedAtMs !== null && stalePct === 0 && !routing.converged;
  if (newlyConverged) {
    routing.converged = true;
    routing.convergenceDurationMs = Math.max(
      0,
      nowMs - routingUpdatedAtMs!
    );
  }

  let lostTick = 0;
  let okTick = 0;
  let deficit = 0;

  const regionIds = Object.keys(regions);
  const failedPrimaryId =
    regionIds.find((id) => regions[id]?.state === "UNAVAILABLE") ??
    regionIds[0]!;

  for (const regId of regionIds) {
    const reg = regions[regId]!;
    let configuredShare = routing.regionalWeightsPct[regId] ?? 0;

    // Stale DNS clients keep hitting failed/old primary region until TTL expires
    let observedShare = configuredShare;
    if (stalePct > 0 && routingUpdatedAtMs !== null) {
      if (regId === failedPrimaryId) {
        observedShare = Math.min(100, configuredShare + stalePct);
      } else if (configuredShare > 0) {
        observedShare = Math.max(0, configuredShare - stalePct);
      }
    }

    routing.observedTrafficPct[regId] = observedShare;
    const loadRps = Math.round((totalRps * observedShare) / 100);
    reg.currentLoadRps = loadRps;

    // Effective zone & provisioning capacity
    const effCap = Math.round(
      (reg.computeCapacityRps *
        reg.provisionedPct *
        Math.max(0, reg.activeZones)) /
        (100 * Math.max(1, reg.totalZones))
    );
    reg.effectiveCapacityRps = effCap;

    if (reg.state === "UNAVAILABLE") {
      reg.overloaded = false;
      reg.errorRate = loadRps > 0 ? 1 : 0;
      lostTick += Math.round(loadRps / 10);
    } else if (loadRps > effCap) {
      reg.overloaded = true;
      const shedFraction = (loadRps - effCap) / Math.max(1, loadRps);
      reg.errorRate = Number(Math.min(1, shedFraction).toFixed(3));
      const dropped = Math.max(1, Math.round((loadRps - effCap) / 10));
      lostTick += dropped;
      okTick += Math.max(0, Math.round(loadRps / 10) - dropped);
      deficit += loadRps - effCap;
    } else {
      reg.overloaded = false;
      reg.errorRate = reg.state === "DEGRADED" ? 0.08 : 0.002;
      okTick += Math.max(0, Math.round(loadRps / 10));
    }
  }

  routing.failedRequestsDuringWindow += lostTick;
  routing.successfulRequestsDuringWindow += okTick;

  return {
    lostRequestsTick: lostTick,
    successfulRequestsTick: okTick,
    capacityDeficitRps: deficit,
    convergedNow: newlyConverged,
  };
}

