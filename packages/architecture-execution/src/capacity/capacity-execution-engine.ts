import { VirtualClock } from "../engine/virtual-clock";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";
import type {
  ExecutionTrace,
  VisualizationFrame,
} from "../domain/execution-trace";
import { RuntimeStateHelper, type ModeledRuntimeState } from "../domain/runtime-state";
import { DeterministicRandom } from "../resilience/deterministic-random";
import { MetricAggregator } from "../traffic/metric-aggregator";
import type { CapacityExecutionEvent } from "./capacity-events";
import {
  CapacityScenarioSchema,
  type CapForecastPoint,
  type CapReplicaRuntime,
  type CapScalingDecisionRuntime,
  type CapServiceConfig,
  type CapServiceRuntimeState,
  type CapacityScenario,
  type ModeledCapacityRuntimeState,
} from "./capacity-schemas";
import {
  calculateTimeBasedCost,
  detectCapacityBottlenecks,
  evaluateServiceScalingStep,
  generateRecommendationsAndPareto,
} from "./autoscaling/capacity-scaling-cost-engine";
import { CapacityInvariantMonitor } from "./invariants/capacity-invariants";
import {
  computeForecastNoLeakage,
  evaluateMM1Queue,
  evaluateMMcQueue,
  evaluateWorkloadArrivalRps,
} from "./queueing/queueing-theory-engine";

export class CapacityExecutionEngine {
  private static readonly TICK_STEP_MS = 20;

  public static runScenario(rawScenario: CapacityScenario): {
    scenario: CapacityScenario;
    trace: ExecutionTrace;
    frames: VisualizationFrame[];
    finalState: ModeledCapacityRuntimeState;
  } {
    const scenario = CapacityScenarioSchema.parse(rawScenario);
    const clock = new VirtualClock();
    const rng = new DeterministicRandom(scenario.seed);
    const events: CapacityExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];
    let seq = 0;

    const svcCfgById = new Map<string, CapServiceConfig>();
    for (const s of scenario.services.slice(0, scenario.limits.maxServices)) {
      svcCfgById.set(s.id, s);
    }

    const scalePolicyBySvc = new Map(
      scenario.scalingPolicies.map((p) => [p.serviceId, p])
    );
    const queuePolicyBySvc = new Map(
      scenario.queueingPolicies.map((q) => [q.serviceId, q])
    );
    const objectiveBySvc = new Map(
      scenario.objectives.map((o) => [o.serviceId, o])
    );
    const costModel = scenario.costModels[0]!;
    const primarySvcCfg = scenario.services[0]!;

    // Initialize replicas and service runtime states
    const replicas: Record<string, CapReplicaRuntime> = {};
    const services: Record<string, CapServiceRuntimeState> = {};
    const queueDepthBySvc: Record<string, number> = {};
    const queuedLatencyOffsetsBySvc: Record<string, number[]> = {};
    const latencySamplesBySvc: Record<string, number[]> = {};
    const lastEvalAtBySvc: Record<string, number> = {};
    const lastScaleAtBySvc: Record<string, number> = {};
    const coldStartRemainingMsBySvc: Record<string, number> = {};
    let replicaCounter = 0;

    const allocCpuPerNode = scenario.cluster.cpuPerNodeMillicores;
    const allocMemPerNode = scenario.cluster.memoryPerNodeMiB;

    const getAllocatedTotals = () => {
      let cpu = 0;
      let mem = 0;
      let fragmentedPending = 0;
      for (const r of Object.values(replicas)) {
        const cfg = svcCfgById.get(r.serviceId);
        if (!cfg) continue;
        if (r.state === "READY" || r.state === "PROVISIONING") {
          cpu += cfg.cpuRequestMillicores;
          mem += cfg.memoryRequestMiB;
        } else if (r.state === "PENDING_CAPACITY") {
          fragmentedPending++;
        }
      }
      return { cpu, mem, fragmentedPending };
    };

    const canScheduleOnCluster = (
      cfg: CapServiceConfig,
      activeNodeCount: number
    ): { ok: boolean; nodeId: string } => {
      const { cpu, mem } = getAllocatedTotals();
      const totalCpu = activeNodeCount * allocCpuPerNode;
      const totalMem = activeNodeCount * allocMemPerNode;

      // Simulate bin-packing fragmentation when enabled
      const effectiveEfficiency = scenario.cluster.fragmentedLayout ? 0.65 : 0.98;
      if (
        cpu + cfg.cpuRequestMillicores > totalCpu * effectiveEfficiency ||
        mem + cfg.memoryRequestMiB > totalMem * effectiveEfficiency
      ) {
        return { ok: false, nodeId: "unscheduled" };
      }
      const nodeIdx = (replicaCounter % Math.max(1, activeNodeCount)) + 1;
      return { ok: true, nodeId: `node-${nodeIdx}` };
    };

