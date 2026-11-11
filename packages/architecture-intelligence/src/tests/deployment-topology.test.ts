/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Unit Tests: Deployment Topology, CIDR, Network Paths, Mappings, Analysis & Drift
 */

import { describe, it, expect } from "vitest";
import {
  isValidCidr,
  parseCidr,
  doCidrsOverlap,
  isCidrContained,
  ipToInt,
  intToIp,
} from "../deployment/networking/cidr-validator";
import { NetworkPathAnalyzer } from "../deployment/networking/network-path-analyzer";
import { LogicalPhysicalMapper } from "../deployment/mapping/logical-physical-mapper";
import { MappingValidator } from "../deployment/mapping/mapping-validator";
import { TopologyValidator } from "../deployment/analysis/topology-validator";
import { FailureDomainAnalyzer } from "../deployment/analysis/failure-domain-analyzer";
import { DeploymentReliabilityEvaluator } from "../deployment/analysis/deployment-reliability";
import { DriftDetector } from "../deployment/analysis/drift-detector";
import type { DeploymentTopology, InfrastructureResource } from "../deployment/contracts/deployment.types";

describe("CIDR Validator & Bitwise Arithmetic", () => {
  it("converts IPv4 to 32-bit unsigned integer and back", () => {
    const ip = "192.168.1.1";
    const intVal = ipToInt(ip);
    expect(intVal).toBe(3232235777);
    expect(intToIp(intVal)).toBe(ip);
  });

  it("validates IPv4 CIDR blocks", () => {
    expect(isValidCidr("10.0.0.0/16")).toBe(true);
    expect(isValidCidr("192.168.1.0/24")).toBe(true);
    expect(isValidCidr("0.0.0.0/0")).toBe(true);
    expect(isValidCidr("10.0.0.0/33")).toBe(false);
    expect(isValidCidr("999.0.0.0/24")).toBe(false);
    expect(isValidCidr("invalid-cidr")).toBe(false);
  });

  it("calculates subnet range and usable host counts", () => {
    const parsed = parseCidr("10.0.1.0/24");
    expect(parsed).not.toBeNull();
    expect(parsed?.totalIps).toBe(256);
    expect(parsed?.usableIps).toBe(251); // AWS standard: -5 reserved
    expect(parsed?.firstIp).toBe("10.0.1.0");
    expect(parsed?.lastIp).toBe("10.0.1.255");
  });

  it("detects CIDR overlap accurately", () => {
    // Overlapping
    expect(doCidrsOverlap("10.0.1.0/24", "10.0.0.0/16")).toBe(true);
    expect(doCidrsOverlap("10.0.1.0/24", "10.0.1.128/25")).toBe(true);

    // Non-overlapping
    expect(doCidrsOverlap("10.0.1.0/24", "10.0.2.0/24")).toBe(false);
    expect(doCidrsOverlap("192.168.1.0/24", "10.0.1.0/24")).toBe(false);
  });

  it("checks CIDR containment (subnet in VPC)", () => {
    expect(isCidrContained("10.0.1.0/24", "10.0.0.0/16")).toBe(true);
    expect(isCidrContained("10.1.0.0/24", "10.0.0.0/16")).toBe(false);
  });
});

