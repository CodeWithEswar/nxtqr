import type {
  CriticalUserJourney,
  JourneySimulationResult,
  ComponentStateSnapshot,
} from "../contracts/simulation.types";

export class CriticalJourneyEvaluator {
  /**
   * Evaluates business user journeys against active component state snapshots.
   */
  public static evaluateJourney(
    journey: CriticalUserJourney,
    states: Record<string, ComponentStateSnapshot>
  ): JourneySimulationResult {
    return this.evaluateJourneys([journey], states)[0];
  }

  public static evaluateJourneys(
    journeys: CriticalUserJourney[],
    states: Record<string, ComponentStateSnapshot>
  ): JourneySimulationResult[] {
    const results: JourneySimulationResult[] = [];

    for (const journey of journeys) {
      const affectedComponents: string[] = [];
      let hasUnavailableRequired = false;
      let hasDegradedRequired = false;
      let hasUnavailableOptional = false;
      let failedStep = "";

      // 1. Check entry node
      const entryState = states[journey.entryNodeId];
      if (!entryState || entryState.state === "unavailable") {
        hasUnavailableRequired = true;
        affectedComponents.push(journey.entryNodeId);
        failedStep = `Entry gateway/service #${journey.entryNodeId} is unavailable`;
      } else if (entryState.state === "degraded") {
        hasDegradedRequired = true;
        affectedComponents.push(journey.entryNodeId);
      }

      // 2. Check required nodes
      for (const reqNodeId of journey.requiredNodeIds) {
        const nodeState = states[reqNodeId];
        if (!nodeState || nodeState.state === "unavailable") {
          hasUnavailableRequired = true;
          affectedComponents.push(reqNodeId);
          if (!failedStep) {
            failedStep = `Critical journey step #${reqNodeId} is unavailable (${nodeState?.reason || "outage"})`;
          }
        } else if (nodeState.state === "degraded") {
          hasDegradedRequired = true;
          affectedComponents.push(reqNodeId);
        }
      }

      // 3. Check optional nodes
      if (journey.optionalNodeIds) {
        for (const optNodeId of journey.optionalNodeIds) {
          const optState = states[optNodeId];
          if (!optState || optState.state === "unavailable" || optState.state === "degraded") {
            hasUnavailableOptional = true;
            affectedComponents.push(optNodeId);
          }
        }
      }

      let status: "available" | "degraded" | "unavailable" | "unknown" = "available";
      if (hasUnavailableRequired) {
        status = "unavailable";
      } else if (hasDegradedRequired || hasUnavailableOptional) {
        status = "degraded";
      }

      results.push({
        journeyId: journey.id,
        name: journey.name,
        status,
        affectedComponentIds: Array.from(new Set(affectedComponents)),
        failedStepDescription: failedStep || undefined,
        evidenceEventIds: [],
      });
    }

    return results;
  }
}
