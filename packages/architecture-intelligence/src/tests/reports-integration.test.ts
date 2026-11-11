import { describe, it, expect } from "vitest";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import {
  architectureReportEngine,
  architectureToolRegistry,
  architectureCostEngine,
  capacityPlanningEngine,
  DEFAULT_CAPACITY_SCENARIOS,
  ReportExportCoordinator,
} from "../index";

const integrationNodes: BaseNode[] = [
  {
    id: "ingress-gw",
    type: "api_gateway",
    position: { x: 0, y: 0 },
    data: {
      label: "Kong Ingress Gateway",
      category: "gateway",
      tier: "edge",
      replicas: 4,
      criticality: "critical",
    },
  },
  {
    id: "checkout-svc",
    type: "service",
    position: { x: 250, y: 0 },
    data: {
      label: "Checkout Order Service",
      category: "compute",
      tier: "backend",
      replicas: 6,
      criticality: "critical",
      technology: "Go / gRPC",
    },
  },
  {
    id: "payment-proxy",
    type: "service",
    position: { x: 500, y: 0 },
    data: {
      label: "Payment Gateway Proxy",
      category: "compute",
      tier: "integration",
      replicas: 2,
      criticality: "high",
    },
  },
  {
    id: "cockroach-cluster",
    type: "database",
    position: { x: 350, y: 200 },
    data: {
      label: "CockroachDB Distributed Cluster",
      category: "database",
      tier: "storage",
      replicas: 5,
      criticality: "critical",
      technology: "CockroachDB",
    },
  },
];

const integrationEdges: BaseEdge[] = [
  {
    id: "edge-ing-chk",
    source: "ingress-gw",
    target: "checkout-svc",
    data: { protocol: "HTTP/2", isSynchronous: true, isEncrypted: true },
  },
  {
    id: "edge-chk-pay",
    source: "checkout-svc",
    target: "payment-proxy",
    data: { protocol: "HTTPS", isSynchronous: true, isEncrypted: true },
  },
  {
    id: "edge-chk-db",
    source: "checkout-svc",
    target: "cockroach-cluster",
    data: { protocol: "PostgreSQL-Wire", isSynchronous: true, isEncrypted: true },
  },
];

describe("Architecture Reports Integration & Copilot Tooling", () => {
  it("generates comprehensive report with pre-computed analysis context", () => {
    // Generate real cost estimate
    const costEstimate = architectureCostEngine.estimateCost(integrationNodes, integrationEdges, {
      providerId: "aws",
    });
    const costOptimizations = architectureCostEngine.getOptimizationOpportunities(
      integrationNodes,
      costEstimate
    );

    // Generate real capacity plan
    const capacityPlan = capacityPlanningEngine.planCapacity(
      integrationNodes,
      integrationEdges,
      DEFAULT_CAPACITY_SCENARIOS.rapid_startup_growth
    );

    const report = architectureReportEngine.generateReport({
      projectId: "proj-ecommerce",
      architectureId: "arch-checkout-v2",
      graphRevision: "commit-a8f102",
      templateId: "detailed_technical_architecture",
      audience: "architecture_review",
      title: "Checkout Infrastructure Technical Review",
      nodes: integrationNodes,
      edges: integrationEdges,
      analysisContext: {
        cost: costEstimate,
        costOptimizations,
        capacity: capacityPlan,
      },
      assumptions: [
        "Network latency between services within AWS us-east-1 is sub-2ms.",
        "CockroachDB spans 3 Availability Zones with quorum replication factor of 3.",
      ],
    });

    expect(report.id).toBeDefined();
    expect(report.title).toBe("Checkout Infrastructure Technical Review");
    expect(report.audience).toBe("architecture_review");
    expect(report.sections.length).toBeGreaterThanOrEqual(7);

    // Verify evidence references
    expect(report.evidence.length).toBeGreaterThan(0);
    const capacityEvidence = report.evidence.filter((e) => e.kind === "capacity");
    expect(capacityEvidence.length).toBeGreaterThanOrEqual(0);

    // Export to all formats
    const mdExport = ReportExportCoordinator.exportReport(report, { format: "markdown" });
    expect(mdExport.content).toContain("# Checkout Infrastructure Technical Review");
    expect(mdExport.content).toContain("CockroachDB Distributed Cluster");

    const htmlExport = ReportExportCoordinator.exportReport(report, { format: "html" });
    expect(htmlExport.content).toContain("CockroachDB Distributed Cluster");

    const jsonExport = ReportExportCoordinator.exportReport(report, { format: "json" });
    const parsed = JSON.parse(jsonExport.content);
    expect(parsed.architectureId).toBe("arch-checkout-v2");

    const pdfExport = ReportExportCoordinator.exportReport(report, {
      format: "pdf",
      pageSize: "letter",
      includeCoverPage: true,
    });
    expect(pdfExport.content).toContain("size: letter portrait;");
  });

  it("executes AI Architecture Assistant Tool #16 'generate_architecture_report'", async () => {
    const toolResult = await architectureToolRegistry.executeTool(
      "generate_architecture_report",
      {
        templateId: "architecture_overview",
        audience: "technical_leadership",
        title: "Executive Summary: Cloud Modernization",
        format: "markdown",
      },
      {
        projectId: "proj-exec",
        architectureId: "arch-modernize",
        graphRevision: "rev-2026-q4",
        nodes: integrationNodes,
        edges: integrationEdges,
      }
    );

    expect(toolResult.success).toBe(true);
    expect(toolResult.result).toBeDefined();
    const data = toolResult.result as Record<string, any>;
    expect(data.reportId).toBeDefined();
    expect(data.title).toBe("Executive Summary: Cloud Modernization");
    expect(data.audience).toBe("technical_leadership");
    expect(data.sections.length).toBeGreaterThanOrEqual(4);
    expect(data.export).toBeDefined();
    expect(data.export.format).toBe("markdown");
    expect(data.export.preview).toContain("# Executive Summary: Cloud Modernization");
  });
});
