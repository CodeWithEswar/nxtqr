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

        case "simulation": {
          const c = section.content;
          bodyHtml = `
            <div class="cost-summary-box">
              <div class="cost-stat">
                <span class="label">Scenario:</span>
                <span class="value">${escapeHtml(c.scenarioName)}</span>
              </div>
              <div class="cost-stat">
                <span class="label">Blast Radius:</span>
                <span class="value">${c.blastRadiusScore}%</span>
              </div>
            </div>
            <h4>Critical User Journeys</h4>
            <ul>
              ${Object.entries(c.journeyStatusSummary)
                .map(([journey, status]) => `<li><strong>${escapeHtml(journey)}</strong>: ${status.toUpperCase()}</li>`)
                .join("")}
            </ul>
            <h4>Resilience Findings</h4>
            <ul>
              ${c.findings
                .map(
                  (f) =>
                    `<li><strong>[${f.severity.toUpperCase()}] ${escapeHtml(f.title)}</strong>: ${escapeHtml(f.description)}<br/><em>Mitigation:</em> ${escapeHtml(f.mitigationRecommendation)}</li>`
                )
                .join("")}
            </ul>
          `;
          break;
        }

        case "observability": {
          const c = section.content;
          bodyHtml = `
            <div class="cost-summary-box">
              <div class="cost-stat">
                <span class="label">Telemetry Source:</span>
                <span class="value">${escapeHtml(c.telemetrySource)}</span>
              </div>
              <div class="cost-stat">
                <span class="label">Monitored Components:</span>
                <span class="value">${c.totalMonitoredComponents}</span>
              </div>
              <div class="cost-stat">
                <span class="label">Healthy:</span>
                <span class="value">${c.healthyCount}</span>
              </div>
              <div class="cost-stat">
                <span class="label">Degraded:</span>
                <span class="value">${c.degradedCount}</span>
              </div>
              <div class="cost-stat">
                <span class="label">Critical:</span>
                <span class="value">${c.criticalCount}</span>
              </div>
              <div class="cost-stat">
                <span class="label">Unknown:</span>
                <span class="value">${c.unknownCount}</span>
              </div>
            </div>
            ${
              c.topDriftFindings.length > 0
                ? `<h4>Topology Drift Findings</h4>
                <ul>
                  ${c.topDriftFindings
                    .map(
                      (d) =>
                        `<li><strong>[${d.severity.toUpperCase()}] ${escapeHtml(d.title)}</strong> (${escapeHtml(d.type)})<br/><em>Evidence:</em> ${escapeHtml(d.evidence)}</li>`
                    )
                    .join("")}
                </ul>`
                : ""
            }
            ${
              c.observedVsModeledDeltas.length > 0
                ? `<h4>Observed vs Modeled Telemetry Comparison</h4>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th class="num">Observed RPS</th>
                      <th class="num">Modeled RPS</th>
                      <th class="num">Observed P95</th>
                      <th class="num">Modeled P95</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.observedVsModeledDeltas
                      .map(
                        (d) => `<tr>
                        <td><strong>${escapeHtml(d.componentLabel)}</strong></td>
                        <td class="num">${d.observedRps !== undefined ? `${d.observedRps} req/s` : "N/A"}</td>
                        <td class="num">${d.modeledRps !== undefined ? `${d.modeledRps} req/s` : "N/A"}</td>
                        <td class="num">${d.observedLatencyP95Ms !== undefined ? `${d.observedLatencyP95Ms} ms` : "N/A"}</td>
                        <td class="num">${d.modeledLatencyP95Ms !== undefined ? `${d.modeledLatencyP95Ms} ms` : "N/A"}</td>
                      </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
                : ""
            }
          `;
          break;
        }

        case "benchmark": {
          const c = section.content;
          bodyHtml = `
            <div class="cost-summary-box">
              <div class="cost-stat">
                <span class="label">Benchmark Test:</span>
                <span class="value">${escapeHtml(c.testName)} (${escapeHtml(c.testType)})</span>
              </div>
              <div class="cost-stat">
                <span class="label">Environment:</span>
                <span class="value">${escapeHtml(c.environmentName)}</span>
              </div>
              <div class="cost-stat">
                <span class="label">Workload Model:</span>
                <span class="value">${escapeHtml(c.workloadModel)}</span>
              </div>
              <div class="cost-stat">
                <span class="label">Total Requests:</span>
                <span class="value">${c.totalRequests.toLocaleString()}</span>
              </div>
              <div class="cost-stat">
                <span class="label">Achieved RPS:</span>
                <span class="value">${c.achievedRps.toFixed(1)}</span>
              </div>
              <div class="cost-stat">
                <span class="label">Error Rate:</span>
                <span class="value">${c.errorRatePct.toFixed(2)}%</span>
              </div>
            </div>

            <h4>Measured Latency Distribution</h4>
            <div class="cost-summary-box">
              <div class="cost-stat"><span class="label">P50 (Median):</span><span class="value">${c.p50LatencyMs.toFixed(1)} ms</span></div>
              <div class="cost-stat"><span class="label">P90:</span><span class="value">${c.p90LatencyMs.toFixed(1)} ms</span></div>
              <div class="cost-stat"><span class="label">P95:</span><span class="value">${c.p95LatencyMs.toFixed(1)} ms</span></div>
              <div class="cost-stat"><span class="label">P99 (Tail):</span><span class="value">${c.p99LatencyMs.toFixed(1)} ms</span></div>
            </div>

            ${
              c.targetResults.length > 0
                ? `<h4>Performance Target Compliance</h4>
                <ul>
                  ${c.targetResults
                    .map(
                      (t) =>
                        `<li><strong>[${t.status.toUpperCase()}] ${escapeHtml(t.targetName)}</strong>: ${escapeHtml(t.reason)}</li>`
                    )
                    .join("")}
                </ul>`
                : ""
            }

            ${
              c.regressions.length > 0
                ? `<h4>Performance Regressions vs Baseline</h4>
                <ul>
                  ${c.regressions
                    .map(
                      (r) =>
                        `<li><strong>[${r.severity.toUpperCase()}] ${escapeHtml(r.metric)}:</strong> ${escapeHtml(r.explanation)}</li>`
                    )
                    .join("")}
                </ul>`
                : ""
            }

            ${
              c.calibrationProposals.length > 0
                ? `<h4>Architecture Model Calibration Proposals</h4>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Parameter</th>
                      <th class="num">Modeled</th>
                      <th class="num">Measured</th>
                      <th class="num">Recommended</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.calibrationProposals
                      .map(
                        (cp) => `<tr>
                        <td><strong>${escapeHtml(cp.componentLabel)}</strong></td>
                        <td><code>${escapeHtml(cp.parameterName)}</code></td>
                        <td class="num">${cp.modeledValue}</td>
                        <td class="num">${cp.measuredValue}</td>
                        <td class="num"><strong>${cp.recommendedCalibration}</strong></td>
                      </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
                : ""
            }
          `;
          break;
        }

        case "deployment": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <p>Environment: <strong>${escapeHtml(c.environmentName)}</strong> (<code>${escapeHtml(c.environmentCategory)}</code>)</p>
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">Multi-AZ Redundancy</span>
                  <span class="pillar-score">${c.multiAzScore}%</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Overall Reliability</span>
                  <span class="pillar-score">${c.overallReliabilityScore}%</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Total Resources</span>
                  <span class="pillar-score">${c.totalResources}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Mappings / Unmapped</span>
                  <span class="pillar-score">${c.totalMappings} / ${c.unmappedCount}</span>
                </div>
              </div>
            </div>
            ${
              c.resources.length > 0
                ? `<h4>Key Infrastructure Resources</h4>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Type</th>
                      <th>Provider</th>
                      <th>Region / Zone</th>
                      <th>CIDR</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.resources
                      .map(
                        (r) => `<tr>
                        <td><strong>${escapeHtml(r.name)}</strong></td>
                        <td><code>${escapeHtml(r.type)}</code></td>
                        <td>${escapeHtml(r.provider.toUpperCase())}</td>
                        <td>${escapeHtml([r.region, r.zone].filter(Boolean).join(" / ") || "—")}</td>
                        <td><code>${escapeHtml(r.cidr || "—")}</code></td>
                      </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
                : ""
            }
            ${
              c.failureDomains.length > 0
                ? `<h4>Identified Failure Domains</h4>
                <ul>
                  ${c.failureDomains
                    .map(
                      (d) =>
                        `<li><strong>${escapeHtml(d.name)}</strong> (<code>${escapeHtml(d.type)}</code>, Risk: <span class="badge ${d.riskLevel === "critical" || d.riskLevel === "high" ? "badge-error" : "badge-info"}">${d.riskLevel.toUpperCase()}</span>): ${escapeHtml(d.description)}</li>`
                    )
                    .join("")}
                </ul>`
                : ""
            }
            ${
              c.findings.length > 0
                ? `<h4>Topology Findings</h4>
                <ul>
                  ${c.findings
                    .map(
                      (f) =>
                        `<li><span class="badge ${f.severity === "critical" || f.severity === "high" ? "badge-error" : "badge-info"}">${f.severity.toUpperCase()}</span> <strong>${escapeHtml(f.title)}</strong>: ${escapeHtml(f.description)}<br><em>Remediation: ${escapeHtml(f.remediation)}</em></li>`
                    )
                    .join("")}
                </ul>`
                : ""
            }
          `;
          break;
        }

        case "lineage": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">Total Data Assets</span>
                  <span class="pillar-score">${c.totalAssets}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Data Flows</span>
                  <span class="pillar-score">${c.totalFlows}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Retention Coverage</span>
                  <span class="pillar-score">${c.retentionCoveragePct}%</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Privacy Findings</span>
                  <span class="pillar-score">${c.privacyFindingsCount}</span>
                </div>
              </div>
            </div>
            ${
              c.assets.length > 0
                ? `<h4>Registered Data Assets</h4>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Asset Name</th>
                      <th>Sensitivity Level</th>
                      <th>Categories</th>
                      <th>Storage Bindings</th>
                      <th>Retention Configured</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.assets
                      .map(
                        (a) => `<tr>
                        <td><strong>${escapeHtml(a.name)}</strong></td>
                        <td><span class="badge ${a.classificationLevel === "restricted" || a.classificationLevel === "confidential" ? "badge-error" : "badge-info"}">${escapeHtml(a.classificationLevel.toUpperCase())}</span></td>
                        <td>${escapeHtml(a.categories.join(", ") || "—")}</td>
                        <td>${a.storageCount}</td>
                        <td>${a.hasRetention ? "Yes" : "No"}</td>
                      </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
                : ""
            }
            ${
              c.privacyFindings.length > 0
                ? `<h4>Privacy & Governance Findings</h4>
                <ul>
                  ${c.privacyFindings
                    .map(
                      (f) =>
                        `<li><span class="badge ${f.severity === "critical" || f.severity === "high" ? "badge-error" : "badge-info"}">${f.severity.toUpperCase()}</span> <strong>${escapeHtml(f.title)}</strong> (<code>${escapeHtml(f.category)}</code>): <em>${escapeHtml(f.remediation)}</em></li>`
                    )
                    .join("")}
                </ul>`
                : ""
            }
          `;
          break;
        }

        case "api_contracts": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">Total Contracts</span>
                  <span class="pillar-score">${c.totalContracts}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Operations Defined</span>
                  <span class="pillar-score">${c.totalOperations}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Consumer Deps</span>
                  <span class="pillar-score">${c.totalConsumerDependencies}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Contract Coverage</span>
                  <span class="pillar-score">${c.coveragePercentage}%</span>
                </div>
              </div>
            </div>
            ${
              c.contracts.length > 0
                ? `<h4>Registered API Contracts</h4>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Contract</th>
                      <th>Protocol</th>
                      <th>Format</th>
                      <th>Provider Service</th>
                      <th>Lifecycle</th>
                      <th>Exposure</th>
                      <th>Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.contracts
                      .map(
                        (ct) => `<tr>
                        <td><strong>${escapeHtml(ct.name)}</strong></td>
                        <td><code>${escapeHtml(ct.protocol.toUpperCase())}</code></td>
                        <td>${escapeHtml(ct.format)}</td>
                        <td>${escapeHtml(ct.providerServiceId)}</td>
                        <td><span class="badge badge-info">${escapeHtml(ct.lifecycleStatus)}</span></td>
                        <td>${escapeHtml(ct.exposure)}</td>
                        <td>${ct.operationsCount}</td>
                      </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
                : ""
            }
          `;
          break;
        }

        case "messaging_systems": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">Brokers</span>
                  <span class="pillar-score">${c.brokerCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Destinations</span>
                  <span class="pillar-score">${c.destinationCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Producers / Consumers</span>
                  <span class="pillar-score">${c.producerCount} / ${c.consumerCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Sagas</span>
                  <span class="pillar-score">${c.sagaCount}</span>
                </div>
              </div>
            </div>
            ${
              c.destinations.length > 0
                ? `<h4>Messaging Destinations (Queues & Topics)</h4>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Delivery Semantics</th>
                      <th>Ordering Scope</th>
                      <th>Partitions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.destinations
                      .map(
                        (d) => `<tr>
                        <td><strong>${escapeHtml(d.name)}</strong></td>
                        <td><code>${escapeHtml(d.type)}</code></td>
                        <td><code>${escapeHtml(d.deliverySemantics)}</code></td>
                        <td><code>${escapeHtml(d.orderingScope)}</code></td>
                        <td>${d.partitionCount ?? "N/A"}</td>
                      </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
                : ""
            }
            ${
              c.findings.length > 0
                ? `<h4>Reliability & Consistency Findings</h4>
                <ul>
                  ${c.findings
                    .map(
                      (f) =>
                        `<li><span class="badge ${f.severity === "critical" || f.severity === "high" ? "badge-error" : "badge-info"}">${f.severity.toUpperCase()}</span> <strong>${escapeHtml(f.title)}</strong> (<code>${escapeHtml(f.category)}</code>): <em>${escapeHtml(f.remediation)}</em></li>`
                    )
                    .join("")}
                </ul>`
                : ""
            }
          `;
          break;
        }

        case "caching_and_state": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">Cache Layers</span>
                  <span class="pillar-score">${c.cacheLayerCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Sources of Truth</span>
                  <span class="pillar-score">${c.sourceOfTruthCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Net Offload</span>
                  <span class="pillar-score">${c.netOffloadPercentage.toFixed(1)}%</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Critical Findings</span>
                  <span class="pillar-score">${c.criticalFindingsCount}</span>
                </div>
              </div>
            </div>
            ${
              c.cacheLayers.length > 0
                ? `<h4>Cache Hierarchy Layers</h4>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Layer Name</th>
                      <th>Cache Type</th>
                      <th>Technology</th>
                      <th>Strategy</th>
                      <th>Tier</th>
                      <th>Memory</th>
                      <th>Default TTL</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.cacheLayers
                      .map(
                        (cl) => `<tr>
                        <td><strong>${escapeHtml(cl.name)}</strong></td>
                        <td><code>${escapeHtml(cl.cacheType)}</code></td>
                        <td><code>${escapeHtml(cl.technology)}</code></td>
                        <td><code>${escapeHtml(cl.strategy)}</code></td>
                        <td>T${cl.tierOrder}</td>
                        <td>${cl.allocatedMemoryMb}MB</td>
                        <td>${cl.defaultTtlSeconds}s</td>
                      </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
                : ""
            }
            ${
              c.sourcesOfTruth.length > 0
                ? `<h4>Sources of Truth & Data Stores</h4>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Data Store Name</th>
                      <th>Storage Type</th>
                      <th>Authoritative Master</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.sourcesOfTruth
                      .map(
                        (sot) => `<tr>
                        <td><strong>${escapeHtml(sot.name)}</strong></td>
                        <td><code>${escapeHtml(sot.type)}</code></td>
                        <td>${sot.isAuthoritativeMaster ? "Yes" : "No"}</td>
                      </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
                : ""
            }
            ${
              c.findings.length > 0
                ? `<h4>Caching & Consistency Findings</h4>
                <ul>
                  ${c.findings
                    .map(
                      (f) =>
                        `<li><span class="badge ${f.severity === "critical" || f.severity === "high" ? "badge-error" : "badge-info"}">${f.severity.toUpperCase()}</span> <strong>${escapeHtml(f.title)}</strong> (<code>${escapeHtml(f.category)}</code>): <em>${escapeHtml(f.remediation)}</em></li>`
                    )
                    .join("")}
                </ul>`
                : ""
            }
          `;
          break;
        }

        case "database_architecture": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">Database Assets</span>
                  <span class="pillar-score">${c.assetCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Tables</span>
                  <span class="pillar-score">${c.tableCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Unindexed FKs</span>
                  <span class="pillar-score">${c.unindexedForeignKeysCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Deadlock Risks</span>
                  <span class="pillar-score">${c.deadlockRiskCount}</span>
                </div>
              </div>
            </div>
            ${
              c.assets.length > 0
                ? `<h4>Database Assets</h4>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Asset Name</th>
                      <th>Technology</th>
                      <th>Environment</th>
                      <th>Max Connections</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.assets
                      .map(
                        (a) => `<tr>
                        <td><strong>${escapeHtml(a.name)}</strong></td>
                        <td><code>${escapeHtml(a.technology)}</code></td>
                        <td><code>${escapeHtml(a.environment)}</code></td>
                        <td>${a.maxConnectionsAllocated}</td>
                      </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
                : ""
            }
            ${
              c.tables.length > 0
                ? `<h4>Database Schemas & Tables</h4>
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Table Name</th>
                      <th>Columns</th>
                      <th>Indexes</th>
                      <th>Estimated Rows</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.tables
                      .slice(0, 10)
                      .map(
                        (t) => `<tr>
                        <td><strong>${escapeHtml(t.name)}</strong></td>
                        <td>${t.columnCount}</td>
                        <td>${t.indexCount}</td>
                        <td>${t.estimatedRowCount.toLocaleString()}</td>
                        <td>${t.tableSizeBytes ? (t.tableSizeBytes / (1024 * 1024)).toFixed(1) + " MB" : "N/A"}</td>
                      </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
                : ""
            }
            ${
              c.storageForecast
                ? `<h4>Storage Capacity & IOPS</h4>
                <div class="field-group">
                  <p>Current Total Storage: <strong>${c.storageForecast.currentTotalMb.toFixed(1)} MB</strong> | Growth: <strong>${c.storageForecast.projectedMonthlyGrowthMb.toFixed(1)} MB/mo</strong></p>
                  <p>Modeled IOPS: <strong>${c.storageForecast.totalIopsModeled.toFixed(0)} IOPS</strong> | Saturation: <strong>${(c.storageForecast.iopsCapacitySaturationRatio * 100).toFixed(1)}%</strong></p>
                </div>`
                : ""
            }
            ${
              c.keyFindings.length > 0
                ? `<h4>Key Database Findings</h4>
                <ul>
                  ${c.keyFindings
                    .map(
                      (f) =>
                        `<li><span class="badge ${f.severity === "critical" || f.severity === "high" ? "badge-error" : "badge-info"}">${f.severity.toUpperCase()}</span> <strong>${escapeHtml(f.title)}</strong> (<code>${escapeHtml(f.category)}</code>): <em>${escapeHtml(f.remediation)}</em></li>`
                    )
                    .join("")}
                </ul>`
                : ""
            }
          `;
          break;
        }

        case "network_and_traffic": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">DNS Zones</span>
                  <span class="pillar-score">${c.dnsZoneCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Gateways</span>
                  <span class="pillar-score">${c.gatewayCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Routes</span>
                  <span class="pillar-score">${c.routeCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Upstream Pools</span>
                  <span class="pillar-score">${c.poolCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Critical Findings</span>
                  <span class="pillar-score">${c.criticalFindingsCount}</span>
                </div>
              </div>
            </div>
            ${
              c.gateways.length > 0
                ? `<h4>API Gateways & Ingress Controllers</h4>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Gateway</th>
                        <th>Type</th>
                        <th>Technology</th>
                        <th>Routes</th>
                        <th>Auth Required</th>
                        <th>Rate Limiting</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${c.gateways
                        .map(
                          (g) => `<tr>
                          <td><strong>${escapeHtml(g.name)}</strong></td>
                          <td>${escapeHtml(g.gatewayType)}</td>
                          <td><code>${escapeHtml(g.technology)}</code></td>
                          <td>${g.routeCount}</td>
                          <td>${g.hasAuthRequired ? "Yes" : "No"}</td>
                          <td>${g.hasRateLimiting ? "Yes" : "No"}</td>
                        </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
                : ""
            }
            ${
              c.keyFindings.length > 0
                ? `<h4>Key Network & Traffic Engineering Findings</h4>
                <ul>
                  ${c.keyFindings
                    .map(
                      (f) =>
                        `<li><span class="badge ${f.severity === "critical" || f.severity === "high" ? "badge-error" : "badge-info"}">${f.severity.toUpperCase()}</span> <strong>${escapeHtml(f.title)}</strong> (<code>${escapeHtml(f.category)}</code>): <em>${escapeHtml(f.remediation)}</em></li>`
                    )
                    .join("")}
                </ul>`
                : ""
            }
          `;
          break;
        }

        case "governance_and_compliance": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">Active Policies</span>
                  <span class="pillar-score">${c.activePoliciesCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Evaluations</span>
                  <span class="pillar-score">${c.evaluatedRulesCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Passed</span>
                  <span class="pillar-score" style="color: #22c55e;">${c.passedCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Failed</span>
                  <span class="pillar-score" style="color: #ef4444;">${c.failedCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Unknown (No Proof)</span>
                  <span class="pillar-score" style="color: #eab308;">${c.unknownCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Active Waivers</span>
                  <span class="pillar-score">${c.activeExceptionsCount}</span>
                </div>
              </div>
            </div>

            <h4>Evaluated Policies & Findings</h4>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Policy ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Waiver</th>
                  </tr>
                </thead>
                <tbody>
                  ${c.evaluations
                    .map(
                      (ev) => `<tr>
                    <td><code>${escapeHtml(ev.policyId)}</code></td>
                    <td><strong>${escapeHtml(ev.policyTitle)}</strong></td>
                    <td>${escapeHtml(ev.category)}</td>
                    <td><span class="badge ${ev.severity === "critical" || ev.severity === "high" ? "badge-error" : "badge-info"}">${ev.severity.toUpperCase()}</span></td>
                    <td><span class="badge ${ev.status === "pass" ? "badge-success" : ev.status === "fail" ? "badge-error" : "badge-warning"}">${ev.status.toUpperCase()}</span></td>
                    <td>${ev.hasActiveException ? `Waiver (${escapeHtml(ev.exceptionId || "active")})` : "-"}</td>
                  </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            ${
              c.frameworkCoverage.length > 0
                ? `<h4>Qualified Framework Alignments</h4>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Framework</th>
                        <th>Mapped Controls</th>
                        <th>Support Strength</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${c.frameworkCoverage
                        .map(
                          (fc) => `<tr>
                        <td><strong>${escapeHtml(fc.frameworkName)}</strong></td>
                        <td>${fc.controlsCount} controls</td>
                        <td><span class="badge">${escapeHtml(fc.supportStrength.toUpperCase())}</span></td>
                      </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
                : ""
            }

            <div style="margin-top: 16px; padding: 12px; background: #141414; border: 1px solid #262626; border-radius: 6px; font-size: 12px; color: #858585;">
              <strong>Non-Certification Notice:</strong> ${escapeHtml(c.disclaimer)}
            </div>
          `;
          break;
        }

        case "migration_and_evolution": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">Strategy</span>
                  <span class="pillar-score" style="font-size: 14px;">${escapeHtml(c.strategyName)}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Requirements</span>
                  <span class="pillar-score">${c.totalRequirementsCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Waves / Tasks</span>
                  <span class="pillar-score">${c.totalWavesCount} / ${c.totalTasksCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Estimated Effort</span>
                  <span class="pillar-score">${c.estimatedTotalEffortHours}h</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Critical Risks</span>
                  <span class="pillar-score" style="color: ${c.criticalRisksCount > 0 ? "#ef4444" : "#22c55e"};">${c.criticalRisksCount}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Gates Status</span>
                  <span class="pillar-score" style="color: ${c.failedGatesCount > 0 ? "#ef4444" : "#22c55e"};">${c.passedGatesCount}P / ${c.failedGatesCount}F</span>
                </div>
              </div>
            </div>

            <h4>Migration Waves & Execution Path</h4>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Wave</th>
                    <th>Title</th>
                    <th>Objective</th>
                    <th>Tasks</th>
                    <th>Status</th>
                    <th>Rollback</th>
                  </tr>
                </thead>
                <tbody>
                  ${c.waves
                    .map(
                      (w) => `<tr>
                    <td><strong>Wave ${w.waveNumber}</strong></td>
                    <td>${escapeHtml(w.title)}</td>
                    <td>${escapeHtml(w.objective)}</td>
                    <td>${w.tasksCount} tasks</td>
                    <td><span class="badge ${w.status === "completed" ? "badge-success" : w.status === "active" ? "badge-info" : "badge-warning"}">${w.status.toUpperCase()}</span></td>
                    <td><span class="badge ${w.isIrreversible ? "badge-error" : "badge-success"}">${w.isIrreversible ? "IRREVERSIBLE" : "Reversible"}</span></td>
                  </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            ${
              c.risks.length > 0
                ? `<h4>Migration Risks & Mitigation Actions</h4>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Risk ID</th>
                        <th>Category</th>
                        <th>Severity</th>
                        <th>Failure Mode</th>
                        <th>Mitigation Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${c.risks
                        .map(
                          (r) => `<tr>
                        <td><code>${escapeHtml(r.id)}</code></td>
                        <td>${escapeHtml(r.category)}</td>
                        <td><span class="badge ${r.severity === "critical" || r.severity === "high" ? "badge-error" : "badge-warning"}">${r.severity.toUpperCase()}</span></td>
                        <td>${escapeHtml(r.failureMode)}</td>
                        <td>${escapeHtml(r.mitigationPlan)}</td>
                      </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
                : ""
            }
          `;
          break;
        }

        case "operational_readiness_and_dr": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">Readiness Status</span>
                  <span class="pillar-score" style="color: ${c.overallReadinessStatus === "ready" ? "#22c55e" : "#FFAA00"};">${escapeHtml(c.overallReadinessStatus.toUpperCase())}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Readiness Score</span>
                  <span class="pillar-score">${c.overallScorePercent}%</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Tier 1 Runbooks</span>
                  <span class="pillar-score">${c.tier1RunbookCoveragePercent}%</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Scenarios</span>
                  <span class="pillar-score">${c.totalScenarios}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">DR Critical Path</span>
                  <span class="pillar-score">${c.criticalPathSeconds}s</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">DR DAG Cycles</span>
                  <span class="pillar-score" style="color: ${c.hasRecoveryCycles ? "#ef4444" : "#22c55e"};">${c.hasRecoveryCycles ? "CYCLES" : "NONE"}</span>
                </div>
              </div>
            </div>

            <h4>8-Dimension Operational Readiness Matrix</h4>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>Status</th>
                    <th>Coverage</th>
                    <th>Assessment Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${c.dimensionScores
                    .map(
                      (d) => `<tr>
                    <td><strong>${escapeHtml(d.dimension.toUpperCase())}</strong></td>
                    <td><span class="badge ${d.status === "ready" ? "badge-success" : d.status === "not_ready" ? "badge-error" : "badge-warning"}">${d.status.toUpperCase()}</span></td>
                    <td>${d.coveragePercent}%</td>
                    <td>${escapeHtml(d.note)}</td>
                  </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            ${
              c.scenarios.length > 0
                ? `<h4>Critical Failure Scenarios & Blast Radius</h4>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Scenario ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Severity</th>
                        <th>Blast Radius</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${c.scenarios
                        .map(
                          (s) => `<tr>
                        <td><code>${escapeHtml(s.id)}</code></td>
                        <td>${escapeHtml(s.title)}</td>
                        <td>${escapeHtml(s.category)}</td>
                        <td><span class="badge ${s.severity === "SEV1" || s.severity === "SEV2" ? "badge-error" : "badge-warning"}">${s.severity}</span></td>
                        <td><strong>${s.blastRadiusScore}/100</strong></td>
                      </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
                : ""
            }

            ${
              c.recoveryObjectives.length > 0
                ? `<h4>Disaster Recovery Objectives (RTO & RPO)</h4>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Target RTO</th>
                        <th>Target RPO</th>
                        <th>RTO Drill Verified</th>
                        <th>RPO Drill Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${c.recoveryObjectives
                        .map(
                          (o) => `<tr>
                        <td><strong>${escapeHtml(o.serviceName)}</strong></td>
                        <td>${o.rtoTargetSeconds}s</td>
                        <td>${o.rpoTargetSeconds}s</td>
                        <td><span class="badge ${o.isRtoVerified ? "badge-success" : "badge-warning"}">${o.isRtoVerified ? "VERIFIED" : "UNVERIFIED"}</span></td>
                        <td><span class="badge ${o.isRpoVerified ? "badge-success" : "badge-warning"}">${o.isRpoVerified ? "VERIFIED" : "UNVERIFIED"}</span></td>
                      </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
                : ""
            }
          `;
          break;
        }

        case "architecture_verification_and_readiness": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">Pass Rate</span>
                  <span class="pillar-score" style="color: ${c.passRatePercent >= 80 ? "#22c55e" : "#FFAA00"};">${c.passRatePercent}%</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Passed Tests</span>
                  <span class="pillar-score" style="color: #22c55e;">${c.passedTests} / ${c.totalTests}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Failed Tests</span>
                  <span class="pillar-score" style="color: ${c.failedTests > 0 ? "#ef4444" : "#858585"};">${c.failedTests}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Req Coverage</span>
                  <span class="pillar-score">${c.coverage.requirementCoveragePercent}%</span>
                </div>
              </div>
            </div>

            <div class="field-group">
              <h4>Readiness Gates</h4>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Gate ID</th>
                      <th>Status</th>
                      <th>Passed</th>
                      <th>Failed</th>
                      <th>Blocking Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.readinessGates
                      .map(
                        (g) => `<tr>
                      <td><code>${escapeHtml(g.gateId)}</code></td>
                      <td><span class="badge ${g.status === "passed" ? "badge-success" : g.status === "approved_with_exception" ? "badge-info" : "badge-error"}">${escapeHtml(g.status.toUpperCase())}</span></td>
                      <td>${g.passedTestsCount}</td>
                      <td>${g.failedTestsCount}</td>
                      <td>${escapeHtml(g.blockingReasons.join("; ") || "None")}</td>
                    </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="field-group">
              <h4>Test Results</h4>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Test ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.tests
                      .map(
                        (t) => `<tr>
                      <td><code>${escapeHtml(t.id)}</code></td>
                      <td>${escapeHtml(t.title)}</td>
                      <td>${escapeHtml(t.category)}</td>
                      <td><span class="badge ${t.severity === "critical" ? "badge-error" : "badge-warning"}">${t.severity.toUpperCase()}</span></td>
                      <td><span class="badge ${t.status === "pass" ? "badge-success" : t.status === "unknown" ? "badge-warning" : "badge-error"}">${t.status.toUpperCase()}</span></td>
                      <td>${escapeHtml(t.explanation)}</td>
                    </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
          `;
          break;
        }

        case "unified_architecture_intelligence": {
          const c = section.content;
          bodyHtml = `
            <div class="field-group">
              <div class="pillar-grid">
                <div class="pillar-box">
                  <span class="pillar-name">Health Score</span>
                  <span class="pillar-score" style="color: ${c.healthScore >= 80 ? "#22c55e" : "#FFAA00"};">${c.healthScore}/100</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Status</span>
                  <span class="pillar-score" style="color: #22c55e;">${escapeHtml(c.completenessStatus.toUpperCase())}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Analyzers Run</span>
                  <span class="pillar-score">${c.analyzersCompleted} / ${c.analyzersRun}</span>
                </div>
                <div class="pillar-box">
                  <span class="pillar-name">Total Findings</span>
                  <span class="pillar-score" style="color: ${c.findingsSummary.critical > 0 ? "#ef4444" : "#858585"};">${c.findingsSummary.total}</span>
                </div>
              </div>
            </div>

            ${c.correlationGroups.length > 0 ? `
            <div class="field-group">
              <h4>Compound Architectural Vulnerabilities (Correlation Groups)</h4>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Correlation Group</th>
                      <th>Affected Components</th>
                      <th>Findings</th>
                      <th>Candidate Root Cause & Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.correlationGroups
                      .map(
                        (cg) => `<tr>
                      <td><strong>${escapeHtml(cg.title)}</strong></td>
                      <td><code>${escapeHtml(cg.sharedComponentIds.join(", "))}</code></td>
                      <td>${cg.findingsCount}</td>
                      <td>
                        <div><strong>Cause:</strong> ${escapeHtml(cg.candidateRootCause)}</div>
                        <div style="margin-top: 4px; color: #b5b5b5;"><strong>Action:</strong> ${escapeHtml(cg.recommendedUnifiedAction)}</div>
                      </td>
                    </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>` : ""}

            ${c.contradictions.length > 0 ? `
            <div class="field-group">
              <h4>Architectural Contradictions & Conflict Detections</h4>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Involved Analyzers</th>
                      <th>Components</th>
                      <th>Explanation & Resolution Guidance</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.contradictions
                      .map(
                        (ct) => `<tr>
                      <td><code>${escapeHtml(ct.type)}</code></td>
                      <td>${escapeHtml(ct.involvedAnalyzers.join(", "))}</td>
                      <td><code>${escapeHtml(ct.affectedComponents.join(", "))}</code></td>
                      <td>
                        <div style="color: #ef4444;">${escapeHtml(ct.explanation)}</div>
                        <div style="margin-top: 4px; color: #b5b5b5;">${escapeHtml(ct.resolutionGuidance)}</div>
                      </td>
                    </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>` : ""}

            ${c.unifiedRecommendations.length > 0 ? `
            <div class="field-group">
              <h4>Unified Architecture Recommendations</h4>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Recommendation</th>
                      <th>Severity</th>
                      <th>Effort</th>
                      <th>Affected</th>
                      <th>Remediation Steps</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${c.unifiedRecommendations
                      .map(
                        (r) => `<tr>
                      <td><strong>${escapeHtml(r.title)}</strong></td>
                      <td><span class="badge ${r.severity === "critical" ? "badge-error" : "badge-warning"}">${escapeHtml(r.severity.toUpperCase())}</span></td>
                      <td>${escapeHtml(r.effort)}</td>
                      <td><code>${escapeHtml(r.affectedComponentIds.join(", "))}</code></td>
                      <td>${escapeHtml(r.remediationSteps.join("; "))}</td>
                    </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>` : ""}
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
