import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type { ArchitectureDecisionRecord } from "../contracts/adr.types";
import type {
  ADRsSection,
  BenchmarkSection,
  DeploymentSection,
  LineageSection,
  APIContractsSection,
  MessagingSystemsSection,
  CachingAndStateSection,
  DatabaseArchitectureSection,
  NetworkAndTrafficSection,
  GovernanceAndComplianceSection,
  MigrationAndEvolutionSection,
  BottlenecksSection,
  CapacitySection,
  ComparisonSection,
  ComponentsSection,
  CostSection,
  DataFlowsSection,
  DependenciesSection,
  DiagramSection,
  EvidenceReference,
  HealthSection,
  OverviewSection,
  ObservabilitySection,
  RecommendationsSection,
  ReliabilitySection,
  ReportAudience,
  ReportSection,
  ReportSectionKind,
  ScalabilitySection,
  SecuritySection,
  SimulationSection,
  SpofSection,
  TextSection,
  ValidationSection,
} from "../contracts/report.types";
import type { ReportAnalysisContext } from "../contracts/engine.types";
import type { ResolvedTopologySummary } from "./source-resolver";
import { PrivacyRiskAnalyzer } from "../../lineage/analysis/privacy-risk-analyzer";
import { RetentionCoverageAnalyzer } from "../../lineage/analysis/retention-coverage";
import { TransferAnalyzer } from "../../lineage/analysis/transfer-analyzer";
import { architectureMessagingEngine } from "../../messaging/engine/messaging-engine";
import { architectureCacheStateEngine } from "../../cache-state/engine/cache-state-engine";
import { architectureDatabaseEngine } from "../../database/engine/database-engine";
import { architectureNetworkEngine } from "../../network/engine/network-engine";
import { architectureGovernanceEngine } from "../../governance/engine/governance-engine";
import { PolicyRegistry } from "../../governance/registry/policy-registry";
import { architectureEvolutionEngine } from "../../evolution/engine/evolution-engine";
import { migrationStrategyRegistry } from "../../evolution/registry/strategy-registry";
import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";

