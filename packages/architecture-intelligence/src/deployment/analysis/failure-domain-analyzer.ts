/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Failure Domain Analyzer
 * Identifies shared hosts, nodes, zones, regions, and storage failure domains.
 */

import type {
  DeploymentTopology,
  FailureDomainItem,
  InfrastructureResource,
} from "../contracts/deployment.types";

export class FailureDomainAnalyzer {
  /**
   * Analyze all failure domains across the deployment topology.
   */
  public static analyze(topology: DeploymentTopology): FailureDomainItem[] {
    const domains: FailureDomainItem[] = [];

    // Map resources by ID
    const resourceMap = new Map<string, InfrastructureResource>();
    for (const r of topology.resources) {
      resourceMap.set(r.id, r);
    }

    // Map logical components to infrastructure resources
    const logicalToResourceMap = new Map<string, string[]>();
    const resourceToLogicalMap = new Map<string, string[]>();
    for (const map of topology.mappings) {
      const resList = logicalToResourceMap.get(map.logicalComponentId) || [];
      resList.push(map.infrastructureResourceId);
      logicalToResourceMap.set(map.logicalComponentId, resList);

      const logList = resourceToLogicalMap.get(map.infrastructureResourceId) || [];
      logList.push(map.logicalComponentId);
      resourceToLogicalMap.set(map.infrastructureResourceId, logList);
    }

    // 1. Availability Zone Failure Domains
    domains.push(...this.analyzeZoneDomains(topology, resourceToLogicalMap));

    // 2. Region Failure Domains
    domains.push(...this.analyzeRegionDomains(topology, resourceToLogicalMap));

    // 3. Shared Cluster Failure Domains
    domains.push(...this.analyzeClusterDomains(topology, resourceToLogicalMap));

    // 4. Shared Host / VM Failure Domains
    domains.push(...this.analyzeHostDomains(topology, resourceToLogicalMap));

    // 5. Shared Storage Failure Domains
    domains.push(...this.analyzeStorageDomains(topology, resourceToLogicalMap));

    return domains;
  }

  /**
   * Group resources by Availability Zone and identify single-zone failure risks.
   */
  private static analyzeZoneDomains(
    topology: DeploymentTopology,
    resourceToLogicalMap: Map<string, string[]>
  ): FailureDomainItem[] {
    const domains: FailureDomainItem[] = [];
    const resourcesByZone = new Map<string, InfrastructureResource[]>();

    for (const res of topology.resources) {
      if (res.zoneId) {
        const list = resourcesByZone.get(res.zoneId) || [];
        list.push(res);
        resourcesByZone.set(res.zoneId, list);
      }
    }

    // If all resources in an environment reside in a single AZ
    const distinctZones = Array.from(resourcesByZone.keys());

    for (const [zoneId, resList] of resourcesByZone.entries()) {
      const resIds = resList.map((r) => r.id);
      const logicalIds = new Set<string>();
      for (const rid of resIds) {
        const logs = resourceToLogicalMap.get(rid) || [];
        for (const lid of logs) logicalIds.add(lid);
      }

      const isSingleZoneSetup = distinctZones.length === 1 && resList.length > 2;
      const riskLevel = isSingleZoneSetup ? "high" : "medium";

      domains.push({
        domainId: `domain-zone-${zoneId}`,
        domainType: "shared_zone",
        name: `Availability Zone: ${zoneId}`,
        resourceIds: resIds,
        logicalComponentIds: Array.from(logicalIds),
        riskLevel,
        description: isSingleZoneSetup
          ? `All ${resList.length} resources in environment reside in single AZ '${zoneId}'. Failure of this zone causes complete service outage.`
          : `Resources share availability zone '${zoneId}'. Outage in this AZ affects ${resIds.length} infrastructure items and ${logicalIds.size} logical components.`,
      });
    }

    return domains;
  }

  /**
   * Group resources by Region.
   */
  private static analyzeRegionDomains(
    topology: DeploymentTopology,
    resourceToLogicalMap: Map<string, string[]>
  ): FailureDomainItem[] {
    const domains: FailureDomainItem[] = [];
    const resourcesByRegion = new Map<string, InfrastructureResource[]>();

    for (const res of topology.resources) {
      if (res.regionId) {
        const list = resourcesByRegion.get(res.regionId) || [];
        list.push(res);
        resourcesByRegion.set(res.regionId, list);
      }
    }

    const distinctRegions = Array.from(resourcesByRegion.keys());

    for (const [regionId, resList] of resourcesByRegion.entries()) {
      const resIds = resList.map((r) => r.id);
      const logicalIds = new Set<string>();
      for (const rid of resIds) {
        const logs = resourceToLogicalMap.get(rid) || [];
        for (const lid of logs) logicalIds.add(lid);
      }

      const isSingleRegion = distinctRegions.length === 1 && resList.length > 1;
      const riskLevel = isSingleRegion ? "medium" : "low";

      domains.push({
        domainId: `domain-region-${regionId}`,
        domainType: "shared_region",
        name: `Geographic Region: ${regionId}`,
        resourceIds: resIds,
        logicalComponentIds: Array.from(logicalIds),
        riskLevel,
        description: isSingleRegion
          ? `Entire topology operates within single region '${regionId}'. Lack of multi-region disaster recovery target.`
          : `Multi-region setup includes '${regionId}' hosting ${resList.length} resources.`,
      });
    }

    return domains;
  }

