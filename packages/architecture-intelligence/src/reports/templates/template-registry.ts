import type { ReportAudience, ReportSectionKind, ReportTemplate } from "../contracts/report.types";
import { ReportTemplateSchema } from "../schemas/report.schemas";
import { DEFAULT_REPORT_TEMPLATES } from "./default-templates";

export class ReportTemplateRegistry {
  private templates: Map<string, ReportTemplate> = new Map();

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults(): void {
    this.templates.clear();
    for (const [id, template] of Object.entries(DEFAULT_REPORT_TEMPLATES)) {
      this.templates.set(id, { ...template });
    }
  }

  public registerTemplate(template: ReportTemplate): void {
    const validated = ReportTemplateSchema.parse(template);
    this.templates.set(validated.id, validated);
  }

  public getTemplate(id: string): ReportTemplate | undefined {
    return this.templates.get(id);
  }

  public getAllTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplatesForAudience(audience: ReportAudience): ReportTemplate[] {
    return this.getAllTemplates().filter(
      (t) => t.intendedAudience === audience || t.id === "custom_report"
    );
  }

  public resolveSectionKinds(
    templateId: string,
    customKinds?: ReportSectionKind[]
  ): ReportSectionKind[] {
    const template = this.getTemplate(templateId);
    if (!template) {
      return customKinds ?? ["overview", "diagram", "components"];
    }

    if (!customKinds || customKinds.length === 0) {
      return [...template.defaultSectionOrder];
    }

    // Ensure all required sections are present
    const resolved = new Set<ReportSectionKind>(template.requiredSections);
    for (const kind of customKinds) {
      resolved.add(kind);
    }

    // Order according to defaultSectionOrder if known, otherwise append
    const orderMap = new Map<ReportSectionKind, number>();
    template.defaultSectionOrder.forEach((k, idx) => orderMap.set(k, idx));

    return Array.from(resolved).sort((a, b) => {
      const idxA = orderMap.has(a) ? orderMap.get(a)! : 999;
      const idxB = orderMap.has(b) ? orderMap.get(b)! : 999;
      return idxA - idxB;
    });
  }
}

export const reportTemplateRegistry = new ReportTemplateRegistry();
