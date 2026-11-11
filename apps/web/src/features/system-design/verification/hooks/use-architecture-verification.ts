"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * React Hook for Verification & Quality Gates State Management
 */

import { useState, useMemo } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  architectureVerificationEngine,
  architectureTestRegistry,
  suiteRegistry,
  gateRegistry,
  type VerificationProject,
  type VerificationAnalysisResult,
  type GateException,
} from "@nxtqr/architecture-intelligence";

export interface VerificationScenarioOption {
  id: string;
  name: string;
  description: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
}

export function useArchitectureVerification() {
  // 1. Built-in Topologies
  const scenarios: VerificationScenarioOption[] = useMemo(
    () => [
      {
        id: "ecommerce-platform",
        name: "E-Commerce Cloud Architecture (Multi-Tier)",
        description: "Cloud-native services with API Gateway, Order/Payment microservices, PostgreSQL, and Redis Cache.",
        nodes: [
          {
            id: "api-gw",
            type: "custom",
            position: { x: 50, y: 120 },
            data: {
              label: "API Gateway",
              nodeType: "gateway",
              region: "us-east-1",
              rateLimit: 10000,
              tlsEnforced: true,
              security: { authRequired: true },
            },
          },
          {
            id: "order-svc",
            type: "custom",
            position: { x: 260, y: 60 },
            data: {
              label: "Order Service",
              nodeType: "service",
              region: "us-east-1",
              deadLetterQueue: "dlq-orders-exhausted",
            },
          },
          {
            id: "payment-svc",
            type: "custom",
            position: { x: 260, y: 180 },
            data: {
              label: "Payment Service",
              nodeType: "service",
              region: "us-east-1",
              security: { authRequired: true },
            },
          },
          {
            id: "primary-db",
            type: "custom",
            position: { x: 480, y: 100 },
            data: {
              label: "PostgreSQL Primary",
              nodeType: "database",
              region: "us-east-1",
              backupPolicy: { type: "snapshot", frequencyHours: 4, retentionDays: 30 },
            },
          },
        ],
        edges: [
          { id: "e1", source: "api-gw", target: "order-svc", type: "smoothstep", data: {} },
          { id: "e2", source: "api-gw", target: "payment-svc", type: "smoothstep", data: {} },
          { id: "e3", source: "order-svc", target: "primary-db", type: "smoothstep", data: {} },
          { id: "e4", source: "payment-svc", target: "primary-db", type: "smoothstep", data: {} },
        ],
      },
      {
        id: "fintech-enclave",
        name: "FinTech High-Assurance Enclave (Multi-Region)",
        description: "Regulated ledger architecture with strict zero-trust authentication boundaries and sovereign data constraints.",
        nodes: [
          {
            id: "edge-waf",
            type: "custom",
            position: { x: 50, y: 100 },
            data: {
              label: "Edge WAF & Gateway",
              nodeType: "gateway",
              region: "eu-central-1",
              rateLimit: 50000,
              tlsEnforced: true,
              security: { authRequired: true },
            },
          },
          {
            id: "ledger-svc",
            type: "custom",
            position: { x: 260, y: 60 },
            data: {
              label: "Ledger Core Service",
              nodeType: "service",
              region: "eu-central-1",
              security: { authRequired: true },
            },
          },
          {
            id: "aurora-db",
            type: "custom",
            position: { x: 480, y: 60 },
            data: {
              label: "Aurora Global DB",
              nodeType: "database",
              region: "eu-central-1",
              backupPolicy: { type: "continuous_pitr", retentionDays: 90 },
            },
          },
        ],
        edges: [
          { id: "ef1", source: "edge-waf", target: "ledger-svc", type: "smoothstep", data: {} },
          { id: "ef2", source: "ledger-svc", target: "aurora-db", type: "smoothstep", data: {} },
        ],
      },
    ],
    []
  );

  const [activeScenarioId, setActiveScenarioId] = useState<string>("ecommerce-platform");
  const activeArchitecture = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) || scenarios[0],
    [scenarios, activeScenarioId]
  );

  // 2. Selected Suite and Selected Test
  const allSuites = useMemo(() => suiteRegistry.getAll(), []);
  const allTests = useMemo(() => architectureTestRegistry.getAll(), []);
  const allGates = useMemo(() => gateRegistry.getAll(), []);

  const [selectedSuiteId, setSelectedSuiteId] = useState<string>(allSuites[0].id);
  const [selectedTestId, setSelectedTestId] = useState<string>(allTests[0].id);
  const [selectedGateId, setSelectedGateId] = useState<string>(allGates[0].id);

  // 3. What-If Simulation Preset
  const [simulationPreset, setSimulationPreset] = useState<string | null>(null);

  // 4. Authorized Exceptions
  const [exceptions, setExceptions] = useState<GateException[]>([
    {
      id: "EX-001",
      gateId: "GATE-PROD-RELEASE",
      testId: "TEST-OPS-004",
      justification: "Temporary staging transition exception approved by VP of Engineering.",
      compensatingControls: "Secondary automated failover monitoring active.",
      approvedBy: "vp-eng@nxtqr.internal",
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      status: "active",
    },
  ]);

  // 5. Build Project Model
  const defaultProject: VerificationProject = useMemo(() => {
    return {
      id: `proj-${activeScenarioId}`,
      name: `${activeArchitecture.name} Quality Project`,
      requirements: [
        {
          id: "REQ-ARCH-001",
          projectId: `proj-${activeScenarioId}`,
          version: "1.0.0",
          title: "Network Perimeter Ingress Gateway Requirement",
          description: "All external client traffic must enter through an inspected ingress API gateway.",
          category: "graph_topology",
          criticality: "critical",
          owner: "arch-board@nxtqr.internal",
          scope: { level: "architecture" },
          status: "active",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        {
          id: "REQ-SEC-001",
          projectId: `proj-${activeScenarioId}`,
          version: "1.0.0",
          title: "Perimeter Edge Authentication Requirement",
          description: "Ingress services must declare authentication enforcement prior to routing downstream.",
          category: "security",
          criticality: "critical",
          owner: "sec-ops@nxtqr.internal",
          scope: { level: "component" },
          status: "active",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        {
          id: "REQ-REL-002",
          projectId: `proj-${activeScenarioId}`,
          version: "1.0.0",
          title: "Production Database Backup & RPO Requirement",
          description: "All database stores must maintain an active automated backup policy.",
          category: "database",
          criticality: "critical",
          owner: "data-plat@nxtqr.internal",
          scope: { level: "component" },
          status: "active",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        {
          id: "REQ-OPS-003",
          projectId: `proj-${activeScenarioId}`,
          version: "1.0.0",
          title: "Tier-1 Operational Runbook Coverage",
          description: "Mission-critical workloads require approved operational disaster recovery runbooks.",
          category: "disaster_recovery",
          criticality: "high",
          owner: "sre-core@nxtqr.internal",
          scope: { level: "component" },
          status: "active",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
      tests: allTests,
      suites: allSuites,
      evidenceCatalog: [
        {
          id: "ev-topo-1",
          evidenceType: "architecture_topology",
          source: "graph-schema://verified-snapshot",
          owner: "architecture-engine",
          architectureRevisionId: "rev-baseline",
          observedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          importedAt: new Date().toISOString(),
          contentHash: "sha256:4a83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9061",
          freshnessWindowHours: 72,
          isVerified: true,
        },
        {
          id: "ev-sec-1",
          evidenceType: "security_audit_log",
          source: "siem://edge-waf-audit",
          owner: "sec-ops",
          architectureRevisionId: "rev-baseline",
          observedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          importedAt: new Date().toISOString(),
          contentHash: "sha256:5b83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9062",
          freshnessWindowHours: 24,
          isVerified: true,
        },
        {
          id: "ev-db-1",
          evidenceType: "backup_verification",
          source: "s3://backups/restore-audit",
          owner: "data-plat",
          architectureRevisionId: "rev-baseline",
          observedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          importedAt: new Date().toISOString(),
          contentHash: "sha256:6c83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9063",
          freshnessWindowHours: 48,
          isVerified: true,
        },
        {
          id: "ev-runbook-1",
          evidenceType: "operational_runbook",
          source: "runbooks://rb-standard-triage",
          owner: "sre-core",
          architectureRevisionId: "rev-baseline",
          observedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          importedAt: new Date().toISOString(),
          contentHash: "sha256:7d83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9064",
          freshnessWindowHours: 720,
          isVerified: true,
        },
        {
          id: "ev-metric-1",
          evidenceType: "telemetry_metric",
          source: "otel://collector/metrics",
          owner: "observability-eng",
          architectureRevisionId: "rev-baseline",
          observedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          importedAt: new Date().toISOString(),
          contentHash: "sha256:8e83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9065",
          freshnessWindowHours: 24,
          isVerified: true,
        },
      ],
      baselines: [],
      gates: allGates,
      exceptions,
      runs: [],
    };
  }, [activeScenarioId, activeArchitecture, allTests, allSuites, allGates, exceptions]);

  // 6. Compute Analysis Result
  const analysisResult: VerificationAnalysisResult = useMemo(() => {
    const projectCopy: VerificationProject = JSON.parse(JSON.stringify(defaultProject));
    const nodesCopy: BaseNode[] = JSON.parse(JSON.stringify(activeArchitecture.nodes));
    const edgesCopy: BaseEdge[] = JSON.parse(JSON.stringify(activeArchitecture.edges));

    let candidateNodes: BaseNode[] | undefined;
    let candidateEdges: BaseEdge[] | undefined;

    // Apply simulation preset
    if (simulationPreset === "break_security_auth") {
      // Disable auth on API gateway
      const gw = nodesCopy.find((n) => n.id === "api-gw" || n.id === "edge-waf");
      if (gw) {
        gw.data.security = { authRequired: false };
      }
    } else if (simulationPreset === "remove_backup_evidence") {
      // Remove backup evidence -> yields unknown on database backup
      projectCopy.evidenceCatalog = projectCopy.evidenceCatalog.filter(
        (e) => e.evidenceType !== "backup_verification"
      );
    } else if (simulationPreset === "expire_evidence") {
      // Stale metric evidence (> 48h old)
      const metric = projectCopy.evidenceCatalog.find((e) => e.evidenceType === "telemetry_metric");
      if (metric) {
        metric.observedAt = new Date(Date.now() - 96 * 3600 * 1000).toISOString();
      }
    } else if (simulationPreset === "candidate_regression") {
      // Build candidate architecture with stripped rate limit and TLS
      candidateNodes = JSON.parse(JSON.stringify(nodesCopy));
      candidateEdges = JSON.parse(JSON.stringify(edgesCopy));
      const candGw = candidateNodes?.find((n) => n.id === "api-gw" || n.id === "edge-waf");
      if (candGw) {
        candGw.data.rateLimit = undefined;
        candGw.data.tlsEnforced = false;
      }
    }

    return architectureVerificationEngine.verifyArchitecture(
      projectCopy,
      nodesCopy,
      edgesCopy,
      candidateNodes,
      candidateEdges
    );
  }, [defaultProject, activeArchitecture, simulationPreset]);

  const selectedTest = allTests.find((t) => t.id === selectedTestId) || allTests[0];
  const selectedSuite = allSuites.find((s) => s.id === selectedSuiteId) || allSuites[0];
  const selectedGate = allGates.find((g) => g.id === selectedGateId) || allGates[0];

  const handleAddException = (gateId: string, testId: string, reason: string) => {
    const newEx: GateException = {
      id: `EX-${Date.now()}`,
      gateId,
      testId,
      justification: reason,
      compensatingControls: "Logged via interactive verification studio.",
      approvedBy: "operator@nxtqr.internal",
      expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      status: "active",
    };
    setExceptions((prev) => [newEx, ...prev]);
  };

  return {
    scenarios,
    activeArchitecture,
    setActiveScenarioId,
    allSuites,
    allTests,
    allGates,
    selectedSuiteId,
    setSelectedSuiteId,
    selectedTestId,
    setSelectedTestId,
    selectedGateId,
    setSelectedGateId,
    selectedTest,
    selectedSuite,
    selectedGate,
    simulationPreset,
    setSimulationPreset,
    analysisResult,
    exceptions,
    handleAddException,
  };
}

