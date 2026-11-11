/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Integration Tests: AI Copilot Tool #23, Reports Generator & Drift Detection
 */

import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import { architectureReportEngine } from "../reports/engine/report-engine";
import { ReportExportCoordinator } from "../reports/exporters";
import { ContractCoverageAnalyzer } from "../api-contracts/analysis/contract-coverage";
import { ContractDriftDetector } from "../api-contracts/analysis/contract-drift";
import type { APIContract } from "../api-contracts/contracts/contract.types";

describe("Phase 05.3.20: Contracts Integration Suite", () => {
  const sampleNow = new Date().toISOString();

  const sampleContract: APIContract = {
    id: "contract-payments",
    projectId: "proj-int-test",
    architectureId: "arch-int-test",
    name: "Payment Gateway API",
    protocol: "rest",
    specificationFormat: "openapi_3x",
    providerServiceId: "payment-service",
    currentRevisionId: "rev-v1",
    lifecycleStatus: "active",
    exposure: "internal",
    revisions: [
      {
        id: "rev-v1",
        contractId: "contract-payments",
        revisionHash: "hash-v1",
        versionLabel: "v1.0.0",
        specificationVersion: "3.0.0",
        operations: [
          {
            id: "op-charge",
            operationId: "createCharge",
            protocol: "rest",
            method: "POST",
            path: "/v1/charges",
            summary: "Create payment charge",
            isDeprecated: false,
            provenance: { source: "declared", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
          },
        ],
        schemas: {},
        validationStatus: "valid",
        createdAt: sampleNow,
      },
    ],
    provenance: { source: "declared", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
    createdAt: sampleNow,
    updatedAt: sampleNow,
  };

  it("executes AI Copilot Tool #23 (get_api_contracts_and_compatibility) cleanly", async () => {
    const nodes: BaseNode[] = [
      { id: "payment-service", type: "system_node", data: { label: "Payment Service" }, position: { x: 0, y: 0 } },
      { id: "checkout-service", type: "system_node", data: { label: "Checkout Service" }, position: { x: 100, y: 0 } },
    ];
    const edges: BaseEdge[] = [
      { id: "e1", source: "checkout-service", target: "payment-service", data: {} },
    ];

    const result = await architectureToolRegistry.executeTool(
      "get_api_contracts_and_compatibility",
      { includeConsumerImpact: true, includeCoverage: true },
      {
        projectId: "proj-int-test",
        architectureId: "arch-int-test",
        graphRevision: "rev-1",
        nodes,
        edges,
        apiContracts: [sampleContract],
        consumerDependencies: [
          {
            id: "dep-1",
            providerServiceId: "payment-service",
            consumerServiceId: "checkout-service",
            contractId: "contract-payments",
            operationIds: ["createCharge"],
            source: "declared",
            confirmed: true,
          },
        ],
      }
    );

    expect(result.error).toBeUndefined();
    const data = result.result as any;
    expect(data.summary).toBeDefined();
    expect(data.summary.totalContracts).toBe(1);
    expect(data.targetContract.name).toBe("Payment Gateway API");
    expect(data.coverageReport).toBeDefined();
  });

  it("generates Architecture Report including api_contracts section and exports to Markdown and HTML", () => {
    const nodes: BaseNode[] = [
      { id: "payment-service", type: "system_node", data: { label: "Payment Service" }, position: { x: 0, y: 0 } },
      { id: "checkout-service", type: "system_node", data: { label: "Checkout Service" }, position: { x: 100, y: 0 } },
    ];
    const edges: BaseEdge[] = [
      { id: "e1", source: "checkout-service", target: "payment-service", data: {} },
    ];

    const report = architectureReportEngine.generateReport({
      projectId: "proj-int-test",
      architectureId: "arch-int-test",
      title: "API Contracts & Service Interface Review",
      nodes,
      edges,
      enabledSections: ["overview", "api_contracts"],
      analysisContext: {
        apiContracts: [sampleContract],
        consumerDependencies: [
          {
            id: "dep-1",
            providerServiceId: "payment-service",
            consumerServiceId: "checkout-service",
            contractId: "contract-payments",
            operationIds: ["createCharge"],
            source: "declared",
            confirmed: true,
          },
        ],
      },
    });

    const contractsSec = report.sections.find((s) => s.kind === "api_contracts");
    expect(contractsSec).toBeDefined();

    // Export to Markdown
    const mdResult = ReportExportCoordinator.exportReport(report, { format: "markdown" });
    expect(typeof mdResult.content).toBe("string");
    expect(mdResult.content as string).toContain("API Contracts & Service Interface Intelligence");
    expect(mdResult.content as string).toContain("Payment Gateway API");

    // Export to HTML
    const htmlResult = ReportExportCoordinator.exportReport(report, { format: "html" });
    expect(typeof htmlResult.content).toBe("string");
    expect(htmlResult.content as string).toContain("Payment Gateway API");
  });

  it("evaluates contract coverage percentage across architecture nodes", () => {
    const serviceIds = ["auth-service", "order-service", "payment-service", "inventory-service"];
    const coverage = ContractCoverageAnalyzer.evaluateCoverage(serviceIds, [sampleContract], []);

    expect(coverage.totalServices).toBe(4);
    expect(coverage.servicesWithContracts).toBe(1);
    expect(coverage.coveragePercentage).toBe(25);
    expect(coverage.servicesWithoutContracts).toContain("auth-service");
  });

  it("detects contract drift and shadow APIs from observed telemetry", () => {
    const observed = [
      { method: "POST", path: "/v1/charges", observedCallCount: 1200, lastObservedAt: sampleNow },
      { method: "POST", path: "/v1/unauthorized-export", observedCallCount: 45, lastObservedAt: sampleNow },
    ];

    const driftFindings = ContractDriftDetector.detectDrift(sampleContract, observed);
    expect(driftFindings.length).toBe(1);

    const shadowFinding = driftFindings[0];
    expect(shadowFinding.driftType).toBe("undeclared_observed_operation");
    expect(shadowFinding.description).toContain("Shadow API Endpoint detected");
    expect(shadowFinding.severity).toBe("high");
  });
});

