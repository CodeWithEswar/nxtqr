import { HpaAutoscalingEngine } from "../../kubernetes/autoscaling/hpa-engine";
import { PodTemplateSchema, type Pod } from "../../kubernetes/kubernetes-schemas";
import type {
  CapBottleneckRuntime,
  CapClusterConfig,
  CapCostAttribution,
  CapCostModelConfig,
  CapObjectiveConfig,
  CapParetoCandidate,
  CapRecommendationRuntime,
  CapReplicaRuntime,
  CapScalingPolicyConfig,
  CapServiceConfig,
  CapServiceRuntimeState,
} from "../capacity-schemas";
import { evaluateMMcQueue } from "../queueing/queueing-theory-engine";

export function evaluateServiceScalingStep(params: {
  svcCfg: CapServiceConfig;
  svcState: CapServiceRuntimeState;
  policy: CapScalingPolicyConfig;
  serviceReplicas: CapReplicaRuntime[];
  cluster: CapClusterConfig;
  totalAllocatedCpuMillicores: number;
  totalAllocatedMemoryMiB: number;
  nowMs: number;
  lastEvalMs: number;
  lastScaleAtMs?: number;
  forecastRps: number;
  nodeLost: boolean;
}): {
  evaluated: boolean;
  newDesired: number;
  newScaleRequested: boolean;
  blockedByCluster: boolean;
  reason: string;
} {
  const {
    svcCfg,
    svcState,
    policy,
    serviceReplicas,
    cluster,
    totalAllocatedCpuMillicores,
    totalAllocatedMemoryMiB,
    nowMs,
    lastEvalMs,
    lastScaleAtMs,
    forecastRps,
    nodeLost,
  } = params;

  if (
    policy.mode === "fixed" ||
    nowMs - lastEvalMs < policy.evaluationIntervalMs
  ) {
    return {
      evaluated: false,
      newDesired: svcState.desiredReplicas,
      newScaleRequested: false,
      blockedByCluster: false,
      reason: "Awaiting autoscaler evaluation interval.",
    };
  }

  const readyReplicas = serviceReplicas.filter((r) => r.state === "READY");
  const baseTemplate = PodTemplateSchema.parse({
    cpuRequestMillicores: svcCfg.cpuRequestMillicores,
    memoryRequestMiB: svcCfg.memoryRequestMiB,
    cpuLimitMillicores: svcCfg.cpuLimitMillicores,
    memoryLimitMiB: svcCfg.memoryLimitMiB,
    startupDelayMs: Math.max(10, svcCfg.startupDelayMs),
  });
  const readyPods: Pod[] = readyReplicas.map((r) => ({
    id: r.id,
    name: r.id,
    namespace: "default",
    labels: {},
    ownerDeploymentId: svcCfg.id,
    revision: 1,
    assignedNodeId: r.nodeId,
    phase: "Running",
    ready: true,
    createdAtMs: r.requestedAtMs,
    readyAtMs: r.readyAtMs,
    lastReconciledAtMs: nowMs,
    requests: {
      cpuMillicores: svcCfg.cpuRequestMillicores,
      memoryMiB: svcCfg.memoryRequestMiB,
    },
    limits: {
      cpuMillicores: svcCfg.cpuLimitMillicores,
      memoryMiB: svcCfg.memoryLimitMiB,
    },
    container: {
      id: `${r.id}-c`,
      name: svcCfg.id,
      image: "nxtqr/cap:v1",
      state: "running",
      startedAtMs: r.requestedAtMs,
      restartCount: 0,
      inCrashLoopBackOff: false,
      cpuThrottled: r.throttled,
    },
    probeState: {
      startupPassed: true,
      startupAttempts: 1,
      startupSuccessStreak: 1,
      startupFailureStreak: 0,
      readinessAttempts: 1,
      readinessSuccessStreak: 1,
      readinessFailureStreak: 0,
      livenessAttempts: 1,
      livenessFailureStreak: 0,
    },
    template: baseTemplate,
  }));

  const currentDesired = svcState.desiredReplicas;
  const totalDemandMillicores =
    readyReplicas.length *
    svcCfg.cpuRequestMillicores *
    (svcState.cpuUtilizationPct / 100);

  let targetDesired = currentDesired;
  let reason = "";

  if (policy.mode === "predictive") {
    const capacityPerReplica =
      (svcCfg.workerConcurrencyPerReplica * 1000) /
      Math.max(1, svcCfg.baseServiceTimeMs);
    const targetHeadroomCap =
      capacityPerReplica * (policy.targetCpuUtilizationPct / 100);
    const predReplicas = Math.ceil(
      Math.max(1, forecastRps) / Math.max(1, targetHeadroomCap)
    );
    targetDesired = Math.max(
      svcCfg.minReplicas,
      Math.min(svcCfg.maxReplicas, predReplicas)
    );
    reason = `Predictive (${policy.forecastModel}): forecast ${forecastRps} RPS -> ${targetDesired} replicas.`;
  } else if (policy.customMetricTargetRpsPerReplica) {
    const metricVal = readyReplicas.length > 0 ? svcState.incomingRps / readyReplicas.length : svcState.incomingRps;
    const ratio = metricVal / policy.customMetricTargetRpsPerReplica;
    if (Math.abs(1 - ratio) > policy.tolerancePct / 100) {
      targetDesired = Math.max(
        svcCfg.minReplicas,
        Math.min(svcCfg.maxReplicas, Math.ceil(Math.max(1, readyReplicas.length) * ratio))
      );
    }
    reason = `Custom RPS/replica=${Math.round(metricVal)} vs target=${policy.customMetricTargetRpsPerReplica}.`;
  } else {
    // Reuse Kubernetes HpaAutoscalingEngine
    const hpaRes = HpaAutoscalingEngine.evaluate(
      svcCfg.id,
      {
        enabled: true,
        minReplicas: svcCfg.minReplicas,
        maxReplicas: svcCfg.maxReplicas,
        targetCpuUtilizationPct: policy.targetCpuUtilizationPct,
        evaluationIntervalMs: policy.evaluationIntervalMs,
        stabilizationWindowMs: policy.scaleDownStabilizationMs,
      },
      currentDesired,
      readyPods,
      totalDemandMillicores,
      lastScaleAtMs !== undefined
        ? {
            deploymentId: svcCfg.id,
            enabled: true,
            currentReplicas: readyPods.length,
            desiredReplicas: currentDesired,
            recommendedReplicas: currentDesired,
            observedCpuUtilizationPct: svcState.cpuUtilizationPct,
            targetCpuUtilizationPct: policy.targetCpuUtilizationPct,
            minReplicas: svcCfg.minReplicas,
            maxReplicas: svcCfg.maxReplicas,
            lastScaleAtMs,
            stabilizationActive: false,
            lastDecisionReason: "",
          }
        : undefined,
      nowMs
    );
    targetDesired = hpaRes.nextState.desiredReplicas;
    reason = hpaRes.nextState.lastDecisionReason;
  }

  // Enforce cooldown
  if (
    targetDesired !== currentDesired &&
    lastScaleAtMs !== undefined &&
    nowMs - lastScaleAtMs < policy.cooldownMs
  ) {
    return {
      evaluated: true,
      newDesired: currentDesired,
      newScaleRequested: false,
      blockedByCluster: false,
      reason: `Cooldown active (${nowMs - lastScaleAtMs}/${policy.cooldownMs}ms); held at ${currentDesired}.`,
    };
  }

  // Enforce scaling rate limits
  if (targetDesired > currentDesired) {
    targetDesired = Math.min(
      targetDesired,
      currentDesired + policy.maxScaleUpStepReplicas
    );
  } else if (targetDesired < currentDesired) {
    targetDesired = Math.max(
      targetDesired,
      currentDesired - policy.maxScaleDownStepReplicas
    );
  }

  // Check cluster capacity & fragmentation feasibility
  let blockedByCluster = false;
  if (targetDesired > currentDesired) {
    const activeNodes = Math.max(1, cluster.nodeCount - (nodeLost ? 1 : 0));
    const maxCpu = activeNodes * cluster.cpuPerNodeMillicores;
    const maxMem = activeNodes * cluster.memoryPerNodeMiB;
    const fragPenalty = cluster.fragmentedLayout ? 0.65 : 1;
    const needCpu =
      totalAllocatedCpuMillicores +
      (targetDesired - currentDesired) * svcCfg.cpuRequestMillicores;
    const needMem =
      totalAllocatedMemoryMiB +
      (targetDesired - currentDesired) * svcCfg.memoryRequestMiB;

    if (
      (needCpu > maxCpu * fragPenalty || needMem > maxMem * fragPenalty) &&
      !policy.clusterAutoScaleEnabled
    ) {
      blockedByCluster = true;
      reason += " Cluster capacity/fragmentation limit reached without cluster autoscaler.";
    }
  }

  return {
    evaluated: true,
    newDesired: targetDesired,
    newScaleRequested: targetDesired !== currentDesired,
    blockedByCluster,
    reason,
  };
}

