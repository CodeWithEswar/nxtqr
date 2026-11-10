import type { AnalyzerContext, DimensionAssessment, HealthFinding } from "../contracts/health.types";
import type { IAnalyzer } from "./analyzer-interface";
import { calculateDimensionScore } from "../scoring/score-calculator";

export class PerformanceAnalyzer implements IAnalyzer {
  public analyze(context: AnalyzerContext): DimensionAssessment {
    const { nodes, edges, index, scoringPolicy } = context;
    const findings: HealthFinding[] = [];
    const assumptionsEvaluated: string[] = [];

    const evidenceCount = nodes.length;

    // Rule 1: Deep Synchronous Call Chain (Depth > 4 hops)
    for (const path of index.criticalPaths) {
      if (path.isSynchronous && path.depth > 4) {
        const pathLabels = path.nodeIds
          .map((id: string) => index.nodeMap.get(id)?.label || index.nodeMap.get(id)?.type || id)
          .join(" → ");

        assumptionsEvaluated.push(`Critical path ${pathLabels} synchronous depth check`);

        findings.push({
          id: `PERF-DEPTH-001:${path.nodeIds.slice(0, 3).join("-")}`,
          ruleId: "PERF-DEPTH-001",
          dimension: "performance",
          severity: "medium",
          title: `Deep Synchronous Call Chain (${path.depth} hops)`,
          explanation: `A synchronous execution chain spans ${path.depth} serial service hops: ${pathLabels}. Serial dependencies compound tail latency, increase failure probability, and hold open connection sockets.`,
          evidence: [
            {
              kind: "metric",
              propertyKey: "synchronousDepth",
              expectedValue: "<= 4 hops",
              actualValue: `${path.depth} hops`,
              description: `Synchronous call depth exceeds recommended SLA threshold.`,
            },
          ],
          affectedNodeIds: path.nodeIds,
          affectedEdgeIds: [],
          assumptions: ["All calls in chain are blocking synchronous network invocations."],
          confidence: "high",
          recommendationIds: ["REC-PERF-001"],
          documentationId: "api-gateway",
        });
        break; // Report the worst path to avoid duplicate noise
      }
    }

    // Rule 2: Heavy Synchronous Processing (AI Model / Batch Job called synchronously)
    for (const edge of edges) {
      const tgtNode = index.nodeMap.get(edge.target);
      if (tgtNode) {
        const type = tgtNode.type.toLowerCase();
        const isHeavyService =
          type.includes("model-serving") ||
          type.includes("fine-tuning") ||
          type.includes("gpu-cluster") ||
          type.includes("batch-job") ||
          type.includes("data-pipeline");

        const relKind = (edge.data?.relationshipKind as string) || "request-response";
        const isSync = relKind === "request-response";

        if (isHeavyService && isSync) {
          assumptionsEvaluated.push(`Heavy service ${tgtNode.id} synchronous invocation check`);

          findings.push({
            id: `PERF-HEAVY-SYNC-001:${edge.id}`,
            ruleId: "PERF-HEAVY-SYNC-001",
            dimension: "performance",
            severity: "high",
            title: `Synchronous Call to Heavy Compute Workload: ${tgtNode.label || tgtNode.type}`,
            explanation: `Heavy workload "${tgtNode.label || tgtNode.type}" is called synchronously on an interactive path. Long model inference or batch processing blocks upstream clients and can trigger client-side timeouts.`,
            evidence: [
              {
                kind: "edge",
                elementId: edge.id,
                description: `Synchronous request-response edge into heavy compute service ${tgtNode.id}.`,
              },
            ],
            affectedNodeIds: [edge.source, edge.target],
            affectedEdgeIds: [edge.id],
            assumptions: ["Assumes workload is not a cached sub-millisecond quantized model."],
            confidence: "high",
            recommendationIds: ["REC-PERF-002"],
            documentationId: "message-queue",
          });
        }
      }
    }

    const summary =
      findings.length === 0
        ? "Architecture exhibits lean synchronous paths and decoupled high-latency workloads."
        : `Identified ${findings.length} performance bottlenecks including deep serial call chains and unbuffered heavy compute.`;

    return calculateDimensionScore(
      "performance",
      findings,
      evidenceCount,
      assumptionsEvaluated,
      summary,
      scoringPolicy
    );
  }
}
