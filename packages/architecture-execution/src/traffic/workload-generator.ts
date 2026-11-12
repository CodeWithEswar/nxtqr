import type {
  TrafficProfile,
  TrafficScenario,
  VirtualUser,
} from "./traffic-schemas";
import { DeterministicRandom } from "../resilience/deterministic-random";

export interface ScheduledArrival {
  requestId: string;
  virtualUserId?: string;
  entryNodeId: string;
  arrivalMs: number;
}

export class WorkloadGenerator {
  /**
   * Generates a deterministic sequence of request arrivals based on the configured TrafficScenario.
   */
  public static generateArrivals(scenario: TrafficScenario): ScheduledArrival[] {
    const maxRequests = scenario.limits.maxRequests;
    const durationMs = scenario.durationMs;
    const rng = new DeterministicRandom(scenario.seed);

    if (scenario.mode === "closed_loop" && scenario.virtualUsers) {
      return this.generateClosedLoopArrivals(scenario, maxRequests, durationMs, rng);
    }

    return this.generateOpenLoopArrivals(scenario, maxRequests, durationMs);
  }

  /**
   * Open-Loop arrival scheduling: arrivals occur according to rate profile independently of completions.
   */
  private static generateOpenLoopArrivals(
    scenario: TrafficScenario,
    maxRequests: number,
    durationMs: number
  ): ScheduledArrival[] {
    const arrivals: ScheduledArrival[] = [];
    let currentAtMs = 0;
    let reqIndex = 1;

    // Small virtual time step for rate evaluation (e.g. 50ms intervals)
    const stepMs = 50;

    while (currentAtMs < durationMs && arrivals.length < maxRequests) {
      const currentRps = this.evaluateRpsAt(scenario.workload, currentAtMs);
      if (currentRps > 0) {
        // Expected arrivals in this time step
        const expectedCount = (currentRps * stepMs) / 1000;
        const count = Math.floor(expectedCount);
        const remainder = expectedCount - count;

        for (let i = 0; i < count; i++) {
          if (arrivals.length >= maxRequests) break;
          const arrivalOffset = Math.round((i / Math.max(1, count)) * stepMs);
          arrivals.push({
            requestId: `req_v_${reqIndex++}`,
            entryNodeId: scenario.entryNodeId,
            arrivalMs: currentAtMs + arrivalOffset,
          });
        }

        // Fractional probabilistic remainder using deterministic step offset
        if (remainder > 0 && arrivals.length < maxRequests) {
          const fracTrigger = ((reqIndex * 17 + currentAtMs) % 1000) / 1000;
          if (fracTrigger < remainder) {
            arrivals.push({
              requestId: `req_v_${reqIndex++}`,
              entryNodeId: scenario.entryNodeId,
              arrivalMs: currentAtMs + Math.round(stepMs * fracTrigger),
            });
          }
        }
      }

      currentAtMs += stepMs;
    }

    // Sort ascending by arrival time
    return arrivals.sort((a, b) => a.arrivalMs - b.arrivalMs);
  }

  /**
   * Closed-Loop arrival scheduling: virtual users issue requests and wait for think time.
   */
  private static generateClosedLoopArrivals(
    scenario: TrafficScenario,
    maxRequests: number,
    durationMs: number,
    rng: DeterministicRandom
  ): ScheduledArrival[] {
    const arrivals: ScheduledArrival[] = [];
    const config = scenario.virtualUsers!;
    const userCount = config.userCount;
    const baseThinkMs = config.thinkTimeMs;

    const users: VirtualUser[] = Array.from({ length: userCount }, (_, i) => ({
      id: `vu_${i + 1}`,
      activeRequestId: null,
      thinkTimeMs: baseThinkMs,
      completedRequests: 0,
      failedRequests: 0,
      nextScheduledArrivalMs: Math.round((i / userCount) * Math.min(baseThinkMs, 1000)),
    }));

    let reqIndex = 1;

    // Simulate user state evolution across virtual time
    for (const user of users) {
      let userAtMs = user.nextScheduledArrivalMs;

      while (userAtMs < durationMs && arrivals.length < maxRequests) {
        const reqId = `req_vu_${user.id}_${reqIndex++}`;
        arrivals.push({
          requestId: reqId,
          virtualUserId: user.id,
          entryNodeId: scenario.entryNodeId,
          arrivalMs: userAtMs,
        });

        // Modeled transaction round-trip (e.g. 60ms average service time) + think time with jitter
        const modeledDurationMs = 50 + rng.nextInt(10, 40);
        const jitterThink = Math.max(10, baseThinkMs + rng.nextInt(-30, 30));
        userAtMs += modeledDurationMs + jitterThink;
      }
    }

    return arrivals.sort((a, b) => a.arrivalMs - b.arrivalMs);
  }

  /**
   * Evaluates the configured TrafficProfile at a given virtual time offset.
   */
  public static evaluateRpsAt(profile: TrafficProfile, atMs: number): number {
    switch (profile.type) {
      case "constant":
        return profile.requestsPerSecond;

      case "ramp": {
        const progress = Math.min(1.0, Math.max(0.0, atMs / profile.durationMs));
        return Math.round(profile.startRps + progress * (profile.endRps - profile.startRps));
      }

      case "burst": {
        const inBurst = atMs >= profile.startAtMs && atMs <= profile.startAtMs + profile.durationMs;
        return inBurst ? profile.burstRps : profile.baselineRps;
      }

      case "step": {
        let currentRps = profile.steps[0]?.rps || 50;
        for (const s of profile.steps) {
          if (atMs >= s.atMs) {
            currentRps = s.rps;
          }
        }
        return currentRps;
      }

      case "custom": {
        if (profile.points.length === 0) return 100;
        if (atMs <= profile.points[0].atMs) return profile.points[0].requestsPerSecond;
        const last = profile.points[profile.points.length - 1];
        if (atMs >= last.atMs) return last.requestsPerSecond;

        for (let i = 0; i < profile.points.length - 1; i++) {
          const p1 = profile.points[i];
          const p2 = profile.points[i + 1];
          if (atMs >= p1.atMs && atMs <= p2.atMs) {
            const span = p2.atMs - p1.atMs;
            const factor = span > 0 ? (atMs - p1.atMs) / span : 0;
            return Math.round(
              p1.requestsPerSecond + factor * (p2.requestsPerSecond - p1.requestsPerSecond)
            );
          }
        }
        return profile.points[0].requestsPerSecond;
      }
    }
  }
}