export function detectCapacityBottlenecks(params: {
  services: Record<string, CapServiceRuntimeState>;
  serviceConfigs: CapServiceConfig[];
  fragmentedPendingPods: number;
}): CapBottleneckRuntime[] {
  const { services, serviceConfigs, fragmentedPendingPods } = params;
  const result: CapBottleneckRuntime[] = [];

  for (const cfg of serviceConfigs) {
    const st = services[cfg.id];
    if (!st) continue;

    // Check downstream dependency saturation FIRST so we do NOT misdiagnose an upstream app as CPU bound
    const saturatedDep = cfg.dependencyIds
      .map((did) => services[did])
      .find((d) => d && (d.saturated || d.connectionUtilizationPct >= 85));

    if (saturatedDep) {
      result.push({
        serviceId: cfg.id,
        limitingResource: "downstream_dependency",
        saturationPct: Math.max(
          saturatedDep.cpuUtilizationPct,
          saturatedDep.connectionUtilizationPct
        ),
        affectedRps: st.incomingRps,
        explanation: `Downstream dependency '${saturatedDep.id}' is saturated; adding replicas to '${cfg.id}' alone will not relieve latency/queueing.`,
      });
      continue;
    }

    if (fragmentedPendingPods > 0 && st.pendingReplicas > 0) {
      result.push({
        serviceId: cfg.id,
        limitingResource: "cluster_fragmentation",
        saturationPct: 95,
        affectedRps: st.rejectedRps + st.incomingRps,
        explanation: `${st.pendingReplicas} replica(s) stuck PENDING due to node capacity or resource fragmentation.`,
      });
    } else if (st.connectionUtilizationPct >= 85) {
      result.push({
        serviceId: cfg.id,
        limitingResource: "db_connections",
        saturationPct: st.connectionUtilizationPct,
        affectedRps: st.incomingRps,
        explanation: `Database/connection pool utilization reached ${st.connectionUtilizationPct}% (${cfg.maxDbConnectionsPerReplica}/replica).`,
      });
    } else if (st.memoryUtilizationPct >= 85 || st.oomRisk) {
      result.push({
        serviceId: cfg.id,
        limitingResource: "memory",
        saturationPct: st.memoryUtilizationPct,
        affectedRps: st.incomingRps,
        explanation: `Memory pressure (${st.memoryUtilizationPct}% of limit ${cfg.memoryLimitMiB}MiB) poses OOM/GC slowdown risk.`,
      });
    } else if (st.cpuUtilizationPct >= 85 || st.throttled) {
      result.push({
        serviceId: cfg.id,
        limitingResource: "cpu",
        saturationPct: st.cpuUtilizationPct,
        affectedRps: st.incomingRps,
        explanation: `CPU demand reached ${st.cpuUtilizationPct}% of requested CPU; throttling increases p95/p99 latency.`,
      });
    } else if (st.workerUtilizationPct >= 85) {
      result.push({
        serviceId: cfg.id,
        limitingResource: "worker_pool",
        saturationPct: st.workerUtilizationPct,
        affectedRps: st.incomingRps,
        explanation: `Worker concurrency slots (${cfg.workerConcurrencyPerReplica}/replica) saturated at ${st.workerUtilizationPct}%.`,
      });
    } else if (st.queueDepth > 0 && st.queueDepth >= st.maxQueueDepth * 0.8) {
      result.push({
        serviceId: cfg.id,
        limitingResource: "queue_capacity",
        saturationPct: Math.round(
          (st.queueDepth / Math.max(1, st.maxQueueDepth)) * 100
        ),
        affectedRps: st.rejectedRps,
        explanation: `Queue occupancy ${st.queueDepth}/${st.maxQueueDepth} nearing saturation; requests timing out or shedding.`,
      });
    }
  }

  return result;
}