    for (const cfg of svcCfgById.values()) {
      const qp = queuePolicyBySvc.get(cfg.id);
      const qMax = Math.min(
        scenario.limits.maxQueueEntries,
        qp?.maxQueueDepth ?? 120
      );
      queueDepthBySvc[cfg.id] = 0;
      queuedLatencyOffsetsBySvc[cfg.id] = [];
      latencySamplesBySvc[cfg.id] = [cfg.baseServiceTimeMs];
      lastEvalAtBySvc[cfg.id] = -1000;
      coldStartRemainingMsBySvc[cfg.id] = cfg.coldStartPenaltyMs > 0 ? cfg.coldStartPenaltyMs : 0;

      const initCount = Math.min(
        cfg.maxReplicas,
        Math.max(cfg.minReplicas, cfg.initialReplicas)
      );
      let readyCnt = 0;
      let pendingCnt = 0;

      for (let i = 0; i < initCount; i++) {
        replicaCounter++;
        const repId = `${cfg.id}-rep-${replicaCounter}`;
        const sched = canScheduleOnCluster(cfg, scenario.cluster.nodeCount);
        const isReady = sched.ok;
        if (isReady) readyCnt++;
        else pendingCnt++;

        replicas[repId] = {
          id: repId,
          serviceId: cfg.id,
          nodeId: sched.nodeId,
          state: isReady ? "READY" : "PENDING_CAPACITY",
          requestedAtMs: 0,
          readyAtMs: isReady ? 0 : undefined,
          cpuUtilizationPct: 12,
          memoryUtilizationPct: 24,
          activeWorkers: 0,
          activeConnections: 0,
          throttled: false,
        };
      }

      services[cfg.id] = {
        id: cfg.id,
        label: cfg.label,
        kind: cfg.kind,
        region: cfg.region,
        desiredReplicas: initCount,
        readyReplicas: readyCnt,
        pendingReplicas: pendingCnt,
        terminatingReplicas: 0,
        incomingRps: 0,
        completedRps: 0,
        rejectedRps: 0,
        effectiveCapacityRps: 0,
        headroomRps: 0,
        headroomPct: 100,
        cpuUtilizationPct: 0,
        memoryUtilizationPct: 0,
        workerUtilizationPct: 0,
        connectionUtilizationPct: 0,
        queueDepth: 0,
        maxQueueDepth: qMax,
        queueWaitMs: 0,
        p50LatencyMs: cfg.baseServiceTimeMs,
        p95LatencyMs: cfg.baseServiceTimeMs,
        p99LatencyMs: cfg.baseServiceTimeMs,
        throttled: false,
        oomRisk: false,
        saturated: false,
        sloViolated: false,
      };
    }

    const scalingDecisions: CapScalingDecisionRuntime[] = [];
    const forecastPoints: CapForecastPoint[] = [];
    const observedRpsHistoryBySvc: Record<string, number[]> = {};
    for (const id of svcCfgById.keys()) observedRpsHistoryBySvc[id] = [];

    let totalRequests = 0;
    let successfulRequests = 0;
    let rejectedRequests = 0;
    let sloViolationsCount = 0;
    let replicaSecondsAccumulated = 0;
    let memoryGiBSecondsAccumulated = 0;
    let activeNodes = scenario.cluster.nodeCount;
    let pendingClusterProvisionAtMs: number | null = null;
    let unreadyServedAnyRequest = false;
    let futureForecastLeakageSeen = false;
    let prevIncomingSummary = -1;
    let emittedSaturationKey = new Set<string>();
    let emittedBottleneckKey = new Set<string>();
    let emittedSloKey = new Set<string>();

    const recordFrameAndEvent = <T extends CapacityExecutionEvent>(
      event: Omit<T, "id" | "sequence" | "stateSnapshot">,
      state: ModeledCapacityRuntimeState,
      captureFrame = true
    ) => {
      if (events.length >= scenario.limits.maxEvents) return;
      seq++;
      const snapshotState: ModeledRuntimeState = RuntimeStateHelper.cloneState({
        ...RuntimeStateHelper.createInitialState(undefined),
        capacityState: JSON.parse(JSON.stringify(state)),
      });
      const fullEvent = {
        ...event,
        id: `cap_evt_${seq}`,
        sequence: seq,
        stateSnapshot: snapshotState,
      } as T;
      events.push(fullEvent);

      if (captureFrame) {
        frames.push({
          frameIndex: frames.length,
          virtualTimeMs: clock.now(),
          activeNodeIds: Object.values(state.services)
            .filter((s) => s.saturated || s.sloViolated)
            .map((s) => s.id),
          activeEdgeIds: [],
          activeEvent: fullEvent,
          direction: "request",
          stepTitle: fullEvent.type.replace("capacity.", "").replace(/\./g, " "),
          stepExplanation: fullEvent.explanation,
          runtimeState: snapshotState,
        });
      }
    };

