import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type {
  FailureFinding,
  ResolvedDependency,
  RedundancyGroup,
} from "../contracts/failure.types";

export class SharedDependencyAnalyzer {
  public static analyze(
    _nodes: BaseNode[],
    index: GraphIndex,
    dependencyMap: Map<string, ResolvedDependency[]>,
    redundancyGroups: Record<string, RedundancyGroup>
  ): FailureFinding[] {
    const findings: FailureFinding[] = [];

    // 1. Shared Non-Replicated Database Dependency (SHARED-DEP-001)
    for (const dbId of index.dataStoreIds) {
      const dbNode = index.nodeMap.get(dbId);
      if (!dbNode) continue;

      const dbData = dbNode.data || {};
      const isMultiAz = Boolean(dbData.multiAz || dbData.highAvailability);
      const readReplicas = Number(dbData.readReplicas || 0);

      // If database is a single instance (not multi-AZ, no read replicas)
      if (!isMultiAz && readReplicas === 0) {
        const dependentServiceIds = index.getUpstreamNodes(dbId).map((n) => n.id);

        if (dependentServiceIds.length >= 2) {
          findings.push({
            id: `SHARED-DEP-001:${dbId}`,
            ruleId: "SHARED-DEP-001",
            severity: "critical",
            classification: "shared-dependency",
            title: `Shared Database Single Point of Failure: ${dbNode.label || dbId}`,
            explanation: `Multiple independent services (${dependentServiceIds.join(", ")}) share a single non-replicated database "${dbNode.label || dbId}". Even if upstream services are horizontally scaled, an outage of this single database causes simultaneous failure across all dependent services.`,
            affectedNodeIds: [dbId, ...dependentServiceIds],
            affectedEdgeIds: [],
            affectedCapabilityIds: [],
            evidence: [
              {
                targetType: "node",
                targetId: dbId,
                description: `Database has 0 read replicas, multiAz = false, shared by ${dependentServiceIds.length} upstream services.`,
              },
            ],
            assumptions: [
              "Assumes services perform synchronous state persistence against this database",
            ],
            confidence: "high",
            recommendationIds: ["REC-FAIL-DB-001", "REC-FAIL-SHARED-001"],
            tradeOffs: [
              "Provisioning Multi-AZ replication increases database infrastructure spend",
              "Database sharding or service-owned database isolation requires architectural refactoring",
            ],
          });
        }
      }
    }

    // 2. Correlated Failure Domain Risk (SHARED-FDOM-001)
    for (const group of Object.values(redundancyGroups)) {
      if (group.hasSingleFailureDomain && group.effectiveReplicas > 1) {
        findings.push({
          id: `SHARED-FDOM-001:${group.groupId}`,
          ruleId: "SHARED-FDOM-001",
          severity: "high",
          classification: "failure-domain-risk",
          title: `Correlated Failure Domain Risk: ${group.name}`,
          explanation: `Redundancy group "${group.name}" models ${group.effectiveReplicas} replicas, but all members are deployed within the same single failure domain (${group.deploymentDomains.join(", ") || "default-zone"}). A localized power, hardware, or network disruption in this zone will take down all instances simultaneously.`,
          affectedNodeIds: group.memberNodeIds,
          affectedEdgeIds: [],
          affectedCapabilityIds: [],
          evidence: [
            {
              targetType: "node",
              targetId: group.memberNodeIds[0],
              description: `All ${group.effectiveReplicas} replicas share deployment domain: ${group.deploymentDomains.join(", ") || "single-zone"}.`,
            },
          ],
          assumptions: [
            "Replicas located within the same datacenter or AZ are vulnerable to shared environmental outages",
          ],
          confidence: "high",
          recommendationIds: ["REC-FAIL-FDOM-001"],
          tradeOffs: [
            "Distributing instances across multiple Availability Zones incurs inter-zone data transfer costs",
          ],
        });
      }
    }

    // 3. Centralized Authentication Dependency (SHARED-AUTH-001)
    for (const [srcId, deps] of dependencyMap.entries()) {
      const authDeps = deps.filter((d) => d.kind === "authentication" && d.isHardDependency);
      if (authDeps.length > 0) {
        for (const ad of authDeps) {
          const authNode = index.nodeMap.get(ad.targetId);
          if (!authNode) continue;
          const authData = authNode.data || {};
          const isRedundant = Number(authData.replicas || 1) > 1 || authData.highAvailability;

          if (!isRedundant) {
            findings.push({
              id: `SHARED-AUTH-001:${ad.targetId}:${srcId}`,
              ruleId: "SHARED-AUTH-001",
              severity: "high",
              classification: "shared-dependency",
              title: `Un-replicated Authentication Dependency: ${authNode.label || authNode.id}`,
              explanation: `Component "${index.nodeMap.get(srcId)?.label || srcId}" has a synchronous hard dependency on single-instance identity provider "${authNode.label || authNode.id}". An identity service disruption halts user login and token validation.`,
              affectedNodeIds: [srcId, ad.targetId],
              affectedEdgeIds: [ad.edgeId],
              affectedCapabilityIds: [],
              evidence: [
                {
                  targetType: "edge",
                  targetId: ad.edgeId,
                  description: `Synchronous authentication dependency targeting single-instance ${authNode.id}.`,
                },
              ],
              assumptions: [
                "Assumes callers cannot validate tokens locally via cached public keys (JWKS)",
              ],
              confidence: "high",
              recommendationIds: ["REC-FAIL-SPOF-001", "REC-FAIL-EXT-001"],
              tradeOffs: [
                "Offline token validation requires asymmetric key caching and revocation checking policies",
              ],
            });
          }
        }
      }
    }

    return findings;
  }
}

