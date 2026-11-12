import type {
  ExecutionConfiguration,
  ExecutionEvent,
  ExecutionTrace,
  VisualizationFrame,
} from "../index";
import { RuntimeStateHelper } from "../domain/runtime-state";
import { DeterministicRandom } from "../resilience/deterministic-random";
import {
  TrafficControlScenarioSchema,
  type BackpressureRuntime,
  type DistributedGatewayRuntime,
  type LimiterInstanceState,
  type ModeledTrafficControlRuntimeState,
  type PriorityClass,
  type SyntheticRequestRuntime,
  type TenantFairnessRuntime,
  type TrafficControlMetrics,
  type TrafficControlScenario,
  type TrafficSourceConfig,
} from "./traffic-control-schemas";
import {
  advanceLimiterVirtualTime,
  snapshotLimiterInstance,
  type InternalLimiterRuntime,
} from "./algorithms/rate-limit-algorithms";
import { evaluateAtomicPoliciesAcrossTopology } from "./distributed/distributed-limiter";
import { BoundedQueueScheduler } from "./queueing/queue-scheduler";
import {
  adjustAdaptiveConcurrencyLimit,
  evaluateBackpressureTransition,
  shouldShedRequest,
} from "./overload/overload-controller";
import { TrafficControlInvariantMonitor } from "./invariants/traffic-control-invariants";

type SchedulerItem =
  | { kind: "request_arrival"; atMs: number; seq: number; req: SyntheticRequestRuntime; source: TrafficSourceConfig }
  | { kind: "service_complete"; atMs: number; seq: number; reqId: string; serviceTimeMs: number; willFail: boolean }
  | { kind: "periodic_tick"; atMs: number; seq: number }
  | { kind: "periodic_sync"; atMs: number; seq: number }
  | { kind: "fault_apply"; atMs: number; seq: number; faultId: string };

const PRIORITY_WEIGHT: Record<PriorityClass, number> = {
  critical: 5,
  standard: 2,
  background: 1,
};

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return Number(sorted[idx]!.toFixed(1));
}

