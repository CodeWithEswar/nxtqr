import type { ArchitectureReport, ReportVersion } from "../contracts/report.types";
import type {
  GenerateReportInput,
  RegenerateReportInput,
  ReportValidationResult,
} from "../contracts/engine.types";
import { reportTemplateRegistry } from "../templates/template-registry";
import { SourceResolver } from "./source-resolver";
import { EvidenceCollector } from "./evidence-collector";
import { SectionComposer } from "./section-composer";
import { ReportValidator } from "./report-validator";

export class ArchitectureReportEngine {
  private cache: Map<string, ArchitectureReport> = new Map();
  private maxCacheSize: number = 50;

  public generateReport(input: GenerateReportInput): ArchitectureReport {
    const templateId = input.templateId || "detailed_technical_architecture";
    const template = reportTemplateRegistry.getTemplate(templateId);

    const audience = input.audience || template?.intendedAudience || "engineering";
    const graphRevision = input.graphRevision || "rev-1";
    const reportId = input.id || `rep-${input.architectureId}-${Date.now().toString(36)}`;
    const sourceSnapshotId = input.sourceSnapshotId || `snap-${graphRevision}`;

    // Cache key for identical graph topology + template + audience
    const cacheKey = `${input.architectureId}:${graphRevision}:${templateId}:${audience}:${input.nodes.length}:${input.edges.length}`;
    if (this.cache.has(cacheKey) && !input.analysisContext && !input.decisions) {
      return this.cache.get(cacheKey)!;
    }

    const topology = SourceResolver.resolveTopology(input.nodes, input.edges);
    const adrs = input.decisions || [];
    const evidence = EvidenceCollector.collectEvidence(
      input.nodes,
      input.edges,
      input.analysisContext,
      adrs
    );

    const sectionKinds = reportTemplateRegistry.resolveSectionKinds(
      templateId,
      input.enabledSections
    );

    const sections = SectionComposer.composeSections({
      nodes: input.nodes,
      edges: input.edges,
      topology,
      evidence,
      analysisContext: input.analysisContext,
      adrs,
      audience,
      enabledKinds: sectionKinds,
      options: {
        title: input.title,
        subtitle: input.subtitle,
        diagramSvg: input.diagramSvg,
        assumptions: input.assumptions,
      },
    });

    const report: ArchitectureReport = {
      id: reportId,
      projectId: input.projectId,
      architectureId: input.architectureId,
      sourceSnapshotId,
      graphRevision,
      templateId,
      templateVersion: template?.version || 1,
      audience,
      title: input.title || (template ? template.name : "Architecture Technical Report"),
      subtitle: input.subtitle,
      status: "draft",
      sections,
      evidence,
      assumptions: input.assumptions || [
        "Infrastructure components run within VPC subnet boundaries.",
        "Persistent storage services provide at least 99.99% availability SLAs.",
      ],
      decisions: adrs,
      generatedAt: new Date().toISOString(),
      author: input.author || "NXTQR Architecture Engine",
      versionNumber: input.versionNumber || 1,
    };

    // Store in LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, report);

    return report;
  }

  public validateReport(report: ArchitectureReport): ReportValidationResult {
    return ReportValidator.validateReport(report);
  }

  public regenerateReport(input: RegenerateReportInput): {
    report: ArchitectureReport;
    version: ReportVersion;
  } {
    const { existingReport, nodes, edges, newRevision, changeSummary, updatedAnalysisContext } =
      input;

    const previousVersion: ReportVersion = {
      id: `ver-${existingReport.id}-${existingReport.versionNumber}`,
      reportId: existingReport.id,
      versionNumber: existingReport.versionNumber,
      graphRevision: existingReport.graphRevision,
      sourceSnapshotId: existingReport.sourceSnapshotId,
      title: existingReport.title,
      templateId: existingReport.templateId,
      audience: existingReport.audience,
      sectionCount: existingReport.sections.length,
      generatedAt: existingReport.generatedAt,
      author: existingReport.author,
      changeSummary: changeSummary || "Automated regeneration on topology revision.",
    };

    const nextVersionNumber = existingReport.versionNumber + 1;
    const nextRevision = newRevision || `${existingReport.graphRevision}-r${nextVersionNumber}`;

    const newReport = this.generateReport({
      id: existingReport.id,
      projectId: existingReport.projectId,
      architectureId: existingReport.architectureId,
      sourceSnapshotId: `snap-${nextRevision}`,
      graphRevision: nextRevision,
      title: existingReport.title,
      subtitle: existingReport.subtitle,
      templateId: existingReport.templateId,
      audience: existingReport.audience,
      author: existingReport.author,
      nodes,
      edges,
      decisions: existingReport.decisions,
      assumptions: existingReport.assumptions,
      enabledSections: existingReport.sections.filter((s) => s.isEnabled).map((s) => s.kind),
      analysisContext: updatedAnalysisContext,
      versionNumber: nextVersionNumber,
    });

    return {
      report: newReport,
      version: previousVersion,
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const architectureReportEngine = new ArchitectureReportEngine();
