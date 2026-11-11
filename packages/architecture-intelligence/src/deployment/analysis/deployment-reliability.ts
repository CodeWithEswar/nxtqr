/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Deployment Reliability Evaluator
 * Evaluates multi-AZ redundancy, database replication, workload replica counts, and high availability.
 */

import type { DeploymentTopology } from "../contracts/deployment.types";

export interface DeploymentReliabilityMetrics {
  multiAzRedundancyScore: number; // 0 - 100
  databaseHaScore: number; // 0 - 100
  workloadResilienceScore: number; // 0 - 100
  overallScore: number; // 0 - 100
  totalZonesDetected: number;
  totalRegionsDetected: number;
  singleAzWorkloadCount: number;
  unreplicatedDatabaseCount: number;
  recommendations: string[];
}

export class DeploymentReliabilityEvaluator {
  public static evaluate(topology: DeploymentTopology): DeploymentReliabilityMetrics {
    const isProduction =
      topology.environment.category === "production" ||
      topology.environment.category === "disaster_recovery";

    const zones = new Set<string>();
    const regions = new Set<string>();

    for (const r of topology.resources) {
      if (r.zoneId) zones.add(r.zoneId);
      if (r.regionId) regions.add(r.regionId);
    }

    const totalZonesDetected = zones.size;
    const totalRegionsDetected = regions.size;

    // 1. Multi-AZ Score
    let multiAzRedundancyScore = 100;
    if (totalZonesDetected === 0) {
      multiAzRedundancyScore = 30; // Zone information not modeled
    } else if (totalZonesDetected === 1) {
      multiAzRedundancyScore = isProduction ? 40 : 80;
    } else if (totalZonesDetected === 2) {
      multiAzRedundancyScore = 90;
    } else {
      multiAzRedundancyScore = 100;
    }

    // 2. Workload Resilience Score (replicas and placement)
    const computeWorkloads = topology.resources.filter(
      (r) =>
        r.type === "k8s_workload" ||
        r.type === "vm" ||
        r.type === "serverless_function" ||
        r.type === "container_host"
    );

    let singleAzWorkloadCount = 0;
    let singleReplicaCount = 0;

    for (const w of computeWorkloads) {
      const replicas = (w.configuration?.replicas as number) ?? 1;
      if (replicas < 2 && isProduction) {
        singleReplicaCount++;
      }
      if (!w.zoneId && totalZonesDetected > 1) {
        // zone not assigned
      } else if (totalZonesDetected <= 1) {
        singleAzWorkloadCount++;
      }
    }

    let workloadResilienceScore = 100;
    if (computeWorkloads.length > 0) {
      const singleReplicaPenalty = (singleReplicaCount / computeWorkloads.length) * 40;
      const singleAzPenalty = (singleAzWorkloadCount / computeWorkloads.length) * 30;
      workloadResilienceScore = Math.max(10, Math.round(100 - singleReplicaPenalty - singleAzPenalty));
    }

    // 3. Database HA Score
    const dbResources = topology.resources.filter((r) => r.type === "managed_db");
    const replicatingDbIds = new Set<string>();

    for (const rel of topology.relationships) {
      if (rel.relationshipType === "replicates_to") {
        replicatingDbIds.add(rel.sourceResourceId);
        replicatingDbIds.add(rel.targetResourceId);
      }
    }

    let unreplicatedDatabaseCount = 0;
    for (const db of dbResources) {
      const hasMultiAz = db.configuration?.multiAz === true || db.configuration?.highAvailability === true;
      const hasReplication = replicatingDbIds.has(db.id);
      if (!hasMultiAz && !hasReplication) {
        unreplicatedDatabaseCount++;
      }
    }

    let databaseHaScore = 100;
    if (dbResources.length > 0) {
      const dbPenalty = (unreplicatedDatabaseCount / dbResources.length) * 60;
      databaseHaScore = Math.max(20, Math.round(100 - dbPenalty));
    }

    // Overall Score
    const overallScore = Math.round(
      multiAzRedundancyScore * 0.35 + workloadResilienceScore * 0.35 + databaseHaScore * 0.3
    );

    // Recommendations
    const recommendations: string[] = [];
    if (isProduction && totalZonesDetected < 2) {
      recommendations.push(
        "Deploy workloads across at least 2 Availability Zones to protect against datacenter-level outages."
      );
    }
    if (singleReplicaCount > 0) {
      recommendations.push(
        `Scale ${singleReplicaCount} single-replica production workloads to at least 2 instances for high availability.`
      );
    }
    if (unreplicatedDatabaseCount > 0) {
      recommendations.push(
        `Configure Multi-AZ failover or read replicas for ${unreplicatedDatabaseCount} primary databases.`
      );
    }
    if (totalRegionsDetected < 2 && isProduction) {
      recommendations.push(
        "Consider configuring a secondary disaster-recovery region with automated backup replication."
      );
    }
    if (recommendations.length === 0) {
      recommendations.push("Topology satisfies standard multi-AZ high availability and redundancy requirements.");
    }

    return {
      multiAzRedundancyScore,
      databaseHaScore,
      workloadResilienceScore,
      overallScore,
      totalZonesDetected,
      totalRegionsDetected,
      singleAzWorkloadCount,
      unreplicatedDatabaseCount,
      recommendations,
    };
  }
}

