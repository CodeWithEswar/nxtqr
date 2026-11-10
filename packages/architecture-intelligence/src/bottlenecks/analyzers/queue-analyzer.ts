import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type {
  BottleneckFinding,
  WorkloadScenario,
  QueueMetrics,
} from "../contracts/bottleneck.types";
import type { NodeTrafficDemand } from "../engine/traffic-resolver";
import type { ResolvedComponentCapacity } from "../engine/capacity-resolver";

export class QueueAnalyzer {
  public static analyze(
    _nodes: BaseNode[],
    index: GraphIndex,
    demandMap: Map<string, NodeTrafficDemand>,
    capacityMap: Map<string, ResolvedComponentCapacity>,
    scenario: WorkloadScenario
  ): { findings: BottleneckFinding[]; queueMetrics: Record<string, QueueMetrics> } {
    const findings: BottleneckFinding[] = [];
    const queueMetrics: Record<string, QueueMetrics> = {};

    for (const qId of index.queueIds) {
      const qNode = index.nodeMap.get(qId);
      if (!qNode) continue;

      const demand = demandMap.get(qId) || { totalRps: 0, readRps: 0, writeRps: 0, bandwidthMbps: 0 };
      const arrivalRate = Math.round(demand.messageArrivalRate ?? demand.totalRps);

      // Find downstream consumers
      const downstreams = index.getDownstreamNodes(qId);
      let totalConsumerCapacity = 0;

      for (const consumer of downstreams) {
        const cCap = capacityMap.get(consumer.id);
        totalConsumerCapacity += cCap?.capacityMsgPerSec ?? cCap?.capacityRps ?? 1000;
      }

      // If no downstreams modeled, use queue's declared processing limit or baseline
      if (downstreams.length === 0) {
        totalConsumerCapacity = capacityMap.get(qId)?.capacityMsgPerSec ?? 2000;
      }

      const netGrowth = arrivalRate - totalConsumerCapacity;
      const isSaturating = netGrowth > 0;

      queueMetrics[qId] = {
        queueId: qId,
        arrivalRateMsgPerSec: arrivalRate,
        processingCapacityMsgPerSec: totalConsumerCapacity,
        netBacklogGrowthMsgPerSec: isSaturating ? netGrowth : 0,
        isSaturating,
      };

      // Rule BOT-QUE-001: Sustained Queue Backlog Growth
      if (isSaturating) {
        const backlog1Min = netGrowth * 60;
        const backlog1Hour = netGrowth * 3600;

        findings.push({
          id: `BOT-QUE-001:${qId}`,
          ruleId: "BOT-QUE-001",
          bottleneckType: "queue_backlog",
          severity: netGrowth > 500 ? "critical" : "high",
          title: `Sustained Queue Backlog Accumulation: ${qNode.label || qNode.type}`,
          explanation: `Message arrival rate (${arrivalRate} msg/s) exceeds downstream consumer processing capacity (${totalConsumerCapacity} msg/s) under the "${scenario.name}" scenario. The backlog will accumulate by ${netGrowth} messages/sec (~${backlog1Min.toLocaleString()} msgs/min, ~${backlog1Hour.toLocaleString()} msgs/hr).`,
          affectedNodeIds: [qId, ...downstreams.map((d) => d.id)],
          affectedEdgeIds: [],
          evidence: [
            {
              kind: "metric",
              elementId: qId,
              propertyKey: "netBacklogGrowthMsgPerSec",
              expectedValue: "<= 0 msg/s",
              actualValue: `+${netGrowth} msg/s`,
              description: `Queue arrival rate exceeds consumer processing capacity.`,
            },
          ],
          assumptions: [
            `Downstream consumers process at a maximum throughput of ${totalConsumerCapacity} msg/s.`,
            "Steady-state arrival rate assumed without exponential backoff backpressure.",
          ],
          calculations: [
            {
              formula: "netBacklogGrowth = arrivalRateMsgPerSec - consumerCapacityMsgPerSec",
              variables: {
                arrivalRateMsgPerSec: arrivalRate,
                consumerCapacityMsgPerSec: totalConsumerCapacity,
              },
              result: netGrowth,
              unit: "msg/s",
              explanation: "Net rate of message accumulation in queue buffer.",
            },
          ],
          recommendationIds: ["REC-BOT-QUE-001"],
          confidence: "high",
          tradeOffs: [
            "Scaling out consumer replicas increases database write contention and worker infrastructure cost.",
            "Dropping non-critical messages violates delivery guarantees.",
          ],
        });
      }
    }

    return { findings, queueMetrics };
  }
}
