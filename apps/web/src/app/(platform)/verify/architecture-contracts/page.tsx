"use client";

/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Interactive Verification Testbed Page
 */

import React, { useState } from "react";
import { ContractsWorkspace } from "@/features/system-design/api-contracts";
import {
  type APIContract,
  type ConsumerDependency,
  type ContractRevision,
  type CompatibilityPolicy,
  OpenApiAdapter,
  GraphQLAdapter,
  ProtobufAdapter,
  AsyncApiAdapter,
  SemanticContractDiffEngine,
  ConsumerImpactAnalyzer,
  MigrationPlanner,
} from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, LayersIcon, RefreshIcon } from "@nxtqr/icons";

export default function ArchitectureContractsVerificationPage() {
  const [activeScenario, setActiveScenario] = useState<"ecommerce" | "protobuf_grpc" | "kafka_events">(
    "ecommerce"
  );
  const [verificationResults, setVerificationResults] = useState<
    Array<{ name: string; status: "passed" | "failed"; detail: string }>
  >([]);
  const [hasRunVerification, setHasRunVerification] = useState(false);

  const now = new Date().toISOString();

  // Run in-browser automated verifications
  const runAllVerifications = () => {
    const results: Array<{ name: string; status: "passed" | "failed"; detail: string }> = [];

    // 1. Multi-Format Spec Parsers & Normalizers
    try {
      const openapiAdapter = new OpenApiAdapter();
      const gqlAdapter = new GraphQLAdapter();
      const protoAdapter = new ProtobufAdapter();
      const asyncAdapter = new AsyncApiAdapter();

      const openapiSpec = JSON.stringify({
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: { "/items": { get: { operationId: "getItems", responses: { "200": {} } } } },
      });
      const parsedOpenApi = openapiAdapter.parse(openapiSpec);
      const normOpenApi = openapiAdapter.normalize(parsedOpenApi.document!);

      const gqlSpec = "type Query { ping: String! }";
      const parsedGql = gqlAdapter.parse(gqlSpec);
      const normGql = gqlAdapter.normalize(parsedGql.document!);

      const protoSpec = `syntax = "proto3"; message Request { string id = 1; } service TestSvc { rpc Ping (Request) returns (Request); }`;
      const parsedProto = protoAdapter.parse(protoSpec);
      const normProto = protoAdapter.normalize(parsedProto.document!);

      const asyncSpec = JSON.stringify({
        asyncapi: "2.6.0",
        channels: { "order.created": { publish: { message: { payload: { type: "object" } } } } },
      });
      const parsedAsync = asyncAdapter.parse(asyncSpec);
      const normAsync = asyncAdapter.normalize(parsedAsync.document!);

      if (
        normOpenApi.operations.length === 1 &&
        normGql.operations.length === 1 &&
        normProto.operations.length === 1 &&
        normAsync.operations.length === 1
      ) {
        results.push({
          name: "Multi-Format Protocol Adapters & Schema Normalization",
          status: "passed",
          detail: `Normalized OpenAPI (${normOpenApi.operations.length} op), GraphQL (${normGql.operations.length} op), Protobuf (${normProto.operations.length} rpc), and AsyncAPI (${normAsync.operations.length} channel) into canonical representations.`,
        });
      } else {
        results.push({
          name: "Protocol Adapters",
          status: "failed",
          detail: "Operations normalization count mismatch.",
        });
      }
    } catch (err: any) {
      results.push({ name: "Protocol Adapters", status: "failed", detail: err.message });
    }

    // 2. Semantic Diff & Breaking Change Detection
    try {
      const openapiAdapter = new OpenApiAdapter();
      const baseSpec = JSON.stringify({
        openapi: "3.0.0",
        info: { title: "API", version: "1.0.0" },
        paths: {
          "/orders": {
            post: {
              operationId: "createOrder",
              requestBody: {
                content: {
                  "application/json": {
                    schema: { type: "object", required: ["userId"], properties: { userId: { type: "string" } } },
                  },
                },
              },
            },
          },
          "/orders/{id}": { get: { operationId: "getOrder" } },
        },
      });

      const candSpec = JSON.stringify({
        openapi: "3.0.0",
        info: { title: "API", version: "2.0.0" },
        paths: {
          "/orders": {
            post: {
              operationId: "createOrder",
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      required: ["userId", "taxCode"],
                      properties: { userId: { type: "string" }, taxCode: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const baseNorm = openapiAdapter.normalize(JSON.parse(baseSpec));
      const candNorm = openapiAdapter.normalize(JSON.parse(candSpec));

      const baseRev: ContractRevision = {
        id: "r1",
        contractId: "c1",
        revisionHash: "hash-r1",
        versionLabel: "1.0.0",
        specificationVersion: "3.0.0",
        operations: baseNorm.operations,
        schemas: baseNorm.schemas,
        validationStatus: "valid",
        createdAt: now,
      };

      const candRev: ContractRevision = {
        id: "r2",
        contractId: "c1",
        revisionHash: "hash-r2",
        versionLabel: "2.0.0",
        specificationVersion: "3.0.0",
        operations: candNorm.operations,
        schemas: candNorm.schemas,
        validationStatus: "valid",
        createdAt: now,
      };

      const policy: CompatibilityPolicy = {
        id: "policy-backward",
        name: "Backward Policy",
        mode: "backward",
        allowAdditiveSafeChanges: true,
        requireDeprecationPeriod: true,
        strictNullability: false,
        checkEnumExhaustiveness: true,
        treatMissingConsumerAsRisky: true,
      };

      const diff = SemanticContractDiffEngine.diff("c1", "openapi_3x", baseRev, candRev, policy);
      const hasRemovedEndpoint = diff.findings.some((f) => f.ruleId === "rest_operation_removed");
      const hasAddedReqField = diff.findings.some((f) => f.ruleId === "rest_request_schema_breaking");
      const breakingCount = diff.findings.filter((f) => f.classification === "breaking").length;

      if (hasRemovedEndpoint && hasAddedReqField && breakingCount >= 2) {
        results.push({
          name: "Deterministic Semantic Diff & Breaking Change Rules",
          status: "passed",
          detail: `Detected ${breakingCount} breaking changes (removed endpoint getOrder and added required field taxCode in createOrder).`,
        });
      } else {
        results.push({
          name: "Semantic Diff Engine",
          status: "failed",
          detail: "Failed to detect expected breaking changes in diff.",
        });
      }
    } catch (err: any) {
      results.push({ name: "Semantic Diff Engine", status: "failed", detail: err.message });
    }

    // 3. Protobuf Wire Tag & Wire Type Incompatibility
    try {
      const protoAdapter = new ProtobufAdapter();
      const proto1 = `
        syntax = "proto3";
        message UserMetric {
          string user_id = 1;
          int64 count = 2;
        }
      `;
      const proto2 = `
        syntax = "proto3";
        message UserMetric {
          string user_id = 1;
          string count = 2;
        }
      `;

      const norm1 = protoAdapter.normalize(protoAdapter.parse(proto1).document!);
      const norm2 = protoAdapter.normalize(protoAdapter.parse(proto2).document!);

      const protoPolicy: CompatibilityPolicy = {
        id: "proto-policy",
        name: "Protobuf Policy",
        mode: "protocol_specific",
        allowAdditiveSafeChanges: true,
        requireDeprecationPeriod: false,
        strictNullability: false,
        checkEnumExhaustiveness: false,
        treatMissingConsumerAsRisky: false,
      };

      const comp = protoAdapter.compare(
        norm1.operations,
        norm1.schemas,
        norm2.operations,
        norm2.schemas,
        protoPolicy,
        "c-proto",
        "r1",
        "r2"
      );

      const hasWireMismatch = comp.findings.some(
        (f) => f.ruleId === "grpc_field_wire_type_changed"
      );

      if (hasWireMismatch) {
        results.push({
          name: "Protobuf Wire-Tag & Wire-Type Compatibility Verification",
          status: "passed",
          detail: "Successfully flagged wire type change on Tag #2 from varint (int64) to length-delimited (string) as breaking wire format corruption.",
        });
      } else {
        results.push({
          name: "Protobuf Wire Compatibility",
          status: "failed",
          detail: "Failed to flag wire type mismatch on tag reuse.",
        });
      }
    } catch (err: any) {
      results.push({ name: "Protobuf Wire Compatibility", status: "failed", detail: err.message });
    }

    // 4. Consumer Impact & Blast Radius Assessment
    try {
      const mockContract: APIContract = {
        id: "c-order",
        projectId: "proj-1",
        architectureId: "arch-1",
        name: "Order Service API",
        protocol: "rest",
        specificationFormat: "openapi_3x",
        providerServiceId: "order-service",
        exposure: "internal",
        currentRevisionId: "r1",
        lifecycleStatus: "active",
        provenance: { source: "declared", timestamp: now, graphRevision: "rev-1", confirmed: true },
        revisions: [],
        createdAt: now,
        updatedAt: now,
      };

      const mockDiff = {
        contractId: "c-order",
        baselineRevisionId: "r1",
        candidateRevisionId: "r2",
        addedOperations: [],
        removedOperations: [
          {
            id: "op-getOrder",
            operationId: "getOrder",
            protocol: "rest" as const,
            method: "GET",
            path: "/orders/{id}",
            parameters: [],
            responseSchemas: {},
            securityRequirements: [],
            isDeprecated: false,
            provenance: { source: "declared" as const, timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        ],
        modifiedOperations: [],
        addedSchemas: [],
        removedSchemas: [],
        modifiedSchemas: [],
        securityChanges: [],
        deprecationChanges: [],
        findings: [
          {
            id: "f1",
            contractId: "c-order",
            baselineRevisionId: "r1",
            candidateRevisionId: "r2",
            classification: "breaking" as const,
            ruleId: "rest_operation_removed",
            affectedOperationIds: ["getOrder"],
            affectedConsumerIds: [],
            evidence: ["Removed GET /orders/{id}"],
            explanation: "Removed endpoint",
            remediation: "Retain endpoint",
          },
        ],
      };

      const mockDeps: ConsumerDependency[] = [
        {
          id: "d1",
          consumerServiceId: "web-portal",
          providerServiceId: "order-service",
          contractId: "c-order",
          operationIds: ["createOrder"],
          source: "declared",
          confirmed: true,
        },
        {
          id: "d2",
          consumerServiceId: "mobile-app",
          providerServiceId: "order-service",
          contractId: "c-order",
          operationIds: ["getOrder"],
          source: "observed",
          confirmed: true,
        },
      ];

      const impact = ConsumerImpactAnalyzer.analyzeImpact(mockContract, mockDiff, mockDeps);

      if (
        impact.impactedConsumers.length === 1 &&
        impact.impactedConsumers[0].consumerServiceId === "mobile-app"
      ) {
        results.push({
          name: "Downstream Consumer Dependency Blast Radius Analysis",
          status: "passed",
          detail: `Correctly mapped breaking operation "getOrder" exclusively to dependent consumer "mobile-app", leaving unaffected consumer "web-portal" safe.`,
        });
      } else {
        results.push({
          name: "Consumer Blast Radius Analysis",
          status: "failed",
          detail: "Impacted consumer count or identity mismatch.",
        });
      }
    } catch (err: any) {
      results.push({ name: "Consumer Blast Radius Analysis", status: "failed", detail: err.message });
    }

    // 5. Phased Migration Plan Synthesis
    try {
      const mockContract: APIContract = {
        id: "c-order",
        projectId: "proj-1",
        architectureId: "arch-1",
        name: "Order Service API",
        protocol: "rest",
        specificationFormat: "openapi_3x",
        providerServiceId: "order-service",
        exposure: "internal",
        currentRevisionId: "r1",
        lifecycleStatus: "active",
        provenance: { source: "declared", timestamp: now, graphRevision: "rev-1", confirmed: true },
        revisions: [],
        createdAt: now,
        updatedAt: now,
      };

      const mockDiff = {
        contractId: "c-order",
        baselineRevisionId: "r1",
        candidateRevisionId: "r2",
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
            id: "f1",
            contractId: "c-order",
            baselineRevisionId: "r1",
            candidateRevisionId: "r2",
            classification: "breaking" as const,
            ruleId: "rest_operation_removed",
            affectedOperationIds: ["getOrder"],
            affectedConsumerIds: [],
            evidence: ["Removed GET /orders/{id}"],
            explanation: "Removed endpoint",
            remediation: "Retain endpoint",
          },
        ],
      };

      const mockImpact = {
        contractId: "c-order",
        totalConsumers: 2,
        impactedConsumers: [
          {
            consumerServiceId: "mobile-app",
            consumerServiceName: "Mobile Client App",
            usedOperations: ["getOrder"],
            breakingOperationIds: ["getOrder"],
            isConfirmedBreak: true,
            transitiveDownstreamCount: 0,
          },
        ],
        unknownConsumerRisk: false,
        recommendations: ["Deprecate before removal"],
      };

      const plan = MigrationPlanner.generatePlan(mockContract, mockDiff, mockImpact, {
        compatibilityWindowDays: 60,
      });

      if (plan.steps.length > 0 && plan.rollbackConsiderations.length > 0) {
        results.push({
          name: "Automated Phased Migration Plan Synthesis",
          status: "passed",
          detail: `Generated ${plan.steps.length}-step rollout plan with rollback safeguards and ${plan.compatibilityWindowDays}-day dual-run window.`,
        });
      } else {
        results.push({
          name: "Migration Plan Synthesis",
          status: "failed",
          detail: "Steps or rollback considerations missing.",
        });
      }
    } catch (err: any) {
      results.push({ name: "Migration Plan Synthesis", status: "failed", detail: err.message });
    }

    setVerificationResults(results);
    setHasRunVerification(true);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-[#FFFFFF] overflow-hidden select-none">
      {/* Top Testbed Bar */}
      <div className="p-3 bg-[#080808] border-b border-[#262626] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-[#FFFFFF]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
              Phase 05.3.20 Testbed
            </span>
          </div>
          <span className="text-[#404040]">/</span>
          <span className="text-xs text-[#858585]">
            Architecture API Contracts & Service Interface Intelligence
          </span>
        </div>

        {/* Scenario Selector & Run Button */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-md bg-[#141414] border border-[#262626] p-0.5 text-xs">
            <button
              onClick={() => setActiveScenario("ecommerce")}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                activeScenario === "ecommerce"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]"
                  : "text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              E-Commerce REST/GQL
            </button>
            <button
              onClick={() => setActiveScenario("protobuf_grpc")}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                activeScenario === "protobuf_grpc"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]"
                  : "text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              Protobuf gRPC Wire
            </button>
            <button
              onClick={() => setActiveScenario("kafka_events")}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                activeScenario === "kafka_events"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]"
                  : "text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              Kafka AsyncAPI
            </button>
          </div>

          <button
            onClick={runAllVerifications}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#FFFFFF] bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] hover:border-[#404040] rounded-md transition-colors shadow-sm"
          >
            <RefreshIcon className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span>Run All Automated Verifications</span>
          </button>
        </div>
      </div>

      {/* Verification Results Panel (if run) */}
      {hasRunVerification && (
        <div className="p-3 bg-[#0D0D0D] border-b border-[#262626] space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
              <CheckCircleIcon className="w-3.5 h-3.5 text-[#FFFFFF]" />
              <span>
                Verification Results ({verificationResults.filter((r) => r.status === "passed").length} /{" "}
                {verificationResults.length} Passed)
              </span>
            </h4>
            <button
              onClick={() => setHasRunVerification(false)}
              className="text-[10px] text-[#858585] hover:text-[#FFFFFF]"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {verificationResults.map((r, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-md bg-[#080808] border border-[#262626] space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#FFFFFF] truncate">{r.name}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-mono rounded-md border ${
                      r.status === "passed"
                        ? "bg-[#141A14] text-[#FFFFFF] border-[#262626]"
                        : "bg-[#1F1414] text-[#FFFFFF] border-[#404040]"
                    }`}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-[#858585] leading-relaxed">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Studio Workspace */}
      <div className="flex-1 overflow-hidden">
        <ContractsWorkspace />
      </div>
    </div>
  );
}
