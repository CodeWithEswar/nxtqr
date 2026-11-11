import { describe, it, expect } from "vitest";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import {
  architectureReportEngine,
  reportTemplateRegistry,
  ADRManager,
  ReportExportCoordinator,
  MarkdownExporter,
  HtmlExporter,
  JsonExporter,
  PdfExporter,
  DocxExporter,
  DEFAULT_REPORT_TEMPLATES,
} from "../index";

const mockNodes: BaseNode[] = [
  {
    id: "edge-api",
    type: "api_gateway",
    position: { x: 0, y: 0 },
    data: {
      label: "Edge API Gateway",
      category: "gateway",
      tier: "edge",
      replicas: 3,
      criticality: "critical",
    },
  },
  {
    id: "auth-svc",
    type: "service",
    position: { x: 200, y: 0 },
    data: {
      label: "Auth Service",
      category: "compute",
      tier: "backend",
      replicas: 2,
      criticality: "high",
      technology: "Go",
    },
  },
  {
    id: "order-db",
    type: "database",
    position: { x: 400, y: 0 },
    data: {
      label: "Orders Aurora PostgreSQL",
      category: "database",
      tier: "storage",
      replicas: 2,
      criticality: "critical",
      technology: "PostgreSQL",
    },
  },
];

const mockEdges: BaseEdge[] = [
  {
    id: "e-api-auth",
    source: "edge-api",
    target: "auth-svc",
    data: {
      protocol: "gRPC",
      isSynchronous: true,
      isEncrypted: true,
    },
  },
  {
    id: "e-auth-db",
    source: "auth-svc",
    target: "order-db",
    data: {
      protocol: "PostgreSQL",
      isSynchronous: true,
      isEncrypted: true,
    },
  },
];

