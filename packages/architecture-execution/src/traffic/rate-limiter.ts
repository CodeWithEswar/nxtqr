import type {
  RateLimiterConfig,
  ModeledRateLimiterState,
} from "./traffic-schemas";

export class RateLimiterEngine {
  public static initialize(config: RateLimiterConfig, atMs = 0): ModeledRateLimiterState {
    return {
      nodeId: config.nodeId,
      currentTokens: config.capacity,
      capacity: config.capacity,
      refillRatePerSec: config.refillRatePerSec,
      lastRefillAtMs: atMs,
      totalAllowed: 0,
      totalRejected: 0,
    };
  }

  /**
   * Refills tokens based on elapsed virtual time and evaluates admission.
   */
  public static checkAndConsume(
    state: ModeledRateLimiterState,
    config: RateLimiterConfig,
    atMs: number
  ): {
    allowed: boolean;
    remainingTokens: number;
    tokensRefilled: number;
    reason?: string;
  } {
    const elapsedMs = Math.max(0, atMs - state.lastRefillAtMs);
    let tokensRefilled = 0;

    if (elapsedMs > 0) {
      const addedTokens = (elapsedMs / 1000) * state.refillRatePerSec;
      if (addedTokens >= 1) {
        const wholeTokens = Math.floor(addedTokens);
        state.currentTokens = Math.min(state.capacity, state.currentTokens + wholeTokens);
        state.lastRefillAtMs = atMs;
        tokensRefilled = wholeTokens;
      }
    }

    if (state.currentTokens >= 1) {
      state.currentTokens -= 1;
      state.totalAllowed++;
      return {
        allowed: true,
        remainingTokens: Math.floor(state.currentTokens),
        tokensRefilled,
      };
    }

    state.totalRejected++;
    return {
      allowed: false,
      remainingTokens: 0,
      tokensRefilled,
      reason: `Rate limit exceeded on node "${config.nodeId}" (Bucket exhausted: 0/${state.capacity} tokens). HTTP ${config.rejectStatusCode} Too Many Requests.`,
    };
  }
}