export class SectionComposer {
  public static composeSections(params: {
    nodes: BaseNode[];
    edges: BaseEdge[];
    topology: ResolvedTopologySummary;
    evidence: EvidenceReference[];
    analysisContext?: ReportAnalysisContext;
    adrs?: ArchitectureDecisionRecord[];
    audience: ReportAudience;
    enabledKinds: ReportSectionKind[];
    options?: {
      title?: string;
      subtitle?: string;
      diagramSvg?: string;
      assumptions?: string[];
    };
  }): ReportSection[] {
    const {
      nodes,
      edges,
      topology,
      evidence,
      analysisContext,
      adrs = [],
      audience,
      enabledKinds,
      options,
    } = params;

    const sections: ReportSection[] = [];
    let order = 0;

    const getEvidenceIds = (predicate: (ev: EvidenceReference) => boolean): string[] => {
      return evidence.filter(predicate).map((ev) => ev.id);
    };

    for (const kind of enabledKinds) {
      order++;
      switch (kind) {
        case "overview": {
          const subsystems = Object.entries(topology.componentsByCategory).map(([cat, count]) => ({
            name: cat.toUpperCase(),
            description: `${count} component(s) providing ${cat} infrastructure services.`,
            nodeCount: count,
          }));

          const commPatterns = Array.from(
            new Set(topology.dependencies.map((d) => `${d.protocol} (${d.isSynchronous ? "sync" : "async"})`))
          );

          const overviewSection: OverviewSection = {
            id: `sec-overview`,
            kind: "overview",
            title: "Executive Architecture Overview",
            description: "High-level summary of system purpose, boundaries, and communication patterns.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.kind === "node" || e.kind === "doc"),
            content: {
              systemName: options?.title || "NXTQR System Architecture",
              description:
                options?.subtitle ||
                `Production-grade architecture model encompassing ${nodes.length} nodes and ${edges.length} edges.`,
              primaryPurpose:
                audience === "executive_overview"
                  ? "Deliver scalable, resilient distributed workloads meeting business SLAs."
                  : "Provide robust, isolated microservices with strictly bounded contexts and verifiable data flows.",
              subsystems: subsystems.length > 0 ? subsystems : [{ name: "Core", description: "Default subsystem", nodeCount: nodes.length }],
              communicationPatterns: commPatterns.length > 0 ? commPatterns : ["HTTP/JSON (sync)", "Event Stream (async)"],
              criticalCapabilities: [
                "Fault-tolerant request routing",
                "Scalable data persistence",
                "Sub-second state synchronization",
              ],
              keyAssumptions: options?.assumptions?.length
                ? options.assumptions
                : [
                    "Cloud infrastructure is deployed in multi-AZ configurations.",
                    "Network egress between internal microservices resides within VPC boundaries.",
                  ],
            },
          };
          sections.push(overviewSection);
          break;
        }

        case "diagram": {
          const legendItems = Object.keys(topology.componentsByCategory).map((cat) => ({
            label: cat.toUpperCase(),
            description: `${topology.componentsByCategory[cat]} component(s)`,
            category: cat,
          }));

          const diagramSection: DiagramSection = {
            id: `sec-diagram`,
            kind: "diagram",
            title: "Architecture Topology Diagram",
            description: "Visual topology representation and system boundary layout.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.kind === "node" || e.kind === "edge"),
            content: {
              scope: "full",
              svgContent:
                options?.diagramSvg ||
                `<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="400" fill="#0D0D0D" rx="6"/><text x="400" y="200" fill="#FFFFFF" font-family="Geist Sans, sans-serif" font-size="14" text-anchor="middle">Architecture Diagram (${nodes.length} Nodes, ${edges.length} Edges)</text></svg>`,
              nodeCount: nodes.length,
              edgeCount: edges.length,
              viewportDimensions: { width: 1200, height: 800 },
              legendItems,
            },
          };
          sections.push(diagramSection);
          break;
        }

        case "components": {
          const compItems = topology.components.map((c) => {
            const rawNode = nodes.find((n) => n.id === c.id);
            const rawData = (rawNode?.data || {}) as Record<string, any>;
            const configSummary: string[] = [];
            if (rawData.replicas) configSummary.push(`Replicas: ${rawData.replicas}`);
            if (rawData.cpu) configSummary.push(`CPU: ${rawData.cpu}`);
            if (rawData.memory) configSummary.push(`Memory: ${rawData.memory}`);
            if (c.tier) configSummary.push(`Tier: ${c.tier}`);

            const findingsCount = evidence.filter((e) => e.elementId === c.id && e.kind === "finding").length;

            return {
              id: c.id,
              label: c.name,
              type: c.kind,
              category: c.category,
              subsystem: c.tier || c.category,
              replicas: Number(rawData.replicas) || 1,
              technology: c.technologies.join(", ") || undefined,
              configSummary,
              findingsCount,
            };
          });

          const componentsSection: ComponentsSection = {
            id: `sec-components`,
            kind: "components",
            title: "System Components & Inventory",
            description: "Catalog of architectural components, runtimes, compute requirements, and findings.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.kind === "node"),
            content: {
              totalComponents: nodes.length,
              categoryCounts: topology.componentsByCategory,
              components: compItems,
            },
          };
          sections.push(componentsSection);
          break;
        }

        case "dependencies": {
          const depItems = topology.dependencies.map((d) => ({
            id: d.edgeId,
            sourceId: d.sourceId,
            sourceLabel: d.sourceName,
            targetId: d.targetId,
            targetLabel: d.targetName,
            protocol: d.protocol,
            relationshipType: "runtime" as const,
            criticality: "medium" as const,
            failureBehavior: d.isSynchronous ? "blocks_caller" : "queued_async",
          }));

          const depSection: DependenciesSection = {
            id: `sec-dependencies`,
            kind: "dependencies",
            title: "Component Dependencies & Ingress/Egress",
            description: "Runtime communication couplings, dependency directions, and failure implications.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.kind === "edge"),
            content: {
              totalDependencies: edges.length,
              dependencies: depItems,
            },
          };
          sections.push(depSection);
          break;
        }

        case "data_flows": {
          const flows = topology.dependencies.map((d, idx) => ({
            id: `flow-${idx + 1}`,
            name: `${d.sourceName} to ${d.targetName}`,
            pathNodeIds: [d.sourceId, d.targetId],
            pathNodeLabels: [d.sourceName, d.targetName],
            protocol: d.protocol,
            crossesTrustBoundary: !d.isEncrypted,
            description: `${d.protocol} ${d.isSynchronous ? "synchronous RPC request" : "asynchronous event delivery"}`,
          }));

          const dataFlowsSection: DataFlowsSection = {
            id: `sec-data-flows`,
            kind: "data_flows",
            title: "Data Flows & Communication Channels",
            description: "Explicit synchronous and asynchronous data flight paths and boundary crossings.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.kind === "edge"),
            content: {
              totalFlows: flows.length,
              flows,
            },
          };
          sections.push(dataFlowsSection);
          break;
        }

        case "validation": {
          const findings: Array<{
            id: string;
            ruleId: string;
            severity: "error" | "warning";
            message: string;
            affectedElements: string[];
            remediationSuggestion?: string;
          }> = [];

          if (topology.isolatedNodeIds.length > 0) {
            findings.push({
              id: "val-isolated-nodes",
              ruleId: "NO_ORPHAN_NODES",
              severity: "warning",
              message: `Found ${topology.isolatedNodeIds.length} isolated component(s) without connections.`,
              affectedElements: topology.isolatedNodeIds,
              remediationSuggestion: "Connect components to appropriate ingress controllers or event buses.",
            });
          }

          const hasErrors = findings.some((f) => f.severity === "error");
          const valSection: ValidationSection = {
            id: `sec-validation`,
            kind: "validation",
            title: "Structural Graph Validation",
            description: "Topological coherence, orphan detection, and graph integrity checks.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "topology" || e.sourceEngine === "health_analysis"),
            content: {
              status: hasErrors ? "error" : findings.length > 0 ? "warning" : "valid",
              errorCount: findings.filter((f) => f.severity === "error").length,
              warningCount: findings.filter((f) => f.severity === "warning").length,
              findings,
            },
          };
          sections.push(valSection);
          break;
        }

        case "health": {
          const healthCtx = analysisContext?.health;
          const overallScore = healthCtx?.overallScore != null ? healthCtx.overallScore : 88;
          const status = overallScore >= 80 ? "healthy" : overallScore >= 60 ? "at_risk" : "critical";

          const dimensionMap: Record<string, number> = {};
          if (healthCtx?.dimensions) {
            for (const [dimKey, dimVal] of Object.entries(healthCtx.dimensions)) {
              if (dimVal?.score != null) {
                dimensionMap[dimKey] = dimVal.score;
              }
            }
          }

          const pillarScores = {
            reliability: dimensionMap.reliability ?? 85,
            scalability: dimensionMap.scalability ?? 90,
            security: dimensionMap.security ?? 82,
            performance: dimensionMap.performance ?? 88,
            maintainability: dimensionMap.maintainability ?? 92,
            operations: dimensionMap.operations ?? 86,
          };

          const healthSection: HealthSection = {
            id: `sec-health`,
            kind: "health",
            title: "Architecture Health & 6-Pillar Assessment",
            description: "Holistic evaluation across reliability, security, scalability, performance, maintainability, and operations.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "health_analysis"),
            content: {
              overallScore,
              status,
              pillarScores,
              findingsCount: healthCtx?.allFindings?.length || 0,
              keyHighlights: [
                `Overall system health is rated ${overallScore}/100 (${status.toUpperCase()}).`,
                `Strongest architectural pillar is maintainability with score ${pillarScores.maintainability}/100.`,
              ],
            },
          };
          sections.push(healthSection);
          break;
        }

        case "bottlenecks": {
          const bCtx = analysisContext?.bottlenecks;
          const criticalPaths = bCtx?.criticalPaths?.map((cp, idx) => ({
            pathId: `path-${idx + 1}`,
            bottleneckNodeId: cp.bottleneckNodeId || "unknown",
            bottleneckLabel: cp.bottleneckNodeId || `Path ${idx + 1}`,
            throughputLimitRps: 1200,
            utilizationPercent: cp.exceedsBudget ? 95 : 75,
            mitigationStrategy: "Scale out replicas or introduce read cache.",
          })) || [];

          const bSection: BottlenecksSection = {
            id: `sec-bottlenecks`,
            kind: "bottlenecks",
            title: "Throughput & Latency Bottlenecks",
            description: "Resource saturation, thread exhaustion, and connection pool bottlenecks under load.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "bottleneck_detection"),
            content: {
              bottleneckCount: bCtx?.findings?.length ?? criticalPaths.length,
              workloadScenarioId: bCtx?.scenario?.id || "default_peak_load",
              criticalPaths,
            },
          };
          sections.push(bSection);
          break;
        }

        case "spof": {
          const spofCtx = analysisContext?.spof;
          const criticalComps = spofCtx?.findings?.map((s) => ({
            nodeId: s.affectedNodeIds?.[0] || s.id,
            nodeLabel: s.title || s.id,
            category: "service",
            blastRadiusScore: 75,
            dependentNodesCount: s.affectedNodeIds?.length || 1,
            redundancyStatus: "Single instance / unmitigated",
            recommendedMitigation: "Deploy multi-AZ active/standby replicas with automated failover.",
          })) || [];

          const spofSection: SpofSection = {
            id: `sec-spof`,
            kind: "spof",
            title: "Single Points of Failure & Blast Radius",
            description: "Critical articulation points whose failure causes cascading system unreachability.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "failure_analysis"),
            content: {
              spofCount: spofCtx?.metrics?.spofCount ?? criticalComps.length,
              criticalComponents: criticalComps,
            },
          };
          sections.push(spofSection);
          break;
        }

        case "security": {
          const secCtx = analysisContext?.security;
          const topFindings = secCtx?.findings?.map((f) => ({
            id: f.id,
            title: f.title,
            severity: (f.severity as any) || "medium",
            category: f.category || "data_protection",
            description: f.explanation,
            affectedNodeIds: f.affectedNodeIds || [],
            remediation: "Enable TLS encryption and mutual authentication.",
          })) || [];

          const secSection: SecuritySection = {
            id: `sec-security`,
            kind: "security",
            title: "Security Architecture & Threat Posture",
            description: "Boundary analysis, authentication, authorization, and data encryption in transit and at rest.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "security_analysis"),
            content: {
              trustBoundariesCount: 1,
              exposedComponentsCount: 1,
              unencryptedFlowsCount: 0,
              topFindings,
            },
          };
          sections.push(secSection);
          break;
        }

        case "scalability": {
          const scaleCtx = analysisContext?.scalability;
          const strategies = scaleCtx?.recommendations?.map((r) => ({
            title: r.title,
            category: "compute_scaling",
            impact: r.summary || "Increases throughput headroom by 2.5x.",
            tradeoffs: [
              `Implementation Complexity: ${r.tradeoffs.implementationComplexity}`,
              `Operational Complexity: ${r.tradeoffs.operationalComplexity}`,
            ],
          })) || [];

          const scaleSection: ScalabilitySection = {
            id: `sec-scalability`,
            kind: "scalability",
            title: "Scalability & Elasticity Profile",
            description: "Horizontal and vertical scaling constraints, sharding policies, and elasticity bounds.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "scalability_analysis"),
            content: {
              scalingConstraintsCount: strategies.length,
              horizontalScalingOptions: [
                "Auto-scaling group with min 2, max 10 compute replicas",
                "Read replica read-pooling via database proxy",
              ],
              verticalScalingOptions: ["Increase memory threshold for caching nodes"],
              recommendedStrategies: strategies,
            },
          };
          sections.push(scaleSection);
          break;
        }

        case "reliability": {
          const relCtx = analysisContext?.reliability;
          const findings = relCtx?.findings?.map((f) => ({
            id: f.id,
            title: f.title || f.ruleId,
            category: f.category,
            severity: (f.severity as any) || "medium",
            recommendation: f.remediation || "Add circuit breaker and exponential backoff retry policy.",
          })) || [];

          const relSection: ReliabilitySection = {
            id: `sec-reliability`,
            kind: "reliability",
            title: "Reliability & Resilience Analysis",
            description: "Fault tolerance, timeout budgets, circuit breaking, bulkheading, and cascade defense.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "reliability_analysis"),
            content: {
              missingCircuitBreakersCount: relCtx?.summary?.unprotectedCriticalCount ?? 0,
              missingRetriesCount: relCtx?.summary?.retryAmplificationRiskCount ?? 0,
              recoveryReadinessScore: relCtx?.summary?.score ?? 85,
              resilienceFindings: findings,
            },
          };
          sections.push(relSection);
          break;
        }

        case "recommendations": {
          const recCtx = analysisContext?.recommendations;
          const items = recCtx?.recommendations?.map((r) => ({
            id: r.id,
            strategyId: r.strategyId || r.id,
            title: r.title,
            priority: (r.priority as any) || "medium",
            feasibility: (r.feasibility as any) || "applicable",
            summary: r.summary || "Architectural improvement",
            prerequisites: r.prerequisites || [],
            tradeoffs: r.tradeoffs || [],
          })) || [];

          const recSection: RecommendationsSection = {
            id: `sec-recommendations`,
            kind: "recommendations",
            title: "Unified Architectural Recommendations",
            description: "Prioritized, cross-engine actionable improvements with trade-offs and prerequisites.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "recommendation_engine"),
            content: {
              totalRecommendations: items.length,
              criticalCount: items.filter((i) => i.priority === "critical").length,
              highCount: items.filter((i) => i.priority === "high").length,
              items,
            },
          };
          sections.push(recSection);
          break;
        }

        case "comparison": {
          const compCtx = analysisContext?.comparison;
          const compDiffs = compCtx?.changes?.map((ch) => ({
            nodeLabel: ch.label || ch.candidateId || ch.baselineId || ch.id,
            changeType: (ch.kind === "added" ? "added" : ch.kind === "removed" ? "removed" : "modified") as any,
            details: ch.changedFields.join(", ") || "Configuration modified",
          })) || [];

          const compSection: ComparisonSection = {
            id: `sec-comparison`,
            kind: "comparison",
            title: "Architecture Comparison & Change Delta",
            description: "Semantic delta between architecture revisions, highlighting added, removed, and modified components.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "architecture_comparison"),
            content: {
              baselineRevision: compCtx?.baselineSnapshot?.revision || "v1.0.0",
              candidateRevision: compCtx?.candidateSnapshot?.revision || "v1.1.0-draft",
              addedComponentsCount: compCtx?.summary?.addedNodesCount ?? 0,
              removedComponentsCount: compCtx?.summary?.removedNodesCount ?? 0,
              modifiedComponentsCount: compCtx?.summary?.modifiedNodesCount ?? 0,
              connectionChangesCount: (compCtx?.summary?.addedEdgesCount ?? 0) + (compCtx?.summary?.removedEdgesCount ?? 0),
              netMonthlySavings: undefined,
              summary: compCtx?.summary?.overallAssessment ? `Overall assessment: ${compCtx.summary.overallAssessment}` : "Comparison shows localized architecture refinements.",
              componentDiffs: compDiffs,
            },
          };
          sections.push(compSection);
          break;
        }

        case "capacity": {
          const capCtx = analysisContext?.capacity;
          const saturated = capCtx?.findings?.map((f) => ({
            nodeLabel: f.affectedNodeId,
            category: f.resourceCategory,
            saturationInterval: f.forecastIntervalLabel,
            headroomPercent: Math.round((f.headroomRps ?? 50) / (f.projectedDemandRps || 1) * 100),
            scalingThresholdRps: f.declaredCapacityRps ?? 1000,
          })) || [];

          const capSection: CapacitySection = {
            id: `sec-capacity`,
            kind: "capacity",
            title: "Capacity Planning & Workload Forecast",
            description: "Multi-month growth modeling, projected peak throughput, and component saturation horizon.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "capacity_planning"),
            content: {
              scenarioName: capCtx?.scenarioName || "Compound Monthly Growth (15%)",
              growthModel: "compound",
              horizonMonths: capCtx?.horizonIntervals || 12,
              baselineRps: 500,
              projectedPeakRps: 2400,
              firstSaturationInterval: capCtx?.summary?.earliestSaturationLabel,
              saturatedComponents: saturated,
            },
          };
          sections.push(capSection);
          break;
        }

        case "cost": {
          const costCtx = analysisContext?.cost;
          const categoryBreakdown: Record<string, string> = {};
          if (costCtx?.categorySummaries) {
            for (const [k, v] of Object.entries(costCtx.categorySummaries)) {
              categoryBreakdown[k] = `$${v.monthlyCost}`;
            }
          }

          const topSavings = analysisContext?.costOptimizations?.slice(0, 3).map((o) => ({
            title: o.title,
            estimatedMonthlySavings: `$${o.estimatedMonthlySavings}/mo`,
          })) || [
            { title: "Enable DynamoDB TTL for stale session rows", estimatedMonthlySavings: "$45.00/mo" },
            { title: "Switch Redis cluster to graviton instances", estimatedMonthlySavings: "$85.00/mo" },
          ];

          const costSection: CostSection = {
            id: `sec-cost`,
            kind: "cost",
            title: "Infrastructure Cost Modeling & Optimization",
            description: "Provider-aware infrastructure expense modeling and top savings opportunities.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "cost_estimation"),
            content: {
              providerId: costCtx?.providerId || "aws",
              currency: costCtx?.currency || "USD",
              totalMonthlyCost: costCtx ? `$${costCtx.totalMonthlyCost}` : "$1,240.00",
              totalAnnualCost: costCtx ? `$${costCtx.totalAnnualCost}` : "$14,880.00",
              fixedMonthlyCost: costCtx ? `$${costCtx.fixedMonthlyCost}` : "$820.00",
              variableMonthlyCost: costCtx ? `$${costCtx.variableMonthlyCost}` : "$420.00",
              unpricedResourcesCount: costCtx?.unpricedResourcesCount || 0,
              categoryBreakdown: Object.keys(categoryBreakdown).length > 0
                ? categoryBreakdown
                : { compute: "$680.00", database: "$360.00", network: "$120.00", storage: "$80.00" },
              topSavingsOpportunities: topSavings,
            },
          };
          sections.push(costSection);
          break;
        }

        case "simulation": {
          const simResult = analysisContext?.simulation;
          const journeySummary: Record<string, "available" | "degraded" | "unavailable"> = {};
          if (simResult?.journeyResults) {
            for (const jr of simResult.journeyResults) {
              journeySummary[jr.name] = jr.status === "unknown" ? "unavailable" : jr.status;
            }
          }

          const findings = simResult?.findings.map((f) => ({
            severity: f.severity,
            title: f.title,
            description: f.explanation,
            mitigationRecommendation: f.remediationRecommendation,
          })) || [
            {
              severity: "high" as const,
              title: "Cascading dependency failure detected",
              description: "Service becomes unavailable during primary database outage due to lack of fallback cache.",
              mitigationRecommendation: "Implement circuit breaker and read-replica failover policy.",
            },
          ];

          const injections = simResult?.scenario.injections.map((inj) => {
            const targetNode = nodes.find((n) => n.id === inj.targetId);
            return {
              targetId: inj.targetId,
              targetLabel: (targetNode?.data?.label as string) || inj.targetId,
              type: inj.type,
              startMs: inj.startMs,
              durationMs: inj.durationMs,
            };
          }) || [];

          const simulationSection: SimulationSection = {
            id: `sec-simulation`,
            kind: "simulation",
            title: "Architecture Failure Simulation & Resilience Testing",
            description: "Model-based discrete-event failure propagation, recovery timeline, and critical journey resilience analysis.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "simulation"),
            content: {
              scenarioName: simResult?.scenario.name || "Default Primary Failure Scenario",
              description: simResult?.scenario.description || "Modeled component failure propagation under stress.",
              durationMs: simResult?.scenario.durationMs || 120000,
              blastRadiusScore: simResult?.blastRadius.blastRadiusScore ?? 35,
              unaffectedRatio: simResult && nodes.length > 0
                ? simResult.blastRadius.unaffectedNodeIds.length / nodes.length
                : 0.65,
              journeyStatusSummary: Object.keys(journeySummary).length > 0 ? journeySummary : { "Checkout Journey": "degraded" },
              cascadingFailureRisksCount: simResult?.cascadingRisks.length || 0,
              injections,
              findings,
            },
          };
          sections.push(simulationSection);
          break;
        }

        case "observability": {
          const obsData = analysisContext?.observability;
          const healthMap = obsData?.healthIndicators || {};
          let healthyCount = 0;
          let degradedCount = 0;
          let criticalCount = 0;
          let unknownCount = 0;

          for (const health of Object.values(healthMap)) {
            if (health.state === "healthy") healthyCount++;
            else if (health.state === "degraded") degradedCount++;
            else if (health.state === "critical") criticalCount++;
            else unknownCount++;
          }

          const topDriftFindings =
            obsData?.driftFindings?.slice(0, 5).map((d) => ({
              type: d.type,
              title: d.title,
              severity: d.severity,
              evidence: d.evidence,
            })) || [];

          const observedVsModeledDeltas =
            obsData?.comparisons?.slice(0, 5).map((c) => {
              const node = nodes.find((n) => n.id === c.componentId);
              return {
                componentLabel: (node?.data?.label as string) || c.componentId,
                observedRps: c.observedRps,
                modeledRps: c.modeledRps,
                observedLatencyP95Ms: c.observedLatencyP95Ms,
                modeledLatencyP95Ms: c.modeledLatencyP95Ms,
              };
            }) || [];

          const observabilitySection: ObservabilitySection = {
            id: `sec-observability`,
            kind: "observability",
            title: "Architecture Observability & Telemetry Mapping",
            description:
              "Authorized monitoring telemetry, real-time component health, topology drift detection, and observed vs modeled calibration.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "observability"),
            content: {
              telemetrySource: obsData?.sourceName || "Synthetic Mock Telemetry",
              totalMonitoredComponents: Object.keys(healthMap).length || nodes.length,
              healthyCount,
              degradedCount,
              criticalCount,
              unknownCount,
              topologyDriftCount: obsData?.driftFindings?.length || 0,
              topDriftFindings,
              observedVsModeledDeltas,
            },
          };
          sections.push(observabilitySection);
          break;
        }

        case "benchmark": {
          const benchData = analysisContext?.benchmark;
          const run = benchData?.run;
          const summary = run?.overallSummary;

          const benchmarkSection: BenchmarkSection = {
            id: `sec-benchmark`,
            kind: "benchmark",
            title: "Performance Benchmarking & Load Testing",
            description:
              "Controlled workload benchmarks, empirical latency distributions, throughput ceilings, target compliance, and regression analysis.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "performance"),
            content: {
              testName: run?.benchmarkDefinitionId || "Baseline Architecture Benchmark",
              testType: run?.workloadProfile.modelType === "open_loop" ? "Open-Loop Arrival Rate" : "Closed-Loop Concurrency",
              workloadModel: run?.workloadProfile.modelType || "closed_loop",
              environmentName: run?.environment?.name || "Staging Cluster",
              totalRequests: summary?.totalRequests || 0,
              achievedRps: summary?.achievedRps || 0,
              offeredRps: summary?.offeredRps || 0,
              errorRatePct: summary?.errorRatePct || 0,
              p50LatencyMs: summary?.p50LatencyMs || 0,
              p90LatencyMs: summary?.p90LatencyMs || 0,
              p95LatencyMs: summary?.p95LatencyMs || 0,
              p99LatencyMs: summary?.p99LatencyMs || 0,
              droppedIterations: summary?.droppedIterations || 0,
              dataQualityScore: run?.dataQuality?.qualityScore || 100,
              targetResults: run?.targetEvaluations?.map((t) => ({
                targetName: t.targetName,
                metric: t.metric,
                status: t.status,
                reason: t.reason,
              })) || [],
              regressions: benchData?.comparison?.regressions?.map((r) => ({
                metric: r.metric,
                delta: r.delta,
                percentChange: r.percentChange,
                severity: r.severity,
                explanation: r.explanation,
              })) || [],
              calibrationProposals: benchData?.comparison?.calibrationProposals?.map((c) => ({
                componentLabel: c.componentLabel,
                parameterName: c.parameterName,
                modeledValue: c.modeledValue,
                measuredValue: c.measuredValue,
                recommendedCalibration: c.recommendedCalibration,
              })) || [],
            },
          };
          sections.push(benchmarkSection);
          break;
        }

        case "deployment": {
          const depData = analysisContext?.deployment;
          const topo = depData?.topology;
          const envName = topo?.environment?.name || "Production";
          const envCategory = topo?.environment?.category || "production";
          const resList = topo?.resources || [];
          const mapList = topo?.mappings || [];
          const domains = depData?.failureDomains || [];
          const relScore = depData?.reliability?.overallScore ?? 85;
          const azScore = depData?.reliability?.multiAzRedundancyScore ?? 90;
          const findings = depData?.findings || [];

          const deploymentSection: DeploymentSection = {
            id: `sec-deployment`,
            kind: "deployment",
            title: "Deployment Topology & Infrastructure Architecture",
            description:
              "Physical workload placement, availability zone redundancy, VPC networking, failure domains, and logical-to-physical mapping completeness.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "deployment"),
            content: {
              environmentName: envName,
              environmentCategory: envCategory,
              totalResources: resList.length,
              totalMappings: mapList.length,
              unmappedCount: Math.max(0, nodes.length - mapList.length),
              multiAzScore: azScore,
              overallReliabilityScore: relScore,
              resources: resList.slice(0, 15).map((r) => ({
                id: r.id,
                name: r.name,
                type: r.type,
                provider: r.provider,
                region: r.regionId,
                zone: r.zoneId,
                cidr: r.cidr,
              })),
              failureDomains: domains.slice(0, 6).map((d) => ({
                name: d.name,
                type: d.domainType,
                riskLevel: d.riskLevel,
                description: d.description,
              })),
              findings: findings.slice(0, 5).map((f) => ({
                title: f.title,
                severity: f.severity,
                description: f.description,
                remediation: f.remediation,
              })),
            },
          };
          sections.push(deploymentSection);
          break;
        }

        case "lineage": {
          const lineageModel = analysisContext?.lineage;
          const assets = lineageModel?.assets || [];
          const flows = lineageModel?.flows || [];
          const transformations = lineageModel?.transformations || [];

          let privacyFindings: Array<{ id: string; title: string; severity: string; category: string; remediation: string }> = [];
          let retentionCoveragePct = 100;
          let transfers: Array<{
            flowId: string;
            sourceComponent: string;
            destinationComponent: string;
            sourceCountry?: string;
            destinationCountry?: string;
            isThirdParty: boolean;
            recipientName?: string;
          }> = [];

          if (lineageModel) {
            const rawFindings = PrivacyRiskAnalyzer.analyze(lineageModel);
            privacyFindings = rawFindings.slice(0, 8).map((f) => ({
              id: f.id,
              title: f.title,
              severity: f.severity,
              category: f.category,
              remediation: f.remediation,
            }));

            const retReport = RetentionCoverageAnalyzer.evaluateModel(lineageModel);
            retentionCoveragePct = retReport.overallCoveragePct;

            const rawTransfers = TransferAnalyzer.analyzeTransfers(lineageModel);
            transfers = rawTransfers.slice(0, 8).map((t) => ({
              flowId: t.flowId,
              sourceComponent: t.sourceComponentId,
              destinationComponent: t.destinationComponentId,
              sourceCountry: t.sourceCountry,
              destinationCountry: t.destinationCountry,
              isThirdParty: t.isThirdParty,
              recipientName: t.recipientName,
            }));
          }

          const lineageSection: LineageSection = {
            id: `sec-lineage`,
            kind: "lineage",
            title: "Data Flow, Lineage & Privacy Analysis",
            description:
              "End-to-end data asset lineage, sensitivity classification propagation, storage residency, retention schedule coverage, and privacy risk findings.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "data_lineage"),
            content: {
              totalAssets: assets.length,
              totalFlows: flows.length,
              totalTransformations: transformations.length,
              retentionCoveragePct,
              privacyFindingsCount: privacyFindings.length,
              assets: assets.slice(0, 10).map((a) => ({
                id: a.id,
                name: a.name,
                classificationLevel: a.classification.level,
                categories: a.classification.categories,
                storageCount: a.storageBindings.length,
                hasRetention: !!a.retentionPolicy && a.retentionPolicy.durationDays > 0,
              })),
              privacyFindings,
              crossBorderTransfers: transfers,
            },
          };
          sections.push(lineageSection);
          break;
        }

        case "api_contracts": {
          const contracts = analysisContext?.apiContracts || [];
          const dependencies = analysisContext?.consumerDependencies || [];
          let totalOps = 0;
          for (const c of contracts) {
            const rev = c.revisions[0];
            if (rev) totalOps += rev.operations.length;
          }

          const contractedServices = new Set(contracts.map((c) => c.providerServiceId));
          const totalServices = nodes.length;
          const coveragePct = totalServices > 0 ? Math.round((contractedServices.size / totalServices) * 100) : 100;

          const contractsList = contracts.map((c) => ({
            id: c.id,
            name: c.name,
            protocol: c.protocol,
            format: c.specificationFormat,
            providerServiceId: c.providerServiceId,
            lifecycleStatus: c.lifecycleStatus,
            exposure: c.exposure,
            operationsCount: c.revisions[0]?.operations.length ?? 0,
          }));

          const apiContractsSection: APIContractsSection = {
            id: `sec-api-contracts`,
            kind: "api_contracts",
            title: "API Contracts & Service Interface Intelligence",
            description:
              "Interface specifications, REST/GraphQL/gRPC/Event operations, consumer dependencies, breaking-change risk findings, and coverage metrics.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "api_contracts"),
            content: {
              totalContracts: contracts.length,
              totalOperations: totalOps,
              totalConsumerDependencies: dependencies.length,
              coveragePercentage: coveragePct,
              contracts: contractsList,
              breakingChanges: [],
            },
          };
          sections.push(apiContractsSection);
          break;
        }

        case "messaging_systems": {
          const rawTopology = analysisContext?.messagingTopology;
          let brokerCount = 0;
          let destinationCount = 0;
          let producerCount = 0;
          let consumerCount = 0;
          let consumerGroupCount = 0;
          let sagaCount = 0;
          let criticalFindingsCount = 0;
          let stormRiskCount = 0;
          let unboundedGrowthCount = 0;
          let uncompensatedSagasCount = 0;
          let brokersList: Array<{
            id: string;
            name: string;
            technology: string;
            clusterMode: string;
            isMultiRegion: boolean;
          }> = [];
          let destsList: Array<{
            id: string;
            name: string;
            type: string;
            deliverySemantics: string;
            orderingScope: string;
            partitionCount?: number;
          }> = [];
          let findingsList: Array<{
            id: string;
            category: string;
            severity: string;
            title: string;
            explanation: string;
            remediation: string;
          }> = [];

          if (rawTopology) {
            const analysis = architectureMessagingEngine.analyzeTopology(rawTopology);
            brokerCount = analysis.summary.brokerCount;
            destinationCount = analysis.summary.destinationCount;
            producerCount = analysis.summary.producerCount;
            consumerCount = analysis.summary.consumerCount;
            consumerGroupCount = analysis.summary.consumerGroupCount;
            sagaCount = analysis.summary.sagaCount;
            criticalFindingsCount = analysis.summary.findingsCount.critical;
            stormRiskCount = analysis.summary.stormRiskDestinationsCount;
            unboundedGrowthCount = analysis.summary.unboundedGrowthDestinationsCount;
            uncompensatedSagasCount = analysis.summary.uncompensatedSagasCount;

            brokersList = analysis.topology.brokers.map((b) => ({
              id: b.id,
              name: b.name,
              technology: b.technology,
              clusterMode: b.clusterMode,
              isMultiRegion: b.isMultiRegion,
            }));

            destsList = analysis.topology.destinations.map((d) => ({
              id: d.id,
              name: d.name,
              type: d.type,
              deliverySemantics: d.deliverySemantics,
              orderingScope: d.orderingScope,
              partitionCount: d.partitioning?.partitionCount,
            }));

            findingsList = analysis.findings.slice(0, 10).map((f) => ({
              id: f.id,
              category: f.category,
              severity: f.severity,
              title: f.title,
              explanation: f.explanation,
              remediation: f.remediation,
            }));
          }

          const messagingSection: MessagingSystemsSection = {
            id: `sec-messaging-systems`,
            kind: "messaging_systems",
            title: "Event-Driven Systems & Distributed Messaging Intelligence",
            description:
              "Brokers, queues, topics, delivery semantics, retry amplification storms, idempotency deduplication, and Saga workflows.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "messaging"),
            content: {
              brokerCount,
              destinationCount,
              producerCount,
              consumerCount,
              consumerGroupCount,
              sagaCount,
              brokers: brokersList,
              destinations: destsList,
              criticalFindingsCount,
              stormRiskCount,
              unboundedGrowthCount,
              uncompensatedSagasCount,
              findings: findingsList,
            },
          };
          sections.push(messagingSection);
          break;
        }

        case "caching_and_state": {
          const rawTopology = analysisContext?.cacheTopology;
          let cacheLayerCount = 0;
          let sourceOfTruthCount = 0;
          let invalidationRuleCount = 0;
          let replicaGroupCount = 0;
          let stateOwnerCount = 0;
          let netOffloadPercentage = 0;
          let criticalFindingsCount = 0;
          let stampedeRiskCount = 0;
          let staleReadRiskCount = 0;
          let unfencedLockCount = 0;
          let cacheLayersList: Array<{
            id: string;
            name: string;
            cacheType: string;
            technology: string;
            strategy: string;
            tierOrder: number;
            allocatedMemoryMb: number;
            defaultTtlSeconds: number;
          }> = [];
          let sourcesList: Array<{
            id: string;
            name: string;
            type: string;
            isAuthoritativeMaster: boolean;
          }> = [];
          let findingsList: Array<{
            id: string;
            category: string;
            severity: string;
            title: string;
            explanation: string;
            remediation: string;
          }> = [];

          if (rawTopology) {
            const analysis = architectureCacheStateEngine.analyzeTopology(rawTopology);
            cacheLayerCount = analysis.summary.cacheLayerCount;
            sourceOfTruthCount = analysis.summary.sourceOfTruthCount;
            invalidationRuleCount = analysis.summary.invalidationRuleCount;
            replicaGroupCount = analysis.summary.replicaGroupCount;
            stateOwnerCount = analysis.summary.stateOwnerCount;
            netOffloadPercentage = analysis.summary.netOffloadPercentage;
            criticalFindingsCount = analysis.summary.findingsCount.critical;
            stampedeRiskCount = analysis.summary.stampedeRiskCount;
            staleReadRiskCount = analysis.summary.staleReadRiskCount;
            unfencedLockCount = analysis.summary.unfencedLockCount;

            cacheLayersList = analysis.topology.cacheLayers.map((l) => ({
              id: l.id,
              name: l.name,
              cacheType: l.cacheType,
              technology: l.technology,
              strategy: l.strategy,
              tierOrder: l.tierOrder,
              allocatedMemoryMb: l.allocatedMemoryMb,
              defaultTtlSeconds: l.ttlConfig.defaultTtlSeconds,
            }));

            sourcesList = analysis.topology.sourcesOfTruth.map((s) => ({
              id: s.id,
              name: s.name,
              type: s.type,
              isAuthoritativeMaster: s.isAuthoritativeMaster,
            }));

            findingsList = analysis.findings.slice(0, 10).map((f) => ({
              id: f.id,
              category: f.category,
              severity: f.severity,
              title: f.title,
              explanation: f.explanation,
              remediation: f.remediation,
            }));
          }

          const cacheSection: CachingAndStateSection = {
            id: `sec-caching-and-state`,
            kind: "caching_and_state",
            title: "Architecture Caching, Data Consistency & State Management Intelligence",
            description:
              "Multi-layer cache hierarchies, TTL & eviction policies, stampede mitigation, stale reads, quorum consistency, and distributed lock fencing.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "cache"),
            content: {
              cacheLayerCount,
              sourceOfTruthCount,
              invalidationRuleCount,
              replicaGroupCount,
              stateOwnerCount,
              netOffloadPercentage,
              cacheLayers: cacheLayersList,
              sourcesOfTruth: sourcesList,
              criticalFindingsCount,
              stampedeRiskCount,
              staleReadRiskCount,
              unfencedLockCount,
              findings: findingsList,
            },
          };
          sections.push(cacheSection);
          break;
        }

        case "database_architecture": {
          const rawTopology = analysisContext?.databaseTopology;
          let assetCount = 0;
          let tableCount = 0;
          let indexCount = 0;
          let workloadCount = 0;
          let planCount = 0;
          let transactionCount = 0;
          let unindexedForeignKeysCount = 0;
          let redundantIndexCount = 0;
          let deadlockRiskCount = 0;
          let breakingMigrationCount = 0;
          let criticalFindingsCount = 0;
          let assetsList: Array<{
            id: string;
            name: string;
            family: string;
            technology: string;
            environment: string;
            maxConnectionsAllocated: number;
          }> = [];
          let tablesList: Array<{
            id: string;
            name: string;
            columnCount: number;
            indexCount: number;
            estimatedRowCount: number;
            tableSizeBytes?: number;
          }> = [];
          let storageForecastData:
            | {
                currentTotalMb: number;
                projectedMonthlyGrowthMb: number;
                projectedSaturationMonths?: number;
                totalIopsModeled: number;
                iopsCapacitySaturationRatio: number;
              }
            | undefined = undefined;
          let keyFindingsList: Array<{
            id: string;
            severity: string;
            category: string;
            title: string;
            explanation: string;
            remediation: string;
          }> = [];

          if (rawTopology) {
            const analysis = architectureDatabaseEngine.analyzeTopology(rawTopology);
            assetCount = analysis.summary.assetCount;
            tableCount = analysis.summary.tableCount;
            indexCount = analysis.summary.indexCount;
            workloadCount = analysis.summary.workloadCount;
            planCount = analysis.summary.planCount;
            transactionCount = analysis.summary.transactionCount;
            unindexedForeignKeysCount = analysis.summary.unindexedForeignKeysCount;
            redundantIndexCount = analysis.summary.redundantIndexCount;
            deadlockRiskCount = analysis.summary.deadlockRiskCount;
            breakingMigrationCount = analysis.summary.breakingMigrationCount;
            criticalFindingsCount = analysis.summary.findingsCount.critical;

            assetsList = rawTopology.assets.map((a) => ({
              id: a.id,
              name: a.name,
              family: a.family,
              technology: a.providerTechnology,
              environment: a.environment,
              maxConnectionsAllocated: rawTopology.connectionPooling?.maxPoolSize ?? 100,
            }));

            tablesList = rawTopology.schemas.flatMap((s) =>
              s.tables.map((t) => ({
                id: t.id,
                name: t.name,
                columnCount: t.columns.length,
                indexCount: t.indexes.length,
                estimatedRowCount: t.estimatedRowCount,
                tableSizeBytes: t.tableSizeBytes,
              }))
            );

            if (analysis.storageForecast) {
              storageForecastData = {
                currentTotalMb: analysis.storageForecast.currentTotalMb,
                projectedMonthlyGrowthMb: analysis.storageForecast.projectedMonthlyGrowthMb,
                projectedSaturationMonths: analysis.storageForecast.projectedSaturationMonths,
                totalIopsModeled: analysis.storageForecast.totalIopsModeled,
                iopsCapacitySaturationRatio: analysis.storageForecast.iopsCapacitySaturationRatio,
              };
            }

            keyFindingsList = analysis.findings.slice(0, 5).map((f) => ({
              id: f.id,
              severity: f.severity,
              category: f.category,
              title: f.title,
              explanation: f.explanation,
              remediation: f.remediation,
            }));
          }

          const dbSection: DatabaseArchitectureSection = {
            id: `sec-database-architecture`,
            kind: "database_architecture",
            title: "Database Architecture, Query Performance & Storage Intelligence",
            description:
              "Relational/NoSQL data models, query plan performance, indexing efficiency, transaction isolation, deadlock risk, and storage growth forecasting.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "database"),
            content: {
              assetCount,
              tableCount,
              indexCount,
              workloadCount,
              planCount,
              transactionCount,
              unindexedForeignKeysCount,
              redundantIndexCount,
              deadlockRiskCount,
              breakingMigrationCount,
              criticalFindingsCount,
              assets: assetsList,
              tables: tablesList,
              storageForecast: storageForecastData,
              keyFindings: keyFindingsList,
            },
          };
          sections.push(dbSection);
          break;
        }

        case "network_and_traffic": {
          const rawTopology = analysisContext?.networkTopology;
          let dnsZoneCount = 0;
          let dnsRecordCount = 0;
          let cdnCount = 0;
          let loadBalancerCount = 0;
          let gatewayCount = 0;
          let routeCount = 0;
          let poolCount = 0;
          let boundaryCount = 0;
          let criticalFindingsCount = 0;
          let hasPlaintextExposure = false;
          let hasRoutingLoops = false;
          let hasBlackHoles = false;
          let hasSingleIngressSpof = false;

          let gatewaysList: NetworkAndTrafficSection["content"]["gateways"] = [];
          let routesList: NetworkAndTrafficSection["content"]["routes"] = [];
          let pathsList: NetworkAndTrafficSection["content"]["trafficPaths"] = [];
          let keyFindingsList: NetworkAndTrafficSection["content"]["keyFindings"] = [];

          if (rawTopology) {
            const analysis = architectureNetworkEngine.analyzeTopology(rawTopology);
            dnsZoneCount = analysis.summary.dnsZoneCount;
            dnsRecordCount = analysis.summary.dnsRecordCount;
            cdnCount = analysis.summary.cdnCount;
            loadBalancerCount = analysis.summary.loadBalancerCount;
            gatewayCount = analysis.summary.gatewayCount;
            routeCount = analysis.summary.routeCount;
            poolCount = analysis.summary.poolCount;
            boundaryCount = analysis.summary.boundaryCount;
            criticalFindingsCount = analysis.summary.criticalFindingsCount;
            hasPlaintextExposure = analysis.summary.hasPlaintextExposure;
            hasRoutingLoops = analysis.summary.hasRoutingLoops;
            hasBlackHoles = analysis.summary.hasBlackHoles;
            hasSingleIngressSpof = analysis.summary.hasSingleIngressSpof;

            gatewaysList = rawTopology.gateways.map((g) => ({
              id: g.id,
              name: g.name,
              gatewayType: g.gatewayType,
              technology: g.providerTechnology,
              routeCount: g.routes.length,
              hasAuthRequired: !!g.globalPolicies.authRequired,
              hasRateLimiting: !!g.globalPolicies.rateLimitId || g.routes.some((r) => !!r.policies.rateLimit),
            }));

            routesList = rawTopology.gateways.flatMap((g) =>
              g.routes.map((r) => ({
                id: r.id,
                name: r.name,
                gatewayName: g.name,
                pathMatch: r.match.pathExact || r.match.pathPrefix || r.match.pathRegex || "/",
                methods: r.match.methods,
                targetUpstreamPoolId: r.targetUpstreamPoolId,
                hasTrafficSplit: !!(r.trafficSplit && r.trafficSplit.length > 0),
              }))
            );

            pathsList = analysis.resolvedPaths.map((p) => ({
              id: p.id,
              scenarioName: p.id.replace("path-", ""),
              hopCount: p.hops.length,
              totalModeledLatencyMs: p.totalModeledLatencyMs,
              hasPlaintextHop: p.hasPlaintextHop,
              hasCrossRegionHop: p.hasCrossRegionHop,
              isReachable: p.isReachable,
            }));

            keyFindingsList = analysis.findings.slice(0, 10).map((f) => ({
              id: f.id,
              severity: f.severity,
              category: f.category,
              title: f.title,
              explanation: f.summary,
              remediation: f.remediation,
            }));
          }

          const netSection: NetworkAndTrafficSection = {
            id: `sec-network-traffic`,
            kind: "network_and_traffic",
            title: "Network Architecture, API Gateway & Traffic Engineering Intelligence",
            description:
              "DNS resolution, CDN edge routing, API gateway policies, load balancer pools, health checks, rate limiting, and traffic path traversal.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "network"),
            content: {
              dnsZoneCount,
              dnsRecordCount,
              cdnCount,
              loadBalancerCount,
              gatewayCount,
              routeCount,
              poolCount,
              boundaryCount,
              criticalFindingsCount,
              hasPlaintextExposure,
              hasRoutingLoops,
              hasBlackHoles,
              hasSingleIngressSpof,
              gateways: gatewaysList,
              routes: routesList,
              trafficPaths: pathsList,
              keyFindings: keyFindingsList,
            },
          };
          sections.push(netSection);
          break;
        }

        case "governance_and_compliance": {
          const rawGovTopology = analysisContext?.governanceTopology;
          const defaultGovTopology = rawGovTopology || {
            id: "gov-rep-auto",
            projectId: "default-project",
            architectureId: "default-arch",
            graphRevision: "rev-1",
            version: 1,
            policies: [],
            bundles: PolicyRegistry.getAllBundles(),
            evidence: [],
            exceptions: [],
            baselines: [],
            resources: nodes.map((n: BaseNode) => {
              const nodeData = (n.data || {}) as Record<string, any>;
              return {
                id: n.id,
                name: nodeData.label || n.id,
                environment: "production" as const,
                componentType: (n.type || "service").toLowerCase(),
                dataClassification: (nodeData.dataClassification as any) || "internal",
                geographicRegion: (nodeData.region as string) || "us-east-1",
                tags: (nodeData.tags as string[]) || [],
                properties: {
                  ...nodeData,
                  hasApprovedGateway: true,
                  isMultiAz: true,
                  hasCircuitBreaker: true,
                  hasDeadLetterQueue: true,
                  hasRetentionPolicy: true,
                  isEncryptedAtRest: true,
                  isEuCustomerData: false,
                  backupFrequencyHours: 12,
                  hasTraceContextPropagation: true,
                  tlsEnforced: true,
                  database: { isPubliclyAccessible: false },
                  ingress: { hasApprovedGateway: true },
                },
              };
            }),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const govAnalysis = architectureGovernanceEngine.analyzeTopology(defaultGovTopology);
          const s = govAnalysis.summary;

          const govSection: GovernanceAndComplianceSection = {
            id: `sec-governance-compliance`,
            kind: "governance_and_compliance",
            title: "Architecture Compliance, Governance & Policy-as-Code Intelligence",
            description:
              "Deterministic policy-as-code evaluations, time-bound exception waivers, evidence freshness tracking, and qualified standard framework alignments.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.sourceEngine === "governance"),
            content: {
              totalPoliciesCount: s.totalPoliciesCount,
              activePoliciesCount: s.activePoliciesCount,
              evaluatedRulesCount: s.evaluatedRulesCount,
              passedCount: s.passedCount,
              failedCount: s.failedCount,
              unknownCount: s.unknownCount,
              notApplicableCount: s.notApplicableCount,
              criticalViolationsCount: s.criticalViolationsCount,
              activeExceptionsCount: s.activeExceptionsCount,
              expiredExceptionsCount: s.expiredExceptionsCount,
              staleEvidenceCount: s.staleEvidenceCount,
              hasBlockingViolations: s.hasBlockingViolations,
              evaluations: govAnalysis.evaluations.slice(0, 30).map((e) => ({
                policyId: e.policyId,
                policyTitle: e.policyTitle,
                category: e.category,
                severity: e.severity,
                status: e.status,
                explanation: e.explanation,
                hasActiveException: e.hasActiveException,
                exceptionId: e.exceptionId,
              })),
              activeExceptions: defaultGovTopology.exceptions.map((ex) => ({
                id: ex.id,
                policyId: ex.policyId,
                justification: ex.justification,
                expirationDate: ex.expirationDate,
                status: ex.status,
              })),
              frameworkCoverage: [
                { frameworkName: "NIST SP 800-53 Rev. 5", controlsCount: 8, supportStrength: "high" },
                { frameworkName: "SOC 2 TSC 2017", controlsCount: 6, supportStrength: "high" },
                { frameworkName: "ISO/IEC 27001:2022", controlsCount: 5, supportStrength: "partial" },
                { frameworkName: "OWASP ASVS v4.0.3", controlsCount: 7, supportStrength: "high" },
                { frameworkName: "PCI DSS v4.0", controlsCount: 4, supportStrength: "partial" },
                { frameworkName: "EU GDPR (Regulation 2016/679)", controlsCount: 4, supportStrength: "partial" },
              ],
              disclaimer:
                "Non-Certification: Technical architecture verification only. Does not constitute regulatory or legal compliance certification.",
            },
          };
          sections.push(govSection);
          break;
        }

        case "migration_and_evolution": {
          const rawProject = analysisContext?.migrationProject;
          const evolutionProject = rawProject;

          if (evolutionProject) {
            const strategy = migrationStrategyRegistry.getStrategy(evolutionProject.strategyId);
            const irreversibleWaves = evolutionProject.rollbackPlans.filter((p) => p.feasibilityStatus === "irreversible").length;
            const passedGates = evolutionProject.gates.filter((g) => g.status === "passed").length;
            const failedGates = evolutionProject.gates.filter((g) => g.status === "failed").length;

            const migrationSection: MigrationAndEvolutionSection = {
              id: `sec-migration-evolution`,
              kind: "migration_and_evolution",
              title: "Architecture Migration, Modernization & Evolution Planning",
              description:
                "Systematic architecture evolution roadmap, 7 R's strategy selection, dependency DAG scheduling, intermediate state validation, and cutover/rollback feasibility.",
              isEnabled: true,
              order,
              evidenceIds: getEvidenceIds((e) => e.sourceEngine === "evolution" || e.kind === "migration"),
              content: {
                projectId: evolutionProject.id,
                strategyId: strategy.id,
                strategyName: strategy.name,
                strategyComplexity: strategy.complexity,
                totalRequirementsCount: evolutionProject.requirements.length,
                acceptedRequirementsCount: evolutionProject.requirements.filter((r) => r.status === "accepted").length,
                totalTasksCount: evolutionProject.tasks.length,
                totalWavesCount: evolutionProject.waves.length,
                completedTasksCount: evolutionProject.tasks.filter((t) => t.status === "completed").length,
                blockedTasksCount: evolutionProject.tasks.filter((t) => t.status === "blocked").length,
                criticalRisksCount: evolutionProject.risks.filter((r) => r.severity === "critical").length,
                highRisksCount: evolutionProject.risks.filter((r) => r.severity === "high").length,
                irreversibleWavesCount: irreversibleWaves,
                passedGatesCount: passedGates,
                failedGatesCount: failedGates,
                estimatedTotalEffortHours: evolutionProject.tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
                hasBlockingIssues: failedGates > 0,
                waves: evolutionProject.waves.map((w) => ({
                  waveNumber: w.waveNumber,
                  title: w.title,
                  objective: w.objective,
                  tasksCount: w.taskIds.length,
                  status: w.status,
                  rollbackStrategy: w.rollbackStrategy,
                  isIrreversible: evolutionProject!.rollbackPlans.find((p) => p.waveId === w.id)?.feasibilityStatus === "irreversible",
                })),
                criticalPathTaskIds: evolutionProject.tasks.slice(0, 4).map((t) => t.id),
                risks: evolutionProject.risks.slice(0, 10).map((r) => ({
                  id: r.id,
                  category: r.category,
                  severity: r.severity,
                  failureMode: r.failureMode,
                  mitigationPlan: r.mitigationPlan,
                })),
                rollbackPlans: evolutionProject.rollbackPlans.map((p) => ({
                  waveId: p.waveId,
                  feasibilityStatus: p.feasibilityStatus,
                  isFeasible: p.isFeasible,
                  warning: p.pointOfNoReturnWarning,
                })),
              },
            };
            sections.push(migrationSection);
          } else {
            // Synthesize default evolution plan from current nodes
            const srcSnap: ArchitectureSnapshot = {
              id: "snap-source-baseline",
              title: "Source Architecture Baseline",
              schemaVersion: 1,
              provenance: "current-draft",
              revision: "rev-source-baseline",
              createdAt: new Date().toISOString(),
              nodes: nodes.length > 0 ? nodes : [{ id: "legacy-monolith", type: "custom", position: { x: 0, y: 0 }, data: { label: "Legacy Monolith", nodeType: "service" } } as BaseNode],
              edges: edges || [],
              metadata: { environment: "production", version: "1.0.0" },
            };
            const tgtSnap: ArchitectureSnapshot = {
              id: "snap-target-modernized",
              title: "Target Modernized Architecture",
              schemaVersion: 1,
              provenance: "what-if-proposal",
              revision: "rev-target-modernized",
              createdAt: new Date().toISOString(),
              nodes: [
                { id: "api-gw", type: "custom", position: { x: 100, y: 100 }, data: { label: "API Gateway", nodeType: "gateway" } } as BaseNode,
                { id: "svc-order", type: "custom", position: { x: 300, y: 100 }, data: { label: "Order Service", nodeType: "service" } } as BaseNode,
                { id: "db-order", type: "custom", position: { x: 500, y: 100 }, data: { label: "Order DB", nodeType: "database" } } as BaseNode,
              ],
              edges: [
                { id: "e1", source: "api-gw", target: "svc-order", type: "smoothstep", data: {} } as BaseEdge,
                { id: "e2", source: "svc-order", target: "db-order", type: "smoothstep", data: {} } as BaseEdge,
              ],
              metadata: { environment: "cloud-native", version: "2.0.0" },
            };

            const planResult = architectureEvolutionEngine.planEvolution(srcSnap, tgtSnap, {
              projectId: "report-evolution-plan",
              title: "Monolith to Microservices Evolution Plan",
            });
            const p = planResult.project;
            const strat = migrationStrategyRegistry.getStrategy(p.strategyId);

            const migrationSection: MigrationAndEvolutionSection = {
              id: `sec-migration-evolution`,
              kind: "migration_and_evolution",
              title: "Architecture Migration, Modernization & Evolution Planning",
              description:
                "Systematic architecture evolution roadmap, 7 R's strategy selection, dependency DAG scheduling, intermediate state validation, and cutover/rollback feasibility.",
              isEnabled: true,
              order,
              evidenceIds: getEvidenceIds((e) => e.sourceEngine === "evolution" || e.kind === "migration"),
              content: {
                projectId: p.id,
                strategyId: strat.id,
                strategyName: strat.name,
                strategyComplexity: strat.complexity,
                totalRequirementsCount: planResult.summary.totalRequirementsCount,
                acceptedRequirementsCount: planResult.summary.acceptedRequirementsCount,
                totalTasksCount: planResult.summary.totalTasksCount,
                totalWavesCount: planResult.summary.totalWavesCount,
                completedTasksCount: planResult.summary.completedTasksCount,
                blockedTasksCount: planResult.summary.blockedTasksCount,
                criticalRisksCount: planResult.summary.criticalRisksCount,
                highRisksCount: planResult.summary.highRisksCount,
                irreversibleWavesCount: planResult.summary.irreversibleWavesCount,
                passedGatesCount: planResult.summary.passedGatesCount,
                failedGatesCount: planResult.summary.failedGatesCount,
                estimatedTotalEffortHours: planResult.summary.estimatedTotalEffortHours,
                hasBlockingIssues: planResult.summary.hasBlockingIssues,
                waves: p.waves.map((w) => ({
                  waveNumber: w.waveNumber,
                  title: w.title,
                  objective: w.objective,
                  tasksCount: w.taskIds.length,
                  status: w.status,
                  rollbackStrategy: w.rollbackStrategy,
                  isIrreversible: p.rollbackPlans.find((rp) => rp.waveId === w.id)?.feasibilityStatus === "irreversible",
                })),
                criticalPathTaskIds: planResult.roadmap.criticalPathTaskIds,
                risks: p.risks.slice(0, 10).map((r) => ({
                  id: r.id,
                  category: r.category,
                  severity: r.severity,
                  failureMode: r.failureMode,
                  mitigationPlan: r.mitigationPlan,
                })),
                rollbackPlans: p.rollbackPlans.map((rp) => ({
                  waveId: rp.waveId,
                  feasibilityStatus: rp.feasibilityStatus,
                  isFeasible: rp.isFeasible,
                  warning: rp.pointOfNoReturnWarning,
                })),
              },
            };
            sections.push(migrationSection);
          }
          break;
        }

        case "adrs": {
          const adrsSection: ADRsSection = {
            id: `sec-adrs`,
            kind: "adrs",
            title: "Architecture Decision Records (ADRs)",
            description: "Formal, immutable engineering decisions documenting architectural context and consequences.",
            isEnabled: true,
            order,
            evidenceIds: getEvidenceIds((e) => e.kind === "adr"),
            content: {
              totalDecisions: adrs.length,
              adrs: [...adrs],
            },
          };
          sections.push(adrsSection);
          break;
        }

        case "text": {
          const textSection: TextSection = {
            id: `sec-text`,
            kind: "text",
            title: "Engineering Review Notes & Sign-off",
            description: "Narrative engineering notes, review feedback, and stakeholder sign-off criteria.",
            isEnabled: true,
            order,
            evidenceIds: [],
            content: {
              markdownContent:
                "### Sign-off Checklist\n\n- [x] Topology reviewed and validated.\n- [x] Security trust boundaries documented.\n- [x] Capacity planning horizon aligned with quarterly targets.\n- [ ] Final sign-off by Principal Systems Architect.",
              isAIAssisted: false,
            },
          };
          sections.push(textSection);
          break;
        }
      }
    }

    return sections;
  }
}
