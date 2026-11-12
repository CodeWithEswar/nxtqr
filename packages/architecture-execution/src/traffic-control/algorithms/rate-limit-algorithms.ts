import type {
  LimiterInstanceState,
  PolicyEvaluationMode,
  RateLimitPolicyConfig,
  SyntheticRequestRuntime,
} from "../traffic-control-schemas";

const EPSILON = 1e-9;

export interface InternalLimiterRuntime {
  instanceKey: string;
  policy: RateLimitPolicyConfig;
  // Token bucket
  tokens: number;
  lastRefillAtMs: number;
  consumedTotal: number;
  // Fixed window
  windowStartMs: number;
  fixedUsed: number;
  // Sliding window log
  timestamps: number[];
  // Sliding window counter
  prevWindowStartMs: number;
  prevWindowCount: number;
  curWindowStartMs: number;
  curWindowCount: number;
  // Leaky bucket
  leakyQueued: number;
  lastDrainAtMs: number;
  drainedTotal: number;
  // Shared
  rejectedTotal: number;
}

export interface PolicyCheckResult {
  allowed: boolean;
  instanceKey: string;
  policyId: string;
  reason: string;
  retryAfterMs?: number;
  commit: (nowMs: number, cost: number) => void;
}

export function resolvePolicyInstanceKey(
  policy: RateLimitPolicyConfig,
  req: SyntheticRequestRuntime,
  gatewayPrefix?: string
): string {
  const prefix = gatewayPrefix ? `${gatewayPrefix}::` : "";
  switch (policy.scope) {
    case "global":
      return `${prefix}${policy.id}:global`;
    case "service":
      return `${prefix}${policy.id}:service`;
    case "route":
      return `${prefix}${policy.id}:route:${req.route}`;
    case "tenant":
      return `${prefix}${policy.id}:tenant:${req.tenantId}`;
    case "user":
      return `${prefix}${policy.id}:user:${req.userId ?? req.tenantId}`;
    case "api_key":
      return `${prefix}${policy.id}:key:${req.apiKeyId ?? "anon"}`;
    case "ip":
      return `${prefix}${policy.id}:ip:${req.clientIp ?? "10.0.0.1"}`;
    case "composite":
      return `${prefix}${policy.id}:${req.tenantId}:${req.route}:${req.userId ?? "u"}`;
  }
}

export function matchesPolicy(
  policy: RateLimitPolicyConfig,
  req: SyntheticRequestRuntime
): boolean {
  if (!policy.scopeMatch) return true;
  const target = policy.scopeMatch;
  switch (policy.scope) {
    case "tenant":
      return req.tenantId === target;
    case "route":
      return req.route === target;
    case "user":
      return req.userId === target;
    case "api_key":
      return req.apiKeyId === target;
    case "ip":
      return req.clientIp === target;
    default:
      return true;
  }
}

export function selectApplicablePolicies(
  policies: RateLimitPolicyConfig[],
  req: SyntheticRequestRuntime,
  mode: PolicyEvaluationMode
): RateLimitPolicyConfig[] {
  const matched = policies.filter((p) => matchesPolicy(p, req));
  if (matched.length === 0) return [];

  const specificityOrder: Record<string, number> = {
    composite: 0,
    user: 1,
    api_key: 1,
    ip: 1,
    route: 2,
    tenant: 3,
    service: 4,
    global: 5,
  };

  if (mode === "first_match") {
    return [matched[0]!];
  }
  if (mode === "most_specific") {
    const sorted = [...matched].sort(
      (a, b) => (specificityOrder[a.scope] ?? 9) - (specificityOrder[b.scope] ?? 9)
    );
    return [sorted[0]!];
  }
  if (mode === "hierarchical") {
    // Evaluate broadest (global/parent) down to narrowest so hierarchy is traceable
    return [...matched].sort(
      (a, b) => (specificityOrder[b.scope] ?? 9) - (specificityOrder[a.scope] ?? 9)
    );
  }
  return matched;
}

export function getOrCreateLimiterRuntime(
  store: Record<string, InternalLimiterRuntime>,
  policy: RateLimitPolicyConfig,
  instanceKey: string,
  nowMs: number
): InternalLimiterRuntime {
  if (!store[instanceKey]) {
    store[instanceKey] = {
      instanceKey,
      policy,
      tokens: policy.capacity,
      lastRefillAtMs: nowMs,
      consumedTotal: 0,
      windowStartMs: Math.floor(nowMs / policy.windowMs) * policy.windowMs,
      fixedUsed: 0,
      timestamps: [],
      prevWindowStartMs:
        Math.floor(nowMs / policy.windowMs) * policy.windowMs - policy.windowMs,
      prevWindowCount: 0,
      curWindowStartMs: Math.floor(nowMs / policy.windowMs) * policy.windowMs,
      curWindowCount: 0,
      leakyQueued: 0,
      lastDrainAtMs: nowMs,
      drainedTotal: 0,
      rejectedTotal: 0,
    };
  }
  return store[instanceKey]!;
}

