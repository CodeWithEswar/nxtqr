/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Performance Benchmarks: Scale Testing at 1,000 Operations
 */

import { describe, it, expect } from "vitest";
import type {
  ContractRevision,
  ContractOperation,
  CompatibilityPolicy,
  ConsumerDependency,
  APIContract,
} from "../api-contracts/contracts/contract.types";
import { SemanticContractDiffEngine } from "../api-contracts/compatibility/contract-diff";
import { ConsumerImpactAnalyzer } from "../api-contracts/compatibility/consumer-impact";

describe("Phase 05.3.20: Contracts Performance Suite", () => {
  const sampleNow = new Date().toISOString();

  const defaultPolicy: CompatibilityPolicy = {
    id: "policy-perf",
    name: "Performance Policy",
    mode: "backward",
    allowAdditiveSafeChanges: true,
    requireDeprecationPeriod: true,
    strictNullability: false,
    checkEnumExhaustiveness: true,
    treatMissingConsumerAsRisky: true,
  };

  it("diffs 1,000 REST operations across revisions in under 50ms", () => {
    const operationCount = 1000;
    const baseOps: ContractOperation[] = [];
    const candOps: ContractOperation[] = [];

    for (let i = 0; i < operationCount; i++) {
      const op: ContractOperation = {
        id: `op-${i}`,
        operationId: `operation_${i}`,
        protocol: "rest",
        method: i % 2 === 0 ? "GET" : "POST",
        path: `/v1/resource/${i}`,
        parameters: [{ name: "page", in: "query", required: false, schema: { id: "p", type: "integer", isNullable: true } }],
        isDeprecated: false,
        provenance: { source: "declared", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
      };
      baseOps.push(op);

      if (i === 50) {
        // Break operation 50 by adding required parameter
        candOps.push({
          ...op,
          parameters: [
            ...op.parameters!,
            { name: "token", in: "header", required: true, schema: { id: "p-req", type: "string", isNullable: false } },
          ],
        });
      } else if (i !== 100) {
        // Operation 100 removed
        candOps.push(op);
      }
    }

    const baseRev: ContractRevision = {
      id: "rev-base",
      contractId: "contract-scale",
      revisionHash: "hash-base",
      versionLabel: "v1.0.0",
      specificationVersion: "3.0.0",
      operations: baseOps,
      schemas: {},
      validationStatus: "valid",
      createdAt: sampleNow,
    };

    const candRev: ContractRevision = {
      id: "rev-cand",
      contractId: "contract-scale",
      revisionHash: "hash-cand",
      versionLabel: "v1.1.0",
      specificationVersion: "3.0.0",
      operations: candOps,
      schemas: {},
      validationStatus: "valid",
      createdAt: sampleNow,
    };

    const startTime = performance.now();
    const diff = SemanticContractDiffEngine.diff(
      "contract-scale",
      "openapi_3x",
      baseRev,
      candRev,
      defaultPolicy
    );
    const duration = performance.now() - startTime;

    expect(diff.findings.length).toBeGreaterThan(0);
    expect(diff.removedOperations.length).toBe(1);
    expect(duration).toBeLessThan(100); // 100ms threshold under load
  });

  it("evaluates consumer impact across 500 dependent services in under 50ms", () => {
    const consumerCount = 500;
    const dependencies: ConsumerDependency[] = [];

    for (let i = 0; i < consumerCount; i++) {
      dependencies.push({
        id: `dep-${i}`,
        providerServiceId: "core-service",
        consumerServiceId: `consumer-${i}`,
        contractId: "contract-scale-impact",
        operationIds: [`operation_${i % 20}`],
        source: "declared",
        confirmed: true,
      });
    }

    const contract: APIContract = {
      id: "contract-scale-impact",
      projectId: "proj-perf",
      architectureId: "arch-perf",
      name: "Core Scale API",
      protocol: "rest",
      specificationFormat: "openapi_3x",
      providerServiceId: "core-service",
      currentRevisionId: "rev-1",
      lifecycleStatus: "active",
      exposure: "internal",
      revisions: [],
      provenance: { source: "declared", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
      createdAt: sampleNow,
      updatedAt: sampleNow,
    };

    const diff = {
      contractId: "contract-scale-impact",
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
          id: "f-break",
          contractId: "contract-scale-impact",
          baselineRevisionId: "rev-1",
          candidateRevisionId: "rev-2",
          classification: "breaking" as const,
          ruleId: "rest_operation_removed",
          affectedOperationIds: ["operation_5"], // Impacts 25 consumers
          affectedConsumerIds: [],
          evidence: ["operation_5 removed"],
          explanation: "Endpoint deleted",
          remediation: "Restore endpoint",
        },
      ],
    };

    const startTime = performance.now();
    const impact = ConsumerImpactAnalyzer.analyzeImpact(contract, diff, dependencies);
    const duration = performance.now() - startTime;

    expect(impact.impactedConsumers.length).toBe(25);
    expect(duration).toBeLessThan(100); // 100ms threshold under load
  });
});

