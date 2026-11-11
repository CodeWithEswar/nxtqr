import { describe, it, expect } from "vitest";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import { architectureReportEngine, ReportExportCoordinator } from "../index";

function generateSyntheticTopology(nodeCount: number): { nodes: BaseNode[]; edges: BaseEdge[] } {
  const nodes: BaseNode[] = [];
  const edges: BaseEdge[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const category = i % 4 === 0 ? "gateway" : i % 4 === 1 ? "compute" : i % 4 === 2 ? "database" : "cache";
    nodes.push({
      id: `node-${i}`,
      type: category === "database" ? "database" : "service",
      position: { x: (i % 20) * 150, y: Math.floor(i / 20) * 100 },
      data: {
        label: `Service-Worker-${i}`,
        category,
        tier: category,
        replicas: (i % 3) + 1,
        criticality: i % 10 === 0 ? "critical" : "medium",
      },
    });

    if (i > 0) {
      edges.push({
        id: `edge-${i - 1}-${i}`,
        source: `node-${i - 1}`,
        target: `node-${i}`,
        data: {
          protocol: i % 2 === 0 ? "gRPC" : "HTTPS",
          isSynchronous: true,
          isEncrypted: true,
        },
      });
    }
  }

  return { nodes, edges };
}

describe("Architecture Reports Performance Benchmark", () => {
  it("generates 100-node technical architecture report in under 100ms", () => {
    const { nodes, edges } = generateSyntheticTopology(100);
    const start = performance.now();
    const report = architectureReportEngine.generateReport({
      projectId: "bench-100",
      architectureId: "arch-100",
      graphRevision: "bench-1",
      templateId: "detailed_technical_architecture",
      nodes,
      edges,
    });
    const duration = performance.now() - start;

    expect(report.sections.length).toBeGreaterThanOrEqual(5);
    expect(report.evidence.length).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(100);
  });

  it("generates and exports 500-node architecture report in under 200ms", () => {
    const { nodes, edges } = generateSyntheticTopology(500);
    const start = performance.now();
    const report = architectureReportEngine.generateReport({
      projectId: "bench-500",
      architectureId: "arch-500",
      graphRevision: "bench-1",
      templateId: "detailed_technical_architecture",
      nodes,
      edges,
    });

    const exportResult = ReportExportCoordinator.exportReport(report, { format: "markdown" });
    const duration = performance.now() - start;

    expect(exportResult.byteSize).toBeGreaterThan(10000);
    expect(duration).toBeLessThan(200);
  });

  it("generates 1,000-node architecture report in under 300ms", () => {
    const { nodes, edges } = generateSyntheticTopology(1000);
    const start = performance.now();
    const report = architectureReportEngine.generateReport({
      projectId: "bench-1000",
      architectureId: "arch-1000",
      graphRevision: "bench-1",
      templateId: "architecture_overview",
      nodes,
      edges,
    });
    const duration = performance.now() - start;

    expect(report.id).toBeDefined();
    expect(report.sections.length).toBeGreaterThanOrEqual(4);
    expect(duration).toBeLessThan(300);
  });
});
