import type { BaseNode } from "@nxtqr/graph-schema";
import type { AnalyzerContext, DimensionAssessment, HealthFinding } from "../contracts/health.types";
import type { IAnalyzer } from "./analyzer-interface";
import { calculateDimensionScore } from "../scoring/score-calculator";

export class MaintainabilityAnalyzer implements IAnalyzer {
  public analyze(context: AnalyzerContext): DimensionAssessment {
    const { nodes, index, scoringPolicy } = context;
    const findings: HealthFinding[] = [];
    const assumptionsEvaluated: string[] = [];

    const evidenceCount = nodes.length;

    // Rule 1: Circular Service Dependencies (Strongly Connected Components > 1)
    for (const cycle of index.sccResult.cycles) {
      if (cycle.length > 1) {
        const cycleLabels = cycle
          .map((id: string) => index.nodeMap.get(id)?.label || index.nodeMap.get(id)?.type || id)
          .join(" ⇄ ");

        assumptionsEvaluated.push(`Cycle ${cycle.join(",")} dependency verification`);

        findings.push({
          id: `MAINT-CYCLE-001:${cycle.sort().join("-")}`,
          ruleId: "MAINT-CYCLE-001",
          dimension: "maintainability",
          severity: "high",
          title: `Circular Service Dependency (${cycle.length} services)`,
          explanation: `A cyclical dependency loop exists among services: ${cycleLabels}. Circular coupling prevents independent deployments, complicates canary rollouts, and risks distributed deadlocks.`,
          evidence: [
            {
              kind: "node",
              elementId: cycle[0],
              description: `Cyclic dependency chain detected across nodes: ${cycle.join(", ")}`,
            },
          ],
          affectedNodeIds: cycle,
          affectedEdgeIds: [],
          assumptions: ["Dependencies represent synchronous operational inter-service calls."],
          confidence: "high",
          recommendationIds: ["REC-MAINT-001"],
          documentationId: "event-subscription",
        });
      }
    }

    // Rule 2: Shared Database Anti-Pattern
    for (const dbId of index.dataStoreIds) {
      const dbNode = index.nodeMap.get(dbId);
      if (dbNode && (dbNode.type.includes("relational") || dbNode.type.includes("database"))) {
        const upstreams = index.getUpstreamNodes(dbId);
        const serviceUpstreams = upstreams.filter((u: BaseNode) => index.computeIds.includes(u.id));
        assumptionsEvaluated.push(`Database ${dbId} microservice schema coupling check`);

        if (serviceUpstreams.length >= 3) {
          findings.push({
            id: `MAINT-SHARED-DB-001:${dbId}`,
            ruleId: "MAINT-SHARED-DB-001",
            dimension: "maintainability",
            severity: "medium",
            title: `Shared Database Anti-Pattern: ${dbNode.label || dbNode.type}`,
            explanation: `${serviceUpstreams.length} distinct services directly connect to the same transactional database "${dbNode.label || dbNode.type}". Shared databases tightly couple service schema changes and blur domain ownership.`,
            evidence: [
              {
                kind: "node",
                elementId: dbId,
                description: `${serviceUpstreams.length} services directly querying same database.`,
              },
            ],
            affectedNodeIds: [dbId, ...serviceUpstreams.map((s: BaseNode) => s.id)],
            affectedEdgeIds: [],
            assumptions: ["Services belong to distinct bounded domains rather than a single horizontal scale group."],
            confidence: "medium",
            recommendationIds: ["REC-MAINT-002"],
            documentationId: "relational-database",
          });
        }
      }
    }

    // Rule 3: God Service Choke Point (Excessive In-Degree and Out-Degree)
    for (const node of nodes) {
      const inDeg = index.getInDegree(node.id);
      const outDeg = index.getOutDegree(node.id);
      assumptionsEvaluated.push(`Service ${node.id} coupling density check`);

      if (inDeg >= 4 && outDeg >= 4) {
        findings.push({
          id: `MAINT-GOD-001:${node.id}`,
          ruleId: "MAINT-GOD-001",
          dimension: "maintainability",
          severity: "low",
          title: `High Coupling Choke Point: ${node.label || node.type}`,
          explanation: `Component "${node.label || node.type}" has ${inDeg} incoming and ${outDeg} outgoing connections. High central coupling indicates a monolithic controller with shared responsibilities.`,
          evidence: [
            {
              kind: "metric",
              elementId: node.id,
              description: `In-degree = ${inDeg}, Out-degree = ${outDeg}`,
            },
          ],
          affectedNodeIds: [node.id],
          affectedEdgeIds: [],
          assumptions: ["Component is an application service rather than an infrastructure bus."],
          confidence: "medium",
          recommendationIds: ["REC-MAINT-003"],
          documentationId: "saga-orchestrator",
        });
      }
    }

    const summary =
      findings.length === 0
        ? "Architecture maintains clean service boundaries, acyclic dependencies, and well-isolated data stores."
        : `Identified ${findings.length} maintainability issues including circular dependencies or shared database couplings.`;

    return calculateDimensionScore(
      "maintainability",
      findings,
      evidenceCount,
      assumptionsEvaluated,
      summary,
      scoringPolicy
    );
  }
}
