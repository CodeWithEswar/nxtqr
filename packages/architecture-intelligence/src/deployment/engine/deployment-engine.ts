/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Core Deployment Engine Facade
 */

import type {
  DeploymentTopology,
  DeploymentEnvironment,
  InfrastructureResource,
  NetworkPathEvaluationResult,
  FailureDomainItem,
  TopologyValidationFinding,
  DriftFinding,
  ImportPreviewResult,
} from "../contracts/deployment.types";
import { TopologyValidator, type TopologyValidationOptions } from "../analysis/topology-validator";
import { FailureDomainAnalyzer } from "../analysis/failure-domain-analyzer";
import {
  DeploymentReliabilityEvaluator,
  type DeploymentReliabilityMetrics,
} from "../analysis/deployment-reliability";
import { DriftDetector, type DriftDetectionOptions } from "../analysis/drift-detector";
import { NetworkPathAnalyzer } from "../networking/network-path-analyzer";
import {
  MappingValidator,
  type MappingValidationReport,
} from "../mapping/mapping-validator";
import { ImportRegistry } from "../imports/import-registry";

export class ArchitectureDeploymentEngine {
  /**
   * Validate full deployment topology for structural, CIDR, and security integrity.
   */
  public validateTopology(
    topology: DeploymentTopology,
    options?: TopologyValidationOptions
  ): TopologyValidationFinding[] {
    return TopologyValidator.validate(topology, options);
  }

  /**
   * Evaluate network reachability and routing between two infrastructure resources.
   */
  public evaluateNetworkPath(
    topology: DeploymentTopology,
    sourceResourceId: string,
    targetResourceId: string,
    targetPort?: number
  ): NetworkPathEvaluationResult {
    return NetworkPathAnalyzer.evaluatePath(topology, sourceResourceId, targetResourceId, targetPort);
  }

  /**
   * Group infrastructure into failure domains and compute blast radius risks.
   */
  public analyzeFailureDomains(topology: DeploymentTopology): FailureDomainItem[] {
    return FailureDomainAnalyzer.analyze(topology);
  }

  /**
   * Evaluate multi-AZ redundancy, replication, and high availability metrics.
   */
  public evaluateReliability(topology: DeploymentTopology): DeploymentReliabilityMetrics {
    return DeploymentReliabilityEvaluator.evaluate(topology);
  }

  /**
   * Compare planned deployment topology against observed infrastructure inventory to detect drift.
   */
  public detectDrift(
    plannedTopology: DeploymentTopology,
    observedResources: InfrastructureResource[],
    options?: DriftDetectionOptions
  ): DriftFinding[] {
    return DriftDetector.detectDrift(plannedTopology, observedResources, options);
  }

  /**
   * Validate completeness and staleness of logical-to-physical component mappings.
   */
  public validateMappings(
    topology: DeploymentTopology,
    logicalNodeIds: string[]
  ): MappingValidationReport {
    return MappingValidator.validate(topology, logicalNodeIds);
  }

  /**
   * Import infrastructure resources from Terraform or Kubernetes manifests.
   */
  public importInfrastructure(
    rawContent: string,
    environmentId: string,
    format?: "terraform" | "kubernetes" | "docker_compose" | "auto"
  ): ImportPreviewResult {
    return ImportRegistry.parse(rawContent, environmentId, format);
  }

  /**
   * Create an initial blank deployment topology.
   */
  public createDefaultTopology(
    projectId: string,
    architectureId: string,
    environment?: Partial<DeploymentEnvironment>
  ): DeploymentTopology {
    const defaultEnv: DeploymentEnvironment = {
      id: environment?.id || "env-production",
      name: environment?.name || "Production",
      category: environment?.category || "production",
      isolationLevel: environment?.isolationLevel || "separate_account",
      description: environment?.description || "Default production environment",
    };

    const now = new Date().toISOString();

    return {
      id: `topo-${Date.now()}`,
      projectId,
      architectureId,
      graphRevision: "rev-1",
      environment: defaultEnv,
      version: 1,
      resources: [],
      relationships: [],
      mappings: [],
      createdAt: now,
      updatedAt: now,
    };
  }
}

export const architectureDeploymentEngine = new ArchitectureDeploymentEngine();