  /**
   * Group workloads by Kubernetes cluster or container orchestrator.
   */
  private static analyzeClusterDomains(
    topology: DeploymentTopology,
    resourceToLogicalMap: Map<string, string[]>
  ): FailureDomainItem[] {
    const domains: FailureDomainItem[] = [];
    const clusters = topology.resources.filter((r) => r.type === "k8s_cluster");

    for (const cluster of clusters) {
      // Find all resources that belong to this cluster (direct child or nested)
      const clusterMembers = topology.resources.filter(
        (r) => r.parentId === cluster.id || r.configuration?.clusterId === cluster.id
      );
      const memberIds = [cluster.id, ...clusterMembers.map((m) => m.id)];

      const logicalIds = new Set<string>();
      for (const mid of memberIds) {
        const logs = resourceToLogicalMap.get(mid) || [];
        for (const lid of logs) logicalIds.add(lid);
      }

      domains.push({
        domainId: `domain-cluster-${cluster.id}`,
        domainType: "shared_cluster",
        name: `Cluster Failure Domain: ${cluster.name}`,
        resourceIds: memberIds,
        logicalComponentIds: Array.from(logicalIds),
        riskLevel: logicalIds.size > 5 ? "high" : "medium",
        description: `Cluster '${cluster.name}' hosts ${clusterMembers.length} resources and ${logicalIds.size} logical components. Control plane failure or cluster upgrades impact all co-located workloads.`,
      });
    }

    return domains;
  }

  /**
   * Identify multiple workloads co-located on the same host or VM.
   */
  private static analyzeHostDomains(
    topology: DeploymentTopology,
    resourceToLogicalMap: Map<string, string[]>
  ): FailureDomainItem[] {
    const domains: FailureDomainItem[] = [];
    const hosts = topology.resources.filter((r) => r.type === "vm" || r.type === "bare_metal");

    for (const host of hosts) {
      // Find workloads deployed on this host
      const hostedResources = topology.resources.filter((r) => r.parentId === host.id);
      if (hostedResources.length > 1) {
        const resIds = [host.id, ...hostedResources.map((h) => h.id)];
        const logicalIds = new Set<string>();
        for (const id of resIds) {
          const logs = resourceToLogicalMap.get(id) || [];
          for (const lid of logs) logicalIds.add(lid);
        }

        domains.push({
          domainId: `domain-host-${host.id}`,
          domainType: "shared_host",
          name: `Shared Host: ${host.name}`,
          resourceIds: resIds,
          logicalComponentIds: Array.from(logicalIds),
          riskLevel: "medium",
          description: `Host '${host.name}' co-locates ${hostedResources.length} workloads. Host failure or reboot causes simultaneous termination of all co-located services.`,
        });
      }
    }

    return domains;
  }

  /**
   * Shared storage and database dependencies across multiple services.
   */
  private static analyzeStorageDomains(
    topology: DeploymentTopology,
    resourceToLogicalMap: Map<string, string[]>
  ): FailureDomainItem[] {
    const domains: FailureDomainItem[] = [];
    const storageTypes = new Set(["managed_db", "object_storage", "block_storage", "cache_cluster"]);
    const storageResources = topology.resources.filter((r) => storageTypes.has(r.type));

    for (const storage of storageResources) {
      // Find incoming connections or mappings
      const dependentResources = topology.relationships
        .filter((rel) => rel.targetResourceId === storage.id && rel.relationshipType === "depends_on")
        .map((rel) => rel.sourceResourceId);

      const mappedLogical = resourceToLogicalMap.get(storage.id) || [];

      if (dependentResources.length > 1 || mappedLogical.length > 1) {
        domains.push({
          domainId: `domain-storage-${storage.id}`,
          domainType: "shared_storage",
          name: `Shared Storage Domain: ${storage.name}`,
          resourceIds: [storage.id, ...dependentResources],
          logicalComponentIds: mappedLogical,
          riskLevel: mappedLogical.length > 2 ? "high" : "medium",
          description: `Data store '${storage.name}' is shared by ${dependentResources.length} components / ${mappedLogical.length} logical models. High blast radius if degraded.`,
        });
      }
    }

    return domains;
  }
}