export class TrafficControlExecutionEngine {
  public static runScenario(rawScenario: TrafficControlScenario): ExecutionTrace {
    const parsed = TrafficControlScenarioSchema.parse(rawScenario);
    const rng = new DeterministicRandom(parsed.seed);
    const baseRuntime = RuntimeStateHelper.createInitialState();
    const runId = `traffic_ctrl_${parsed.id}_${parsed.seed}`;

    let virtualTimeMs = 0;
    let seqCounter = 0;
    let eventCounter = 0;

    // Limits tracking
    const limiterStore: Record<string, InternalLimiterRuntime> = {};
    const gateways: Record<string, DistributedGatewayRuntime> = {};
    for (const gw of parsed.distributed.gateways) {
      gateways[gw.id] = {
        id: gw.id,
        label: gw.label,
        clockOffsetMs: gw.clockOffsetMs,
        allocatedQuota:
          gw.allocatedQuota ??
          Math.max(
            1,
            Math.floor(
              (parsed.policies[0]?.limit ?? parsed.policies[0]?.capacity ?? 12) /
                Math.max(1, parsed.distributed.gateways.length)
            )
          ),
        localUsed: 0,
        syncedGlobalEstimate: 0,
        requestsHandled: 0,
        rejected: 0,
      };
    }
    const gatewayIds = Object.keys(gateways);

    let centralStoreOnline = true;
    let downstreamLatencyMultiplier = 1;
    let downstreamForcedError = false;

    // Concurrency & queue state
    let effectiveMaxConcurrent = parsed.concurrency.enabled
      ? parsed.concurrency.maxConcurrent
      : 1000;
    const activeRequestIds = new Set<string>();
    let permitsAcquired = 0;
    let permitsReleased = 0;

    const queueScheduler = new BoundedQueueScheduler(
      parsed.queue.enabled ? parsed.queue.capacity : 0,
      parsed.queue.policy,
      parsed.queue.maxWaitMs,
      parsed.queue.agingBoostMs
    );

    const backpressure: BackpressureRuntime = {
      active: false,
      level: 0,
      sourceComponent: "service-runtime",
      targetComponent: "traffic-producer",
      signalType: "none",
      triggerThreshold: parsed.overload.enterQueueThreshold,
      recoveryThreshold: parsed.overload.exitQueueThreshold,
      producerRateMultiplier: 1,
      activatedCount: 0,
    };

    // Circuit breaker state
    let cbState: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
    let cbFailures = 0;
    let cbTrips = 0;
    let cbNextProbeAtMs: number | null = null;
    let cbHalfOpenInFlight = 0;

    // Retry budget
    let retryBudgetRemaining = parsed.retries.budgetMinTokens;
    let usedRetries = 0;
    let suppressedRetries = 0;

    // Load shedding & metrics tracking
    let shedActive = false;
    let shedTriggerReason = "Normal load";
    let offeredRequests = 0;
    let originalRequests = 0;
    let retryAttempts = 0;
    let admittedRequests = 0;
    let completedRequests = 0;
    let failedExecutions = 0;
    let rateLimitRejections = 0;
    let concurrencyRejections = 0;
    let queueOverflows = 0;
    let loadShedCount = 0;
    let circuitRejections = 0;
    let timeoutCount = 0;
    let cancelledCount = 0;
    let expiredQueueCount = 0;
    let maxObservedQueueDepth = 0;
    let lastAdaptiveAdjustAtMs = 0;

    const queueWaitSamples: number[] = [];
    const e2eLatencySamples: number[] = [];
    const requestsById = new Map<string, SyntheticRequestRuntime>();
    const recentRequests: SyntheticRequestRuntime[] = [];
    const tenantStats: Record<string, TenantFairnessRuntime> = {};
    const backpressureDelayedIds = new Set<string>();

    // Invariant flags
    const partialConsumeOnRejectDetected = false;
    const expiredExecutedDetected = false;
    const retryBudgetViolated = false;
    const invalidCircuitTransition = false;

    const getTenantStat = (tenantId: string): TenantFairnessRuntime => {
      if (!tenantStats[tenantId]) {
        tenantStats[tenantId] = {
          tenantId,
          offered: 0,
          admitted: 0,
          rejected: 0,
          completed: 0,
          totalWaitMs: 0,
          avgWaitMs: 0,
          capacitySharePct: 0,
          starving: false,
        };
      }
      return tenantStats[tenantId]!;
    };

    const recordRecent = (req: SyntheticRequestRuntime) => {
      const idx = recentRequests.findIndex((r) => r.id === req.id);
      const copy = { ...req };
      if (idx >= 0) {
        recentRequests[idx] = copy;
      } else {
        recentRequests.push(copy);
        if (recentRequests.length > 90) {
          recentRequests.shift();
        }
      }
    };

    const sampleServiceTimeMs = (): number => {
      const base = parsed.serviceCapacity.baseServiceTimeMs * downstreamLatencyMultiplier;
      const dist = parsed.serviceCapacity.distribution;
      let val = base;
      if (dist === "uniform") {
        val = base * (0.7 + rng.next() * 0.6);
      } else if (dist === "exponential") {
        const u = Math.max(0.05, Math.min(0.99, rng.next()));
        val = base * (-Math.log(1 - u));
      } else if (dist === "log_normal") {
        const z = rng.next() + rng.next() + rng.next() - 1.5;
        val = base * Math.exp(z * 0.35);
      } else if (dist === "discrete") {
        val = rng.next() < 0.8 ? base : base * 2.5;
      }
      return Math.max(2, Math.min(2500, Math.round(val)));
    };

    const buildConsistencyCaveats = (): string[] => {
      const caveats = [
        "All traffic, tokens, queues, and latencies are simulated synthetically under deterministic virtual time.",
      ];
      if (parsed.policies.some((p) => p.algorithm === "sliding_window_counter")) {
        caveats.push(
          "Sliding-window counter uses linear overlap interpolation (cur + prev * (1 - elapsed/window)) and is an approximation."
        );
      }
      if (parsed.distributed.mode === "local_independent") {
        caveats.push(
          "Local independent limiters can overshoot aggregate global limits by up to GatewayCount x Limit."
        );
      } else if (parsed.distributed.mode === "centralized") {
        caveats.push(
          `Centralized limiter enforces global consistency at +${parsed.distributed.centralLatencyMs}ms coordination RTT.`
        );
      } else if (parsed.distributed.mode === "periodic_sync") {
        caveats.push(
          `Periodic sync introduces up to ${parsed.distributed.syncIntervalMs}ms staleness between gateway views.`
        );
      }
      if (parsed.concurrency.adaptive.enabled) {
        caveats.push(
          "Adaptive concurrency uses a bounded educational AIMD/latency gradient approximation with hysteresis."
        );
      }
      if (parsed.queue.policy === "wfq") {
        caveats.push(
          "Weighted fair queueing uses bounded virtual finish-tag scheduling rather than continuous GPS."
        );
      }
      return caveats;
    };

    const snapshotTrafficControlState = (): ModeledTrafficControlRuntimeState => {
      const limSnapshots: Record<string, LimiterInstanceState> = {};
      for (const [k, rt] of Object.entries(limiterStore)) {
        advanceLimiterVirtualTime(rt, virtualTimeMs);
        limSnapshots[k] = snapshotLimiterInstance(rt, virtualTimeMs);
      }

      const sortedWaits = [...queueWaitSamples].sort((a, b) => a - b);
      const sortedLat = [...e2eLatencySamples].sort((a, b) => a - b);
      const avgWait =
        sortedWaits.length > 0
          ? Number(
              (
                sortedWaits.reduce((acc, v) => acc + v, 0) / sortedWaits.length
              ).toFixed(1)
            )
          : 0;
      const elapsedSec = Math.max(0.05, virtualTimeMs / 1000);
      const totalRejected =
        rateLimitRejections +
        concurrencyRejections +
        queueOverflows +
        loadShedCount +
        circuitRejections +
        timeoutCount;

      const totalCompletedAllTenants = Object.values(tenantStats).reduce(
        (s, t) => s + t.completed,
        0
      );
      const clonedTenants: Record<string, TenantFairnessRuntime> = {};
      for (const [tid, ts] of Object.entries(tenantStats)) {
        const share =
          totalCompletedAllTenants > 0
            ? Number(((ts.completed / totalCompletedAllTenants) * 100).toFixed(1))
            : 0;
        clonedTenants[tid] = {
          ...ts,
          avgWaitMs:
            ts.admitted > 0
              ? Number((ts.totalWaitMs / ts.admitted).toFixed(1))
              : 0,
          capacitySharePct: share,
          starving: ts.offered >= 4 && ts.completed === 0 && ts.rejected >= 3,
        };
      }

      const avgLatencySec =
        sortedLat.length > 0
          ? sortedLat.reduce((acc, v) => acc + v, 0) / sortedLat.length / 1000
          : 0;
      const throughputPerSec = Number((completedRequests / elapsedSec).toFixed(2));
      const littleL = Number((throughputPerSec * avgLatencySec).toFixed(2));

      const invariants = TrafficControlInvariantMonitor.verify({
        limiters: limSnapshots,
        queueDepth: queueScheduler.size(),
        queueCapacity: parsed.queue.enabled ? parsed.queue.capacity : 0,
        activeConcurrency: activeRequestIds.size,
        maxConcurrency: effectiveMaxConcurrent,
        permitsAcquired,
        permitsReleased,
        partialConsumeOnRejectDetected,
        expiredExecutedDetected,
        retryBudgetViolated,
        invalidCircuitTransition,
      });

      const metrics: TrafficControlMetrics = {
        offeredRequests,
        originalRequests,
        retryAttempts,
        admittedRequests,
        completedRequests,
        failedExecutions,
        rateLimitRejections,
        concurrencyRejections,
        queueOverflows,
        loadShedCount,
        circuitRejections,
        timeoutCount,
        cancelledCount,
        suppressedRetries,
        offeredRatePerSec: Number((offeredRequests / elapsedSec).toFixed(2)),
        admittedRatePerSec: Number((admittedRequests / elapsedSec).toFixed(2)),
        completedThroughputPerSec: throughputPerSec,
        rejectionRatePct:
          offeredRequests > 0
            ? Number(((totalRejected / offeredRequests) * 100).toFixed(1))
            : 0,
        activeConcurrency: activeRequestIds.size,
        effectiveMaxConcurrent,
        queueDepth: queueScheduler.size(),
        maxObservedQueueDepth,
        avgQueueWaitMs: avgWait,
        p50LatencyMs: computePercentile(sortedLat, 50),
        p95LatencyMs: computePercentile(sortedLat, 95),
        p99LatencyMs: computePercentile(sortedLat, 99),
        retryAmplification:
          originalRequests > 0
            ? Number((offeredRequests / originalRequests).toFixed(2))
            : 1,
        utilizationPct: Number(
          (
            (activeRequestIds.size / Math.max(1, effectiveMaxConcurrent)) *
            100
          ).toFixed(1)
        ),
      };

      return {
        virtualTimeMs,
        evaluationMode: parsed.evaluationMode,
        distributedMode: parsed.distributed.mode,
        centralStoreOnline,
        failBehavior: parsed.distributed.failBehavior,
        limiters: limSnapshots,
        gateways: JSON.parse(JSON.stringify(gateways)),
        concurrency: {
          maxConcurrent: parsed.concurrency.maxConcurrent,
          effectiveMaxConcurrent,
          adaptiveEnabled: parsed.concurrency.adaptive.enabled,
          activeRequestIds: Array.from(activeRequestIds),
          waitingRequestIds: queueScheduler.snapshotItems().map((x) => x.id),
          permitsAcquired,
          permitsReleased,
        },
        queue: {
          capacity: parsed.queue.enabled ? parsed.queue.capacity : 0,
          policy: parsed.queue.policy,
          depth: queueScheduler.size(),
          items: queueScheduler.snapshotItems(),
          expiredCount: expiredQueueCount,
          overflowCount: queueOverflows,
          avgWaitMs: avgWait,
          p50WaitMs: computePercentile(sortedWaits, 50),
          p95WaitMs: computePercentile(sortedWaits, 95),
          maxWaitMs:
            sortedWaits.length > 0 ? sortedWaits[sortedWaits.length - 1]! : 0,
        },
        backpressure: { ...backpressure },
        loadShedding: {
          enabled: parsed.overload.loadSheddingEnabled,
          active: shedActive,
          policy: parsed.overload.shedPolicy,
          triggerReason: shedTriggerReason,
          shedCount: loadShedCount,
        },
        retryBudget: {
          enabled: parsed.retries.enabled,
          remaining: retryBudgetRemaining,
          usedRetries,
          suppressedRetries,
        },
        circuitBreaker: {
          enabled: parsed.circuitBreaker.enabled,
          state: cbState,
          failureCount: cbFailures,
          tripCount: cbTrips,
          nextProbeAtMs: cbNextProbeAtMs,
        },
        tenantFairness: clonedTenants,
        recentRequests: recentRequests.map((r) => ({ ...r })),
        littlesLaw: {
          avgInSystemL: littleL,
          throughputPerSecLambda: throughputPerSec,
          avgSystemTimeSecW: Number(avgLatencySec.toFixed(3)),
          steadyStateCaveat:
            "L = lambda * W strictly holds only in stable steady state without growing unbounded queues.",
        },
        consistencyCaveats: buildConsistencyCaveats(),
        invariants,
        metrics,
      };
    };

    const events: ExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];

