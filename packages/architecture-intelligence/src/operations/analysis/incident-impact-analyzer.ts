/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Incident Impact & Blast Radius Analyzer
 */

import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  IncidentScenario,
  CriticalJourney,
  IncidentImpact,
  OperationalAsset,
} from "../contracts/operations.types";

export class IncidentImpactAnalyzer {
  /**
   * Analyzes the direct and propagated impact of an incident scenario across the architecture graph.
   */
  public static analyzeScenarioImpact(
    scenario: IncidentScenario,
    nodes: BaseNode[],
    edges: BaseEdge[],
    journeys: CriticalJourney[],
    assets: OperationalAsset[] = []
  ): IncidentImpact {
    const directFailedIds = new Set<string>(scenario.affectedComponentIds);
    const propagatedIds = new Set<string>();
    const propagationPath: Array<{ fromComponentId: string; toComponentId: string; reason: string }> = [];

    // Build adjacency list for downstream traversal: A -> B means B depends on A, or A sends traffic to B
    // In service graphs: Client -> Gateway -> Service -> Database
    // If Gateway fails, downstream Service and Client path are disrupted.
    // If Database fails, upstream Service depending on it fails.
    // We construct bidirectional dependency awareness:
    const outgoingMap = new Map<string, string[]>();
    const incomingMap = new Map<string, string[]>();

    for (const node of nodes) {
      outgoingMap.set(node.id, []);
      incomingMap.set(node.id, []);
    }

    for (const edge of edges) {
      outgoingMap.get(edge.source)?.push(edge.target);
      incomingMap.get(edge.target)?.push(edge.source);
    }

    // Propagate failure:
    // 1. If an upstream critical dependency fails (e.g. database or auth), callers that depend on it are degraded
    // 2. If an ingress gateway fails, all downstream targets that are only reachable through it lose traffic
    const visited = new Set<string>(directFailedIds);
    const queue: string[] = Array.from(directFailedIds);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check incoming callers that depend on this component (e.g. Database -> Service)
      const callers = incomingMap.get(current) || [];
      for (const caller of callers) {
        if (!visited.has(caller)) {
          visited.add(caller);
          propagatedIds.add(caller);
          queue.push(caller);
          propagationPath.push({
            fromComponentId: current,
            toComponentId: caller,
            reason: `Caller '${caller}' depends on failed dependency '${current}'`,
          });
        }
      }

      // Check downstream targets (e.g. Gateway -> Service)
      const callees = outgoingMap.get(current) || [];
      for (const callee of callees) {
        // If the only paths into callee are failed, propagate
        const incomingToCallee = incomingMap.get(callee) || [];
        const allIngressFailed = incomingToCallee.length > 0 && incomingToCallee.every((inc) => visited.has(inc));
        if (allIngressFailed && !visited.has(callee)) {
          visited.add(callee);
          propagatedIds.add(callee);
          queue.push(callee);
          propagationPath.push({
            fromComponentId: current,
            toComponentId: callee,
            reason: `Ingress path to '${callee}' is blocked via failed upstream '${current}'`,
          });
        }
      }
    }

    // Impacted Journeys:
    // Any journey whose traversedComponentIds intersect with directFailedIds or propagatedIds
    const allDisruptedIds = new Set<string>([...directFailedIds, ...propagatedIds]);
    const impactedJourneyIds: string[] = [];

    for (const journey of journeys) {
      const isDisrupted = journey.traversedComponentIds.some((cid) => allDisruptedIds.has(cid));
      if (isDisrupted) {
        impactedJourneyIds.push(journey.id);
      }
    }

    // Also include journeys explicitly attached to the scenario
    for (const jid of scenario.affectedJourneyIds) {
      if (!impactedJourneyIds.includes(jid)) {
        impactedJourneyIds.push(jid);
      }
    }

    // Impacted Regions
    const impactedRegionsSet = new Set<string>();
    for (const cid of allDisruptedIds) {
      const asset = assets.find((a) => a.componentId === cid);
      if (asset?.region) {
        impactedRegionsSet.add(asset.region);
      }
    }
    const impactedRegions = Array.from(impactedRegionsSet);

    // Blast Radius Calculation (0 - 100)
    // Formula:
    // 30% node ratio (disrupted / total nodes)
    // 40% journey ratio (impacted journeys / total journeys)
    // 20% Tier 1 ratio
    // 10% Severity baseline
    const totalNodesCount = Math.max(1, nodes.length);
    const totalJourneysCount = Math.max(1, journeys.length);

    const nodeRatio = Math.min(1, allDisruptedIds.size / totalNodesCount);
    const journeyRatio = journeys.length > 0 ? Math.min(1, impactedJourneyIds.length / totalJourneysCount) : (scenario.severity === "SEV1" ? 0.8 : 0.4);

    const tier1DisruptedCount = assets.filter(
      (a) => a.tier === "tier_1_mission_critical" && allDisruptedIds.has(a.componentId)
    ).length;
    const tier1Ratio = assets.length > 0 ? Math.min(1, tier1DisruptedCount / Math.max(1, assets.filter((a) => a.tier === "tier_1_mission_critical").length)) : 0.5;

    let severityFactor = 0.5;
    if (scenario.severity === "SEV1") severityFactor = 1.0;
    else if (scenario.severity === "SEV2") severityFactor = 0.75;
    else if (scenario.severity === "SEV3") severityFactor = 0.5;
    else if (scenario.severity === "SEV4") severityFactor = 0.25;

    const rawBlastRadius =
      nodeRatio * 30 +
      journeyRatio * 40 +
      tier1Ratio * 20 +
      severityFactor * 10;

    const blastRadiusScore = Math.min(100, Math.max(5, Math.round(rawBlastRadius)));

    return {
      scenarioId: scenario.id,
      directFailedComponentIds: Array.from(directFailedIds),
      propagatedComponentIds: Array.from(propagatedIds),
      impactedJourneyIds,
      impactedRegions,
      blastRadiusScore,
      isCriticalJourneyDisrupted: impactedJourneyIds.length > 0,
      propagationPath,
    };
  }
}

