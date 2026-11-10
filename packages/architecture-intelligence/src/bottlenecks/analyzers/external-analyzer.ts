import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type {
  BottleneckFinding,
  WorkloadScenario,
} from "../contracts/bottleneck.types";
import type { NodeTrafficDemand } from "../engine/traffic-resolver";

export class ExternalAnalyzer {
  public static analyze(
    nodes: BaseNode[],
    _index: GraphIndex,
    demandMap: Map<string, NodeTrafficDemand>,
    scenario: WorkloadScenario
  ): BottleneckFinding[] {
    const findings: BottleneckFinding[] = [];

    for (const node of nodes) {
      const type = node.type.toLowerCase();
      const isExternal =
        type.includes("external") ||
        type.includes("payment-gateway") ||
        type.includes("saas") ||
        type.includes("third-party") ||
        type.includes("email-service") ||
        type.includes("sms") ||
        Boolean(node.data?.isExternal);

      if (!isExternal) continue;

      const demand = demandMap.get(node.id);
      if (!demand || demand.totalRps <= 0) continue;

      const data = node.data || {};
      const rateLimitRps = Number(data.rateLimitRps || data.maxRps || data.quotaRps || 200); // 200 rps baseline external limit
      const demandRps = Math.round(demand.totalRps);

      const ratio = Math.round((demandRps / Math.max(1, rateLimitRps)) * 100) / 100;

      // Rule BOT-EXT-001: External Dependency Rate Limit Saturation
      if (ratio >= 0.80) {
        const isCritical = ratio > 1.0;
        findings.push({
          id: `BOT-EXT-001:${node.id}`,
          ruleId: "BOT-EXT-001",
          bottleneckType: "external_quota",
          severity: isCritical ? "critical" : "high",
          title: `External Dependency Quota Limit: ${node.label || node.type}`,
          explanation: `Traffic to external vendor service "${node.label || node.type}" is projected at ${demandRps} req/s against a provider quota limit of ${rateLimitRps} req/s under scenario "${scenario.name}" (${Math.round(ratio * 100)}% quota utilization). The external provider will reject requests with HTTP 429 (Too Many Requests).`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: [],
          evidence: [
            {
              kind: "metric",
              elementId: node.id,
              propertyKey: "rateLimitRps",
              expectedValue: `< ${rateLimitRps} req/s`,
              actualValue: `${demandRps} req/s`,
              description: `Traffic demand exceeds third-party API provider rate limit.`,
            },
          ],
          assumptions: [
            `External service quota limit is configured at ${rateLimitRps} req/s.`,
            "Assumes provider rejects surplus requests rather than queuing them.",
          ],
          calculations: [
            {
              formula: "quotaUtilization = demandRps / rateLimitRps",
              variables: {
                demandRps,
                rateLimitRps,
              },
              result: ratio,
              unit: "ratio",
              explanation: "Estimated external API demand relative to contracted tier quota.",
            },
          ],
          recommendationIds: ["REC-BOT-EXT-001"],
          confidence: "high",
          tradeOffs: [
            "Contracting a higher API tier increases recurring operational SaaS spend.",
            "Introducing asynchronous queues or client-side batching adds latency before external confirmation.",
          ],
        });
      }
    }

    return findings;
  }
}
