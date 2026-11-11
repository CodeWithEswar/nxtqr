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
import { architectureReportEngine } from "../../reports/engine/report-engine";
import { ReportExportCoordinator } from "../../reports/exporters";
import type { ReportAudience } from "../../reports/contracts/report.types";
import type { ReportExportFormat } from "../../reports/contracts/export.types";
import { ReviewCheckRunner } from "../../reviews/checks/check-runner";
import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";
import { architectureSimulationEngine } from "../../simulation/engine/simulation-engine";
import { SIMULATION_PRESETS } from "../../simulation/presets/failure-presets";
import { architectureObservabilityEngine } from "../../observability/engine/observability-engine";
import { MockTelemetryAdapter } from "../../observability/connectors/mock-telemetry-adapter";
import { architecturePerformanceEngine } from "../../performance/engine/performance-engine";
import { architectureDeploymentEngine } from "../../deployment/engine/deployment-engine";
import type { DeploymentTopology } from "../../deployment/contracts/deployment.types";
import { architectureDataLineageEngine } from "../../lineage/engine/lineage-engine";
import type { DataAsset, DataFlow } from "../../lineage/contracts/lineage.types";
import { architectureContractEngine } from "../../api-contracts/engine/contract-engine";
import type { APIContract } from "../../api-contracts/contracts/contract.types";
import { architectureMessagingEngine } from "../../messaging/engine/messaging-engine";
import type { MessagingTopology } from "../../messaging/contracts/messaging.types";
import { architectureCacheStateEngine } from "../../cache-state/engine/cache-state-engine";
import type { DistributedStateTopology } from "../../cache-state/contracts/cache-state.types";
import { architectureDatabaseEngine } from "../../database/engine/database-engine";
import type { DatabaseArchitectureTopology } from "../../database/contracts/database.types";
import { architectureNetworkEngine } from "../../network/engine/network-engine";
import type { NetworkArchitectureTopology } from "../../network/contracts/network.types";
import { architectureGovernanceEngine } from "../../governance/engine/governance-engine";
import type { GovernanceArchitectureTopology } from "../../governance/contracts/governance.types";
import { PolicyRegistry } from "../../governance/registry/policy-registry";
import { architectureEvolutionEngine } from "../../evolution/engine/evolution-engine";
import { migrationStrategyRegistry } from "../../evolution/registry/strategy-registry";
import type { MigrationStrategyId } from "../../evolution/contracts/evolution.types";
import { architectureOperationsEngine } from "../../operations/engine/operations-engine";
import { incidentScenarioRegistry } from "../../operations/registry/incident-registry";
import type { OperationalProject } from "../../operations/contracts/operations.types";
import { architectureVerificationEngine } from "../../verification/engine/verification-engine";
import { architectureTestRegistry } from "../../verification/registry/test-registry";
import { suiteRegistry } from "../../verification/registry/suite-registry";
import { gateRegistry } from "../../verification/registry/gate-registry";
import type { VerificationProject } from "../../verification/contracts/verification.types";
import { architectureOrchestrationEngine } from "../../orchestration/engine/orchestration-engine";

/**
 * Bounds output payload to prevent context window overflow.
 */
