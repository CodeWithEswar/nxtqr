/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Mapping Completeness & Staleness Validator
 */

import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  DeploymentMapping,
  DeploymentTopology,
  InfrastructureResource,
  TopologyValidationFinding,
} from "../contracts/deployment.types";

export interface MappingCompletenessReport {
  totalLogicalComponents: number;
  mappedLogicalComponents: number;
  unmappedLogicalComponents: BaseNode[];
  totalWorkloads: number;
  mappedWorkloads: number;
  unmappedWorkloads: InfrastructureResource[];
  staleMappings: DeploymentMapping[];
  findings: TopologyValidationFinding[];
}

export interface MappingValidationReport {
  isComplete: boolean;
  coveragePercentage: number;
  mappedLogicalComponentIds: string[];
  unmappedLogicalComponentIds: string[];
  staleMappingIds: string[];
}

export class MappingValidator {
  private static readonly WORKLOAD_TYPES = new Set([
    "vm",
    "bare_metal",
    "container_host",
    "k8s_workload",
    "serverless_function",
    "edge_worker",
    "managed_db",
    "cache_cluster",
    "message_broker",
  ]);

  /**
   * Lightweight validation against a list of logical component IDs and a deployment topology.
   */
  public static validate(
    topology: DeploymentTopology,
    logicalNodeIds: string[]
  ): MappingValidationReport {
    const resourceIds = new Set(topology.resources.map((r) => r.id));
    const mappedLogicalIds = new Set<string>();
    const staleMappingIds: string[] = [];

    for (const mapping of topology.mappings) {
      if (!resourceIds.has(mapping.infrastructureResourceId)) {
        staleMappingIds.push(mapping.id);
      } else {
        mappedLogicalIds.add(mapping.logicalComponentId);
      }
    }

    const unmappedLogicalComponentIds = logicalNodeIds.filter((id) => !mappedLogicalIds.has(id));
    const isComplete = unmappedLogicalComponentIds.length === 0;
    const coveragePercentage =
      logicalNodeIds.length === 0
        ? 100
        : Math.round(((logicalNodeIds.length - unmappedLogicalComponentIds.length) / logicalNodeIds.length) * 100);

    return {
      isComplete,
      coveragePercentage,
      mappedLogicalComponentIds: Array.from(mappedLogicalIds),
      unmappedLogicalComponentIds,
      staleMappingIds,
    };
  }

  /**
   * Deep completeness evaluation returning full BaseNode and InfrastructureResource details.
   */
  public static evaluateCompleteness(
    logicalNodes: BaseNode[],
    resources: InfrastructureResource[],
    mappings: DeploymentMapping[]
  ): MappingCompletenessReport {
    const nodeMap = new Map(logicalNodes.map((n) => [n.id, n]));
    const resMap = new Map(resources.map((r) => [r.id, r]));

    const mappedNodeIds = new Set<string>();
    const mappedResIds = new Set<string>();
    const staleMappings: DeploymentMapping[] = [];
    const findings: TopologyValidationFinding[] = [];

    // 1. Process mappings
    for (const mapping of mappings) {
      const node = nodeMap.get(mapping.logicalComponentId);
      const res = resMap.get(mapping.infrastructureResourceId);

      if (!node || !res) {
        staleMappings.push(mapping);
        findings.push({
          id: `finding-stale-map-${mapping.id}`,
          severity: "high",
          type: "stale_mapping",
          title: `Stale Deployment Mapping: ${mapping.id}`,
          description: `Mapping references missing ${!node ? "logical node" : "infrastructure resource"}.`,
          affectedResourceIds: res ? [res.id] : [],
          affectedLogicalComponentIds: node ? [node.id] : [],
          remediation: "Remove or re-link stale deployment mapping.",
        });
      } else {
        mappedNodeIds.add(node.id);
        mappedResIds.add(res.id);
      }
    }

    // 2. Identify unmapped logical components (services, dbs, queues)
    const unmappedLogicalComponents: BaseNode[] = [];
    for (const node of logicalNodes) {
      if (!mappedNodeIds.has(node.id)) {
        unmappedLogicalComponents.push(node);
        findings.push({
          id: `finding-unmapped-logical-${node.id}`,
          severity: "medium",
          type: "unmapped_logical_component",
          title: `Unmapped Logical Component: ${(node.data?.label as string) || node.id}`,
          description: `Logical component '${(node.data?.label as string) || node.id}' (${node.type}) has no target infrastructure mapping in this deployment environment.`,
          affectedResourceIds: [],
          affectedLogicalComponentIds: [node.id],
          remediation: "Map this logical component to an infrastructure workload or managed resource.",
        });
      }
    }

    // 3. Identify unmapped infrastructure workloads (orphaned servers or clusters)
    const unmappedWorkloads: InfrastructureResource[] = [];
    for (const res of resources) {
      if (MappingValidator.WORKLOAD_TYPES.has(res.type) && !mappedResIds.has(res.id)) {
        unmappedWorkloads.push(res);
        findings.push({
          id: `finding-unmapped-workload-${res.id}`,
          severity: "low",
          type: "unmapped_infrastructure_workload",
          title: `Unmapped Infrastructure Workload: ${res.name}`,
          description: `Infrastructure workload '${res.name}' (${res.type}) has no corresponding logical architecture component mapped to it.`,
          affectedResourceIds: [res.id],
          remediation: "Verify if this workload represents legacy shadow infrastructure or map to a logical service.",
        });
      }
    }

    return {
      totalLogicalComponents: logicalNodes.length,
      mappedLogicalComponents: mappedNodeIds.size,
      unmappedLogicalComponents,
      totalWorkloads: resources.filter((r) => MappingValidator.WORKLOAD_TYPES.has(r.type)).length,
      mappedWorkloads: mappedResIds.size,
      unmappedWorkloads,
      staleMappings,
      findings,
    };
  }
}
