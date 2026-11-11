/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Shared Protocol Adapter Interface
 */

import type {
  ContractOperation,
  NormalizedSchema,
  SpecificationFormat,
  CompatibilityPolicy,
  CompatibilityFinding,
} from "../contracts/contract.types";

export interface ParseResult<TDocument> {
  success: boolean;
  document?: TDocument;
  errors: string[];
}

export interface ContractValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NormalizationResult<TModel> {
  operations: ContractOperation[];
  schemas: Record<string, NormalizedSchema>;
  protocolModel?: TModel;
  warnings: string[];
}

export interface ProtocolComparisonResult {
  findings: CompatibilityFinding[];
  addedOperations: string[];
  removedOperations: string[];
  modifiedOperations: string[];
}

export interface ContractAdapter<TDocument = unknown, TModel = unknown> {
  readonly format: SpecificationFormat;

  parse(input: string): ParseResult<TDocument>;

  validate(document: TDocument): ContractValidationResult;

  normalize(
    document: TDocument,
    options?: { contractId?: string; graphRevision?: string }
  ): NormalizationResult<TModel>;

  compare(
    baselineOps: ContractOperation[],
    baselineSchemas: Record<string, NormalizedSchema>,
    candidateOps: ContractOperation[],
    candidateSchemas: Record<string, NormalizedSchema>,
    policy: CompatibilityPolicy,
    contractId: string,
    baselineRevisionId: string,
    candidateRevisionId: string
  ): ProtocolComparisonResult;
}
