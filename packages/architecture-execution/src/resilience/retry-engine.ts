import type { RetryPolicy } from "./fault-schemas";
import type { ModeledHttpRequest } from "../schemas/behavior.schemas";
import type { ModeledRuntimeState } from "../domain/runtime-state";
import { DeterministicRandom } from "./deterministic-random";

export interface RetryEvaluation {
  shouldRetry: boolean;
  attemptNumber: number;
  maxAttempts: number;
  backoffDelayMs: number;
  scheduledAtMs: number;
  reason: string;
}

export class RetryEngine {
  /**
   * Evaluates if a failed operation is eligible for retry under the specified RetryPolicy.
   */
  public static evaluateRetry(
    runtimeState: ModeledRuntimeState,
    policy: RetryPolicy,
    requestId: string,
    failureType: string,
    request: ModeledHttpRequest | null,
    currentAtMs: number,
    rng: DeterministicRandom
  ): RetryEvaluation {
    const currentAttempts = runtimeState.retryCounters[requestId] || 1; // 1 = initial attempt

    if (currentAttempts >= policy.maxAttempts) {
      return {
        shouldRetry: false,
        attemptNumber: currentAttempts,
        maxAttempts: policy.maxAttempts,
        backoffDelayMs: 0,
        scheduledAtMs: currentAtMs,
        reason: `Retry exhausted: reached maximum attempt limit (${currentAttempts}/${policy.maxAttempts}).`,
      };
    }

    // Check idempotency if required
    if (policy.idempotent && request) {
      const isNaturallyIdempotent = ["GET", "HEAD", "PUT", "DELETE", "OPTIONS"].includes(request.method);
      if (!isNaturallyIdempotent) {
        return {
          shouldRetry: false,
          attemptNumber: currentAttempts,
          maxAttempts: policy.maxAttempts,
          backoffDelayMs: 0,
          scheduledAtMs: currentAtMs,
          reason: `Non-idempotent HTTP ${request.method} request rejected for retry to prevent duplicate mutations.`,
        };
      }
    }

    // Check if error type matches retryable error classes
    const isRetryableError = policy.retryableFailures.some((err) =>
      failureType.toLowerCase().includes(err.toLowerCase())
    );

    if (!isRetryableError) {
      return {
        shouldRetry: false,
        attemptNumber: currentAttempts,
        maxAttempts: policy.maxAttempts,
        backoffDelayMs: 0,
        scheduledAtMs: currentAtMs,
        reason: `Failure classification "${failureType}" is not configured in retryable failures: [${policy.retryableFailures.join(", ")}].`,
      };
    }

    // Calculate backoff
    let backoff = policy.initialDelayMs;
    if (policy.strategy === "exponential") {
      backoff = Math.min(
        policy.maxDelayMs,
        Math.round(policy.initialDelayMs * Math.pow(policy.multiplier, currentAttempts - 1))
      );
    }

    if (policy.jitter) {
      // Full jitter: uniformly random between 0.5x and 1.5x of backoff
      const jitterFactor = 0.5 + rng.next() * 1.0;
      backoff = Math.max(10, Math.round(backoff * jitterFactor));
    }

    // Check deadline budget if deadline is tracked
    const deadlineMs = runtimeState.activeDeadlines[requestId];
    if (deadlineMs !== undefined && currentAtMs + backoff >= deadlineMs) {
      return {
        shouldRetry: false,
        attemptNumber: currentAttempts,
        maxAttempts: policy.maxAttempts,
        backoffDelayMs: backoff,
        scheduledAtMs: currentAtMs + backoff,
        reason: `Retry cancelled: backoff delay (${backoff}ms) exceeds request deadline (${deadlineMs}ms).`,
      };
    }

    // Record next attempt index
    runtimeState.retryCounters[requestId] = currentAttempts + 1;

    return {
      shouldRetry: true,
      attemptNumber: currentAttempts + 1,
      maxAttempts: policy.maxAttempts,
      backoffDelayMs: backoff,
      scheduledAtMs: currentAtMs + backoff,
      reason: `Retry scheduled (attempt ${currentAttempts + 1} of ${policy.maxAttempts}) with ${policy.strategy} backoff (${backoff}ms).`,
    };
  }
}
