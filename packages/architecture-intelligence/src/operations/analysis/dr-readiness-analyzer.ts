/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Disaster Recovery & Backup Readiness Analyzer
 */

import type {
  RecoveryObjective,
  BackupCapability,
  FailoverProcedure,
  OperationalFinding,
  OperationalEvidence,
} from "../contracts/operations.types";

export interface ObjectiveEvaluationItem {
  objective: RecoveryObjective;
  rtoStatus: "verified" | "target_only_unverified" | "exceeded";
  rpoStatus: "verified" | "target_only_unverified" | "exceeded";
  notes: string[];
}

export interface BackupEvaluationItem {
  backup: BackupCapability;
  isFresh: boolean;
  isRestoreVerified: boolean;
  notes: string[];
}

export interface FailoverEvaluationItem {
  failover: FailoverProcedure;
  isReady: boolean;
  notes: string[];
}

export class DisasterRecoveryAnalyzer {
  /**
   * Evaluates Recovery Objectives (RTO & RPO), strictly separating target declarations from verified evidence.
   */
  public static evaluateObjectives(
    objectives: RecoveryObjective[],
    evidenceList: OperationalEvidence[] = []
  ): {
    evaluatedObjectives: ObjectiveEvaluationItem[];
    verifiedObjectivesCount: number;
    unverifiedObjectivesCount: number;
    findings: OperationalFinding[];
  } {
    const findings: OperationalFinding[] = [];
    const evaluatedObjectives: ObjectiveEvaluationItem[] = [];
    let verifiedObjectivesCount = 0;
    let unverifiedObjectivesCount = 0;

    const evidenceIdSet = new Set<string>(evidenceList.map((e) => e.id));

    for (const obj of objectives) {
      const notes: string[] = [];
      let rtoStatus: ObjectiveEvaluationItem["rtoStatus"] = "target_only_unverified";
      let rpoStatus: ObjectiveEvaluationItem["rpoStatus"] = "target_only_unverified";

      // Evaluate RTO
      const hasRtoEvidence = obj.evidenceIds.some((eid) => evidenceIdSet.has(eid)) || obj.isRtoVerified;
      if (hasRtoEvidence && obj.observedRtoSeconds !== undefined) {
        if (obj.observedRtoSeconds <= obj.rtoTargetSeconds) {
          rtoStatus = "verified";
          notes.push(`RTO verified: observed ${obj.observedRtoSeconds}s <= target ${obj.rtoTargetSeconds}s.`);
        } else {
          rtoStatus = "exceeded";
          notes.push(`RTO breached: observed ${obj.observedRtoSeconds}s > target ${obj.rtoTargetSeconds}s.`);
          findings.push({
            id: `FND-RTO-EXCEEDED-${obj.serviceId}`,
            category: "rto_unverified",
            severity: "critical",
            title: `Observed Recovery Time Exceeds Target: ${obj.serviceName}`,
            description: `Recovery drill telemetry shows observed RTO of ${obj.observedRtoSeconds}s, exceeding maximum allowed target of ${obj.rtoTargetSeconds}s for '${obj.serviceName}'.`,
            affectedComponentIds: [obj.serviceId],
            remediationRecommendation: "Optimize automated container warm-up, pre-provision warm standby nodes, or streamline failover health check thresholds.",
          });
        }
      } else {
        rtoStatus = "target_only_unverified";
        notes.push(`RTO target is ${obj.rtoTargetSeconds}s, but no validated drill evidence exists.`);
        findings.push({
          id: `FND-RTO-UNVERIFIED-${obj.serviceId}`,
          category: "rto_unverified",
          severity: "high",
          title: `RTO Target Lacks Verification Evidence: ${obj.serviceName}`,
          description: `Service '${obj.serviceName}' declares an RTO of ${obj.rtoTargetSeconds}s, but has no documented recovery drill or test evidence proving it can be restored within this window.`,
          affectedComponentIds: [obj.serviceId],
          remediationRecommendation: "Conduct an authorized disaster recovery drill or failover test in staging/pre-prod and record the verified timestamped evidence.",
        });
      }

      // Evaluate RPO
      const hasRpoEvidence = obj.evidenceIds.some((eid) => evidenceIdSet.has(eid)) || obj.isRpoVerified;
      if (hasRpoEvidence && obj.observedRpoSeconds !== undefined) {
        if (obj.observedRpoSeconds <= obj.rpoTargetSeconds) {
          rpoStatus = "verified";
          notes.push(`RPO verified: observed ${obj.observedRpoSeconds}s <= target ${obj.rpoTargetSeconds}s.`);
        } else {
          rpoStatus = "exceeded";
          notes.push(`RPO breached: observed ${obj.observedRpoSeconds}s > target ${obj.rpoTargetSeconds}s.`);
          findings.push({
            id: `FND-RPO-EXCEEDED-${obj.serviceId}`,
            category: "rpo_unverified",
            severity: "critical",
            title: `Observed Data Loss Exceeds RPO Target: ${obj.serviceName}`,
            description: `Observed replication lag / snapshot delta is ${obj.observedRpoSeconds}s, exceeding maximum allowed RPO of ${obj.rpoTargetSeconds}s for '${obj.serviceName}'.`,
            affectedComponentIds: [obj.serviceId],
            remediationRecommendation: "Upgrade from batch snapshot replication to continuous Change Data Capture (CDC) or cross-region synchronous replication.",
          });
        }
      } else {
        rpoStatus = "target_only_unverified";
        notes.push(`RPO target is ${obj.rpoTargetSeconds}s, but no replication lag or backup verification evidence exists.`);
        findings.push({
          id: `FND-RPO-UNVERIFIED-${obj.serviceId}`,
          category: "rpo_unverified",
          severity: "high",
          title: `RPO Target Lacks Replication Evidence: ${obj.serviceName}`,
          description: `Service '${obj.serviceName}' specifies an RPO of ${obj.rpoTargetSeconds}s, but no replication telemetry or snapshot evidence validates actual data loss bounds under partition.`,
          affectedComponentIds: [obj.serviceId],
          remediationRecommendation: "Instrument continuous replication lag telemetry and attach verified snapshot validation logs.",
        });
      }

      const isFullyVerified = rtoStatus === "verified" && rpoStatus === "verified";
      if (isFullyVerified) {
        verifiedObjectivesCount++;
      } else {
        unverifiedObjectivesCount++;
      }

      evaluatedObjectives.push({
        objective: obj,
        rtoStatus,
        rpoStatus,
        notes,
      });
    }

    return {
      evaluatedObjectives,
      verifiedObjectivesCount,
      unverifiedObjectivesCount,
      findings,
    };
  }

