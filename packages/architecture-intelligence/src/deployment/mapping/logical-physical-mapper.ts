/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Logical-to-Physical Component Mapper
 */

import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  DeploymentMapping,
  DeploymentMappingType,
  DeploymentTopology,
  InfrastructureResource,
  ResourceProvenance,
} from "../contracts/deployment.types";

export interface CreateMappingParams {
  logicalComponentId: string;
  infrastructureResourceId: string;
  environmentId?: string;
  mappingType?: DeploymentMappingType;
  replicas?: number;
  provenance?: ResourceProvenance;
  confirmed?: boolean;
}

export interface CreateMappingNodeParams {
  logicalNode: BaseNode;
  infraResource: InfrastructureResource;
  environmentId: string;
  mappingType?: DeploymentMappingType;
  replicas?: number;
  provenance?: ResourceProvenance;
  confirmed?: boolean;
}

export class LogicalPhysicalMapper {
  /**
   * Compatibility matrix between logical component types and infrastructure resource types
   */
  private static readonly COMPATIBILITY_RULES: Record<string, string[]> = {
    service: ["vm", "bare_metal", "container_host", "k8s_workload", "serverless_function", "edge_worker"],
    api_gateway: ["api_gateway", "load_balancer", "edge_worker", "cdn_distribution", "vm", "k8s_workload"],
    database: ["managed_db", "db_replica", "vm", "bare_metal", "k8s_workload"],
    cache: ["cache_cluster", "vm", "k8s_workload"],
    queue: ["message_broker", "queue", "k8s_workload", "vm"],
    storage: ["object_storage", "block_storage"],
    load_balancer: ["load_balancer", "api_gateway", "cdn_distribution"],
  };

  public static isCompatible(
    logicalType: string,
    infraType: string,
    mappingType: DeploymentMappingType
  ): { compatible: boolean; reason?: string } {
    const lType = logicalType.toLowerCase();
    const allowedInfra = this.COMPATIBILITY_RULES[lType] || ["vm", "k8s_workload", "container_host"];

    if (!allowedInfra.includes(infraType)) {
      return {
        compatible: false,
        reason: `Logical '${logicalType}' is incompatible with infrastructure '${infraType}' for mapping type '${mappingType}'. Expected one of: ${allowedInfra.join(", ")}.`,
      };
    }

    return { compatible: true };
  }

  /**
   * Create or attach mapping. Supports both (topology, params) and (nodeParams) signatures.
   */
  public static createMapping(
    topologyOrParams: DeploymentTopology | CreateMappingNodeParams,
    maybeParams?: CreateMappingParams
  ): any {
    // Overload 1: (topology, mappingParams)
    if ("environment" in (topologyOrParams as any) && maybeParams) {
      const topology = topologyOrParams as DeploymentTopology;
      const params = maybeParams;
      const envId = params.environmentId || topology.environment.id;

      const mapping: DeploymentMapping = {
        id: `map-${params.logicalComponentId}-${params.infrastructureResourceId}`,
        logicalComponentId: params.logicalComponentId,
        infrastructureResourceId: params.infrastructureResourceId,
        environmentId: envId,
        mappingType: params.mappingType || "runs_on",
        replicas: params.replicas ?? 1,
        provenance: params.provenance || {
          source: "manually_modeled",
          confirmationStatus: params.confirmed ? "confirmed" : "pending_review",
        },
        confirmed: params.confirmed ?? true,
      };

      const existingIdx = topology.mappings.findIndex(
        (m) =>
          m.logicalComponentId === mapping.logicalComponentId &&
          m.infrastructureResourceId === mapping.infrastructureResourceId
      );

      const nextMappings = [...topology.mappings];
      if (existingIdx >= 0) {
        nextMappings[existingIdx] = mapping;
      } else {
        nextMappings.push(mapping);
      }

      return {
        ...topology,
        mappings: nextMappings,
        updatedAt: new Date().toISOString(),
      };
    }

    // Overload 2: (nodeParams)
    const nodeParams = topologyOrParams as CreateMappingNodeParams;
    const defaultMappingType: DeploymentMappingType =
      nodeParams.logicalNode?.type === "database"
        ? "stored_in"
        : nodeParams.logicalNode?.type === "queue"
        ? "implemented_by"
        : nodeParams.logicalNode?.type === "api_gateway"
        ? "served_by"
        : "runs_on";

    const mappingType = nodeParams.mappingType || defaultMappingType;

    const mapping: DeploymentMapping = {
      id: `map-${nodeParams.logicalNode.id}-${nodeParams.infraResource.id}`,
      logicalComponentId: nodeParams.logicalNode.id,
      infrastructureResourceId: nodeParams.infraResource.id,
      environmentId: nodeParams.environmentId,
      mappingType,
      replicas: nodeParams.replicas ?? 1,
      provenance: nodeParams.provenance || {
        source: "manually_modeled",
        confirmationStatus: nodeParams.confirmed ? "confirmed" : "pending_review",
      },
      confirmed: nodeParams.confirmed ?? true,
    };

    return mapping;
  }

  /**
   * Remove a deployment mapping by its ID.
   */
  public static removeMapping(topology: DeploymentTopology, mappingId: string): DeploymentTopology {
    return {
      ...topology,
      mappings: topology.mappings.filter((m) => m.id !== mappingId),
      updatedAt: new Date().toISOString(),
    };
  }
}
