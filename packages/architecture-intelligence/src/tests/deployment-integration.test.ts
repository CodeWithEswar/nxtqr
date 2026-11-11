/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Integration Tests: Terraform/K8s Importers, AI Tool #21, and Architecture Reports Generator
 */

import { describe, it, expect } from "vitest";
import { TerraformImporter } from "../deployment/imports/terraform-importer";
import { KubernetesImporter } from "../deployment/imports/kubernetes-importer";
import { ImportRegistry } from "../deployment/imports/import-registry";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import { SectionComposer } from "../reports/engine/section-composer";
import { MarkdownExporter } from "../reports/exporters/markdown-exporter";
import { HtmlExporter } from "../reports/exporters/html-exporter";
import { SourceResolver } from "../reports/engine/source-resolver";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { DeploymentTopology } from "../deployment/contracts/deployment.types";

describe("Terraform Plan JSON Importer", () => {
  it("parses Terraform plan JSON and redacts sensitive credentials", () => {
    const rawTerraformJson = JSON.stringify({
      format_version: "1.0",
      terraform_version: "1.8.0",
      resource_changes: [
        {
          address: "aws_vpc.primary",
          type: "aws_vpc",
          name: "primary",
          change: {
            actions: ["create"],
            after: {
              cidr_block: "10.0.0.0/16",
              enable_dns_hostnames: true,
              tags: { Environment: "Production" },
            },
          },
        },
        {
          address: "aws_subnet.public_1a",
          type: "aws_subnet",
          name: "public_1a",
          change: {
            actions: ["create"],
            after: {
              cidr_block: "10.0.1.0/24",
              availability_zone: "us-east-1a",
            },
          },
        },
        {
          address: "aws_db_instance.orders_db",
          type: "aws_db_instance",
          name: "orders_db",
          change: {
            actions: ["create"],
            after: {
              engine: "postgres",
              instance_class: "db.r6g.xlarge",
              master_password: "super_secret_production_password_123",
              secret_token: "api-tok-998877",
            },
          },
        },
      ],
    });

    const result = TerraformImporter.parse(rawTerraformJson, "env-prod");
    expect(result.sourceFormat).toBe("terraform");
    expect(result.totalParsed).toBe(3);
    expect(result.newResources.length).toBe(3);
    expect(result.sensitiveFieldsRedacted).toBeGreaterThanOrEqual(2);

    const dbRes = result.newResources.find((r) => r.type === "managed_db");
    expect(dbRes).toBeDefined();
    expect(dbRes?.configuration.master_password).toBe("[REDACTED]");
    expect(dbRes?.configuration.secret_token).toBe("[REDACTED]");
  });
});

describe("Kubernetes Manifest Importer", () => {
  it("parses multi-document Kubernetes YAML into workloads and services", () => {
    const k8sManifestYaml = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: e-commerce
spec:
  replicas: 3
---
apiVersion: v1
kind: Service
metadata:
  name: order-lb
  namespace: e-commerce
spec:
  type: LoadBalancer
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: e-commerce-ingress
  namespace: e-commerce
`;

    const result = KubernetesImporter.parse(k8sManifestYaml, "env-prod", "k8s-cluster-1");
    expect(result.sourceFormat).toBe("kubernetes");
    expect(result.newResources.length).toBe(3);

    const deployment = result.newResources.find((r) => r.type === "k8s_workload");
    expect(deployment).toBeDefined();
    expect(deployment?.name).toBe("order-service");
    expect(deployment?.configuration.replicas).toBe(3);

    const lb = result.newResources.find((r) => r.type === "load_balancer");
    expect(lb).toBeDefined();

    const ingress = result.newResources.find((r) => r.type === "api_gateway");
    expect(ingress).toBeDefined();
  });

  it("auto-detects format via ImportRegistry", () => {
    const k8sContent = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-app
`;
    expect(ImportRegistry.detectFormat(k8sContent)).toBe("kubernetes");
  });
});

