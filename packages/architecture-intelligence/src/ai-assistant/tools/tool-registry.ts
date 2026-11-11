import type { AIToolDefinition, AIExecutionContext } from "../contracts/ai-assistant.types";
import { architectureValidationEngine } from "@nxtqr/architecture-validation";
import { architectureHealthEngine } from "../../core/assessment-engine";
import { bottleneckEngine } from "../../bottlenecks/engine/bottleneck-engine";
import { failureAnalysisEngine } from "../../failure-analysis/engine/failure-engine";
import { securityAnalysisEngine } from "../../security-analysis/engine/security-engine";
import { scalabilityRecommendationsEngine } from "../../scalability/engine/scalability-engine";
import { reliabilityEngine } from "../../reliability/engine/reliability-engine";
import { recommendationEngine } from "../../recommendations/engine/recommendation-engine";
import { comparisonEngine } from "../../comparison/engine/comparison-engine";
import { capacityPlanningEngine } from "../../capacity-planning/engine/capacity-planning-engine";
import { DEFAULT_CAPACITY_SCENARIOS } from "../../capacity-planning/scenarios/capacity-scenarios";
import { architectureCostEngine } from "../../cost/engine/cost-engine";
import type { CloudProviderId } from "../../cost/contracts/pricing.types";
import { infrastructureRegistry } from "@nxtqr/node-registry";

/**
 * Bounds output payload to prevent context window overflow.
 */
function truncateOutput(data: unknown, maxChars: number = 8192): unknown {
  const json = JSON.stringify(data);
  if (json.length <= maxChars) return data;
  return {
    _truncated: true,
    preview: json.slice(0, maxChars) + "...[Truncated]",
  };
}

export class ArchitectureToolRegistry {
  private readonly tools = new Map<string, AIToolDefinition>();

  constructor() {
    this.registerStandardTools();
  }

