/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Topology Validator
 * Checks containment cycles, missing parents, CIDR overlap, unshielded databases, and cross-environment leakage.
 */

import type {
  DeploymentTopology,
  InfrastructureResource,
  TopologyValidationFinding,
} from "../contracts/deployment.types";
import { isValidCidr, doCidrsOverlap, isCidrContained } from "../networking/cidr-validator";

export interface TopologyValidationOptions {
  checkCidrCollisions?: boolean;
  checkContainmentCycles?: boolean;
  checkDanglingReferences?: boolean;
  checkPublicDatabases?: boolean;
  checkCrossEnvironmentLeakage?: boolean;
}

export class TopologyValidator {
  /**
   * Validate full deployment topology for structural, networking, and security integrity.
   */
  public static validate(
    topology: DeploymentTopology,
    options: TopologyValidationOptions = {}
  ): TopologyValidationFinding[] {
    const findings: TopologyValidationFinding[] = [];
    const resources = topology.resources;
    const resourceMap = new Map<string, InfrastructureResource>();
    for (const res of resources) {
      resourceMap.set(res.id, res);
    }

    const {
      checkCidrCollisions = true,
      checkContainmentCycles = true,
      checkDanglingReferences = true,
      checkPublicDatabases = true,
      checkCrossEnvironmentLeakage = true,
    } = options;

    if (checkContainmentCycles) {
      findings.push(...this.checkContainmentCycles(resources));
    }

    if (checkDanglingReferences) {
      findings.push(...this.checkDanglingReferences(resources, resourceMap));
    }

    if (checkCidrCollisions) {
      findings.push(...this.checkCidrIntegrity(resources));
    }

    if (checkPublicDatabases) {
      findings.push(...this.checkPublicDatabases(topology, resourceMap));
    }

    if (checkCrossEnvironmentLeakage) {
      findings.push(...this.checkCrossEnvironmentLeakage(topology, resourceMap));
    }

    return findings;
  }

