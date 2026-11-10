import type { IScalabilityStrategyEvaluator, ScalabilityEvaluationContext } from "../contracts/scalability.types";
import type { ScalabilityRecommendation } from "../schemas/scalability.schemas";

const DATABASE_COMPONENT_TYPES = new Set([
  "relational-database",
  "nosql-database",
  "key-value-store",
  "graph-database",
  "time-series-database",
]);

export class CachingEvaluator implements IScalabilityStrategyEvaluator {
  public readonly strategy = "caching";

  public evaluate(context: ScalabilityEvaluationContext): ScalabilityRecommendation[] {
    const recommendations: ScalabilityRecommendation[] = [];

    // Check if system already has an in-memory cache directly attached to the target
    const existingCacheNodeIds = new Set(
      context.nodes
        .filter((n) => {
          const type = (n.data?.componentType as string) || n.type || "";
          return type === "in-memory-cache" || type === "distributed-cache";
        })
        .map((n) => n.id)
    );

    for (const [nodeId, utilization] of Object.entries(context.bottleneckReport.nodeUtilization)) {
      const node = context.nodeMap.get(nodeId);
      if (!node) continue;

      const rawData = (node.data || {}) as Record<string, unknown>;
      const componentType = (rawData.componentType as string) || node.type || "";
      const label = (rawData.label as string) || nodeId;

      const isDatabase = DATABASE_COMPONENT_TYPES.has(componentType);
      if (!isDatabase) continue;

      // Check read volume
      const isReadHeavy =
        context.scenario.parameters.readRatio >= 0.70 ||
        utilization.demandReadRps > 500;

      const isStrained =
        utilization.status === "exceeding_capacity" ||
        utilization.status === "near_saturation" ||
        context.bottleneckReport.findings.some(
          (f) => f.affectedNodeIds.includes(nodeId) && f.bottleneckType === "database_contention"
        );

      if (isReadHeavy && isStrained) {
        // Check if incoming callers already go through a cache
        const inEdges = context.incomingEdgesMap.get(nodeId) || [];
        const hasDirectCacheNeighbor = inEdges.some((e) => existingCacheNodeIds.has(e.source));

        if (!hasDirectCacheNeighbor) {
          const expectedHitRate = context.scenario.parameters.cacheHitRate || 0.80;
          const estimatedReliefRps = Math.round(utilization.demandReadRps * expectedHitRate);

          const cacheNodeId = `cache_${nodeId}_layer`;
          const sourceFindings = context.bottleneckReport.findings
            .filter((f) => f.affectedNodeIds.includes(nodeId))
            .map((f) => f.id);

          recommendations.push({
            id: `REC-SCALE-CACHE-${nodeId}`,
            strategy: "caching",
            title: `Introduce Distributed In-Memory Cache Ahead of (${label})`,
            summary: `Read demand of ${Math.round(utilization.demandReadRps)} req/s is overwhelming database queries. Deploying an In-Memory Cache (Redis/KeyDB) with an assumed ${(expectedHitRate * 100).toFixed(0)}% hit-rate will offload ~${estimatedReliefRps} read queries per second.`,
            affectedNodeIds: [nodeId],
            affectedEdgeIds: inEdges.map((e) => e.id),
            sourceFindingIds: sourceFindings,
            feasibility: "applicable",
            feasibilityReasoning: `Workload scenario is read-dominant (${(context.scenario.parameters.readRatio * 100).toFixed(0)}% reads). Relational queries for repeated reads are highly cacheable.`,
            evidence: [
              {
                kind: "metric",
                elementId: nodeId,
                propertyKey: "demandReadRps",
                expectedValue: `< ${utilization.declaredCapacityRps || 1000}`,
                actualValue: utilization.demandReadRps,
                description: `Database read traffic (${Math.round(utilization.demandReadRps)} rps) causes query lock contention under ${context.scenario.name}.`,
              },
            ],
            assumptions: [
              `Cache hit rate estimated at ${(expectedHitRate * 100).toFixed(0)}% based on standard query caching locality.`,
              "Application supports Cache-Aside or Read-Through pattern with bounded TTL expiration.",
            ],
            prerequisites: [
              "Define explicit cache invalidation policies (TTL or event-driven invalidation on writes).",
              "Ensure serialized cache values do not exceed key-value store memory bounds.",
            ],
            benefits: [
              `Eliminates up to ${(expectedHitRate * 100).toFixed(0)}% of database read queries.`,
              "Reduces P99 query latency from disk/relational lookup to sub-millisecond memory fetch.",
            ],
            tradeoffs: {
              implementationComplexity: "medium",
              operationalComplexity: "medium",
              reversibility: "easy",
              reliabilityImplications: "Requires cache cluster high-availability to prevent thundering herd / cache stampede on restart.",
              securityImplications: "Sensitive records cached in memory require encryption-at-rest and TLS connections.",
              consistencyImplications: "Introduces eventual consistency window between database update and cache invalidation.",
              costImpact: "Moderate: adds dedicated Redis/memory cluster nodes.",
            },
            confidence: "high",
            rankScore: 90,
            proposedOperations: [
              {
                type: "add_node",
                node: {
                  id: cacheNodeId,
                  type: "infrastructure",
                  position: { x: node.position.x - 140, y: node.position.y + 100 },
                  label: "In-Memory Cache (Redis)",
                  data: {
                    componentType: "in-memory-cache",
                    label: "In-Memory Cache (Redis)",
                    cacheStrategy: "cache-aside",
                    evictionPolicy: "volatile-lru",
                    capacityMb: 8192,
                    enforcesTls: true,
                  },
                },
              },
              {
                type: "add_edge",
                edge: {
                  id: `edge_${cacheNodeId}_to_${nodeId}`,
                  source: cacheNodeId,
                  target: nodeId,
                  data: {
                    protocol: "redis",
                    relationshipKind: "cache-lookup",
                    encryptionInTransit: true,
                  },
                },
              },
            ],
            documentationId: "scale-caching",
          });
        }
      }
    }

    return recommendations;
  }
}