export function advanceLimiterVirtualTime(
  rt: InternalLimiterRuntime,
  nowMs: number
): number {
  const { policy } = rt;
  let refilledAmount = 0;

  if (policy.algorithm === "token_bucket") {
    if (nowMs > rt.lastRefillAtMs) {
      const elapsedSec = (nowMs - rt.lastRefillAtMs) / 1000;
      const before = rt.tokens;
      const added = elapsedSec * policy.refillTokensPerSecond;
      const next = Math.min(policy.capacity, before + added);
      rt.tokens = Math.abs(next - Math.round(next)) < EPSILON ? Math.round(next) : next;
      refilledAmount = Math.max(0, rt.tokens - before);
      rt.lastRefillAtMs = nowMs;
    }
  } else if (policy.algorithm === "fixed_window") {
    const aligned = Math.floor(nowMs / policy.windowMs) * policy.windowMs;
    if (aligned > rt.windowStartMs) {
      rt.windowStartMs = aligned;
      rt.fixedUsed = 0;
    }
  } else if (policy.algorithm === "sliding_window_log") {
    const cutoff = nowMs - policy.windowMs;
    while (rt.timestamps.length > 0 && rt.timestamps[0]! <= cutoff) {
      rt.timestamps.shift();
    }
  } else if (policy.algorithm === "sliding_window_counter") {
    const aligned = Math.floor(nowMs / policy.windowMs) * policy.windowMs;
    if (aligned > rt.curWindowStartMs) {
      if (aligned === rt.curWindowStartMs + policy.windowMs) {
        rt.prevWindowStartMs = rt.curWindowStartMs;
        rt.prevWindowCount = rt.curWindowCount;
      } else {
        rt.prevWindowStartMs = aligned - policy.windowMs;
        rt.prevWindowCount = 0;
      }
      rt.curWindowStartMs = aligned;
      rt.curWindowCount = 0;
    }
  } else if (policy.algorithm === "leaky_bucket") {
    if (nowMs > rt.lastDrainAtMs) {
      const elapsedSec = (nowMs - rt.lastDrainAtMs) / 1000;
      const leaked = Math.floor(elapsedSec * policy.drainRatePerSecond + EPSILON);
      if (leaked > 0) {
        const actual = Math.min(rt.leakyQueued, leaked);
        rt.leakyQueued -= actual;
        rt.drainedTotal += actual;
        rt.lastDrainAtMs = nowMs;
      }
    }
  }

  return refilledAmount;
}

export function checkPolicyWithoutCommit(
  rt: InternalLimiterRuntime,
  nowMs: number,
  cost: number
): PolicyCheckResult {
  advanceLimiterVirtualTime(rt, nowMs);
  const { policy, instanceKey } = rt;

  if (policy.algorithm === "token_bucket") {
    if (rt.tokens + EPSILON >= cost) {
      return {
        allowed: true,
        instanceKey,
        policyId: policy.id,
        reason: `Token bucket allowed (tokens ${rt.tokens.toFixed(2)} >= cost ${cost})`,
        commit: () => {
          const next = rt.tokens - cost;
          rt.tokens = next < EPSILON ? 0 : next;
          rt.consumedTotal += cost;
        },
      };
    }
    const deficit = cost - rt.tokens;
    const retryAfterMs = Math.ceil((deficit / Math.max(0.1, policy.refillTokensPerSecond)) * 1000);
    return {
      allowed: false,
      instanceKey,
      policyId: policy.id,
      retryAfterMs,
      reason: `Token bucket exhausted (${rt.tokens.toFixed(2)} < cost ${cost})`,
      commit: () => {},
    };
  }

  if (policy.algorithm === "fixed_window") {
    if (rt.fixedUsed + cost <= policy.limit) {
      return {
        allowed: true,
        instanceKey,
        policyId: policy.id,
        reason: `Fixed window allowed (${rt.fixedUsed + cost}/${policy.limit})`,
        commit: () => {
          rt.fixedUsed += cost;
          rt.consumedTotal += cost;
        },
      };
    }
    const retryAfterMs = Math.max(1, rt.windowStartMs + policy.windowMs - nowMs);
    return {
      allowed: false,
      instanceKey,
      policyId: policy.id,
      retryAfterMs,
      reason: `Fixed window limit exceeded (${rt.fixedUsed}/${policy.limit} in [${rt.windowStartMs}..${rt.windowStartMs + policy.windowMs}ms])`,
      commit: () => {},
    };
  }

  if (policy.algorithm === "sliding_window_log") {
    if (rt.timestamps.length + cost <= policy.limit) {
      return {
        allowed: true,
        instanceKey,
        policyId: policy.id,
        reason: `Sliding-window log allowed (${rt.timestamps.length + cost}/${policy.limit} active timestamps)`,
        commit: (ts) => {
          for (let i = 0; i < Math.max(1, Math.round(cost)); i++) {
            rt.timestamps.push(ts);
          }
          rt.consumedTotal += cost;
        },
      };
    }
    const oldest = rt.timestamps[0] ?? nowMs;
    const retryAfterMs = Math.max(1, oldest + policy.windowMs - nowMs);
    return {
      allowed: false,
      instanceKey,
      policyId: policy.id,
      retryAfterMs,
      reason: `Sliding-window log full (${rt.timestamps.length}/${policy.limit} within last ${policy.windowMs}ms)`,
      commit: () => {},
    };
  }

  if (policy.algorithm === "sliding_window_counter") {
    const elapsedInCur = nowMs - rt.curWindowStartMs;
    const prevWeight = Math.max(0, 1 - elapsedInCur / policy.windowMs);
    const effective = rt.curWindowCount + rt.prevWindowCount * prevWeight;
    if (effective + cost <= policy.limit + EPSILON) {
      return {
        allowed: true,
        instanceKey,
        policyId: policy.id,
        reason: `Sliding-window counter approx allowed (${effective.toFixed(2)} + ${cost} <= ${policy.limit})`,
        commit: () => {
          rt.curWindowCount += cost;
          rt.consumedTotal += cost;
        },
      };
    }
    return {
      allowed: false,
      instanceKey,
      policyId: policy.id,
      retryAfterMs: Math.max(10, Math.ceil(policy.windowMs * 0.25)),
      reason: `Sliding-window counter approx limit exceeded (${effective.toFixed(2)}/${policy.limit}, prev=${rt.prevWindowCount}, cur=${rt.curWindowCount})`,
      commit: () => {},
    };
  }

  // leaky_bucket (bounded FIFO queue drained at fixed drainRatePerSecond)
  if (rt.leakyQueued + cost <= policy.capacity) {
    return {
      allowed: true,
      instanceKey,
      policyId: policy.id,
      reason: `Leaky bucket admitted into drain queue (${rt.leakyQueued + cost}/${policy.capacity})`,
      commit: () => {
        rt.leakyQueued += cost;
        rt.consumedTotal += cost;
      },
    };
  }
  return {
    allowed: false,
    instanceKey,
    policyId: policy.id,
    retryAfterMs: Math.ceil((1 / Math.max(0.1, policy.drainRatePerSecond)) * 1000),
    reason: `Leaky bucket queue overflow (${rt.leakyQueued}/${policy.capacity}, drain=${policy.drainRatePerSecond}/s)`,
    commit: () => {},
  };
}

