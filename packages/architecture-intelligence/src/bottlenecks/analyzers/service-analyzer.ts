import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type {
  BottleneckFinding,
  WorkloadScenario,
  NodeUtilization,
} from "../contracts/bottleneck.types";
import type { NodeTrafficDemand } from "../engine/traffic-resolver";
import type { ResolvedComponentCapacity } from "../engine/capacity-resolver";
import { CapacityResolver } from "../engine/capacity-resolver";

export class ServiceAnalyzer {
  public static analyze(
    nodes: BaseNode[],
    index: GraphIndex,
    demandMap: Map<string, NodeTrafficDemand>,
    capacityMap: Map<string, ResolvedComponentCapacity>,
    scenario: WorkloadScenario
  ): { findings: BottleneckFinding[]; nodeUtilizations: Record<string, NodeUtilization> } {
    const findings: BottleneckFinding[] = [];
    const nodeUtilizations: Record<string, NodeUtilization> = {};

    for (const node of nodes) {
      // Exclude pure storage or queue nodes (analyzed in their own analyzers)
      if (index.dataStoreIds.includes(node.id) || index.queueIds.includes(node.id)) continue;

      const demand = demandMap.get(node.id) || { totalRps: 0, readRps: 0, writeRps: 0, bandwidthMbps: 0 };
      const cap = capacityMap.get(node.id);
      const capacityRps = cap?.capacityRps;

      let ratio: number | undefined;
      if (capacityRps !== undefined && capacityRps > 0) {
        ratio = Math.round((demand.totalRps / capacityRps) * 100) / 100;
      }

      const status = CapacityResolver.getUtilizationStatus(ratio);
      const concurrencyDemand = Math.round(demand.totalRps * ((cap?.processingTimeMs || 10) / 1000) * 10) / 10;

      nodeUtilizations[node.id] = {
        nodeId: node.id,
        demandRps: Math.round(demand.totalRps),
        demandReadRps: Math.round(demand.readRps),
        demandWriteRps: Math.round(demand.writeRps),
        declaredCapacityRps: capacityRps,
        utilizationRatio: ratio,
        status,
        concurrencyDemand,
        bandwidthDemandMbps: demand.bandwidthMbps,
        details: `Demand: ${Math.round(demand.totalRps)} req/s | Capacity: ${capacityRps ?? "unmodeled"} req/s`,
      };

      // Service capacity bottleneck rule (BOT-SRV-001)
      if (ratio !== undefined && ratio >= 0.9) {
        const isCritical = ratio > 1.0;
        findings.push({
          id: `BOT-SRV-001:${node.id}`,
          ruleId: "BOT-SRV-001",
          bottleneckType: "service_saturation",
          severity: isCritical ? "critical" : "high",
          title: `Service Saturation Constraint: ${node.label || node.type}`,
          explanation: `Service "${node.label || node.type}" is estimated to operate at ${Math.round(ratio * 100)}% utilization under the "${scenario.name}" scenario (${Math.round(demand.totalRps)} req/s demand vs ${capacityRps} req/s capacity). Requests will experience queueing delays and potential dropped connections.`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: [],
          evidence: [
            {
              kind: "metric",
              elementId: node.id,
              propertyKey: "utilizationRatio",
              expectedValue: "< 0.85 (85%)",
              actualValue: `${Math.round(ratio * 100)}%`,
              description: `Estimated demand (${Math.round(demand.totalRps)} rps) exceeds target utilization threshold.`,
            },
          ],
          assumptions: [
            `Ingress rate is ${scenario.parameters.ingressRps} rps with ${scenario.parameters.peakMultiplier}x peak multiplier.`,
            `Service processing time is estimated at ${cap?.processingTimeMs}ms.`,
          ],
          calculations: [
            {
              formula: "utilizationRatio = demandRps / declaredCapacityRps",
              variables: {
                demandRps: Math.round(demand.totalRps),
                declaredCapacityRps: capacityRps!,
              },
              result: ratio,
              unit: "ratio",
              explanation: "Demand relative to declared service throughput limit.",
            },
            {
              formula: "concurrencyDemand = demandRps * (processingTimeMs / 1000)",
              variables: {
                demandRps: Math.round(demand.totalRps),
                processingTimeMs: cap?.processingTimeMs || 10,
              },
              result: concurrencyDemand,
              unit: "threads",
              explanation: "Estimated concurrent active worker threads required.",
            },
          ],
          recommendationIds: ["REC-BOT-SRV-001"],
          confidence: "high",
          tradeOffs: [
            "Horizontal autoscaling increases cloud compute costs and infrastructure complexity.",
            "Aggressive worker concurrency can increase downstream database connection pool pressure.",
          ],
        });
      }
    }

    return { findings, nodeUtilizations };
  }
}
