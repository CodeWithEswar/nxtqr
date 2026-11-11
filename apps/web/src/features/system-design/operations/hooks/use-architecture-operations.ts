"use client";

/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * React Hook for Operational Readiness & Incident State Management
 */

import { useState, useMemo } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  architectureOperationsEngine,
  incidentScenarioRegistry,
  TabletopEngine,
  type OperationalProject,
  type OperationsAnalysisResult,
  type TabletopExercise,
} from "@nxtqr/architecture-intelligence";

export interface OperationalScenarioOption {
  id: string;
  name: string;
  description: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
}

export function useArchitectureOperations() {
  // Built-in Architecture Scenarios
  const scenarios: OperationalScenarioOption[] = useMemo(
    () => [
      {
        id: "ecommerce-platform",
        name: "E-Commerce Cloud Architecture (Multi-Tier)",
        description: "Cloud-native microservices with API Gateway, Order/Payment services, PostgreSQL, and Redis Cache.",
        nodes: [
          { id: "api-gw", type: "custom", position: { x: 50, y: 120 }, data: { label: "API Gateway", nodeType: "gateway", region: "us-east-1" } },
          { id: "auth-svc", type: "custom", position: { x: 250, y: 40 }, data: { label: "Auth Service", nodeType: "service", region: "us-east-1" } },
          { id: "order-svc", type: "custom", position: { x: 250, y: 140 }, data: { label: "Order Service", nodeType: "service", region: "us-east-1" } },
          { id: "payment-svc", type: "custom", position: { x: 250, y: 240 }, data: { label: "Payment Service", nodeType: "service", region: "us-east-1" } },
          { id: "primary-db", type: "custom", position: { x: 450, y: 100 }, data: { label: "PostgreSQL Primary", nodeType: "database", region: "us-east-1" } },
          { id: "redis-cache", type: "custom", position: { x: 450, y: 200 }, data: { label: "Redis Cluster", nodeType: "cache", region: "us-east-1" } },
        ],
        edges: [
          { id: "e1", source: "api-gw", target: "auth-svc", type: "smoothstep", data: {} },
          { id: "e2", source: "api-gw", target: "order-svc", type: "smoothstep", data: {} },
          { id: "e3", source: "order-svc", target: "payment-svc", type: "smoothstep", data: {} },
          { id: "e4", source: "order-svc", target: "primary-db", type: "smoothstep", data: {} },
          { id: "e5", source: "payment-svc", target: "primary-db", type: "smoothstep", data: {} },
          { id: "e6", source: "order-svc", target: "redis-cache", type: "smoothstep", data: {} },
        ],
      },
      {
        id: "fintech-enclave",
        name: "FinTech High-Assurance Enclave (Multi-Region)",
        description: "Regulated ledger processing enclave with synchronous dual-region database replication.",
        nodes: [
          { id: "edge-waf", type: "custom", position: { x: 50, y: 100 }, data: { label: "Edge WAF & Gateway", nodeType: "gateway", region: "us-east-1" } },
          { id: "ledger-svc", type: "custom", position: { x: 250, y: 60 }, data: { label: "Ledger Service", nodeType: "service", region: "us-east-1" } },
          { id: "compliance-svc", type: "custom", position: { x: 250, y: 160 }, data: { label: "Audit & Compliance Service", nodeType: "service", region: "us-east-1" } },
          { id: "aurora-primary", type: "custom", position: { x: 450, y: 60 }, data: { label: "Aurora Global DB (Primary)", nodeType: "database", region: "us-east-1" } },
          { id: "aurora-secondary", type: "custom", position: { x: 450, y: 160 }, data: { label: "Aurora Global DB (Secondary)", nodeType: "database", region: "eu-central-1" } },
        ],
        edges: [
          { id: "ef1", source: "edge-waf", target: "ledger-svc", type: "smoothstep", data: {} },
          { id: "ef2", source: "ledger-svc", target: "compliance-svc", type: "smoothstep", data: {} },
          { id: "ef3", source: "ledger-svc", target: "aurora-primary", type: "smoothstep", data: {} },
          { id: "ef4", source: "compliance-svc", target: "aurora-secondary", type: "smoothstep", data: {} },
          { id: "ef5", source: "aurora-primary", target: "aurora-secondary", type: "smoothstep", data: {} },
        ],
      },
    ],
    []
  );

  const [activeScenarioId, setActiveScenarioId] = useState<string>("ecommerce-platform");
  const activeArchitecture = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const allStandardScenarios = useMemo(() => incidentScenarioRegistry.getAllScenarios(), []);
  const [selectedIncidentScenarioId, setSelectedIncidentScenarioId] = useState<string>(
    allStandardScenarios[0]?.id || "SCN-DB-FAILOVER-001"
  );
  const selectedIncidentScenario =
    allStandardScenarios.find((s) => s.id === selectedIncidentScenarioId) || allStandardScenarios[0];

  // Base Operational Project
  const defaultProject: OperationalProject = useMemo(() => {
    return {
      id: `op-proj-${activeArchitecture.id}`,
      architectureId: activeArchitecture.id,
      architectureRevisionId: "rev-2026.11",
      title: `${activeArchitecture.name} — Operational Readiness Baseline`,
      scenarios: allStandardScenarios,
      journeys: [
        {
          id: "journey-checkout",
          title: "Critical Checkout & Payment Flow",
          description: "End-to-end checkout authorization and inventory reservation",
          entryPointComponentId: "api-gw",
          traversedComponentIds: ["api-gw", "order-svc", "payment-svc", "primary-db"],
          recoveryPriority: 1,
          maxAllowedDowntimeSeconds: 120,
        },
        {
          id: "journey-login",
          title: "User Authentication & JWT Issuance",
          description: "OAuth token issuance and session creation",
          entryPointComponentId: "api-gw",
          traversedComponentIds: ["api-gw", "auth-svc"],
          recoveryPriority: 2,
          maxAllowedDowntimeSeconds: 300,
        },
      ],
      ownerships: activeArchitecture.nodes.map((n) => ({
        id: `own-${n.id}`,
        serviceId: n.id,
        primaryOwner: "lead-oncall@nxtqr.internal",
        secondaryOwner: "eng-director@nxtqr.internal",
        team: "Platform Engineering",
        escalationPolicyId: "esc-tier1",
        onCallRotation: "24/7 Primary Rotation (PagerDuty)",
        lastVerifiedAt: new Date().toISOString(),
      })),
      escalationPolicies: [
        {
          id: "esc-tier1",
          name: "Tier 1 Mission-Critical Escalation",
          levels: [
            {
              levelNumber: 1,
              delayMinutes: 0,
              notifyRoles: ["incident_commander", "technical_lead"],
              targetChannel: "#incidents-critical",
              targetRoleName: "Primary On-Call Responder",
            },
            {
              levelNumber: 2,
              delayMinutes: 15,
              notifyRoles: ["recovery_engineer"],
              targetChannel: "#incidents-critical",
              targetRoleName: "Staff Database Administrator",
            },
            {
              levelNumber: 3,
              delayMinutes: 30,
              notifyRoles: ["communications_lead"],
              targetChannel: "#incidents-critical",
              targetRoleName: "Engineering VP",
            },
          ],
          fallbackContact: "noc-escalations@nxtqr.internal",
          acknowledgementTimeoutMinutes: 5,
        },
      ],
      runbooks: [
        {
          id: "RB-DB-001",
          title: "Primary PostgreSQL Crash & Replica Promotion",
          purpose: "Safely failover to secondary replica without data loss",
          applicableComponentIds: ["primary-db", "aurora-primary"],
          incidentScenarioIds: ["SCN-DB-FAILOVER-001"],
          revision: "1.2.0",
          steps: [
            {
              id: "st-1",
              stepNumber: 1,
              type: "observation",
              title: "Check Ingress Error Spikes",
              details: "Inspect edge metrics for 5xx errors and connection pool wait time.",
              isDestructive: false,
              requiresApproval: false,
              estimatedMinutes: 3,
            },
            {
              id: "st-2",
              stepNumber: 2,
              type: "decision",
              title: "Evaluate Replication Lag Threshold",
              details: "Verify replica lag is under 15 seconds. If higher, initiate read-only degraded mode.",
              isDestructive: false,
              requiresApproval: false,
              estimatedMinutes: 2,
            },
            {
              id: "st-3",
              stepNumber: 3,
              type: "recovery",
              title: "Promote Secondary Warm Standby",
              details: "Execute DNS switchover to promoted node in secondary zone.",
              isDestructive: true,
              requiresApproval: true,
              verificationGate: "Health probe returns HTTP 200 within 15 seconds",
              estimatedMinutes: 5,
            },
            {
              id: "st-4",
              stepNumber: 4,
              type: "verification",
              title: "Verify Write Throughput",
              details: "Execute canary write transaction and verify commit latency under 20ms.",
              isDestructive: false,
              requiresApproval: false,
              estimatedMinutes: 5,
            },
          ],
          safetyWarnings: [
            "Promoting a secondary replica while replication lag > 30s will incur data loss.",
            "Do not execute command without verifying write traffic is paused at gateway.",
          ],
          prerequisites: ["Active incident channel open", "VPN access established"],
          rollbackGuidance: "Revert DNS CNAME back to primary if secondary fails health check within 60s.",
          owner: "data-infra-team",
          reviewDate: new Date().toISOString(),
          isApproved: true,
          approvalReviewer: "Principal Architect",
          tags: ["database", "failover", "tier-1"],
        },
        {
          id: "RB-GW-002",
          title: "API Gateway Edge TLS & Ingress Recovery",
          purpose: "Recover edge traffic during edge proxy blackouts",
          applicableComponentIds: ["api-gw", "edge-waf"],
          incidentScenarioIds: ["SCN-GW-INGRESS-002"],
          revision: "1.1.0",
          steps: [
            {
              id: "gw-1",
              stepNumber: 1,
              type: "observation",
              title: "Verify Certificate Expiration & DNS Probes",
              details: "Check ACM certificate status and Route53 health checks.",
              isDestructive: false,
              requiresApproval: false,
            },
            {
              id: "gw-2",
              stepNumber: 2,
              type: "recovery",
              title: "Reroute Traffic to Standby Gateway Cluster",
              details: "Shift Route53 weighted records from 100/0 to 0/100 towards standby cluster.",
              isDestructive: true,
              requiresApproval: true,
              verificationGate: "Global synthetic probe pass rate > 99%",
            },
          ],
          safetyWarnings: ["Ensure standby gateway capacity is pre-scaled to handle 100% ingress."],
          prerequisites: ["Cloud provider access"],
          rollbackGuidance: "Revert Route53 routing policy to previous weighted values.",
          owner: "edge-networking-team",
          reviewDate: new Date().toISOString(),
          isApproved: true,
          approvalReviewer: "Lead Network Engineer",
          tags: ["gateway", "ingress", "network"],
        },
      ],
      objectives: [
        {
          id: "obj-order-service",
          serviceId: "order-svc",
          serviceName: "Order Service",
          journeyId: "journey-checkout",
          rtoTargetSeconds: 300,
          rpoTargetSeconds: 60,
          supportingStrategyType: "warm_standby",
          observedRtoSeconds: 210,
          observedRpoSeconds: 30,
          isRtoVerified: true,
          isRpoVerified: true,
          evidenceIds: ["ev-drill-baseline"],
        },
        {
          id: "obj-payment-service",
          serviceId: "payment-svc",
          serviceName: "Payment Service",
          journeyId: "journey-checkout",
          rtoTargetSeconds: 180,
          rpoTargetSeconds: 0,
          supportingStrategyType: "hot_standby",
          observedRtoSeconds: 150,
          observedRpoSeconds: 0,
          isRtoVerified: true,
          isRpoVerified: true,
          evidenceIds: ["ev-drill-baseline"],
        },
        {
          id: "obj-primary-db",
          serviceId: "primary-db",
          serviceName: "PostgreSQL Primary",
          journeyId: "journey-checkout",
          rtoTargetSeconds: 600,
          rpoTargetSeconds: 60,
          supportingStrategyType: "warm_standby",
          observedRtoSeconds: 480,
          observedRpoSeconds: 45,
          isRtoVerified: true,
          isRpoVerified: true,
          evidenceIds: ["ev-drill-baseline"],
        },
      ],
      dependencies: [
        { id: "rd-1", sourceComponentId: "api-gw", targetComponentId: "auth-svc", dependencyType: "identity", isBlocking: true },
        { id: "rd-2", sourceComponentId: "auth-svc", targetComponentId: "primary-db", dependencyType: "data", isBlocking: true },
        { id: "rd-3", sourceComponentId: "primary-db", targetComponentId: "order-svc", dependencyType: "infrastructure", isBlocking: true },
        { id: "rd-4", sourceComponentId: "order-svc", targetComponentId: "payment-svc", dependencyType: "infrastructure", isBlocking: true },
      ],
      backupCapabilities: [
        {
          id: "bk-pg-primary",
          componentId: "primary-db",
          componentName: "PostgreSQL Primary Database",
          backupType: "snapshot",
          scheduleExpression: "cron(0 2 * * ? *)",
          retentionDays: 30,
          isEncrypted: true,
          storageLocation: "s3://nxtqr-vault-backups-us-east-1",
          lastSuccessfulBackupAt: new Date().toISOString(),
          lastRestoreTestAt: new Date().toISOString(),
          restoreVerified: true,
          evidenceIds: ["ev-restore-verified"],
        },
      ],
      failoverProcedures: [
        {
          id: "fo-primary",
          componentId: "api-gw",
          primaryRegion: "us-east-1",
          secondaryRegion: "us-west-2",
          failoverType: "automatic",
          healthCheckType: "HTTPS Route53 DNS",
          dataSyncLagMaxSeconds: 30,
          failbackProcedure: "Gradually steer 10% traffic back after 1 hour zero errors.",
          readinessVerified: true,
          readinessNotes: ["Geographically distinct failover region confirmed: us-west-2."],
        },
      ],
      tabletopExercises: [
        {
          id: "ttx-q3-db",
          title: "Q3 Primary Database Disaster Recovery Tabletop",
          scenarioId: "SCN-DB-FAILOVER-001",
          facilitator: "Lead Architect",
          participants: [
            { name: "Alice (Commander)", role: "incident_commander" },
            { name: "Bob (Tech Lead)", role: "technical_lead" },
            { name: "Charlie (DBA)", role: "recovery_engineer" },
          ],
          scheduledDate: new Date().toISOString().slice(0, 10),
          status: "completed",
          assumptions: ["Secondary replica warm standby ready", "DNS switchover under 30s"],
          injects: [],
          observations: [
            {
              id: "obs-1",
              timestampMinute: 15,
              observer: "Lead Architect",
              note: "Team identified connection pool saturation within 3 minutes of inject.",
              wasExpected: true,
            },
            {
              id: "obs-2",
              timestampMinute: 35,
              observer: "Lead Architect",
              note: "Standby promotion executed cleanly with 12s observed replication lag.",
              wasExpected: true,
            },
          ],
          findings: ["Verify automatic DNS TTL is clamped to 15s in client connection pools."],
          actionItems: [
            { task: "Update client JDBC driver connection timeout settings", owner: "Backend Team", dueDate: "2026-12-01" },
          ],
          completedAt: new Date().toISOString(),
        },
      ],
      evidence: [
        {
          id: "ev-drill-baseline",
          evidenceType: "failover_drill",
          sourceUri: "audit://drills/2026-q3-baseline",
          contentHash: "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
          recordedAt: new Date().toISOString(),
          verifiedBy: "sec-ops@nxtqr.internal",
          notes: "Verified secondary gateway and warm standby takeover under simulated outage.",
        },
      ],
    };
  }, [activeArchitecture, allStandardScenarios]);

  // Simulation Trigger State (What-If Scenarios)
  const [simulationPreset, setSimulationPreset] = useState<string | null>(null);

  // Computed Analysis Result
  const analysisResult: OperationsAnalysisResult = useMemo(() => {
    // If simulation preset is active, inject modified conditions:
    const projectCopy: OperationalProject = JSON.parse(JSON.stringify(defaultProject));

    if (simulationPreset === "missing_backup_restore") {
      // Invalidate backup test
      projectCopy.backupCapabilities[0].restoreVerified = false;
      projectCopy.backupCapabilities[0].lastRestoreTestAt = undefined;
    } else if (simulationPreset === "recovery_cycle_deadlock") {
      // Inject cycle: primary-db -> api-gw
      projectCopy.dependencies.push({
        id: "dep-cycle-hack",
        sourceComponentId: "payment-svc",
        targetComponentId: "api-gw",
        dependencyType: "infrastructure",
        isBlocking: true,
      });
    } else if (simulationPreset === "unverified_rto_breach") {
      // Set observed RTO to 1200s (target is 300s)
      projectCopy.objectives[0].observedRtoSeconds = 1200;
    }

    return architectureOperationsEngine.analyzeOperations(
      projectCopy,
      activeArchitecture.nodes,
      activeArchitecture.edges
    );
  }, [defaultProject, activeArchitecture, simulationPreset]);

  // Selected Runbook
  const [selectedRunbookId, setSelectedRunbookId] = useState<string>(
    defaultProject.runbooks[0]?.id || "RB-DB-001"
  );
  const selectedRunbook =
    defaultProject.runbooks.find((r) => r.id === selectedRunbookId) || defaultProject.runbooks[0];

  // Active Tabletop Exercise
  const [activeExercise, setActiveExercise] = useState<TabletopExercise>(() =>
    TabletopEngine.generateExercisePlan(selectedIncidentScenario)
  );

  const handleSelectScenario = (scenarioId: string) => {
    setSelectedIncidentScenarioId(scenarioId);
    const sc = allStandardScenarios.find((s) => s.id === scenarioId) || allStandardScenarios[0];
    setActiveExercise(TabletopEngine.generateExercisePlan(sc));
  };

  return {
    scenarios,
    activeArchitecture,
    setActiveScenarioId,
    allStandardScenarios,
    selectedIncidentScenario,
    handleSelectScenario,
    analysisResult,
    selectedRunbook,
    setSelectedRunbookId,
    activeExercise,
    setActiveExercise,
    simulationPreset,
    setSimulationPreset,
  };
}