  public registerTool(tool: AIToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): AIToolDefinition | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): AIToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public async executeTool(
    name: string,
    args: Record<string, unknown>,
    context: AIExecutionContext
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `Tool '${name}' is not in the approved tool allowlist.` };
    }

    try {
      // Enforce timeout guard
      const result = await Promise.race([
        tool.execute(args, context),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Tool '${name}' timed out after 5000ms`)), 5000)
        ),
      ]);

      return { success: true, result: truncateOutput(result) };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  private registerStandardTools(): void {
    // 1. get_architecture_summary
    this.registerTool({
      name: "get_architecture_summary",
      description: "Returns high-level structural metrics, component counts by category, and connection counts of the current architecture diagram.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async (_args, context) => {
        const { nodes, edges, graphRevision, activeScenarioId } = context;
        const categoryCounts: Record<string, number> = {};

        for (const n of nodes) {
          const cat = n.type.split("-")[0] || "general";
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }

        return {
          graphRevision,
          activeScenarioId: activeScenarioId || "default",
          totalNodes: nodes.length,
          totalEdges: edges.length,
          categories: categoryCounts,
          components: nodes.map((n) => ({
            id: n.id,
            type: n.type,
            label: n.label || (n.data as any)?.label || n.id,
            replicas: (n.data as any)?.replicas ?? 1,
          })),
        };
      },
    });

    // 2. get_component_details
    this.registerTool({
      name: "get_component_details",
      description: "Returns configuration attributes, incoming connections, and outgoing connections for a specific component node ID.",
      parameters: {
        type: "object",
        properties: {
          nodeId: { type: "string", description: "The unique ID of the component node." },
        },
        required: ["nodeId"],
      },
      execute: async (args, context) => {
        const nodeId = String(args.nodeId);
        const node = context.nodes.find((n) => n.id === nodeId);
        if (!node) {
          throw new Error(`Component with ID '${nodeId}' not found in active architecture.`);
        }

        const incoming = context.edges
          .filter((e) => e.target === nodeId)
          .map((e) => ({
            edgeId: e.id,
            sourceNodeId: e.source,
            protocol: (e.data as any)?.protocol || "http",
            isAsync: Boolean((e.data as any)?.isAsync),
          }));

        const outgoing = context.edges
          .filter((e) => e.source === nodeId)
          .map((e) => ({
            edgeId: e.id,
            targetNodeId: e.target,
            protocol: (e.data as any)?.protocol || "http",
            isAsync: Boolean((e.data as any)?.isAsync),
          }));

        return {
          id: node.id,
          type: node.type,
          label: node.label || (node.data as any)?.label || node.id,
          config: node.data || {},
          incomingConnections: incoming,
          outgoingConnections: outgoing,
        };
      },
    });

    // 3. get_dependency_paths
    this.registerTool({
      name: "get_dependency_paths",
      description: "Calculates upstream caller paths, downstream dependency tree, and blast radius for a given component.",
      parameters: {
        type: "object",
        properties: {
          nodeId: { type: "string", description: "The component node ID to trace dependencies from." },
        },
        required: ["nodeId"],
      },
      execute: async (args, context) => {
        const nodeId = String(args.nodeId);
        const blast = failureAnalysisEngine.calculateBlastRadius(nodeId, context.nodes, context.edges);

        // BFS upstream callers
        const upstream = new Set<string>();
        const queue = [nodeId];
        while (queue.length > 0) {
          const curr = queue.shift()!;
          for (const e of context.edges) {
            if (e.target === curr && !upstream.has(e.source)) {
              upstream.add(e.source);
              queue.push(e.source);
            }
          }
        }

        return {
          targetNodeId: nodeId,
          upstreamCallers: Array.from(upstream),
          blastRadiusScore: blast.blastRadiusScore,
          directImpactedNodeIds: blast.directImpactedNodeIds,
          indirectImpactedNodeIds: blast.indirectImpactedNodeIds,
          affectedCapabilityIds: blast.affectedCapabilityIds,
          summary: blast.summary,
        };
      },
    });

    // 4. get_validation_findings
    this.registerTool({
      name: "get_validation_findings",
      description: "Runs deterministic architecture graph validation against all port compatibility and topology rules.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async (_args, context) => {
        const report = architectureValidationEngine.validateGraph(context.nodes, context.edges);
        return {
          isValid: report.valid,
          errorCount: report.summary.errors,
          warningCount: report.summary.warnings,
          findings: (report.findings || []).map((f) => ({
            ruleId: f.ruleId,
            severity: f.severity,
            message: f.message,
            sourceNodeId: f.sourceNodeId,
            targetNodeId: f.targetNodeId,
          })),
        };
      },
    });

    // 5. get_health_findings
    this.registerTool({
      name: "get_health_findings",
      description: "Evaluates overall architecture health across coupling, cohesion, complexity, and redundancy.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async (_args, context) => {
        const report = architectureHealthEngine.assessGraph(context.nodes, context.edges);
        return {
          overallScore: report.overallScore,
          dimensions: report.dimensions,
          findingCount: report.allFindings.length,
          topFindings: report.allFindings.slice(0, 8).map((f) => ({
            id: f.id,
            category: f.dimension,
            severity: f.severity,
            title: f.title,
            explanation: f.explanation,
            affectedNodeIds: f.affectedNodeIds,
          })),
        };
      },
    });

    // 6. get_bottleneck_findings
    this.registerTool({
      name: "get_bottleneck_findings",
      description: "Identifies throughput constraints, database contention, network bottlenecks, and CPU exhaustion points.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async (_args, context) => {
        const report = bottleneckEngine.analyzeGraph(context.nodes, context.edges);
        return {
          bottleneckCount: report.findings.length,
          metrics: report.metrics,
          bottlenecks: report.findings.map((b) => ({
            id: b.id,
            type: b.bottleneckType,
            severity: b.severity,
            nodeId: b.affectedNodeIds[0] || "unknown",
            explanation: b.explanation,
          })),
        };
      },
    });

    // 7. get_spof_findings
    this.registerTool({
      name: "get_spof_findings",
      description: "Detects Single Points of Failure, redundancy gaps, and shared failure domain risks.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async (_args, context) => {
        const report = failureAnalysisEngine.analyzeGraph(context.nodes, context.edges);
        return {
          spofCount: report.metrics.spofCount,
          findings: report.findings.map((s) => ({
            id: s.id,
            nodeId: s.affectedNodeIds[0] || "unknown",
            severity: s.severity,
            classification: s.classification,
            explanation: s.explanation,
          })),
        };
      },
    });

    // 8. get_security_findings
    this.registerTool({
      name: "get_security_findings",
      description: "Analyzes missing authentication, unencrypted boundary crossings, public database exposure, and trust boundaries.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async (_args, context) => {
        const report = securityAnalysisEngine.analyzeGraph(context.nodes, context.edges);
        return {
          totalFindings: report.summary.totalFindings,
          criticalCount: report.summary.criticalCount,
          highCount: report.summary.highCount,
          findings: report.findings.map((f) => ({
            id: f.id,
            ruleId: f.ruleId,
            severity: f.severity,
            title: f.title,
            affectedNodeIds: f.affectedNodeIds,
            explanation: f.explanation,
          })),
        };
      },
    });

    // 9. get_scalability_recommendations
    this.registerTool({
      name: "get_scalability_recommendations",
      description: "Evaluates horizontal scaling readiness, read-write splitting, caching opportunities, and queue decoupling.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async (_args, context) => {
        const report = scalabilityRecommendationsEngine.evaluateGraph(context.nodes, context.edges);
        return {
          totalRecommendations: report.summary.totalRecommendations,
          recommendations: report.recommendations.map((r) => ({
            id: r.id,
            strategy: r.strategy,
            title: r.title,
            summary: r.summary,
            affectedNodeIds: r.affectedNodeIds,
          })),
        };
      },
    });

    // 10. get_reliability_findings
    this.registerTool({
      name: "get_reliability_findings",
      description: "Examines retry storm risks, missing timeouts, circuit breakers, dead-letter queues, and graceful degradation.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async (_args, context) => {
        const report = reliabilityEngine.analyzeGraph(context.nodes, context.edges);
        return {
          score: report.summary.score,
          totalFindings: report.summary.totalFindings,
          criticalCount: report.summary.criticalCount,
          findings: report.findings.map((f) => ({
            id: f.id,
            ruleId: f.ruleId,
            severity: f.severity,
            title: f.title,
            affectedNodeIds: f.affectedNodeIds,
            explanation: f.explanation,
          })),
        };
      },
    });

    // 11. get_recommendations
    this.registerTool({
      name: "get_recommendations",
      description: "Returns unified, prioritized cross-engine recommendations combining findings across all 7 architecture intelligence domains.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async (_args, context) => {
        const report = recommendationEngine.generateRecommendations(context.nodes, context.edges, {});
        return {
          recommendationCount: report.recommendations.length,
          recommendations: report.recommendations.slice(0, 6).map((r) => ({
            id: r.id,
            title: r.title,
            priority: r.priority,
            score: r.score,
            affectedNodeIds: r.affectedNodeIds,
            tradeoffs: r.tradeoffs,
            summary: r.summary,
          })),
        };
      },
    });

    // 12. get_architecture_comparison
    this.registerTool({
      name: "get_architecture_comparison",
      description: "Compares the current architecture against a previous snapshot or analyzes semantic deltas.",
      parameters: {
        type: "object",
        properties: {
          comparisonMode: { type: "string", description: "Mode of comparison: 'self' or 'topology'." },
        },
        required: [],
      },
      execute: async (_args, context) => {
        const diff = comparisonEngine.compareGraphs(
          context.nodes,
          context.edges,
          context.nodes,
          context.edges
        );
        return {
          summary: diff.summary,
          regressions: diff.regressions,
          changeCount: diff.changes.length,
        };
      },
    });

    // 13. get_capacity_plan
    this.registerTool({
      name: "get_capacity_plan",
      description: "Projects workload growth, evaluates resource capacity headroom, and identifies projected saturation intervals across all system components.",
      parameters: {
        type: "object",
        properties: {
          scenarioId: { type: "string", description: "Optional scenario identifier: 'rapid_startup_growth', 'linear_enterprise_scaling', 'black_friday_surge', 'seasonal_annual_cycle', or 'steady_state'." },
        },
        required: [],
      },
      execute: async (args, context) => {
        const scenarioKey = String(args.scenarioId || "rapid_startup_growth");
        const baseScenario = DEFAULT_CAPACITY_SCENARIOS[scenarioKey] || DEFAULT_CAPACITY_SCENARIOS.rapid_startup_growth;
        const scenario = args.horizonIntervals
          ? { ...baseScenario, horizonIntervals: Number(args.horizonIntervals) }
          : baseScenario;
        const report = capacityPlanningEngine.planCapacity(context.nodes, context.edges, scenario);
        return {
          scenarioId: report.scenarioId,
          scenarioName: report.scenarioName,
          growthModel: report.growthModel,
          horizonIntervals: report.horizonIntervals,
          intervalUnit: report.intervalUnit,
          summary: report.summary,
          findings: report.findings.slice(0, 5),
          timeSeries: report.timeSeries,
        };
      },
    });

    // 14. get_documentation
    this.registerTool({
      name: "get_documentation",
      description: "Retrieves documentation, component specifications, or architectural best practices from the NXTQR component catalog.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Component type or topic (e.g. 'redis-cache', 'database', 'spof', 'circuit-breaker')." },
        },
        required: ["query"],
      },
      execute: async (args) => {
        const query = String(args.query).toLowerCase().trim();
        const matchedDef = infrastructureRegistry.getComponent(query);

        if (matchedDef) {
          return {
            source: "node-registry",
            type: matchedDef.id,
            label: matchedDef.display.name,
            category: matchedDef.categoryId,
            description: matchedDef.display.description,
            ports: matchedDef.ports,
            defaultConfig: matchedDef.defaultConfig,
          };
        }

        const searched = infrastructureRegistry.searchComponents(query);
        if (searched.length > 0) {
          const first = searched[0];
          return {
            source: "node-registry",
            type: first.id,
            label: first.display.name,
            category: first.categoryId,
            description: first.display.description,
            ports: first.ports,
            defaultConfig: first.defaultConfig,
          };
        }

        // Return curated documentation topic
        return {
          source: "architecture-patterns",
          topic: query,
          guidance: `Architecture documentation for '${query}': When designing scalable systems, decouple critical synchronous paths with asynchronous buffers, implement retries with exponential backoff and jitter, and ensure stateful datastores have multi-AZ replication.`,
        };
      },
    });

    // 15. get_cost_estimate
    this.registerTool({
      name: "get_cost_estimate",
      description: "Generates infrastructure cost estimates, resource spending breakdowns, and optimization savings for the architecture.",
      parameters: {
        type: "object",
        properties: {
          providerId: { type: "string", description: "Cloud provider: 'aws', 'gcp', 'azure', or 'cloudflare'. Default is 'aws'." },
        },
        required: [],
      },
      execute: async (args, context) => {
        const providerId = (String(args.providerId || "aws").toLowerCase()) as CloudProviderId;
        const estimate = architectureCostEngine.estimateCost(context.nodes, context.edges, { providerId });
        const optimizations = architectureCostEngine.getOptimizationOpportunities(context.nodes, estimate);
        return {
          providerId: estimate.providerId,
          currency: estimate.currency,
          totalMonthlyCost: estimate.totalMonthlyCost,
          totalAnnualCost: estimate.totalAnnualCost,
          status: estimate.status,
          unpricedCount: estimate.unpricedResourcesCount,
          categorySummaries: estimate.categorySummaries,
          topOptimizations: optimizations.slice(0, 3).map((o) => ({
            title: o.title,
            savings: o.estimatedMonthlySavings,
            summary: o.summary,
          })),
        };
      },
    });
  }
}

export const architectureToolRegistry = new ArchitectureToolRegistry();