export function snapshotLimiterInstance(
  rt: InternalLimiterRuntime,
  nowMs: number
): LimiterInstanceState {
  const { policy, instanceKey } = rt;
  const base: LimiterInstanceState = {
    instanceKey,
    policyId: policy.id,
    label: policy.label,
    algorithm: policy.algorithm,
    scope: policy.scope,
  };

  if (policy.algorithm === "token_bucket") {
    const deficit = Math.max(0, 1 - rt.tokens);
    base.tokenBucket = {
      key: instanceKey,
      policyId: policy.id,
      capacity: policy.capacity,
      tokens: Number(rt.tokens.toFixed(3)),
      refillTokensPerSecond: policy.refillTokensPerSecond,
      lastRefillAtMs: rt.lastRefillAtMs,
      consumedTotal: rt.consumedTotal,
      rejectedTotal: rt.rejectedTotal,
      nextEligibleAtMs:
        deficit <= EPSILON
          ? nowMs
          : nowMs + Math.ceil((deficit / Math.max(0.1, policy.refillTokensPerSecond)) * 1000),
    };
  } else if (policy.algorithm === "fixed_window") {
    base.fixedWindow = {
      key: instanceKey,
      policyId: policy.id,
      windowStartMs: rt.windowStartMs,
      windowMs: policy.windowMs,
      used: rt.fixedUsed,
      limit: policy.limit,
      rejectedTotal: rt.rejectedTotal,
    };
  } else if (
    policy.algorithm === "sliding_window_log" ||
    policy.algorithm === "sliding_window_counter"
  ) {
    const elapsed = Math.max(0, nowMs - rt.curWindowStartMs);
    const prevWeight = Math.max(0, 1 - elapsed / policy.windowMs);
    const effective =
      policy.algorithm === "sliding_window_log"
        ? rt.timestamps.length
        : Number((rt.curWindowCount + rt.prevWindowCount * prevWeight).toFixed(2));
    base.slidingWindow = {
      key: instanceKey,
      policyId: policy.id,
      kind: policy.algorithm === "sliding_window_log" ? "log" : "counter_approx",
      windowMs: policy.windowMs,
      limit: policy.limit,
      currentCount:
        policy.algorithm === "sliding_window_log"
          ? rt.timestamps.length
          : rt.curWindowCount,
      previousCount: rt.prevWindowCount,
      effectiveCount: effective,
      activeTimestampCount: rt.timestamps.length,
      rejectedTotal: rt.rejectedTotal,
    };
  } else if (policy.algorithm === "leaky_bucket") {
    base.leakyBucket = {
      key: instanceKey,
      policyId: policy.id,
      capacity: policy.capacity,
      queuedCount: rt.leakyQueued,
      drainRatePerSecond: policy.drainRatePerSecond,
      lastDrainAtMs: rt.lastDrainAtMs,
      drainedTotal: rt.drainedTotal,
      overflowRejectedTotal: rt.rejectedTotal,
    };
  }

  return base;
}