    const nextEvtBase = () => {
      const seq = ++eventCounter;
      return {
        id: `tce_${seq}`,
        sequence: seq,
        atMs: virtualTimeMs,
        durationMs: 0,
        explanation: "",
        traceId: parsed.id,
        spanId: `span_${seq}`,
      };
    };

    const emitFrame = (
      event: ExecutionEvent,
      title: string,
      explanation: string,
      activeNodeIds: string[] = []
    ) => {
      events.push(event);
      const snapshot = RuntimeStateHelper.cloneState(baseRuntime);
      snapshot.trafficControlState = snapshotTrafficControlState();
      frames.push({
        frameIndex: frames.length,
        virtualTimeMs,
        activeNodeIds,
        activeEdgeIds: [],
        activeEvent: { ...event, explanation },
        direction: "request",
        stepTitle: title,
        stepExplanation: explanation,
        runtimeState: snapshot,
      });
    };

    type NewSchedulerItem = SchedulerItem extends infer U
      ? U extends SchedulerItem
        ? Omit<U, "seq"> & { seq?: number }
        : never
      : never;

    const schedulerQueue: SchedulerItem[] = [];
    const schedule = (item: NewSchedulerItem) => {
      if (item.atMs > parsed.limits.maxVirtualDurationMs) return;
      const entry = { ...item, seq: ++seqCounter } as SchedulerItem;
      schedulerQueue.push(entry);
      schedulerQueue.sort((a, b) => a.atMs - b.atMs || a.seq - b.seq);
    };

