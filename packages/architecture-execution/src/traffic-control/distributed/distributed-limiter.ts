import type {
  DistributedGatewayRuntime,
  DistributedLimiterMode,
  FailBehavior,
  PolicyEvaluationMode,
  RateLimitPolicyConfig,
  SyntheticRequestRuntime,
} from "../traffic-control-schemas";
import {
  checkPolicyWithoutCommit,
  getOrCreateLimiterRuntime,
  resolvePolicyInstanceKey,
  selectApplicablePolicies,
  type InternalLimiterRuntime,
  type PolicyCheckResult,
} from "../algorithms/rate-limit-algorithms";

export interface DistributedEvaluationOutcome {
  allowed: boolean;
  checkedPolicyIds: string[];
  failingPolicyId?: string;
  reason: string;
  retryAfterMs?: number;
  effectiveLatencyAddedMs: number;
  consumedRecords: Array<{ policyId: string; cost: number; remainingTokens?: number }>;
}

export function evaluateAtomicPoliciesAcrossTopology(params: {
  mode: DistributedLimiterMode;
  failBehavior: FailBehavior;
  centralStoreOnline: boolean;
  centralLatencyMs: number;
  evaluationMode: PolicyEvaluationMode;
  policies: RateLimitPolicyConfig[];
  limiterStore: Record<string, InternalLimiterRuntime>;
  gateway: DistributedGatewayRuntime;
  request: SyntheticRequestRuntime;
  nowMs: number;
}): DistributedEvaluationOutcome {
  const {
    mode,
    failBehavior,
    centralStoreOnline,
    centralLatencyMs,
    evaluationMode,
    policies,
    limiterStore,
    gateway,
    request,
    nowMs,
  } = params;

  const applicable = selectApplicablePolicies(policies, request, evaluationMode);
  if (applicable.length === 0) {
    return {
      allowed: true,
      checkedPolicyIds: [],
      reason: "No applicable rate-limit policies matched request scope",
      effectiveLatencyAddedMs: 0,
      consumedRecords: [],
    };
  }

  // Handle centralized store failure
  if (mode === "centralized" && !centralStoreOnline) {
    if (failBehavior === "fail_open") {
      return {
        allowed: true,
        checkedPolicyIds: applicable.map((p) => p.id),
        reason: `Central limiter store unavailable; fail-open fallback admitted request`,
        effectiveLatencyAddedMs: centralLatencyMs,
        consumedRecords: [],
      };
    }
    return {
      allowed: false,
      checkedPolicyIds: applicable.map((p) => p.id),
      failingPolicyId: applicable[0]!.id,
      reason: `Central limiter store unavailable; fail-closed policy rejected request`,
      retryAfterMs: 100,
      effectiveLatencyAddedMs: centralLatencyMs,
      consumedRecords: [],
    };
  }

  // Gateway clock offset affects window-based checks in distributed scenarios
  const evalTimeMs = Math.max(0, nowMs + gateway.clockOffsetMs);

  // Local quota allocation budget check
  if (mode === "local_quota_allocation") {
    if (gateway.localUsed + request.cost > gateway.allocatedQuota) {
      gateway.rejected += 1;
      return {
        allowed: false,
        checkedPolicyIds: applicable.map((p) => p.id),
        failingPolicyId: applicable[0]!.id,
        reason: `Gateway ${gateway.id} exhausted allocated local quota (${gateway.localUsed}/${gateway.allocatedQuota})`,
        retryAfterMs: 80,
        effectiveLatencyAddedMs: 0,
        consumedRecords: [],
      };
    }
  }

  const gatewayPrefix =
    mode === "local_independent" ||
    mode === "local_quota_allocation" ||
    mode === "periodic_sync"
      ? gateway.id
      : undefined;

  // Phase 1: check all policies without consuming (atomic multi-policy evaluation)
  const checks: PolicyCheckResult[] = [];
  for (const policy of applicable) {
    const instanceKey = resolvePolicyInstanceKey(policy, request, gatewayPrefix);
    const rt = getOrCreateLimiterRuntime(limiterStore, policy, instanceKey, evalTimeMs);
    const res = checkPolicyWithoutCommit(rt, evalTimeMs, request.cost);
    checks.push(res);
  }

  const firstFailure = checks.find((c) => !c.allowed);
  if (firstFailure) {
    const failedRt = limiterStore[firstFailure.instanceKey];
    if (failedRt) failedRt.rejectedTotal += 1;
    gateway.rejected += 1;
    return {
      allowed: false,
      checkedPolicyIds: applicable.map((p) => p.id),
      failingPolicyId: firstFailure.policyId,
      reason: firstFailure.reason,
      retryAfterMs: firstFailure.retryAfterMs,
      effectiveLatencyAddedMs: mode === "centralized" ? centralLatencyMs : 0,
      consumedRecords: [],
    };
  }

  // Phase 2: commit all reservations atomically
  const consumedRecords: DistributedEvaluationOutcome["consumedRecords"] = [];
  for (const check of checks) {
    check.commit(evalTimeMs, request.cost);
    const rt = limiterStore[check.instanceKey];
    consumedRecords.push({
      policyId: check.policyId,
      cost: request.cost,
      remainingTokens:
        rt?.policy.algorithm === "token_bucket"
          ? Number(rt.tokens.toFixed(3))
          : undefined,
    });
  }

  gateway.localUsed += request.cost;

  return {
    allowed: true,
    checkedPolicyIds: applicable.map((p) => p.id),
    reason: checks.map((c) => c.reason).join("; "),
    effectiveLatencyAddedMs: mode === "centralized" ? centralLatencyMs : 0,
    consumedRecords,
  };
}

