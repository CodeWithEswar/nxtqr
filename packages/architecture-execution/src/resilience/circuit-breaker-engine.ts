import type { CircuitBreakerPolicy, CircuitBreakerState } from "./fault-schemas";
import type { ModeledRuntimeState } from "../domain/runtime-state";

export interface CircuitStateSnapshot {
  targetNodeId: string;
  state: CircuitBreakerState;
  failureCount: number;
  consecutiveSuccesses: number;
  lastStateChangeMs: number;
  nextAllowedProbeMs: number;
  tripCount: number;
  totalFastFailures: number;
}

export class CircuitBreakerEngine {
  /**
   * Initializes or gets the circuit breaker state for a specific target node.
   */
  public static getOrCreateState(
    runtimeState: ModeledRuntimeState,
    targetNodeId: string
  ): CircuitStateSnapshot {
    if (!runtimeState.circuitBreakers[targetNodeId]) {
      runtimeState.circuitBreakers[targetNodeId] = {
        state: "closed",
        failureCount: 0,
        consecutiveSuccesses: 0,
        lastStateChangeMs: 0,
        nextAllowedProbeMs: 0,
        tripCount: 0,
        totalFastFailures: 0,
      };
    }
    const s = runtimeState.circuitBreakers[targetNodeId];
    return {
      targetNodeId,
      state: s.state,
      failureCount: s.failureCount,
      consecutiveSuccesses: s.consecutiveSuccesses,
      lastStateChangeMs: s.lastStateChangeMs,
      nextAllowedProbeMs: s.nextAllowedProbeMs,
      tripCount: s.tripCount,
      totalFastFailures: s.totalFastFailures,
    };
  }

  /**
   * Evaluates if a request should be allowed through to the target node.
   */
  public static shouldAllowRequest(
    runtimeState: ModeledRuntimeState,
    policy: CircuitBreakerPolicy,
    atMs: number
  ): {
    allowed: boolean;
    state: CircuitBreakerState;
    isProbe: boolean;
    reason: string;
    stateChanged: boolean;
    newState?: CircuitBreakerState;
  } {
    const cb = runtimeState.circuitBreakers[policy.targetNodeId] || {
      state: "closed",
      failureCount: 0,
      consecutiveSuccesses: 0,
      lastStateChangeMs: 0,
      nextAllowedProbeMs: 0,
      tripCount: 0,
      totalFastFailures: 0,
    };
    runtimeState.circuitBreakers[policy.targetNodeId] = cb;

    // Check transition from OPEN to HALF-OPEN based on virtual time
    if (cb.state === "open") {
      if (atMs >= cb.nextAllowedProbeMs) {
        cb.state = "half-open";
        cb.consecutiveSuccesses = 0;
        cb.lastStateChangeMs = atMs;
        return {
          allowed: true,
          state: "half-open",
          isProbe: true,
          reason: `Circuit transitioned from OPEN to HALF-OPEN after ${policy.openDurationMs}ms cooldown. Probe trial permitted.`,
          stateChanged: true,
          newState: "half-open",
        };
      }
      cb.totalFastFailures++;
      return {
        allowed: false,
        state: "open",
        isProbe: false,
        reason: `Circuit is OPEN on ${policy.targetNodeId}. Tripped ${cb.tripCount} time(s). Fast-failing until virtual time ${cb.nextAllowedProbeMs}ms.`,
        stateChanged: false,
      };
    }

    if (cb.state === "half-open") {
      // In half-open, allow up to halfOpenProbeLimit
      return {
        allowed: true,
        state: "half-open",
        isProbe: true,
        reason: `Circuit is HALF-OPEN. Sending test probe to evaluate target health.`,
        stateChanged: false,
      };
    }

    // Closed: allow normally
    return {
      allowed: true,
      state: "closed",
      isProbe: false,
      reason: `Circuit is CLOSED. Normal flow allowed.`,
      stateChanged: false,
    };
  }

  /**
   * Records a failed request to the target node, updating circuit states.
   */
  public static recordFailure(
    runtimeState: ModeledRuntimeState,
    policy: CircuitBreakerPolicy,
    atMs: number,
    errorReason: string
  ): {
    state: CircuitBreakerState;
    tripped: boolean;
    reason: string;
  } {
    const cb = runtimeState.circuitBreakers[policy.targetNodeId] || {
      state: "closed",
      failureCount: 0,
      consecutiveSuccesses: 0,
      lastStateChangeMs: 0,
      nextAllowedProbeMs: 0,
      tripCount: 0,
      totalFastFailures: 0,
    };
    runtimeState.circuitBreakers[policy.targetNodeId] = cb;

    if (cb.state === "half-open") {
      // Probe failed: immediately trip back to open
      cb.state = "open";
      cb.tripCount++;
      cb.lastStateChangeMs = atMs;
      cb.nextAllowedProbeMs = atMs + policy.openDurationMs;
      cb.consecutiveSuccesses = 0;
      return {
        state: "open",
        tripped: true,
        reason: `Probe trial failed in HALF-OPEN state (${errorReason}). Circuit reverted to OPEN for ${policy.openDurationMs}ms.`,
      };
    }

    if (cb.state === "closed") {
      cb.failureCount++;
      if (cb.failureCount >= policy.failureThreshold) {
        cb.state = "open";
        cb.tripCount++;
        cb.lastStateChangeMs = atMs;
        cb.nextAllowedProbeMs = atMs + policy.openDurationMs;
        return {
          state: "open",
          tripped: true,
          reason: `Failure threshold (${policy.failureThreshold}) reached. Circuit OPENED for ${policy.openDurationMs}ms.`,
        };
      }
    }

    return {
      state: cb.state,
      tripped: false,
      reason: `Recorded failure #${cb.failureCount} of ${policy.failureThreshold}.`,
    };
  }

  /**
   * Records a successful request to the target node.
   */
  public static recordSuccess(
    runtimeState: ModeledRuntimeState,
    policy: CircuitBreakerPolicy,
    atMs: number
  ): {
    state: CircuitBreakerState;
    closed: boolean;
    reason: string;
  } {
    const cb = runtimeState.circuitBreakers[policy.targetNodeId] || {
      state: "closed",
      failureCount: 0,
      consecutiveSuccesses: 0,
      lastStateChangeMs: 0,
      nextAllowedProbeMs: 0,
      tripCount: 0,
      totalFastFailures: 0,
    };
    runtimeState.circuitBreakers[policy.targetNodeId] = cb;

    if (cb.state === "half-open") {
      cb.consecutiveSuccesses++;
      if (cb.consecutiveSuccesses >= policy.successThreshold) {
        cb.state = "closed";
        cb.failureCount = 0;
        cb.consecutiveSuccesses = 0;
        cb.lastStateChangeMs = atMs;
        return {
          state: "closed",
          closed: true,
          reason: `Target healthy after ${policy.successThreshold} successful probe(s). Circuit fully CLOSED.`,
        };
      }
      return {
        state: "half-open",
        closed: false,
        reason: `Probe successful (${cb.consecutiveSuccesses}/${policy.successThreshold}).`,
      };
    }

    // If closed, clear consecutive failure counter
    cb.failureCount = 0;
    return {
      state: "closed",
      closed: false,
      reason: "Successful call. Reset failure count.",
    };
  }
}
