/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Migration Planner for Breaking Contract Revisions
 */

import type {
  APIContract,
  SemanticContractDiff,
  ConsumerImpactReport,
  MigrationPlan,
  MigrationStep,
} from "../contracts/contract.types";

export class MigrationPlanner {
  /**
   * Generates a step-by-step, ordered migration plan to safely transition
   * provider and consumers across breaking contract revisions.
   */
  public static generatePlan(
    contract: APIContract,
    diff: SemanticContractDiff,
    impact: ConsumerImpactReport,
    options?: { compatibilityWindowDays?: number }
  ): MigrationPlan {
    const breakingFindings = diff.findings.filter((f) => f.classification === "breaking");
    const steps: MigrationStep[] = [];
    let stepNum = 1;

    // Step 1: Deploy Provider Dual-Support / Compatibility Shim
    steps.push({
      stepNumber: stepNum++,
      action: "Deploy Provider Compatibility Layer",
      targetServiceId: contract.providerServiceId,
      description: `Deploy candidate revision (${diff.candidateRevisionId}) to "${contract.providerServiceId}" while maintaining fallback routes or defaults for removed/altered operations.`,
      verificationCriteria: "Provider responds to both legacy and candidate schema formats with 0% error rate.",
    });

    // Step 2..N: Migrate each impacted consumer
    for (const consumer of impact.impactedConsumers) {
      steps.push({
        stepNumber: stepNum++,
        action: `Update Consumer Client: ${consumer.consumerServiceName}`,
        targetServiceId: consumer.consumerServiceId,
        description: `Update client payload serializer/deserializer in "${consumer.consumerServiceName}" to support candidate operations: ${consumer.breakingOperationIds.join(", ")}.`,
        verificationCriteria: `Consumer integration tests pass against candidate revision (${diff.candidateRevisionId}).`,
      });
    }

    // Step N+1: Observation & Canary Phase
    steps.push({
      stepNumber: stepNum++,
      action: "Verification & Telemetry Observation Window",
      targetServiceId: contract.providerServiceId,
      description: `Observe production traffic across all consumers for ${options?.compatibilityWindowDays || 14} days. Verify that no legacy client calls trigger 4xx/5xx errors.`,
      verificationCriteria: "Zero runtime invocations of deprecated legacy signatures over 14 consecutive days.",
    });

    // Step N+2: Final Decommissioning
    steps.push({
      stepNumber: stepNum++,
      action: "Decommission Legacy Operations",
      targetServiceId: contract.providerServiceId,
      description: `Safely remove legacy fallback shims, deprecated routes, and old Protobuf field tags.`,
      verificationCriteria: "API contract revision marked active; old revision archived.",
    });

    const rollbackConsiderations = [
      `If client errors exceed 0.5% during consumer update, immediately roll back consumer to baseline revision (${diff.baselineRevisionId}).`,
      `Provider compatibility layer must not drop database column or storage binding until all ${impact.impactedConsumers.length} consumers have verified candidate deployments.`,
      `Ensure gateway routes can instantly redirect traffic to baseline revision in the event of consumer deserialization failures.`,
    ];

    return {
      id: `plan-${contract.id}-${diff.baselineRevisionId}-to-${diff.candidateRevisionId}`,
      contractId: contract.id,
      contractName: contract.name,
      fromRevisionId: diff.baselineRevisionId,
      toRevisionId: diff.candidateRevisionId,
      breakingChangesCount: breakingFindings.length,
      affectedConsumersCount: impact.impactedConsumers.length,
      steps,
      rollbackConsiderations,
      compatibilityWindowDays: options?.compatibilityWindowDays || 14,
    };
  }
}

