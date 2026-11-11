import type { ArchitectureReport } from "../contracts/report.types";
import type { ReportExportOptions, ReportExportResult } from "../contracts/export.types";

export class DocxExporter {
  public static export(report: ArchitectureReport, _options?: Partial<ReportExportOptions>): ReportExportResult {
    // Generate WordprocessingML compatible XML document
    const escapeXml = (str: string): string =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const sectionsXml: string[] = [];

    for (const section of report.sections.filter((s) => s.isEnabled)) {
      sectionsXml.push(`
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>${escapeXml(section.title)}</w:t></w:r>
        </w:p>
      `);

      if (section.description) {
        sectionsXml.push(`
          <w:p>
            <w:r><w:rPr><w:i/></w:rPr><w:t>${escapeXml(section.description)}</w:t></w:r>
          </w:p>
        `);
      }

      switch (section.kind) {
        case "overview": {
          sectionsXml.push(`
            <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>System Purpose:</w:t></w:r></w:p>
            <w:p><w:r><w:t>${escapeXml(section.content.primaryPurpose)}</w:t></w:r></w:p>
          `);
          break;
        }

        case "components": {
          sectionsXml.push(`
            <w:p><w:r><w:t>Total Components: ${section.content.totalComponents}</w:t></w:r></w:p>
          `);
          for (const comp of section.content.components) {
            sectionsXml.push(`
              <w:p>
                <w:r><w:rPr><w:b/></w:rPr><w:t>• ${escapeXml(comp.label)} </w:t></w:r>
                <w:r><w:t>(${escapeXml(comp.type)}, ${escapeXml(comp.category)}, Replicas: ${comp.replicas})</w:t></w:r>
              </w:p>
            `);
          }
          break;
        }

        case "adrs": {
          for (const adr of section.content.adrs) {
            sectionsXml.push(`
              <w:p>
                <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
                <w:r><w:t>ADR-${String(adr.decisionNumber).padStart(4, "0")}: ${escapeXml(adr.title)}</w:t></w:r>
              </w:p>
              <w:p><w:r><w:t>Status: ${escapeXml(adr.status.toUpperCase())} | Date: ${escapeXml(adr.date)}</w:t></w:r></w:p>
              <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Decision: </w:t></w:r><w:r><w:t>${escapeXml(adr.decision)}</w:t></w:r></w:p>
            `);
          }
          break;
        }

        default: {
          sectionsXml.push(`
            <w:p><w:r><w:t>[Section: ${escapeXml(section.kind)}]</w:t></w:r></w:p>
          `);
          break;
        }
      }
    }

    const docxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/></w:pPr>
      <w:r><w:t>${escapeXml(report.title)}</w:t></w:r>
    </w:p>
    ${
      report.subtitle
        ? `
    <w:p>
      <w:pPr><w:pStyle w:val="Subtitle"/></w:pPr>
      <w:r><w:t>${escapeXml(report.subtitle)}</w:t></w:r>
    </w:p>
    `
        : ""
    }
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Audience: ${escapeXml(report.audience)} | Revision: ${escapeXml(report.graphRevision)} | Version: ${report.versionNumber}</w:t></w:r>
    </w:p>
    ${sectionsXml.join("\n")}
  </w:body>
</w:document>`;

    const filename = `${report.architectureId}-report-v${report.versionNumber}.docx`;

    return {
      format: "docx",
      content: docxXml,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      filename,
      byteSize: Buffer.byteLength(docxXml, "utf8"),
      generatedAt: new Date().toISOString(),
    };
  }
}
