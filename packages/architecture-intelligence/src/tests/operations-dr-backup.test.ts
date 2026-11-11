import { describe, it, expect } from "vitest";
import {
  DisasterRecoveryAnalyzer,
  type RecoveryObjective,
  type BackupCapability,
  type FailoverProcedure,
  type OperationalEvidence,
} from "../operations";

describe("Phase 05.3.27: Disaster Recovery & Backup Readiness Analyzer", () => {
  it("strictly separates targets from observed drill evidence and flags unverified RTO/RPO", () => {
    const objectives: RecoveryObjective[] = [
      {
        id: "obj-1",
        serviceId: "order-service",
        serviceName: "Order Service",
        rtoTargetSeconds: 300,
        rpoTargetSeconds: 60,
        supportingStrategyType: "warm_standby",
        observedRtoSeconds: 240, // Verified under target
        observedRpoSeconds: 45,  // Verified under target
        isRtoVerified: true,
        isRpoVerified: true,
        evidenceIds: ["ev-drill-1"],
      },
      {
        id: "obj-2",
        serviceId: "billing-service",
        serviceName: "Billing Service",
        rtoTargetSeconds: 600,
        rpoTargetSeconds: 120,
        supportingStrategyType: "backup_restore",
        // No observed evidence!
        isRtoVerified: false,
        isRpoVerified: false,
        evidenceIds: [],
      },
    ];

    const evidenceList: OperationalEvidence[] = [
      {
        id: "ev-drill-1",
        evidenceType: "failover_drill",
        sourceUri: "audit://drill-1",
        contentHash: "hash-1",
        recordedAt: new Date().toISOString(),
        verifiedBy: "sec-ops",
        notes: "Passed",
      },
    ];

    const result = DisasterRecoveryAnalyzer.evaluateObjectives(objectives, evidenceList);

    expect(result.verifiedObjectivesCount).toBe(1);
    expect(result.unverifiedObjectivesCount).toBe(1);
    expect(result.findings.some((f) => f.title.includes("RTO Target Lacks Verification Evidence"))).toBe(true);
    expect(result.findings.some((f) => f.title.includes("RPO Target Lacks Replication Evidence"))).toBe(true);
  });

  it("detects breached RTO when observed recovery time exceeds target", () => {
    const objectives: RecoveryObjective[] = [
      {
        id: "obj-breached",
        serviceId: "data-warehouse",
        serviceName: "Data Warehouse",
        rtoTargetSeconds: 1800, // 30m
        rpoTargetSeconds: 3600,
        supportingStrategyType: "backup_restore",
        observedRtoSeconds: 3600, // 60m (Exceeded!)
        observedRpoSeconds: 1800,
        isRtoVerified: true,
        isRpoVerified: true,
        evidenceIds: ["ev-1"],
      },
    ];

    const result = DisasterRecoveryAnalyzer.evaluateObjectives(objectives, [
      { id: "ev-1", evidenceType: "restore_test", sourceUri: "", contentHash: "", recordedAt: "", verifiedBy: "", notes: "" },
    ]);

    expect(result.findings.some((f) => f.title.includes("Observed Recovery Time Exceeds Target"))).toBe(true);
  });

  it("evaluates backup capabilities and flags untested or unencrypted backups", () => {
    const backups: BackupCapability[] = [
      {
        id: "bk-safe",
        componentId: "main-db",
        componentName: "Main Database",
        backupType: "snapshot",
        scheduleExpression: "cron(0 2 * * ? *)",
        retentionDays: 30,
        isEncrypted: true,
        storageLocation: "s3://vault-encrypted",
        lastSuccessfulBackupAt: new Date().toISOString(),
        lastRestoreTestAt: new Date().toISOString(),
        restoreVerified: true,
        evidenceIds: ["ev-restore"],
      },
      {
        id: "bk-unsafe",
        componentId: "legacy-db",
        componentName: "Legacy DB",
        backupType: "full",
        scheduleExpression: "cron(0 0 * * ? *)",
        retentionDays: 7,
        isEncrypted: false, // VIOLATION
        storageLocation: "s3://vault-public",
        lastSuccessfulBackupAt: new Date().toISOString(),
        lastRestoreTestAt: undefined, // VIOLATION: Never tested!
        restoreVerified: false,
        evidenceIds: [],
      },
    ];

    const result = DisasterRecoveryAnalyzer.evaluateBackups(backups);

    expect(result.evaluatedBackups.length).toBe(2);
    expect(result.findings.some((f) => f.title.includes("Untested Backup"))).toBe(true);
    expect(result.findings.some((f) => f.title.includes("Unencrypted Backup"))).toBe(true);
  });

  it("evaluates failover geographic diversity and detects single-region dependency", () => {
    const failovers: FailoverProcedure[] = [
      {
        id: "fo-same-region",
        componentId: "core-router",
        primaryRegion: "us-east-1",
        secondaryRegion: "us-east-1", // VIOLATION: Same region!
        failoverType: "automatic",
        healthCheckType: "HTTP",
        dataSyncLagMaxSeconds: 15,
        failbackProcedure: "revert",
        readinessVerified: true,
        readinessNotes: [],
      },
    ];

    const result = DisasterRecoveryAnalyzer.evaluateFailover(failovers);

    expect(result.findings.some((f) => f.category === "single_region_dependency")).toBe(true);
    expect(result.evaluatedFailovers[0].isReady).toBe(false);
  });
});

