import { describe, it, expect } from "vitest";
import { TransactionAnalyzer } from "../database/analysis/transaction-analyzer";
import type { TransactionModel } from "../database/contracts/database.types";

describe("Phase 05.3.23: Transaction Boundaries, Isolation & Deadlock Analyzer", () => {
  const now = new Date().toISOString();

  it("should detect deadlock wait-for graph dependency cycles between conflicting transactions", () => {
    // Transaction A locks Table 1 (orders) then Table 2 (inventory)
    // Transaction B locks Table 2 (inventory) then Table 1 (orders)
    const txA: TransactionModel = {
      id: "tx-order-checkout",
      name: "Checkout Order Transaction",
      databaseAssetId: "asset-1",
      isolationLevel: "read_committed",
      retryPolicyEnabled: false,
      provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      operations: [
        { tableId: "tbl-orders", tableName: "orders", lockType: "exclusive", isWrite: true, estimatedDurationMs: 45 },
        { tableId: "tbl-inventory", tableName: "inventory", lockType: "exclusive", isWrite: true, estimatedDurationMs: 50 },
      ],
    };

    const txB: TransactionModel = {
      id: "tx-inventory-restock",
      name: "Inventory Restock Transaction",
      databaseAssetId: "asset-1",
      isolationLevel: "read_committed",
      retryPolicyEnabled: false,
      provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      operations: [
        { tableId: "tbl-inventory", tableName: "inventory", lockType: "exclusive", isWrite: true, estimatedDurationMs: 60 },
        { tableId: "tbl-orders", tableName: "orders", lockType: "exclusive", isWrite: true, estimatedDurationMs: 40 },
      ],
    };

    const res = TransactionAnalyzer.analyze([txA, txB]);
    expect(res.deadlockRiskCount).toBeGreaterThanOrEqual(1);
    expect(res.deadlockScenarios.length).toBeGreaterThanOrEqual(1);

    const deadlockScenario = res.deadlockScenarios[0];
    expect(deadlockScenario.hasDeadlockCycle).toBe(true);
    expect(deadlockScenario.deadlockRiskLevel).toBe("critical");

    const deadlockFinding = res.findings.find((f) => f.category === "deadlock_dependency_cycle");
    expect(deadlockFinding).toBeDefined();
    expect(deadlockFinding?.severity).toBe("critical");
    expect(deadlockFinding?.remediation).toContain("Standardize lock acquisition order");
  });

  it("should detect dirty read risk under read_uncommitted and non-repeatable read hazards under read_committed", () => {
    const dirtyReadTx: TransactionModel = {
      id: "tx-dirty-report",
      name: "Analytics Snapshot Transaction",
      databaseAssetId: "asset-1",
      isolationLevel: "read_uncommitted",
      retryPolicyEnabled: false,
      provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      operations: [
        { tableId: "tbl-financials", tableName: "financial_ledger", lockType: "shared", isWrite: false, estimatedDurationMs: 250 },
      ],
    };

    const res = TransactionAnalyzer.analyze([dirtyReadTx]);
    const anomalyFinding = res.findings.find((f) => f.category === "transaction_isolation_anomaly");
    expect(anomalyFinding).toBeDefined();
    expect(anomalyFinding?.title).toContain("Dirty Read Hazard");
    expect(anomalyFinding?.remediation.toLowerCase()).toContain("read committed");
  });
});