    // Generate deterministic synthetic traffic arrivals
    let generatedCount = 0;
    for (let sIdx = 0; sIdx < Math.min(parsed.sources.length, parsed.limits.maxSources); sIdx++) {
      const src = parsed.sources[sIdx]!;
      const start = src.startAtMs;
      const end = Math.min(src.endAtMs, parsed.limits.maxVirtualDurationMs);
      let t = start;
      let localIdx = 0;

      while (t <= end && generatedCount < parsed.limits.maxRequests) {
        const emitRequestAt = (emitTime: number) => {
          if (emitTime > end || generatedCount >= parsed.limits.maxRequests) return;
          generatedCount += 1;
          localIdx += 1;
          const gwId =
            gatewayIds[(generatedCount - 1) % Math.max(1, gatewayIds.length)] ??
            "gw-1";
          const reqId = `${src.id}-r${localIdx}`;
          const req: SyntheticRequestRuntime = {
            id: reqId,
            rootRequestId: reqId,
            sourceId: src.id,
            gatewayId: gwId,
            tenantId: src.tenantId,
            userId: src.userId,
            apiKeyId: src.apiKeyId,
            clientIp: src.clientIp,
            route: src.route,
            method: src.method,
            priority: src.priority,
            priorityWeight: PRIORITY_WEIGHT[src.priority],
            cost: src.cost,
            attempt: 1,
            createdAtMs: Math.round(emitTime),
            deadlineMs:
              src.deadlineMs !== undefined
                ? Math.round(emitTime + src.deadlineMs)
                : undefined,
            state: "CREATED",
            reason: "Synthesized arrival",
          };
          schedule({
            kind: "request_arrival",
            atMs: Math.round(emitTime),
            req,
            source: src,
          });
        };

        if (src.pattern === "bursty" && localIdx % src.burstSize === 0) {
          for (let b = 0; b < src.burstSize; b++) {
            emitRequestAt(t + b * 2);
          }
          const stepMs = Math.max(20, Math.round((1000 / src.requestsPerSecond) * src.burstSize));
          t += stepMs;
        } else if (src.pattern === "periodic_spike" && localIdx % 10 === 0) {
          for (let b = 0; b < src.burstSize; b++) {
            emitRequestAt(t + b * 3);
          }
          t += Math.max(15, Math.round(1000 / src.requestsPerSecond));
        } else {
          emitRequestAt(t);
          const progress = (t - start) / Math.max(1, end - start);
          let effectiveRps = src.requestsPerSecond;
          if (src.pattern === "step" && progress >= 0.4) effectiveRps *= 2.5;
          if (src.pattern === "ramp_up") effectiveRps *= 0.5 + progress * 2;
          if (src.pattern === "flash_crowd" && progress >= 0.25 && progress <= 0.65) {
            effectiveRps *= 3;
          }
          t += Math.max(4, Math.round(1000 / effectiveRps));
        }
      }
    }

    // Schedule faults
    for (const f of parsed.faults) {
      schedule({ kind: "fault_apply", atMs: f.atMs, faultId: f.id });
    }

    // Schedule periodic drain/expiration/adaptive ticks
    for (let tick = 50; tick <= Math.min(2000, parsed.limits.maxVirtualDurationMs); tick += 50) {
      schedule({ kind: "periodic_tick", atMs: tick });
    }

    if (parsed.distributed.mode === "periodic_sync") {
      for (
        let sTick = parsed.distributed.syncIntervalMs;
        sTick <= parsed.limits.maxVirtualDurationMs;
        sTick += parsed.distributed.syncIntervalMs
      ) {
        schedule({ kind: "periodic_sync", atMs: sTick });
      }
    }

    const startServiceExecution = (
      req: SyntheticRequestRuntime,
      queuedWaitMs: number,
      additionalLatencyMs: number
    ) => {
      activeRequestIds.add(req.id);
      permitsAcquired += 1;
      req.state = "ACTIVE";
      req.startedAtMs = virtualTimeMs;
      const tStat = getTenantStat(req.tenantId);
      tStat.totalWaitMs += queuedWaitMs;

      const sTime = sampleServiceTimeMs() + additionalLatencyMs;
      const overloadFailProb =
        activeRequestIds.size >= effectiveMaxConcurrent
          ? parsed.serviceCapacity.overloadFailureRate
          : parsed.serviceCapacity.failureRateBase;
      const willFail = downstreamForcedError || rng.next() < overloadFailProb;

      emitFrame(
        {
          ...nextEvtBase(),
          type: "traffic.concurrency.acquired",
          requestId: req.id,
          active: activeRequestIds.size,
          limit: effectiveMaxConcurrent,
        },
        `Execution Started: ${req.id}`,
        `Concurrency permit acquired (${activeRequestIds.size}/${effectiveMaxConcurrent}); service latency=${sTime}ms.`,
        [req.gatewayId, "service-runtime"]
      );

      schedule({
        kind: "service_complete",
        atMs: virtualTimeMs + sTime,
        reqId: req.id,
        serviceTimeMs: sTime,
        willFail,
      });
    };

