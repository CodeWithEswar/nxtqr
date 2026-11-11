import type { ArchitectureReport } from "../contracts/report.types";
import type { ReportExportOptions, ReportExportResult } from "../contracts/export.types";
import { MarkdownExporter } from "./markdown-exporter";
import { HtmlExporter } from "./html-exporter";
import { JsonExporter } from "./json-exporter";
import { PdfExporter } from "./pdf-exporter";
import { DocxExporter } from "./docx-exporter";

export * from "./markdown-exporter";
export * from "./html-exporter";
export * from "./json-exporter";
export * from "./pdf-exporter";
export * from "./docx-exporter";

export class ReportExportCoordinator {
  public static exportReport(
    report: ArchitectureReport,
    options: ReportExportOptions
  ): ReportExportResult {
    switch (options.format) {
      case "markdown":
        return MarkdownExporter.export(report, options);
      case "html":
        return HtmlExporter.export(report, options);
      case "json":
        return JsonExporter.export(report, options);
      case "pdf":
        return PdfExporter.export(report, options);
      case "docx":
        return DocxExporter.export(report, options);
      default:
        throw new Error(`Unsupported report export format: ${(options as any).format}`);
    }
  }
}