  /**
   * Evaluates backup capabilities and tests whether restore procedures have verifiable proof.
   */
  public static evaluateBackups(backups: BackupCapability[]): {
    evaluatedBackups: BackupEvaluationItem[];
    findings: OperationalFinding[];
  } {
    const findings: OperationalFinding[] = [];
    const evaluatedBackups: BackupEvaluationItem[] = [];

    const nowMs = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    for (const b of backups) {
      const notes: string[] = [];
      let isFresh = false;
      let isRestoreVerified = b.restoreVerified;

      // 1. Freshness check
      if (b.lastSuccessfulBackupAt) {
        const lastBackupMs = new Date(b.lastSuccessfulBackupAt).getTime();
        const ageHours = (nowMs - lastBackupMs) / (1000 * 60 * 60);
        if (ageHours <= 26) {
          isFresh = true;
          notes.push(`Backup is fresh: last snapshot recorded ${Math.round(ageHours)}h ago.`);
        } else {
          notes.push(`Backup is stale: last snapshot was ${Math.round(ageHours)}h ago.`);
          findings.push({
            id: `FND-BACKUP-STALE-${b.componentId}`,
            category: "missing_backup_evidence",
            severity: "high",
            title: `Backup Snapshot is Stale (> 26 Hours): ${b.componentName}`,
            description: `Component '${b.componentName}' (${b.componentId}) has not recorded a successful backup in ${Math.round(ageHours)} hours, violating daily backup policy.`,
            affectedComponentIds: [b.componentId],
            remediationRecommendation: "Inspect scheduled backup automation jobs, storage quotas, and snapshot failure alarms.",
          });
        }
      } else {
        notes.push("No recorded backup timestamp found.");
        findings.push({
          id: `FND-BACKUP-NEVER-RECORDED-${b.componentId}`,
          category: "missing_backup_evidence",
          severity: "critical",
          title: `No Verified Backup Execution Found: ${b.componentName}`,
          description: `Component '${b.componentName}' has backup configuration declared, but zero recorded backup execution history.`,
          affectedComponentIds: [b.componentId],
          remediationRecommendation: "Trigger an initial baseline backup snapshot and configure automated daily retention policies.",
        });
      }

      // 2. Restore verification check
      if (b.lastRestoreTestAt) {
        const lastRestoreMs = new Date(b.lastRestoreTestAt).getTime();
        const ageDays = (nowMs - lastRestoreMs) / THIRTY_DAYS_MS;
        if (ageDays <= 3) { // within 90 days (3 months)
          isRestoreVerified = true;
          notes.push(`Restore tested: verified on ${b.lastRestoreTestAt}.`);
        } else {
          isRestoreVerified = false;
          notes.push(`Restore test is overdue (> 90 days ago).`);
          findings.push({
            id: `FND-RESTORE-TEST-OVERDUE-${b.componentId}`,
            category: "untested_restore",
            severity: "high",
            title: `Backup Restore Drill Overdue (> 90 Days): ${b.componentName}`,
            description: `The backup for '${b.componentName}' was last tested for restoration on ${b.lastRestoreTestAt}. Unverified backups pose catastrophic recovery risk.`,
            affectedComponentIds: [b.componentId],
            remediationRecommendation: "Execute an automated or scheduled sandbox restore drill to verify data integrity and schema consistency.",
          });
        }
      } else {
        isRestoreVerified = false;
        notes.push("Backup exists, but has NEVER been tested for restoration.");
        findings.push({
          id: `FND-RESTORE-UNTESTED-${b.componentId}`,
          category: "untested_restore",
          severity: "critical",
          title: `Untested Backup: Zero Restore Verification Evidence: ${b.componentName}`,
          description: `A backup exists for '${b.componentName}', but it has NEVER undergone a restore drill. A backup that has not been restored is an untested assumption.`,
          affectedComponentIds: [b.componentId],
          remediationRecommendation: "Perform a mandatory restore test in an isolated non-production environment and verify row count and database checksums.",
        });
      }

      // 3. Encryption check
      if (!b.isEncrypted) {
        notes.push("Storage location is unencrypted.");
        findings.push({
          id: `FND-BACKUP-UNENCRYPTED-${b.componentId}`,
          category: "missing_backup_evidence",
          severity: "high",
          title: `Unencrypted Backup Storage Location: ${b.componentName}`,
          description: `Backup archive for '${b.componentName}' at '${b.storageLocation}' does not have encryption at rest enabled.`,
          affectedComponentIds: [b.componentId],
          remediationRecommendation: "Enable AES-256 or KMS envelope encryption on the target storage bucket or volume.",
        });
      }

      evaluatedBackups.push({
        backup: b,
        isFresh,
        isRestoreVerified,
        notes,
      });
    }

    return {
      evaluatedBackups,
      findings,
    };
  }