    const scheduleRetryIfBudgetAllows = (
      req: SyntheticRequestRuntime,
      source: TrafficSourceConfig,
      failureReason: string
    ) => {
      if (!parsed.retries.enabled || req.attempt >= parsed.retries.maxAttempts) {
        return;
      }

      if (retryBudgetRemaining < 1) {
        suppressedRetries += 1;
        emitFrame(
          {
            ...nextEvtBase(),
            type: "traffic.retry.suppressed",
            requestId: req.id,
            reason: "Retry budget exhausted; suppressing storm retries",
          },
          `Retry Suppressed: ${req.id}`,
          `Retry suppressed for ${req.id} (${failureReason}) because retry budget is depleted.`,
          [req.sourceId]
        );
        return;
      }

      const expFactor = parsed.retries.exponentialBackoff
        ? Math.pow(2, req.attempt - 1)
        : 1;
      const jitter = 1 + (rng.next() * 2 - 1) * parsed.retries.jitterRatio;
      let delayMs = Math.max(5, Math.round(parsed.retries.baseBackoffMs * expFactor * jitter));
      if (parsed.retries.honorRetryAfter && req.retryAfterMs !== undefined) {
        delayMs = Math.max(delayMs, req.retryAfterMs);
      }

      if (req.deadlineMs !== undefined && virtualTimeMs + delayMs >= req.deadlineMs) {
        suppressedRetries += 1;
        emitFrame(
          {
            ...nextEvtBase(),
            type: "traffic.retry.suppressed",
            requestId: req.id,
            reason: "Retry would exceed end-to-end request deadline",
          },
          `Retry Skipped (Deadline): ${req.id}`,
          `Retry suppressed because backoff ${delayMs}ms exceeds deadline.`,
          [req.sourceId]
        );
        return;
      }

      retryBudgetRemaining -= 1;
      usedRetries += 1;

      const retryReq: SyntheticRequestRuntime = {
        ...req,
        id: `${req.rootRequestId}#try${req.attempt + 1}`,
        attempt: req.attempt + 1,
        createdAtMs: virtualTimeMs + delayMs,
        state: "CREATED",
        reason: `Retry #${req.attempt + 1} after ${failureReason}`,
      };

      emitFrame(
        {
          ...nextEvtBase(),
          type: "traffic.retry.scheduled",
          requestId: req.id,
          attempt: retryReq.attempt,
          delayMs,
        },
        `Retry Scheduled: ${retryReq.id}`,
        `Retry attempt #${retryReq.attempt} scheduled in ${delayMs}ms (budget left: ${retryBudgetRemaining}).`,
        [req.sourceId]
      );

      schedule({
        kind: "request_arrival",
        atMs: virtualTimeMs + delayMs,
        req: retryReq,
        source,
      });
    };

    const tryDispatchNextFromQueue = () => {
      // Purge expired items first so expired requests never execute
      const expired = queueScheduler.purgeExpired(virtualTimeMs);
      for (const expReq of expired) {
        expiredQueueCount += 1;
        timeoutCount += 1;
        expReq.state = "TIMED_OUT";
        expReq.decision = "EXPIRED_DEADLINE";
        expReq.reason = "Expired in queue past deadline/maxWait";
        recordRecent(expReq);
        emitFrame(
          {
            ...nextEvtBase(),
            type: "traffic.request.timed_out",
            requestId: expReq.id,
            reason: expReq.reason,
          },
          `Queue Item Expired: ${expReq.id}`,
          expReq.reason,
          ["bounded-queue"]
        );
      }

      while (
        activeRequestIds.size < effectiveMaxConcurrent &&
        queueScheduler.size() > 0
      ) {
        const nextEntry = queueScheduler.dequeueNext(virtualTimeMs);
        if (!nextEntry) break;
        const waitMs = Math.max(0, virtualTimeMs - nextEntry.enqueuedAtMs);
        queueWaitSamples.push(waitMs);

        emitFrame(
          {
            ...nextEvtBase(),
            type: "traffic.queue.dequeued",
            requestId: nextEntry.req.id,
            waitMs,
            depth: queueScheduler.size(),
          },
          `Dequeued: ${nextEntry.req.id}`,
          `Dequeued under ${parsed.queue.policy} after ${waitMs}ms wait (depth=${queueScheduler.size()}).`,
          ["bounded-queue", "service-runtime"]
        );

        startServiceExecution(nextEntry.req, waitMs, 0);
      }
    };

    const checkBackpressureAndRecord = () => {
      const bpChange = evaluateBackpressureTransition({
        bp: backpressure,
        queueDepth: queueScheduler.size(),
        queueCapacity: parsed.queue.enabled ? parsed.queue.capacity : 0,
        activeConcurrency: activeRequestIds.size,
        maxConcurrency: effectiveMaxConcurrent,
        config: parsed.overload,
      });

      if (bpChange === "activated") {
        emitFrame(
          {
            ...nextEvtBase(),
            type: "traffic.backpressure.activated",
            sourceComponent: backpressure.sourceComponent,
            targetComponent: backpressure.targetComponent,
            pressure: backpressure.level,
          },
          `Backpressure Activated (${(backpressure.level * 100).toFixed(0)}%)`,
          `Queue/concurrency utilization triggered ${backpressure.signalType} upstream signal.`,
          ["bounded-queue", "service-runtime"]
        );
      } else if (bpChange === "released") {
        emitFrame(
          {
            ...nextEvtBase(),
            type: "traffic.backpressure.released",
            sourceComponent: backpressure.sourceComponent,
          },
          "Backpressure Released",
          `Downstream pressure dropped to ${(backpressure.level * 100).toFixed(0)}% (<= exit threshold).`,
          ["bounded-queue"]
        );
      }
    };