export function calculateTimeBasedCost(params: {
  costModel: CapCostModelConfig;
  replicaSecondsAccumulated: number;
  memoryGiBSecondsAccumulated: number;
  successfulRequests: number;
  totalRequests: number;
  virtualDurationMs: number;
}): CapCostAttribution {
  const {
    costModel,
    replicaSecondsAccumulated,
    memoryGiBSecondsAccumulated,
    successfulRequests,
    totalRequests,
    virtualDurationMs,
  } = params;

  // Map simulated window usage deterministically to synthetic monthly projection
  const repHours = replicaSecondsAccumulated / 3600;
  const memGiBHours = memoryGiBSecondsAccumulated / 3600;

  const computeCostUsd = Number(
    (repHours * costModel.computePerReplicaHour).toFixed(4)
  );
  const memoryCostUsd = Number(
    (memGiBHours * costModel.memoryPerGiBHour).toFixed(4)
  );
  const requestCostUsd = Number(
    ((totalRequests / 1_000_000) * costModel.requestPerMillion).toFixed(4)
  );
  const networkGiB = (totalRequests * 4) / (1024 * 1024);
  const networkCostUsd = Number(
    (networkGiB * costModel.networkPerGiB).toFixed(4)
  );
  const storageAndReservedCostUsd = Number(
    (costModel.fixedMonthlyCost * (virtualDurationMs / (30 * 24 * 3600 * 1000))).toFixed(4)
  );

  const totalSimCost = Number(
    (
      computeCostUsd +
      memoryCostUsd +
      requestCostUsd +
      networkCostUsd +
      storageAndReservedCostUsd
    ).toFixed(4)
  );

  const scaleToMonthFactor =
    (30 * 24 * 3600 * 1000) / Math.max(100, virtualDurationMs);
  const projectedMonthlyCostUsd = Number(
    Math.min(999999, totalSimCost * scaleToMonthFactor).toFixed(2)
  );

  const costPerSuccessfulRequestUsd =
    successfulRequests > 0
      ? Number((totalSimCost / successfulRequests).toFixed(6))
      : null;

  return {
    currency: costModel.currency,
    provenanceLabel: costModel.provenanceLabel,
    computeCostUsd,
    memoryCostUsd,
    networkCostUsd,
    requestCostUsd,
    storageAndReservedCostUsd,
    totalSimulatedWindowCostUsd: totalSimCost,
    projectedMonthlyCostUsd,
    costPerSuccessfulRequestUsd,
  };
}

