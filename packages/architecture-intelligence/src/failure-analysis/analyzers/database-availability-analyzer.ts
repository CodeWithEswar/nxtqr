import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type { FailureFinding } from "../contracts/failure.types";

export class DatabaseAvailabilityAnalyzer {
  public static analyze(
    _nodes: BaseNode[],
    index: GraphIndex
  ): FailureFinding[] {
    const findings: FailureFinding[] = [];

    for (const dbId of index.dataStoreIds) {
      const dbNode = index.nodeMap.get(dbId);
      if (!dbNode) continue;

      const data = dbNode.data || {};
      const isMultiAz = Boolean(data.multiAz || data.highAvailability);
      const readReplicas = Number(data.readReplicas || 0);
      const backupEnabled = Boolean(data.backupEnabled || data.automatedBackup);

      // Rule DB-SPOF-001: Standalone Database with Zero Redundancy
      if (!isMultiAz && readReplicas === 0) {
        findings.push({
          id: `DB-SPOF-001:${dbId}`,
          ruleId: "DB-SPOF-001",
          severity: "critical",
          classification: "modeled-spof",
          title: `Single Point of Persistence Failure: ${dbNode.label || dbId}`,
          explanation: `Database "${dbNode.label || dbId}" operates as a standalone instance with neither Multi-AZ standby nor read replicas. A hardware crash, corrupt disk, or zone outage will immediately halt both read and write operations across all dependent business systems.`,
          affectedNodeIds: [dbId],
          affectedEdgeIds: [],
          affectedCapabilityIds: [],
          evidence: [
            {
              targetType: "node",
              targetId: dbId,
              description: `multiAz = false, readReplicas = 0.`,
            },
          ],
          assumptions: [
            "Data persistence is synchronous and essential to application transaction integrity",
          ],
          confidence: "high",
          recommendationIds: ["REC-FAIL-DB-001", "REC-FAIL-DB-002"],
          tradeOffs: [
            "Multi-AZ replication doubles database infrastructure cost",
          ],
        });
      }

      // Rule DB-BACKUP-NOT-HA: Backup Confused with High Availability
      if (!isMultiAz && readReplicas === 0 && backupEnabled) {
        findings.push({
          id: `DB-BACKUP-NOT-HA:${dbId}`,
          ruleId: "DB-BACKUP-NOT-HA",
          severity: "medium",
          classification: "potential-spof",
          title: `Backup Restoration Confused with High Availability: ${dbNode.label || dbId}`,
          explanation: `Database "${dbNode.label || dbId}" enables automated backups (backupEnabled = true), but lacks runtime replication (multiAz = false). Backup snapshots protect against disaster and data loss, but do NOT provide automated failover. Restoring from a backup snapshot requires minutes to hours of complete downtime.`,
          affectedNodeIds: [dbId],
          affectedEdgeIds: [],
          affectedCapabilityIds: [],
          evidence: [
            {
              targetType: "node",
              targetId: dbId,
              description: `backupEnabled = true, but multiAz = false.`,
            },
          ],
          assumptions: [
            "Point-in-time snapshot recovery requires provision-and-restore latency (RTO > 30m)",
          ],
          confidence: "high",
          recommendationIds: ["REC-FAIL-DB-001"],
          tradeOffs: [
            "High availability requires continuous replication and active standbys, not just scheduled backups",
          ],
        });
      }
    }

    return findings;
  }
}
