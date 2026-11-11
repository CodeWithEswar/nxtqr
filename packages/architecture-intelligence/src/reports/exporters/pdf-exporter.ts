import type { ArchitectureReport } from "../contracts/report.types";
import type { ReportExportOptions, ReportExportResult } from "../contracts/export.types";
import { HtmlExporter } from "./html-exporter";

export class PdfExporter {
  public static export(report: ArchitectureReport, options?: Partial<ReportExportOptions>): ReportExportResult {
    const pageSize = options?.pageSize || "a4";
    const orientation = options?.orientation || "portrait";
    const watermark = options?.customWatermark;
    const includeCover = options?.includeCoverPage ?? true;

    // Generate base print-ready HTML
    const htmlExport = HtmlExporter.export(report, {
      ...options,
      theme: "print",
    });

    // Inject PDF @page CSS layout and pagination rules
    const pdfStyles = `
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: 18mm 15mm 20mm 15mm;
      @top-right {
        content: "${report.title.replace(/"/g, '\\"')}";
        font-family: Geist Sans, sans-serif;
        font-size: 8pt;
        color: #888888;
      }
      @bottom-left {
        content: "NXTQR Architecture Studio — Confidential";
        font-family: Geist Sans, sans-serif;
        font-size: 8pt;
        color: #888888;
      }
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: Geist Mono, monospace;
        font-size: 8pt;
        color: #888888;
      }
    }
    ${
      watermark
        ? `
    body::before {
      content: "${watermark.replace(/"/g, '\\"')}";
      position: fixed;
      top: 45%;
      left: 15%;
      font-size: 54pt;
      font-weight: 800;
      color: rgba(200, 200, 200, 0.15);
      transform: rotate(-35deg);
      pointer-events: none;
      z-index: 9999;
    }
    `
        : ""
    }
    ${
      includeCover
        ? `
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      page-break-after: always;
      break-after: page;
      padding: 60px 40px;
    }
    .cover-title { font-size: 34pt; font-weight: 800; line-height: 1.2; margin-bottom: 12pt; }
    .cover-subtitle { font-size: 16pt; color: #555555; margin-bottom: 40pt; }
    .cover-meta { font-size: 11pt; color: #777777; border-top: 2pt solid #222222; padding-top: 16pt; }
    `
        : ""
    }
    .report-section {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: 24pt;
    }
    .report-table {
      page-break-inside: auto;
    }
    .report-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
`;

    let finalHtml = htmlExport.content.replace("</head>", `${pdfStyles}\n</head>`);

    if (includeCover) {
      const coverHtml = `
  <div class="cover-page">
    <div class="cover-title">${report.title}</div>
    ${report.subtitle ? `<div class="cover-subtitle">${report.subtitle}</div>` : ""}
    <div class="cover-meta">
      <p><strong>System ID:</strong> ${report.architectureId}</p>
      <p><strong>Target Audience:</strong> ${report.audience}</p>
      <p><strong>Graph Revision:</strong> ${report.graphRevision}</p>
      <p><strong>Report Version:</strong> ${report.versionNumber}</p>
      <p><strong>Author:</strong> ${report.author}</p>
      <p><strong>Date:</strong> ${report.generatedAt.split("T")[0]}</p>
    </div>
  </div>
`;
      finalHtml = finalHtml.replace("<body>", `<body>\n${coverHtml}`);
    }

    const filename = `${report.architectureId}-report-v${report.versionNumber}.pdf`;

    return {
      format: "pdf",
      content: finalHtml,
      mimeType: "application/pdf",
      filename,
      byteSize: Buffer.byteLength(finalHtml, "utf8"),
      generatedAt: new Date().toISOString(),
    };
  }
}