export function generateRecommendationsAndPareto(params: {
  primaryServiceCfg: CapServiceConfig;
  primaryServiceState: CapServiceRuntimeState;
  bottlenecks: CapBottleneckRuntime[];
  objective: CapObjectiveConfig;
  costModel: CapCostModelConfig;
}): {
  recommendations: CapRecommendationRuntime[];
  paretoFrontier: CapParetoCandidate[];
} {
  const {
    primaryServiceCfg,
    primaryServiceState,
    bottlenecks,
    objective,
    costModel,
  } = params;

  const recommendations: CapRecommendationRuntime[] = [];
  const hasDownstreamBn = bottlenecks.some(
    (b) => b.limitingResource === "downstream_dependency"
  );

  if (hasDownstreamBn) {
    recommendations.push({
      id: "rec_downstream",
      targetServiceId: primaryServiceCfg.id,
      observedProblem: "Upstream latency/saturation driven by downstream dependency",
      supportingMetric: bottlenecks[0]!.explanation,
      suggestedChange:
        "Scale or optimize the downstream database/dependency connection pool before adding upstream replicas.",
      expectedEffect: "Relieves downstream lock contention and upstream queue wait.",
      tradeOff: "Requires database tier upgrade or read-replica routing.",
      confidence: "high",
      assumptions: "Measured under modeled dependency propagation graph.",
    });
  } else if (primaryServiceState.sloViolated || primaryServiceState.cpuUtilizationPct > 80) {
    const recReplicas = Math.min(
      primaryServiceCfg.maxReplicas,
      Math.max(
        primaryServiceState.readyReplicas + 1,
        Math.ceil(primaryServiceState.incomingRps / Math.max(1, (primaryServiceCfg.workerConcurrencyPerReplica * 1000) / primaryServiceCfg.baseServiceTimeMs * 0.7))
      )
    );
    recommendations.push({
      id: "rec_scale_out",
      targetServiceId: primaryServiceCfg.id,
      observedProblem: `High utilization (${primaryServiceState.cpuUtilizationPct}% CPU) or SLO breach (p95 ${primaryServiceState.p95LatencyMs}ms)`,
      supportingMetric: `incoming=${primaryServiceState.incomingRps} RPS vs effective=${primaryServiceState.effectiveCapacityRps} RPS`,
      suggestedChange: `Target ${recReplicas} replicas or enable predictive HPA ahead of traffic ramps.`,
      expectedEffect: "Increases headroom above 15% and lowers p95 queue wait.",
      tradeOff: "Higher monthly compute allocation.",
      confidence: "high",
      assumptions: "Assumes cluster nodes have allocatable CPU/memory headroom.",
    });
  } else if (
    primaryServiceState.cpuUtilizationPct < 25 &&
    primaryServiceState.readyReplicas > primaryServiceCfg.minReplicas
  ) {
    const downTarget = Math.max(
      primaryServiceCfg.minReplicas,
      primaryServiceState.readyReplicas - 1
    );
    recommendations.push({
      id: "rec_rightsize",
      targetServiceId: primaryServiceCfg.id,
      observedProblem: "Overprovisioned replicas / excessive idle compute headroom",
      supportingMetric: `CPU utilization ${primaryServiceState.cpuUtilizationPct}% across ${primaryServiceState.readyReplicas} replicas`,
      suggestedChange: `Right-size down toward ${downTarget} replicas (VPA request tuning / lower minReplicas).`,
      expectedEffect: "Reduces synthetic monthly compute cost while keeping p95 within SLO.",
      tradeOff: "Reduces instant burst buffer if sudden traffic spikes arrive without predictive scaling.",
      confidence: "medium",
      assumptions: "VPA request resize requires rolling restart unless in-place resize supported.",
    });
  }

  // Generate Pareto candidate curve across valid replica counts [minReplicas..min(min+8, maxReplicas)]
  const muPerRep =
    (primaryServiceCfg.workerConcurrencyPerReplica * 1000) /
    Math.max(1, primaryServiceCfg.baseServiceTimeMs * 4);
  const rawCandidates: CapParetoCandidate[] = [];
  const endR = Math.min(
    primaryServiceCfg.maxReplicas,
    Math.max(primaryServiceCfg.minReplicas + 6, primaryServiceState.desiredReplicas + 3)
  );

  for (let r = primaryServiceCfg.minReplicas; r <= endR; r++) {
    const monthlyUsd = Number((r * costModel.computePerReplicaHour * 720).toFixed(2));
    const capRps = Math.round(r * muPerRep);
    const mmc = evaluateMMcQueue(
      Math.max(1, primaryServiceState.incomingRps),
      muPerRep,
      r
    );
    const estP95 = mmc.applicable && mmc.expectedTotalTimeMsW !== null
      ? Math.round(mmc.expectedTotalTimeMsW * 1.8)
      : Math.round(primaryServiceCfg.baseServiceTimeMs * 18);
    const headroomPct =
      capRps > 0
        ? Number((((capRps - primaryServiceState.incomingRps) / capRps) * 100).toFixed(1))
        : 0;
    const meetsConstraints =
      monthlyUsd <= objective.maxMonthlyBudgetUsd &&
      estP95 <= objective.maxP95LatencyMs &&
      headroomPct >= objective.minHeadroomPct &&
      mmc.stable;

    rawCandidates.push({
      replicas: r,
      monthlyComputeCostUsd: monthlyUsd,
      estimatedP95Ms: estP95,
      headroomPct,
      effectiveCapacityRps: capRps,
      paretoEfficient: true,
      meetsConstraints,
    });
  }

  // Filter non-dominated candidates (lower cost & lower/equal latency)
  for (let i = 0; i < rawCandidates.length; i++) {
    const cand = rawCandidates[i]!;
    const dominated = rawCandidates.some(
      (other) =>
        other.replicas !== cand.replicas &&
        other.monthlyComputeCostUsd <= cand.monthlyComputeCostUsd &&
        other.estimatedP95Ms <= cand.estimatedP95Ms &&
        (other.monthlyComputeCostUsd < cand.monthlyComputeCostUsd ||
          other.estimatedP95Ms < cand.estimatedP95Ms)
    );
    cand.paretoEfficient = !dominated;
  }

  return { recommendations, paretoFrontier: rawCandidates };
}
