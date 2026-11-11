/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Master Facade Engine
 */

import type {
  APIContract,
  ContractRevision,
  ConsumerDependency,
  CompatibilityPolicy,
  SemanticContractDiff,
  ConsumerImpactReport,
  ContractCoverageReport,
  ContractDriftFinding,
  MigrationPlan,
  SpecificationFormat,
} from "../contracts/contract.types";
import { APIContractSchema } from "../schemas/contract.schemas";
import { contractAdapterRegistry } from "../adapters/adapter-registry";
import { SemanticContractDiffEngine } from "../compatibility/contract-diff";
import { ConsumerImpactAnalyzer } from "../compatibility/consumer-impact";
import { ContractCoverageAnalyzer } from "../analysis/contract-coverage";
import { ContractDriftDetector, type ObservedOperationTelemetry } from "../analysis/contract-drift";
import { MigrationPlanner } from "../analysis/migration-planner";

export class ArchitectureContractEngine {
  /**
   * Validates a complete API contract against domain Zod schemas.
   */
  public validateContract(contract: unknown): APIContract {
    return APIContractSchema.parse(contract) as unknown as APIContract;
  }

  /**
   * Safely imports and normalizes an API specification (OpenAPI, GraphQL, Protobuf, AsyncAPI).
   */
  public importSpecification(
    content: string,
    format?: SpecificationFormat,
    options?: { contractId?: string; graphRevision?: string; versionLabel?: string }
  ): {
    revision: ContractRevision;
    format: SpecificationFormat;
    validationErrors: string[];
    warnings: string[];
  } {
    const detectedFormat = format || contractAdapterRegistry.detectFormat(content);
    const adapter = contractAdapterRegistry.getAdapter(detectedFormat);

    const parseResult = adapter.parse(content);
    if (!parseResult.success || !parseResult.document) {
      throw new Error(`Failed to parse specification (${detectedFormat}): ${parseResult.errors.join("; ")}`);
    }

    const validationResult = adapter.validate(parseResult.document);
    const normResult = adapter.normalize(parseResult.document, options);

    const revisionId = `rev-${Date.now()}`;
    const revision: ContractRevision = {
      id: revisionId,
      contractId: options?.contractId || "contract-default",
      revisionHash: `hash-${Math.random().toString(36).slice(2, 10)}`,
      versionLabel: options?.versionLabel || "v1.0.0",
      specificationVersion: detectedFormat,
      operations: normResult.operations,
      schemas: normResult.schemas,
      validationStatus: validationResult.isValid ? (validationResult.warnings.length > 0 ? "warning" : "valid") : "error",
      validationErrors: validationResult.errors,
      createdAt: new Date().toISOString(),
    };

    return {
      revision,
      format: detectedFormat,
      validationErrors: validationResult.errors,
      warnings: [...validationResult.warnings, ...normResult.warnings],
    };
  }

  /**
   * Performs semantic diff between two revisions of a contract.
   */
  public diffRevisions(
    contract: APIContract,
    baselineRevisionId: string,
    candidateRevisionId: string,
    customPolicy?: CompatibilityPolicy
  ): SemanticContractDiff {
    const baseline = contract.revisions.find((r) => r.id === baselineRevisionId);
    const candidate = contract.revisions.find((r) => r.id === candidateRevisionId);

    if (!baseline || !candidate) {
      throw new Error(`Revision ID not found on contract "${contract.name}".`);
    }

    const policy: CompatibilityPolicy = customPolicy || {
      id: "policy-backward-default",
      name: "Default Backward Compatibility Policy",
      mode: "backward",
      allowAdditiveSafeChanges: true,
      requireDeprecationPeriod: true,
      strictNullability: false,
      checkEnumExhaustiveness: true,
      treatMissingConsumerAsRisky: true,
    };

    return SemanticContractDiffEngine.diff(
      contract.id,
      contract.specificationFormat,
      baseline,
      candidate,
      policy
    );
  }

  /**
   * Analyzes downstream consumer service impact from contract breaking changes.
   */
  public analyzeConsumerImpact(
    contract: APIContract,
    diff: SemanticContractDiff,
    dependencies: ConsumerDependency[],
    serviceNames?: Record<string, string>
  ): ConsumerImpactReport {
    return ConsumerImpactAnalyzer.analyzeImpact(contract, diff, dependencies, serviceNames);
  }

  /**
   * Evaluates API contract completeness and coverage across service nodes.
   */
  public evaluateCoverage(
    serviceNodeIds: string[],
    contracts: APIContract[],
    dependencies: ConsumerDependency[]
  ): ContractCoverageReport {
    return ContractCoverageAnalyzer.evaluateCoverage(serviceNodeIds, contracts, dependencies);
  }

  /**
   * Compares declared API contract operations against observed runtime telemetry.
   */
  public detectDrift(
    contract: APIContract,
    observedOperations: ObservedOperationTelemetry[]
  ): ContractDriftFinding[] {
    return ContractDriftDetector.detectDrift(contract, observedOperations);
  }

  /**
   * Generates step-by-step phased migration plan for breaking revisions.
   */
  public generateMigrationPlan(
    contract: APIContract,
    diff: SemanticContractDiff,
    impact: ConsumerImpactReport,
    options?: { compatibilityWindowDays?: number }
  ): MigrationPlan {
    return MigrationPlanner.generatePlan(contract, diff, impact, options);
  }
}

export const architectureContractEngine = new ArchitectureContractEngine();
