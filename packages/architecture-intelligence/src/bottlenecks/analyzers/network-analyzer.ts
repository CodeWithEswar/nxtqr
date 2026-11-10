import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type {
  BottleneckFinding,
  WorkloadScenario,
} from "../contracts/bottleneck.types";
import type { NodeTrafficDemand } from "../engine/traffic-resolver";
import type { ResolvedComponentCapacity } from "../engine/capacity-resolver";

export class NetworkAnalyzer {
  public static analyze(
    nodes: BaseNode[],
    _index: GraphIndex,
    demandMap: Map<string, NodeTrafficDemand>,
    capacityMap: Map<string, ResolvedComponentCapacity>,
    scenario: WorkloadScenario
  ): BottleneckFinding[] {
    const findings: BottleneckFinding[] = [];

    for (const node of nodes) {
      const demand = demandMap.get(node.id);
      if (!demand || demand.totalRps <= 0) continue;

      const cap = capacityMap.get(node.id);
      const declaredBandwidthMbps = cap?.bandwidthMbps || Number(node.data?.bandwidthMbps || 1000); // default 1 Gbps
      const mbpsDemand = demand.bandwidthMbps;

      const bandwidthRatio = Math.round((mbpsDemand / Math.max(1, declaredBandwidthMbps)) * 100) / 100;

      // Rule BOT-NET-001: Network Bandwidth Saturation
      if (bandwidthRatio >= 0.85) {
        const isCritical = bandwidthRatio > 1.0;
        findings.push({
          id: `BOT-NET-001:${node.id}`,
          ruleId: "BOT-NET-001",
          bottleneckType: "network_bandwidth",
          severity: isCritical ? "critical" : "high",
          title: `Network Bandwidth Saturation: ${node.label || node.type}`,
          explanation: `Component "${node.label || node.type}" requires estimated network throughput of ${mbpsDemand} Mbps against a link limit of ${declaredBandwidthMbps} Mbps under scenario "${scenario.name}" (${Math.round(bandwidthRatio * 100)}% utilization). Network buffer bloat and TCP packet drops will increase tail latency.`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: [],
          evidence: [
            {
              kind: "metric",
              elementId: node.id,
              propertyKey: "bandwidthDemandMbps",
              expectedValue: `< ${Math.round(declaredBandwidthMbps * 0.85)} Mbps`,
              actualValue: `${mbpsDemand} Mbps`,
              description: `Bandwidth demand approaches or exceeds network interface card limit.`,
            },
          ],
          assumptions: [
            `Average payload size is ${Math.round((scenario.parameters.avgRequestSizeBytes + scenario.parameters.avgResponseSizeBytes) / 2 / 1024)} KB.`,
            `Total traffic volume is ${Math.round(demand.totalRps)} req/s.`,
          ],
          calculations: [
            {
              formula: "bandwidthMbps = (totalRps * avgPayloadBytes * 8) / 1_000_000",
              variables: {
                totalRps: Math.round(demand.totalRps),
                avgPayloadBytes: Math.round((scenario.parameters.avgRequestSizeBytes + scenario.parameters.avgResponseSizeBytes) / 2),
              },
              result: mbpsDemand,
              unit: "Mbps",
              explanation: "Calculated wire-level bandwidth demand.",
            },
          ],
          recommendationIds: ["REC-BOT-NET-001"],
          confidence: "high",
          tradeOffs: [
            "Upgrading network interface capacity (e.g. 10 Gbps / 25 Gbps ENA) requires larger VM instance types.",
            "Compressing payloads (Brotli/Gzip) adds CPU encoding latency.",
          ],
        });
      }
    }

    return findings;
  }
}
