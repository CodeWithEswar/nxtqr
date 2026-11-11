"use client";

/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * useArchitectureDeployment Hook
 */

import { useState, useMemo, useCallback } from "react";
import type { BaseNode } from "@nxtqr/graph-schema";
import {
  architectureDeploymentEngine,
  type DeploymentTopology,
  type DeploymentEnvironment,
  type DeploymentMappingType,
  type InfrastructureResource,
  type NetworkPathEvaluationResult,
  type FailureDomainItem,
  type TopologyValidationFinding,
  type DriftFinding,
  type DeploymentReliabilityMetrics,
  LogicalPhysicalMapper,
} from "@nxtqr/architecture-intelligence";

export type DeploymentViewMode = "deployment" | "logical" | "network" | "regions";

export interface UseArchitectureDeploymentOptions {
  projectId?: string;
  architectureId?: string;
  logicalNodes?: BaseNode[];
  initialTopology?: DeploymentTopology;
}

export function useArchitectureDeployment(options: UseArchitectureDeploymentOptions = {}) {
  const {
    projectId = "current-project",
    architectureId = "arch-default",
    logicalNodes = [],
    initialTopology,
  } = options;

  // Initial environment setup
  const [environments] = useState<DeploymentEnvironment[]>([
    {
      id: "env-prod",
      name: "Production (us-east-1)",
      category: "production",
      isolationLevel: "separate_account",
      description: "Primary production cluster and database tier",
    },
    {
      id: "env-staging",
      name: "Staging (us-east-1)",
      category: "staging",
      isolationLevel: "separate_vpc",
      description: "Pre-production integration and performance testbed",
    },
    {
      id: "env-dr",
      name: "Disaster Recovery (eu-west-1)",
      category: "disaster_recovery",
      isolationLevel: "separate_account",
      description: "Secondary active-standby disaster recovery region",
    },
    {
      id: "env-dev",
      name: "Development",
      category: "development",
      isolationLevel: "shared_cluster",
      description: "Isolated namespace on shared engineering cluster",
    },
  ]);

  const [activeEnvId, setActiveEnvId] = useState<string>("env-prod");
  const [viewMode, setViewMode] = useState<DeploymentViewMode>("deployment");
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  // Network probe states
  const [probeSourceId, setProbeSourceId] = useState<string | null>(null);
  const [probeTargetId, setProbeTargetId] = useState<string | null>(null);
  const [networkPathResult, setNetworkPathResult] = useState<NetworkPathEvaluationResult | null>(null);

  // Import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Active environment entity
  const activeEnvironment = useMemo(
    () => environments.find((e) => e.id === activeEnvId) || environments[0],
    [environments, activeEnvId]
  );

  // Topology State
  const [topology, setTopology] = useState<DeploymentTopology>(() => {
    if (initialTopology) return initialTopology;

    const base = architectureDeploymentEngine.createDefaultTopology(
      projectId,
      architectureId,
      environments[0]
    );

    // Initial multi-AZ production resources
    base.resources = [
      {
        id: "vpc-prod",
        name: "Primary VPC (10.0.0.0/16)",
        type: "vpc",
        provider: "aws",
        environmentId: "env-prod",
        regionId: "us-east-1",
        cidr: "10.0.0.0/16",
        configuration: { dnsSupport: true },
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "sub-public-1a",
        name: "Public Ingress Subnet 1A",
        type: "subnet",
        provider: "aws",
        environmentId: "env-prod",
        regionId: "us-east-1",
        zoneId: "us-east-1a",
        parentId: "vpc-prod",
        cidr: "10.0.1.0/24",
        configuration: { isPublic: true },
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "sub-private-1a",
        name: "Private App Subnet 1A",
        type: "subnet",
        provider: "aws",
        environmentId: "env-prod",
        regionId: "us-east-1",
        zoneId: "us-east-1a",
        parentId: "vpc-prod",
        cidr: "10.0.10.0/24",
        configuration: { isPublic: false },
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "sub-private-1b",
        name: "Private App Subnet 1B",
        type: "subnet",
        provider: "aws",
        environmentId: "env-prod",
        regionId: "us-east-1",
        zoneId: "us-east-1b",
        parentId: "vpc-prod",
        cidr: "10.0.11.0/24",
        configuration: { isPublic: false },
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "alb-ingress",
        name: "Public Application Load Balancer",
        type: "load_balancer",
        provider: "aws",
        environmentId: "env-prod",
        regionId: "us-east-1",
        parentId: "sub-public-1a",
        configuration: { scheme: "internet-facing", sslPolicy: "TLS1.3" },
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "k8s-prod-cluster",
        name: "EKS Production Cluster",
        type: "k8s_cluster",
        provider: "aws",
        environmentId: "env-prod",
        regionId: "us-east-1",
        parentId: "vpc-prod",
        configuration: { version: "1.30", multiZone: true },
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "k8s-workload-api",
        name: "API Gateway Deployment",
        type: "k8s_workload",
        provider: "aws",
        environmentId: "env-prod",
        regionId: "us-east-1",
        zoneId: "us-east-1a",
        parentId: "k8s-prod-cluster",
        configuration: { replicas: 3, memory: "4Gi", cpu: "2000m" },
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "db-aurora-primary",
        name: "Aurora Postgres Cluster (Primary)",
        type: "managed_db",
        provider: "aws",
        environmentId: "env-prod",
        regionId: "us-east-1",
        zoneId: "us-east-1a",
        parentId: "sub-private-1a",
        configuration: { multiAz: true, instanceClass: "db.r6g.2xlarge" },
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "db-aurora-replica",
        name: "Aurora Postgres Read Replica",
        type: "db_replica",
        provider: "aws",
        environmentId: "env-prod",
        regionId: "us-east-1",
        zoneId: "us-east-1b",
        parentId: "sub-private-1b",
        configuration: { instanceClass: "db.r6g.2xlarge" },
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
    ];

    base.relationships = [
      {
        id: "rel-alb-api",
        sourceResourceId: "alb-ingress",
        targetResourceId: "k8s-workload-api",
        relationshipType: "exposes",
        protocol: "HTTPS",
        portRange: "443",
      },
      {
        id: "rel-api-db",
        sourceResourceId: "k8s-workload-api",
        targetResourceId: "db-aurora-primary",
        relationshipType: "depends_on",
        protocol: "TCP",
        portRange: "5432",
      },
      {
        id: "rel-db-repl",
        sourceResourceId: "db-aurora-primary",
        targetResourceId: "db-aurora-replica",
        relationshipType: "replicates_to",
        protocol: "TCP",
        portRange: "5432",
      },
    ];

    return base;
  });

  // Assessment results
  const [validationFindings, setValidationFindings] = useState<TopologyValidationFinding[]>([]);
  const [failureDomains, setFailureDomains] = useState<FailureDomainItem[]>([]);
  const [reliabilityMetrics, setReliabilityMetrics] = useState<DeploymentReliabilityMetrics | null>(null);
  const [driftFindings, setDriftFindings] = useState<DriftFinding[]>([]);

  // Run full architecture deployment evaluation
  const runAssessment = useCallback(() => {
    const findings = architectureDeploymentEngine.validateTopology(topology);
    const domains = architectureDeploymentEngine.analyzeFailureDomains(topology);
    const reliability = architectureDeploymentEngine.evaluateReliability(topology);

    setValidationFindings(findings);
    setFailureDomains(domains);
    setReliabilityMetrics(reliability);

    return { findings, domains, reliability };
  }, [topology]);

  // Environment Switcher
  const handleSelectEnvironment = useCallback(
    (envId: string) => {
      setActiveEnvId(envId);
      const env = environments.find((e) => e.id === envId);
      if (env) {
        setTopology((prev) => ({
          ...prev,
          environment: env,
        }));
      }
    },
    [environments]
  );

  // Add Resource
  const handleAddResource = useCallback(
    (resource: Partial<InfrastructureResource>) => {
      const newRes: InfrastructureResource = {
        id: resource.id || `infra-${Date.now()}`,
        name: resource.name || "New Infrastructure Resource",
        type: resource.type || "k8s_workload",
        provider: resource.provider || "aws",
        environmentId: activeEnvId,
        regionId: resource.regionId || "us-east-1",
        zoneId: resource.zoneId,
        parentId: resource.parentId,
        cidr: resource.cidr,
        configuration: resource.configuration || {},
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      };

      setTopology((prev) => ({
        ...prev,
        resources: [...prev.resources, newRes],
        updatedAt: new Date().toISOString(),
      }));
    },
    [activeEnvId]
  );

  // Remove Resource
  const handleRemoveResource = useCallback((resourceId: string) => {
    setTopology((prev) => ({
      ...prev,
      resources: prev.resources.filter((r) => r.id !== resourceId),
      relationships: prev.relationships.filter(
        (rel) => rel.sourceResourceId !== resourceId && rel.targetResourceId !== resourceId
      ),
      mappings: prev.mappings.filter((m) => m.infrastructureResourceId !== resourceId),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Add or update mapping
  const handleAddMapping = useCallback(
    (logicalId: string, infraId: string, mappingType: DeploymentMappingType = "runs_on") => {
      setTopology((prev) =>
        LogicalPhysicalMapper.createMapping(prev, {
          logicalComponentId: logicalId,
          infrastructureResourceId: infraId,
          mappingType,
          replicas: 2,
        })
      );
    },
    []
  );

  // Remove mapping
  const handleRemoveMapping = useCallback((mappingId: string) => {
    setTopology((prev) => LogicalPhysicalMapper.removeMapping(prev, mappingId));
  }, []);

  // Evaluate Network Path
  const handleEvaluatePath = useCallback(
    (sourceId: string, targetId: string) => {
      setProbeSourceId(sourceId);
      setProbeTargetId(targetId);
      const res = architectureDeploymentEngine.evaluateNetworkPath(topology, sourceId, targetId);
      setNetworkPathResult(res);
      return res;
    },
    [topology]
  );

  // IaC Import
  const handleImportIaC = useCallback(
    (rawContent: string, format?: "terraform" | "kubernetes" | "auto") => {
      const result = architectureDeploymentEngine.importInfrastructure(
        rawContent,
        activeEnvId,
        format
      );

      // Merge newly parsed resources
      setTopology((prev) => ({
        ...prev,
        resources: [...prev.resources, ...result.newResources],
        updatedAt: new Date().toISOString(),
      }));

      // Detect drift between previous planned and newly imported
      const detectedDrift = architectureDeploymentEngine.detectDrift(topology, result.newResources);
      setDriftFindings(detectedDrift);

      return result;
    },
    [activeEnvId, topology]
  );

  return {
    environments,
    activeEnvironment,
    activeEnvId,
    setActiveEnvironment: handleSelectEnvironment,
    viewMode,
    setViewMode,
    topology,
    selectedResourceId,
    setSelectedResourceId,
    probeSourceId,
    probeTargetId,
    networkPathResult,
    evaluatePath: handleEvaluatePath,
    validationFindings,
    failureDomains,
    reliabilityMetrics,
    driftFindings,
    runAssessment,
    addResource: handleAddResource,
    removeResource: handleRemoveResource,
    addMapping: handleAddMapping,
    removeMapping: handleRemoveMapping,
    isImportModalOpen,
    setIsImportModalOpen,
    importIaC: handleImportIaC,
    logicalNodes,
  };
}

