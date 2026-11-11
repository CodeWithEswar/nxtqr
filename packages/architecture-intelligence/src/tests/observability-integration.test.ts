import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { MockTelemetryAdapter } from "../observability/connectors/mock-telemetry-adapter";
import { architectureObservabilityEngine } from "../observability/engine/observability-engine";
import { AIToolRegistry } from "../ai-assistant/tools/tool-registry";
import { SectionComposer } from "../reports/engine/section-composer";
import { SourceResolver } from "../reports/engine/source-resolver";
import { MarkdownExporter } from "../reports/exporters/markdown-exporter";
import { HtmlExporter } from "../reports/exporters/html-exporter";
import type {
  TelemetryConnection,
  TelemetryServiceMapping,
} from "../observability/contracts/observability.types";
import type { ArchitectureReport } from "../reports/contracts/report.types";

describe("Architecture Observability - Integration Test Suite", () => {
  const sampleNodes: BaseNode[] = [
    {
      id: "node-ingress",
      type: "service",
      position: { x: 0, y: 0 },
      data: { label: "API Gateway" },
    },
    {
      id: "node-orders",
      type: "service",
      position: { x: 150, y: 0 },
      data: { label: "Order Service" },
    },
    {
      id: "node-database",
      type: "database",
      position: { x: 300, y: 0 },
      data: { label: "PostgreSQL Primary" },
    },
  ];

  const sampleEdges: BaseEdge[] = [
    { id: "e1", source: "node-ingress", target: "node-orders", data: {} },
    { id: "e2", source: "node-orders", target: "node-database", data: {} },
  ];

  const activeConnection: TelemetryConnection = {
    id: "conn-mock-1",
    projectId: "proj-integration",
    name: "Production Mock Telemetry",
    sourceType: "mock",
    endpointUrl: "https://telemetry.mock.internal",
    authType: "none",
    status: "active",
    capabilities: ["metrics", "traces", "logs"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mappings: TelemetryServiceMapping[] = [
    {
      id: "map-ingress",
      projectId: "proj-integration",
      architectureId: "arch-integration",
      componentId: "node-ingress",
      connectionId: "conn-mock-1",
      serviceIdentity: { serviceName: "api-gateway" },
      confidence: "confirmed",
      evidenceScore: 1.0,
      evidenceReasons: ["Manual mapping"],
      lastVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "map-orders",
      projectId: "proj-integration",
      architectureId: "arch-integration",
      componentId: "node-orders",
      connectionId: "conn-mock-1",
      serviceIdentity: { serviceName: "order-service" },
      confidence: "confirmed",
      evidenceScore: 1.0,
      evidenceReasons: ["Manual mapping"],
      lastVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("executes end-to-end mock telemetry queries", async () => {
    const adapter = new MockTelemetryAdapter();
    const context = {
      connection: activeConnection,
      projectId: "proj-integration",
      userId: "user-1",
    };
    const testRes = await adapter.testConnection(context);
    expect(testRes.success).toBe(true);

    const services = await adapter.discoverServices(context);
    expect(services.length).toBeGreaterThan(0);

    const now = Date.now();
    const metricsRes = await adapter.queryMetrics(
      {
        connectionId: activeConnection.id,
        queryExpression: "rate(http_requests_total[5m])",
        timeRange: { startMs: now - 300000, endMs: now, stepSeconds: 60 },
      },
      context
    );
    expect(metricsRes.series.length).toBeGreaterThan(0);

    const tracesRes = await adapter.queryTraces(
      {
        connectionId: activeConnection.id,
        timeRange: { startMs: now - 300000, endMs: now, stepSeconds: 60 },
        limit: 5,
      },
      context
    );
    expect(tracesRes.spans.length).toBeGreaterThan(0);

    const logsRes = await adapter.queryLogs(
      {
        connectionId: activeConnection.id,
        timeRange: { startMs: now - 300000, endMs: now, stepSeconds: 60 },
      },
      context
    );
    expect(logsRes.entries.length).toBeGreaterThan(0);
  });

  it("evaluates architecture observability using the master engine", async () => {
    const result = await architectureObservabilityEngine.evaluateArchitectureObservability({
      nodes: sampleNodes,
      edges: sampleEdges,
      connection: activeConnection,
      mappings,
      timeRange: { startMs: Date.now() - 300000, endMs: Date.now(), stepSeconds: 60 },
      modeledExpectations: {
        "node-ingress": { expectedRps: 500, expectedLatencyP95Ms: 40 },
        "node-orders": { expectedRps: 450, expectedLatencyP95Ms: 60 },
      },
    });

    expect(result.connectionStatus).toBe("active");
    expect(result.healthIndicators["node-ingress"]).toBeDefined();
    expect(result.healthIndicators["node-orders"]).toBeDefined();
    // node-database is unmonitored -> drift detector should catch it
    const missingCov = result.driftFindings.find((f) => f.sourceComponentId === "node-database");
    expect(missingCov).toBeDefined();
    expect(missingCov?.type).toBe("missing_telemetry");
  });

  it("invokes AI Architecture Assistant Tool #19 (get_observability_telemetry)", async () => {
    const registry = new AIToolRegistry();
    const tool = registry.getTool("get_observability_telemetry");
    expect(tool).toBeDefined();

    const output = await registry.executeTool(
      "get_observability_telemetry",
      {
        componentId: "node-ingress",
        includeTraces: true,
        includeLogs: true,
      },
      {
        nodes: sampleNodes,
        edges: sampleEdges,
        architectureId: "arch-integration",
        projectId: "proj-test",
        graphRevision: "rev-1",
      }
    );

    expect(output).toBeDefined();
    expect(output.error).toBeUndefined();
    expect(output.success).toBe(true);
    expect((output.result as any).componentId).toBe("node-ingress");
    expect((output.result as any).healthState).toBeDefined();
    expect((output.result as any).observedMetrics).toBeDefined();
  });

  it("generates observability report section and exports to Markdown and HTML", () => {
    const sections = SectionComposer.composeSections({
      nodes: sampleNodes,
      edges: sampleEdges,
      topology: SourceResolver.resolveTopology(sampleNodes, sampleEdges),
      evidence: [],
      analysisContext: {
        observability: {
          sourceName: "Production Prometheus & Jaeger",
          healthIndicators: {
            "node-ingress": {
              componentId: "node-ingress",
              serviceName: "API Gateway",
              state: "healthy",
              freshnessStatus: "fresh",
              metrics: { rps: 1200, p95LatencyMs: 24, errorRatePct: 0.02 },
              reasons: ["Operating normally"],
            },
            "node-orders": {
              componentId: "node-orders",
              serviceName: "Order Service",
              state: "degraded",
              freshnessStatus: "fresh",
              metrics: { rps: 850, p95LatencyMs: 380, errorRatePct: 1.2 },
              reasons: ["Elevated latency"],
            },
          },
          driftFindings: [
            {
              id: "drift-1",
              type: "unmapped_dependency",
              severity: "high",
              title: "Unmapped Dependency",
              explanation: "Observed calls to external payment gateway",
              evidence: "order-service -> payment-gw",
              suggestedAction: "Model payment gateway node in architecture",
            },
          ],
          comparisons: [
            {
              componentId: "node-ingress",
              componentLabel: "API Gateway",
              observedRps: 1200,
              modeledRps: 1000,
              observedLatencyP95Ms: 24,
              modeledLatencyP95Ms: 20,
              modeledBottleneck: false,
              observedSaturation: false,
              calibrationSuggestions: [],
            },
          ],
        },
      },
      audience: "architecture_review",
      enabledKinds: ["overview", "observability"],
    });

    const obsSection = sections.find((s) => s.kind === "observability");
    expect(obsSection).toBeDefined();
    if (obsSection && obsSection.kind === "observability") {
      expect(obsSection.content.healthyCount).toBe(1);
      expect(obsSection.content.degradedCount).toBe(1);
      expect(obsSection.content.topologyDriftCount).toBe(1);
    }

    const mockReport: ArchitectureReport = {
      id: "rep-obs-1",
      projectId: "proj-integration",
      architectureId: "arch-integration",
      sourceSnapshotId: "snap-1",
      graphRevision: "rev-1",
      templateId: "tpl-tech",
      templateVersion: 1,
      audience: "architecture_review",
      title: "Observability Evaluation Report",
      status: "verified",
      sections,
      evidence: [],
      assumptions: [],
      decisions: [],
      generatedAt: new Date().toISOString(),
      author: "Architect",
      versionNumber: 1,
    };

    const mdResult = MarkdownExporter.export(mockReport);
    expect(mdResult.content).toContain("Architecture Observability & Telemetry Mapping");
    expect(mdResult.content).toContain("Production Prometheus & Jaeger");
    expect(mdResult.content).toContain("Observed vs Modeled Telemetry Comparison");

    const htmlResult = HtmlExporter.export(mockReport);
    expect(htmlResult.content).toContain("Architecture Observability &amp; Telemetry Mapping");
    expect(htmlResult.content).toContain("Production Prometheus &amp; Jaeger");
    expect(htmlResult.content).toContain("Telemetry Source:");
  });
});
