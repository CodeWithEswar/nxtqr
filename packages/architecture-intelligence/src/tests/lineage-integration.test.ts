/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Integration Tests: OpenAPI Importer, AI Assistant Tool #22, and Reports Integration
 */

import { describe, it, expect } from "vitest";
import { OpenApiImporter } from "../lineage/imports/openapi-importer";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import { architectureReportEngine } from "../reports/engine/report-engine";
import { ReportExportCoordinator } from "../reports/exporters";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ArchitectureDataLineageModel } from "../lineage/contracts/lineage.types";

describe("Phase 05.3.19: Lineage Integration Suite", () => {
  const sampleOpenApi = {
    openapi: "3.0.3",
    info: { title: "Customer Account API", version: "1.0.0" },
    paths: {
      "/api/v1/users": {
        post: {
          summary: "Register new customer",
          operationId: "registerUser",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", description: "Customer email" },
                    password: { type: "string", description: "Hashed password" },
                    phoneNumber: { type: "string", description: "Primary contact phone" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "User created" },
          },
        },
      },
    },
  };

  it("safely imports OpenAPI 3.x specification without executing code", () => {
    const importResult = OpenApiImporter.parse(
      sampleOpenApi,
      "user-service",
      "web-client",
      "arch-1",
      "proj-1"
    );

    expect(importResult.importedEndpointsCount).toBe(1);
    expect(importResult.assets.length).toBe(1);
    expect(importResult.flows.length).toBe(1);

    const asset = importResult.assets[0];
    expect(asset.fields?.length).toBe(3);

    // Check classification heuristics
    const emailField = asset.fields?.find((f) => f.name === "email");
    expect(emailField?.classification.level).toBe("confidential");
    expect(emailField?.classification.categories).toContain("personal_data");

    const passField = asset.fields?.find((f) => f.name === "password");
    expect(passField?.classification.level).toBe("restricted");
    expect(passField?.classification.categories).toContain("authentication");

    const flow = importResult.flows[0];
    expect(flow.sourceComponentId).toBe("web-client");
    expect(flow.destinationComponentId).toBe("user-service");
    expect(flow.protocol).toBe("HTTPS");
  });

  it("executes AI Copilot Tool #22 (get_data_lineage_and_privacy) cleanly", async () => {
    const nodes: BaseNode[] = [
      { id: "api-gw", type: "system_node", data: { label: "API Gateway", type: "api_gateway" }, position: { x: 0, y: 0 } },
      { id: "user-svc", type: "system_node", data: { label: "User Service", type: "microservice" }, position: { x: 100, y: 0 } },
      { id: "user-db", type: "system_node", data: { label: "User Database", type: "relational_db" }, position: { x: 200, y: 0 } },
    ];
    const edges: BaseEdge[] = [
      { id: "e1", source: "api-gw", target: "user-svc", data: {} },
      { id: "e2", source: "user-svc", target: "user-db", data: {} },
    ];

    const result = await architectureToolRegistry.executeTool(
      "get_data_lineage_and_privacy",
      { includePrivacyFindings: true, includeRetentionCoverage: true, includeDeletionImpact: true },
      {
        projectId: "proj-ai-test",
        architectureId: "arch-ai-test",
        graphRevision: "rev-1",
        nodes,
        edges,
      }
    );

    expect(result.error).toBeUndefined();
    const data = result.result as any;
    expect(data.summary).toBeDefined();
    expect(data.summary.totalAssets).toBeGreaterThan(0);
    expect(data.summary.totalFlows).toBeGreaterThan(0);
  });

  it("generates Architecture Report including lineage section and exports to Markdown and HTML", () => {
    const nodes: BaseNode[] = [
      { id: "client", type: "system_node", data: { label: "Client App" }, position: { x: 0, y: 0 } },
      { id: "db", type: "system_node", data: { label: "Postgres DB", type: "relational_db" }, position: { x: 200, y: 0 } },
    ];
    const edges: BaseEdge[] = [{ id: "e1", source: "client", target: "db", data: {} }];

    const sampleModel: ArchitectureDataLineageModel = {
      id: "lineage-model-rep",
      projectId: "proj-rep",
      architectureId: "arch-rep",
      graphRevision: "rev-rep",
      version: 1,
      assets: [
        {
          id: "asset-rep-1",
          projectId: "proj-rep",
          architectureId: "arch-rep",
          name: "Customer Records",
          classification: {
            id: "c-1",
            level: "confidential",
            categories: ["personal_data"],
            name: "PII",
            isLegalDetermination: false,
            provenance: { source: "modeled", timestamp: new Date().toISOString(), graphRevision: "rev-rep", confirmed: true },
          },
          storageBindings: [{ componentId: "db", componentName: "Postgres DB", storeType: "relational_db", copyType: "primary", isTransient: false }],
          retentionPolicy: { id: "ret-1", name: "Default 365d", durationDays: 365, trigger: "account_closure", deletionMethod: "hard_delete", hasBackupExemption: true },
          purposes: [],
          provenance: { source: "modeled", timestamp: new Date().toISOString(), graphRevision: "rev-rep", confirmed: true },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      flows: [
        {
          id: "f-rep-1",
          architectureId: "arch-rep",
          sourceComponentId: "client",
          destinationComponentId: "db",
          dataAssetIds: ["asset-rep-1"],
          direction: "forward",
          crossesTrustBoundary: true,
          isThirdPartyTransfer: false,
          purposes: [],
          provenance: { source: "modeled", timestamp: new Date().toISOString(), graphRevision: "rev-rep", confirmed: true },
          confirmed: true,
        },
      ],
      transformations: [],
      retentionPolicies: [],
      purposes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const report = architectureReportEngine.generateReport({
      projectId: "proj-rep",
      architectureId: "arch-rep",
      title: "Data Lineage & Privacy Architecture Review",
      nodes,
      edges,
      enabledSections: ["overview", "lineage"],
      analysisContext: {
        lineage: sampleModel,
      },
    });

    const lineageSec = report.sections.find((s) => s.kind === "lineage");
    expect(lineageSec).toBeDefined();

    // Export to Markdown
    const mdResult = ReportExportCoordinator.exportReport(report, { format: "markdown" });
    expect(typeof mdResult.content).toBe("string");
    expect(mdResult.content as string).toContain("Data Flow, Lineage & Privacy Analysis");
    expect(mdResult.content as string).toContain("Customer Records");

    // Export to HTML
    const htmlResult = ReportExportCoordinator.exportReport(report, { format: "html" });
    expect(typeof htmlResult.content).toBe("string");
    expect(htmlResult.content as string).toContain("Customer Records");
  });
});
