import type {
  AlertInstanceRuntime,
  AlertLifecycleState,
  ObservabilityAlertRuleConfig,
  ObservabilitySLOConfig,
  SLOEvaluationRuntime,
} from "../observability-schemas";

export interface ServiceObservationSample {
  timestampMs: number;
  serviceId: string;
  durationMs: number;
  ok: boolean;
}

export function evaluateSLOForService(
  slo: ObservabilitySLOConfig,
  observations: ServiceObservationSample[],
  nowMs: number
): SLOEvaluationRuntime {
  const windowStart =
    slo.windowType === "rolling"
      ? Math.max(0, nowMs - slo.windowMs)
      : Math.floor(nowMs / slo.windowMs) * slo.windowMs;

  const eligible = observations.filter(
    (o) => o.serviceId === slo.targetServiceId && o.timestampMs >= windowStart
  );
  const eligibleCount = eligible.length;

  let goodCount = 0;
  for (const obs of eligible) {
    if (slo.sliType === "latency") {
      if (obs.ok && obs.durationMs <= (slo.latencyThresholdMs ?? 120)) {
        goodCount += 1;
      }
    } else if (obs.ok) {
      goodCount += 1;
    }
  }

  const badCount = eligibleCount - goodCount;
  const compliance = eligibleCount > 0 ? goodCount / eligibleCount : 1;
  const allowedBadFraction = Math.max(1e-6, 1 - slo.target);
  const allowedBad = eligibleCount * allowedBadFraction;
  const consumedFraction = allowedBad > 0 ? badCount / allowedBad : badCount > 0 ? 2 : 0;
  const remainingPct = Number(
    Math.max(-100, Math.min(100, (1 - consumedFraction) * 100)).toFixed(1)
  );
  const badFraction = eligibleCount > 0 ? badCount / eligibleCount : 0;
  const burnRate = Number((badFraction / allowedBadFraction).toFixed(2));

  return {
    id: slo.id,
    name: slo.name,
    sliType: slo.sliType,
    targetServiceId: slo.targetServiceId,
    target: slo.target,
    windowMs: slo.windowMs,
    windowType: slo.windowType,
    eligibleRequests: eligibleCount,
    goodRequests: goodCount,
    badRequests: badCount,
    compliance: Number(compliance.toFixed(4)),
    allowedBadRequests: Number(allowedBad.toFixed(2)),
    errorBudgetRemainingPct: remainingPct,
    burnRate,
    breached: eligibleCount > 0 && compliance < slo.target,
  };
}

export function evaluateAlertRuleTick(params: {
  instance: AlertInstanceRuntime;
  rule: ObservabilityAlertRuleConfig;
  computedValue: number | null;
  nowMs: number;
}): {
  transitionedTo: AlertLifecycleState | null;
  state: AlertLifecycleState;
} {
  const { instance, rule, computedValue, nowMs } = params;
  const prevState = instance.state;

  let breaching = false;
  if (computedValue === null) {
    if (rule.missingDataPolicy === "no_data") {
      instance.currentValue = null;
      instance.recentEvaluations.push({
        evaluatedAtMs: nowMs,
        computedValue: null,
        threshold: rule.threshold,
        breaching: false,
        state: instance.state,
      });
      if (instance.recentEvaluations.length > 25) {
        instance.recentEvaluations.shift();
      }
      return { transitionedTo: null, state: instance.state };
    } else if (rule.missingDataPolicy === "treat_breaching") {
      breaching = true;
    } else if (rule.missingDataPolicy === "treat_healthy") {
      breaching = false;
    } else if (rule.missingDataPolicy === "retain_previous") {
      breaching = prevState === "FIRING" || prevState === "PENDING";
    }
  } else {
    instance.currentValue = Number(computedValue.toFixed(3));
    breaching =
      rule.operator === ">="
        ? computedValue >= rule.threshold
        : computedValue > rule.threshold;
  }

  let nextState: AlertLifecycleState = prevState;
  let transitionedTo: AlertLifecycleState | null = null;

  if (breaching) {
    if (prevState === "INACTIVE" || prevState === "RESOLVED") {
      if (rule.pendingDurationMs <= 0) {
        nextState = "FIRING";
        instance.firedAtMs = nowMs;
        instance.fireCount += 1;
        transitionedTo = "FIRING";
      } else {
        nextState = "PENDING";
        instance.pendingSinceMs = nowMs;
        transitionedTo = "PENDING";
      }
    } else if (prevState === "PENDING") {
      if (
        instance.pendingSinceMs !== null &&
        nowMs - instance.pendingSinceMs >= rule.pendingDurationMs
      ) {
        nextState = "FIRING";
        instance.firedAtMs = nowMs;
        instance.fireCount += 1;
        transitionedTo = "FIRING";
      }
    } else if (prevState === "RECOVERING") {
      nextState = "FIRING";
      instance.fireCount += 1;
      transitionedTo = "FIRING";
    }
  } else {
    if (prevState === "PENDING") {
      nextState = "INACTIVE";
      instance.pendingSinceMs = null;
      transitionedTo = "INACTIVE";
    } else if (prevState === "FIRING") {
      const recDur = rule.recoveryDurationMs ?? 0;
      if (recDur <= 0) {
        nextState = "RESOLVED";
        instance.resolvedAtMs = nowMs;
        transitionedTo = "RESOLVED";
      } else {
        nextState = "RECOVERING";
        instance.pendingSinceMs = nowMs;
        transitionedTo = "RECOVERING";
      }
    } else if (prevState === "RECOVERING") {
      const recDur = rule.recoveryDurationMs ?? 0;
      if (
        instance.pendingSinceMs !== null &&
        nowMs - instance.pendingSinceMs >= recDur
      ) {
        nextState = "RESOLVED";
        instance.resolvedAtMs = nowMs;
        transitionedTo = "RESOLVED";
      }
    }
  }

  instance.state = nextState;
  instance.recentEvaluations.push({
    evaluatedAtMs: nowMs,
    computedValue: instance.currentValue,
    threshold: rule.threshold,
    breaching,
    state: nextState,
  });
  if (instance.recentEvaluations.length > 25) {
    instance.recentEvaluations.shift();
  }

  return { transitionedTo, state: nextState };
}

