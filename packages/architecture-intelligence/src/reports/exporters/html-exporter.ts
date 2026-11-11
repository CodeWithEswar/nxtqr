import type { ArchitectureReport } from "../contracts/report.types";
import type { ReportExportOptions, ReportExportResult } from "../contracts/export.types";

export class HtmlExporter {
  public static export(report: ArchitectureReport, options?: Partial<ReportExportOptions>): ReportExportResult {
    const isPrintTheme = options?.theme === "print";

    const escapeHtml = (str: string): string =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const sectionsHtml: string[] = [];

    for (const section of report.sections.filter((s) => s.isEnabled)) {
      let bodyHtml = "";

      switch (section.kind) {
        case "overview": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <h4>System Purpose</h4>
              <p>${escapeHtml(c.primaryPurpose)}</p>
            </div>
            <div class="field-group">
              <h4>Subsystems</h4>
              <ul>
                ${c.subsystems.map((s) => `<li><strong>${escapeHtml(s.name)}</strong> (${s.nodeCount} components): ${escapeHtml(s.description)}</li>`).join("")}
              </ul>
            </div>
            <div class="field-group">
              <h4>Assumptions</h4>
              <ul>
                ${c.keyAssumptions.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}
              </ul>
            </div>
          `;
          break;
        }

        case "diagram": {
          const c = section.content;
          bodyHtml = `
            <div class="diagram-container">
              ${c.svgContent}
            </div>
            <p class="caption">Rendered topology scope: ${c.scope} (${c.nodeCount} nodes, ${c.edgeCount} edges).</p>
          `;
          break;
        }

        case "components": {
          const c = section.content;
          bodyHtml = `
            <p>Total Registered Components: <strong>${c.totalComponents}</strong></p>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Replicas</th>
                  <th>Tech</th>
                  <th>Findings</th>
                </tr>
              </thead>
              <tbody>
                ${c.components
                  .map(
                    (comp) => `
                  <tr>
                    <td><strong>${escapeHtml(comp.label)}</strong></td>
                    <td><code>${escapeHtml(comp.type)}</code></td>
                    <td>${escapeHtml(comp.category)}</td>
                    <td class="num">${comp.replicas}</td>
                    <td>${escapeHtml(comp.technology || "N/A")}</td>
                    <td class="num">${comp.findingsCount}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `;
          break;
        }

        case "dependencies": {
          const c = section.content;
          bodyHtml = `
            <p>Total Explicit Dependencies: <strong>${c.totalDependencies}</strong></p>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Target</th>
                  <th>Protocol</th>
                  <th>Failure Behavior</th>
                  <th>Criticality</th>
                </tr>
              </thead>
              <tbody>
                ${c.dependencies
                  .map(
                    (dep) => `
                  <tr>
                    <td>${escapeHtml(dep.sourceLabel)}</td>
                    <td>${escapeHtml(dep.targetLabel)}</td>
                    <td><code>${escapeHtml(dep.protocol || "TCP")}</code></td>
                    <td>${escapeHtml(dep.failureBehavior || "blocks_caller")}</td>
                    <td><span class="badge badge-info">${dep.criticality}</span></td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `;
          break;
        }

        case "health": {
          const c = section.content;
          bodyHtml = `
            <div class="score-card">
              <div class="score-badge">
                <span class="score-value">${c.overallScore}</span>
                <span class="score-label">/100 Health</span>
              </div>
              <div class="score-status">Status: <strong>${c.status.toUpperCase()}</strong></div>
            </div>
            <div class="pillar-grid">
              ${Object.entries(c.pillarScores)
                .map(
                  ([pillar, score]) => `
                <div class="pillar-box">
                  <span class="pillar-name">${escapeHtml(pillar.toUpperCase())}</span>
                  <span class="pillar-score">${score}%</span>
                </div>
              `
                )
                .join("")}
            </div>
          `;
          break;
        }

        case "recommendations": {
          const c = section.content;
          bodyHtml = `
            <p>Total Recommendations: <strong>${c.totalRecommendations}</strong> (${c.criticalCount} Critical, ${c.highCount} High)</p>
            <div class="recommendations-list">
              ${c.items
                .map(
                  (rec) => `
                <div class="recommendation-item">
                  <div class="rec-header">
                    <span class="badge badge-${rec.priority === "critical" ? "error" : "warning"}">${rec.priority.toUpperCase()}</span>
                    <h5>${escapeHtml(rec.title)}</h5>
                  </div>
                  <p class="rec-desc">${escapeHtml(rec.summary)}</p>
                  ${rec.tradeoffs.length ? `<p class="rec-tradeoffs"><em>Trade-offs:</em> ${escapeHtml(rec.tradeoffs.join("; "))}</p>` : ""}
                </div>
              `
                )
                .join("")}
            </div>
          `;
          break;
        }

        case "cost": {
          const c = section.content;
          bodyHtml = `
            <div class="cost-summary-box">
              <div class="cost-stat">
                <span class="label">Monthly Total:</span>
                <span class="value">${escapeHtml(c.totalMonthlyCost)}</span>
              </div>
              <div class="cost-stat">
                <span class="label">Annual Estimate:</span>
                <span class="value">${escapeHtml(c.totalAnnualCost)}</span>
              </div>
            </div>
            <h4>Optimization Opportunities</h4>
            <ul>
              ${c.topSavingsOpportunities.map((o) => `<li><strong>${escapeHtml(o.title)}</strong> — Saves approx ${escapeHtml(o.estimatedMonthlySavings)}</li>`).join("")}
            </ul>
          `;
          break;
        }

        case "adrs": {
          const c = section.content;
          bodyHtml = `
            <div class="adr-list">
              ${c.adrs
                .map(
                  (adr) => `
                <div class="adr-card">
                  <h5>ADR-${String(adr.decisionNumber).padStart(4, "0")}: ${escapeHtml(adr.title)}</h5>
                  <div class="adr-meta">
                    <span class="badge">${adr.status.toUpperCase()}</span>
                    <span>Date: ${escapeHtml(adr.date)}</span>
                    <span>Author: ${escapeHtml(adr.author)}</span>
                  </div>
                  <p><strong>Context:</strong> ${escapeHtml(adr.context)}</p>
                  <p><strong>Decision:</strong> ${escapeHtml(adr.decision)}</p>
                  <p><strong>Consequences:</strong> ${escapeHtml(adr.consequences.positive.join("; "))}</p>
                </div>
              `
                )
                .join("")}
            </div>
          `;
          break;
        }

        default: {
          bodyHtml = `<p>${escapeHtml(section.description || "Report section content")}</p>`;
          break;
        }
      }

      sectionsHtml.push(`
        <section class="report-section" id="${section.id}">
          <h3>${escapeHtml(section.title)}</h3>
          ${section.description ? `<p class="section-desc">${escapeHtml(section.description)}</p>` : ""}
          <div class="section-content">
            ${bodyHtml}
          </div>
        </section>
      `);
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(report.title)} - NXTQR Architecture Report</title>
  <style>
    :root {
      --bg: ${isPrintTheme ? "#FFFFFF" : "#000000"};
      --fg: ${isPrintTheme ? "#111111" : "#FFFFFF"};
      --surface-1: ${isPrintTheme ? "#F9F9F9" : "#080808"};
      --surface-2: ${isPrintTheme ? "#F0F0F0" : "#0D0D0D"};
      --surface-3: ${isPrintTheme ? "#E5E5E5" : "#141414"};
      --border: ${isPrintTheme ? "#CCCCCC" : "#262626"};
      --muted: ${isPrintTheme ? "#666666" : "#858585"};
      --radius: 6px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--fg);
      font-family: Geist Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      padding: 40px;
      max-width: 960px;
      margin: 0 auto;
    }
    header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    h2 { font-size: 20px; font-weight: 600; margin: 24px 0 12px; }
    h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    h4 { font-size: 14px; font-weight: 600; margin: 12px 0 6px; color: var(--muted); }
    h5 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    p { margin-bottom: 12px; font-size: 14px; }
    .subtitle { color: var(--muted); font-size: 16px; margin-bottom: 12px; }
    .meta-bar {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: var(--muted);
      font-family: Geist Mono, monospace;
    }
    .report-section {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .section-desc { color: var(--muted); font-style: italic; margin-bottom: 16px; }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 13px;
    }
    .report-table th, .report-table td {
      border: 1px solid var(--border);
      padding: 8px 12px;
      text-align: left;
    }
    .report-table th { background: var(--surface-2); font-weight: 600; }
    .report-table td.num { text-align: center; font-family: Geist Mono, monospace; }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-family: Geist Mono, monospace;
      border: 1px solid var(--border);
      background: var(--surface-2);
    }
    .badge-error { color: #FF4D4D; border-color: #551A1A; }
    .badge-warning { color: #FFAA00; border-color: #553300; }
    .badge-info { color: #858585; }
    .pillar-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .pillar-box {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px;
      text-align: center;
    }
    .pillar-name { display: block; font-size: 11px; color: var(--muted); }
    .pillar-score { font-size: 20px; font-weight: 700; font-family: Geist Mono, monospace; }
    .diagram-container svg { width: 100%; height: auto; border-radius: var(--radius); }
    .adr-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      margin-bottom: 16px;
    }
    .adr-meta { display: flex; gap: 12px; font-size: 12px; color: var(--muted); margin: 6px 0 12px; }
    @media print {
      body { padding: 0; max-width: 100%; }
      .report-section { break-inside: avoid; border: 1px solid #CCCCCC; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(report.title)}</h1>
    ${report.subtitle ? `<div class="subtitle">${escapeHtml(report.subtitle)}</div>` : ""}
    <div class="meta-bar">
      <span>Audience: ${report.audience}</span>
      <span>Revision: ${report.graphRevision}</span>
      <span>Version: ${report.versionNumber}</span>
      <span>Date: ${report.generatedAt.split("T")[0]}</span>
      <span>Author: ${escapeHtml(report.author)}</span>
    </div>
  </header>
  <main>
    ${sectionsHtml.join("\n")}
  </main>
</body>
</html>`;

    const filename = `${report.architectureId}-report-v${report.versionNumber}.html`;

    return {
      format: "html",
      content: htmlContent,
      mimeType: "text/html",
      filename,
      byteSize: Buffer.byteLength(htmlContent, "utf8"),
      generatedAt: new Date().toISOString(),
    };
  }
}
