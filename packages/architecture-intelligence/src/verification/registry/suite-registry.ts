/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Standard Architecture Test Suites Registry & Cycle Validator
 */

import type { ArchitectureTestSuite } from "../contracts/verification.types";

export const STANDARD_ARCHITECTURE_SUITES: ArchitectureTestSuite[] = [
  {
    id: "SUITE-PROD-READINESS",
    projectId: "default",
    version: "1.0.0",
    title: "Production Release Readiness Suite",
    description: "Evaluates mission-critical criteria: topology, security, database backup, and operational recovery.",
    category: "production",
    testIds: ["TEST-TOPO-001", "TEST-SEC-002", "TEST-REL-003", "TEST-OPS-004", "TEST-NET-005"],
    dependencySuiteIds: [],
    status: "active",
    createdBy: "arch-board@nxtqr.internal",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "SUITE-SEC-BASELINE",
    projectId: "default",
    version: "1.0.0",
    title: "Security & Sovereign Governance Baseline Suite",
    description: "Enforces edge authentication boundaries, TLS encryption, and regional sovereign data residency.",
    category: "security",
    testIds: ["TEST-SEC-002", "TEST-NET-005", "TEST-GOV-006"],
    dependencySuiteIds: [],
    status: "active",
    createdBy: "sec-ops@nxtqr.internal",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "SUITE-DR-GOVERNANCE",
    projectId: "default",
    version: "1.0.0",
    title: "Disaster Recovery & Messaging Resilience Suite",
    description: "Validates database backup verification, operational runbooks, and DLQ backpressure protection.",
    category: "reliability",
    testIds: ["TEST-REL-003", "TEST-OPS-004", "TEST-MSG-008", "TEST-OBS-007"],
    dependencySuiteIds: [],
    status: "active",
    createdBy: "sre-core@nxtqr.internal",
    createdAt: "2026-01-15T00:00:00Z",
  },
];

export class SuiteRegistry {
  private suites: Map<string, ArchitectureTestSuite> = new Map();

  constructor() {
    STANDARD_ARCHITECTURE_SUITES.forEach((s) => this.suites.set(s.id, s));
  }

  public getAll(): ArchitectureTestSuite[] {
    return Array.from(this.suites.values());
  }

  public getById(id: string): ArchitectureTestSuite | undefined {
    return this.suites.get(id);
  }

  /**
   * Validates suite dependencies to prevent cyclic recursion.
   */
  public static validateSuiteAcyclicity(suites: ArchitectureTestSuite[]): {
    hasCycles: boolean;
    cyclePath?: string[];
  } {
    const adj = new Map<string, string[]>();
    for (const s of suites) {
      adj.set(s.id, s.dependencySuiteIds || []);
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];

    const dfs = (curr: string): boolean => {
      visited.add(curr);
      recStack.add(curr);
      path.push(curr);

      const neighbors = adj.get(curr) || [];
      for (const nxt of neighbors) {
        if (!visited.has(nxt)) {
          if (dfs(nxt)) return true;
        } else if (recStack.has(nxt)) {
          path.push(nxt);
          return true;
        }
      }

      recStack.delete(curr);
      path.pop();
      return false;
    };

    for (const s of suites) {
      if (!visited.has(s.id)) {
        if (dfs(s.id)) {
          return { hasCycles: true, cyclePath: path };
        }
      }
    }

    return { hasCycles: false };
  }
}

export const suiteRegistry = new SuiteRegistry();

