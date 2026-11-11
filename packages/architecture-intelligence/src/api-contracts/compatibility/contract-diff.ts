/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Semantic Contract Diff Engine
 */

import type {
  ContractRevision,
  SpecificationFormat,
  CompatibilityPolicy,
  SemanticContractDiff,
} from "../contracts/contract.types";
import { contractAdapterRegistry } from "../adapters/adapter-registry";

export class SemanticContractDiffEngine {
  /**
   * Performs semantic comparison between baseline and candidate contract revisions.
   */
  public static diff(
    contractId: string,
    format: SpecificationFormat,
    baseline: ContractRevision,
    candidate: ContractRevision,
    policy: CompatibilityPolicy
  ): SemanticContractDiff {
    const adapter = contractAdapterRegistry.getAdapter(format);

    const comparison = adapter.compare(
      baseline.operations,
      baseline.schemas,
      candidate.operations,
      candidate.schemas,
      policy,
      contractId,
      baseline.id,
      candidate.id
    );

    const addedOperations = candidate.operations.filter((op) =>
      comparison.addedOperations.includes(op.operationId)
    );

    const removedOperations = baseline.operations.filter((op) =>
      comparison.removedOperations.includes(op.operationId)
    );

    const modifiedOperations = comparison.modifiedOperations.map((opId) => {
      const isBreaking = comparison.findings.some(
        (f) => f.affectedOperationIds.includes(opId) && f.classification === "breaking"
      );
      return {
        operationId: opId,
        changes: comparison.findings
          .filter((f) => f.affectedOperationIds.includes(opId))
          .map((f) => f.explanation),
        isBreaking,
      };
    });

    // Added and removed schemas
    const baseSchemaKeys = new Set(Object.keys(baseline.schemas));
    const candSchemaKeys = new Set(Object.keys(candidate.schemas));

    const addedSchemas = Object.keys(candidate.schemas).filter((k) => !baseSchemaKeys.has(k));
    const removedSchemas = Object.keys(baseline.schemas).filter((k) => !candSchemaKeys.has(k));

    const modifiedSchemas: SemanticContractDiff["modifiedSchemas"] = [];
    for (const key of baseSchemaKeys) {
      if (candSchemaKeys.has(key)) {
        const schemaFindings = comparison.findings.filter(
          (f) => f.evidence.some((e) => e.includes(key)) || f.ruleId.includes(key)
        );
        if (schemaFindings.length > 0) {
          modifiedSchemas.push({
            schemaId: key,
            changes: schemaFindings.map((f) => f.explanation),
            isBreaking: schemaFindings.some((f) => f.classification === "breaking"),
          });
        }
      }
    }

    return {
      contractId,
      baselineRevisionId: baseline.id,
      candidateRevisionId: candidate.id,
      addedOperations,
      removedOperations,
      modifiedOperations,
      addedSchemas,
      removedSchemas,
      modifiedSchemas,
      securityChanges: [],
      deprecationChanges: [],
      findings: comparison.findings,
    };
  }
}