    // Main discrete-event loop
    while (schedulerQueue.length > 0 && events.length < parsed.limits.maxEvents) {
      const item = schedulerQueue.shift()!;
      virtualTimeMs = item.atMs;

      if (item.kind === "fault_apply") {
        const fault = parsed.faults.find((f) => f.id === item.faultId);
        if (!fault) continue;
        if (fault.type === "central_store_down") {
          centralStoreOnline = false;
        } else if (fault.type === "central_store_recover") {
          centralStoreOnline = true;
        } else if (fault.type === "downstream_slow") {
          downstreamLatencyMultiplier = fault.multiplier ?? 4;
        } else if (fault.type === "downstream_error") {
          downstreamForcedError = true;
        } else if (fault.type === "downstream_recover") {
          downstreamLatencyMultiplier = 1;
          downstreamForcedError = false;
        } else if (fault.type === "cancel_queued") {
          const cancelled = queueScheduler.cancelOne();
          if (cancelled) {
            cancelledCount += 1;
            cancelled.state = "CANCELLED";
            cancelled.reason = "Cancelled while waiting in queue";
            recordRecent(cancelled);
          }
        }
        continue;
      }

      if (item.kind === "periodic_sync") {
        const totalLocal = Object.values(gateways).reduce((s, g) => s + g.localUsed, 0);
        for (const g of Object.values(gateways)) {
          g.syncedGlobalEstimate = totalLocal;
        }
        continue;
      }

      if (item.kind === "periodic_tick") {
        tryDispatchNextFromQueue();
        checkBackpressureAndRecord();

        // Circuit breaker open -> half-open check
        if (
          parsed.circuitBreaker.enabled &&
          cbState === "OPEN" &&
          cbNextProbeAtMs !== null &&
          virtualTimeMs >= cbNextProbeAtMs
        ) {
          cbState = "HALF_OPEN";
          cbHalfOpenInFlight = 0;
        }

        // Adaptive concurrency check
        if (
          parsed.concurrency.enabled &&
          parsed.concurrency.adaptive.enabled &&
          virtualTimeMs - lastAdaptiveAdjustAtMs >=
            parsed.concurrency.adaptive.adjustIntervalMs
        ) {
          lastAdaptiveAdjustAtMs = virtualTimeMs;
          const recentLat =
            e2eLatencySamples.length > 0
              ? e2eLatencySamples.slice(-10).reduce((a, b) => a + b, 0) /
                Math.min(10, e2eLatencySamples.length)
              : 0;
          const adj = adjustAdaptiveConcurrencyLimit({
            currentLimit: effectiveMaxConcurrent,
            minLimit: parsed.concurrency.adaptive.minLimit,
            maxLimit: parsed.concurrency.adaptive.maxLimit,
            observedAvgLatencyMs: recentLat,
            targetLatencyMs: parsed.concurrency.adaptive.targetLatencyMs,
            errorRate:
              completedRequests + failedExecutions > 0
                ? failedExecutions / (completedRequests + failedExecutions)
                : 0,
            queueDepth: queueScheduler.size(),
          });
          effectiveMaxConcurrent = adj.nextLimit;
        }
        continue;
      }

      if (item.kind === "service_complete") {
        const req = requestsById.get(item.reqId);
        if (!req) continue;

        activeRequestIds.delete(req.id);
        permitsReleased += 1;
        if (cbState === "HALF_OPEN" && cbHalfOpenInFlight > 0) {
          cbHalfOpenInFlight -= 1;
        }

        emitFrame(
          {
            ...nextEvtBase(),
            type: "traffic.concurrency.released",
            requestId: req.id,
            active: activeRequestIds.size,
          },
          `Permit Released: ${req.id}`,
          `Service finished for ${req.id}; active concurrency=${activeRequestIds.size}.`,
          ["service-runtime"]
        );

        const totalLatencyMs = Math.max(1, virtualTimeMs - req.createdAtMs);
        e2eLatencySamples.push(totalLatencyMs);

        if (item.willFail) {
          failedExecutions += 1;
          req.completedAtMs = virtualTimeMs;
          req.state = "REJECTED";
          req.reason = "Downstream execution failure";
          recordRecent(req);

          if (parsed.circuitBreaker.enabled) {
            cbFailures += 1;
            if (cbState === "HALF_OPEN" || cbFailures >= parsed.circuitBreaker.failureThreshold) {
              cbState = "OPEN";
              cbTrips += 1;
              cbNextProbeAtMs = virtualTimeMs + parsed.circuitBreaker.openDurationMs;
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "traffic.circuit.opened",
                  failureCount: cbFailures,
                  openDurationMs: parsed.circuitBreaker.openDurationMs,
                },
                `Circuit Breaker OPEN (trip #${cbTrips})`,
                `Circuit opened after ${cbFailures} failures; fast-failing until t=${cbNextProbeAtMs}ms.`,
                ["circuit-breaker"]
              );
            }
          }

          emitFrame(
            {
              ...nextEvtBase(),
              type: "traffic.request.completed",
              requestId: req.id,
              latencyMs: totalLatencyMs,
              success: false,
            },
            `Execution Failed: ${req.id}`,
            `Downstream failure after ${totalLatencyMs}ms.`,
            ["service-runtime"]
          );

          const srcCfg =
            parsed.sources.find((s) => s.id === req.sourceId) ?? parsed.sources[0]!;
          scheduleRetryIfBudgetAllows(req, srcCfg, "downstream error");
        } else {
          completedRequests += 1;
          req.completedAtMs = virtualTimeMs;
          req.state = "COMPLETED";
          req.reason = `Completed in ${totalLatencyMs}ms`;
          recordRecent(req);

          getTenantStat(req.tenantId).completed += 1;
          if (parsed.retries.enabled) {
            // Replenish budget fractionally on original successful completion
            if (req.attempt === 1 && rng.next() < parsed.retries.budgetRatio) {
              retryBudgetRemaining += 1;
            }
          }

          if (parsed.circuitBreaker.enabled && cbState === "HALF_OPEN") {
            cbState = "CLOSED";
            cbFailures = 0;
            cbNextProbeAtMs = null;
            emitFrame(
              {
                ...nextEvtBase(),
                type: "traffic.circuit.closed",
                reason: "Half-open probe succeeded; circuit recovered to CLOSED",
              },
              "Circuit Breaker CLOSED",
              "Half-open health probe succeeded; restoring normal traffic.",
              ["circuit-breaker"]
            );
          }

          emitFrame(
            {
              ...nextEvtBase(),
              type: "traffic.request.completed",
              requestId: req.id,
              latencyMs: totalLatencyMs,
              success: true,
            },
            `Completed: ${req.id}`,
            `Request completed in ${totalLatencyMs}ms.`,
            ["service-runtime"]
          );
        }

