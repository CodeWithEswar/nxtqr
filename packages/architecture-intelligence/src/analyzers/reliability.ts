import type { AnalyzerContext, DimensionAssessment, HealthFinding } from "../contracts/health.types";
import type { IAnalyzer } from "./analyzer-interface";
import { calculateDimensionScore } from "../scoring/score-calculator";

export class ReliabilityAnalyzer implements IAnalyzer {
  public analyze(context: AnalyzerContext): DimensionAssessment {
    const { nodes, index, scoringPolicy } = context;
    const findings: HealthFinding[] = [];
    const assumptionsEvaluated: string[] = [];

    const evidenceCount = nodes.length;

    // Rule 1: Structural Single Point of Failure (SPOF) on Articulation Points
    for (const node of nodes) {
      if (index.isArticulationPoint(node.id)) {
        const data = node.data || {};
        const isRedundant =
          (data.replicas && Number(data.replicas) > 1) ||
          data.highAvailability === true ||
          data.multiAz === true ||
          data.clusteringEnabled === true;

        assumptionsEvaluated.push(`Node ${node.id} (${node.label || node.type}) redundancy check`);

        if (!isRedundant) {
          const isDataStore = index.dataStoreIds.includes(node.id);
          findings.push({
            id: `REL-SPOF-001:${node.id}`,
            ruleId: "REL-SPOF-001",
            dimension: "reliability",
            severity: isDataStore ? "critical" : "high",
            title: `Single Point of Failure: ${node.label || node.type}`,
            explanation: `Component "${node.label || node.type}" is a structural articulation point in the communication graph without declared multi-instance redundancy or automated failover. Failure of this node disconnects dependent services.`,
            evidence: [
              {
                kind: "node",
                elementId: node.id,
                propertyKey: "replicas",
                expectedValue: "> 1 or highAvailability: true",
                actualValue: data.replicas ?? 1,
                description: `Node ${node.id} is an articulation point with single instance.`,
              },
            ],
            affectedNodeIds: [node.id],
            affectedEdgeIds: [],
            assumptions: [
              "Assumes no external infrastructure-level clustering exists outside the diagram.",
            ],
            confidence: "high",
            recommendationIds: ["REC-REL-001"],
            documentationId: "load-balancer",
          });
        }
      }
    }

    // Rule 2: Load Balancer without Redundant Downstream Instances
    for (const lbId of index.entryPointIds) {
      const lbNode = index.nodeMap.get(lbId);
      if (lbNode && lbNode.type.toLowerCase().includes("load-balancer")) {
        const downstreams = index.getDownstreamNodes(lbId);
        assumptionsEvaluated.push(`Load Balancer ${lbId} downstream pool verification`);

        if (downstreams.length === 1) {
          const target = downstreams[0];
          const replicas = Number(target.data?.replicas || 1);
          if (replicas <= 1) {
            findings.push({
              id: `REL-REDUND-001:${lbId}`,
              ruleId: "REL-REDUND-001",
              dimension: "reliability",
              severity: "medium",
              title: `Single Backend Target behind Load Balancer: ${lbNode.label || lbNode.type}`,
              explanation: `Load balancer distributes traffic to only one downstream backend instance ("${target.label || target.type}"). Traffic cannot be rerouted if this backend fails.`,
              evidence: [
                {
                  kind: "node",
                  elementId: lbId,
                  description: `Load balancer routes to single backend ${target.id} with replicas = ${replicas}`,
                },
              ],
              affectedNodeIds: [lbId, target.id],
              affectedEdgeIds: [],
              assumptions: ["Assumes backend pool is fully represented in the diagram."],
              confidence: "high",
              recommendationIds: ["REC-REL-002"],
              documentationId: "load-balancer",
            });
          }
        }
      }
    }

    // Rule 3: Database without Replication or Multi-AZ Standby
    for (const dbId of index.dataStoreIds) {
      const dbNode = index.nodeMap.get(dbId);
      if (dbNode && (dbNode.type.includes("database") || dbNode.type.includes("relational-database"))) {
        const data = dbNode.data || {};
        assumptionsEvaluated.push(`Database ${dbId} replication verification`);

        const hasReplication =
          data.multiAz === true ||
          data.replicationMode === "synchronous" ||
          data.replicationMode === "asynchronous" ||
          Number(data.readReplicas || 0) > 0 ||
          data.highAvailability === true;

        if (!hasReplication) {
          findings.push({
            id: `REL-DB-REPL-001:${dbId}`,
            ruleId: "REL-DB-REPL-001",
            dimension: "reliability",
            severity: "high",
            title: `Unreplicated Primary Database: ${dbNode.label || dbNode.type}`,
            explanation: `Primary database "${dbNode.label || dbNode.type}" has no declared standby instance, multi-AZ deployment, or read replicas. In the event of host failure, recovery will require manual restoration.`,
            evidence: [
              {
                kind: "node",
                elementId: dbId,
                propertyKey: "multiAz",
                expectedValue: true,
                actualValue: data.multiAz ?? false,
                description: `Database has no replication or standby configured.`,
              },
            ],
            affectedNodeIds: [dbId],
            affectedEdgeIds: [],
            assumptions: [
              "Assumes database is not managed under an automated multi-region serverless cluster.",
            ],
            confidence: "medium",
            recommendationIds: ["REC-REL-003"],
            documentationId: "relational-database",
          });
        }
      }
    }

    // Rule 4: Message Queue without Dead-Letter Queue (DLQ)
    for (const qId of index.queueIds) {
      const qNode = index.nodeMap.get(qId);
      if (qNode) {
        const data = qNode.data || {};
        assumptionsEvaluated.push(`Message Queue ${qId} dead-letter queue verification`);

        const hasDlq = data.dlqEnabled === true || Boolean(data.deadLetterTarget) || Boolean(data.deadLetterQueue);
        if (!hasDlq) {
          findings.push({
            id: `REL-QUEUE-DLQ-001:${qId}`,
            ruleId: "REL-QUEUE-DLQ-001",
            dimension: "reliability",
            severity: "medium",
            title: `No Dead-Letter Queue Configured: ${qNode.label || qNode.type}`,
            explanation: `Queue or event stream "${qNode.label || qNode.type}" has no Dead Letter Queue (DLQ) configured. Poison pills or unhandled consumer exceptions could cause message loss or head-of-line blocking.`,
            evidence: [
              {
                kind: "node",
                elementId: qId,
                propertyKey: "dlqEnabled",
                expectedValue: true,
                actualValue: data.dlqEnabled ?? false,
                description: `Queue missing DLQ mechanism.`,
              },
            ],
            affectedNodeIds: [qId],
            affectedEdgeIds: [],
            assumptions: ["Consumer-side exception discard policies are not modeled."],
            confidence: "medium",
            recommendationIds: ["REC-REL-004"],
            documentationId: "message-queue",
          });
        }
      }
    }

    // Rule 5: Database without Backup Policy
    for (const dbId of index.dataStoreIds) {
      const dbNode = index.nodeMap.get(dbId);
      if (dbNode) {
        const data = dbNode.data || {};
        const hasBackup = data.backupEnabled === true || Boolean(data.backupSchedule) || Boolean(data.retentionPeriodDays);
        assumptionsEvaluated.push(`Datastore ${dbId} backup policy check`);

        if (data.backupEnabled === false || (!hasBackup && !data.ephemeral)) {
          findings.push({
            id: `REL-BACKUP-001:${dbId}`,
            ruleId: "REL-BACKUP-001",
            dimension: "reliability",
            severity: "medium",
            title: `No Automated Backup Policy: ${dbNode.label || dbNode.type}`,
            explanation: `Datastore "${dbNode.label || dbNode.type}" has no automated backup or snapshot policy declared. Recovery Point Objective (RPO) cannot be guaranteed in disaster recovery scenarios.`,
            evidence: [
              {
                kind: "node",
                elementId: dbId,
                propertyKey: "backupEnabled",
                expectedValue: true,
                actualValue: data.backupEnabled ?? false,
                description: `Missing backup schedule and retention policy.`,
              },
            ],
            affectedNodeIds: [dbId],
            affectedEdgeIds: [],
            assumptions: ["Assumes storage volume snapshots are not handled by an unmodeled cloud policy."],
            confidence: "medium",
            recommendationIds: ["REC-REL-005"],
            documentationId: "relational-database",
          });
        }
      }
    }

    const summary =
      findings.length === 0
        ? "Architecture exhibits high reliability with redundant paths and resilient service patterns."
        : `Identified ${findings.length} reliability risks including single points of failure and unmodeled redundancy.`;

    return calculateDimensionScore(
      "reliability",
      findings,
      evidenceCount,
      assumptionsEvaluated,
      summary,
      scoringPolicy
    );
  }
}
