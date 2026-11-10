import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type { FailureFinding, ResolvedDependency } from "../contracts/failure.types";

export class MessagingNetworkAnalyzer {
  public static analyze(
    _nodes: BaseNode[],
    index: GraphIndex,
    dependencyMap: Map<string, ResolvedDependency[]>
  ): FailureFinding[] {
    const findings: FailureFinding[] = [];

    // 1. Single Point of Ingestion Queue (MSG-SPOF-001)
    for (const qId of index.queueIds) {
      const qNode = index.nodeMap.get(qId);
      if (!qNode) continue;

      const data = qNode.data || {};
      const isClustered = Boolean(data.isClustered || data.highAvailability || (Number(data.replicas || 1) > 1));

      if (!isClustered) {
        findings.push({
          id: `MSG-SPOF-001:${qId}`,
          ruleId: "MSG-SPOF-001",
          severity: "high",
          classification: "modeled-spof",
          title: `Single-Broker Ingestion Point: ${qNode.label || qId}`,
          explanation: `Message queue / topic "${qNode.label || qId}" operates as a standalone broker without cluster mirroring or multi-zone durability. Any broker failure prevents publishers from sending events and starves downstream consumers.`,
          affectedNodeIds: [qId],
          affectedEdgeIds: [],
          affectedCapabilityIds: [],
          evidence: [
            {
              targetType: "node",
              targetId: qId,
              description: `isClustered = false, replicas = ${data.replicas || 1}.`,
            },
          ],
          assumptions: [
            "Assumes asynchronous producers block or discard messages if queue becomes unreachable",
          ],
          confidence: "high",
          recommendationIds: ["REC-FAIL-SPOF-001"],
          tradeOffs: [
            "Clustered brokers require consensus coordination and partition replication overhead",
          ],
        });
      }
    }

    // 2. Single Ingress Gateway (NET-SPOF-001)
    for (const gwId of index.gatewayIds) {
      const gwNode = index.nodeMap.get(gwId);
      if (!gwNode) continue;

      // Only check if it's an entry point from clients
      if (index.entryPointIds.includes(gwId)) {
        const data = gwNode.data || {};
        const replicas = Number(data.replicas || 1);
        const isMultiZone = Boolean(data.multiAz || data.highAvailability || replicas > 1);

        if (!isMultiZone) {
          findings.push({
            id: `NET-SPOF-001:${gwId}`,
            ruleId: "NET-SPOF-001",
            severity: "high",
            classification: "modeled-spof",
            title: `Single Ingress Gateway: ${gwNode.label || gwId}`,
            explanation: `Ingress Gateway "${gwNode.label || gwId}" has only 1 replica (replicas = 1) with no multi-zone failover configured. As the sole public entry point into the architecture, its outage renders all internal services inaccessible.`,
            affectedNodeIds: [gwId],
            affectedEdgeIds: [],
            affectedCapabilityIds: [],
            evidence: [
              {
                targetType: "node",
                targetId: gwId,
                description: `Ingress component has replicas = 1, multiAz = false.`,
              },
            ],
            assumptions: [
              "Assumes public internet DNS resolves solely to this single gateway instance",
            ],
            confidence: "high",
            recommendationIds: ["REC-FAIL-SPOF-001"],
            tradeOffs: [
              "Multi-instance gateways require global load balancing or anycast BGP routing",
            ],
          });
        }
      }
    }

    // 3. Unprotected External Third-Party Dependency (EXT-SPOF-001)
    for (const [srcId, deps] of dependencyMap.entries()) {
      for (const dep of deps) {
        const targetNode = index.nodeMap.get(dep.targetId);
        if (!targetNode) continue;
        const targetType = targetNode.type.toLowerCase();

        if (
          (targetType.includes("third-party") || targetType.includes("external")) &&
          dep.isHardDependency &&
          dep.isSynchronous
        ) {
          const srcNode = index.nodeMap.get(srcId);
          findings.push({
            id: `EXT-SPOF-001:${dep.targetId}:${srcId}`,
            ruleId: "EXT-SPOF-001",
            severity: "high",
            classification: "potential-spof",
            title: `Unprotected External Dependency: ${targetNode.label || targetNode.id}`,
            explanation: `Component "${srcNode?.label || srcId}" has a synchronous hard dependency on external third-party API "${targetNode.label || targetNode.id}". Third-party latency spikes, rate limits, or outages will directly propagate up your service stack without isolation.`,
            affectedNodeIds: [srcId, dep.targetId],
            affectedEdgeIds: [dep.edgeId],
            affectedCapabilityIds: [],
            evidence: [
              {
                targetType: "edge",
                targetId: dep.edgeId,
                description: `Synchronous hard dependency on external component ${targetNode.id}.`,
              },
            ],
            assumptions: [
              "External APIs operate under distinct third-party SLAs and network paths outside your control",
            ],
            confidence: "high",
            recommendationIds: ["REC-FAIL-EXT-001"],
            tradeOffs: [
              "Circuit breaker and fallback caches require degraded-mode UX handling in client applications",
            ],
          });
        }
      }
    }

    return findings;
  }
}