describe("Network Path Analyzer", () => {
  const sampleTopology: DeploymentTopology = {
    id: "topo-1",
    projectId: "p1",
    architectureId: "a1",
    graphRevision: "r1",
    environment: {
      id: "env-prod",
      name: "Production",
      category: "production",
      isolationLevel: "separate_vpc",
    },
    version: 1,
    resources: [
      {
        id: "res-sub-1",
        name: "Subnet 1",
        type: "subnet",
        provider: "aws",
        environmentId: "env-prod",
        cidr: "10.0.1.0/24",
        configuration: {},
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "res-sub-2",
        name: "Subnet 2",
        type: "subnet",
        provider: "aws",
        environmentId: "env-prod",
        cidr: "10.0.2.0/24",
        configuration: {},
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "res-vm-1",
        name: "VM 1",
        type: "vm",
        provider: "aws",
        environmentId: "env-prod",
        parentId: "res-sub-1",
        configuration: {},
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "res-vm-2",
        name: "VM 2",
        type: "vm",
        provider: "aws",
        environmentId: "env-prod",
        parentId: "res-sub-1",
        configuration: {},
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
      {
        id: "res-vm-3",
        name: "VM 3",
        type: "vm",
        provider: "aws",
        environmentId: "env-prod",
        parentId: "res-sub-2",
        configuration: {},
        provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
      },
    ],
    relationships: [
      {
        id: "rel-connected",
        sourceResourceId: "res-vm-1",
        targetResourceId: "res-vm-3",
        relationshipType: "connected_to",
        protocol: "TCP",
        portRange: "443",
      },
    ],
    mappings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("evaluates direct relationship connectivity", () => {
    const result = NetworkPathAnalyzer.evaluatePath(sampleTopology, "res-vm-1", "res-vm-3", 443);
    expect(result.status).toBe("allowed");
    expect(result.reasons[0]).toContain("Direct infrastructure relationship");
  });

  it("allows traffic between resources in the same subnet", () => {
    const result = NetworkPathAnalyzer.evaluatePath(sampleTopology, "res-vm-1", "res-vm-2");
    expect(result.status).toBe("allowed");
    expect(result.reasons[0]).toContain("same subnet");
  });

  it("reports denied/unknown when resources are in disconnected subnets without routes", () => {
    const result = NetworkPathAnalyzer.evaluatePath(sampleTopology, "res-vm-2", "res-vm-3");
    expect(result.status).toBe("denied");
  });
});

describe("Logical-to-Physical Mapper & Validator", () => {
  it("creates, updates, and removes deployment mappings", () => {
    let topology: DeploymentTopology = {
      id: "topo-test",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      environment: { id: "env-prod", name: "Prod", category: "production", isolationLevel: "separate_account" },
      version: 1,
      resources: [
        {
          id: "infra-k8s-pod",
          name: "Checkout Pod",
          type: "k8s_workload",
          provider: "aws",
          environmentId: "env-prod",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
      ],
      relationships: [],
      mappings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add mapping
    topology = LogicalPhysicalMapper.createMapping(topology, {
      logicalComponentId: "service-checkout",
      infrastructureResourceId: "infra-k8s-pod",
      mappingType: "runs_on",
      replicas: 3,
    });
    expect(topology.mappings.length).toBe(1);
    expect(topology.mappings[0].logicalComponentId).toBe("service-checkout");
    expect(topology.mappings[0].replicas).toBe(3);

    // Validate completeness
    const report = MappingValidator.validate(topology, ["service-checkout", "service-payment"]);
    expect(report.isComplete).toBe(false);
    expect(report.unmappedLogicalComponentIds).toEqual(["service-payment"]);
    expect(report.coveragePercentage).toBe(50);

    // Remove mapping
    topology = LogicalPhysicalMapper.removeMapping(topology, topology.mappings[0].id);
    expect(topology.mappings.length).toBe(0);
  });
});

describe("Topology Validator (Containment, Cycles & Collisions)", () => {
  it("detects containment cycles", () => {
    const cyclicTopology: DeploymentTopology = {
      id: "topo-cycle",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      environment: { id: "env-test", name: "Test", category: "testing", isolationLevel: "shared_infrastructure" },
      version: 1,
      resources: [
        {
          id: "res-a",
          name: "Resource A",
          type: "subnet",
          provider: "aws",
          environmentId: "env-test",
          parentId: "res-b",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
        {
          id: "res-b",
          name: "Resource B",
          type: "subnet",
          provider: "aws",
          environmentId: "env-test",
          parentId: "res-a",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
      ],
      relationships: [],
      mappings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const findings = TopologyValidator.validate(cyclicTopology);
    const cycleFinding = findings.find((f) => f.type === "containment_cycle");
    expect(cycleFinding).toBeDefined();
    expect(cycleFinding?.severity).toBe("critical");
  });

  it("detects CIDR collisions between subnets in the same VPC", () => {
    const collisionTopology: DeploymentTopology = {
      id: "topo-collision",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      environment: { id: "env-test", name: "Test", category: "testing", isolationLevel: "shared_infrastructure" },
      version: 1,
      resources: [
        {
          id: "vpc-main",
          name: "VPC Main",
          type: "vpc",
          provider: "aws",
          environmentId: "env-test",
          cidr: "10.0.0.0/16",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
        {
          id: "sub-1",
          name: "Subnet 1",
          type: "subnet",
          provider: "aws",
          environmentId: "env-test",
          parentId: "vpc-main",
          cidr: "10.0.1.0/24",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
        {
          id: "sub-2",
          name: "Subnet 2 (Overlapping)",
          type: "subnet",
          provider: "aws",
          environmentId: "env-test",
          parentId: "vpc-main",
          cidr: "10.0.1.128/25",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
      ],
      relationships: [],
      mappings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const findings = TopologyValidator.validate(collisionTopology);
    const overlapFinding = findings.find((f) => f.type === "cidr_overlap");
    expect(overlapFinding).toBeDefined();
    expect(overlapFinding?.severity).toBe("critical");
  });

  it("detects unshielded public databases", () => {
    const dbTopology: DeploymentTopology = {
      id: "topo-db",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      environment: { id: "env-test", name: "Test", category: "testing", isolationLevel: "shared_infrastructure" },
      version: 1,
      resources: [
        {
          id: "db-exposed",
          name: "Orders Postgres Database",
          type: "managed_db",
          provider: "aws",
          environmentId: "env-test",
          configuration: { isPublic: true },
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
      ],
      relationships: [],
      mappings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const findings = TopologyValidator.validate(dbTopology);
    const pubDbFinding = findings.find((f) => f.type === "public_unshielded_database");
    expect(pubDbFinding).toBeDefined();
    expect(pubDbFinding?.severity).toBe("critical");
  });
});

describe("Failure Domain & Reliability Analysis", () => {
  it("identifies single-AZ failure domain risks", () => {
    const singleAzTopology: DeploymentTopology = {
      id: "topo-az",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      environment: { id: "env-prod", name: "Prod", category: "production", isolationLevel: "separate_account" },
      version: 1,
      resources: [
        {
          id: "vm-1",
          name: "API Server 1",
          type: "vm",
          provider: "aws",
          environmentId: "env-prod",
          regionId: "us-east-1",
          zoneId: "us-east-1a",
          configuration: { replicas: 1 },
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
        {
          id: "vm-2",
          name: "API Server 2",
          type: "vm",
          provider: "aws",
          environmentId: "env-prod",
          regionId: "us-east-1",
          zoneId: "us-east-1a",
          configuration: { replicas: 1 },
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
        {
          id: "db-1",
          name: "Main DB",
          type: "managed_db",
          provider: "aws",
          environmentId: "env-prod",
          regionId: "us-east-1",
          zoneId: "us-east-1a",
          configuration: { multiAz: false },
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
      ],
      relationships: [],
      mappings: [
        {
          id: "m1",
          logicalComponentId: "srv-api",
          infrastructureResourceId: "vm-1",
          environmentId: "env-prod",
          mappingType: "runs_on",
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
          confirmed: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const domains = FailureDomainAnalyzer.analyze(singleAzTopology);
    const zoneDomain = domains.find((d) => d.domainType === "shared_zone");
    expect(zoneDomain).toBeDefined();
    expect(zoneDomain?.riskLevel).toBe("high");

    const reliability = DeploymentReliabilityEvaluator.evaluate(singleAzTopology);
    expect(reliability.multiAzRedundancyScore).toBeLessThanOrEqual(50);
    expect(reliability.unreplicatedDatabaseCount).toBe(1);
    expect(reliability.recommendations.length).toBeGreaterThan(0);
  });
});

describe("Architecture Drift Detector", () => {
  it("detects missing, unexpected, and configuration drift", () => {
    const plannedTopology: DeploymentTopology = {
      id: "topo-planned",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      environment: { id: "env-prod", name: "Prod", category: "production", isolationLevel: "separate_account" },
      version: 1,
      resources: [
        {
          id: "k8s-pod-1",
          name: "Payment Pod",
          type: "k8s_workload",
          provider: "aws",
          environmentId: "env-prod",
          regionId: "us-east-1",
          configuration: { replicas: 3 },
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
        {
          id: "k8s-pod-2",
          name: "Inventory Pod",
          type: "k8s_workload",
          provider: "aws",
          environmentId: "env-prod",
          regionId: "us-east-1",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
      ],
      relationships: [],
      mappings: [
        {
          id: "m1",
          logicalComponentId: "svc-pay",
          infrastructureResourceId: "k8s-pod-1",
          environmentId: "env-prod",
          mappingType: "runs_on",
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
          confirmed: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const observedResources: InfrastructureResource[] = [
      {
        id: "k8s-pod-1",
        name: "Payment Pod",
        type: "k8s_workload",
        provider: "aws",
        environmentId: "env-prod",
        regionId: "us-east-1",
        configuration: { replicas: 1 }, // Drifts from 3 to 1
        provenance: { source: "imported_configuration", confirmationStatus: "pending_review" },
      },
      {
        id: "rogue-vm",
        name: "Unregistered Debug VM",
        type: "vm",
        provider: "aws",
        environmentId: "env-prod",
        regionId: "us-east-1",
        configuration: {},
        provenance: { source: "imported_configuration", confirmationStatus: "pending_review" },
      },
      // Note: k8s-pod-2 is missing from observed
    ];

    const driftFindings = DriftDetector.detectDrift(plannedTopology, observedResources);

    const missing = driftFindings.find((f) => f.type === "missing_resource");
    expect(missing).toBeDefined();
    expect(missing?.resourceId).toBe("k8s-pod-2");

    const unexpected = driftFindings.find((f) => f.type === "unexpected_resource");
    expect(unexpected).toBeDefined();
    expect(unexpected?.resourceId).toBe("rogue-vm");

    const configDrift = driftFindings.find((f) => f.type === "configuration_drift");
    expect(configDrift).toBeDefined();
    expect(configDrift?.plannedValue).toBe(3);
    expect(configDrift?.actualValue).toBe(1);
  });
});
