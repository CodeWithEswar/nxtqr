import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  ComponentStateSnapshot,
  JourneySimulationResult,
  BlastRadiusAnalysis,
} from "../contracts/simulation.types";

export class BlastRadiusEvaluator {
  /**
   * Computes comprehensive blast radius metrics across nodes, subsystems, and critical journeys.
   */
  public static evaluate(
    targetId: string,
    targetName: string,
    nodes: BaseNode[],
    states: Record<string, ComponentStateSnapshot>,
    journeyResults: JourneySimulationResult[]
  ): BlastRadiusAnalysis {
    const directlyImpacted: string[] = [];
    const indirectlyImpacted: string[] = [];
    const unaffected: string[] = [];

    for (const node of nodes) {
      const state = states[node.id];
      if (!state) {
        unaffected.push(node.id);
        continue;
      }

      if (state.activeFailures.length > 0) {
        directlyImpacted.push(node.id);
      } else if (state.state === "unavailable" || state.state === "degraded") {
        indirectlyImpacted.push(node.id);
      } else {
        unaffected.push(node.id);
      }
    }

    const totalNodes = Math.max(1, nodes.length);
    const affectedJourneys = journeyResults.filter(
      (j) => j.status === "unavailable" || j.status === "degraded"
    );

    // Blast radius score computation:
    // Direct failures carry higher weight (1.5) than degraded indirect (1.0)
    const rawScore =
      ((directlyImpacted.length * 1.5 + indirectlyImpacted.length * 0.8) / (totalNodes * 1.5)) *
      100;
    const blastRadiusScore = Math.min(100, Math.round(rawScore));

    const summary =
      blastRadiusScore === 0
        ? "Failure isolated with 0% system blast radius."
        : blastRadiusScore > 50
        ? `High critical blast radius (${blastRadiusScore}%). ${directlyImpacted.length} directly and ${indirectlyImpacted.length} indirectly affected node(s). ${affectedJourneys.length}/${journeyResults.length} journeys impacted.`
        : `Moderate blast radius (${blastRadiusScore}%). Impact confined to ${directlyImpacted.length + indirectlyImpacted.length} components.`;

    return {
      targetId,
      targetName,
      directlyImpactedNodeIds: directlyImpacted,
      indirectlyImpactedNodeIds: indirectlyImpacted,
      unaffectedNodeIds: unaffected,
      affectedJourneysCount: affectedJourneys.length,
      totalJourneysCount: journeyResults.length,
      blastRadiusScore,
      summary,
    };
  }
}
