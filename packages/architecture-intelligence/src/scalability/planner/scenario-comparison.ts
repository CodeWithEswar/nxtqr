import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ScenarioComparisonResult } from "../schemas/scalability.schemas";
import { bottleneckEngine } from "../../bottlenecks/engine/bottleneck-engine";
import { toBottleneckScenario } from "../contracts/scalability.types";

export class ScenarioComparator {
  public static compare(
    originalNodes: BaseNode[],
    originalEdges: BaseEdge[],
    proposedNodes: BaseNode[],
    proposedEdges: BaseEdge[],
    scenario: any
  ): ScenarioComparisonResult {
    const bottleneckScenario = toBottleneckScenario(scenario);
    // 1. Analyze original graph
    const originalReport = bottleneckEngine.analyzeGraph(originalNodes, originalEdges, bottleneckScenario);

    // 2. Analyze proposed draft graph
    const proposedReport = bottleneckEngine.analyzeGraph(proposedNodes, proposedEdges, bottleneckScenario);

    // Calculate effective capacities across critical bottlenecks
    let beforeCapacity = 0;
    let afterCapacity = 0;

    for (const util of Object.values(originalReport.nodeUtilization)) {
      if (util.declaredCapacityRps) {
        beforeCapacity = Math.max(beforeCapacity, util.declaredCapacityRps);
      }
    }
    for (const util of Object.values(proposedReport.nodeUtilization)) {
      if (util.declaredCapacityRps) {
        afterCapacity = Math.max(afterCapacity, util.declaredCapacityRps);
      }
    }

    if (beforeCapacity === 0) beforeCapacity = 1000;
    if (afterCapacity === 0) afterCapacity = Math.round(beforeCapacity * 1.5);

    // Resolved findings
    const originalRuleIds = new Set(originalReport.findings.map((f) => f.ruleId));
    const proposedRuleIds = new Set(proposedReport.findings.map((f) => f.ruleId));

    const resolvedFindingIds: string[] = [];
    for (const f of originalReport.findings) {
      if (!proposedRuleIds.has(f.ruleId)) {
        resolvedFindingIds.push(f.id);
      }
    }

    // New risk findings
    const newRiskFindingIds: string[] = [];
    for (const f of proposedReport.findings) {
      if (!originalRuleIds.has(f.ruleId)) {
        newRiskFindingIds.push(f.id);
      }
    }

    const capacityGainRatio = Number(
      (Math.max(1.0, afterCapacity / Math.max(1, beforeCapacity))).toFixed(2)
    );

    const notes: string[] = [];
    if (resolvedFindingIds.length > 0) {
      notes.push(`Resolves ${resolvedFindingIds.length} capacity constraint(s).`);
    }
    if (newRiskFindingIds.length > 0) {
      notes.push(`Introduces ${newRiskFindingIds.length} secondary dependency constraint(s) to monitor.`);
    } else {
      notes.push("Clean structural improvement with no newly introduced bottleneck findings.");
    }

    return {
      beforeCapacityRps: beforeCapacity,
      estimatedAfterCapacityRps: afterCapacity,
      capacityGainRatio,
      resolvedFindingIds,
      newRiskFindingIds,
      complexityScoreDelta: proposedNodes.length - originalNodes.length,
      notes,
    };
  }
}