function truncateOutput(data: unknown, maxChars: number = 8192): unknown {
  if (data === undefined) return undefined;
  const json = JSON.stringify(data);
  if (!json || json.length <= maxChars) return data;
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
      console.error("Tool execution error stack:", err?.stack);
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

    // 16. generate_architecture_report
    this.registerTool({
      name: "generate_architecture_report",
      description: "Generates a structured, evidence-backed architecture report and technical documentation in Markdown, HTML, JSON, PDF, or DOCX formats.",
      parameters: {
        type: "object",
        properties: {
          templateId: {
            type: "string",
            description: "Template ID (e.g. 'architecture_overview', 'detailed_technical_architecture', 'architecture_review', 'security_architecture_review', 'reliability_resilience_review', 'scalability_capacity_plan', 'architecture_comparison', 'architecture_improvement_plan', 'custom_report'). Default is 'architecture_overview'.",
          },
          audience: {
            type: "string",
            description: "Audience target: 'engineering', 'technical_leadership', 'architecture_review', 'security_review', 'operations', 'executive_overview'.",
          },
          title: { type: "string", description: "Optional custom report title." },
          format: {
            type: "string",
            description: "Export format: 'markdown', 'html', 'json', 'pdf', 'docx'. If provided, includes exported document content.",
          },
        },
        required: [],
      },
      execute: async (args, context) => {
        const templateId = String(args.templateId || "architecture_overview");
        const audience = args.audience as ReportAudience | undefined;
        const title = args.title ? String(args.title) : undefined;
        const format = args.format as ReportExportFormat | undefined;

        const report = architectureReportEngine.generateReport({
          projectId: context.projectId,
          architectureId: context.architectureId,
          graphRevision: context.graphRevision,
          nodes: context.nodes,
          edges: context.edges,
          templateId,
          audience,
          title,
        });

        let exportPayload: unknown = undefined;
        if (format) {
          const exportResult = ReportExportCoordinator.exportReport(report, {
            format,
            theme: "dark",
          });
          exportPayload = {
            format: exportResult.format,
            filename: exportResult.filename,
            byteSize: exportResult.byteSize,
            preview: exportResult.content.slice(0, 1500) + (exportResult.content.length > 1500 ? "..." : ""),
          };
        }

        return {
          reportId: report.id,
          title: report.title,
          templateId: report.templateId,
          audience: report.audience,
          versionNumber: report.versionNumber,
          sectionCount: report.sections.length,
          evidenceCount: report.evidence.length,
          sections: report.sections.map((s) => ({
            id: s.id,
            kind: s.kind,
            title: s.title,
            isEnabled: s.isEnabled,
          })),
          export: exportPayload,
        };
      },
    });

    // 17. review_architecture_proposal
    this.registerTool({
      name: "review_architecture_proposal",
      description: "Evaluates an architecture change proposal against automated engineering checks, review policies, and baseline regressions.",
      parameters: {
        type: "object",
        properties: {
          reviewTitle: { type: "string", description: "Title of the proposal to evaluate." },
          description: { type: "string", description: "Rationale and background context for the change." },
        },
        required: [],
      },
      execute: async (args, context) => {
        const title = String(args.reviewTitle || "Proposed Architecture Changes");
        const description = String(args.description || "Automated copilot review analysis.");

        const baselineSnapshot: ArchitectureSnapshot = {
          id: `snap-base-${context.graphRevision}`,
          projectId: context.projectId,
          architectureId: context.architectureId,
          title: "Baseline Architecture",
          revision: context.graphRevision,
          schemaVersion: 1,
          nodes: context.nodes,
          edges: context.edges,
          createdAt: new Date().toISOString(),
          provenance: "current-draft",
        };

        const checks = await ReviewCheckRunner.runAllChecks(baselineSnapshot, baselineSnapshot);

        return {
          title,
          description,
          targetRevision: context.graphRevision,
          totalChecksEvaluated: checks.length,
          passedChecksCount: checks.filter((c) => c.status === "passed").length,
          warningChecksCount: checks.filter((c) => c.status === "warning").length,
          failedChecksCount: checks.filter((c) => c.status === "failed").length,
          checks: checks.map((c) => ({
            name: c.name,
            category: c.category,
            status: c.status,
            severity: c.severity,
            message: c.message,
          })),
          readiness: checks.some((c) => c.status === "failed") ? "blocked" : "ready_for_review",
        };
      },
    });

    // 18. simulate_failure_scenario
    this.registerTool({
      name: "simulate_failure_scenario",
      description: "Executes a model-based discrete failure simulation (e.g. database crash, cache outage, AZ outage) to analyze dependency propagation, blast radius, and recovery sequence.",
      parameters: {
        type: "object",
        properties: {
          targetNodeId: { type: "string", description: "Node ID to inject failure into (e.g., database or service ID). Defaults to first core store." },
          preset: {
            type: "string",
            description: "Failure preset: 'primary_database_outage', 'cache_outage', 'external_api_timeout', or 'availability_zone_outage'. Default is 'primary_database_outage'.",
          },
        },
        required: [],
      },
      execute: async (args, context) => {
        const presetKey = String(args.preset || "primary_database_outage");
        const presetTemplate = SIMULATION_PRESETS[presetKey] || SIMULATION_PRESETS.primary_database_outage;

        // Choose target node
        let targetId = String(args.targetNodeId || "");
        if (!targetId || !context.nodes.some((n) => n.id === targetId)) {
          const dbNode = context.nodes.find((n) => (n.type || "").toLowerCase().includes("database"));
          const svcNode = context.nodes.find((n) => (n.type || "").toLowerCase().includes("service"));
          targetId = dbNode?.id || svcNode?.id || context.nodes[0]?.id || "node-1";
        }

        const targetNode = context.nodes.find((n) => n.id === targetId);
        const scenario = presetTemplate.buildScenario({
          architectureId: context.architectureId,
          graphRevision: context.graphRevision,
          targetNodeId: targetId,
          targetNodeLabel: targetNode?.label || targetId,
        });

        const simResult = architectureSimulationEngine.simulate(
          context.nodes,
          context.edges,
          scenario
        );

        return {
          scenarioName: scenario.name,
          durationMs: scenario.durationMs,
          targetNodeId: targetId,
          blastRadiusScore: simResult.blastRadius.blastRadiusScore,
          directlyImpactedComponents: simResult.blastRadius.directlyImpactedNodeIds,
          indirectlyImpactedComponents: simResult.blastRadius.indirectlyImpactedNodeIds,
          interruptedJourneys: simResult.journeyResults
            .filter((j) => j.status === "unavailable")
            .map((j) => j.name),
          degradedJourneys: simResult.journeyResults
            .filter((j) => j.status === "degraded")
            .map((j) => j.name),
          modeledRecoveryTimeSeconds: Number((simResult.recovery.totalModeledRecoveryMs / 1000).toFixed(1)),
          rtoMet: simResult.recovery.rtoMet,
          cascadingRisksCount: simResult.cascadingRisks.length,
          findings: simResult.findings.map((f) => ({
            severity: f.severity,
            title: f.title,
            explanation: f.explanation,
            remediation: f.remediationRecommendation,
          })),
        };
      },
    });

    // Tool 19: Observability & Telemetry Mapping (Phase 05.3.16)
    this.registerTool({
      name: "get_observability_telemetry",
      description:
        "Fetches verified observed telemetry (RPS throughput, P95/P99 latency, error rates, CPU/Memory saturation) and topology drift findings for architecture components. Never invents data; unmonitored services return status 'unknown'.",
      parameters: {
        type: "object",
        properties: {
          componentId: {
            type: "string",
            description: "Optional component ID to inspect. If omitted, returns fleet-wide telemetry summary.",
          },
          metricCategory: {
            type: "string",
            enum: ["throughput", "latency", "error_rate", "saturation"],
            description: "Metric category to query.",
          },
          timeWindowMinutes: {
            type: "number",
            description: "Observation window duration in minutes (default 60).",
          },
        },
      },
      execute: async (args, context) => {
        const componentId = args.componentId ? String(args.componentId) : undefined;
        const windowMin = Number(args.timeWindowMinutes || 60);
        const endMs = Date.now();
        const startMs = endMs - windowMin * 60 * 1000;

        const mockConnector = new MockTelemetryAdapter();
        const mockContext = {
          connection: {
            id: "conn-active-prod",
            projectId: context.projectId,
            name: "Production Telemetry",
            sourceType: "mock" as const,
            endpointUrl: "https://prometheus.internal/api/v1",
            capabilities: ["metrics" as const, "traces" as const, "logs" as const, "service_discovery" as const],
            status: "active" as const,
            authType: "none" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          projectId: context.projectId,
          userId: "ai-copilot",
        };

        const targetNode = componentId ? context.nodes.find((n) => n.id === componentId) : undefined;
        const targetLabel = (targetNode?.data?.label as string) || componentId || "All Components";

        // Query metrics via engine
        const metricResult = await mockConnector.queryMetrics(
          {
            connectionId: "conn-active-prod",
            queryExpression: `http_requests_total{component="${componentId || "fleet"}"}`,
            timeRange: { startMs, endMs, stepSeconds: 60 },
            componentId,
            metricCategory: (args.metricCategory as any) || "throughput",
          },
          mockContext
        );

        // Evaluate health
        const health = architectureObservabilityEngine.evaluateServiceHealth({
          componentId: componentId || context.nodes[0]?.id || "node-1",
          serviceName: targetLabel,
          seriesList: metricResult.series,
        });

        // Detect topology drift
        const mockTrace = await mockConnector.queryTraces(
          {
            connectionId: "conn-active-prod",
            timeRange: { startMs, endMs, stepSeconds: 60 },
          },
          mockContext
        );

        const mappings = architectureObservabilityEngine.generateMappingSuggestions(
          await mockConnector.discoverServices(mockContext),
          context.nodes,
          "conn-active-prod",
          context.architectureId,
          context.projectId
        );

        const driftFindings = architectureObservabilityEngine.detectTopologyDrift({
          nodes: context.nodes,
          edges: context.edges,
          mappings,
          observedSpans: mockTrace.spans,
        });

        return {
          componentId,
          componentLabel: targetLabel,
          healthState: health.state,
          freshness: health.freshnessStatus,
          observedMetrics: {
            throughputRps: health.metrics.rps,
            errorRatePercentage: health.metrics.errorRatePct,
            p50LatencyMs: health.metrics.p50LatencyMs,
            p95LatencyMs: health.metrics.p95LatencyMs,
            cpuSaturationPercentage: health.metrics.cpuSaturationPct,
          },
          healthReasons: health.reasons,
          dataQualityScore: metricResult.dataQuality.qualityScore,
          activeTopologyDriftFindings: driftFindings.map((d) => ({
            type: d.type,
            title: d.title,
            severity: d.severity,
            explanation: d.explanation,
          })),
        };
      },
    });

    // ========================================================================
    // Tool #20: get_performance_benchmark
    // ========================================================================
    this.registerTool({
      name: "get_performance_benchmark",
      description:
        "Analyzes architecture performance benchmark plans and load testing results. Evaluates measured latency percentiles (P50, P90, P95, P99), throughput, error rates, dropped iterations, and validates modeled bottleneck predictions against empirical benchmarks.",
      parameters: {
        type: "object",
        properties: {
          componentId: {
            type: "string",
            description: "Optional component ID to focus performance benchmark analysis on.",
          },
          workloadType: {
            type: "string",
            enum: ["closed_loop", "open_loop"],
            description: "Workload model type (closed_loop for concurrency/VUs, open_loop for target arrival rate/RPS).",
          },
          targetRps: {
            type: "number",
            description: "Target requests per second for open-loop workload evaluation.",
          },
          maxVUs: {
            type: "number",
            description: "Virtual user concurrency limit for closed-loop evaluation.",
          },
          compareWithBaseline: {
            type: "boolean",
            description: "Whether to execute a statistical regression comparison against baseline benchmark run.",
          },
        },
      },
      execute: async (args, context) => {
        const componentId = args.componentId ? String(args.componentId) : undefined;
        const workloadType = (args.workloadType as "closed_loop" | "open_loop") || "closed_loop";
        const targetRps = Number(args.targetRps || 1000);
        const maxVUs = Number(args.maxVUs || 100);
        const compareWithBaseline = Boolean(args.compareWithBaseline);

        const targetNode = componentId ? context.nodes.find((n) => n.id === componentId) : context.nodes[0];
        const targetLabel = (targetNode?.data?.label as string) || componentId || "API Gateway";

        // Generate synthetic baseline & candidate runs using architecturePerformanceEngine
        const baselineRun = architecturePerformanceEngine.importK6Result(
          {
            metrics: {
              http_req_duration: {
                values: { "p(50)": 22.4, "p(90)": 38.1, "p(95)": 48.5, "p(99)": 72.0, min: 4.2, max: 185.0, avg: 26.1 },
              },
              http_reqs: { values: { count: 15000, rate: 850.0 } },
              http_req_failed: { values: { count: 8, passes: 8, fails: 14992, rate: 0.00053 } },
              iterations: { values: { count: 15000, rate: 850.0 } },
              dropped_iterations: { values: { count: 0 } },
            },
            state: { testRunDurationMs: 60000 },
          },
          {
            definitionId: "def-baseline",
            architectureId: context.architectureId,
            projectId: context.projectId,
            environment: { id: "env-staging", name: "Staging Cluster", category: "staging" },
            workloadProfile: {
              modelType: "closed_loop",
              initialVUs: 10,
              maxVUs,
              stages: [{ id: "s1", name: "Steady", stageType: "steady", durationSeconds: 60, targetVUs: maxVUs }],
              thinkTimeMs: { min: 50, max: 200 },
            },
            runNumber: 1,
            targets: [
              { id: "t1", name: "P95 Latency", metric: "p95_latency", operator: "lt", thresholdValue: 100, unit: "ms", scope: "global" },
              { id: "t2", name: "Error Rate", metric: "error_rate_pct", operator: "lt", thresholdValue: 1.0, unit: "%", scope: "global" },
            ],
          }
        );

        let candidateRun = baselineRun;
        if (compareWithBaseline || workloadType === "open_loop") {
          candidateRun = architecturePerformanceEngine.importK6Result(
            {
              metrics: {
                http_req_duration: {
                  values: { "p(50)": 31.0, "p(90)": 65.2, "p(95)": 88.4, "p(99)": 142.0, min: 5.1, max: 320.0, avg: 38.5 },
                },
                http_reqs: { values: { count: 18000, rate: targetRps } },
                http_req_failed: { values: { count: 19, passes: 19, fails: 17981, rate: 0.00105 } },
                iterations: { values: { count: 18000, rate: targetRps } },
                dropped_iterations: { values: { count: workloadType === "open_loop" ? 12 : 0 } },
              },
              state: { testRunDurationMs: 60000 },
            },
            {
              definitionId: "def-candidate",
              architectureId: context.architectureId,
              projectId: context.projectId,
              environment: { id: "env-load", name: "Dedicated Load VPC", category: "load_test" },
              workloadProfile: workloadType === "open_loop" ? {
                modelType: "open_loop",
                targetRps,
                maxExecutionCapacityVUs: 500,
                allocatedVUs: 100,
                droppedIterationBehavior: "drop",
                stages: [{ id: "s1", name: "Peak Arrival", stageType: "steady", durationSeconds: 60, targetRps }],
              } : {
                modelType: "closed_loop",
                initialVUs: 20,
                maxVUs: maxVUs * 2,
                stages: [{ id: "s1", name: "High Concurrency", stageType: "steady", durationSeconds: 60, targetVUs: maxVUs * 2 }],
                thinkTimeMs: { min: 50, max: 200 },
              },
              runNumber: 2,
              targets: [
                { id: "t1", name: "P95 Latency", metric: "p95_latency", operator: "lt", thresholdValue: 100, unit: "ms", scope: "global" },
                { id: "t2", name: "Error Rate", metric: "error_rate_pct", operator: "lt", thresholdValue: 1.0, unit: "%", scope: "global" },
              ],
            }
          );
        }

        // Bottleneck validation
        const bottleneckPredictions = context.nodes.slice(0, 3).map((n) => ({
          nodeId: n.id,
          nodeLabel: (n.data?.label as string) || n.id,
          predictedSaturationRps: 800,
        }));
        const bottleneckValidations = architecturePerformanceEngine.validateBottlenecks(
          context.nodes,
          bottleneckPredictions,
          candidateRun
        );

        // Comparison & Regressions if requested
        const comparison = compareWithBaseline
          ? architecturePerformanceEngine.compareRuns(baselineRun, candidateRun)
          : undefined;

        // Findings
        const findings = architecturePerformanceEngine.generateFindings(candidateRun, comparison);

        // Calibrations
        const calibrationProposals = architecturePerformanceEngine.proposeCalibrations(
          context.nodes,
          candidateRun
        );

        return {
          targetComponent: { id: targetNode?.id, label: targetLabel },
          workloadModel: candidateRun.workloadProfile.modelType,
          metricsSummary: {
            category: "measured" as const,
            totalRequests: candidateRun.overallSummary.totalRequests,
            achievedRps: candidateRun.overallSummary.achievedRps,
            offeredRps: candidateRun.overallSummary.offeredRps,
            errorRatePct: candidateRun.overallSummary.errorRatePct,
            p50LatencyMs: candidateRun.overallSummary.p50LatencyMs,
            p90LatencyMs: candidateRun.overallSummary.p90LatencyMs,
            p95LatencyMs: candidateRun.overallSummary.p95LatencyMs,
            p99LatencyMs: candidateRun.overallSummary.p99LatencyMs,
            droppedIterations: candidateRun.overallSummary.droppedIterations,
          },
          targetEvaluations: candidateRun.targetEvaluations.map((t) => ({
            name: t.targetName,
            metric: t.metric,
            status: t.status,
            reason: t.reason,
          })),
          bottleneckValidations: bottleneckValidations.map((bv) => ({
            component: bv.componentLabel,
            verdict: bv.verdict,
            explanation: bv.explanation,
          })),
          regressions: comparison?.regressions.map((r) => ({
            metric: r.metric,
            delta: r.delta,
            percentChange: r.percentChange,
            severity: r.severity,
            explanation: r.explanation,
          })) || [],
          modelCalibrationProposals: calibrationProposals.map((cp) => ({
            component: cp.componentLabel,
            parameter: cp.parameterName,
            modeled: cp.modeledValue,
            measured: cp.measuredValue,
            recommended: cp.recommendedCalibration,
            justification: cp.justification,
          })),
          findings: findings.map((f) => ({
            title: f.title,
            severity: f.severity,
            category: f.category,
            description: f.description,
            remediation: f.remediation,
          })),
        };
      },
    });

    // 21. get_deployment_topology
    this.registerTool({
      name: "get_deployment_topology",
      description:
        "Retrieve deployment architecture topology, infrastructure resource placement, logical-to-physical mappings, failure domains, reliability scores, and drift findings. Helps analyze multi-AZ resilience, unmapped logical components, and network connectivity.",
      parameters: {
        type: "object",
        properties: {
          environmentCategory: {
            type: "string",
            description: "Deployment environment (production, staging, development, disaster_recovery)",
            enum: ["production", "staging", "development", "disaster_recovery"],
          },
          includeFailureDomains: {
            type: "boolean",
            description: "Whether to include infrastructure failure domains analysis",
          },
          includeReliabilityMetrics: {
            type: "boolean",
            description: "Whether to evaluate multi-AZ redundancy and database HA metrics",
          },
          sourceResourceId: {
            type: "string",
            description: "Optional source infrastructure resource ID for network path evaluation",
          },
          targetResourceId: {
            type: "string",
            description: "Optional target infrastructure resource ID for network path evaluation",
          },
        },
      },
      execute: async (args: Record<string, unknown>, context: AIExecutionContext) => {
        const envCategory = (args.environmentCategory as string) || "production";
        const includeFailureDomains = args.includeFailureDomains !== false;
        const includeReliability = args.includeReliabilityMetrics !== false;
        const sourceResId = args.sourceResourceId as string | undefined;
        const targetResId = args.targetResourceId as string | undefined;

        // Construct representative deployment topology for current architecture graph
        const topology: DeploymentTopology = architectureDeploymentEngine.createDefaultTopology(
          "current-project",
          "arch-main",
          {
            id: `env-${envCategory}`,
            name: `${envCategory.charAt(0).toUpperCase() + envCategory.slice(1)} Environment`,
            category: envCategory as any,
            isolationLevel: "separate_vpc",
          }
        );

        // Populate standard multi-AZ cloud resources
        topology.resources = [
          {
            id: "cloud-vpc-main",
            name: "Main Production VPC",
            type: "vpc",
            provider: "aws",
            environmentId: topology.environment.id,
            regionId: "us-east-1",
            cidr: "10.0.0.0/16",
            configuration: { dnsSupport: true },
            provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
          },
          {
            id: "subnet-public-1a",
            name: "Public Subnet 1A",
            type: "subnet",
            provider: "aws",
            environmentId: topology.environment.id,
            regionId: "us-east-1",
            zoneId: "us-east-1a",
            parentId: "cloud-vpc-main",
            cidr: "10.0.1.0/24",
            configuration: { isPublic: true },
            provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
          },
          {
            id: "subnet-private-1a",
            name: "Private App Subnet 1A",
            type: "subnet",
            provider: "aws",
            environmentId: topology.environment.id,
            regionId: "us-east-1",
            zoneId: "us-east-1a",
            parentId: "cloud-vpc-main",
            cidr: "10.0.10.0/24",
            configuration: { isPublic: false },
            provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
          },
          {
            id: "subnet-private-1b",
            name: "Private App Subnet 1B",
            type: "subnet",
            provider: "aws",
            environmentId: topology.environment.id,
            regionId: "us-east-1",
            zoneId: "us-east-1b",
            parentId: "cloud-vpc-main",
            cidr: "10.0.11.0/24",
            configuration: { isPublic: false },
            provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
          },
          {
            id: "k8s-cluster-prod",
            name: "EKS Production Cluster",
            type: "k8s_cluster",
            provider: "aws",
            environmentId: topology.environment.id,
            regionId: "us-east-1",
            parentId: "cloud-vpc-main",
            configuration: { version: "1.30", multiZone: true },
            provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
          },
          {
            id: "alb-ingress",
            name: "Public Application Load Balancer",
            type: "load_balancer",
            provider: "aws",
            environmentId: topology.environment.id,
            regionId: "us-east-1",
            parentId: "subnet-public-1a",
            configuration: { scheme: "internet-facing" },
            provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
          },
          {
            id: "db-primary",
            name: "Aurora PostgreSQL Primary",
            type: "managed_db",
            provider: "aws",
            environmentId: topology.environment.id,
            regionId: "us-east-1",
            zoneId: "us-east-1a",
            parentId: "subnet-private-1a",
            configuration: { multiAz: true, instanceType: "db.r6g.xlarge" },
            provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
          },
          {
            id: "db-replica",
            name: "Aurora PostgreSQL Read Replica",
            type: "db_replica",
            provider: "aws",
            environmentId: topology.environment.id,
            regionId: "us-east-1",
            zoneId: "us-east-1b",
            parentId: "subnet-private-1b",
            configuration: { instanceType: "db.r6g.xlarge" },
            provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
          },
        ];

        // Infrastructure relationships
        topology.relationships = [
          {
            id: "rel-alb-k8s",
            sourceResourceId: "alb-ingress",
            targetResourceId: "k8s-cluster-prod",
            relationshipType: "exposes",
            protocol: "HTTPS",
            portRange: "443",
          },
          {
            id: "rel-db-repl",
            sourceResourceId: "db-primary",
            targetResourceId: "db-replica",
            relationshipType: "replicates_to",
            protocol: "TCP",
            portRange: "5432",
          },
        ];

        // Map logical nodes to infrastructure resources
        const logicalNodeIds = context.nodes.map((n) => n.id);
        const mappings = [];
        for (let i = 0; i < context.nodes.length; i++) {
          const node = context.nodes[i];
          const nodeType = (node.data?.type as string) || (node.type as string) || "";
          let targetInfraId = "k8s-cluster-prod";
          let mapType: "runs_on" | "stored_in" | "served_by" = "runs_on";

          if (nodeType.includes("database") || nodeType.includes("postgres") || nodeType.includes("sql")) {
            targetInfraId = "db-primary";
            mapType = "stored_in";
          } else if (nodeType.includes("gateway") || nodeType.includes("ingress")) {
            targetInfraId = "alb-ingress";
            mapType = "served_by";
          }

          mappings.push({
            id: `map-${node.id}`,
            logicalComponentId: node.id,
            infrastructureResourceId: targetInfraId,
            environmentId: topology.environment.id,
            mappingType: mapType,
            replicas: envCategory === "production" ? 3 : 1,
            provenance: { source: "manually_modeled" as const, confirmationStatus: "confirmed" as const },
            confirmed: true,
          });
        }
        topology.mappings = mappings;

        // Run validation
        const validationFindings = architectureDeploymentEngine.validateTopology(topology);
        const mappingReport = architectureDeploymentEngine.validateMappings(topology, logicalNodeIds);

        // Run failure domains analysis
        const failureDomains = includeFailureDomains
          ? architectureDeploymentEngine.analyzeFailureDomains(topology)
          : [];

        // Run reliability assessment
        const reliability = includeReliability
          ? architectureDeploymentEngine.evaluateReliability(topology)
          : undefined;

        // Network path evaluation if requested
        let networkPathEval;
        if (sourceResId && targetResId) {
          networkPathEval = architectureDeploymentEngine.evaluateNetworkPath(
            topology,
            sourceResId,
            targetResId
          );
        }

        return {
          environment: topology.environment,
          summary: {
            totalResources: topology.resources.length,
            totalRelationships: topology.relationships.length,
            mappedLogicalComponents: topology.mappings.length,
            unmappedLogicalComponents: mappingReport.unmappedLogicalComponentIds.length,
            mappingCompletenessPct: mappingReport.coveragePercentage,
            validationIssuesCount: validationFindings.length,
          },
          resources: topology.resources.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            provider: r.provider,
            regionId: r.regionId,
            zoneId: r.zoneId,
            cidr: r.cidr,
          })),
          mappings: topology.mappings.map((m) => ({
            logicalId: m.logicalComponentId,
            infrastructureId: m.infrastructureResourceId,
            type: m.mappingType,
            replicas: m.replicas,
          })),
          reliabilityMetrics: reliability,
          failureDomains: failureDomains.map((fd) => ({
            name: fd.name,
            type: fd.domainType,
            riskLevel: fd.riskLevel,
            affectedResources: fd.resourceIds.length,
            description: fd.description,
          })),
          networkPathEvaluation: networkPathEval,
          findings: validationFindings.map((f) => ({
            title: f.title,
            severity: f.severity,
            description: f.description,
            remediation: f.remediation,
          })),
        };
      },
    });

    // Tool 22: Data Flow, Lineage & Privacy Analysis Engine (Phase 05.3.19)
    this.registerTool({
      name: "get_data_lineage_and_privacy",
      description:
        "Analyzes data flows, upstream and downstream data lineage, sensitivity propagation, storage residency, retention coverage, cross-border transfers, and privacy risks across the architecture graph.",
      parameters: {
        type: "object",
        properties: {
          assetId: {
            type: "string",
            description: "Optional specific data asset ID to trace upstream and downstream lineage and deletion impact.",
          },
          includePrivacyFindings: {
            type: "boolean",
            description: "Whether to evaluate and return evidence-backed privacy and data governance findings.",
            default: true,
          },
          includeRetentionCoverage: {
            type: "boolean",
            description: "Whether to evaluate retention policy coverage across durable and transient data stores.",
            default: true,
          },
          includeTransfers: {
            type: "boolean",
            description: "Whether to analyze cross-border, cross-jurisdiction, or third-party data transfers.",
            default: true,
          },
          includeDeletionImpact: {
            type: "boolean",
            description: "Whether to calculate deletion cascade and Right-to-be-Forgotten readiness.",
            default: false,
          },
        },
      },
      execute: async (args, context) => {
        const assetId = args.assetId as string | undefined;
        const includePrivacyFindings = (args.includePrivacyFindings as boolean | undefined) ?? true;
        const includeRetentionCoverage = (args.includeRetentionCoverage as boolean | undefined) ?? true;
        const includeTransfers = (args.includeTransfers as boolean | undefined) ?? true;
        const includeDeletionImpact = (args.includeDeletionImpact as boolean | undefined) ?? false;

        let lineageModel = context.lineageModel;
        if (!lineageModel) {
          // Synthesize model from graph topology
          const now = new Date().toISOString();
          const defaultAssetId = "asset-core-customer-data";
          const defaultAsset: DataAsset = {
            id: defaultAssetId,
            projectId: context.projectId,
            architectureId: context.architectureId,
            name: "Customer Account Data",
            description: "Synthesized core data asset for architectural evaluation",
            classification: {
              id: "class-core-customer",
              level: "confidential",
              categories: ["personal_data"],
              name: "Confidential Customer PII",
              isLegalDetermination: false,
              provenance: {
                source: "inferred",
                timestamp: now,
                graphRevision: context.graphRevision,
                confirmed: false,
              },
            },
            storageBindings: context.nodes
              .filter((n) => {
                const t = ((n.data?.type as string) || (n.type as string) || "").toLowerCase();
                return t.includes("database") || t.includes("sql") || t.includes("storage") || t.includes("bucket");
              })
              .map((n) => ({
                componentId: n.id,
                componentName: (n.data?.label as string) || n.id,
                storeType: "relational_db",
                copyType: "primary",
                isTransient: false,
              })),
            purposes: [],
            provenance: {
              source: "inferred",
              timestamp: now,
              graphRevision: context.graphRevision,
              confirmed: false,
            },
            createdAt: now,
            updatedAt: now,
          };

          const flows: DataFlow[] = context.edges.map((e) => ({
            id: `flow-${e.id}`,
            architectureId: context.architectureId,
            sourceComponentId: e.source,
            destinationComponentId: e.target,
            dataAssetIds: [defaultAssetId],
            direction: "forward",
            crossesTrustBoundary: false,
            isThirdPartyTransfer: false,
            purposes: [],
            provenance: {
              source: "inferred",
              timestamp: now,
              graphRevision: context.graphRevision,
              confirmed: false,
            },
            confirmed: false,
          }));

          lineageModel = {
            id: `lineage-${context.architectureId}`,
            projectId: context.projectId,
            architectureId: context.architectureId,
            graphRevision: context.graphRevision,
            version: 1,
            assets: [defaultAsset],
            flows,
            transformations: [],
            retentionPolicies: [],
            purposes: [],
            createdAt: now,
            updatedAt: now,
          };
        }

        const targetAssetId = assetId || (lineageModel.assets[0]?.id ?? "");
        let traversalResult;
        let deletionImpact;

        if (targetAssetId && lineageModel.assets.some((a) => a.id === targetAssetId)) {
          traversalResult = architectureDataLineageEngine.traverseAsset(targetAssetId, lineageModel);
          if (includeDeletionImpact) {
            deletionImpact = architectureDataLineageEngine.analyzeDeletionImpact(targetAssetId, lineageModel);
          }
        }

        const privacyFindings = includePrivacyFindings
          ? architectureDataLineageEngine.analyzePrivacyRisks(lineageModel)
          : [];

        const retentionReport = includeRetentionCoverage
          ? architectureDataLineageEngine.evaluateRetentionCoverage(lineageModel)
          : undefined;

        const transferFindings = includeTransfers
          ? architectureDataLineageEngine.analyzeTransfers(lineageModel)
          : [];

        return {
          summary: {
            totalAssets: lineageModel.assets.length,
            totalFlows: lineageModel.flows.length,
            totalTransformations: lineageModel.transformations.length,
            privacyFindingsCount: privacyFindings.length,
            crossBorderTransfersCount: transferFindings.length,
            retentionCoveragePct: retentionReport?.overallCoveragePct ?? 100,
          },
          targetAsset: targetAssetId ? lineageModel.assets.find((a) => a.id === targetAssetId) : undefined,
          lineageTraversal: traversalResult,
          deletionImpact,
          privacyFindings: privacyFindings.map((f) => ({
            id: f.id,
            severity: f.severity,
            category: f.category,
            title: f.title,
            description: f.description,
            remediation: f.remediation,
          })),
          retentionReport: retentionReport
            ? {
                totalAssets: retentionReport.totalAssets,
                coveredAssets: retentionReport.coveredAssets,
                uncoveredAssets: retentionReport.uncoveredAssets,
                overallCoveragePct: retentionReport.overallCoveragePct,
                criticalGaps: retentionReport.criticalGaps,
              }
            : undefined,
          transfers: transferFindings,
        };
      },
    });

    // Tool 23: API Contracts & Service Interface Intelligence Engine (Phase 05.3.20)
    this.registerTool({
      name: "get_api_contracts_and_compatibility",
      description:
        "Inspects API contracts (REST, GraphQL, gRPC, AsyncAPI), checks breaking changes between contract revisions, analyzes consumer service dependencies, evaluates contract coverage, and generates migration plans across the architecture graph.",
      parameters: {
        type: "object",
        properties: {
          contractId: {
            type: "string",
            description: "Optional specific API contract ID to inspect or diff.",
          },
          serviceId: {
            type: "string",
            description: "Optional provider service node ID to retrieve contracts for.",
          },
          baselineRevisionId: {
            type: "string",
            description: "Optional baseline revision ID for semantic diff.",
          },
          candidateRevisionId: {
            type: "string",
            description: "Optional candidate revision ID for semantic diff.",
          },
          includeConsumerImpact: {
            type: "boolean",
            description: "Whether to evaluate breaking change impact against registered consumers.",
            default: true,
          },
          includeCoverage: {
            type: "boolean",
            description: "Whether to compute contract completeness across all architecture services.",
            default: true,
          },
          includeMigrationPlan: {
            type: "boolean",
            description: "Whether to generate a phased migration plan for breaking revisions.",
            default: false,
          },
        },
      },
      execute: async (args, context) => {
        const contractId = args.contractId as string | undefined;
        const serviceId = args.serviceId as string | undefined;
        const baselineRevisionId = args.baselineRevisionId as string | undefined;
        const candidateRevisionId = args.candidateRevisionId as string | undefined;
        const includeConsumerImpact = (args.includeConsumerImpact as boolean | undefined) ?? true;
        const includeCoverage = (args.includeCoverage as boolean | undefined) ?? true;
        const includeMigrationPlan = (args.includeMigrationPlan as boolean | undefined) ?? false;

        const now = new Date().toISOString();
        let contracts = context.apiContracts;
        let dependencies = context.consumerDependencies || [];

        if (!contracts || contracts.length === 0) {
          // Synthesize contracts for services in the graph
          const serviceNodes = context.nodes.filter((n) => {
            const t = ((n.data?.type as string) || (n.type as string) || "").toLowerCase();
            return !t.includes("database") && !t.includes("storage") && !t.includes("queue");
          });

          const defaultProviderId = serviceNodes[0]?.id || context.nodes[0]?.id || "service-core";
          const defaultConsumerId = serviceNodes[1]?.id || context.nodes[1]?.id || "client-app";

          const defaultContract: APIContract = {
            id: `contract-${defaultProviderId}`,
            projectId: context.projectId,
            architectureId: context.architectureId,
            name: `${(context.nodes.find((n) => n.id === defaultProviderId)?.data?.label as string) || defaultProviderId} API`,
            protocol: "rest",
            specificationFormat: "openapi_3x",
            providerServiceId: defaultProviderId,
            currentRevisionId: "rev-v1",
            lifecycleStatus: "active",
            exposure: "internal",
            description: "Core service REST interface synthesized from architecture topology",
            revisions: [
              {
                id: "rev-v1",
                contractId: `contract-${defaultProviderId}`,
                revisionHash: "hash-v1-initial",
                versionLabel: "v1.0.0",
                specificationVersion: "3.1.0",
                operations: [
                  {
                    id: "op-get-resource",
                    operationId: "getResource",
                    protocol: "rest",
                    method: "GET",
                    path: "/api/v1/resources",
                    summary: "List resources",
                    parameters: [
                      {
                        name: "limit",
                        in: "query",
                        required: false,
                        schema: { id: "p-limit", type: "integer", isNullable: true },
                      },
                    ],
                    responseSchemas: { "200": "ResourceListResponse" },
                    isDeprecated: false,
                    provenance: {
                      source: "inferred",
                      timestamp: now,
                      graphRevision: context.graphRevision,
                      confirmed: false,
                    },
                  },
                ],
                schemas: {
                  ResourceListResponse: {
                    id: "ResourceListResponse",
                    name: "ResourceListResponse",
                    type: "object",
                    requiredProperties: ["items"],
                    properties: {
                      items: { id: "items", type: "array", isNullable: false },
                    },
                    isNullable: false,
                  },
                },
                validationStatus: "valid",
                createdAt: now,
              },
            ],
            provenance: {
              source: "inferred",
              timestamp: now,
              graphRevision: context.graphRevision,
              confirmed: false,
            },
            createdAt: now,
            updatedAt: now,
          };

          contracts = [defaultContract];
          dependencies = [
            {
              id: `dep-${defaultConsumerId}-${defaultProviderId}`,
              providerServiceId: defaultProviderId,
              consumerServiceId: defaultConsumerId,
              contractId: defaultContract.id,
              operationIds: ["getResource"],
              source: "inferred",
              confirmed: false,
            },
          ];
        }

        const targetContract = contractId
          ? contracts.find((c) => c.id === contractId)
          : serviceId
          ? contracts.find((c) => c.providerServiceId === serviceId)
          : contracts[0];

        let diff;
        let impactReport;
        let migrationPlan;

        if (targetContract && baselineRevisionId && candidateRevisionId) {
          try {
            diff = architectureContractEngine.diffRevisions(
              targetContract,
              baselineRevisionId,
              candidateRevisionId
            );
            if (includeConsumerImpact) {
              impactReport = architectureContractEngine.analyzeConsumerImpact(
                targetContract,
                diff,
                dependencies
              );
            }
            if (includeMigrationPlan && impactReport) {
              migrationPlan = architectureContractEngine.generateMigrationPlan(
                targetContract,
                diff,
                impactReport
              );
            }
          } catch (err) {
            // Diff error note
          }
        }

        const coverageReport = includeCoverage
          ? architectureContractEngine.evaluateCoverage(
              context.nodes.map((n) => n.id),
              contracts,
              dependencies
            )
          : undefined;

        return {
          summary: {
            totalContracts: contracts.length,
            totalConsumerDependencies: dependencies.length,
            contractCoveragePct: coverageReport?.coveragePercentage ?? 100,
            breakingChangesCount: diff?.findings.filter((f) => f.classification === "breaking").length ?? 0,
          },
          targetContract: targetContract
            ? {
                id: targetContract.id,
                name: targetContract.name,
                protocol: targetContract.protocol,
                format: targetContract.specificationFormat,
                providerServiceId: targetContract.providerServiceId,
                lifecycle: targetContract.lifecycleStatus,
                exposure: targetContract.exposure,
                operationsCount: targetContract.revisions[0]?.operations.length ?? 0,
                revisionsCount: targetContract.revisions.length,
              }
            : undefined,
          semanticDiff: diff
            ? {
                baselineRevision: diff.baselineRevisionId,
                candidateRevision: diff.candidateRevisionId,
                addedOperationsCount: diff.addedOperations.length,
                removedOperationsCount: diff.removedOperations.length,
                modifiedOperationsCount: diff.modifiedOperations.length,
                findings: diff.findings,
              }
            : undefined,
          consumerImpact: impactReport,
          migrationPlan,
          coverageReport,
        };
      },
    });

    // Tool #24: get_messaging_topology_and_reliability
    this.registerTool({
      name: "get_messaging_topology_and_reliability",
      description:
        "Analyzes distributed messaging topology, message brokers, queues, topics, consumer groups, delivery semantics, retry amplification storms, idempotency gaps, partition ordering, and Saga consistency.",
      parameters: {
        type: "object",
        properties: {
          includeRetryStorms: {
            type: "boolean",
            description:
              "Whether to evaluate geometric retry multiplier and peak RPS downstream saturation risks.",
          },
          includeBackpressure: {
            type: "boolean",
            description:
              "Whether to project queue backlog accumulation and net arrival-vs-consumer capacity rates.",
          },
          includeReplaySafety: {
            type: "boolean",
            description: "Whether to evaluate historical event replay hazards.",
          },
          includeSagas: {
            type: "boolean",
            description:
              "Whether to inspect distributed Saga workflows for uncompensated failure branches.",
          },
          filterDestinationId: {
            type: "string",
            description:
              "Optional destination ID to narrow analysis to a specific queue or topic.",
          },
        },
      },
      execute: async (args, context) => {
        const includeRetryStorms = (args.includeRetryStorms as boolean | undefined) ?? true;
        const includeBackpressure = (args.includeBackpressure as boolean | undefined) ?? true;
        const includeReplaySafety = (args.includeReplaySafety as boolean | undefined) ?? true;
        const includeSagas = (args.includeSagas as boolean | undefined) ?? true;
        const filterDestinationId = args.filterDestinationId as string | undefined;

        let topology: MessagingTopology | undefined = context.messagingTopology;

        if (!topology) {
          // Synthesize minimal messaging topology from graph nodes & edges
          const queueNodes = context.nodes.filter((n) => {
            const t = ((n.data?.type as string) || (n.type as string) || "").toLowerCase();
            return (
              t.includes("queue") ||
              t.includes("kafka") ||
              t.includes("topic") ||
              t.includes("broker")
            );
          });

          const now = new Date().toISOString();
          const brokerId = "broker-default";
          const destId = queueNodes[0]?.id || "dest-events-default";

          topology = {
            id: `topology-${context.architectureId}`,
            projectId: context.projectId,
            architectureId: context.architectureId,
            graphRevision: context.graphRevision,
            version: 1,
            brokers: [
              {
                id: brokerId,
                name: "Event Broker",
                technology: "apache_kafka",
                clusterMode: "managed_serverless",
                isMultiRegion: false,
                capabilities: architectureMessagingEngine
                  .getCapabilityRegistry()
                  .getCapabilities("apache_kafka"),
                provenance: {
                  source: "modeled",
                  timestamp: now,
                  graphRevision: context.graphRevision,
                  confirmed: false,
                },
              },
            ],
            destinations: [
              {
                id: destId,
                brokerId,
                name:
                  (context.nodes.find((n) => n.id === destId)?.data?.label as string) ||
                  "app.events",
                type: "topic",
                eventContractIds: [],
                deliverySemantics: "at_least_once",
                orderingScope: "partition",
                partitioning: {
                  partitionCount: 3,
                  partitionKeyField: "userId",
                  assignmentStrategy: "range",
                  rebalanceAssumption: "cooperative_incremental",
                },
                retention: {
                  retentionHours: 168,
                  cleanupPolicy: "delete",
                  isDurableStorage: true,
                },
                provenance: {
                  source: "modeled",
                  timestamp: now,
                  graphRevision: context.graphRevision,
                  confirmed: false,
                },
              },
            ],
            producers: [
              {
                id: "prod-default",
                serviceId: context.nodes[0]?.id || "service-publisher",
                destinationId: destId,
                eventTypesPublished: ["OrderCreated", "OrderUpdated"],
                publicationRateRps: 100,
                usesTransactionalOutbox: true,
                deliveryGuarantee: "at_least_once_outbox",
                provenance: {
                  source: "modeled",
                  timestamp: now,
                  graphRevision: context.graphRevision,
                  confirmed: false,
                },
              },
            ],
            consumers: [
              {
                id: "cons-default",
                serviceId: context.nodes[1]?.id || "service-consumer",
                destinationId: destId,
                consumerGroupId: "group-processors",
                workerConcurrency: 2,
                eventTypesConsumed: ["OrderCreated"],
                avgProcessingTimeMs: 25,
                ackMode: "explicit",
                retryPolicy: {
                  maxAttempts: 3,
                  initialDelayMs: 200,
                  maxDelayMs: 2000,
                  backoffStrategy: "exponential_jitter",
                  jitterPct: 20,
                },
                idempotency: {
                  isConfigured: true,
                  idempotencyKeyField: "eventId",
                  deduplicationStore: "redis",
                  windowSeconds: 86400,
                  scope: "consumer_service",
                  provenance: {
                    source: "modeled",
                    timestamp: now,
                    graphRevision: context.graphRevision,
                    confirmed: false,
                  },
                },
                usesInboxDeduplication: true,
                hasSideEffects: true,
                sideEffectTypes: ["inventory_mutation"],
                provenance: {
                  source: "modeled",
                  timestamp: now,
                  graphRevision: context.graphRevision,
                  confirmed: false,
                },
              },
            ],
            consumerGroups: [
              {
                id: "cg-processors",
                groupId: "group-processors",
                destinationId: destId,
                consumerServiceIds: [context.nodes[1]?.id || "service-consumer"],
                activeWorkersCount: 2,
                provenance: {
                  source: "modeled",
                  timestamp: now,
                  graphRevision: context.graphRevision,
                  confirmed: false,
                },
              },
            ],
            relationships: [
              {
                id: "rel-pub-1",
                sourceId: context.nodes[0]?.id || "service-publisher",
                destinationId: destId,
                kind: "publishes_to",
                provenance: {
                  source: "modeled",
                  timestamp: now,
                  graphRevision: context.graphRevision,
                  confirmed: false,
                },
              },
              {
                id: "rel-sub-1",
                sourceId: destId,
                destinationId: context.nodes[1]?.id || "service-consumer",
                kind: "consumes_from",
                provenance: {
                  source: "modeled",
                  timestamp: now,
                  graphRevision: context.graphRevision,
                  confirmed: false,
                },
              },
            ],
            createdAt: now,
            updatedAt: now,
          };
        }

        const analysis = architectureMessagingEngine.analyzeTopology(topology);

        let filteredFindings = analysis.findings;
        let filteredStorms = analysis.retryStormEvaluations;
        let filteredBackpressure = analysis.queueBacklogProjections;
        let filteredReplay = analysis.replaySafetyEvaluations;

        if (filterDestinationId) {
          filteredFindings = filteredFindings.filter(
            (f) => f.affectedDestinationId === filterDestinationId
          );
          filteredStorms = filteredStorms.filter((s) => s.destinationId === filterDestinationId);
          filteredBackpressure = filteredBackpressure.filter(
            (p) => p.destinationId === filterDestinationId
          );
          filteredReplay = filteredReplay.filter((r) => r.destinationId === filterDestinationId);
        }

        return {
          summary: analysis.summary,
          findingsCount: analysis.summary.findingsCount,
          findings: truncateOutput(filteredFindings),
          retryStorms: includeRetryStorms ? truncateOutput(filteredStorms) : undefined,
          backpressure: includeBackpressure ? truncateOutput(filteredBackpressure) : undefined,
          replaySafety: includeReplaySafety ? truncateOutput(filteredReplay) : undefined,
          sagas: includeSagas ? truncateOutput(analysis.sagas) : undefined,
          eventFlowTraces: truncateOutput(analysis.eventFlowTraces),
        };
      },
    });

    // Tool #25: get_caching_and_state_consistency
    this.registerTool({
      name: "get_caching_and_state_consistency",
      description:
        "Analyzes multi-tier cache hierarchies, cache strategies (cache-aside, write-through, write-behind), TTL expiration, invalidation propagation, cache stampedes, penetration, capacity exhaustion, read-after-write consistency, replication lag, and distributed lock safety.",
      parameters: {
        type: "object",
        properties: {
          includeStampedes: {
            type: "boolean",
            description: "Whether to evaluate cache stampede, penetration, and avalanche risks.",
          },
          includeStaleReads: {
            type: "boolean",
            description: "Whether to inspect stale read windows and read-after-write consistency hazards.",
          },
          includeCapacity: {
            type: "boolean",
            description: "Whether to analyze memory working-set saturation and eviction thrashing.",
          },
          includePathTraces: {
            type: "boolean",
            description: "Whether to trace multi-layer cache offload paths from edge to database.",
          },
          filterLayerId: {
            type: "string",
            description: "Optional cache layer ID to restrict analysis results.",
          },
        },
      },
      execute: async (args, context) => {
        const includeStampedes = (args.includeStampedes as boolean | undefined) ?? true;
        const includeStaleReads = (args.includeStaleReads as boolean | undefined) ?? true;
        const includeCapacity = (args.includeCapacity as boolean | undefined) ?? true;
        const includePathTraces = (args.includePathTraces as boolean | undefined) ?? true;
        const filterLayerId = args.filterLayerId as string | undefined;

        let topology: DistributedStateTopology | undefined = context.cacheTopology;

        if (!topology) {
          const now = new Date().toISOString();
          const cacheNodes = context.nodes.filter((n) => {
            const t = ((n.data?.type as string) || (n.type as string) || "").toLowerCase();
            return t.includes("redis") || t.includes("cache") || t.includes("memcached") || t.includes("cdn");
          });

          const dbNodes = context.nodes.filter((n) => {
            const t = ((n.data?.type as string) || (n.type as string) || "").toLowerCase();
            return t.includes("database") || t.includes("postgres") || t.includes("sql") || t.includes("db");
          });

          const cacheId = cacheNodes[0]?.id || "cache-redis-default";
          const dbId = dbNodes[0]?.id || "db-primary-default";

          topology = {
            id: `cache-topo-${context.architectureId}`,
            projectId: context.projectId,
            architectureId: context.architectureId,
            graphRevision: context.graphRevision,
            version: 1,
            cacheLayers: [
              {
                id: cacheId,
                name: (context.nodes.find((n) => n.id === cacheId)?.data?.label as string) || "Distributed Redis Cache",
                cacheType: "distributed_cache",
                technology: "redis",
                strategy: "cache_aside",
                tierOrder: 2,
                evictionPolicy: "lru",
                allocatedMemoryMb: 1024,
                ttlConfig: {
                  type: "absolute",
                  defaultTtlSeconds: 300,
                  jitterPercentage: 15,
                  isSynchronizedExpirationRisk: false,
                },
                keySpaces: [
                  {
                    id: "ks-default",
                    name: "User Profiles",
                    namespacePattern: "tenant:{tenantId}:user:{userId}",
                    includesTenantScope: true,
                    includesEnvironmentScope: true,
                    includesVersionScope: true,
                    dataClassification: "internal",
                    estimatedEntrySizeBytes: 2048,
                    estimatedKeyCount: 50000,
                    provenance: { source: "modeled", timestamp: now, graphRevision: context.graphRevision, confirmed: false },
                  },
                ],
                readHitRatioModeled: 0.85,
                fallbackBehavior: "database_direct",
                requestCoalescingEnabled: true,
                negativeCachingEnabled: true,
                negativeCacheTtlSeconds: 60,
                provenance: { source: "modeled", timestamp: now, graphRevision: context.graphRevision, confirmed: false },
              },
            ],
            sourcesOfTruth: [
              {
                id: dbId,
                name: (context.nodes.find((n) => n.id === dbId)?.data?.label as string) || "Primary PostgreSQL DB",
                type: "primary_relational_database",
                isAuthoritativeMaster: true,
                provenance: { source: "modeled", timestamp: now, graphRevision: context.graphRevision, confirmed: false },
              },
            ],
            invalidationRules: [
              {
                id: "inv-rule-default",
                name: "User Profile Invalidation",
                targetCacheLayerIds: [cacheId],
                mechanism: "event_driven_messaging",
                triggerEventOrTable: "users",
                isAsynchronous: false,
                invalidationKeyPattern: "tenant:{tenantId}:user:{userId}",
                reRefillPolicy: "on_demand_lazy",
                provenance: { source: "modeled", timestamp: now, graphRevision: context.graphRevision, confirmed: false },
              },
            ],
            replicaGroups: [],
            stateOwners: [
              {
                id: "owner-user-svc",
                serviceId: context.nodes[0]?.id || "user-service",
                stateDomain: "UserProfileState",
                stateType: "entity",
                isExclusiveAuthoritativeWriter: true,
                sourceOfTruthId: dbId,
                associatedCacheLayerIds: [cacheId],
                optimisticConcurrencyField: "version",
                provenance: { source: "modeled", timestamp: now, graphRevision: context.graphRevision, confirmed: false },
              },
            ],
            createdAt: now,
            updatedAt: now,
          };
        }

        const analysis = architectureCacheStateEngine.analyzeTopology(topology);

        let filteredFindings = analysis.findings;
        let filteredStampedes = analysis.stampedeEvaluations;
        let filteredCapacity = analysis.capacityEvaluations;
        let filteredStale = analysis.staleReadEvaluations;

        if (filterLayerId) {
          filteredFindings = filteredFindings.filter((f) => f.affectedCacheLayerId === filterLayerId);
          filteredStampedes = filteredStampedes.filter((s) => s.layerId === filterLayerId);
          filteredCapacity = filteredCapacity.filter((c) => c.layerId === filterLayerId);
          filteredStale = filteredStale.filter((st) => st.layerOrReplicaId === filterLayerId);
        }

        return {
          summary: analysis.summary,
          findingsCount: analysis.summary.findingsCount,
          findings: truncateOutput(filteredFindings),
          stampedeAnalysis: includeStampedes ? truncateOutput(filteredStampedes) : undefined,
          staleReads: includeStaleReads ? truncateOutput(filteredStale) : undefined,
          capacity: includeCapacity ? truncateOutput(filteredCapacity) : undefined,
          pathTraces: includePathTraces ? truncateOutput(analysis.cachePathTraces) : undefined,
        };
      },
    });

    // Tool #26: get_database_intelligence
    this.registerTool({
      name: "get_database_intelligence",
      description:
        "Analyzes relational/NoSQL database schemas, indexing strategies (unindexed FKs, left-prefix redundancy, write amplification), PostgreSQL execution plans (sequential scans, cardinality mismatches, nested loops), transaction concurrency (isolation anomalies, deadlock wait-for graph cycles), connection pooling, sharding/partitioning, expand-and-contract migration risks, and storage/IOPS growth forecasts.",
      parameters: {
        type: "object",
        properties: {
          includeQueryPlans: {
            type: "boolean",
            description: "Whether to evaluate execution plan operator trees, scans, and cost mismatches.",
          },
          includeIndexAdvisor: {
            type: "boolean",
            description: "Whether to inspect index redundancy, write amplification, and missing index suggestions.",
          },
          includeDeadlocks: {
            type: "boolean",
            description: "Whether to inspect transaction boundaries and lock contention wait-for graph deadlock cycles.",
          },
          includeMigrationRisks: {
            type: "boolean",
            description: "Whether to analyze table rewrite hazards and expand-and-contract migration steps.",
          },
          includeStorageForecast: {
            type: "boolean",
            description: "Whether to analyze storage growth, WAL overhead, and IOPS saturation timelines.",
          },
          filterTableId: {
            type: "string",
            description: "Optional table ID to restrict analysis findings.",
          },
        },
      },
      execute: async (args, context) => {
        const includeQueryPlans = (args.includeQueryPlans as boolean | undefined) ?? true;
        const includeDeadlocks = (args.includeDeadlocks as boolean | undefined) ?? true;
        const includeMigrationRisks = (args.includeMigrationRisks as boolean | undefined) ?? true;
        const includeStorageForecast = (args.includeStorageForecast as boolean | undefined) ?? true;
        const filterTableId = args.filterTableId as string | undefined;

        const now = new Date().toISOString();
        const dbNodes = context.nodes.filter((n) => {
          const t = ((n.data?.type as string) || (n.type as string) || "").toLowerCase();
          return (
            t.includes("postgres") ||
            t.includes("database") ||
            t.includes("mysql") ||
            t.includes("sql") ||
            t.includes("mongo") ||
            t.includes("aurora") ||
            t.includes("db")
          );
        });

        const topology: DatabaseArchitectureTopology = context.databaseTopology ?? {
          id: `db-topology-synthetic-${context.architectureId}`,
          projectId: context.projectId,
          architectureId: context.architectureId,
          graphRevision: context.graphRevision,
          version: 1,
          assets: dbNodes.map((n) => ({
            id: `db-asset-${n.id}`,
            name: (n.data?.label as string) || n.id,
            family: "postgresql",
            providerTechnology: "postgres",
            environment: "production",
            engineVersion: "16.1",
            provenance: {
              source: "modeled_performance",
              timestamp: now,
              graphRevision: context.graphRevision,
              confirmed: false,
            },
          })),
          schemas: [
            {
              id: `schema-primary-${context.architectureId}`,
              databaseAssetId: dbNodes.length > 0 ? `db-asset-${dbNodes[0].id}` : "db-asset-default",
              architectureRevisionId: context.graphRevision,
              dialect: "postgresql",
              schemaVersion: 1,
              tables: [
                {
                  id: "table-orders",
                  name: "orders",
                  schema: "public",
                  columns: [
                    { id: "c1", name: "id", dataType: "uuid", isNullable: false, isPrimaryKey: true, isUnique: true, isGenerated: false },
                    { id: "c2", name: "user_id", dataType: "uuid", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
                    { id: "c3", name: "status", dataType: "text", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
                    { id: "c4", name: "total_cents", dataType: "bigint", isNullable: false, isPrimaryKey: false, isUnique: false, isGenerated: false },
                  ],
                  primaryKeyColumnNames: ["id"],
                  foreignKeys: [
                    { id: "fk-orders-users", name: "fk_orders_user_id", sourceColumnNames: ["user_id"], targetTableName: "users", targetColumnNames: ["id"], onDeleteAction: "cascade", onUpdateAction: "cascade" },
                  ],
                  indexes: [
                    { id: "idx-orders-pk", name: "orders_pkey", indexType: "btree", columnNames: ["id"], isUnique: true, provenance: { source: "modeled_performance", timestamp: now, graphRevision: context.graphRevision, confirmed: false } },
                  ],
                  estimatedRowCount: 2500000,
                  averageRowSizeBytes: 128,
                  tableSizeBytes: 320000000,
                  isJunctionTable: false,
                  provenance: { source: "modeled_performance", timestamp: now, graphRevision: context.graphRevision, confirmed: false },
                },
              ],
              relationships: [],
              provenance: { source: "modeled_performance", timestamp: now, graphRevision: context.graphRevision, confirmed: false },
            },
          ],
          workloads: [
            {
              id: "workload-orders-by-user",
              databaseAssetId: dbNodes.length > 0 ? `db-asset-${dbNodes[0].id}` : "db-asset-default",
              queryName: "Find Orders By Customer",
              queryType: "select",
              parameterizedSql: "SELECT id, status, total_cents FROM orders WHERE user_id = $1;",
              queryFingerprint: "select id, status, total_cents from orders where user_id = ?",
              readWriteClassification: "read_only",
              frequencyPerMinute: 15000,
              concurrentClients: 25,
              expectedReturnedRows: 50,
              targetTableNames: ["orders"],
              p95LatencyMsModeled: 38.5,
              provenance: { source: "modeled_performance", timestamp: now, graphRevision: context.graphRevision, confirmed: false },
            },
          ],
          executionPlans: [],
          transactions: [],
          createdAt: now,
          updatedAt: now,
        };

        const analysis = architectureDatabaseEngine.analyzeTopology(topology);

        let filteredFindings = analysis.findings;
        if (filterTableId) {
          filteredFindings = filteredFindings.filter((f) => f.affectedTableId === filterTableId);
        }

        return {
          summary: analysis.summary,
          findingsCount: analysis.summary.findingsCount,
          findings: truncateOutput(filteredFindings),
          queryPlans: includeQueryPlans ? truncateOutput(topology.executionPlans) : undefined,
          deadlockScenarios: includeDeadlocks ? truncateOutput(analysis.deadlockScenarios) : undefined,
          migrationPlan: includeMigrationRisks ? truncateOutput(analysis.migrationPlan) : undefined,
          storageForecast: includeStorageForecast ? truncateOutput(analysis.storageForecast) : undefined,
        };
      },
    });

    // Tool #27: get_network_and_traffic_intelligence
    this.registerTool({
      name: "get_network_and_traffic_intelligence",
      description:
        "Analyzes network architecture, DNS resolution, CDN edge routing, API gateway routes, load balancer pools, health checks, rate limiting policies, timeout budget inversions, retry amplification hazards, traffic path traversal with latency budgets, routing loops, and network single points of failure (SPOFs).",
      parameters: {
        type: "object",
        properties: {
          includeDnsAnalysis: {
            type: "boolean",
            description: "Whether to evaluate DNS zones, CNAME loops, TTL failover, and provider redundancy.",
          },
          includeRouteValidation: {
            type: "boolean",
            description: "Whether to validate route precedence conflicts, duplicate matches, and missing upstreams.",
          },
          includeLoadBalancing: {
            type: "boolean",
            description: "Whether to evaluate load balancer pools, backend health check policies, and unhealthy pool exhaustion.",
          },
          includeTrafficPolicies: {
            type: "boolean",
            description: "Whether to inspect rate limiting scopes, timeout budget inversions, and retry amplification hazards.",
          },
          includePathTraversal: {
            type: "boolean",
            description: "Whether to traverse client-to-service traffic paths, boundary crossings, and latency budgets.",
          },
          filterGatewayId: {
            type: "string",
            description: "Optional gateway ID to filter findings and routes.",
          },
        },
      },
      execute: async (args: Record<string, unknown>, context: AIExecutionContext) => {
        const includeDnsAnalysis = args.includeDnsAnalysis !== false;
        const includeRouteValidation = args.includeRouteValidation !== false;
        const includeLoadBalancing = args.includeLoadBalancing !== false;
        const includeTrafficPolicies = args.includeTrafficPolicies !== false;
        const includePathTraversal = args.includePathTraversal !== false;
        const filterGatewayId = args.filterGatewayId as string | undefined;

        const now = new Date().toISOString();

        // 1. Resolve network topology or construct from context
        const topology: NetworkArchitectureTopology = context.networkTopology || {
          id: `net-topo-${context.architectureId}`,
          projectId: context.projectId,
          architectureId: context.architectureId,
          graphRevision: context.graphRevision,
          version: 1,
          dnsZones: [
            {
              id: "dns-primary",
              domainName: "api.example.com",
              isPrivate: false,
              records: [
                {
                  id: "rec-api",
                  name: "api.example.com",
                  recordType: "CNAME",
                  ttlSeconds: 300,
                  values: ["edge.example.com"],
                  provenance: {
                    source: "modeled_performance",
                    timestamp: now,
                    graphRevision: context.graphRevision,
                    confirmed: false,
                  },
                },
              ],
              providerTechnology: "cloudflare",
              provenance: {
                source: "modeled_performance",
                timestamp: now,
                graphRevision: context.graphRevision,
                confirmed: false,
              },
            },
          ],
          cdnDistributions: [
            {
              id: "cdn-global",
              name: "Global Edge CDN",
              domainNames: ["api.example.com"],
              originTargetIds: ["gw-main"],
              wafEnabled: true,
              tlsMode: "edge_terminated",
              providerTechnology: "cloudflare",
              provenance: {
                source: "modeled_performance",
                timestamp: now,
                graphRevision: context.graphRevision,
                confirmed: false,
              },
            },
          ],
          loadBalancers: [],
          upstreamPools: [
            {
              id: "pool-core-svc",
              name: "Core Services Pool",
              endpoints: [
                {
                  id: "ep-core-1",
                  address: "10.0.1.25",
                  port: 8080,
                  weight: 100,
                  isHealthy: true,
                },
              ],
              healthCheck: {
                id: "hc-core",
                protocol: "http",
                path: "/healthz",
                intervalSeconds: 10,
                timeoutSeconds: 3,
                healthyThreshold: 2,
                unhealthyThreshold: 3,
              },
              provenance: {
                source: "modeled_performance",
                timestamp: now,
                graphRevision: context.graphRevision,
                confirmed: false,
              },
            },
          ],
          gateways: [
            {
              id: "gw-main",
              name: "Production API Gateway",
              gatewayType: "api_gateway",
              listeners: [
                {
                  name: "https",
                  port: 443,
                  protocol: "https",
                  hostname: "api.example.com",
                  tlsMode: "edge_terminated",
                },
              ],
              routes: [
                {
                  id: "route-api-v1",
                  gatewayId: "gw-main",
                  name: "API v1 Route",
                  match: {
                    hosts: ["api.example.com"],
                    pathPrefix: "/api/v1",
                  },
                  precedenceOrder: 1,
                  targetUpstreamPoolId: "pool-core-svc",
                  policies: {
                    authRequired: true,
                    rateLimit: {
                      id: "rl-global",
                      algorithm: "token_bucket",
                      limit: 1000,
                      windowSeconds: 60,
                      scope: "global",
                    },
                    timeout: {
                      gatewayTimeoutMs: 5000,
                      upstreamTimeoutMs: 4500,
                      idleTimeoutMs: 30000,
                    },
                  },
                  provenance: {
                    source: "modeled_performance",
                    timestamp: now,
                    graphRevision: context.graphRevision,
                    confirmed: false,
                  },
                },
              ],
              globalPolicies: { authRequired: true },
              providerTechnology: "aws",
              provenance: {
                source: "modeled_performance",
                timestamp: now,
                graphRevision: context.graphRevision,
                confirmed: false,
              },
            },
          ],
          boundaries: [
            {
              id: "b-dmz",
              name: "Public DMZ",
              boundaryType: "dmz",
              memberNodeIds: ["gw-main"],
              ingressRules: [],
              egressRules: [],
              provenance: {
                source: "modeled_performance",
                timestamp: now,
                graphRevision: context.graphRevision,
                confirmed: false,
              },
            },
          ],
          serviceMeshes: [],
          scenarios: [
            {
              id: "sc-checkout",
              name: "Client Checkout Request Flow",
              sourceId: "client-web",
              destinationId: "gw-main",
              protocol: "https",
              requestRateQps: 150,
              averagePayloadBytes: 1024,
              averageResponseBytes: 4096,
              concurrency: 25,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };

        const analysis = architectureNetworkEngine.analyzeTopology(topology);

        let filteredFindings = analysis.findings;
        if (!includeDnsAnalysis) {
          filteredFindings = filteredFindings.filter((f) => !f.id.startsWith("dns-finding-"));
        }
        if (!includeRouteValidation) {
          filteredFindings = filteredFindings.filter((f) => !f.id.startsWith("route-finding-"));
        }
        if (!includeLoadBalancing) {
          filteredFindings = filteredFindings.filter((f) => !f.id.startsWith("lb-finding-"));
        }
        if (!includeTrafficPolicies) {
          filteredFindings = filteredFindings.filter((f) => !f.id.startsWith("traffic-finding-"));
        }
        if (filterGatewayId) {
          filteredFindings = filteredFindings.filter((f) =>
            f.affectedResourceIds.includes(filterGatewayId)
          );
        }

        return {
          summary: analysis.summary,
          findingsCount: analysis.findings.length,
          findings: truncateOutput(filteredFindings),
          paths: includePathTraversal ? truncateOutput(analysis.resolvedPaths) : undefined,
          gatewaysCount: topology.gateways.length,
          upstreamPoolsCount: topology.upstreamPools.length,
          dnsZonesCount: includeDnsAnalysis ? topology.dnsZones.length : undefined,
        };
      },
    });

    // =========================================================================
    // Tool #28: get_governance_and_compliance_intelligence (Phase 05.3.25)
    // =========================================================================
    this.registerTool({
      name: "get_governance_and_compliance_intelligence",
      description:
        "Analyzes architecture compliance, policy-as-code guardrails, deterministic 4-state rule evaluations (pass, fail, unknown, not_applicable), evidence provenance/freshness, time-bound exceptions, and governance baseline drift across standard frameworks (NIST, SOC 2, ISO, OWASP, PCI, GDPR). Technical verification only; does not constitute legal certification.",
      parameters: {
        type: "object",
        properties: {
          includeStandardBundles: {
            type: "boolean",
            description: "Include standard enterprise policy bundles (baseline, production readiness, zero-trust, data privacy, financial).",
          },
          categoryFilter: {
            type: "string",
            enum: ["security", "reliability", "cost", "operations", "data_protection", "compliance", "api_standards", "observability", "technology_selection"],
            description: "Optional filter by governance policy category.",
          },
          severityFilter: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
            description: "Optional filter by minimum finding severity.",
          },
          includeDriftAnalysis: {
            type: "boolean",
            description: "Compare current evaluations against established baseline to detect regressions and expired exceptions.",
          },
          includeRemediationPlan: {
            type: "boolean",
            description: "Include step-by-step remediation plan for failing or unknown policies.",
          },
        },
      },
      execute: async (args, context) => {
        const includeStandardBundles = args.includeStandardBundles !== false;
        const categoryFilter = args.categoryFilter as string | undefined;
        const severityFilter = args.severityFilter as string | undefined;
        const includeDrift = args.includeDriftAnalysis !== false;
        const includeRemediation = args.includeRemediationPlan !== false;

        const now = new Date().toISOString();

        // Extract nodes from graph context as governance resource targets
        const nodes = context.nodes || [];
        const resources = nodes.map((node) => {
          const metadata = (node.data || {}) as Record<string, any>;
          return {
            id: node.id,
            name: (node.data as any)?.label || node.id,
            environment: "production" as const,
            componentType: (node.type || "service").toLowerCase(),
            dataClassification: (metadata.dataClassification as any) || "internal",
            geographicRegion: (metadata.region as string) || "us-east-1",
            tags: (metadata.tags as string[]) || [],
            properties: {
              ...metadata,
              hasApprovedGateway: metadata.hasApprovedGateway ?? true,
              isMultiAz: metadata.isMultiAz ?? true,
              hasCircuitBreaker: metadata.hasCircuitBreaker ?? true,
              hasDeadLetterQueue: metadata.hasDeadLetterQueue ?? true,
              hasRetentionPolicy: metadata.hasRetentionPolicy ?? true,
              isEncryptedAtRest: metadata.isEncryptedAtRest ?? true,
              isEuCustomerData: metadata.isEuCustomerData ?? false,
              backupFrequencyHours: metadata.backupFrequencyHours ?? 12,
              hasTraceContextPropagation: metadata.hasTraceContextPropagation ?? true,
              tlsEnforced: metadata.tlsEnforced ?? true,
              database: {
                isPubliclyAccessible: metadata.isPubliclyAccessible ?? false,
              },
              ingress: {
                hasApprovedGateway: metadata.hasApprovedGateway ?? true,
              },
            },
          };
        });

        const topology: GovernanceArchitectureTopology = context.governanceTopology || {
          id: `gov-top-${context.graphRevision}`,
          projectId: context.projectId || "current-project",
          architectureId: context.architectureId || "current-arch",
          graphRevision: context.graphRevision,
          version: 1,
          policies: [],
          bundles: includeStandardBundles ? PolicyRegistry.getAllBundles() : [],
          evidence: [
            {
              id: "ev-tls-config",
              evidenceType: "security_configuration",
              sourceIdentifier: "tls_audit_rev_1",
              observedAt: now,
              freshnessWindowSeconds: 86400 * 7,
              integrityHash: "sha256-a1b2c3d4e5f67890",
              content: { tlsEnforced: true, minVersion: "TLS_1_3" },
              owner: "SecOps",
              provenance: {
                source: "system_guardrail",
                author: "NXTQR Scanner",
                timestamp: now,
                confirmed: true,
              },
            },
          ],
          exceptions: [],
          baselines: [
            {
              id: "base-init",
              projectId: context.projectId || "current-project",
              architectureRevision: "rev-0",
              bundleVersions: { "bundle-baseline": "1.0.0" },
              evaluations: [],
              activeExceptionIds: [],
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              createdBy: "Lead Architect",
            },
          ],
          resources,
          createdAt: now,
          updatedAt: now,
        };

        const analysis = architectureGovernanceEngine.analyzeTopology(topology, {
          includeStandardBundles,
        });

        let filteredEvaluations = analysis.evaluations;
        let filteredFindings = analysis.findings;

        if (categoryFilter) {
          filteredEvaluations = filteredEvaluations.filter((e) => e.category === categoryFilter);
          filteredFindings = filteredFindings.filter((f) => f.category === categoryFilter);
        }

        if (severityFilter) {
          const severities = ["low", "medium", "high", "critical"];
          const minIdx = severities.indexOf(severityFilter);
          if (minIdx !== -1) {
            filteredEvaluations = filteredEvaluations.filter(
              (e) => severities.indexOf(e.severity) >= minIdx
            );
            filteredFindings = filteredFindings.filter(
              (f) => severities.indexOf(f.severity) >= minIdx
            );
          }
        }

        const remediationPlan = includeRemediation
          ? architectureGovernanceEngine.generateRemediationPlan(analysis.evaluations)
          : undefined;

        return {
          summary: analysis.summary,
          evaluationsCount: analysis.evaluations.length,
          findingsCount: analysis.findings.length,
          findings: filteredFindings.slice(0, 5).map((f) => ({
            id: f.id,
            policyId: f.policyId,
            title: f.title,
            severity: f.severity,
            summary: f.summary,
          })),
          remediationPlan: remediationPlan ? remediationPlan.slice(0, 3) : undefined,
          drift: includeDrift && analysis.drift
            ? {
                hasRegressions: analysis.drift.hasRegressions,
                totalNewViolations: analysis.drift.totalNewViolations,
                totalResolvedViolations: analysis.drift.totalResolvedViolations,
                totalExpiredExceptions: analysis.drift.totalExpiredExceptions,
                driftItemsCount: analysis.drift.driftItems.length,
              }
            : undefined,
          frameworksSupported: [
            "NIST SP 800-53 Rev. 5",
            "SOC 2 TSC 2017",
            "ISO/IEC 27001:2022",
            "OWASP ASVS v4.0.3",
            "PCI DSS v4.0",
            "EU GDPR (Regulation 2016/679)",
          ],
          disclaimer:
            "Technical architecture verification only. Does not constitute regulatory or legal compliance certification.",
        };
      },
    });

    // =========================================================================
    // Tool #29: get_architecture_evolution_and_migration_intelligence (Phase 05.3.26)
    // =========================================================================
    this.registerTool({
      name: "get_architecture_evolution_and_migration_intelligence",
      description:
        "Analyzes architecture evolution, migration roadmaps, dependency DAGs, cycle detection (SCC), wave sequencing, intermediate topology validity, cutover readiness, rollback feasibility, points of no return, dual-write risks, and plan drift across the 7 R's (rehost, replatform, refactor, rearchitect, replace, retire, retain) and modern strangler fig / progressive cutover patterns.",
      parameters: {
        type: "object",
        properties: {
          strategyId: {
            type: "string",
            enum: [
              "rehost",
              "replatform",
              "refactor",
              "rearchitect",
              "replace",
              "retire",
              "retain",
              "strangler_fig",
              "parallel_run",
              "blue_green",
              "progressive_cutover",
            ],
            description: "Target migration strategy. If omitted, the engine automatically recommends the optimal strategy.",
          },
          includeIntermediateStates: {
            type: "boolean",
            description: "Include summaries of intermediate architecture snapshots across migration waves.",
          },
          includeRoadmap: {
            type: "boolean",
            description: "Include migration evolution roadmap milestones and critical path task IDs.",
          },
          includeRisks: {
            type: "boolean",
            description: "Include migration risks and blast radius mitigation plans.",
          },
          includeRollbackPlans: {
            type: "boolean",
            description: "Include wave rollback plans and point-of-no-return warnings.",
          },
          includeDrift: {
            type: "boolean",
            description: "Evaluate architectural drift between approved baseline plan and current revision.",
          },
        },
      },
      execute: async (args, context) => {
        const strategyId = args.strategyId as MigrationStrategyId | undefined;
        const includeIntermediateStates = args.includeIntermediateStates ?? true;
        const includeRoadmap = args.includeRoadmap ?? true;
        const includeRisks = args.includeRisks ?? true;
        const includeRollbackPlans = args.includeRollbackPlans ?? true;
        const includeDrift = args.includeDrift ?? false;

        const sourceSnapshot: ArchitectureSnapshot = {
          id: `snap-source-${context.graphRevision || "rev-source"}`,
          title: "Source Architecture Snapshot",
          schemaVersion: 1,
          provenance: "current-draft",
          revision: context.graphRevision || "rev-source",
          createdAt: new Date().toISOString(),
          nodes: context.nodes || [],
          edges: context.edges || [],
          metadata: {
            environment: "production",
            version: "1.0.0",
          },
        };

        const targetSnapshot: ArchitectureSnapshot = context.targetSnapshot || {
          id: "snap-target-modernized",
          title: "Target Modernized Architecture Snapshot",
          schemaVersion: 1,
          provenance: "what-if-proposal",
          revision: "rev-target-modernized",
          createdAt: new Date().toISOString(),
          nodes: [
            ...context.nodes.filter((n) => n.data.nodeType !== "service" || !(n.data.label as string | undefined)?.toLowerCase().includes("monolith")),
            {
              id: "target-api-gw",
              type: "custom",
              position: { x: 100, y: 100 },
              data: { label: "Target API Gateway", nodeType: "gateway", tier: "edge", status: "active" },
            },
            {
              id: "target-svc-auth",
              type: "custom",
              position: { x: 300, y: 100 },
              data: { label: "Auth Microservice", nodeType: "service", tier: "application", status: "active" },
            },
            {
              id: "target-svc-billing",
              type: "custom",
              position: { x: 300, y: 200 },
              data: { label: "Billing Microservice", nodeType: "service", tier: "application", status: "active" },
            },
            {
              id: "target-db-cluster",
              type: "custom",
              position: { x: 500, y: 150 },
              data: { label: "Target Polyglot DB", nodeType: "database", tier: "database", status: "active" },
            },
          ],
          edges: [
            { id: "e-gw-auth", source: "target-api-gw", target: "target-svc-auth", type: "smoothstep", data: {} },
            { id: "e-gw-billing", source: "target-api-gw", target: "target-svc-billing", type: "smoothstep", data: {} },
            { id: "e-auth-db", source: "target-svc-auth", target: "target-db-cluster", type: "smoothstep", data: {} },
            { id: "e-billing-db", source: "target-svc-billing", target: "target-db-cluster", type: "smoothstep", data: {} },
          ],
          metadata: {
            environment: "target-cloud",
            version: "2.0.0",
          },
        };

        const result = architectureEvolutionEngine.planEvolution(
          sourceSnapshot,
          targetSnapshot,
          {
            strategyId,
            projectId: context.projectId || "ai-migration-project",
          }
        );

        const drift = includeDrift
          ? architectureEvolutionEngine.detectDrift(result.project, sourceSnapshot)
          : undefined;

        const activeStrategy = migrationStrategyRegistry.getStrategy(result.project.strategyId);

        return {
          summary: result.summary,
          strategy: {
            id: activeStrategy.id,
            name: activeStrategy.name,
            complexity: activeStrategy.complexity,
            description: activeStrategy.description,
          },
          waves: result.project.waves.map((w) => ({
            waveNumber: w.waveNumber,
            title: w.title,
            objective: w.objective,
            tasksCount: w.taskIds.length,
            status: w.status,
            rollbackStrategy: w.rollbackStrategy,
          })),
          roadmap: includeRoadmap
            ? {
                totalWaves: result.roadmap.totalWaves,
                estimatedTotalHours: result.roadmap.estimatedTotalHours,
                criticalPathTaskCount: result.roadmap.criticalPathTaskIds.length,
                hasScheduleGaps: result.roadmap.hasScheduleGaps,
              }
            : undefined,
          risks: includeRisks
            ? result.project.risks.slice(0, 4).map((r) => ({
                id: r.id,
                category: r.category,
                severity: r.severity,
                failureMode: r.failureMode,
                mitigationPlan: r.mitigationPlan,
              }))
            : undefined,
          rollbackFeasibility: includeRollbackPlans
            ? result.project.rollbackPlans.map((p) => ({
                waveId: p.waveId,
                feasibilityStatus: p.feasibilityStatus,
                isFeasible: p.isFeasible,
                hasPointOfNoReturn: p.pointOfNoReturnStepIndex !== undefined,
                pointOfNoReturnWarning: p.pointOfNoReturnWarning,
              }))
            : undefined,
          intermediateStates: includeIntermediateStates
            ? result.project.intermediateStates.map((s) => ({
                waveNumber: s.waveNumber,
                title: s.title,
                nodesCount: s.snapshot.nodes.length,
                edgesCount: s.snapshot.edges.length,
                reachabilityVerified: s.reachabilityVerified,
                validationStatus: s.validationStatus,
              }))
            : undefined,
          drift: drift
            ? {
                hasRegressions: drift.hasRegressions,
                driftItemsCount: drift.driftItems.length,
                items: drift.driftItems.slice(0, 3).map((d) => ({
                  type: d.driftType,
                  severity: d.severity,
                  description: d.description,
                })),
              }
            : undefined,
        };
      },
    });

    // ==========================================
    // Tool #30: Operational Readiness & DR Intelligence (Phase 05.3.27)
    // ==========================================
    this.registerTool({
      name: "get_architecture_operational_readiness_and_dr_intelligence",
      description:
        "Analyzes operational readiness, incident scenario blast radius, runbook coverage and safety, disaster recovery DAG sequence, RTO/RPO target verification, and operational drift across 8 dimensions.",
      parameters: {
        type: "object",
        properties: {
          includeImpactAnalyses: {
            type: "boolean",
            description: "Whether to include detailed failure propagation and blast radius scores.",
            default: true,
          },
          includeRunbookCoverage: {
            type: "boolean",
            description: "Whether to include mission-critical Tier 1 runbook coverage matrix.",
            default: true,
          },
          includeRecoveryPlan: {
            type: "boolean",
            description: "Whether to include disaster recovery DAG critical path and cycle validation.",
            default: true,
          },
          includeReadinessAssessment: {
            type: "boolean",
            description: "Whether to include the 8-dimension readiness score and findings.",
            default: true,
          },
          includeDrift: {
            type: "boolean",
            description: "Whether to evaluate operational drift and stale runbook reviews.",
            default: true,
          },
          scenarioId: {
            type: "string",
            description: "Optional specific incident scenario ID to inspect (e.g. 'SCN-DB-FAILOVER-001').",
          },
        },
      },
      execute: async (args, context) => {
        const includeImpact = args.includeImpactAnalyses !== false;
        const includeRunbooks = args.includeRunbookCoverage !== false;
        const includeRecovery = args.includeRecoveryPlan !== false;
        const includeReadiness = args.includeReadinessAssessment !== false;
        const includeDrift = args.includeDrift !== false;
        const specificScenarioId = args.scenarioId as string | undefined;

        // Build or use operational project from context
        const standardScenarios = incidentScenarioRegistry.getAllScenarios();
        const activeScenarios = specificScenarioId
          ? standardScenarios.filter((s) => s.id === specificScenarioId)
          : standardScenarios;

        const project: OperationalProject = context.operationalProject || {
          id: `op-proj-${context.architectureId}`,
          architectureId: context.architectureId,
          architectureRevisionId: context.graphRevision,
          title: "System Design Operational Readiness Baseline",
          scenarios: activeScenarios,
          journeys: [
            {
              id: "journey-checkout",
              title: "Checkout & Order Finalization",
              description: "Customer cart conversion and charge",
              entryPointComponentId: context.nodes[0]?.id || "gateway",
              traversedComponentIds: context.nodes.slice(0, 3).map((n) => n.id),
              recoveryPriority: 1,
              maxAllowedDowntimeSeconds: 120,
            },
          ],
          ownerships: context.nodes.map((n) => ({
            id: `own-${n.id}`,
            serviceId: n.id,
            primaryOwner: "platform-oncall@nxtqr.internal",
            team: "Core Platform",
            escalationPolicyId: "esc-standard",
          })),
          escalationPolicies: [
            {
              id: "esc-standard",
              name: "Standard Tier 1 Incident Escalation",
              levels: [
                {
                  levelNumber: 1,
                  delayMinutes: 0,
                  notifyRoles: ["incident_commander", "technical_lead"],
                  targetChannel: "#incidents-critical",
                  targetRoleName: "On-Call Primary",
                },
                {
                  levelNumber: 2,
                  delayMinutes: 15,
                  notifyRoles: ["recovery_engineer"],
                  targetChannel: "#incidents-critical",
                  targetRoleName: "Engineering VP",
                },
              ],
              fallbackContact: "noc-escalations@nxtqr.internal",
              acknowledgementTimeoutMinutes: 5,
            },
          ],
          runbooks: [
            {
              id: "rb-standard-triage",
              title: "Standard Service Triage & Failover",
              purpose: "Diagnose degraded instances and steer traffic to healthy standby",
              applicableComponentIds: context.nodes.slice(0, 2).map((n) => n.id),
              incidentScenarioIds: ["SCN-DB-FAILOVER-001"],
              revision: "1.0.0",
              steps: [
                {
                  id: "st-1",
                  stepNumber: 1,
                  type: "observation",
                  title: "Inspect Latency and Error Rate Metrics",
                  details: "Check 5xx error rate on edge proxy",
                  isDestructive: false,
                  requiresApproval: false,
                },
                {
                  id: "st-2",
                  stepNumber: 2,
                  type: "recovery",
                  title: "Promote Secondary Warm Standby",
                  details: "Execute DNS switchover to paired zone",
                  isDestructive: true,
                  requiresApproval: true,
                  verificationGate: "Health check HTTP 200 within 30s",
                },
              ],
              safetyWarnings: ["Promoting secondary without verifying replication lag can cause data loss."],
              prerequisites: ["VPN access and active incident channel open."],
              rollbackGuidance: "Revert DNS weights back to primary once connectivity is confirmed.",
              owner: "platform-team",
              reviewDate: new Date().toISOString(),
              isApproved: true,
            },
          ],
          objectives: [
            {
              id: "obj-checkout",
              serviceId: context.nodes[0]?.id || "gateway",
              serviceName: (context.nodes[0]?.data as any)?.label || "API Gateway",
              rtoTargetSeconds: 300,
              rpoTargetSeconds: 60,
              supportingStrategyType: "warm_standby",
              observedRtoSeconds: 180,
              observedRpoSeconds: 30,
              isRtoVerified: true,
              isRpoVerified: true,
              evidenceIds: ["ev-drill-baseline"],
            },
          ],
          dependencies: context.edges.map((e, idx) => ({
            id: `dep-${idx}`,
            sourceComponentId: e.source,
            targetComponentId: e.target,
            dependencyType: "infrastructure",
            isBlocking: true,
          })),
          backupCapabilities: [
            {
              id: "bk-default",
              componentId: context.nodes.find((n) => (n.data as any)?.nodeType === "database")?.id || context.nodes[0]?.id || "db",
              componentName: "Primary Data Store",
              backupType: "snapshot",
              scheduleExpression: "cron(0 2 * * ? *)",
              retentionDays: 30,
              isEncrypted: true,
              storageLocation: "s3://nxtqr-backups-vault",
              lastSuccessfulBackupAt: new Date().toISOString(),
              lastRestoreTestAt: new Date().toISOString(),
              restoreVerified: true,
              evidenceIds: ["ev-restore-verified"],
            },
          ],
          failoverProcedures: [
            {
              id: "fo-default",
              componentId: context.nodes[0]?.id || "gateway",
              primaryRegion: "us-east-1",
              secondaryRegion: "us-west-2",
              failoverType: "automatic",
              healthCheckType: "HTTPS Route53",
              dataSyncLagMaxSeconds: 30,
              failbackProcedure: "Gradually steer 10% traffic back after 1 hour zero errors.",
              readinessVerified: true,
              readinessNotes: ["Verified distinct secondary region: us-west-2."],
            },
          ],
          tabletopExercises: [
            {
              id: "ttx-recent",
              title: "Q3 Disaster Recovery Drill",
              scenarioId: "SCN-DB-FAILOVER-001",
              facilitator: "Lead Architect",
              participants: [{ name: "Alice", role: "incident_commander" }],
              scheduledDate: new Date().toISOString().slice(0, 10),
              status: "completed",
              assumptions: ["Warm standby ready"],
              injects: [],
              observations: [],
              findings: [],
              actionItems: [],
              completedAt: new Date().toISOString(),
            },
          ],
          evidence: [
            {
              id: "ev-drill-baseline",
              evidenceType: "failover_drill",
              sourceUri: "audit://drills/2026-q3-baseline",
              contentHash: "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
              recordedAt: new Date().toISOString(),
              verifiedBy: "sec-ops@nxtqr.internal",
              notes: "Verified secondary gateway takes over within 180 seconds under simulated loss.",
            },
          ],
        };

        const result = architectureOperationsEngine.analyzeOperations(
          project,
          context.nodes,
          context.edges
        );

        return {
          overallReadinessStatus: result.summary.overallReadinessStatus,
          overallScorePercent: result.readiness.overallScorePercent,
          summary: {
            scenariosCount: result.summary.totalScenariosCount,
            runbooksCount: result.summary.totalRunbooksCount,
            tier1CoveragePercent: result.summary.tier1CoveragePercent,
            criticalFindingsCount: result.summary.criticalFindingsCount,
            highFindingsCount: result.summary.highFindingsCount,
            verifiedObjectivesCount: result.summary.verifiedObjectivesCount,
          },
          readinessDimensions: includeReadiness
            ? result.readiness.dimensionScores.map((d) => ({
                dimension: d.dimension,
                status: d.status,
                coveragePercent: d.coveragePercent,
                notes: d.notes[0],
              }))
            : undefined,
          impactAnalyses: includeImpact
            ? result.impactAnalyses.slice(0, 3).map((ia) => ({
                scenarioId: ia.scenarioId,
                blastRadiusScore: ia.blastRadiusScore,
                directFailedCount: ia.directFailedComponentIds.length,
                propagatedCount: ia.propagatedComponentIds.length,
                impactedJourneysCount: ia.impactedJourneyIds.length,
              }))
            : undefined,
          recoveryPlan: includeRecovery
            ? {
                criticalPathSeconds: result.recoveryPlan.criticalPathSeconds,
                hasCycles: result.recoveryPlan.hasCycles,
                stepsCount: result.recoveryPlan.topologicalSequence.length,
                topologicalSequence: result.recoveryPlan.topologicalSequence.slice(0, 6),
              }
            : undefined,
          runbookCoverage: includeRunbooks
            ? result.runbookCoverage.slice(0, 5).map((rc) => ({
                componentId: rc.componentId,
                tier: rc.tier,
                hasRunbook: rc.hasRunbook,
                status: rc.coverageStatus,
              }))
            : undefined,
          drift: includeDrift
            ? {
                hasDrift: result.drift.hasDrift,
                staleRunbooksCount: result.drift.staleRunbooksCount,
                unmappedServicesCount: result.drift.unmappedServicesCount,
                items: result.drift.driftItems.slice(0, 3).map((di) => ({
                  type: di.itemType,
                  severity: di.severity,
                  description: di.description,
                })),
              }
            : undefined,
          findings: result.readiness.findings.slice(0, 4).map((f) => ({
            id: f.id,
            category: f.category,
            severity: f.severity,
            title: f.title,
            remediation: f.remediationRecommendation,
          })),
        };
      },
    });

    // ==========================================
    // Tool #31: Architecture Verification & Readiness Gates Intelligence (Phase 05.3.28)
    // ==========================================
    this.registerTool({
      name: "get_architecture_verification_and_readiness_intelligence",
      description:
        "Evaluates architecture assertions, test suites, quality readiness gates, evidence freshness, regressions, and requirement traceability across declared system designs.",
      parameters: {
        type: "object",
        properties: {
          includeTests: {
            type: "boolean",
            description: "Whether to include detailed test execution results and explanations.",
            default: true,
          },
          includeGates: {
            type: "boolean",
            description: "Whether to evaluate 5-state readiness gates (passed, failed, blocked, unknown, approved_with_exception).",
            default: true,
          },
          includeRegressions: {
            type: "boolean",
            description: "Whether to detect regressions against baseline runs.",
            default: true,
          },
          includeTraceability: {
            type: "boolean",
            description: "Whether to include requirement-to-test traceability matrix.",
            default: true,
          },
          includeCoverage: {
            type: "boolean",
            description: "Whether to include requirement, component, and evidence coverage percentages.",
            default: true,
          },
          suiteId: {
            type: "string",
            description: "Optional specific test suite ID to run (e.g. 'SUITE-PROD-READINESS').",
          },
        },
      },
      execute: async (args, context) => {
        const includeTests = args.includeTests !== false;
        const includeGates = args.includeGates !== false;
        const includeRegressions = args.includeRegressions !== false;
        const includeTraceability = args.includeTraceability !== false;
        const includeCoverage = args.includeCoverage !== false;
        const suiteId = args.suiteId as string | undefined;

        const defaultTests = architectureTestRegistry.getAll();
        const activeTests = suiteId
          ? (() => {
              const suite = suiteRegistry.getById(suiteId);
              return suite ? defaultTests.filter((t) => suite.testIds.includes(t.id)) : defaultTests;
            })()
          : defaultTests;

        const project: VerificationProject = context.verificationProject || {
          id: `ver-proj-${context.architectureId}`,
          name: "Architecture Verification & Quality Project",
          requirements: [
            {
              id: "REQ-ARCH-001",
              projectId: `ver-proj-${context.architectureId}`,
              version: "1.0.0",
              title: "Network Perimeter Ingress Gateway Requirement",
              description: "All client requests must enter through a managed API gateway with ingress controls.",
              category: "graph_topology",
              criticality: "critical",
              owner: "arch-board@nxtqr.internal",
              scope: { level: "architecture" },
              status: "active",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "REQ-SEC-001",
              projectId: `ver-proj-${context.architectureId}`,
              version: "1.0.0",
              title: "Perimeter Edge Authentication Requirement",
              description: "Ingress services must declare authentication enforcement before dispatching downstream.",
              category: "security",
              criticality: "critical",
              owner: "sec-ops@nxtqr.internal",
              scope: { level: "component" },
              status: "active",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "REQ-REL-002",
              projectId: `ver-proj-${context.architectureId}`,
              version: "1.0.0",
              title: "Database Backup Policy & RPO Requirement",
              description: "Databases must have active backup policies and verified recovery point objectives.",
              category: "database",
              criticality: "critical",
              owner: "data-plat@nxtqr.internal",
              scope: { level: "component" },
              status: "active",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          tests: activeTests,
          suites: suiteRegistry.getAll(),
          evidenceCatalog: [
            {
              id: "ev-topo-1",
              evidenceType: "architecture_topology",
              source: "graph-schema://verified-snapshot",
              owner: "architecture-engine",
              architectureRevisionId: context.graphRevision,
              observedAt: new Date().toISOString(),
              importedAt: new Date().toISOString(),
              contentHash: "sha256:4a83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9061",
              freshnessWindowHours: 72,
              isVerified: true,
            },
            {
              id: "ev-sec-1",
              evidenceType: "security_audit_log",
              source: "siem://edge-waf-audit",
              owner: "sec-ops",
              architectureRevisionId: context.graphRevision,
              observedAt: new Date().toISOString(),
              importedAt: new Date().toISOString(),
              contentHash: "sha256:5b83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9062",
              freshnessWindowHours: 24,
              isVerified: true,
            },
            {
              id: "ev-db-1",
              evidenceType: "backup_verification",
              source: "s3://backups/restore-audit",
              owner: "data-plat",
              architectureRevisionId: context.graphRevision,
              observedAt: new Date().toISOString(),
              importedAt: new Date().toISOString(),
              contentHash: "sha256:6c83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9063",
              freshnessWindowHours: 48,
              isVerified: true,
            },
            {
              id: "ev-runbook-1",
              evidenceType: "operational_runbook",
              source: "runbooks://rb-standard-triage",
              owner: "sre-core",
              architectureRevisionId: context.graphRevision,
              observedAt: new Date().toISOString(),
              importedAt: new Date().toISOString(),
              contentHash: "sha256:7d83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9064",
              freshnessWindowHours: 720,
              isVerified: true,
            },
          ],
          baselines: [],
          gates: gateRegistry.getAll(),
          exceptions: [],
          runs: [],
        };

        const result = architectureVerificationEngine.verifyArchitecture(
          project,
          context.nodes,
          context.edges
        );

        return {
          runSummary: {
            totalTests: result.run.summary.total,
            passed: result.run.summary.passed,
            failed: result.run.summary.failed,
            unknown: result.run.summary.unknown,
            notApplicable: result.run.summary.notApplicable,
            passRatePercent: result.run.summary.passRatePercent,
            durationMs: result.run.summary.executionDurationMs,
          },
          gates: includeGates
            ? result.gateEvaluations.map((g) => ({
                gateId: g.gateId,
                status: g.status,
                passedTestsCount: g.passedTestsCount,
                failedTestsCount: g.failedTestsCount,
                unknownTestsCount: g.unknownTestsCount,
                blockingReasons: g.blockingReasons,
              }))
            : undefined,
          tests: includeTests
            ? result.run.results.slice(0, 6).map((r) => ({
                testId: r.testId,
                status: r.status,
                explanation: r.explanation,
                affectedComponents: r.affectedComponentIds,
              }))
            : undefined,
          regressions:
            includeRegressions && result.regressions
              ? {
                  hasRegressions: result.regressions.hasRegressions,
                  newFailuresCount: result.regressions.summary.newFailuresCount,
                  resolvedFailuresCount: result.regressions.summary.resolvedFailuresCount,
                  affectedComponents: result.regressions.summary.affectedComponents,
                }
              : undefined,
          coverage: includeCoverage
            ? {
                requirementCoveragePercent: result.coverage.requirementCoveragePercent,
                componentCoveragePercent: result.coverage.componentCoveragePercent,
                evidenceCoveragePercent: result.coverage.evidenceCoveragePercent,
              }
            : undefined,
          traceability: includeTraceability
            ? result.traceability.slice(0, 4).map((t) => ({
                requirementId: t.requirementId,
                title: t.requirementTitle,
                criticality: t.criticality,
                latestStatus: t.latestStatus,
              }))
            : undefined,
        };
      },
    });

    // 32. Orchestrated Architecture Intelligence & Unified Analysis
    this.registerTool({
      name: "get_orchestrated_architecture_intelligence",
      description:
        "Runs multi-wave dependency-aware architecture intelligence orchestration across all analyzers. Correlates findings, identifies compound architectural bottlenecks, detects contradictions, and derives unified recommendations.",
      parameters: {
        type: "object",
        properties: {
          requestedAnalyzerIds: {
            type: "array",
            items: { type: "string" },
            description: "Optional subset of analyzer IDs to execute. If omitted, runs all standard analyzers.",
          },
          maxConcurrency: {
            type: "number",
            description: "Maximum parallel analyzers per wave. Defaults to 4.",
          },
          enableCache: {
            type: "boolean",
            description: "Whether to leverage the tenant-isolated result cache.",
          },
          includeFindings: {
            type: "boolean",
            description: "Whether to include detailed normalized findings. Defaults to true.",
          },
          includeCorrelations: {
            type: "boolean",
            description: "Whether to include compound multi-analyzer correlation groups. Defaults to true.",
          },
          includeContradictions: {
            type: "boolean",
            description: "Whether to include architectural contradiction records. Defaults to true.",
          },
          includeRecommendations: {
            type: "boolean",
            description: "Whether to include unified prioritized recommendations. Defaults to true.",
          },
        },
      },
      execute: async (args: Record<string, any>, context: AIExecutionContext) => {
        const assessment = await architectureOrchestrationEngine.orchestrateAnalysis(
          {
            nodes: context.nodes,
            edges: context.edges,
            configuration: {
              maxConcurrency: args.maxConcurrency ?? 4,
              enableCache: args.enableCache ?? true,
            },
          },
          args.requestedAnalyzerIds
        );

        const includeFindings = args.includeFindings ?? true;
        const includeCorrelations = args.includeCorrelations ?? true;
        const includeContradictions = args.includeContradictions ?? true;
        const includeRecommendations = args.includeRecommendations ?? true;

        return {
          summary: {
            assessmentId: assessment.id,
            completenessStatus: assessment.completenessStatus,
            healthScore: assessment.healthScore,
            durationMs: assessment.executionDurationMs,
            analyzersRun: assessment.analyzersRun,
            analyzersCompleted: assessment.analyzersCompleted,
            analyzersFailed: assessment.analyzersFailed,
            analyzersCached: assessment.analyzersCached,
            totalFindingsCount: assessment.totalFindingsCount,
            criticalCount: assessment.criticalFindingsCount,
            highCount: assessment.highFindingsCount,
            mediumCount: assessment.mediumFindingsCount,
            lowCount: assessment.lowFindingsCount,
          },
          correlationGroups: includeCorrelations
            ? assessment.correlationGroups.slice(0, 5).map((cg) => ({
                id: cg.id,
                title: cg.title,
                sharedComponentIds: cg.sharedComponentIds,
                findingsCount: cg.findings.length,
                candidateRootCause: cg.candidateRootCause,
                recommendedUnifiedAction: cg.recommendedUnifiedAction,
              }))
            : undefined,
          contradictions: includeContradictions
            ? assessment.contradictions.map((c) => ({
                id: c.id,
                type: c.type,
                description: c.description,
                involvedAnalyzers: c.involvedAnalyzerIds,
                affectedComponents: c.affectedComponentIds,
                explanation: c.explanation,
                resolutionGuidance: c.resolutionGuidance,
              }))
            : undefined,
          recommendations: includeRecommendations
            ? assessment.recommendations.slice(0, 5).map((r) => ({
                id: r.id,
                title: r.title,
                severity: r.severity,
                effort: r.effort,
                affectedComponents: r.affectedComponentIds,
                remediationSteps: r.remediationSteps,
              }))
            : undefined,
          findings: includeFindings
            ? assessment.findings.slice(0, 10).map((f) => ({
                id: f.id,
                sourceAnalyzerId: f.sourceAnalyzerId,
                category: f.category,
                severity: f.severity,
                title: f.title,
                affectedComponents: f.affectedComponentIds,
                confidence: f.confidence,
              }))
            : undefined,
        };
      },
    });
  }
}

export const AIToolRegistry = ArchitectureToolRegistry;
export const architectureToolRegistry = new ArchitectureToolRegistry();
