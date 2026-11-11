import { describe, it, expect } from 'vitest';
import { ArchitectureOrchestrationEngine } from '../orchestration/engine/orchestration-engine';
import { ArchitectureReadinessEngine } from '../readiness/engine/readiness-engine';
import { architectureToolRegistry } from '../ai-assistant/tools/tool-registry';
import { ArchitectureReportEngine } from '../reports/engine/report-engine';
import { MarkdownExporter } from '../reports/exporters/markdown-exporter';

describe('Phase 05.3.30: Cross-Module Integration Workflow', () => {
  const orchestrationEngine = new ArchitectureOrchestrationEngine();
  const readinessEngine = new ArchitectureReadinessEngine();
  const reportEngine = new ArchitectureReportEngine();

  const nodes = [
    {
      id: 'gw-1',
      type: 'gateway',
      position: { x: 0, y: 0 },
      data: { label: 'Public Edge Gateway', protocol: 'https', tlsVersion: '1.3' },
    },
    {
      id: 'srv-order',
      type: 'service',
      position: { x: 100, y: 0 },
      data: { label: 'Order Processing Service', replicas: 3, framework: 'NestJS' },
    },
    {
      id: 'db-orders',
      type: 'database',
      position: { x: 200, y: 0 },
      data: { label: 'Orders Primary DB', engine: 'PostgreSQL', storageGb: 250 },
    },
    {
      id: 'cache-orders',
      type: 'cache',
      position: { x: 200, y: 100 },
      data: { label: 'Order Session Cache', engine: 'Redis', memoryMb: 2048 },
    },
  ];

  const edges = [
    {
      id: 'e-gw-srv',
      source: 'gw-1',
      target: 'srv-order',
      data: { protocol: 'https', isSynchronous: true, timeoutMs: 3000 },
    },
    {
      id: 'e-srv-db',
      source: 'srv-order',
      target: 'db-orders',
      data: { protocol: 'tcp', isSynchronous: true, port: 5432 },
    },
    {
      id: 'e-srv-cache',
      source: 'srv-order',
      target: 'cache-orders',
      data: { protocol: 'tcp', isSynchronous: true, port: 6379 },
    },
  ];

  it('should execute full 30-phase cross-module workflow end-to-end', async () => {
    // 1. Run Unified Orchestration
    const orchestrationResult = await orchestrationEngine.orchestrateAnalysis({
      projectId: 'proj-e2e-integration',
      revisionId: 'rev-e2e-01',
      nodes,
      edges,
    });

    expect(orchestrationResult.completenessStatus).toBe('completed');
    expect(orchestrationResult.analyzerRuns.length).toBeGreaterThan(0);
    expect(orchestrationResult.findings.length).toBeGreaterThan(0);

    // 2. Run Production Readiness Assessment
    const readinessAssessment = await readinessEngine.assessProductionReadiness({
      projectId: 'proj-e2e-integration',
      revisionId: 'rev-e2e-01',
      nodes,
      edges,
    });

    expect(readinessAssessment.overallVerdict).toBe('ready_for_production');
    expect(readinessAssessment.readinessScore).toBeGreaterThanOrEqual(95);
    expect(readinessAssessment.nonFabricationVerified).toBe(true);

    // 3. Execute AI Assistant Tool #33
    const tool = architectureToolRegistry.getTool('get_architecture_production_readiness');
    expect(tool).toBeDefined();

    const toolResult = (await tool!.execute(
      { projectId: 'proj-e2e-integration', revisionId: 'rev-e2e-01' },
      { projectId: 'proj-e2e-integration', architectureId: 'arch-e2e-01', graphRevision: 'rev-e2e-01', nodes, edges }
    )) as any;

    expect(toolResult.verdict).toBe('ready_for_production');
    expect(toolResult.readinessScore).toBeGreaterThanOrEqual(95);
    expect(toolResult.nonFabricationVerified).toBe(true);

    // 4. Generate Architecture Report with Production Readiness Section
    const report = reportEngine.generateReport({
      projectId: 'proj-e2e-integration',
      architectureId: 'arch-e2e-01',
      nodes,
      edges,
      analysisContext: {
        readinessAssessment,
        orchestrationAssessment: orchestrationResult,
      } as any,
      enabledSections: ['overview', 'unified_architecture_intelligence', 'production_readiness_assessment'],
    });

    const exportResult = MarkdownExporter.export(report);
    expect(exportResult.content).toContain('Architecture Production Readiness');
    expect(exportResult.content).toContain('Measured Performance Benchmarks');
    expect(exportResult.content).toContain('8 Architectural Readiness Pillars');
  });
});
