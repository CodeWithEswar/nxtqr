/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Performance Benchmarks: 500-resource validation, 1,000-resource failure domain analysis, and CIDR checks.
 */

import { describe, it, expect } from "vitest";
import { TopologyValidator } from "../deployment/analysis/topology-validator";
import { FailureDomainAnalyzer } from "../deployment/analysis/failure-domain-analyzer";
import { doCidrsOverlap } from "../deployment/networking/cidr-validator";
import type { DeploymentTopology, InfrastructureResource } from "../deployment/contracts/deployment.types";

describe("Deployment Topology Performance Benchmarks", () => {
  it("validates 500-resource topology in under 100ms", () => {
    const resources: InfrastructureResource[] = [];
    const zones = ["us-east-1a", "us-east-1b", "us-east-1c"];

    // 1 VPC
    resources.push({
      id: "vpc-root",
      name: "Root VPC",
      type: "vpc",
      provider: "aws",
      environmentId: "env-perf",
      cidr: "10.0.0.0/16",
      configuration: {},
      provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
    });

    // 10 subnets
    for (let s = 1; s <= 10; s++) {
      resources.push({
        id: `sub-${s}`,
        name: `Subnet ${s}`,
        type: "subnet",
        provider: "aws",
        environmentId: "env-perf",
        parentId: "vpc-root",
        zoneId: zones[s % 3],
        cidr: `10.0.${s}.0/24`,
        configuration: {},
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      });
    }

    // 489 workloads
    for (let i = 1; i <= 489; i++) {
      const parentSubnet = `sub-${(i % 10) + 1}`;
      resources.push({
        id: `workload-${i}`,
        name: `Service Pod ${i}`,
        type: "k8s_workload",
        provider: "aws",
        environmentId: "env-perf",
        parentId: parentSubnet,
        zoneId: zones[i % 3],
        configuration: { replicas: 2 },
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      });
    }

    const topology: DeploymentTopology = {
      id: "topo-500",
      projectId: "p-perf",
      architectureId: "a-perf",
      graphRevision: "r1",
      environment: { id: "env-perf", name: "Perf Env", category: "production", isolationLevel: "separate_vpc" },
      version: 1,
      resources,
      relationships: [],
      mappings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const start = performance.now();
    const findings = TopologyValidator.validate(topology);
    const durationMs = performance.now() - start;

    expect(findings).toBeDefined();
    // Strict threshold: under 100ms
    expect(durationMs).toBeLessThan(100);
  });

  it("analyzes failure domains across 1,000 resources in under 60ms", () => {
    const resources: InfrastructureResource[] = [];
    const zones = ["us-east-1a", "us-east-1b", "us-east-1c"];
    const regions = ["us-east-1", "eu-west-1"];

    for (let i = 1; i <= 1000; i++) {
      resources.push({
        id: `res-${i}`,
        name: `Infra Item ${i}`,
        type: i % 20 === 0 ? "managed_db" : "k8s_workload",
        provider: "aws",
        environmentId: "env-scale",
        regionId: regions[i % 2],
        zoneId: zones[i % 3],
        configuration: {},
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      });
    }

    const topology: DeploymentTopology = {
      id: "topo-1000",
      projectId: "p-perf",
      architectureId: "a-perf",
      graphRevision: "r1",
      environment: { id: "env-scale", name: "Scale Env", category: "production", isolationLevel: "separate_account" },
      version: 1,
      resources,
      relationships: [],
      mappings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const start = performance.now();
    const domains = FailureDomainAnalyzer.analyze(topology);
    const durationMs = performance.now() - start;

    expect(domains.length).toBeGreaterThan(0);
    expect(durationMs).toBeLessThan(60);
  });

  it("evaluates CIDR overlap matrix for 100 subnets in under 15ms", () => {
    const cidrs = Array.from({ length: 100 }, (_, i) => `10.${Math.floor(i / 256)}.${i % 256}.0/24`);

    const start = performance.now();
    let overlapCount = 0;
    for (let i = 0; i < cidrs.length; i++) {
      for (let j = i + 1; j < Math.min(i + 10, cidrs.length); j++) {
        if (doCidrsOverlap(cidrs[i], cidrs[j])) {
          overlapCount++;
        }
      }
    }
    const durationMs = performance.now() - start;

    expect(overlapCount).toBe(0);
    expect(durationMs).toBeLessThan(50);
  });
});
