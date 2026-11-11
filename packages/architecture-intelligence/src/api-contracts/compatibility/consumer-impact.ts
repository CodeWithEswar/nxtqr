/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Consumer Dependency & Impact Analysis Engine
 */

import type {
  APIContract,
  ConsumerDependency,
  SemanticContractDiff,
  ConsumerImpactReport,
} from "../contracts/contract.types";

export class ConsumerImpactAnalyzer {
  /**
   * Analyzes how breaking and potentially breaking changes in a contract revision
   * affect registered downstream consumer services.
   */
  public static analyzeImpact(
    contract: APIContract,
    diff: SemanticContractDiff,
    dependencies: ConsumerDependency[],
    serviceNames?: Record<string, string>
  ): ConsumerImpactReport {
    const breakingFindings = diff.findings.filter(
      (f) => f.classification === "breaking" || f.classification === "potentially_breaking"
    );

    const breakingOpIds = new Set<string>();
    for (const f of breakingFindings) {
      for (const opId of f.affectedOperationIds) {
        breakingOpIds.add(opId);
      }
    }

    // Direct consumers of this contract
    const contractConsumers = dependencies.filter((d) => d.contractId === contract.id);
    const impactedConsumers: ConsumerImpactReport["impactedConsumers"] = [];

    for (const consumer of contractConsumers) {
      const consumerOpIds = consumer.operationIds;
      const brokenForThisConsumer = consumerOpIds.filter((op) => breakingOpIds.has(op));

      if (brokenForThisConsumer.length > 0) {
        impactedConsumers.push({
          consumerServiceId: consumer.consumerServiceId,
          consumerServiceName:
            serviceNames?.[consumer.consumerServiceId] || consumer.consumerServiceId,
          usedOperations: consumerOpIds,
          breakingOperationIds: brokenForThisConsumer,
          isConfirmedBreak: consumer.confirmed,
          transitiveDownstreamCount: 0,
        });
      }
    }

    // Unknown consumer risk:
    // 1. Contract exposure is public or partner.
    // 2. Or breaking operations have zero registered consumers in private architectures.
    let unknownConsumerRisk = false;
    const recommendations: string[] = [];

    if (contract.exposure === "public" || contract.exposure === "partner") {
      unknownConsumerRisk = true;
      recommendations.push(
        `Contract "${contract.name}" is exposed as ${contract.exposure}. External consumers outside the internal repository may experience breaking changes.`
      );
    } else {
      for (const brokenOp of breakingOpIds) {
        const hasKnownConsumer = contractConsumers.some((c) => c.operationIds.includes(brokenOp));
        if (!hasKnownConsumer) {
          unknownConsumerRisk = true;
          recommendations.push(
            `Operation "${brokenOp}" has no registered internal consumers. Verify whether unmapped services or scripts call this endpoint before applying breaking changes.`
          );
        }
      }
    }

    if (impactedConsumers.length > 0) {
      recommendations.push(
        `Coordinate release with ${impactedConsumers.length} affected consumer team(s): ${impactedConsumers.map((c) => c.consumerServiceName).join(", ")}.`
      );
    }

    return {
      contractId: contract.id,
      totalConsumers: contractConsumers.length,
      impactedConsumers,
      unknownConsumerRisk,
      recommendations,
    };
  }
}