describe("Phase 05.3.12: Architecture Reports & Documentation Generator", () => {
  describe("ReportTemplateRegistry", () => {
    it("initializes with 9 default versioned templates", () => {
      const templates = reportTemplateRegistry.getAllTemplates();
      expect(templates.length).toBe(9);
      expect(Object.keys(DEFAULT_REPORT_TEMPLATES)).toContain("architecture_overview");
      expect(Object.keys(DEFAULT_REPORT_TEMPLATES)).toContain("detailed_technical_architecture");
      expect(Object.keys(DEFAULT_REPORT_TEMPLATES)).toContain("security_architecture_review");
    });

    it("filters templates by audience", () => {
      const execTemplates = reportTemplateRegistry.getTemplatesForAudience("executive_overview");
      expect(execTemplates.length).toBeGreaterThan(0);
      expect(execTemplates.some((t) => t.id === "architecture_overview" || t.id === "custom_report")).toBe(true);
    });

    it("resolves sections ensuring required sections are always included", () => {
      const resolved = reportTemplateRegistry.resolveSectionKinds("architecture_overview", ["cost"]);
      // required: overview, diagram, components, recommendations
      expect(resolved).toContain("overview");
      expect(resolved).toContain("diagram");
      expect(resolved).toContain("components");
      expect(resolved).toContain("recommendations");
      expect(resolved).toContain("cost");
    });
  });

  describe("ADRManager", () => {
    it("creates, retrieves, and lists ADRs in order", () => {
      const manager = new ADRManager();
      const adr1 = manager.createADR({
        title: "Use gRPC for Internal Microservices",
        status: "accepted",
        context: "High-throughput inter-service communication needed.",
        decision: "Adopt gRPC with Protocol Buffers.",
        consequences: {
          positive: ["Low latency", "Strong typing"],
          negative: ["Debugging complexity"],
        },
        alternativesConsidered: [
          {
            title: "REST with JSON",
            description: "Standard HTTP endpoints",
            reasonRejected: "Payload parsing overhead too high",
          },
        ],
        relatedComponentIds: ["edge-api", "auth-svc"],
        relatedFindingIds: [],
        author: "Lead Architect",
      });

      expect(adr1.decisionNumber).toBe(1);
      expect(manager.getAllADRs().length).toBe(1);
      expect(manager.getADR(adr1.id)).toBeDefined();
    });

    it("handles superseding an existing ADR", () => {
      const manager = new ADRManager();
      const adr1 = manager.createADR({
        title: "Use REST with JSON",
        status: "accepted",
        context: "Rapid prototype stage.",
        decision: "Use REST over HTTP/1.1",
        consequences: { positive: ["Fast dev"], negative: ["High overhead"] },
        alternativesConsidered: [],
        relatedComponentIds: [],
        relatedFindingIds: [],
        author: "Dev",
      });

      const { superseded, successor } = manager.supersedeADR(adr1.id, {
        title: "Migrate from REST to gRPC",
        status: "accepted",
        context: "Production throughput limits hit.",
        decision: "Migrate to gRPC.",
        consequences: { positive: ["10x speed"], negative: ["Migration effort"] },
        alternativesConsidered: [],
        relatedComponentIds: [],
        relatedFindingIds: [],
        author: "Lead Architect",
      });

      expect(superseded.status).toBe("superseded");
      expect(superseded.supersededBy).toBe(successor.id);
      expect(successor.supersedes).toBe(superseded.id);
      expect(successor.decisionNumber).toBe(2);
    });

    it("renders ADR to clean markdown", () => {
      const manager = new ADRManager();
      const adr = manager.createADR({
        title: "PostgreSQL for Primary Store",
        status: "accepted",
        context: "ACID compliance needed for financial checkout.",
        decision: "Deploy Aurora PostgreSQL multi-AZ.",
        consequences: { positive: ["Full ACID guarantee"], negative: ["Stateful scaling"] },
        alternativesConsidered: [],
        relatedComponentIds: ["order-db"],
        relatedFindingIds: [],
        author: "Data Architect",
      });

      const md = manager.toMarkdown(adr);
      expect(md).toContain("# ADR-0001: PostgreSQL for Primary Store");
      expect(md).toContain("**Status:** ACCEPTED");
      expect(md).toContain("## Decision");
      expect(md).toContain("Aurora PostgreSQL multi-AZ");
    });
  });

  describe("ArchitectureReportEngine", () => {
    it("generates an evidence-backed report with all required sections", () => {
      const report = architectureReportEngine.generateReport({
        projectId: "proj-1",
        architectureId: "arch-test",
        graphRevision: "rev-1",
        templateId: "architecture_overview",
        audience: "technical_leadership",
        nodes: mockNodes,
        edges: mockEdges,
      });

      expect(report.id).toBeDefined();
      expect(report.title).toBe("Architecture Overview");
      expect(report.sections.length).toBeGreaterThanOrEqual(4);
      expect(report.evidence.length).toBeGreaterThan(0);

      const validation = architectureReportEngine.validateReport(report);
      expect(validation.isValid).toBe(true);
      expect(validation.issues.filter((i) => i.severity === "error").length).toBe(0);
    });

    it("regenerates report and tracks historical version snapshots", () => {
      const initialReport = architectureReportEngine.generateReport({
        projectId: "proj-1",
        architectureId: "arch-test",
        graphRevision: "rev-1",
        nodes: mockNodes,
        edges: mockEdges,
      });

      expect(initialReport.versionNumber).toBe(1);

      const { report: regeneratedReport, version: previousVersion } =
        architectureReportEngine.regenerateReport({
          existingReport: initialReport,
          nodes: [
            ...mockNodes,
            {
              id: "cache-redis",
              type: "cache",
              position: { x: 300, y: 100 },
              data: { label: "Redis Cache", category: "cache", replicas: 1 },
            },
          ],
          edges: mockEdges,
          newRevision: "rev-2",
          changeSummary: "Added Redis Cache layer.",
        });

      expect(regeneratedReport.versionNumber).toBe(2);
      expect(regeneratedReport.graphRevision).toBe("rev-2");
      expect(previousVersion.versionNumber).toBe(1);
      expect(previousVersion.changeSummary).toBe("Added Redis Cache layer.");
    });
  });

  describe("Multi-Format Exporters", () => {
    const report = architectureReportEngine.generateReport({
      projectId: "proj-1",
      architectureId: "arch-multi",
      graphRevision: "rev-1",
      templateId: "detailed_technical_architecture",
      audience: "engineering",
      nodes: mockNodes,
      edges: mockEdges,
    });

    it("exports valid Markdown (GFM)", () => {
      const result = MarkdownExporter.export(report, { includeTableOfContents: true });
      expect(result.format).toBe("markdown");
      expect(result.mimeType).toBe("text/markdown");
      expect(result.content).toContain("# Detailed Technical Architecture");
      expect(result.content).toContain("## Table of Contents");
      expect(result.content).toContain("| Component | Type |");
      expect(result.byteSize).toBeGreaterThan(0);
    });

    it("exports valid Standalone HTML with Pure Black style and print CSS", () => {
      const result = HtmlExporter.export(report);
      expect(result.format).toBe("html");
      expect(result.mimeType).toBe("text/html");
      expect(result.content).toContain("<!DOCTYPE html>");
      expect(result.content).toContain("Detailed Technical Architecture");
      expect(result.content).toContain("@media print");
      expect(result.content).toContain("--bg: #000000");
    });

    it("exports validated JSON", () => {
      const result = JsonExporter.export(report);
      expect(result.format).toBe("json");
      expect(result.mimeType).toBe("application/json");
      const parsed = JSON.parse(result.content);
      expect(parsed.id).toBe(report.id);
      expect(parsed.sections.length).toBe(report.sections.length);
    });

    it("exports PDF-ready document with cover page and page geometry rules", () => {
      const result = PdfExporter.export(report, {
        pageSize: "a4",
        orientation: "portrait",
        includeCoverPage: true,
        customWatermark: "DRAFT ARCHITECTURE",
      });
      expect(result.format).toBe("pdf");
      expect(result.mimeType).toBe("application/pdf");
      expect(result.content).toContain("@page {");
      expect(result.content).toContain("size: a4 portrait;");
      expect(result.content).toContain("cover-page");
      expect(result.content).toContain("DRAFT ARCHITECTURE");
    });

    it("exports DOCX XML document model", () => {
      const result = DocxExporter.export(report);
      expect(result.format).toBe("docx");
      expect(result.mimeType).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      expect(result.content).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
      expect(result.content).toContain("<w:document");
      expect(result.content).toContain("Detailed Technical Architecture");
    });

    it("coordinates multi-format exports via ReportExportCoordinator", () => {
      const formats = ["markdown", "html", "json", "pdf", "docx"] as const;
      for (const fmt of formats) {
        const res = ReportExportCoordinator.exportReport(report, { format: fmt });
        expect(res.format).toBe(fmt);
        expect(res.byteSize).toBeGreaterThan(0);
      }
    });
  });
});