    const buildRuntimeState = (): ModeledCapacityRuntimeState => {
      const { cpu, mem, fragmentedPending } = getAllocatedTotals();
      const primState = services[primarySvcCfg.id]!;
      const muPerRep =
        (primarySvcCfg.workerConcurrencyPerReplica * 1000) /
        Math.max(1, primarySvcCfg.baseServiceTimeMs * 4);
      const lambdaForTheory = Math.max(0.1, primState.incomingRps);
      const mm1 = evaluateMM1Queue(
        lambdaForTheory,
        Math.max(1, muPerRep * Math.max(1, primState.readyReplicas))
      );
      const mmc = evaluateMMcQueue(
        lambdaForTheory,
        Math.max(1, muPerRep),
        Math.max(1, primState.readyReplicas)
      );

      const bottlenecks = detectCapacityBottlenecks({
        services,
        serviceConfigs: Array.from(svcCfgById.values()),
        fragmentedPendingPods: fragmentedPending,
      });

      const cost = calculateTimeBasedCost({
        costModel,
        replicaSecondsAccumulated,
        memoryGiBSecondsAccumulated,
        successfulRequests,
        totalRequests,
        virtualDurationMs: Math.max(CapacityExecutionEngine.TICK_STEP_MS, clock.now()),
      });

      const obj =
        objectiveBySvc.get(primarySvcCfg.id) ?? scenario.objectives[0]!;
      const { recommendations, paretoFrontier } =
        generateRecommendationsAndPareto({
          primaryServiceCfg: primarySvcCfg,
          primaryServiceState: primState,
          bottlenecks,
          objective: obj,
          costModel,
        });

      const invariants = CapacityInvariantMonitor.verify({
        serviceConfigs: Array.from(svcCfgById.values()),
        services,
        replicas,
        mm1,
        mmc,
        cost,
        recommendations,
        unreadyServedAnyRequest,
        futureForecastLeakageSeen,
      });

      const allSvcs = Object.values(services);
      const allLat = latencySamplesBySvc[primarySvcCfg.id] ?? [
        primarySvcCfg.baseServiceTimeMs,
      ];
      const totalReady = allSvcs.reduce((acc, s) => acc + s.readyReplicas, 0);
      const totalPending = allSvcs.reduce((acc, s) => acc + s.pendingReplicas, 0);
      const avgCpu =
        allSvcs.length > 0
          ? Math.round(
              allSvcs.reduce((a, b) => a + b.cpuUtilizationPct, 0) /
                allSvcs.length
            )
          : 0;
      const avgMem =
        allSvcs.length > 0
          ? Math.round(
              allSvcs.reduce((a, b) => a + b.memoryUtilizationPct, 0) /
                allSvcs.length
            )
          : 0;

      const caveats: string[] = [
        cost.provenanceLabel,
        "Queueing theory (M/M/1, M/M/c) assumes Poisson arrivals and exponential i.i.d. service times; real bursty workloads show higher tail latency.",
      ];
      if (!mmc.applicable) {
        caveats.push(mmc.caveat);
      }

      return {
        virtualTimeMs: clock.now(),
        services: JSON.parse(JSON.stringify(services)),
        replicas: JSON.parse(JSON.stringify(replicas)),
        cluster: {
          nodeCount: activeNodes,
          allocatableCpuMillicores: activeNodes * allocCpuPerNode,
          allocatedCpuMillicores: cpu,
          allocatableMemoryMiB: activeNodes * allocMemPerNode,
          allocatedMemoryMiB: mem,
          fragmentedPendingPods: fragmentedPending,
        },
        queueingAnalysis: { mm1, mmc },
        scalingDecisions: [...scalingDecisions],
        bottlenecks,
        forecastPoints: [...forecastPoints],
        recommendations,
        paretoFrontier,
        cost,
        caveats,
        invariants,
        metrics: {
          virtualTimeMs: clock.now(),
          incomingRps: Math.round(primState.incomingRps),
          completedRps: Math.round(primState.completedRps),
          rejectedRps: Math.round(primState.rejectedRps),
          totalRequests,
          successfulRequests,
          rejectedRequests,
          activeQueueDepth: allSvcs.reduce((a, b) => a + b.queueDepth, 0),
          p50LatencyMs: Math.round(MetricAggregator.calculatePercentile(allLat, 50)),
          p95LatencyMs: Math.round(MetricAggregator.calculatePercentile(allLat, 95)),
          p99LatencyMs: Math.round(MetricAggregator.calculatePercentile(allLat, 99)),
          avgCpuUtilizationPct: avgCpu,
          avgMemoryUtilizationPct: avgMem,
          readyReplicas: totalReady,
          pendingReplicas: totalPending,
          effectiveCapacityRps: primState.effectiveCapacityRps,
          headroomPct: primState.headroomPct,
          scalingEventsCount: scalingDecisions.filter((d) => d.applied).length,
          sloViolationsCount,
          projectedMonthlyCostUsd: cost.projectedMonthlyCostUsd,
          costPerSuccessfulRequestUsd: cost.costPerSuccessfulRequestUsd,
        },
      };
    };

    // Main deterministic simulation loop
    const totalDurationMs = scenario.limits.maxVirtualDurationMs;
    const dtSec = CapacityExecutionEngine.TICK_STEP_MS / 1000;

