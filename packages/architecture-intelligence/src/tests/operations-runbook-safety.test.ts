import { describe, it, expect } from "vitest";
import type { BaseNode } from "@nxtqr/graph-schema";
import {
  RunbookAnalyzer,
  type OperationalRunbook,
  type OperationalAsset,
} from "../operations";

describe("Phase 05.3.27: Runbook Safety, Coverage & Staleness Analyzer", () => {
  const safeRunbook: OperationalRunbook = {
    id: "RB-001",
    title: "Primary DB Failover Runbook",
    purpose: "Promote replica to primary on master failure",
    applicableComponentIds: ["primary-db"],
    incidentScenarioIds: ["SCN-DB-FAILOVER-001"],
    revision: "1.0.0",
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        type: "observation",
        title: "Check Replication Lag",
        details: "Inspect lag in seconds",
        isDestructive: false,
        requiresApproval: false,
      },
      {
        id: "step-2",
        stepNumber: 2,
        type: "recovery",
        title: "Promote Standby",
        details: "Run promotion command",
        isDestructive: true,
        requiresApproval: true,
        verificationGate: "Health probe returns 200 within 15 seconds",
      },
    ],
    safetyWarnings: ["Verify replication lag is under 30s before executing."],
    prerequisites: ["VPN access"],
    rollbackGuidance: "Revert DNS pointer if replication error occurs.",
    owner: "data-team",
    reviewDate: new Date().toISOString(),
    isApproved: true,
  };

  const unsafeRunbook: OperationalRunbook = {
    id: "RB-002",
    title: "Unsafe Manual Purge Runbook",
    purpose: "Purge cache keys manually",
    applicableComponentIds: ["cache-cluster"],
    incidentScenarioIds: [],
    revision: "0.1.0",
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        type: "recovery",
        title: "Purge All Keys Unconditionally",
        details: "FLUSHALL command",
        isDestructive: true,
        requiresApproval: false, // VIOLATION: Destructive without approval!
      },
    ],
    safetyWarnings: [],
    prerequisites: [],
    rollbackGuidance: "", // VIOLATION: Missing rollback guidance!
    owner: "unknown",
    reviewDate: "2024-01-01T00:00:00Z", // VIOLATION: Stale review date!
    isApproved: false,
  };

  it("validates runbook safety and flags unapproved destructive operations", () => {
    const safeValidation = RunbookAnalyzer.validateRunbookSafety(safeRunbook);
    expect(safeValidation.isValid).toBe(true);
    expect(safeValidation.issues.length).toBe(0);

    const unsafeValidation = RunbookAnalyzer.validateRunbookSafety(unsafeRunbook);
    expect(unsafeValidation.isValid).toBe(false);
    expect(unsafeValidation.issues.some((i) => i.includes("mandatory human approval gate"))).toBe(true);
    expect(unsafeValidation.issues.some((i) => i.includes("lacks actionable rollback guidance"))).toBe(true);
  });

  it("evaluates Tier 1 runbook coverage and generates findings for uncovered critical assets", () => {
    const assets: OperationalAsset[] = [
      { id: "a1", componentId: "primary-db", name: "DB", tier: "tier_1_mission_critical", environment: "prod", region: "us-east-1", ownerId: "team-data" },
      { id: "a2", componentId: "api-gw", name: "Gateway", tier: "tier_1_mission_critical", environment: "prod", region: "us-east-1", ownerId: "team-infra" },
    ];

    const coverage = RunbookAnalyzer.evaluateCoverage(assets, [safeRunbook], []);
    // primary-db is covered, api-gw is uncovered
    expect(coverage.tier1CoveragePercent).toBe(50);
    expect(coverage.findings.length).toBe(1);
    expect(coverage.findings[0].category).toBe("missing_runbook");
    expect(coverage.findings[0].affectedComponentIds).toContain("api-gw");
  });

  it("detects runbook staleness when referencing decommissioned components or overdue review dates", () => {
    const activeNodes: BaseNode[] = [
      { id: "primary-db", type: "custom", position: { x: 0, y: 0 }, data: {} },
    ];

    // unsafeRunbook references 'cache-cluster', which is not in activeNodes
    const stalenessFindings = RunbookAnalyzer.detectStaleness([unsafeRunbook], activeNodes);
    expect(stalenessFindings.length).toBeGreaterThanOrEqual(2);
    expect(stalenessFindings.some((f) => f.title.includes("Decommissioned or Missing Components"))).toBe(true);
    expect(stalenessFindings.some((f) => f.title.includes("Review Overdue"))).toBe(true);
  });
});
