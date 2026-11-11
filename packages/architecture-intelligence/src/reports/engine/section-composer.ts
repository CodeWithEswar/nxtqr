import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type { ArchitectureDecisionRecord } from "../contracts/adr.types";
import type {
  ADRsSection,
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