  /**
   * Detect cycles in parent-child hierarchy (e.g. A -> B -> A).
   */
  private static checkContainmentCycles(
    resources: InfrastructureResource[]
  ): TopologyValidationFinding[] {
    const findings: TopologyValidationFinding[] = [];
    const resourceMap = new Map<string, InfrastructureResource>();
    for (const res of resources) {
      resourceMap.set(res.id, res);
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();

    for (const res of resources) {
      if (visited.has(res.id)) continue;

      const path: string[] = [];
      let current: InfrastructureResource | undefined = res;

      while (current) {
        if (recStack.has(current.id)) {
          // Cycle found
          const cycleStartIdx = path.indexOf(current.id);
          const cyclePath = path.slice(cycleStartIdx).concat(current.id);
          findings.push({
            id: `finding-cycle-${current.id}`,
            severity: "critical",
            type: "containment_cycle",
            title: `Containment cycle detected: ${cyclePath.join(" -> ")}`,
            description: `Infrastructure resources have circular parent-child containment hierarchy: ${cyclePath.join(" -> ")}. This prevents correct hierarchy rendering and tree layout.`,
            affectedResourceIds: cyclePath,
            remediation: "Break the circular containment by clearing the parentId on one of the resources.",
          });
          break;
        }

        if (visited.has(current.id)) break;

        recStack.add(current.id);
        visited.add(current.id);
        path.push(current.id);

        if (current.parentId) {
          current = resourceMap.get(current.parentId);
        } else {
          current = undefined;
        }
      }

      for (const id of path) {
        recStack.delete(id);
      }
    }

    return findings;
  }

  /**
   * Check for resources whose parentId points to a non-existent resource.
   */
  private static checkDanglingReferences(
    resources: InfrastructureResource[],
    resourceMap: Map<string, InfrastructureResource>
  ): TopologyValidationFinding[] {
    const findings: TopologyValidationFinding[] = [];

    for (const res of resources) {
      if (res.parentId && !resourceMap.has(res.parentId)) {
        findings.push({
          id: `finding-dangling-parent-${res.id}`,
          severity: "high",
          type: "dangling_parent_reference",
          title: `Resource ${res.name} references non-existent parent`,
          description: `Resource "${res.name}" (${res.id}) has parentId "${res.parentId}" which does not exist in the topology resources.`,
          affectedResourceIds: [res.id],
          remediation: `Reassign parentId for "${res.name}" or import the missing parent resource.`,
        });
      }
    }

    return findings;
  }

  /**
   * Validate CIDRs for syntax, VPC-to-subnet containment, and subnet collision within same VPC.
   */
  private static checkCidrIntegrity(
    resources: InfrastructureResource[]
  ): TopologyValidationFinding[] {
    const findings: TopologyValidationFinding[] = [];

    // 1. Syntax check
    for (const res of resources) {
      if (res.cidr && !isValidCidr(res.cidr)) {
        findings.push({
          id: `finding-invalid-cidr-${res.id}`,
          severity: "high",
          type: "invalid_cidr",
          title: `Invalid CIDR block on ${res.name}`,
          description: `Resource "${res.name}" (${res.id}) has invalid CIDR "${res.cidr}". Must be valid IPv4 notation (e.g. 10.0.0.0/16).`,
          affectedResourceIds: [res.id],
          remediation: "Correct the CIDR block to follow standard IPv4 CIDR notation.",
        });
      }
    }

    // Group subnets by their parent VPC
    const vpcs = resources.filter((r) => r.type === "vpc" && r.cidr && isValidCidr(r.cidr));
    const subnets = resources.filter((r) => r.type === "subnet" && r.cidr && isValidCidr(r.cidr));

    const subnetsByParent = new Map<string, InfrastructureResource[]>();
    for (const sub of subnets) {
      if (sub.parentId) {
        const list = subnetsByParent.get(sub.parentId) || [];
        list.push(sub);
        subnetsByParent.set(sub.parentId, list);
      }
    }

    // Check subnets inside VPCs
    for (const vpc of vpcs) {
      const vpcSubnets = subnetsByParent.get(vpc.id) || [];
      if (!vpc.cidr) continue;

      // Check containment
      for (const subnet of vpcSubnets) {
        if (!subnet.cidr) continue;
        if (!isCidrContained(subnet.cidr, vpc.cidr)) {
          findings.push({
            id: `finding-cidr-out-of-bounds-${subnet.id}`,
            severity: "critical",
            type: "cidr_out_of_bounds",
            title: `Subnet ${subnet.name} CIDR not contained in VPC ${vpc.name}`,
            description: `Subnet CIDR "${subnet.cidr}" is not inside parent VPC CIDR "${vpc.cidr}". Traffic cannot be routed properly.`,
            affectedResourceIds: [subnet.id, vpc.id],
            remediation: `Adjust subnet CIDR to be a sub-block of ${vpc.cidr}.`,
          });
        }
      }

      // Check peer collisions within same VPC
      for (let i = 0; i < vpcSubnets.length; i++) {
        for (let j = i + 1; j < vpcSubnets.length; j++) {
          const s1 = vpcSubnets[i];
          const s2 = vpcSubnets[j];
          if (s1.cidr && s2.cidr && doCidrsOverlap(s1.cidr, s2.cidr)) {
            findings.push({
              id: `finding-cidr-overlap-${s1.id}-${s2.id}`,
              severity: "critical",
              type: "cidr_overlap",
              title: `CIDR collision between subnets ${s1.name} and ${s2.name}`,
              description: `Subnets "${s1.name}" (${s1.cidr}) and "${s2.name}" (${s2.cidr}) share overlapping address space in VPC "${vpc.name}".`,
              affectedResourceIds: [s1.id, s2.id, vpc.id],
              remediation: "Reallocate non-overlapping IP address ranges for each subnet.",
            });
          }
        }
      }
    }

    return findings;
  }

  /**
   * Check for managed databases or caches that are directly exposed or lack security groups.
   */
  private static checkPublicDatabases(
    topology: DeploymentTopology,
    resourceMap: Map<string, InfrastructureResource>
  ): TopologyValidationFinding[] {
    const findings: TopologyValidationFinding[] = [];
    const dataResourceTypes = new Set(["managed_db", "db_replica", "cache_cluster"]);

    const protectedByTargets = new Set<string>();
    for (const rel of topology.relationships) {
      if (rel.relationshipType === "protected_by") {
        protectedByTargets.add(rel.sourceResourceId);
      }
    }

    for (const res of topology.resources) {
      if (!dataResourceTypes.has(res.type)) continue;

      // Check if it has a direct public IP or is in a public subnet
      const isPublic = res.configuration?.isPublic === true || res.configuration?.publiclyAccessible === true;
      let inPublicSubnet = false;

      if (res.parentId) {
        const parent = resourceMap.get(res.parentId);
        if (parent && parent.type === "subnet") {
          inPublicSubnet = parent.configuration?.isPublic === true;
        }
      }

      if (isPublic || inPublicSubnet) {
        findings.push({
          id: `finding-public-db-${res.id}`,
          severity: "critical",
          type: "public_unshielded_database",
          title: `Publicly accessible database: ${res.name}`,
          description: `Database "${res.name}" is directly accessible from the public internet or located in a public subnet. Databases must be placed in isolated private subnets.`,
          affectedResourceIds: [res.id],
          remediation: "Place the database in a private subnet and disable public accessibility.",
        });
      }

      // Check firewall protection
      const isProtected = protectedByTargets.has(res.id) || res.configuration?.securityGroups !== undefined;
      if (!isProtected && !res.parentId) {
        findings.push({
          id: `finding-unshielded-db-${res.id}`,
          severity: "high",
          type: "unshielded_database",
          title: `Database ${res.name} has no firewall or security group`,
          description: `Data store "${res.name}" does not have an attached security group or firewall rule protecting incoming connections.`,
          affectedResourceIds: [res.id],
          remediation: "Attach a security group restricting ingress traffic to authorized application tiers only.",
        });
      }
    }

    return findings;
  }

  /**
   * Detect relationships or mappings that leak across environment boundaries.
   */
  private static checkCrossEnvironmentLeakage(
    topology: DeploymentTopology,
    resourceMap: Map<string, InfrastructureResource>
  ): TopologyValidationFinding[] {
    const findings: TopologyValidationFinding[] = [];
    const envId = topology.environment.id;

    for (const rel of topology.relationships) {
      const src = resourceMap.get(rel.sourceResourceId);
      const tgt = resourceMap.get(rel.targetResourceId);

      if (src && tgt && src.environmentId !== tgt.environmentId) {
        findings.push({
          id: `finding-cross-env-rel-${rel.id}`,
          severity: "high",
          type: "cross_environment_relationship",
          title: `Cross-environment relationship: ${src.name} to ${tgt.name}`,
          description: `Resource "${src.name}" in environment "${src.environmentId}" connects directly to "${tgt.name}" in environment "${tgt.environmentId}".`,
          affectedResourceIds: [src.id, tgt.id],
          remediation: "Isolate environments completely. Ensure production does not interconnect with non-production tiers.",
        });
      }
    }

    for (const map of topology.mappings) {
      if (map.environmentId !== envId) {
        findings.push({
          id: `finding-mismatched-env-mapping-${map.id}`,
          severity: "medium",
          type: "environment_mapping_mismatch",
          title: `Mapping belongs to different environment`,
          description: `Mapping ${map.id} is tagged with environment "${map.environmentId}", but active topology is "${envId}".`,
          affectedResourceIds: [map.infrastructureResourceId],
          affectedLogicalComponentIds: [map.logicalComponentId],
          remediation: "Sync mapping environment tag with active topology environment.",
        });
      }
    }

    return findings;
  }
}
