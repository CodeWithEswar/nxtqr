import type { ArchitectureReport } from "../contracts/report.types";
import type { ReportValidationIssue, ReportValidationResult } from "../contracts/engine.types";
import { reportTemplateRegistry } from "../templates/template-registry";
import { ArchitectureReportSchema } from "../schemas/report.schemas";

export class ReportValidator {
  public static validateReport(report: ArchitectureReport): ReportValidationResult {
    const issues: ReportValidationIssue[] = [];

    // 1. Zod schema validation
    const parseResult = ArchitectureReportSchema.safeParse(report);
    if (!parseResult.success) {
      for (const err of parseResult.error.errors) {
        issues.push({
          code: "SCHEMA_VALIDATION_ERROR",
          message: `${err.path.join(".")}: ${err.message}`,
          severity: "error",
        });
      }
    }

    // 2. Template required sections check
    const template = reportTemplateRegistry.getTemplate(report.templateId);
    if (template) {
      const presentKinds = new Set(report.sections.filter((s) => s.isEnabled).map((s) => s.kind));
      for (const requiredKind of template.requiredSections) {
        if (!presentKinds.has(requiredKind)) {
          issues.push({
            code: "MISSING_REQUIRED_SECTION",
            message: `Template '${template.name}' requires section kind '${requiredKind}', but it is missing or disabled.`,
            severity: "error",
            sectionKind: requiredKind,
          });
        }
      }
    } else {
      issues.push({
        code: "UNKNOWN_TEMPLATE",
        message: `Report references unknown template ID '${report.templateId}'.`,
        severity: "warning",
      });
    }

    // 3. Evidence citation integrity
    const knownEvidenceIds = new Set(report.evidence.map((e) => e.id));
    for (const section of report.sections) {
      if (section.evidenceIds) {
        for (const evId of section.evidenceIds) {
          if (!knownEvidenceIds.has(evId)) {
            issues.push({
              code: "UNRESOLVED_EVIDENCE_CITATION",
              message: `Section '${section.title}' cites evidence ID '${evId}' which is not present in report evidence index.`,
              severity: "warning",
              sectionId: section.id,
              sectionKind: section.kind,
            });
          }
        }
      }
    }

    // 4. Section specific validations
    for (const section of report.sections) {
      if (!section.isEnabled) continue;

      if (!section.title || section.title.trim().length === 0) {
        issues.push({
          code: "EMPTY_SECTION_TITLE",
          message: `Section ID '${section.id}' has an empty title.`,
          severity: "error",
          sectionId: section.id,
          sectionKind: section.kind,
        });
      }

      switch (section.kind) {
        case "overview": {
          if (!section.content.systemName) {
            issues.push({
              code: "INVALID_OVERVIEW_CONTENT",
              message: "Overview section must define a system name.",
              severity: "error",
              sectionId: section.id,
            });
          }
          break;
        }
        case "capacity": {
          if (section.content.baselineRps < 0 || section.content.projectedPeakRps < 0) {
            issues.push({
              code: "INVALID_CAPACITY_NUMBERS",
              message: "Capacity section RPS numbers must be non-negative.",
              severity: "error",
              sectionId: section.id,
            });
          }
          break;
        }
        case "cost": {
          if (!section.content.totalMonthlyCost.startsWith("$")) {
            issues.push({
              code: "INVALID_COST_FORMAT",
              message: "Cost section monthly cost must be formatted with currency prefix.",
              severity: "warning",
              sectionId: section.id,
            });
          }
          break;
        }
      }
    }

    const isValid = !issues.some((issue) => issue.severity === "error");

    return {
      isValid,
      issues,
      checkedSectionsCount: report.sections.length,
      evidenceReferencesCount: report.evidence.length,
    };
  }
}
