import type { BaseNode } from "@nxtqr/graph-schema";
import type { AnalyzerContext, DimensionAssessment, HealthFinding } from "../contracts/health.types";
import type { EdgeConnectionInfo } from "../core/graph-index";
import type { IAnalyzer } from "./analyzer-interface";
import { calculateDimensionScore } from "../scoring/score-calculator";

export class ScalabilityAnalyzer implements IAnalyzer {
  public analyze(context: AnalyzerContext): DimensionAssessment {
    const { nodes, index, scoringPolicy } = context;
    const findings: HealthFinding[] = [];
    const assumptionsEvaluated: string[] = [];

    const evidenceCount = nodes.length;

    // Rule 1: High Synchronous Fan-Out Bottleneck
    for (const node of nodes) {
      const outEdges = index.forwardEdges.get(node.id) || [];
      const syncCalls = outEdges.filter((e: EdgeConnectionInfo) => e.isSynchronous);
      assumptionsEvaluated.push(`Service ${node.id} fan-out evaluation`);

      if (syncCalls.length > 5) {
        findings.push({
          id: `SCALE-FANOUT-001:${node.id}`,
          ruleId: "SCALE-FANOUT-001",
          dimension: "scalability",
          severity: "medium",
          title: `Excessive Synchronous Fan-Out: ${node.label || node.type}`,
          explanation: `Service "${node.label || node.type}" makes ${syncCalls.length} synchronous downstream calls. High fan-out compounds tail latency and risks thread pool exhaustion during traffic surges.`,
          evidence: [
            {
              kind: "metric",
              elementId: node.id,
              propertyKey: "synchronousFanOut",
              expectedValue: "<= 5",
              actualValue: syncCalls.length,
              description: `Synchronous call count exceeds recommended concurrency threshold.`,
            },
          ],
          affectedNodeIds: [node.id, ...syncCalls.map((e: EdgeConnectionInfo) => e.targetId)],
          affectedEdgeIds: syncCalls.map((e: EdgeConnectionInfo) => e.edgeId),
          assumptions: ["Calls are assumed to be non-parallelized or blocking thread pool threads."],
          confidence: "high",
          recommendationIds: ["REC-SCALE-001"],
          documentationId: "api-gateway",
        });
      }
    }

    // Rule 2: Uncached Read-Heavy Database Access
    for (const dbId of index.dataStoreIds) {
      const dbNode = index.nodeMap.get(dbId);
      if (dbNode && (dbNode.type.includes("relational") || dbNode.type.includes("sql"))) {
        const inDegree = index.getInDegree(dbId);
        assumptionsEvaluated.push(`Database ${dbId} cache layer verification`);

        // Check if any upstream node has a cache connected
        const upstreams = index.getUpstreamNodes(dbId);
        let hasCache = false;
        for (const u of upstreams) {
          const uDownstreams = index.getDownstreamNodes(u.id);
          if (uDownstreams.some((d: BaseNode) => index.cacheIds.includes(d.id))) {
            hasCache = true;
            break;
          }
        }

        if (inDegree >= 3 && !hasCache && index.cacheIds.length === 0) {
          findings.push({
            id: `SCALE-CACHE-001:${dbId}`,
            ruleId: "SCALE-CACHE-001",
            dimension: "scalability",
            severity: "low",
            title: `Direct Database Access without In-Memory Cache: ${dbNode.label || dbNode.type}`,
            explanation: `Primary database "${dbNode.label || dbNode.type}" serves ${inDegree} upstream services without an in-memory caching layer (e.g. Redis, Memcached). Repetitive reads may saturate database connections.`,
            evidence: [
              {
                kind: "node",
                elementId: dbId,
                description: `${inDegree} services directly querying relational database without caching.`,
              },
            ],
            affectedNodeIds: [dbId, ...upstreams.map((u: BaseNode) => u.id)],
            affectedEdgeIds: [],
            assumptions: ["Assumes workload contains recurring read queries."],
            confidence: "medium",
            recommendationIds: ["REC-SCALE-002"],
            documentationId: "distributed-cache",
          });
        }
      }
    }

    // Rule 3: Public Ingress without Rate Limiting
    for (const ingressId of index.entryPointIds) {
      const ingressNode = index.nodeMap.get(ingressId);
      if (ingressNode && (ingressNode.type.includes("api-gateway") || ingressNode.type.includes("ingress"))) {
        const data = ingressNode.data || {};
        assumptionsEvaluated.push(`Ingress ${ingressId} rate limiting verification`);

        if (data.rateLimitingEnabled === false || data.rateLimiting === false) {
          findings.push({
            id: `SCALE-RATELIMIT-001:${ingressId}`,
            ruleId: "SCALE-RATELIMIT-001",
            dimension: "scalability",
            severity: "medium",
            title: `Rate Limiting Disabled on Ingress: ${ingressNode.label || ingressNode.type}`,
            explanation: `API Gateway "${ingressNode.label || ingressNode.type}" has rate limiting explicitly disabled. Unthrottled request spikes can overwhelm internal downstream services.`,
            evidence: [
              {
                kind: "node",
                elementId: ingressId,
                propertyKey: "rateLimitingEnabled",
                expectedValue: true,
                actualValue: false,
                description: `Rate limiting is explicitly disabled on public entry point.`,
              },
            ],
            affectedNodeIds: [ingressId],
            affectedEdgeIds: [],
            assumptions: ["Assumes no third-party upstream WAF/CDN enforces edge rate limits."],
            confidence: "high",
            recommendationIds: ["REC-SCALE-003"],
            documentationId: "rate-limiter",
          });
        }
      }
    }

    // Rule 4: Compute Service with Fixed Single Replica and Autoscaling Disabled
    for (const cId of index.computeIds) {
      const cNode = index.nodeMap.get(cId);
      if (cNode) {
        const data = cNode.data || {};
        const replicas = Number(data.replicas ?? 1);
        const autoscaling = data.autoscalingEnabled ?? data.autoscaling ?? false;
        assumptionsEvaluated.push(`Compute ${cId} horizontal elasticity check`);

        if (replicas === 1 && autoscaling === false) {
          findings.push({
            id: `SCALE-STATE-001:${cId}`,
            ruleId: "SCALE-STATE-001",
            dimension: "scalability",
            severity: "low",
            title: `Fixed Single Instance without Autoscaling: ${cNode.label || cNode.type}`,
            explanation: `Compute workload "${cNode.label || cNode.type}" is configured with a fixed single replica and no horizontal autoscaling policy. It cannot dynamically scale under load increases.`,
            evidence: [
              {
                kind: "node",
                elementId: cId,
                propertyKey: "replicas",
                expectedValue: "> 1 or autoscalingEnabled: true",
                actualValue: 1,
                description: `Single instance compute without autoscaling.`,
              },
            ],
            affectedNodeIds: [cId],
            affectedEdgeIds: [],
            assumptions: ["Assumes workload is not an intentional singleton background daemon."],
            confidence: "medium",
            recommendationIds: ["REC-SCALE-004"],
            documentationId: "container-service",
          });
        }
      }
    }

    const summary =
      findings.length === 0
        ? "Architecture supports horizontal elasticity and scalable asynchronous decoupling."
        : `Identified ${findings.length} scalability concerns including potential concurrency bottlenecks and unbuffered workloads.`;

    return calculateDimensionScore(
      "scalability",
      findings,
      evidenceCount,
      assumptionsEvaluated,
      summary,
      scoringPolicy
    );
  }
}
