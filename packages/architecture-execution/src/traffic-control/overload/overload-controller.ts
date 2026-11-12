import type {
  BackpressureRuntime,
  SyntheticRequestRuntime,
  TrafficControlScenario,
} from "../traffic-control-schemas";
import type { DeterministicRandom } from "../../resilience/deterministic-random";

export function evaluateBackpressureTransition(params: {
  bp: BackpressureRuntime;
  queueDepth: number;
  queueCapacity: number;
  activeConcurrency: number;
  maxConcurrency: number;
  config: TrafficControlScenario["overload"];
}): "activated" | "released" | "unchanged" {
  if (!params.config.backpressureEnabled) return "unchanged";

  const queueRatio =
    params.queueCapacity > 0
      ? params.queueDepth / params.queueCapacity
      : params.activeConcurrency / Math.max(1, params.maxConcurrency);
  const concRatio = params.activeConcurrency / Math.max(1, params.maxConcurrency);
  const pressure = Math.max(queueRatio, concRatio);
  params.bp.level = Number(pressure.toFixed(3));

  if (!params.bp.active && pressure >= params.config.enterQueueThreshold) {
    params.bp.active = true;
    params.bp.signalType = pressure >= 0.95 ? "pause_producer" : "slow_producer";
    params.bp.producerRateMultiplier = pressure >= 0.95 ? 0.25 : 0.5;
    params.bp.activatedCount += 1;
    return "activated";
  }

  if (params.bp.active && pressure <= params.config.exitQueueThreshold) {
    params.bp.active = false;
    params.bp.signalType = "none";
    params.bp.producerRateMultiplier = 1;
    return "released";
  }

  return "unchanged";
}

export function shouldShedRequest(params: {
  req: SyntheticRequestRuntime;
  nowMs: number;
  queueDepth: number;
  queueCapacity: number;
  activeConcurrency: number;
  maxConcurrency: number;
  recentAvgLatencyMs: number;
  baseServiceTimeMs: number;
  config: TrafficControlScenario["overload"];
  rng: DeterministicRandom;
}): { shed: boolean; reason: string } {
  if (!params.config.loadSheddingEnabled) {
    return { shed: false, reason: "" };
  }

  const qRatio =
    params.queueCapacity > 0
      ? params.queueDepth / params.queueCapacity
      : params.activeConcurrency / Math.max(1, params.maxConcurrency);

  const policy = params.config.shedPolicy;

  if (policy === "deadline" && params.req.deadlineMs !== undefined) {
    const remaining = params.req.deadlineMs - params.nowMs;
    if (remaining < params.baseServiceTimeMs) {
      return {
        shed: true,
        reason: `Deadline-based shedding: remaining budget ${remaining}ms < min service time ${params.baseServiceTimeMs}ms`,
      };
    }
  }

  if (qRatio < params.config.shedQueueRatio) {
    return { shed: false, reason: "" };
  }

  if (policy === "priority") {
    if (params.req.priority === "background") {
      return {
        shed: true,
        reason: `Priority shedding dropped background request (queue ratio ${(qRatio * 100).toFixed(0)}% >= ${(params.config.shedQueueRatio * 100).toFixed(0)}%)`,
      };
    }
    if (params.req.priority === "standard" && qRatio >= 0.95) {
      return {
        shed: true,
        reason: `Priority shedding dropped standard request at severe overload (${(qRatio * 100).toFixed(0)}%)`,
      };
    }
    return { shed: false, reason: "" };
  }

  if (policy === "latency") {
    if (params.recentAvgLatencyMs > params.baseServiceTimeMs * 2) {
      return {
        shed: true,
        reason: `Latency-based shedding triggered (avg latency ${params.recentAvgLatencyMs.toFixed(0)}ms > 2x baseline)`,
      };
    }
  }

  if (policy === "probabilistic") {
    if (params.rng.next() < params.config.shedProbability) {
      return {
        shed: true,
        reason: `Seeded probabilistic shedding triggered (p=${params.config.shedProbability}, queue=${params.queueDepth}/${params.queueCapacity})`,
      };
    }
    return { shed: false, reason: "" };
  }

  if (policy === "queue_depth") {
    return {
      shed: true,
      reason: `Queue-depth shedding triggered (${params.queueDepth}/${params.queueCapacity} >= ${(params.config.shedQueueRatio * 100).toFixed(0)}%)`,
    };
  }

  return { shed: false, reason: "" };
}

export function adjustAdaptiveConcurrencyLimit(params: {
  currentLimit: number;
  minLimit: number;
  maxLimit: number;
  observedAvgLatencyMs: number;
  targetLatencyMs: number;
  errorRate: number;
  queueDepth: number;
}): { nextLimit: number; reason: string } {
  const {
    currentLimit,
    minLimit,
    maxLimit,
    observedAvgLatencyMs,
    targetLatencyMs,
    errorRate,
    queueDepth,
  } = params;

  // Simplified AIMD + Little's-Law gradient approximation with hysteresis
  if (errorRate > 0.2 || observedAvgLatencyMs > targetLatencyMs * 1.25 || queueDepth > currentLimit) {
    const decreased = Math.max(minLimit, Math.floor(currentLimit * 0.75));
    if (decreased < currentLimit) {
      return {
        nextLimit: decreased,
        reason: `Adaptive concurrency reduced ${currentLimit} -> ${decreased} (latency=${observedAvgLatencyMs.toFixed(1)}ms > target ${targetLatencyMs}ms)`,
      };
    }
  } else if (observedAvgLatencyMs > 0 && observedAvgLatencyMs <= targetLatencyMs && queueDepth === 0) {
    const increased = Math.min(maxLimit, currentLimit + 1);
    if (increased > currentLimit) {
      return {
        nextLimit: increased,
        reason: `Adaptive concurrency probed up ${currentLimit} -> ${increased} (healthy latency=${observedAvgLatencyMs.toFixed(1)}ms)`,
      };
    }
  }

  return { nextLimit: currentLimit, reason: "" };
}

