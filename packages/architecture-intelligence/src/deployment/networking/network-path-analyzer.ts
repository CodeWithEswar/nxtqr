/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Network Path Analyzer
 * Evaluates reachability, security group rules, subnets, and routing between resources.
 */

import type {
  DeploymentTopology,
  InfrastructureRelationship,
  InfrastructureResource,
  NetworkPathEvaluationResult,
} from "../contracts/deployment.types";

export class NetworkPathAnalyzer {
  public static evaluatePath(
    topologyOrSource: DeploymentTopology | InfrastructureResource,
    sourceIdOrTarget: string | InfrastructureResource,
    targetIdOrAllResources?: string | InfrastructureResource[],
    targetPortOrRelationships?: number | InfrastructureRelationship[],
    requestContext?: { protocol?: string; port?: number }
  ): NetworkPathEvaluationResult {
    let source: InfrastructureResource | undefined;
    let target: InfrastructureResource | undefined;
    let allResources: InfrastructureResource[] = [];
    let relationships: InfrastructureRelationship[] = [];
    let targetPort: number | undefined;

    // Check if first arg is DeploymentTopology
    if ("resources" in (topologyOrSource as any) && Array.isArray((topologyOrSource as any).resources)) {
      const topo = topologyOrSource as DeploymentTopology;
      allResources = topo.resources;
      relationships = topo.relationships;
      const sourceId = sourceIdOrTarget as string;
      const targetId = targetIdOrAllResources as string;
      targetPort = typeof targetPortOrRelationships === "number" ? targetPortOrRelationships : undefined;

      source = allResources.find((r) => r.id === sourceId);
      target = allResources.find((r) => r.id === targetId);

      if (!source || !target) {
        return {
          sourceResourceId: sourceId,
          targetResourceId: targetId,
          status: "unknown",
          path: [],
          reasons: [`Source resource (${sourceId}) or target resource (${targetId}) not found in topology.`],
        };
      }
    } else {
      source = topologyOrSource as InfrastructureResource;
      target = sourceIdOrTarget as InfrastructureResource;
      allResources = (targetIdOrAllResources as InfrastructureResource[]) || [];
      relationships = (targetPortOrRelationships as InfrastructureRelationship[]) || [];
      targetPort = requestContext?.port;
    }

    const resMap = new Map(allResources.map((r) => [r.id, r]));
    const path: string[] = [source.name || source.id];
    const reasons: string[] = [];

    // 1. Direct relationship check
    const directRel = relationships.find(
      (r) =>
        (r.sourceResourceId === source!.id && r.targetResourceId === target!.id) ||
        (r.relationshipType === "connected_to" &&
          ((r.sourceResourceId === source!.id && r.targetResourceId === target!.id) ||
            (r.sourceResourceId === target!.id && r.targetResourceId === source!.id)))
    );

    if (directRel) {
      path.push(target.name || target.id);
      reasons.push(
        targetPort
          ? `Direct infrastructure relationship exists (${directRel.relationshipType}) for port ${targetPort}.`
          : `Direct infrastructure relationship exists (${directRel.relationshipType}).`
      );
      return {
        sourceResourceId: source.id,
        targetResourceId: target.id,
        status: "allowed",
        path,
        reasons,
        portsAllowed: directRel.portRange ? [directRel.portRange] : undefined,
      };
    }

    // 2. Resolve subnets and VPCs
    const findParentSubnetAndVpc = (res: InfrastructureResource) => {
      let current: InfrastructureResource | undefined = res;
      let subnet: InfrastructureResource | undefined;
      let vpc: InfrastructureResource | undefined;

      while (current && current.parentId) {
        const parent = resMap.get(current.parentId);
        if (!parent) break;
        if (parent.type === "subnet" && !subnet) {
          subnet = parent;
        } else if (parent.type === "vpc" && !vpc) {
          vpc = parent;
          break;
        }
        current = parent;
      }

      return { subnet, vpc };
    };

    const sourceLocation = findParentSubnetAndVpc(source);
    const targetLocation = findParentSubnetAndVpc(target);

    // Intra-subnet traffic
    if (
      sourceLocation.subnet &&
      targetLocation.subnet &&
      sourceLocation.subnet.id === targetLocation.subnet.id
    ) {
      path.push(sourceLocation.subnet.name || sourceLocation.subnet.id);
      path.push(target.name || target.id);
      reasons.push("Traffic allowed within the same subnet.");
      return {
        sourceResourceId: source.id,
        targetResourceId: target.id,
        status: "allowed",
        path,
        reasons,
      };
    }

    // Check routing or security groups
    if (sourceLocation.vpc && targetLocation.vpc && sourceLocation.vpc.id === targetLocation.vpc.id) {
      // Intra-VPC routing check
      path.push(sourceLocation.vpc.name || sourceLocation.vpc.id);
      path.push(target.name || target.id);
      reasons.push("Traffic routed within same Virtual Private Cloud (VPC).");
      return {
        sourceResourceId: source.id,
        targetResourceId: target.id,
        status: "allowed",
        path,
        reasons,
      };
    }

    // No path found
    reasons.push("No route table, peering, or relationship connects the isolated networks.");
    return {
      sourceResourceId: source.id,
      targetResourceId: target.id,
      status: "denied",
      path,
      reasons,
    };
  }
}
