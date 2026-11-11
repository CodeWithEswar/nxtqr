/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Unit Tests: Compatibility Rules, Breaking Change Classification & Impact Analysis
 */

import { describe, it, expect } from "vitest";
import type {
  APIContract,
  ContractRevision,
  ConsumerDependency,
  CompatibilityPolicy,
} from "../api-contracts/contracts/contract.types";
import { SemanticContractDiffEngine } from "../api-contracts/compatibility/contract-diff";
import { ConsumerImpactAnalyzer } from "../api-contracts/compatibility/consumer-impact";
import { MigrationPlanner } from "../api-contracts/analysis/migration-planner";

describe("Phase 05.3.20: Contract Compatibility & Breaking Change Engine", () => {
  const defaultPolicy: CompatibilityPolicy = {
    id: "policy-backward",
    name: "Backward Compatibility Policy",
    mode: "backward",
    allowAdditiveSafeChanges: true,
    requireDeprecationPeriod: true,
    strictNullability: false,
    checkEnumExhaustiveness: true,
    treatMissingConsumerAsRisky: true,
  };

  const sampleNow = new Date().toISOString();

  it("detects removed REST operation as a breaking change", () => {
    const baselineRevision: ContractRevision = {
      id: "rev-1",
      contractId: "contract-orders",
      revisionHash: "hash-1",
      versionLabel: "v1.0.0",
      specificationVersion: "3.0.0",
      operations: [
        {
          id: "op-get-orders",
          operationId: "getOrders",
          protocol: "rest",
          method: "GET",
          path: "/v1/orders",
          isDeprecated: false,
          provenance: { source: "declared", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
        },
        {
          id: "op-delete-orders",
          operationId: "deleteOrder",
          protocol: "rest",
          method: "DELETE",
          path: "/v1/orders/{id}",
          isDeprecated: false,
          provenance: { source: "declared", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
        },
      ],
      schemas: {},
      validationStatus: "valid",
      createdAt: sampleNow,
    };

    const candidateRevision: ContractRevision = {
      ...baselineRevision,
      id: "rev-2",
      operations: [baselineRevision.operations[0]], // deleteOrder removed!
    };

    const diff = SemanticContractDiffEngine.diff(
      "contract-orders",
      "openapi_3x",
      baselineRevision,
      candidateRevision,
      defaultPolicy
    );

    expect(diff.removedOperations.length).toBe(1);
    expect(diff.removedOperations[0].operationId).toBe("deleteOrder");

    const breakingFindings = diff.findings.filter((f) => f.classification === "breaking");
    expect(breakingFindings.length).toBe(1);
    expect(breakingFindings[0].ruleId).toBe("rest_operation_removed");
  });

  it("detects added required parameter in REST operation as a breaking change", () => {
    const baselineRevision: ContractRevision = {
      id: "rev-1",
      contractId: "contract-users",
      revisionHash: "hash-1",
      versionLabel: "v1.0.0",
      specificationVersion: "3.0.0",
      operations: [
        {
          id: "op-list-users",
          operationId: "listUsers",
          protocol: "rest",
          method: "GET",
          path: "/v1/users",
          parameters: [{ name: "page", in: "query", required: false, schema: { id: "p-page", type: "integer", isNullable: true } }],
          isDeprecated: false,
          provenance: { source: "declared", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
        },
      ],
      schemas: {},
      validationStatus: "valid",
      createdAt: sampleNow,
    };

    const candidateRevision: ContractRevision = {
      ...baselineRevision,
      id: "rev-2",
      operations: [
        {
          ...baselineRevision.operations[0],
          parameters: [
            ...baselineRevision.operations[0].parameters!,
            { name: "organizationId", in: "query", required: true, schema: { id: "p-org", type: "string", isNullable: false } },
          ],
        },
      ],
    };

    const diff = SemanticContractDiffEngine.diff(
      "contract-users",
      "openapi_3x",
      baselineRevision,
      candidateRevision,
      defaultPolicy
    );

    const breaking = diff.findings.find((f) => f.ruleId === "rest_required_parameter_added");
    expect(breaking).toBeDefined();
    expect(breaking?.classification).toBe("breaking");
  });

  it("detects Protobuf wire type incompatibility as a breaking change", () => {
    const baselineRevision: ContractRevision = {
      id: "rev-1",
      contractId: "contract-proto",
      revisionHash: "hash-1",
      versionLabel: "v1.0.0",
      specificationVersion: "proto3",
      operations: [],
      schemas: {
        OrderMessage: {
          id: "OrderMessage",
          name: "OrderMessage",
          type: "object",
          isNullable: false,
          properties: {
            account_id: { id: "f1", name: "account_id", type: "string", fieldNumber: 1, wireType: "length-delimited", isNullable: false },
          },
        },
      },
      validationStatus: "valid",
      createdAt: sampleNow,
    };

    const candidateRevision: ContractRevision = {
      ...baselineRevision,
      id: "rev-2",
      schemas: {
        OrderMessage: {
          id: "OrderMessage",
          name: "OrderMessage",
          type: "object",
          isNullable: false,
          properties: {
            account_id: { id: "f1", name: "account_id", type: "integer", fieldNumber: 1, wireType: "varint", isNullable: false },
          },
        },
      },
    };

    const diff = SemanticContractDiffEngine.diff(
      "contract-proto",
      "protobuf",
      baselineRevision,
      candidateRevision,
      defaultPolicy
    );

    const breaking = diff.findings.find((f) => f.ruleId === "protobuf_wire_type_incompatible");
    expect(breaking).toBeDefined();
    expect(breaking?.classification).toBe("breaking");
  });

  it("maps breaking changes to consumer services accurately with unknown caller risk", () => {
    const contract: APIContract = {
      id: "contract-billing",
      projectId: "proj-1",
      architectureId: "arch-1",
      name: "Billing API",
      protocol: "rest",
      specificationFormat: "openapi_3x",
      providerServiceId: "billing-service",
      currentRevisionId: "rev-1",
      lifecycleStatus: "active",
      exposure: "internal",
      revisions: [],
      provenance: { source: "declared", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
      createdAt: sampleNow,
      updatedAt: sampleNow,
    };

    const diff = {
      contractId: "contract-billing",
      baselineRevisionId: "rev-1",
      candidateRevisionId: "rev-2",
      addedOperations: [],
      removedOperations: [],
      modifiedOperations: [],
      addedSchemas: [],
      removedSchemas: [],
      modifiedSchemas: [],
      securityChanges: [],
      deprecationChanges: [],
      findings: [
        {
          id: "f-1",
          contractId: "contract-billing",
          baselineRevisionId: "rev-1",
          candidateRevisionId: "rev-2",
          classification: "breaking" as const,
          ruleId: "rest_operation_removed",
          affectedOperationIds: ["chargeCustomer"],
          affectedConsumerIds: [],
          evidence: ["chargeCustomer removed"],
          explanation: "Endpoint deleted",
          remediation: "Restore endpoint",
        },
      ],
    };

    const dependencies: ConsumerDependency[] = [
      {
        id: "dep-1",
        providerServiceId: "billing-service",
        consumerServiceId: "checkout-service",
        contractId: "contract-billing",
        operationIds: ["chargeCustomer", "getInvoices"],
        source: "declared",
        confirmed: true,
      },
      {
        id: "dep-2",
        providerServiceId: "billing-service",
        consumerServiceId: "analytics-collector",
        contractId: "contract-billing",
        operationIds: ["getInvoices"], // does not use chargeCustomer
        source: "declared",
        confirmed: true,
      },
    ];

    const impact = ConsumerImpactAnalyzer.analyzeImpact(contract, diff, dependencies, {
      "checkout-service": "Checkout Processing Service",
      "analytics-collector": "Analytics Aggregator",
    });

    expect(impact.impactedConsumers.length).toBe(1);
    expect(impact.impactedConsumers[0].consumerServiceId).toBe("checkout-service");
    expect(impact.impactedConsumers[0].breakingOperationIds).toContain("chargeCustomer");
    expect(impact.impactedConsumers[0].isConfirmedBreak).toBe(true);
  });

  it("generates structured, actionable migration plan for breaking revisions", () => {
    const contract: APIContract = {
      id: "contract-orders",
      projectId: "proj-1",
      architectureId: "arch-1",
      name: "Orders API",
      protocol: "rest",
      specificationFormat: "openapi_3x",
      providerServiceId: "orders-service",
      currentRevisionId: "rev-1",
      lifecycleStatus: "active",
      exposure: "internal",
      revisions: [],
      provenance: { source: "declared", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
      createdAt: sampleNow,
      updatedAt: sampleNow,
    };

    const diff = {
      contractId: "contract-orders",
      baselineRevisionId: "rev-1",
      candidateRevisionId: "rev-2",
      addedOperations: [],
      removedOperations: [],
      modifiedOperations: [],
      addedSchemas: [],
      removedSchemas: [],
      modifiedSchemas: [],
      securityChanges: [],
      deprecationChanges: [],
      findings: [
        {
          id: "f-1",
          contractId: "contract-orders",
          baselineRevisionId: "rev-1",
          candidateRevisionId: "rev-2",
          classification: "breaking" as const,
          ruleId: "rest_operation_removed",
          affectedOperationIds: ["cancelOrder"],
          affectedConsumerIds: [],
          evidence: ["cancelOrder removed"],
          explanation: "cancelOrder removed",
          remediation: "Retain endpoint",
        },
      ],
    };

    const impact = {
      contractId: "contract-orders",
      totalConsumers: 1,
      impactedConsumers: [
        {
          consumerServiceId: "fulfillment-service",
          consumerServiceName: "Fulfillment Engine",
          usedOperations: ["cancelOrder"],
          breakingOperationIds: ["cancelOrder"],
          isConfirmedBreak: true,
          transitiveDownstreamCount: 0,
        },
      ],
      unknownConsumerRisk: false,
      recommendations: ["Migrate Fulfillment Engine"],
    };

    const plan = MigrationPlanner.generatePlan(contract, diff, impact, { compatibilityWindowDays: 21 });
    expect(plan.steps.length).toBeGreaterThanOrEqual(4);
    expect(plan.steps[0].action).toContain("Provider Compatibility Layer");
    expect(plan.steps[1].action).toContain("Fulfillment Engine");
    expect(plan.rollbackConsiderations.length).toBeGreaterThan(0);
    expect(plan.compatibilityWindowDays).toBe(21);
  });
});
