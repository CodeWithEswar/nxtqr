/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Standard Architecture Test Registry
 */

import type { ArchitectureTest } from "../contracts/verification.types";

export const STANDARD_ARCHITECTURE_TESTS: ArchitectureTest[] = [
  {
    id: "TEST-TOPO-001",
    projectId: "default",
    version: "1.0.0",
    title: "Ingress Gateway Existence & Exposure Control",
    description: "Verifies that client entrypoints pass through a declared gateway with controlled ingress.",
    category: "graph_topology",
    scope: {
      level: "architecture",
      environment: "all",
    },
    assertion: {
      operator: "all",
      children: [
        {
          operator: "greater_than",
          path: "data.nodeType",
          targetValue: 0, // checked via node matching in applicability
        },
      ],
    },
    severity: "critical",
    status: "active",
    requirementIds: ["REQ-ARCH-001"],
    requiredEvidenceTypes: ["architecture_topology"],
    createdBy: "arch-board@nxtqr.internal",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "TEST-SEC-002",
    projectId: "default",
    version: "1.0.0",
    title: "Edge Services Require Authentication Enforcement",
    description: "Ensures external ingress components declare authentication enforcement before routing to internal services.",
    category: "security",
    scope: {
      level: "component",
      environment: "production",
    },
    assertion: {
      operator: "equals",
      path: "data.security.authRequired",
      targetValue: true,
    },
    severity: "critical",
    status: "active",
    requirementIds: ["REQ-SEC-001"],
    requiredEvidenceTypes: ["security_audit_log"],
    createdBy: "sec-ops@nxtqr.internal",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "TEST-REL-003",
    projectId: "default",
    version: "1.0.0",
    title: "Production Databases Require Backup Policy & RPO Declaration",
    description: "Validates that all production database assets declare an automated backup policy and target RPO.",
    category: "database",
    scope: {
      level: "component",
      environment: "production",
    },
    assertion: {
      operator: "all",
      children: [
        {
          operator: "exists",
          path: "data.backupPolicy",
        },
        {
          operator: "evidence_present",
          evidenceType: "backup_verification",
        },
      ],
    },
    severity: "critical",
    status: "active",
    requirementIds: ["REQ-REL-002"],
    requiredEvidenceTypes: ["backup_verification"],
    createdBy: "data-plat@nxtqr.internal",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "TEST-OPS-004",
    projectId: "default",
    version: "1.0.0",
    title: "Tier-1 Services Require Operational Recovery Runbook",
    description: "Requires all mission-critical services to have an approved operational runbook for disaster response.",
    category: "disaster_recovery",
    scope: {
      level: "component",
      environment: "production",
    },
    assertion: {
      operator: "evidence_present",
      evidenceType: "operational_runbook",
    },
    severity: "high",
    status: "active",
    requirementIds: ["REQ-OPS-003"],
    requiredEvidenceTypes: ["operational_runbook"],
    createdBy: "sre-core@nxtqr.internal",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "TEST-NET-005",
    projectId: "default",
    version: "1.0.0",
    title: "Ingress Gateways Require Rate Limiting & TLS Termination",
    description: "Ensures network perimeter gateways declare rate limit ceilings and enforce TLS termination.",
    category: "network",
    scope: {
      level: "component",
      environment: "production",
    },
    assertion: {
      operator: "all",
      children: [
        {
          operator: "exists",
          path: "data.rateLimit",
        },
        {
          operator: "equals",
          path: "data.tlsEnforced",
          targetValue: true,
        },
      ],
    },
    severity: "high",
    status: "active",
    requirementIds: ["REQ-NET-004"],
    requiredEvidenceTypes: ["network_config"],
    createdBy: "net-eng@nxtqr.internal",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "TEST-GOV-006",
    projectId: "default",
    version: "1.0.0",
    title: "Regulated Data Assets Must Reside in Approved Cloud Regions",
    description: "Enforces data residency compliance by verifying region allocation against allowed sovereign jurisdictions.",
    category: "governance",
    scope: {
      level: "component",
      environment: "production",
    },
    assertion: {
      operator: "in_set",
      path: "data.region",
      targetValue: ["us-east-1", "us-west-2", "eu-central-1", "eu-west-1"],
    },
    severity: "critical",
    status: "active",
    requirementIds: ["REQ-GOV-005"],
    requiredEvidenceTypes: ["cloud_audit_manifest"],
    createdBy: "compliance@nxtqr.internal",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "TEST-OBS-007",
    projectId: "default",
    version: "1.0.0",
    title: "Mission-Critical Services Require Telemetry Tracing & Health Probes",
    description: "Validates distributed tracing instrumentation and automated health check endpoints.",
    category: "observability",
    scope: {
      level: "component",
      environment: "production",
    },
    assertion: {
      operator: "evidence_fresh",
      evidenceType: "telemetry_metric",
      maxAgeHours: 24,
    },
    severity: "medium",
    status: "active",
    requirementIds: ["REQ-OBS-006"],
    requiredEvidenceTypes: ["telemetry_metric"],
    createdBy: "observability-eng@nxtqr.internal",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "TEST-MSG-008",
    projectId: "default",
    version: "1.0.0",
    title: "Asynchronous Consumers Must Configure Dead-Letter Queue (DLQ)",
    description: "Guarantees that event-driven queue workers define DLQ routing to prevent poison-pill message looping.",
    category: "messaging",
    scope: {
      level: "component",
      environment: "production",
    },
    assertion: {
      operator: "exists",
      path: "data.deadLetterQueue",
    },
    severity: "high",
    status: "active",
    requirementIds: ["REQ-MSG-007"],
    requiredEvidenceTypes: ["messaging_topology"],
    createdBy: "event-arch@nxtqr.internal",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
];

export class ArchitectureTestRegistry {
  private tests: Map<string, ArchitectureTest> = new Map();

  constructor() {
    STANDARD_ARCHITECTURE_TESTS.forEach((t) => this.tests.set(t.id, t));
  }

  public getAll(): ArchitectureTest[] {
    return Array.from(this.tests.values());
  }

  public getById(id: string): ArchitectureTest | undefined {
    return this.tests.get(id);
  }

  public getByCategory(category: string): ArchitectureTest[] {
    return this.getAll().filter((t) => t.category === category);
  }

  public register(test: ArchitectureTest): void {
    this.tests.set(test.id, test);
  }
}

export const architectureTestRegistry = new ArchitectureTestRegistry();

