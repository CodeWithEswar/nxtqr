/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Standard Readiness Gates Registry
 */

import type { ReadinessGate } from "../contracts/verification.types";

export const STANDARD_READINESS_GATES: ReadinessGate[] = [
  {
    id: "GATE-PROD-RELEASE",
    projectId: "default",
    version: "1.0.0",
    title: "Production Release Readiness Gate",
    description: "Mandatory release gate required before deploying architecture changes to production environments.",
    category: "production_readiness",
    requiredTestIds: ["TEST-TOPO-001", "TEST-SEC-002", "TEST-REL-003", "TEST-OPS-004", "TEST-NET-005"],
    requiredSuiteIds: ["SUITE-PROD-READINESS"],
    requiredEvidenceTypes: ["architecture_topology", "security_audit_log", "backup_verification", "operational_runbook"],
    blockingRules: {
      allowUnknown: false,
      blockOnAnyFailure: true,
      requireFreshEvidence: true,
      minPassRatePercent: 100,
    },
    status: "active",
  },
  {
    id: "GATE-ARCH-REVIEW",
    projectId: "default",
    version: "1.0.0",
    title: "Architecture Design Review Approval Gate",
    description: "Evaluates architectural consistency and data governance standards prior to formal technical review.",
    category: "architecture_review",
    requiredTestIds: ["TEST-TOPO-001", "TEST-SEC-002", "TEST-GOV-006", "TEST-OBS-007"],
    requiredSuiteIds: ["SUITE-SEC-BASELINE"],
    requiredEvidenceTypes: ["architecture_topology", "cloud_audit_manifest"],
    blockingRules: {
      allowUnknown: true,
      blockOnAnyFailure: false,
      requireFreshEvidence: false,
      minPassRatePercent: 75,
    },
    status: "active",
  },
];

export class GateRegistry {
  private gates: Map<string, ReadinessGate> = new Map();

  constructor() {
    STANDARD_READINESS_GATES.forEach((g) => this.gates.set(g.id, g));
  }

  public getAll(): ReadinessGate[] {
    return Array.from(this.gates.values());
  }

  public getById(id: string): ReadinessGate | undefined {
    return this.gates.get(id);
  }

  public register(gate: ReadinessGate): void {
    this.gates.set(gate.id, gate);
  }
}

export const gateRegistry = new GateRegistry();

