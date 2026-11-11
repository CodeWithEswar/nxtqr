import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  architectureOperationsEngine,
  incidentScenarioRegistry,
  architectureToolRegistry,
  SectionComposer,
  MarkdownExporter,
  HtmlExporter,
  type OperationalProject,
} from "../index";
import { SourceResolver } from "../reports/engine/source-resolver";

describe("Phase 05.3.27: Architecture Operations Engine End-to-End Integration", () => {
  const nodes: BaseNode[] = [
    { id: "edge-gateway", type: "custom", position: { x: 0, y: 0 }, data: { label: "Edge API Gateway", nodeType: "gateway" } },
    { id: "auth-service", type: "custom", position: { x: 150, y: 0 }, data: { label: "Auth Service", nodeType: "service" } },
    { id: "orders-service", type: "custom", position: { x: 300, y: 0 }, data: { label: "Orders Service", nodeType: "service" } },
    { id: "postgres-primary", type: "custom", position: { x: 450, y: 0 }, data: { label: "PostgreSQL Database", nodeType: "database" } },
  ];

  const edges: BaseEdge[] = [
    { id: "e1", source: "edge-gateway", target: "auth-service", type: "smoothstep", data: {} },
    { id: "e2", source: "edge-gateway", target: "orders-service", type: "smoothstep", data: {} },
    { id: "e3", source: "orders-service", target: "postgres-primary", type: "smoothstep", data: {} },
  ];

  const project: OperationalProject = {
    id: "proj-integration-1",
    architectureId: "arch-integration",
    architectureRevisionId: "rev-integration-1",
    title: "Integration Test Operational Project",
    scenarios: incidentScenarioRegistry.getAllScenarios().slice(0, 3),
    journeys: [
      {
        id: "journey-order",
        title: "Order Placement Flow",
        description: "Customer cart conversion",
        entryPointComponentId: "edge-gateway",
        traversedComponentIds: ["edge-gateway", "orders-service", "postgres-primary"],
        recoveryPriority: 1,
        maxAllowedDowntimeSeconds: 120,
      },
    ],
    ownerships: nodes.map((n) => ({
      id: `own-${n.id}`,
      serviceId: n.id,
      primaryOwner: "lead-oncall@nxtqr.internal",
      team: "Platform Core",
      escalationPolicyId: "esc-1",
    })),
    escalationPolicies: [
      {
        id: "esc-1",
        name: "Tier 1 Critical Escalation",
        levels: [
          {
            levelNumber: 1,
            delayMinutes: 0,
            notifyRoles: ["incident_commander"],
            targetChannel: "#incidents",
            targetRoleName: "On-Call Lead",
          },
        ],
        fallbackContact: "noc@nxtqr.internal",
        acknowledgementTimeoutMinutes: 5,
      },
    ],
    runbooks: [
      {
        id: "rb-db-failover",
        title: "Database Failover Procedure",
        purpose: "Recover from primary database crash",
        applicableComponentIds: ["postgres-primary"],
        incidentScenarioIds: ["SCN-DB-FAILOVER-001"],
        revision: "1.0.0",
        steps: [
          {
            id: "s1",
            stepNumber: 1,
            type: "observation",
            title: "Check Lag",
            details: "Read lag",
            isDestructive: false,
            requiresApproval: false,
          },
          {
            id: "s2",
            stepNumber: 2,
            type: "recovery",
            title: "Promote Replica",
            details: "Run promote",
            isDestructive: true,
            requiresApproval: true,
            verificationGate: "HTTP 200 within 30s",
          },
        ],
        safetyWarnings: ["Ensure lag is under 10s"],
        prerequisites: ["VPN access"],
        rollbackGuidance: "Revert DNS pointer if replication error occurs.",
        owner: "data-team",
        reviewDate: new Date().toISOString(),
        isApproved: true,
      },
    ],
    objectives: [
      {
        id: "obj-orders",
        serviceId: "orders-service",
        serviceName: "Orders Service",
        rtoTargetSeconds: 300,
        rpoTargetSeconds: 60,
        supportingStrategyType: "warm_standby",
        observedRtoSeconds: 210,
        observedRpoSeconds: 35,
        isRtoVerified: true,
        isRpoVerified: true,
        evidenceIds: ["ev-drill-test"],
      },
    ],
    dependencies: [
      { id: "dep-1", sourceComponentId: "edge-gateway", targetComponentId: "auth-service", dependencyType: "identity", isBlocking: true },
      { id: "dep-2", sourceComponentId: "auth-service", targetComponentId: "postgres-primary", dependencyType: "data", isBlocking: true },
      { id: "dep-3", sourceComponentId: "postgres-primary", targetComponentId: "orders-service", dependencyType: "infrastructure", isBlocking: true },
    ],
    backupCapabilities: [
      {
        id: "bk-postgres",
        componentId: "postgres-primary",
        componentName: "PostgreSQL Database",
        backupType: "snapshot",
        scheduleExpression: "cron(0 2 * * ? *)",
        retentionDays: 30,
        isEncrypted: true,
        storageLocation: "s3://backups-vault-encrypted",
        lastSuccessfulBackupAt: new Date().toISOString(),
        lastRestoreTestAt: new Date().toISOString(),
        restoreVerified: true,
        evidenceIds: ["ev-restore-test"],
      },
    ],
    failoverProcedures: [
      {
        id: "fo-gateway",
        componentId: "edge-gateway",
        primaryRegion: "us-east-1",
        secondaryRegion: "eu-central-1",
        failoverType: "automatic",
        healthCheckType: "HTTPS Route53",
        dataSyncLagMaxSeconds: 30,
        failbackProcedure: "Gradually steer 10% traffic back after 1 hour zero errors.",
        readinessVerified: true,
        readinessNotes: ["Geographically distinct failover region confirmed."],
      },
    ],
    tabletopExercises: [
      {
        id: "ttx-test",
        title: "Database Outage Tabletop Drill",
        scenarioId: "SCN-DB-FAILOVER-001",
        facilitator: "Lead Architect",
        participants: [{ name: "Alice", role: "incident_commander" }],
        scheduledDate: new Date().toISOString().slice(0, 10),
        status: "completed",
        assumptions: ["Warm standby ready"],
        injects: [],
        observations: [],
        findings: [],
        actionItems: [],
        completedAt: new Date().toISOString(),
      },
    ],
    evidence: [
      {
        id: "ev-drill-test",
        evidenceType: "failover_drill",
        sourceUri: "audit://drill-q3",
        contentHash: "sha256:1234567890abcdef",
        recordedAt: new Date().toISOString(),
        verifiedBy: "sec-ops",
        notes: "Passed",
      },
    ],
  };

  it("evaluates complete operational readiness and returns deterministic scores", () => {
    const result = architectureOperationsEngine.analyzeOperations(project, nodes, edges);

    expect(result.summary.totalScenariosCount).toBe(3);
    expect(result.summary.overallReadinessStatus).toBe("ready");
    expect(result.readiness.overallScorePercent).toBeGreaterThanOrEqual(80);
    expect(result.readiness.dimensionScores.length).toBe(8);
    expect(result.recoveryPlan.hasCycles).toBe(false);
    expect(result.recoveryPlan.topologicalSequence.length).toBeGreaterThan(0);
    expect(result.recoveryPlan.criticalPathSeconds).toBeGreaterThan(0);
  });

  it("executes AI Assistant Tool #30 and returns bounded operational readiness intelligence", async () => {
    const tool = architectureToolRegistry.getTool(
      "get_architecture_operational_readiness_and_dr_intelligence"
    );
    expect(tool).toBeDefined();

    const output = (await tool!.execute(
      { includeImpactAnalyses: true, includeRecoveryPlan: true },
      {
        projectId: "proj-1",
        architectureId: "arch-1",
        graphRevision: "rev-1",
        nodes,
        edges,
        operationalProject: project,
      }
    )) as any;

    expect(output.overallReadinessStatus).toBe("ready");
    expect(output.overallScorePercent).toBeGreaterThanOrEqual(80);
    expect(output.summary.scenariosCount).toBe(3);
    expect(output.recoveryPlan).toBeDefined();
    expect(output.recoveryPlan.hasCycles).toBe(false);
  });

  it("generates Architecture Report with operational readiness section and exports to Markdown and HTML", () => {
    const sections = SectionComposer.composeSections({
      nodes,
      edges,
      topology: SourceResolver.resolveTopology(nodes, edges),
      evidence: [],
      audience: "operations",
      enabledKinds: ["overview", "operational_readiness_and_dr"],
      analysisContext: {
        operationalProject: project,
      },
    });

    const opSection = sections.find((s) => s.kind === "operational_readiness_and_dr");
    expect(opSection).toBeDefined();
    expect(opSection?.title).toContain("Incident Response, Disaster Recovery & Operational Readiness");

    const report = {
      id: "rep-operations-test",
      projectId: "proj-1",
      architectureId: "arch-1",
      sourceSnapshotId: "snap-1",
      graphRevision: "rev-1",
      templateId: "technical_architecture_document",
      templateVersion: 1,
      audience: "operations" as const,
      title: "Operational Architecture Report",
      status: "published" as const,
      sections,
      evidence: [],
      assumptions: [],
      decisions: [],
      generatedAt: new Date().toISOString(),
      author: "Antigravity",
      versionNumber: 1,
    };

    // Export to Markdown
    const markdown = MarkdownExporter.export(report).content;
    expect(markdown).toContain("Incident Response, Disaster Recovery & Operational Readiness");
    expect(markdown).toContain("8-Dimension Readiness Matrix");
    expect(markdown).toContain("Recovery Objectives (RTO & RPO)");

    // Export to HTML
    const html = HtmlExporter.export(report).content;
    expect(html).toContain("8-Dimension Operational Readiness Matrix");
    expect(html).toContain("Disaster Recovery Objectives (RTO & RPO)");
  });
});