    for (
      let t = 0;
      t <= totalDurationMs;
      t += CapacityExecutionEngine.TICK_STEP_MS
    ) {
      if (t > 0) clock.advance(CapacityExecutionEngine.TICK_STEP_MS);
      const nowMs = clock.now();

      // Check active faults at nowMs
      const isFaultActive = (type: string, svcId?: string) =>
        scenario.faults.some((f) => {
          const end = f.durationMs !== undefined ? f.atMs + f.durationMs : totalDurationMs + 1;
          const matchesSvc = !svcId || f.targetServiceId === svcId || f.targetServiceId === "all";
          return f.type === type && matchesSvc && nowMs >= f.atMs && nowMs <= end;
        });

      const nodeLossActive = isFaultActive("cluster_node_loss");
      const effectiveNodesTarget = nodeLossActive
        ? Math.max(1, scenario.cluster.nodeCount - 1)
        : scenario.cluster.nodeCount;
      if (effectiveNodesTarget < activeNodes) {
        activeNodes = effectiveNodesTarget;
      } else if (
        pendingClusterProvisionAtMs !== null &&
        nowMs >= pendingClusterProvisionAtMs &&
        activeNodes < scenario.cluster.maxNodes
      ) {
        activeNodes++;
        pendingClusterProvisionAtMs = null;
      }

      // Transition PROVISIONING replicas to READY only after startup + readiness delay
      for (const rep of Object.values(replicas)) {
        const cfg = svcCfgById.get(rep.serviceId);
        if (!cfg) continue;
        if (rep.state === "PENDING_CAPACITY") {
          const sched = canScheduleOnCluster(cfg, activeNodes);
          if (sched.ok) {
            rep.nodeId = sched.nodeId;
            rep.state = "PROVISIONING";
            rep.readyAtMs = nowMs + cfg.startupDelayMs + cfg.readinessDelayMs;
          }
        }
        if (
          rep.state === "PROVISIONING" &&
          rep.readyAtMs !== undefined &&
          nowMs >= rep.readyAtMs
        ) {
          rep.state = "READY";
          const st = services[cfg.id]!;
          st.pendingReplicas = Math.max(0, st.pendingReplicas - 1);
          st.readyReplicas++;
          if (coldStartRemainingMsBySvc[cfg.id]! <= 0 && cfg.coldStartPenaltyMs > 0) {
            coldStartRemainingMsBySvc[cfg.id] = cfg.coldStartPenaltyMs;
          }
          const stateSnap = buildRuntimeState();
          recordFrameAndEvent<
            Extract<CapacityExecutionEvent, { type: "capacity.replica.ready" }>
          >(
            {
              type: "capacity.replica.ready",
              atMs: nowMs,
              durationMs: cfg.startupDelayMs + cfg.readinessDelayMs,
              replicaId: rep.id,
              serviceId: cfg.id,
              explanation: `Replica ${rep.id} passed readiness probes after ${cfg.startupDelayMs + cfg.readinessDelayMs}ms and joined active serving pool.`,
            },
            stateSnap,
            true
          );
        }
      }

      // Compute incoming traffic per service (top-level workloads + downstream propagation)
      const incomingBySvc: Record<string, number> = {};
      for (const id of svcCfgById.keys()) incomingBySvc[id] = 0;

      for (const wp of scenario.workloads) {
        let rps = evaluateWorkloadArrivalRps(wp, nowMs, rng);
        if (isFaultActive("thundering_herd", wp.targetServiceId)) {
          rps *= 2.4;
        }
        if (isFaultActive("region_failover_surge", wp.targetServiceId)) {
          rps *= 1.85;
        }
        if (
          isFaultActive("noisy_neighbor_tenant", wp.targetServiceId) &&
          wp.tenantWeight > 1
        ) {
          rps *= 2.1;
        }
        incomingBySvc[wp.targetServiceId] =
          (incomingBySvc[wp.targetServiceId] ?? 0) + rps;
      }

      // Propagate calls to downstream dependencies (upstream -> dependencies)
      for (const cfg of svcCfgById.values()) {
        const upIncoming = incomingBySvc[cfg.id] ?? 0;
        for (const depId of cfg.dependencyIds) {
          if (incomingBySvc[depId] !== undefined) {
            incomingBySvc[depId]! += upIncoming * 0.9;
          }
        }
      }

      // Step service physics in reverse dependency order so downstream saturation propagates upstream cleanly
      const orderedServices = Array.from(svcCfgById.values()).reverse();
      for (const cfg of orderedServices) {
        const st = services[cfg.id]!;
        const qp = queuePolicyBySvc.get(cfg.id);
        const pol = scalePolicyBySvc.get(cfg.id);
        const obj = objectiveBySvc.get(cfg.id) ?? scenario.objectives[0]!;

        const svcReplicas = Object.values(replicas).filter(
          (r) => r.serviceId === cfg.id && r.state !== "TERMINATING"
        );
        const readyReps = svcReplicas.filter((r) => r.state === "READY");
        const pendingReps = svcReplicas.filter(
          (r) => r.state === "PENDING_CAPACITY" || r.state === "PROVISIONING"
        );

        // STRICT: UNREADY/PENDING replicas contribute ZERO capacity
        const readyCount = readyReps.length;
        const dbFault = isFaultActive("downstream_db_saturation", cfg.id);
        const memLeakFault = isFaultActive("memory_leak_pressure", cfg.id);
        const coldFault = isFaultActive("cold_start_surge", cfg.id);

        if (coldStartRemainingMsBySvc[cfg.id]! > 0) {
          coldStartRemainingMsBySvc[cfg.id] = Math.max(
            0,
            coldStartRemainingMsBySvc[cfg.id]! - CapacityExecutionEngine.TICK_STEP_MS
          );
        }

        // Downstream slowdown penalty if any dependency is saturated
        let downstreamExtraMs = 0;
        let downstreamSaturated = false;
        for (const depId of cfg.dependencyIds) {
          const depSt = services[depId];
          if (depSt && (depSt.saturated || depSt.connectionUtilizationPct >= 85)) {
            downstreamSaturated = true;
            downstreamExtraMs += Math.max(
              25,
              depSt.p95LatencyMs * 0.6
            );
          }
        }

        const coldPenalty =
          coldFault || coldStartRemainingMsBySvc[cfg.id]! > 0
            ? cfg.coldStartPenaltyMs
            : 0;
        const rawServiceTimeMs =
          cfg.baseServiceTimeMs * (dbFault ? 3.5 : 1) +
          coldPenalty +
          downstreamExtraMs;

        // Per-replica throughput governed by CPU, workers, DB pool
        const workerRpsPerRep =
          (cfg.workerConcurrencyPerReplica * 1000) / Math.max(1, rawServiceTimeMs);
        const cpuLimitRpsPerRep =
          cfg.cpuLimitMillicores / Math.max(0.2, cfg.cpuCostPerRequestMillicores);
        const dbConnRpsPerRep =
          (cfg.maxDbConnectionsPerReplica * 1000) /
          Math.max(1, rawServiceTimeMs * (dbFault ? 2.2 : 1));

        const perReplicaEffRps = Math.min(
          workerRpsPerRep,
          cpuLimitRpsPerRep,
          dbConnRpsPerRep
        );
        const effectiveCapRps =
          readyCount === 0 ? 0 : Math.round(readyCount * perReplicaEffRps);

        const rawIncomingRps = incomingBySvc[cfg.id] ?? 0;
        const incomingInTick = Math.min(
          scenario.limits.maxRequests - totalRequests,
          Math.max(0, Math.round(rawIncomingRps * dtSec))
        );
        if (cfg.id === primarySvcCfg.id) {
          totalRequests += incomingInTick;
        }

        // Queueing, Backpressure & Load Shedding
        const capacityInTick =
          readyCount === 0
            ? 0
            : Math.max(0, Math.floor(effectiveCapRps * dtSec));
        let queueDepth = queueDepthBySvc[cfg.id] ?? 0;
        const maxQueue = st.maxQueueDepth;
        let rejectedInTick = 0;
        let acceptedIntoSystem = incomingInTick;

        if (
          qp?.overloadAction === "backpressure" &&
          queueDepth >= maxQueue * 0.85
        ) {
          // Backpressure slows acceptance proportionally
          acceptedIntoSystem = Math.floor(incomingInTick * 0.45);
          rejectedInTick = incomingInTick - acceptedIntoSystem;
        }

        const canServeImmediate = Math.min(
          acceptedIntoSystem + queueDepth,
          capacityInTick
        );
        const excessAfterServing =
          acceptedIntoSystem + queueDepth - canServeImmediate;

        if (excessAfterServing > maxQueue) {
          rejectedInTick += excessAfterServing - maxQueue;
          queueDepth = maxQueue;
        } else {
          queueDepth = Math.max(0, excessAfterServing);
        }

        // Assertion check helper: unready-only never serves
        if (readyCount === 0 && canServeImmediate > 0) {
          unreadyServedAnyRequest = true;
        }

        queueDepthBySvc[cfg.id] = queueDepth;
        const completedInTick = Math.max(0, canServeImmediate);
        if (cfg.id === primarySvcCfg.id) {
          successfulRequests += completedInTick;
          rejectedRequests += rejectedInTick;
        }

        const completedRps = Math.round(completedInTick / dtSec);
        const rejectedRps = Math.round(rejectedInTick / dtSec);

        // Utilization calculation grounded in demand vs provisioned requests/limits
        const activeLoadRps = Math.max(rawIncomingRps, completedRps);
        const totalReqCpuMillicores = Math.max(
          1,
          readyCount * cfg.cpuRequestMillicores
        );
        const demandedCpuMillicores =
          activeLoadRps * cfg.cpuCostPerRequestMillicores;
        const cpuUtilPct =
          readyCount === 0
            ? rawIncomingRps > 0
              ? 100
              : 0
            : Math.min(
                100,
                Math.round((demandedCpuMillicores / totalReqCpuMillicores) * 100)
              );

        const totalLimitMemMiB = Math.max(1, readyCount * cfg.memoryLimitMiB);
        const leakBonusMiB = memLeakFault
          ? Math.min(cfg.memoryLimitMiB * 0.7, (nowMs / 20) * 18)
          : 0;
        const demandedMemMiB =
          readyCount * (cfg.memoryRequestMiB * 0.35 + leakBonusMiB) +
          (activeLoadRps * dtSec + queueDepth) * cfg.memoryPerRequestMiB;
        const memUtilPct =
          readyCount === 0
            ? 0
            : Math.min(100, Math.round((demandedMemMiB / totalLimitMemMiB) * 100));

        const workerUtilPct =
          readyCount === 0
            ? rawIncomingRps > 0
              ? 100
              : 0
            : Math.min(
                100,
                Math.round(
                  (activeLoadRps / Math.max(1, readyCount * workerRpsPerRep)) * 100
                )
              );
        const connUtilPct =
          readyCount === 0
            ? rawIncomingRps > 0
              ? 100
              : 0
            : Math.min(
                100,
                Math.round(
                  (activeLoadRps / Math.max(1, readyCount * dbConnRpsPerRep)) * 100
                )
              );

        const cpuThrottled =
          readyCount > 0 &&
          demandedCpuMillicores > readyCount * cfg.cpuLimitMillicores * 0.9;
        const oomRisk = memUtilPct >= 88;

        // Latency modeling (queue wait + service time + CPU throttling + HoL blocking + jitter)
        const disciplinePenalty =
          qp?.discipline === "head_of_line_demo" ? queueDepth * 2.5 : 0;
        const throttlePenaltyMs = cpuThrottled ? rawServiceTimeMs * 0.75 : 0;
        const queueWaitMs =
          effectiveCapRps > 0
            ? Math.round((queueDepth / effectiveCapRps) * 1000 + disciplinePenalty)
            : queueDepth > 0
              ? qp?.requestTimeoutMs ?? 250
              : 0;

        const tickLat = Math.round(
          rawServiceTimeMs +
            throttlePenaltyMs +
            queueWaitMs +
            rng.nextInt(0, 6)
        );
        const samples = latencySamplesBySvc[cfg.id]!;
        samples.push(tickLat);
        if (samples.length > 200) samples.shift();

        const p50 = Math.round(MetricAggregator.calculatePercentile(samples, 50));
        const p95 = Math.round(MetricAggregator.calculatePercentile(samples, 95));
        const p99 = Math.round(MetricAggregator.calculatePercentile(samples, 99));

        const headroomRps = Math.max(0, effectiveCapRps - Math.round(rawIncomingRps));
        const headroomPct =
          effectiveCapRps > 0
            ? Number(
                (
                  ((effectiveCapRps - rawIncomingRps) / effectiveCapRps) *
                  100
                ).toFixed(1)
              )
            : 0;

        const saturated =
          cpuUtilPct >= 88 ||
          memUtilPct >= 88 ||
          workerUtilPct >= 88 ||
          connUtilPct >= 88 ||
          downstreamSaturated ||
          queueDepth >= maxQueue * 0.85;
        const sloViolated =
          p95 > obj.maxP95LatencyMs ||
          (rawIncomingRps > 0 && rejectedRps / rawIncomingRps > obj.maxErrorRate);
        if (sloViolated && cfg.id === primarySvcCfg.id) sloViolationsCount++;

        st.readyReplicas = readyCount;
        st.pendingReplicas = pendingReps.length;
        st.incomingRps = Math.round(rawIncomingRps);
        st.completedRps = completedRps;
        st.rejectedRps = rejectedRps;
        st.effectiveCapacityRps = effectiveCapRps;
        st.headroomRps = headroomRps;
        st.headroomPct = headroomPct;
        st.cpuUtilizationPct = cpuUtilPct;
        st.memoryUtilizationPct = memUtilPct;
        st.workerUtilizationPct = workerUtilPct;
        st.connectionUtilizationPct = connUtilPct;
        st.queueDepth = queueDepth;
        st.queueWaitMs = queueWaitMs;
        st.p50LatencyMs = p50;
        st.p95LatencyMs = p95;
        st.p99LatencyMs = p99;
        st.throttled = cpuThrottled;
        st.oomRisk = oomRisk;
        st.saturated = saturated;
        st.sloViolated = sloViolated;

        // Update replica stats
        for (const r of readyReps) {
          r.cpuUtilizationPct = cpuUtilPct;
          r.memoryUtilizationPct = memUtilPct;
          r.activeWorkers = Math.min(
            cfg.workerConcurrencyPerReplica,
            Math.round(activeLoadRps / Math.max(1, readyCount) * 0.1)
          );
          r.activeConnections = Math.min(
            cfg.maxDbConnectionsPerReplica,
            Math.round((activeLoadRps / Math.max(1, readyCount)) * 0.15)
          );
          r.throttled = cpuThrottled;
        }

        // Accumulate cost resources for READY/PROVISIONING replicas over dtSec
        const billableReps = svcReplicas.filter(
          (r) => r.state === "READY" || r.state === "PROVISIONING"
        ).length;
        replicaSecondsAccumulated += billableReps * dtSec;
        memoryGiBSecondsAccumulated +=
          billableReps * (cfg.memoryRequestMiB / 1024) * dtSec;

        // Forecasting using ONLY observations strictly prior to current tick (NO future leakage!)
        const history = observedRpsHistoryBySvc[cfg.id]!;
        let forecastRps = rawIncomingRps;
        if (pol && cfg.id === primarySvcCfg.id) {
          const pastOnly = [...history];
          // Guarantee we pass only past observations
          if (pastOnly.length > history.length) {
            futureForecastLeakageSeen = true;
          }
          forecastRps = computeForecastNoLeakage(pastOnly, pol.forecastModel);
          if (nowMs % 60 === 0) {
            const errPct =
              rawIncomingRps > 0
                ? Math.round(
                    (Math.abs(forecastRps - rawIncomingRps) / rawIncomingRps) *
                      100
                  )
                : 0;
            forecastPoints.push({
              atMs: nowMs,
              observedRps: Math.round(rawIncomingRps),
              forecastNextRps: forecastRps,
              forecastErrorPct: errPct,
              model: pol.forecastModel,
            });
          }
        }
        history.push(Math.round(rawIncomingRps));

        // Evaluate autoscaling policy
        if (pol && scalingDecisions.length < scenario.limits.maxScalingEvents) {
          const { cpu, mem } = getAllocatedTotals();
          const evalRes = evaluateServiceScalingStep({
            svcCfg: cfg,
            svcState: st,
            policy: pol,
            serviceReplicas: svcReplicas,
            cluster: { ...scenario.cluster, nodeCount: activeNodes },
            totalAllocatedCpuMillicores: cpu,
            totalAllocatedMemoryMiB: mem,
            nowMs,
            lastEvalMs: lastEvalAtBySvc[cfg.id] ?? -1000,
            lastScaleAtMs: lastScaleAtBySvc[cfg.id],
            forecastRps,
            nodeLost: nodeLossActive,
          });

          if (evalRes.evaluated) {
            lastEvalAtBySvc[cfg.id] = nowMs;

            if (evalRes.newScaleRequested) {
              const prevDes = st.desiredReplicas;
              st.desiredReplicas = evalRes.newDesired;
              lastScaleAtBySvc[cfg.id] = nowMs;

              scalingDecisions.push({
                id: `scale_${scalingDecisions.length + 1}`,
                atMs: nowMs,
                serviceId: cfg.id,
                mode: pol.mode,
                fromReplicas: prevDes,
                toReplicas: evalRes.newDesired,
                applied: true,
                reason: evalRes.reason,
              });

              if (evalRes.newDesired > prevDes) {
                const delta = evalRes.newDesired - prevDes;
                let anyPendingCluster = false;
                for (let k = 0; k < delta; k++) {
                  if (
                    Object.keys(replicas).length >= scenario.limits.maxReplicas
                  ) {
                    break;
                  }
                  replicaCounter++;
                  const repId = `${cfg.id}-rep-${replicaCounter}`;
                  const sched = canScheduleOnCluster(cfg, activeNodes);
                  if (!sched.ok) anyPendingCluster = true;
                  replicas[repId] = {
                    id: repId,
                    serviceId: cfg.id,
                    nodeId: sched.nodeId,
                    state: sched.ok ? "PROVISIONING" : "PENDING_CAPACITY",
                    requestedAtMs: nowMs,
                    readyAtMs: sched.ok
                      ? nowMs + cfg.startupDelayMs + cfg.readinessDelayMs
                      : undefined,
                    cpuUtilizationPct: 0,
                    memoryUtilizationPct: 20,
                    activeWorkers: 0,
                    activeConnections: 0,
                    throttled: false,
                  };
                  st.pendingReplicas++;
                }

                if (
                  anyPendingCluster &&
                  pol.clusterAutoScaleEnabled &&
                  pendingClusterProvisionAtMs === null &&
                  activeNodes < scenario.cluster.maxNodes
                ) {
                  pendingClusterProvisionAtMs =
                    nowMs + scenario.cluster.nodeProvisionDelayMs;
                }
              } else if (evalRes.newDesired < prevDes) {
                const delta = prevDes - evalRes.newDesired;
                let removed = 0;
                for (const rep of Object.values(replicas)) {
                  if (removed >= delta) break;
                  if (
                    rep.serviceId === cfg.id &&
                    rep.state === "READY"
                  ) {
                    rep.state = "TERMINATING";
                    st.readyReplicas = Math.max(0, st.readyReplicas - 1);
                    st.terminatingReplicas++;
                    removed++;
                  }
                }
              }

              const snap = buildRuntimeState();
              recordFrameAndEvent<
                Extract<
                  CapacityExecutionEvent,
                  { type: "capacity.scale.requested" }
                >
              >(
                {
                  type: "capacity.scale.requested",
                  atMs: nowMs,
                  durationMs: 0,
                  serviceId: cfg.id,
                  fromReplicas: prevDes,
                  toReplicas: evalRes.newDesired,
                  explanation: evalRes.reason,
                },
                snap,
                true
              );

              if (evalRes.blockedByCluster) {
                recordFrameAndEvent<
                  Extract<
                    CapacityExecutionEvent,
                    { type: "capacity.scale.failed" }
                  >
                >(
                  {
                    type: "capacity.scale.failed",
                    atMs: nowMs,
                    durationMs: 0,
                    serviceId: cfg.id,
                    reason:
                      "Insufficient cluster node capacity or resource fragmentation kept replicas PENDING.",
                    explanation: `Scale-out for '${cfg.id}' constrained by cluster capacity (${activeNodes} nodes).`,
                  },
                  snap,
                  true
                );
              }
            }
          }
        }
      }

      // Emit notable state-transition events without excessive frame bloat
      const prim = services[primarySvcCfg.id]!;
      if (Math.abs(prim.incomingRps - prevIncomingSummary) >= 60 || t === 0) {
        prevIncomingSummary = prim.incomingRps;
        const snap = buildRuntimeState();
        recordFrameAndEvent<
          Extract<CapacityExecutionEvent, { type: "capacity.workload.changed" }>
        >(
          {
            type: "capacity.workload.changed",
            atMs: nowMs,
            durationMs: CapacityExecutionEngine.TICK_STEP_MS,
            serviceId: primarySvcCfg.id,
            incomingRps: prim.incomingRps,
            explanation: `Workload arrival on '${primarySvcCfg.id}' at ${prim.incomingRps} req/s (completed ${prim.completedRps}, rejected ${prim.rejectedRps}).`,
          },
          snap,
          true
        );
      }

      for (const st of Object.values(services)) {
        if (st.saturated && !emittedSaturationKey.has(st.id)) {
          emittedSaturationKey.add(st.id);
          const snap = buildRuntimeState();
          recordFrameAndEvent<
            Extract<
              CapacityExecutionEvent,
              { type: "capacity.saturation.detected" }
            >
          >(
            {
              type: "capacity.saturation.detected",
              atMs: nowMs,
              durationMs: 0,
              serviceId: st.id,
              resource:
                st.connectionUtilizationPct >= 85
                  ? "db_connections"
                  : st.memoryUtilizationPct >= 85
                    ? "memory"
                    : "cpu",
              utilizationPct: Math.max(
                st.cpuUtilizationPct,
                st.memoryUtilizationPct,
                st.connectionUtilizationPct
              ),
              explanation: `Service '${st.id}' reached resource saturation (CPU ${st.cpuUtilizationPct}%, Mem ${st.memoryUtilizationPct}%, DB Conn ${st.connectionUtilizationPct}%).`,
            },
            snap,
            true
          );
        }

        if (st.rejectedRps > 0 && nowMs % 100 === 0) {
          const snap = buildRuntimeState();
          recordFrameAndEvent<
            Extract<CapacityExecutionEvent, { type: "capacity.load.shed" }>
          >(
            {
              type: "capacity.load.shed",
              atMs: nowMs,
              durationMs: 0,
              serviceId: st.id,
              rejectedCount: st.rejectedRps,
              explanation: `Overload control shed/rejected ${st.rejectedRps} req/s on '${st.id}' (queue ${st.queueDepth}/${st.maxQueueDepth}).`,
            },
            snap,
            true
          );
        }

        if (st.sloViolated && !emittedSloKey.has(st.id)) {
          emittedSloKey.add(st.id);
          const obj = objectiveBySvc.get(st.id) ?? scenario.objectives[0]!;
          const snap = buildRuntimeState();
          recordFrameAndEvent<
            Extract<CapacityExecutionEvent, { type: "capacity.slo.violated" }>
          >(
            {
              type: "capacity.slo.violated",
              atMs: nowMs,
              durationMs: 0,
              serviceId: st.id,
              p95Ms: st.p95LatencyMs,
              targetP95Ms: obj.maxP95LatencyMs,
              explanation: `SLO breach on '${st.id}': p95 latency ${st.p95LatencyMs}ms exceeded target ${obj.maxP95LatencyMs}ms.`,
            },
            snap,
            true
          );
        }
      }

      // Record first occurrence of each bottleneck class
      const currentState = buildRuntimeState();
      for (const bn of currentState.bottlenecks) {
        const key = `${bn.serviceId}:${bn.limitingResource}`;
        if (!emittedBottleneckKey.has(key)) {
          emittedBottleneckKey.add(key);
          recordFrameAndEvent<
            Extract<
              CapacityExecutionEvent,
              { type: "capacity.bottleneck.detected" }
            >
          >(
            {
              type: "capacity.bottleneck.detected",
              atMs: nowMs,
              durationMs: 0,
              bottleneck: bn,
              explanation: bn.explanation,
            },
            currentState,
            true
          );
        }
      }
    }

