import type { ArchitectureReport } from "../contracts/report.types";
import type { ReportExportOptions, ReportExportResult } from "../contracts/export.types";

export class MarkdownExporter {
  public static export(report: ArchitectureReport, options?: Partial<ReportExportOptions>): ReportExportResult {
    const lines: string[] = [];

    // Frontmatter
    lines.push("---");
    lines.push(`title: "${report.title.replace(/"/g, '\\"')}"`);
    if (report.subtitle) lines.push(`subtitle: "${report.subtitle.replace(/"/g, '\\"')}"`);
    lines.push(`id: "${report.id}"`);
    lines.push(`architectureId: "${report.architectureId}"`);
    lines.push(`graphRevision: "${report.graphRevision}"`);
    lines.push(`audience: "${report.audience}"`);
    lines.push(`version: ${report.versionNumber}`);
    lines.push(`status: "${report.status}"`);
    lines.push(`author: "${report.author}"`);
    lines.push(`generatedAt: "${report.generatedAt}"`);
    lines.push("---");
    lines.push("");

    // Document Title
    lines.push(`# ${report.title}`);
    if (report.subtitle) lines.push(`> ${report.subtitle}`);
    lines.push("");
    lines.push(`**Audience:** ${report.audience} | **Revision:** \`${report.graphRevision}\` | **Date:** ${report.generatedAt.split("T")[0]}`);
    lines.push("");

    if (options?.includeTableOfContents) {
      lines.push("## Table of Contents");
      for (const section of report.sections.filter((s) => s.isEnabled)) {
        const anchor = section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        lines.push(`- [${section.title}](#${anchor})`);
      }
      lines.push("");
    }

    // Iterate enabled sections
    for (const section of report.sections.filter((s) => s.isEnabled)) {
      lines.push(`## ${section.title}`);
      if (section.description) {
        lines.push(`*${section.description}*`);
        lines.push("");
      }

      switch (section.kind) {
        case "overview": {
          const content = section.content;
          lines.push(`### System Purpose`);
          lines.push(content.primaryPurpose);
          lines.push("");
          lines.push(`### Subsystems`);
          for (const sub of content.subsystems) {
            lines.push(`- **${sub.name}** (${sub.nodeCount} components): ${sub.description}`);
          }
          lines.push("");
          lines.push(`### Key Assumptions`);
          for (const ass of content.keyAssumptions) {
            lines.push(`- ${ass}`);
          }
          lines.push("");
          break;
        }

        case "diagram": {
          lines.push("```mermaid");
          lines.push("graph TD");
          lines.push("    %% Visual topology overview");
          for (const item of section.content.legendItems) {
            lines.push(`    classDef ${item.category} stroke:#404040,stroke-width:1.5px`);
          }
          lines.push("```");
          lines.push("");
          lines.push(`*Rendered with ${section.content.nodeCount} nodes and ${section.content.edgeCount} edges.*`);
          lines.push("");
          break;
        }

        case "components": {
          const content = section.content;
          lines.push(`Total Components: **${content.totalComponents}**`);
          lines.push("");
          lines.push("| Component | Type | Category | Replicas | Tech | Findings |");
          lines.push("| :--- | :--- | :--- | :---: | :--- | :---: |");
          for (const comp of content.components) {
            lines.push(
              `| **${comp.label}** | \`${comp.type}\` | ${comp.category} | ${comp.replicas} | ${comp.technology || "N/A"} | ${comp.findingsCount} |`
            );
          }
          lines.push("");
          break;
        }

        case "dependencies": {
          const content = section.content;
          lines.push(`Total Runtime Dependencies: **${content.totalDependencies}**`);
          lines.push("");
          lines.push("| Source | Target | Protocol | Behavior | Criticality |");
          lines.push("| :--- | :--- | :---: | :--- | :---: |");
          for (const dep of content.dependencies) {
            lines.push(
              `| ${dep.sourceLabel} | ${dep.targetLabel} | \`${dep.protocol || "TCP"}\` | ${dep.failureBehavior || "blocks_caller"} | ${dep.criticality} |`
            );
          }
          lines.push("");
          break;
        }

        case "data_flows": {
          const content = section.content;
          lines.push("| Flow Name | Protocol | Trust Boundary | Description |");
          lines.push("| :--- | :---: | :---: | :--- |");
          for (const flow of content.flows) {
            lines.push(
              `| ${flow.name} | \`${flow.protocol}\` | ${flow.crossesTrustBoundary ? "⚠️ Crosses" : "Within Boundary"} | ${flow.description} |`
            );
          }
          lines.push("");
          break;
        }

        case "validation": {
          const content = section.content;
          lines.push(`Validation Status: **${content.status.toUpperCase()}** (${content.errorCount} errors, ${content.warningCount} warnings)`);
          lines.push("");
          if (content.findings.length > 0) {
            lines.push("| Severity | Rule | Message | Remediation |");
            lines.push("| :---: | :--- | :--- | :--- |");
            for (const f of content.findings) {
              lines.push(
                `| ${f.severity === "error" ? "🛑 Error" : "⚠️ Warning"} | \`${f.ruleId}\` | ${f.message} | ${f.remediationSuggestion || "N/A"} |`
              );
            }
          } else {
            lines.push("✅ No structural graph validation errors detected.");
          }
          lines.push("");
          break;
        }

        case "health": {
          const content = section.content;
          lines.push(`Overall Health Score: **${content.overallScore}/100** (\`${content.status.toUpperCase()}\`)`);
          lines.push("");
          lines.push("| Pillar | Score |");
          lines.push("| :--- | :---: |");
          lines.push(`| Reliability | ${content.pillarScores.reliability}% |`);
          lines.push(`| Scalability | ${content.pillarScores.scalability}% |`);
          lines.push(`| Security | ${content.pillarScores.security}% |`);
          lines.push(`| Performance | ${content.pillarScores.performance}% |`);
          lines.push(`| Maintainability | ${content.pillarScores.maintainability}% |`);
          lines.push(`| Operations | ${content.pillarScores.operations}% |`);
          lines.push("");
          break;
        }

        case "bottlenecks": {
          const content = section.content;
          lines.push(`Workload Scenario: \`${content.workloadScenarioId}\``);
          lines.push("");
          if (content.criticalPaths.length > 0) {
            lines.push("| Component | Throughput Limit | Utilization | Mitigation |");
            lines.push("| :--- | :---: | :---: | :--- |");
            for (const cp of content.criticalPaths) {
              lines.push(
                `| **${cp.bottleneckLabel}** | ${cp.throughputLimitRps} RPS | ${cp.utilizationPercent}% | ${cp.mitigationStrategy} |`
              );
            }
          } else {
            lines.push("No severe bottlenecks identified under current workload parameters.");
          }
          lines.push("");
          break;
        }

        case "spof": {
          const content = section.content;
          if (content.criticalComponents.length > 0) {
            lines.push("| Component | Blast Radius | Downstream Impact | Recommended Mitigation |");
            lines.push("| :--- | :---: | :---: | :--- |");
            for (const sp of content.criticalComponents) {
              lines.push(
                `| **${sp.nodeLabel}** | ${sp.blastRadiusScore}/100 | ${sp.dependentNodesCount} nodes | ${sp.recommendedMitigation} |`
              );
            }
          } else {
            lines.push("No critical Single Points of Failure identified; redundancy goals satisfied.");
          }
          lines.push("");
          break;
        }

        case "security": {
          const content = section.content;
          lines.push(`- Trust Boundaries: **${content.trustBoundariesCount}**`);
          lines.push(`- Exposed Ingress Components: **${content.exposedComponentsCount}**`);
          lines.push(`- Unencrypted Flows: **${content.unencryptedFlowsCount}**`);
          lines.push("");
          if (content.topFindings.length > 0) {
            lines.push("| Severity | Title | Category | Remediation |");
            lines.push("| :---: | :--- | :--- | :--- |");
            for (const tf of content.topFindings) {
              lines.push(
                `| **${tf.severity.toUpperCase()}** | ${tf.title} | ${tf.category} | ${tf.remediation} |`
              );
            }
          }
          lines.push("");
          break;
        }

        case "scalability": {
          const content = section.content;
          lines.push("### Horizontal Scaling Options");
          for (const opt of content.horizontalScalingOptions) lines.push(`- ${opt}`);
          lines.push("");
          lines.push("### Vertical Scaling Options");
          for (const opt of content.verticalScalingOptions) lines.push(`- ${opt}`);
          lines.push("");
          break;
        }

        case "reliability": {
          const content = section.content;
          lines.push(`- Recovery Readiness: **${content.recoveryReadinessScore}/100**`);
          lines.push(`- Missing Circuit Breakers: **${content.missingCircuitBreakersCount}**`);
          lines.push(`- Missing Retries: **${content.missingRetriesCount}**`);
          lines.push("");
          break;
        }

        case "recommendations": {
          const content = section.content;
          lines.push(`Total Recommendations: **${content.totalRecommendations}** (${content.criticalCount} Critical, ${content.highCount} High)`);
          lines.push("");
          for (const rec of content.items) {
            lines.push(`### [${rec.priority.toUpperCase()}] ${rec.title}`);
            lines.push(rec.summary);
            if (rec.prerequisites.length > 0) {
              lines.push(`- **Prerequisites:** ${rec.prerequisites.join(", ")}`);
            }
            if (rec.tradeoffs.length > 0) {
              lines.push(`- **Trade-offs:** ${rec.tradeoffs.join("; ")}`);
            }
            lines.push("");
          }
          break;
        }

        case "comparison": {
          const content = section.content;
          lines.push(`Baseline: \`${content.baselineRevision}\` ➔ Candidate: \`${content.candidateRevision}\``);
          lines.push(`Summary: ${content.summary}`);
          lines.push("");
          lines.push(`- Components Added: **${content.addedComponentsCount}**`);
          lines.push(`- Components Removed: **${content.removedComponentsCount}**`);
          lines.push(`- Components Modified: **${content.modifiedComponentsCount}**`);
          if (content.netMonthlySavings) {
            lines.push(`- Net Monthly Cost Delta: **${content.netMonthlySavings}**`);
          }
          lines.push("");
          break;
        }

        case "capacity": {
          const content = section.content;
          lines.push(`- Growth Model: **${content.growthModel}** (${content.horizonMonths} Month Horizon)`);
          lines.push(`- Baseline Throughput: **${content.baselineRps} RPS** ➔ Projected Peak: **${content.projectedPeakRps} RPS**`);
          if (content.firstSaturationInterval) {
            lines.push(`- ⚠️ First Saturation Expected: **${content.firstSaturationInterval}**`);
          }
          lines.push("");
          break;
        }

        case "cost": {
          const content = section.content;
          lines.push(`- Cloud Provider: **${content.providerId.toUpperCase()}**`);
          lines.push(`- Modeled Monthly Total: **${content.totalMonthlyCost}** (Annual: **${content.totalAnnualCost}**)`);
          lines.push(`- Fixed vs Variable: **${content.fixedMonthlyCost}** / **${content.variableMonthlyCost}**`);
          lines.push("");
          lines.push("### Top Savings Opportunities");
          for (const opt of content.topSavingsOpportunities) {
            lines.push(`- **${opt.title}**: Estimated savings ${opt.estimatedMonthlySavings}`);
          }
          lines.push("");
          break;
        }

        case "simulation": {
          const content = section.content;
          lines.push(`- Scenario: **${content.scenarioName}** (${content.durationMs / 1000}s timeline)`);
          lines.push(`- Blast Radius Score: **${content.blastRadiusScore}%** (${Math.round(content.unaffectedRatio * 100)}% architecture unaffected)`);
          lines.push(`- Cascading Failure Risks: **${content.cascadingFailureRisksCount}**`);
          lines.push("");
          lines.push("### Critical User Journeys");
          for (const [journey, status] of Object.entries(content.journeyStatusSummary)) {
            const icon = status === "available" ? "🟢" : status === "degraded" ? "🟡" : "🔴";
            lines.push(`- ${icon} **${journey}**: \`${status.toUpperCase()}\``);
          }
          lines.push("");
          if (content.findings.length > 0) {
            lines.push("### Resilience Findings");
            for (const f of content.findings) {
              lines.push(`- **[${f.severity.toUpperCase()}] ${f.title}**: ${f.description}`);
              lines.push(`  *Mitigation:* ${f.mitigationRecommendation}`);
            }
            lines.push("");
          }
          break;
        }

        case "adrs": {
          const content = section.content;
          lines.push(`Recorded Architecture Decisions: **${content.totalDecisions}**`);
          lines.push("");
          for (const adr of content.adrs) {
            lines.push(`### ADR-${String(adr.decisionNumber).padStart(4, "0")}: ${adr.title}`);
            lines.push(`- **Status:** \`${adr.status.toUpperCase()}\` | **Author:** ${adr.author} | **Date:** ${adr.date}`);
            lines.push(`- **Context:** ${adr.context}`);
            lines.push(`- **Decision:** ${adr.decision}`);
            lines.push(`- **Positive Consequences:** ${adr.consequences.positive.join("; ")}`);
            if (adr.consequences.negative.length > 0) {
              lines.push(`- **Negative Consequences:** ${adr.consequences.negative.join("; ")}`);
            }
            lines.push("");
          }
          break;
        }

        case "text": {
          lines.push(section.content.markdownContent);
          lines.push("");
          break;
        }
      }
    }

    // Evidence Appendix
    if (report.evidence.length > 0) {
      lines.push("## Evidence Appendix & Traceability");
      lines.push("");
      lines.push("| Reference ID | Source Engine | Type | Summary |");
      lines.push("| :--- | :--- | :---: | :--- |");
      for (const ev of report.evidence) {
        lines.push(`| \`${ev.id}\` | \`${ev.sourceEngine}\` | ${ev.kind} | ${ev.title} — ${ev.summary} |`);
      }
      lines.push("");
    }

    const outputContent = lines.join("\n");
    const filename = `${report.architectureId}-report-v${report.versionNumber}.md`;

    return {
      format: "markdown",
      content: outputContent,
      mimeType: "text/markdown",
      filename,
      byteSize: Buffer.byteLength(outputContent, "utf8"),
      generatedAt: new Date().toISOString(),
    };
  }
}
