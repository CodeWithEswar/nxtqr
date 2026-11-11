import { describe, it, expect } from "vitest";
import { architectureEvolutionEngine } from "../evolution/engine/evolution-engine";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import { SectionComposer } from "../reports/engine/section-composer";
import { SourceResolver } from "../reports/engine/source-resolver";
import { MarkdownExporter } from "../reports/exporters/markdown-exporter";
import { HtmlExporter } from "../reports/exporters/html-exporter";
import type { ArchitectureSnapshot } from "../comparison/contracts/comparison.types";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ArchitectureReport } from "../reports/contracts/report.types";

describe("Phase 05.3.26 — Evolution Engine End-to-End Integration, AI Tool #29 & Reports", () => {
  const sourceSnapshot: ArchitectureSnapshot = {
    id: "snap-e2e-source",
    title: "E2E Source Architecture",
    schemaVersion: 1,
    provenance: "current-draft",
    revision: "rev-source-legacy-e2e",
    createdAt: new Date().toISOString(),
    nodes: [
      {
        id: "legacy-monolith-app",
        type: "custom",
        position: { x: 100, y: 100 },
        data: { label: "Legacy Monolith App", nodeType: "service" },
      } as BaseNode,
      {
        id: "legacy-sql-db",
        type: "custom",
        position: { x: 300, y: 100 },
        data: { label: "Legacy SQL DB", nodeType: "database" },
      } as BaseNode,
    ],
    edges: [
      { id: "e1", source: "legacy-monolith-app", target: "legacy-sql-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
    ],
    metadata: { environment: "legacy-dc", version: "1.0.0" },
  };

  const targetSnapshot: ArchitectureSnapshot = {
    id: "snap-e2e-target",
    title: "E2E Target Architecture",
    schemaVersion: 1,
    provenance: "what-if-proposal",
    revision: "rev-target-microservices-e2e",
    createdAt: new Date().toISOString(),
    nodes: [
      {
        id: "api-gw",
        type: "custom",
        position: { x: 50, y: 100 },
        data: { label: "API Gateway Facade", nodeType: "gateway" },
      } as BaseNode,
      {
        id: "auth-svc",
        type: "custom",
        position: { x: 250, y: 50 },
        data: { label: "Auth Microservice", nodeType: "service" },
      } as BaseNode,
      {
        id: "billing-svc",
        type: "custom",
        position: { x: 250, y: 150 },
        data: { label: "Billing Microservice", nodeType: "service" },
      } as BaseNode,
      {
        id: "cloud-db",
        type: "custom",
        position: { x: 450, y: 100 },
        data: { label: "Managed Aurora DB", nodeType: "database" },
      } as BaseNode,
    ],
    edges: [
      { id: "e-gw-auth", source: "api-gw", target: "auth-svc", type: "smoothstep", data: {} } as unknown as BaseEdge,
      { id: "e-gw-billing", source: "api-gw", target: "billing-svc", type: "smoothstep", data: {} } as unknown as BaseEdge,
      { id: "e-auth-db", source: "auth-svc", target: "cloud-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
      { id: "e-billing-db", source: "billing-svc", target: "cloud-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
    ],
    metadata: { environment: "cloud-aws", version: "2.0.0" },
  };

  it("plans full architecture evolution end-to-end and validates against Zod schema", () => {
    const result = architectureEvolutionEngine.planEvolution(sourceSnapshot, targetSnapshot, {
      projectId: "e2e-project-alpha",
      title: "Enterprise Core Evolution Plan",
      strategyId: "strangler_fig",
    });

    expect(result.projectId).toBe("e2e-project-alpha");
    expect(result.project.strategyId).toBe("strangler_fig");

    // Summary checks
    expect(result.summary.totalWavesCount).toBe(5);
    expect(result.summary.totalTasksCount).toBeGreaterThanOrEqual(8);
    expect(result.summary.estimatedTotalEffortHours).toBeGreaterThan(0);
    expect(result.summary.irreversibleWavesCount).toBe(1); // Wave 5 is irreversible
    expect(result.summary.hasBlockingIssues).toBe(false);

    // Roadmap checks
    expect(result.roadmap.milestones).toHaveLength(5);
    expect(result.roadmap.criticalPathTaskIds.length).toBeGreaterThan(0);

    // Cutover and Rollback checks
    expect(result.project.cutoverPlans).toHaveLength(1);
    expect(result.project.rollbackPlans).toHaveLength(5);
  });

  it("simulates What-If evolutionary scenarios accurately", () => {
    const baseline = architectureEvolutionEngine.planEvolution(sourceSnapshot, targetSnapshot, {
      projectId: "whatif-test",
    });

    // Simulate failed canary gate
    const canaryFailure = architectureEvolutionEngine.simulateWhatIf(baseline, "failed_canary_gate");
    expect(canaryFailure.summary.failedGatesCount).toBe(1);
    expect(canaryFailure.summary.hasBlockingIssues).toBe(true);

    // Simulate cutover rollback abort
    const rollbackAbort = architectureEvolutionEngine.simulateWhatIf(baseline, "cutover_abort_rollback");
    const wave4 = rollbackAbort.project.waves.find((w) => w.waveNumber === 4);
    expect(wave4?.status).toBe("rolled_back");
  });

  it("executes AI Assistant Tool #29: get_architecture_evolution_and_migration_intelligence", async () => {
    const tool = architectureToolRegistry.getTool("get_architecture_evolution_and_migration_intelligence");
    expect(tool).toBeDefined();

    const execution = await architectureToolRegistry.executeTool(
      "get_architecture_evolution_and_migration_intelligence",
      {
        strategyId: "strangler_fig",
        includeIntermediateStates: true,
        includeRoadmap: true,
        includeRisks: true,
        includeRollbackPlans: true,
      },
      {
        projectId: "proj-ai-test",
        architectureId: "arch-main",
        graphRevision: "rev-1",
        nodes: sourceSnapshot.nodes,
        edges: sourceSnapshot.edges,
        targetSnapshot,
      }
    );

    expect(execution.success).toBe(true);
    expect(execution.result).toBeDefined();

    const res = execution.result as any;
    expect(res.strategy.id).toBe("strangler_fig");
    expect(res.waves).toHaveLength(5);
    expect(res.roadmap.criticalPathTaskCount).toBeGreaterThan(0);
    expect(res.risks.length).toBeGreaterThan(0);
    expect(res.rollbackFeasibility.length).toBe(5);
  });

  it("integrates with Reports Generator and exports to Markdown and HTML", () => {
    const evolutionResult = architectureEvolutionEngine.planEvolution(sourceSnapshot, targetSnapshot, {
      projectId: "report-e2e-project",
    });

    const topologySummary = SourceResolver.resolveTopology(sourceSnapshot.nodes, sourceSnapshot.edges);

    const sections = SectionComposer.composeSections({
      nodes: sourceSnapshot.nodes,
      edges: sourceSnapshot.edges,
      topology: topologySummary,
      evidence: [],
      analysisContext: {
        migrationProject: evolutionResult.project,
      },
      audience: "engineering",
      enabledKinds: ["overview", "migration_and_evolution"],
    });

    const migrationSec = sections.find((s) => s.kind === "migration_and_evolution");
    expect(migrationSec).toBeDefined();
    expect(migrationSec?.content).toBeDefined();

    const sampleReport: ArchitectureReport = {
      id: "rep-evolution-1",
      projectId: "report-e2e-project",
      architectureId: "arch-sys",
      sourceSnapshotId: "snap-1",
      graphRevision: "rev-1",
      templateId: "detailed_technical_architecture",
      templateVersion: 1,
      audience: "engineering",
      title: "Enterprise Evolution & Strangler Fig Report",
      subtitle: "Cloud Modernization Blueprint",
      status: "verified",
      sections,
      evidence: [],
      assumptions: [],
      decisions: [],
      generatedAt: new Date().toISOString(),
      author: "NXTQR Evolution Engine",
      versionNumber: 1,
    };

    // Test Markdown Exporter
    const markdown = MarkdownExporter.export(sampleReport);
    expect(markdown.content).toContain("Architecture Migration, Modernization & Evolution Planning");
    expect(markdown.content).toContain("Migration Strategy:");
    expect(markdown.content).toContain("Migration Waves & Sequence");
    expect(markdown.content).toContain("Wave 1");
    expect(markdown.content).toContain("Wave 5");
    expect(markdown.content).toContain("Critical Migration Risks");
    expect(markdown.content).toContain("Rollback Feasibility");

    // Test HTML Exporter
    const html = HtmlExporter.export(sampleReport);
    expect(html.content).toContain("Architecture Migration, Modernization &amp; Evolution Planning");
    expect(html.content).toContain("Migration Waves & Execution Path");
    expect(html.content).toContain("Estimated Effort");
  });
});