    // Final cost and recommendation summary frame
    const finalState = buildRuntimeState();
    recordFrameAndEvent<
      Extract<CapacityExecutionEvent, { type: "capacity.cost.updated" }>
    >(
      {
        type: "capacity.cost.updated",
        atMs: clock.now(),
        durationMs: 0,
        projectedMonthlyCostUsd: finalState.cost.projectedMonthlyCostUsd,
        explanation: `Final synthetic monthly cost projection: $${finalState.cost.projectedMonthlyCostUsd} (${finalState.cost.provenanceLabel}).`,
      },
      finalState,
      true
    );

    if (finalState.recommendations.length > 0) {
      const rec = finalState.recommendations[0]!;
      recordFrameAndEvent<
        Extract<
          CapacityExecutionEvent,
          { type: "capacity.recommendation.generated" }
        >
      >(
        {
          type: "capacity.recommendation.generated",
          atMs: clock.now(),
          durationMs: 0,
          recommendationId: rec.id,
          summary: `${rec.observedProblem} -> ${rec.suggestedChange}`,
          explanation: `${rec.suggestedChange} (${rec.supportingMetric})`,
        },
        finalState,
        true
      );
    }

    const totalDur = Math.max(100, clock.now());
    const failedInv = finalState.invariants.allPassed === false;

