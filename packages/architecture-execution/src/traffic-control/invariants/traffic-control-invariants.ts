import type {
  LimiterInstanceState,
  TrafficControlInvariantReport,
} from "../traffic-control-schemas";

export class TrafficControlInvariantMonitor {
  public static verify(params: {
    limiters: Record<string, LimiterInstanceState>;
    queueDepth: number;
    queueCapacity: number;
    activeConcurrency: number;
    maxConcurrency: number;
    permitsAcquired: number;
    permitsReleased: number;
    partialConsumeOnRejectDetected: boolean;
    expiredExecutedDetected: boolean;
    retryBudgetViolated: boolean;
    invalidCircuitTransition: boolean;
  }): TrafficControlInvariantReport {
    const violations: string[] = [];
    let tokenBoundsOk = true;
    let windowBoundsOk = true;

    for (const lim of Object.values(params.limiters)) {
      if (lim.tokenBucket) {
        if (
          lim.tokenBucket.tokens < -1e-6 ||
          lim.tokenBucket.tokens > lim.tokenBucket.capacity + 1e-6
        ) {
          tokenBoundsOk = false;
          violations.push(
            `Token bounds violated on ${lim.instanceKey}: tokens=${lim.tokenBucket.tokens}, capacity=${lim.tokenBucket.capacity}`
          );
        }
      }
      if (lim.fixedWindow && lim.fixedWindow.used > lim.fixedWindow.limit) {
        windowBoundsOk = false;
        violations.push(
          `Fixed window exceeded on ${lim.instanceKey}: used=${lim.fixedWindow.used} > limit=${lim.fixedWindow.limit}`
        );
      }
    }

    const queueBoundsOk = params.queueDepth <= params.queueCapacity;
    if (!queueBoundsOk) {
      violations.push(
        `Queue overflow invariant failed: depth=${params.queueDepth} > capacity=${params.queueCapacity}`
      );
    }

    const concurrencyBoundsOk = params.activeConcurrency <= params.maxConcurrency;
    if (!concurrencyBoundsOk) {
      violations.push(
        `Concurrency limit exceeded: active=${params.activeConcurrency} > max=${params.maxConcurrency}`
      );
    }

    const permitsBalancedOk =
      params.permitsAcquired === params.permitsReleased + params.activeConcurrency;
    if (!permitsBalancedOk) {
      violations.push(
        `Permit leak detected: acquired=${params.permitsAcquired}, released=${params.permitsReleased}, active=${params.activeConcurrency}`
      );
    }

    const atomicMultiPolicyOk = !params.partialConsumeOnRejectDetected;
    if (!atomicMultiPolicyOk) {
      violations.push("Partial quota consumption detected on rejected request");
    }

    const expiredNotExecutedOk = !params.expiredExecutedDetected;
    if (!expiredNotExecutedOk) {
      violations.push("Expired request started execution");
    }

    const retryBudgetRespectedOk = !params.retryBudgetViolated;
    if (!retryBudgetRespectedOk) {
      violations.push("Retry attempted beyond remaining budget");
    }

    const circuitTransitionsOk = !params.invalidCircuitTransition;
    if (!circuitTransitionsOk) {
      violations.push("Invalid circuit breaker state transition occurred");
    }

    return {
      allPassed: violations.length === 0,
      tokenBoundsOk,
      windowBoundsOk,
      queueBoundsOk,
      concurrencyBoundsOk,
      permitsBalancedOk,
      atomicMultiPolicyOk,
      expiredNotExecutedOk,
      retryBudgetRespectedOk,
      circuitTransitionsOk,
      violations,
    };
  }
}

