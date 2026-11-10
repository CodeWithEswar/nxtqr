import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type {
  BottleneckFinding,
  WorkloadScenario,
} from "../contracts/bottleneck.types";
import type { NodeTrafficDemand } from "../engine/traffic-resolver";

export class CacheAnalyzer {
  public static analyze(
    _nodes: BaseNode[],
    index: GraphIndex,
    demandMap: Map<string, NodeTrafficDemand>,
    scenario: WorkloadScenario
  ): BottleneckFinding[] {
    const findings: BottleneckFinding[] = [];
    const hitRate = scenario.parameters.cacheHitRate;

    for (const cacheId of index.cacheIds) {
      const cacheNode = index.nodeMap.get(cacheId);
      if (!cacheNode) continue;

      const demand = demandMap.get(cacheId) || { totalRps: 0, readRps: 0, writeRps: 0, bandwidthMbps: 0 };
      const incomingReads = Math.round(demand.readRps);
      const missedReads = Math.round(incomingReads * (1 - hitRate));

      // Rule BOT-CACHE-001: Low Cache Hit Rate Amplifying Backend Load
      if (hitRate < 0.70 && incomingReads >= 100) {
        findings.push({
          id: `BOT-CACHE-001:${cacheId}`,
          ruleId: "BOT-CACHE-001",
          bottleneckType: "cache_miss_amplification",
          severity: "medium",
          title: `Cache Miss Amplification: ${cacheNode.label || cacheNode.type}`,
          explanation: `Cache hit rate is modeled at ${Math.round(hitRate * 100)}% under the "${scenario.name}" scenario. Out of ${incomingReads} read req/s, ${missedReads} req/s (${Math.round((1 - hitRate) * 100)}%) miss the cache and fall through directly to downstream databases.`,
          affectedNodeIds: [cacheId],
          affectedEdgeIds: [],
          evidence: [
            {
              kind: "metric",
              elementId: cacheId,
              propertyKey: "cacheHitRate",
              expectedValue: ">= 0.80 (80%)",
              actualValue: `${Math.round(hitRate * 100)}%`,
              description: `Cache hit rate is below recommended efficiency baseline.`,
            },
          ],
          assumptions: [
            `Cache hit rate is set to ${Math.round(hitRate * 100)}% in scenario "${scenario.name}".`,
          ],
          calculations: [
            {
              formula: "backendMissRps = incomingReads * (1 - cacheHitRate)",
              variables: {
                incomingReads,
                cacheHitRate: hitRate,
              },
              result: missedReads,
              unit: "req/s",
              explanation: "Read requests penetrating cache directly to persistent storage.",
            },
          ],
          recommendationIds: ["REC-BOT-CACHE-001"],
          confidence: "high",
          tradeOffs: [
            "Increasing TTL risks serving stale data if write invalidation events are delayed.",
            "Expanding cache memory allocations (maxmemory) increases infrastructure hosting costs.",
          ],
        });
      }

      // Rule BOT-CACHE-STAMP-001: Cache Stampede Risk on Low TTL
      const ttl = Number(cacheNode.data?.ttlSeconds || cacheNode.data?.cacheTtlSeconds || 60);
      if (ttl <= 10 && incomingReads >= 1000) {
        findings.push({
          id: `BOT-CACHE-STAMP-001:${cacheId}`,
          ruleId: "BOT-CACHE-STAMP-001",
          bottleneckType: "cache_miss_amplification",
          severity: "high",
          title: `Cache Stampede Hazard on Short TTL: ${cacheNode.label || cacheNode.type}`,
          explanation: `Cache "${cacheNode.label || cacheNode.type}" has an aggressive TTL of ${ttl}s with high concurrency (${incomingReads} req/s). When hot cache keys expire, simultaneous concurrent requests will hit the downstream database simultaneously (thundering herd problem).`,
          affectedNodeIds: [cacheId],
          affectedEdgeIds: [],
          evidence: [
            {
              kind: "property",
              elementId: cacheId,
              propertyKey: "ttlSeconds",
              expectedValue: "> 10s",
              actualValue: `${ttl}s`,
              description: `Short TTL exposes backend to stampede spikes upon expiration.`,
            },
          ],
          assumptions: [
            "Assumes hot keys are frequently read without request coalescing / singleflight guards.",
          ],
          calculations: [
            {
              formula: "concurrentExpiryPressure = incomingReads * (1 / ttlSeconds)",
              variables: {
                incomingReads,
                ttlSeconds: ttl,
              },
              result: Math.round(incomingReads / ttl),
              unit: "req/s",
              explanation: "Estimated backend surge during key expiration interval.",
            },
          ],
          recommendationIds: ["REC-BOT-CACHE-002"],
          confidence: "high",
          tradeOffs: [
            "Probabilistic early expiration (XFetch) or mutex locking increases cache client code complexity.",
            "Longer TTL requires reliable cache invalidation webhooks on entity updates.",
          ],
        });
      }
    }

    return findings;
  }
}
