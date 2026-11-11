import type { ArchitectureReport } from "../contracts/report.types";
import type { ReportExportOptions, ReportExportResult } from "../contracts/export.types";
import { ArchitectureReportSchema } from "../schemas/report.schemas";

export class JsonExporter {
  public static export(report: ArchitectureReport, _options?: Partial<ReportExportOptions>): ReportExportResult {
    // Validate report object against schema
    const validated = ArchitectureReportSchema.parse(report);
    const jsonString = JSON.stringify(validated, null, 2);
    const filename = `${report.architectureId}-report-v${report.versionNumber}.json`;

    return {
      format: "json",
      content: jsonString,
      mimeType: "application/json",
      filename,
      byteSize: Buffer.byteLength(jsonString, "utf8"),
      generatedAt: new Date().toISOString(),
    };
  }
}