describe("AI Copilot Tool #21: get_deployment_topology", () => {
  it("executes get_deployment_topology and returns structured deployment intelligence", async () => {
    const mockNodes: BaseNode[] = [
      {
        id: "svc-order",
        type: "service",
        position: { x: 0, y: 0 },
        data: { label: "Order Service", type: "microservice" },
      },
      {
        id: "db-postgres",
        type: "database",
        position: { x: 200, y: 0 },
        data: { label: "Order Database", type: "database_sql" },
      },
    ];

    const mockEdges: BaseEdge[] = [
      {
        id: "edge-1",
        source: "svc-order",
        target: "db-postgres",
        data: {},
      },
    ];

    const context = {
      projectId: "proj-1",
      nodes: mockNodes,
      edges: mockEdges,
      architectureId: "arch-1",
      graphRevision: "rev-1",
      conversationId: "conv-1",
    };

    const execResponse = await architectureToolRegistry.executeTool(
      "get_deployment_topology",
      { environmentCategory: "production", includeFailureDomains: true },
      context
    );

    expect(execResponse.success).toBe(true);
    const result = execResponse.result as any;

    expect(result).toBeDefined();
    expect(result.environment.category).toBe("production");
    expect(result.summary.totalResources).toBeGreaterThanOrEqual(4);
    expect(result.summary.mappedLogicalComponents).toBe(2);
    expect(result.reliabilityMetrics).toBeDefined();
    expect(result.failureDomains.length).toBeGreaterThan(0);
  });
});

describe("Reports Generator Integration (Deployment Section)", () => {
  it("composes and exports deployment section into Markdown and HTML", () => {
    const mockNodes: BaseNode[] = [
      {
        id: "node-api",
        type: "service",
        position: { x: 0, y: 0 },
        data: { label: "API Gateway" },
      },
    ];

    const sampleTopology: DeploymentTopology = {
      id: "topo-rep",
      projectId: "proj-1",
      architectureId: "arch-main",
      graphRevision: "rev-2",
      environment: {
        id: "env-prod",
        name: "US-Production",
        category: "production",
        isolationLevel: "separate_account",
      },
      version: 1,
      resources: [
        {
          id: "vpc-prod",
          name: "VPC Production",
          type: "vpc",
          provider: "aws",
          environmentId: "env-prod",
          regionId: "us-east-1",
          cidr: "10.0.0.0/16",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
        {
          id: "db-prod",
          name: "Main PostgreSQL",
          type: "managed_db",
          provider: "aws",
          environmentId: "env-prod",
          regionId: "us-east-1",
          zoneId: "us-east-1a",
          configuration: { multiAz: true },
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
      ],
      relationships: [],
      mappings: [
        {
          id: "m-1",
          logicalComponentId: "node-api",
          infrastructureResourceId: "vpc-prod",
          environmentId: "env-prod",
          mappingType: "runs_on",
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
          confirmed: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sections = SectionComposer.composeSections({
      nodes: mockNodes,
      edges: [],
      topology: SourceResolver.resolveTopology(mockNodes, []),
      evidence: [],
      analysisContext: {
        deployment: {
          topology: sampleTopology,
          failureDomains: [
            {
              domainId: "fd-1",
              domainType: "shared_zone",
              name: "Availability Zone us-east-1a",
              resourceIds: ["db-prod"],
              logicalComponentIds: ["node-api"],
              riskLevel: "medium",
              description: "Resources sharing AZ 1A",
            },
          ],
          reliability: {
            multiAzRedundancyScore: 90,
            databaseHaScore: 100,
            workloadResilienceScore: 85,
            overallScore: 92,
            totalZonesDetected: 2,
            totalRegionsDetected: 1,
            singleAzWorkloadCount: 0,
            unreplicatedDatabaseCount: 0,
            recommendations: [],
          },
          findings: [],
        },
      },
      audience: "engineering",
      enabledKinds: ["deployment"],
    });

    expect(sections.length).toBe(1);
    expect(sections[0].kind).toBe("deployment");

    const report: any = {
      id: "rep-1",
      title: "Architecture Deployment Report",
      graphRevision: "rev-2",
      audience: "engineering",
      versionNumber: 1,
      status: "verified",
      author: "NXTQR Engineer",
      generatedAt: new Date().toISOString(),
      architectureId: "arch-main",
      sections,
      evidence: [],
      assumptions: [],
      decisions: [],
    };

    // Markdown Export
    const mdResult = MarkdownExporter.export(report);
    expect(mdResult.content).toContain("Deployment Topology & Infrastructure Architecture");
    expect(mdResult.content).toContain("US-Production");
    expect(mdResult.content).toContain("VPC Production");
    expect(mdResult.content).toContain("Multi-AZ Redundancy Score: **90%**");

    // HTML Export
    const htmlResult = HtmlExporter.export(report);
    expect(htmlResult.content).toContain("Deployment Topology");
    expect(htmlResult.content).toContain("US-Production");
    expect(htmlResult.content).toContain("VPC Production");
    expect(htmlResult.content).toContain("90%");
  });
});