        tryDispatchNextFromQueue();
        checkBackpressureAndRecord();
        continue;
      }

      if (item.kind === "request_arrival") {
        const { req, source } = item;

        // If backpressure active & not already delayed, throttle original producer dispatch once
        if (
          backpressure.active &&
          backpressure.producerRateMultiplier < 1 &&
          req.attempt === 1 &&
          !backpressureDelayedIds.has(req.id) &&
          rng.next() > backpressure.producerRateMultiplier
        ) {
          backpressureDelayedIds.add(req.id);
          const delayShift = Math.round(45 / backpressure.producerRateMultiplier);
          req.createdAtMs = virtualTimeMs + delayShift;
          schedule({
            kind: "request_arrival",
            atMs: virtualTimeMs + delayShift,
            req,
            source,
          });
          continue;
        }

        requestsById.set(req.id, req);
        offeredRequests += 1;
        if (req.attempt === 1) {
          originalRequests += 1;
        } else {
          retryAttempts += 1;
        }

        const gw = gateways[req.gatewayId] ?? Object.values(gateways)[0]!;
        gw.requestsHandled += 1;

        const tStat = getTenantStat(req.tenantId);
        tStat.offered += 1;

        recordRecent(req);
        emitFrame(
          {
            ...nextEvtBase(),
            type: "traffic.request.created",
            requestId: req.id,
            tenantId: req.tenantId,
            route: req.route,
            attempt: req.attempt,
          },
          `Request Arrived: ${req.id}`,
          `${req.method} ${req.route} (tenant=${req.tenantId}, priority=${req.priority}, try=${req.attempt}).`,
          [req.sourceId, gw.id]
        );

        // 0. Check expired deadline on arrival
        if (req.deadlineMs !== undefined && virtualTimeMs > req.deadlineMs) {
          timeoutCount += 1;
          tStat.rejected += 1;
          req.state = "TIMED_OUT";
          req.decision = "EXPIRED_DEADLINE";
          req.reason = "Request arrived past deadline";
          recordRecent(req);
          emitFrame(
            {
              ...nextEvtBase(),
              type: "traffic.request.timed_out",
              requestId: req.id,
              reason: req.reason,
            },
            `Expired Before Admission: ${req.id}`,
            req.reason,
            [gw.id]
          );
          continue;
        }

        // 1. Check Circuit Breaker
        if (parsed.circuitBreaker.enabled) {
          if (cbState === "OPEN" && cbNextProbeAtMs !== null && virtualTimeMs >= cbNextProbeAtMs) {
            cbState = "HALF_OPEN";
            cbHalfOpenInFlight = 0;
          }

          if (
            cbState === "OPEN" ||
            (cbState === "HALF_OPEN" &&
              cbHalfOpenInFlight >= parsed.circuitBreaker.halfOpenMaxProbes)
          ) {
            circuitRejections += 1;
            tStat.rejected += 1;
            req.state = "REJECTED";
            req.decision = "CIRCUIT_OPEN";
            req.reason = `Circuit breaker ${cbState} rejected call before downstream execution`;
            recordRecent(req);
            emitFrame(
              {
                ...nextEvtBase(),
                type: "traffic.rate_limit.checked",
                requestId: req.id,
                policyIds: [],
                decision: "CIRCUIT_OPEN",
              },
              `Circuit Rejected: ${req.id}`,
              req.reason,
              ["circuit-breaker"]
            );
            continue;
          }
          if (cbState === "HALF_OPEN") {
            cbHalfOpenInFlight += 1;
          }
        }

        // 2. Evaluate Rate Limit Policies (atomic multi-policy check + topology)
        req.state = "RATE_LIMIT_CHECK";
        const rlOutcome = evaluateAtomicPoliciesAcrossTopology({
          mode: parsed.distributed.mode,
          failBehavior: parsed.distributed.failBehavior,
          centralStoreOnline,
          centralLatencyMs: parsed.distributed.centralLatencyMs,
          evaluationMode: parsed.evaluationMode,
          policies: parsed.policies,
          limiterStore,
          gateway: gw,
          request: req,
          nowMs: virtualTimeMs,
        });

        if (!rlOutcome.allowed) {
          rateLimitRejections += 1;
          tStat.rejected += 1;
          req.state = "REJECTED";
          req.decision = "REJECT_RATE_LIMIT";
          req.retryAfterMs = rlOutcome.retryAfterMs;
          req.reason = rlOutcome.reason;
          recordRecent(req);
          emitFrame(
            {
              ...nextEvtBase(),
              type: "traffic.rate_limit.rejected",
              requestId: req.id,
              policyId: rlOutcome.failingPolicyId ?? "policy",
              reason: rlOutcome.reason,
            },
            `Rate Limited: ${req.id}`,
            rlOutcome.reason,
            [gw.id, "rate-limiter"]
          );
          scheduleRetryIfBudgetAllows(req, source, "rate limited");
          continue;
        }

        // Log token/window consumption
        if (rlOutcome.consumedRecords.length > 0) {
          const firstConsumed = rlOutcome.consumedRecords[0]!;
          if (firstConsumed.remainingTokens !== undefined) {
            events.push({
              ...nextEvtBase(),
              type: "traffic.token.consumed",
              requestId: req.id,
              policyId: firstConsumed.policyId,
              cost: firstConsumed.cost,
              remainingTokens: firstConsumed.remainingTokens,
            });
          }
        }

        // 3. Evaluate Load Shedding under overload
        const recentAvgLat =
          e2eLatencySamples.length > 0
            ? e2eLatencySamples.slice(-8).reduce((a, b) => a + b, 0) /
              Math.min(8, e2eLatencySamples.length)
            : parsed.serviceCapacity.baseServiceTimeMs;

        const shedDecision = shouldShedRequest({
          req,
          nowMs: virtualTimeMs,
          queueDepth: queueScheduler.size(),
          queueCapacity: parsed.queue.enabled ? parsed.queue.capacity : 0,
          activeConcurrency: activeRequestIds.size,
          maxConcurrency: effectiveMaxConcurrent,
          recentAvgLatencyMs: recentAvgLat,
          baseServiceTimeMs: parsed.serviceCapacity.baseServiceTimeMs,
          config: parsed.overload,
          rng,
        });

        if (shedDecision.shed) {
          shedActive = true;
          shedTriggerReason = shedDecision.reason;
          loadShedCount += 1;
          tStat.rejected += 1;
          req.state = "REJECTED";
          req.decision = "REJECT_OVERLOAD";
          req.reason = shedDecision.reason;
          recordRecent(req);
          emitFrame(
            {
              ...nextEvtBase(),
              type: "traffic.load_shed",
              requestId: req.id,
              policy: parsed.overload.shedPolicy,
              reason: shedDecision.reason,
            },
            `Load Shed: ${req.id}`,
            shedDecision.reason,
            ["admission-controller"]
          );
          continue;
        }

        // 4. Concurrency Check -> Admit directly or Enqueue
        if (activeRequestIds.size < effectiveMaxConcurrent) {
          admittedRequests += 1;
          tStat.admitted += 1;
          req.state = "ADMITTED";
          req.decision = "ALLOW";
          req.reason = "Admitted directly with concurrency permit";
          recordRecent(req);
          startServiceExecution(req, 0, rlOutcome.effectiveLatencyAddedMs);
        } else if (parsed.queue.enabled && parsed.queue.capacity > 0) {
          const enq = queueScheduler.enqueue(req, virtualTimeMs, source.tenantWeight);
          if (enq.ok) {
            admittedRequests += 1;
            tStat.admitted += 1;
            req.decision = "ALLOW";
            req.reason = enq.reason;
            maxObservedQueueDepth = Math.max(maxObservedQueueDepth, queueScheduler.size());
            recordRecent(req);
            emitFrame(
              {
                ...nextEvtBase(),
                type: "traffic.queue.enqueued",
                requestId: req.id,
                depth: queueScheduler.size(),
                capacity: parsed.queue.capacity,
              },
              `Queued: ${req.id}`,
              enq.reason,
              ["bounded-queue"]
            );
            checkBackpressureAndRecord();
          } else {
            queueOverflows += 1;
            tStat.rejected += 1;
            req.state = "REJECTED";
            req.decision = "REJECT_QUEUE_FULL";
            req.reason = enq.reason;
            recordRecent(req);
            emitFrame(
              {
                ...nextEvtBase(),
                type: "traffic.queue.overflow",
                requestId: req.id,
                depth: queueScheduler.size(),
                capacity: parsed.queue.capacity,
              },
              `Queue Overflow: ${req.id}`,
              enq.reason,
              ["bounded-queue"]
            );
            checkBackpressureAndRecord();
            scheduleRetryIfBudgetAllows(req, source, "queue overflow");
          }
        } else {
          concurrencyRejections += 1;
          tStat.rejected += 1;
          req.state = "REJECTED";
          req.decision = "REJECT_CONCURRENCY";
          req.reason = `Concurrency saturated (${activeRequestIds.size}/${effectiveMaxConcurrent}) and queueing disabled`;
          recordRecent(req);
          emitFrame(
            {
              ...nextEvtBase(),
              type: "traffic.rate_limit.rejected",
              requestId: req.id,
              policyId: "concurrency-limiter",
              reason: req.reason,
            },
            `Concurrency Rejected: ${req.id}`,
            req.reason,
            ["service-runtime"]
          );
          scheduleRetryIfBudgetAllows(req, source, "concurrency saturated");
        }
      }
    }

    // Ensure at least one frame if queue emptied early
    if (frames.length === 0) {
      const snapshot = RuntimeStateHelper.cloneState(baseRuntime);
      snapshot.trafficControlState = snapshotTrafficControlState();
      const initEvt: ExecutionEvent = {
        ...nextEvtBase(),
        type: "traffic.request.created",
        requestId: "init",
        tenantId: "system",
        route: "/",
        attempt: 1,
      };
      events.push(initEvt);
      frames.push({
        frameIndex: 0,
        virtualTimeMs,
        activeNodeIds: [],
        activeEdgeIds: [],
        activeEvent: initEvt,
        direction: "request",
        stepTitle: "Simulation Initialized",
        stepExplanation: "Initialized traffic control simulation.",
        runtimeState: snapshot,
      });
    }

    const rawMethod = parsed.sources[0]?.method ?? "POST";
    const safeMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" =
      rawMethod === "GET" ||
      rawMethod === "POST" ||
      rawMethod === "PUT" ||
      rawMethod === "PATCH" ||
      rawMethod === "DELETE"
        ? rawMethod
        : "POST";

    const configuration: ExecutionConfiguration = {
      version: 1,
      entryNodeId: parsed.distributed.gateways[0]?.id ?? "gw-1",
      request: {
        id: parsed.id,
        method: safeMethod,
        path: parsed.sources[0]?.route ?? "/api/orders",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: parsed.limits.maxEvents,
        maxHops: 100,
        maxDurationMs: parsed.limits.maxVirtualDurationMs,
      },
      timing: {
        nodeDurationMs: 15,
        edgeDurationMs: 10,
      },
    };

    const lastState = frames[frames.length - 1]?.runtimeState?.trafficControlState;
    const failedInv = lastState?.invariants.allPassed === false;

    return {
      runId,
      architectureId: "arch_traffic_control_sim",
      architectureRevisionId: parsed.architectureRevisionId,
      snapshotHash: `tc_${parsed.id}_${parsed.seed}_${frames.length}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: parsed.distributed.gateways.map((g) => g.id),
      traversedEdgeIds: [],
      configuration,
      events,
      totalDurationMs: virtualTimeMs,
      totalEvents: events.length,
      totalHops: offeredRequests + completedRequests,
      outcome: failedInv ? "failure" : "success",
      terminalReason: failedInv
        ? lastState?.invariants.violations.join("; ")
        : `Traffic control simulation finished at ${virtualTimeMs}ms (${offeredRequests} offered, ${completedRequests} completed).`,
      frames,
    };
  }
}
