import { describe, it, expect } from "vitest";
import { architectureGovernanceEngine } from "../governance/engine/governance-engine";
import { PolicyRegistry } from "../governance/registry/policy-registry";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import { SectionComposer } from "../reports/engine/section-composer";
import { SourceResolver } from "../reports/engine/source-resolver";
import { MarkdownExporter } from "../reports/exporters/markdown-exporter";
import { HtmlExporter } from "../reports/exporters/html-exporter";
import type { GovernanceArchitectureTopology } from "../governance/contracts/governance.types";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ArchitectureReport } from "../reports/contracts/report.types";

describe("Phase 05.3.25 — Governance Engine End-to-End Integration, AI Tool #28 & Reports", () => {
  const now = new Date().toISOString();

  const sampleTopology: GovernanceArchitectureTopology = {
    id: "top-e2e-1",
    projectId: "proj-enterprise",
    architectureId: "arch-main",
    graphRevision: "rev-10",
    version: 1,
    policies: PolicyRegistry.getAllPolicies(),
    bundles: PolicyRegistry.getAllBundles(),
    evidence: [
      {
        id: "ev-graph-1",
        evidenceType: "architecture_graph",
        sourceIdentifier: "graph_rev_10",
        observedAt: now,
        freshnessWindowSeconds: 86400 * 30,
        integrityHash: "sha256-graph123456",
        content: { isValidGraph: true },
        owner: "ArchitectureTeam",
        provenance: {
          source: "system_guardrail",
          author: "NXTQR Core",
          timestamp: now,
          confirmed: true,
        },
      },
      {
        id: "ev-deploy-1",
        evidenceType: "deployment_metadata",
        sourceIdentifier: "deploy_k8s_spec",
        observedAt: now,
        freshnessWindowSeconds: 86400 * 30,
        integrityHash: "sha256-deploy123456",
        content: { isMultiAz: true, path: { hasPlaintextHop: false } },
        owner: "InfraOps",
        provenance: {
          source: "system_guardrail",
          author: "Terraform",
          timestamp: now,
          confirmed: true,
        },
      },
      {
        id: "ev-tls-1",
        evidenceType: "security_configuration",
        sourceIdentifier: "tls_audit_rev_10",
        resourceId: "service-gateway",
        observedAt: now,
        freshnessWindowSeconds: 86400 * 7,
        integrityHash: "sha256-1234567890abcdef",
        content: { tlsEnforced: true, minVersion: "TLS_1_3" },
        owner: "SecOps",
        provenance: {
          source: "system_guardrail",
          author: "NXTQR Scanner",
          timestamp: now,
          confirmed: true,
        },
      },
      {
        id: "ev-backup-1",
        evidenceType: "backup_verification",
        sourceIdentifier: "rds_backup_plan",
        resourceId: "db-primary",
        observedAt: now,
        freshnessWindowSeconds: 86400 * 2,
        integrityHash: "sha256-backup123456",
        content: { backupFrequencyHours: 12 },
        owner: "DBA",
        provenance: {
          source: "system_guardrail",
          author: "RDS Bot",
          timestamp: now,
          confirmed: true,
        },
      },
    ],
    exceptions: [],
    baselines: [],
    resources: [
      {
        id: "service-gateway",
        name: "Enterprise Ingress Gateway",
        environment: "production",
        componentType: "api_gateway",
        dataClassification: "internal",
        geographicRegion: "us-east-1",
        tags: ["ingress", "edge"],
        properties: {
          hasApprovedGateway: true,
          tlsEnforced: true,
          ingress: { hasApprovedGateway: true },
          database: { isPubliclyAccessible: false },
        },
      },
      {
        id: "db-primary",
        name: "PostgreSQL Primary Cluster",
        environment: "production",
        componentType: "database",
        dataClassification: "confidential",
        geographicRegion: "us-east-1",
        tags: ["storage", "relational"],
        properties: {
          isMultiAz: true,
          isEncryptedAtRest: true,
          backupFrequencyHours: 12,
          database: { isPubliclyAccessible: false },
          ingress: { hasApprovedGateway: true },
        },
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  it("analyzes topology and calculates aggregate governance metrics", () => {
    const result = architectureGovernanceEngine.analyzeTopology(sampleTopology);

    expect(result.summary.totalPoliciesCount).toBeGreaterThanOrEqual(13);
    expect(result.summary.evaluatedRulesCount).toBeGreaterThan(0);
    expect(result.evaluations.length).toBe(result.summary.evaluatedRulesCount);
    expect(result.summary.passedCount).toBeGreaterThan(0);
  });

  it("executes AI Assistant Tool #28: get_governance_and_compliance_intelligence", async () => {
    const mockNodes: BaseNode[] = [
      {
        id: "node-gw",
        type: "api_gateway",
        position: { x: 0, y: 0 },
        data: {
          label: "API Gateway",
          environment: "production",
          hasApprovedGateway: true,
          tlsEnforced: true,
        },
      },
    ];

    const execResult = await architectureToolRegistry.executeTool(
      "get_governance_and_compliance_intelligence",
      {
        includeStandardBundles: true,
        includeDriftAnalysis: true,
        includeRemediationPlan: true,
      },
      {
        projectId: "proj-ai-test",
        architectureId: "arch-ai-test",
        graphRevision: "rev-1",
        nodes: mockNodes,
        edges: [],
      }
    );

    expect(execResult.success).toBe(true);
    const data = execResult.result as any;
    expect(data.summary).toBeDefined();
    expect(data.summary.totalPoliciesCount).toBeGreaterThanOrEqual(13);
    expect(data.frameworksSupported).toContain("NIST SP 800-53 Rev. 5");
    expect(data.frameworksSupported).toContain("SOC 2 TSC 2017");
    expect(data.disclaimer).toContain("Technical architecture verification only");
  });

  it("composes governance_and_compliance report section and exports to Markdown and HTML", () => {
    const mockNodes: BaseNode[] = [
      {
        id: "node-api",
        type: "service",
        position: { x: 0, y: 0 },
        data: { label: "API Service" },
      },
    ];
    const mockEdges: BaseEdge[] = [];

    const sections = SectionComposer.composeSections({
      nodes: mockNodes,
      edges: mockEdges,
      topology: SourceResolver.resolveTopology(mockNodes, mockEdges),
      evidence: [],
      analysisContext: {
        governanceTopology: sampleTopology,
      },
      audience: "architecture_review",
      enabledKinds: ["governance_and_compliance"],
    });

    expect(sections.length).toBe(1);
    const govSec = sections[0] as any;
    expect(govSec.kind).toBe("governance_and_compliance");
    expect(govSec.content.totalPoliciesCount).toBeGreaterThan(0);
    expect(govSec.content.disclaimer).toContain("Non-Certification");

    const report: ArchitectureReport = {
      id: "rep-gov-1",
      projectId: "proj-1",
      architectureId: "arch-1",
      sourceSnapshotId: "snap-1",
      graphRevision: "rev-1",
      templateId: "architecture_review",
      templateVersion: 1,
      audience: "architecture_review",
      title: "Architecture Governance Review",
      status: "verified",
      sections,
      evidence: [],
      assumptions: [],
      decisions: [],
      generatedAt: now,
      author: "Antigravity",
      versionNumber: 1,
    };

    // Test Markdown Export
    const md = MarkdownExporter.export(report).content;
    expect(md).toContain("Architecture Compliance, Governance & Policy-as-Code Intelligence");
    expect(md).toContain("Active Policies:");
    expect(md).toContain("Non-Certification Notice");

    // Test HTML Export
    const html = HtmlExporter.export(report).content;
    expect(html).toContain("Architecture Compliance, Governance");
    expect(html).toContain("Active Policies");
    expect(html).toContain("Non-Certification Notice");
  });
});