  /**
   * Evaluates failover readiness, region diversity, and failback procedures.
   */
  public static evaluateFailover(failovers: FailoverProcedure[]): {
    evaluatedFailovers: FailoverEvaluationItem[];
    findings: OperationalFinding[];
  } {
    const findings: OperationalFinding[] = [];
    const evaluatedFailovers: FailoverEvaluationItem[] = [];

    for (const f of failovers) {
      const notes: string[] = [];
      let isReady = f.readinessVerified;

      if (f.primaryRegion.toLowerCase() === f.secondaryRegion.toLowerCase()) {
        notes.push("Primary and secondary regions are identical (No geographic diversity).");
        findings.push({
          id: `FND-FAILOVER-SAME-REGION-${f.componentId}`,
          category: "single_region_dependency",
          severity: "critical",
          title: `Failover Target Shares Primary Region: ${f.componentId}`,
          description: `Component '${f.componentId}' defines primary and secondary regions both as '${f.primaryRegion}'. It will not survive a regional cloud outage.`,
          affectedComponentIds: [f.componentId],
          remediationRecommendation: "Configure secondary standby infrastructure in a geographically distinct cloud region.",
        });
        isReady = false;
      }

      if (!f.failbackProcedure || f.failbackProcedure.trim().length < 15) {
        notes.push("Failback procedure is undocumented or incomplete.");
        findings.push({
          id: `FND-FAILBACK-UNDOCUMENTED-${f.componentId}`,
          category: "untested_recovery",
          severity: "medium",
          title: `Undocumented Failback Procedure: ${f.componentId}`,
          description: `Component '${f.componentId}' has failover declared but lacks explicit steps to reverse traffic back to primary after regional recovery.`,
          affectedComponentIds: [f.componentId],
          remediationRecommendation: "Document data reconciliation and reverse synchronization steps required for failback.",
        });
      }

      evaluatedFailovers.push({
        failover: f,
        isReady,
        notes,
      });
    }

    return {
      evaluatedFailovers,
      findings,
    };
  }
}

