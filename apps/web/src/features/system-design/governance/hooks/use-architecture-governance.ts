"use client";

/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * React Hook for Studio Architecture Governance & Compliance
 */

import { useState, useMemo, useCallback } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  type GovernanceArchitectureTopology,
  type GovernancePolicy,
  type EvidenceArtifact,
  type PolicyException,
  type GovernanceBaseline,
  type GovernanceAnalysisResult,
  type PolicySimulationCandidate,
  type PolicySimulationResult,
  architectureGovernanceEngine,
  PolicyRegistry,
} from "@nxtqr/architecture-intelligence";

export interface UseArchitectureGovernanceProps {
  projectId?: string;
  architectureId?: string;
  graphRevision?: string;
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialTopology?: GovernanceArchitectureTopology;
}

export type GovernanceTab =
  | "overview"
  | "policies"
  | "evidence"
  | "exceptions"
  | "drift"
  | "frameworks"
  | "simulation";

export function useArchitectureGovernance(props: UseArchitectureGovernanceProps) {
  const {
    projectId = "default-project",
    architectureId = "default-arch",
    graphRevision = "rev-default",
    nodes: _nodes = [],
    edges: _edges = [],
    initialTopology,
  } = props;

  // Build realistic enterprise governance topology default
  const defaultTopology: GovernanceArchitectureTopology = useMemo(() => {
    if (initialTopology) return initialTopology;

    const now = new Date();
    const nowIso = now.toISOString();
    const pastOneDay = new Date(now.getTime() - 86400000).toISOString();
    const futureThirtyDays = new Date(now.getTime() + 86400000 * 30).toISOString();
    const pastTwoWeeks = new Date(now.getTime() - 86400000 * 14).toISOString();

    const standardPolicies = PolicyRegistry.getAllPolicies();
    const standardBundles = PolicyRegistry.getAllBundles();

    const evidence: EvidenceArtifact[] = [
      {
        id: "ev-tls-gw",
        evidenceType: "security_configuration",
        sourceIdentifier: "alb_tls_listener_spec",
        resourceId: "gw-api-public",
        observedAt: nowIso,
        freshnessWindowSeconds: 86400 * 7,
        integrityHash: "sha256-a1b2c3d4e5f67890abcdef1234567890",
        content: { tlsEnforced: true, minTlsVersion: "TLS_1_3" },
        owner: "SecOps",
        provenance: {
          source: "system_guardrail",
          author: "AWS Config Rule",
          timestamp: nowIso,
          confirmed: true,
        },
      },
      {
        id: "ev-db-enc",
        evidenceType: "security_configuration",
        sourceIdentifier: "rds_cluster_kms_check",
        resourceId: "db-primary",
        observedAt: nowIso,
        freshnessWindowSeconds: 86400 * 14,
        integrityHash: "sha256-db9876543210fedcba09876543210fed",
        content: { isEncryptedAtRest: true, kmsKeyId: "arn:aws:kms:us-east-1:1234:key/rds" },
        owner: "DBA Team",
        provenance: {
          source: "system_guardrail",
          author: "KMS Scanner",
          timestamp: nowIso,
          confirmed: true,
        },
      },
      {
        id: "ev-backup-verify",
        evidenceType: "backup_verification",
        sourceIdentifier: "automated_snapshot_job",
        resourceId: "db-primary",
        observedAt: nowIso,
        freshnessWindowSeconds: 86400 * 2, // 48h validity
        integrityHash: "sha256-bk112233445566778899aabbccddeeff",
        content: { backupFrequencyHours: 12, lastRestoreTestPassed: true },
        owner: "BackupBot",
        provenance: {
          source: "system_guardrail",
          author: "AWS Backup",
          timestamp: nowIso,
          confirmed: true,
        },
      },
      {
        id: "ev-graph-topology",
        evidenceType: "architecture_graph",
        sourceIdentifier: "nxtqr_graph_compiler",
        observedAt: nowIso,
        freshnessWindowSeconds: 86400 * 30,
        integrityHash: "sha256-graph1234567890abcdef1234567890ab",
        content: { totalNodes: 5, hasIsolatedNodes: false },
        owner: "Lead Architect",
        provenance: {
          source: "modeled_governance",
          author: "NXTQR Studio",
          timestamp: nowIso,
          confirmed: true,
        },
      },
    ];

    const exceptions: PolicyException[] = [
      {
        id: "EX-LEGACY-001",
        policyId: "POL-SEC-003", // Internal mTLS
        policyVersion: "1.0.0",
        resourceScope: ["svc-legacy-billing"],
        justification: "Legacy billing batch worker runs on isolated private enclave; scheduled for rewrite in Q3.",
        compensatingControls: [
          {
            id: "cc-net-isol",
            title: "Private Subnet & Strict Security Group Boundary",
            description: "No internet egress; ingress restricted strictly to orchestrator on port 8443.",
            owner: "SecOps",
            evidenceArtifactIds: ["ev-tls-gw"],
            reviewStatus: "verified",
          },
        ],
        requesterId: "lead-billing-dev",
        approverId: "ciso-lead",
        status: "approved",
        startDate: pastOneDay,
        expirationDate: futureThirtyDays,
        isExpired: false,
        auditHistory: [
          {
            action: "approved",
            performedBy: "ciso-lead",
            timestamp: pastOneDay,
            notes: "Approved time-bound exception with compensating control verification.",
          },
        ],
        provenance: {
          source: "system_guardrail",
          author: "CISO Office",
          timestamp: pastOneDay,
          confirmed: true,
        },
      },
      {
        id: "EX-EXP-002",
        policyId: "POL-REL-002", // Circuit Breakers
        policyVersion: "1.0.0",
        resourceScope: ["svc-analytics"],
        justification: "Temporary waiver for non-critical analytics ingestion pipeline during prototype phase.",
        compensatingControls: [],
        requesterId: "analytics-dev",
        approverId: "eng-director",
        status: "expired",
        startDate: pastTwoWeeks,
        expirationDate: pastOneDay, // Expired yesterday
        isExpired: true,
        auditHistory: [
          {
            action: "expired",
            performedBy: "system",
            timestamp: pastOneDay,
            notes: "Exception reached 14-day expiration deadline.",
          },
        ],
        provenance: {
          source: "system_guardrail",
          author: "System Governance Engine",
          timestamp: pastOneDay,
          confirmed: true,
        },
      },
    ];

    const baselines: GovernanceBaseline[] = [
      {
        id: "base-q1-production",
        projectId,
        architectureRevision: "rev-q1",
        bundleVersions: {
          "bundle-baseline": "1.0.0",
          "bundle-production-readiness": "1.0.0",
          "bundle-zero-trust": "1.0.0",
        },
        evaluations: [],
        activeExceptionIds: ["EX-LEGACY-001"],
        createdAt: pastTwoWeeks,
        createdBy: "Lead Architect",
      },
    ];

    const resources = [
      {
        id: "gw-api-public",
        name: "Public API Gateway (Envoy)",
        environment: "production" as const,
        componentType: "api_gateway",
        dataClassification: "internal" as const,
        geographicRegion: "us-east-1",
        tags: ["ingress", "dmz", "envoy"],
        properties: {
          hasApprovedGateway: true,
          tlsEnforced: true,
          hasRateLimiting: true,
          ingress: { hasApprovedGateway: true },
          database: { isPubliclyAccessible: false },
          path: { hasPlaintextHop: false },
        },
      },
      {
        id: "svc-core-api",
        name: "Core Business Service",
        environment: "production" as const,
        componentType: "service",
        dataClassification: "confidential" as const,
        geographicRegion: "us-east-1",
        tags: ["microservice", "backend"],
        properties: {
          hasTraceContextPropagation: true,
          hasCircuitBreaker: true,
          hasApprovedGateway: true,
          ingress: { hasApprovedGateway: true },
          database: { isPubliclyAccessible: false },
        },
      },
      {
        id: "svc-legacy-billing",
        name: "Legacy Billing Service",
        environment: "production" as const,
        componentType: "service",
        dataClassification: "restricted" as const,
        geographicRegion: "us-east-1",
        tags: ["legacy", "finance"],
        properties: {
          hasMtlsEnabled: false, // Violates POL-SEC-003, but has active waiver EX-LEGACY-001
          hasCircuitBreaker: false,
          ingress: { hasApprovedGateway: true },
          database: { isPubliclyAccessible: false },
        },
      },
      {
        id: "db-primary",
        name: "PostgreSQL Primary Cluster",
        environment: "production" as const,
        componentType: "database",
        dataClassification: "confidential" as const,
        geographicRegion: "us-east-1",
        tags: ["storage", "relational", "aurora"],
        properties: {
          isMultiAz: true,
          isEncryptedAtRest: true,
          backupFrequencyHours: 12,
          database: { isPubliclyAccessible: false, engine: "postgresql" },
          ingress: { hasApprovedGateway: true },
        },
      },
      {
        id: "queue-orders",
        name: "Orders Ingestion Queue",
        environment: "production" as const,
        componentType: "message_queue",
        dataClassification: "internal" as const,
        geographicRegion: "us-east-1",
        tags: ["messaging", "sqs"],
        properties: {
          hasDeadLetterQueue: true,
          hasRetentionPolicy: true,
          ingress: { hasApprovedGateway: true },
          database: { isPubliclyAccessible: false },
        },
      },
    ];

    return {
      id: `top-gov-${architectureId}`,
      projectId,
      architectureId,
      graphRevision,
      version: 1,
      policies: standardPolicies,
      bundles: standardBundles,
      evidence,
      exceptions,
      baselines,
      resources,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }, [architectureId, graphRevision, initialTopology, projectId]);

  const [topology, setTopology] = useState<GovernanceArchitectureTopology>(defaultTopology);
  const [activeTab, setActiveTab] = useState<GovernanceTab>("overview");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("POL-SEC-001");
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);
  const [selectedBundleId, setSelectedBundleId] = useState<string>("bundle-baseline");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<PolicySimulationResult | null>(null);

  // Synchronous, deterministic analysis
  const analysisResult: GovernanceAnalysisResult = useMemo(() => {
    return architectureGovernanceEngine.analyzeTopology(topology);
  }, [topology]);

  // Selected policy details
  const selectedPolicy: GovernancePolicy | undefined = useMemo(() => {
    return topology.policies.find((p) => p.id === selectedPolicyId);
  }, [topology.policies, selectedPolicyId]);

  // Filtered evaluations
  const filteredEvaluations = useMemo(() => {
    return analysisResult.evaluations.filter((ev) => {
      if (statusFilter !== "all" && ev.status !== statusFilter) return false;
      if (severityFilter !== "all" && ev.severity !== severityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.policyTitle.toLowerCase().includes(q);
        const matchId = ev.policyId.toLowerCase().includes(q);
        const matchRes = (ev.resourceName || ev.resourceId || "").toLowerCase().includes(q);
        return matchTitle || matchId || matchRes;
      }
      return true;
    });
  }, [analysisResult.evaluations, statusFilter, severityFilter, searchQuery]);

  // Action: Add new policy exception (time-bound waiver)
  const addException = useCallback((exception: PolicyException) => {
    setTopology((prev) => ({
      ...prev,
      exceptions: [...prev.exceptions.filter((e) => e.id !== exception.id), exception],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Action: Revoke exception
  const revokeException = useCallback((exceptionId: string) => {
    setTopology((prev) => ({
      ...prev,
      exceptions: prev.exceptions.map((e) => {
        if (e.id === exceptionId) {
          return {
            ...e,
            status: "revoked" as const,
            auditHistory: [
              ...e.auditHistory,
              {
                action: "revoked" as const,
                performedBy: "Current User",
                timestamp: new Date().toISOString(),
                notes: "Manually revoked in studio.",
              },
            ],
          };
        }
        return e;
      }),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Action: Add evidence artifact
  const addEvidence = useCallback((artifact: EvidenceArtifact) => {
    setTopology((prev) => ({
      ...prev,
      evidence: [...prev.evidence.filter((e) => e.id !== artifact.id), artifact],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Action: Run What-If simulation
  const runSimulation = useCallback(
    (candidate: PolicySimulationCandidate) => {
      setIsSimulating(true);
      try {
        const result = architectureGovernanceEngine.simulateWhatIf(
          topology,
          candidate,
          analysisResult.evaluations
        );
        setSimulationResult(result);
      } finally {
        setIsSimulating(false);
      }
    },
    [analysisResult.evaluations, topology]
  );

  return {
    topology,
    setTopology,
    activeTab,
    setActiveTab,
    selectedPolicyId,
    setSelectedPolicyId,
    selectedPolicy,
    selectedEvaluationId,
    setSelectedEvaluationId,
    selectedExceptionId,
    setSelectedExceptionId,
    selectedBundleId,
    setSelectedBundleId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    severityFilter,
    setSeverityFilter,
    analysisResult,
    filteredEvaluations,
    addException,
    revokeException,
    addEvidence,
    runSimulation,
    isSimulating,
    simulationResult,
  };
}