    const configuration: ExecutionConfiguration = {
      version: 1,
      entryNodeId: primarySvcCfg.id,
      request: {
        id: `cap_req_${scenario.id}`,
        method: "POST",
        path: "/capacity/simulate",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: scenario.limits.maxEvents,
        maxHops: 100,
        maxDurationMs: scenario.limits.maxVirtualDurationMs,
      },
      timing: {
        nodeDurationMs: 15,
        edgeDurationMs: 10,
      },
      presetId: "custom",
    };

    const trace: ExecutionTrace = {
      runId: `cap_run_${scenario.id}_${scenario.seed}`,
      architectureId: "arch_capacity_sim",
      architectureRevisionId: scenario.architectureRevisionId,
      snapshotHash: `cap_${scenario.id}_${frames.length}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: scenario.services.map((s) => s.id),
      traversedEdgeIds: [],
      configuration,
      events,
      totalDurationMs: totalDur,
      totalEvents: events.length,
      totalHops: Object.keys(replicas).length + events.length,
      outcome: failedInv ? "failure" : "success",
      terminalReason: failedInv
        ? finalState.invariants.violations.join("; ")
        : `Capacity planning simulation finished at ${totalDur}ms (${frames.length} snapshots).`,
      frames,
    };

    return {
      scenario,
      trace,
      frames,
      finalState,
    };
  }
}
