/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Deterministic Four-State Policy Evaluator
 */

import type {
  GovernancePolicy,
  EvidenceArtifact,
  PolicyException,
  PolicyEvaluation,
  GovernanceFinding,
} from "../contracts/governance.types";
import { PolicyAstInterpreter } from "./policy-ast";
import { ApplicabilityEvaluator, type ApplicabilityContext } from "./applicability-evaluator";
import { EvidenceResolver } from "./evidence-resolver";

export interface EvaluationOptions {
  currentTimestamp?: string;
  evaluatorVersion?: string;
}

export class PolicyEvaluator {
  private static readonly EVALUATOR_VERSION = "1.0.0-governance-ast";

  /**
   * Deterministically evaluates a single policy against a target resource context.
   * Produces one of 4 states: "pass" | "fail" | "unknown" | "not_applicable".
   */
  public static evaluatePolicy(
    policy: GovernancePolicy,
    evidence: EvidenceArtifact[],
    exceptions: PolicyException[],
    targetProperties: Record<string, any>,
    resourceId?: string,
    resourceName?: string,
    options?: EvaluationOptions
  ): PolicyEvaluation {
    const timestamp = options?.currentTimestamp || new Date().toISOString();
    const evaluatorVersion = options?.evaluatorVersion || this.EVALUATOR_VERSION;

    // 1. Evaluate Applicability
    const appCtx: ApplicabilityContext = {
      environment: targetProperties.environment,
      componentType: targetProperties.componentType,
      dataClassification: targetProperties.dataClassification,
      geographicRegion: targetProperties.geographicRegion,
      tags: targetProperties.tags,
      organizationId: policy.scope.organizationId,
      workspaceId: policy.scope.workspaceId,
      projectId: policy.scope.projectId,
    };

    const applicability = ApplicabilityEvaluator.evaluateApplicability(policy.scope, appCtx);

    if (!applicability.isApplicable) {
      return {
        id: `eval-${policy.id}-${resourceId || "global"}`,
        policyId: policy.id,
        policyVersion: policy.version,
        policyTitle: policy.title,
        category: policy.category,
        severity: policy.severity,
        resourceId,
        resourceName,
        status: "not_applicable",
        isApplicable: false,
        applicableReason: applicability.reason,
        evidenceIds: [],
        missingEvidenceTypes: [],
        explanation: `Policy does not apply: ${applicability.reason}`,
        remediationGuidance: policy.remediationGuidance,
        hasActiveException: false,
        evaluatedAt: timestamp,
        evaluatorVersion,
      };
    }

    // 2. Resolve Required Evidence Artifacts
    const evidenceRes = EvidenceResolver.resolveEvidence(
      policy.requiredEvidenceTypes,
      evidence,
      resourceId,
      timestamp
    );

    // If required evidence is missing or stale, evaluation status is UNKNOWN
    if (!evidenceRes.isComplete) {
      const missingDetails: string[] = [];
      if (evidenceRes.missingTypes.length > 0) {
        missingDetails.push(`Missing required evidence types: [${evidenceRes.missingTypes.join(", ")}]`);
      }
      if (evidenceRes.staleEvidenceIds.length > 0) {
        missingDetails.push(`Stale/expired evidence artifacts detected: [${evidenceRes.staleEvidenceIds.join(", ")}]`);
      }

      return {
        id: `eval-${policy.id}-${resourceId || "global"}`,
        policyId: policy.id,
        policyVersion: policy.version,
        policyTitle: policy.title,
        category: policy.category,
        severity: policy.severity,
        resourceId,
        resourceName,
        status: "unknown",
        isApplicable: true,
        applicableReason: applicability.reason,
        evidenceIds: evidenceRes.evidenceIds,
        missingEvidenceTypes: evidenceRes.missingTypes,
        explanation: `Evaluation status is UNKNOWN. ${missingDetails.join(". ")}. Per architectural governance principles, missing evidence cannot be assumed to pass.`,
        remediationGuidance: `Provide verified evidence artifacts of types: [${policy.requiredEvidenceTypes.join(", ")}].`,
        hasActiveException: false,
        evaluatedAt: timestamp,
        evaluatorVersion,
      };
    }

    // 3. Evaluate Rule AST
    const mergedContext = { ...targetProperties, ...evidenceRes.resolvedContext };
    const ruleResult = PolicyAstInterpreter.evaluateRule(policy.rule, mergedContext);

    const evalStatus = ruleResult.passed ? "pass" : "fail";

    // 4. Check for Active Approved Exceptions
    const activeException = exceptions.find((ex) => {
      if (ex.policyId !== policy.id) return false;
      if (ex.status !== "approved") return false;

      // Check expiration
      const expMs = new Date(ex.expirationDate).getTime();
      const currentMs = new Date(timestamp).getTime();
      if (expMs <= currentMs || ex.isExpired) return false;

      // Check scope match
      return ex.resourceScope.includes("*") || (resourceId && ex.resourceScope.includes(resourceId));
    });

    const hasActiveException = !!activeException;
    const exceptionId = activeException?.id;

    const explanation = ruleResult.passed
      ? `Policy rule passed: ${ruleResult.reason}`
      : `Policy rule violated: ${ruleResult.reason}${
          hasActiveException ? ` [Approved Time-Bound Exception: ${exceptionId}]` : ""
        }`;

    return {
      id: `eval-${policy.id}-${resourceId || "global"}`,
      policyId: policy.id,
      policyVersion: policy.version,
      policyTitle: policy.title,
      category: policy.category,
      severity: policy.severity,
      resourceId,
      resourceName,
      status: evalStatus,
      isApplicable: true,
      applicableReason: applicability.reason,
      evidenceIds: evidenceRes.evidenceIds,
      missingEvidenceTypes: [],
      explanation,
      remediationGuidance: policy.remediationGuidance,
      exceptionId,
      hasActiveException,
      evaluatedAt: timestamp,
      evaluatorVersion,
    };
  }

  /**
   * Converts a failing or unknown evaluation into a normalized GovernanceFinding.
   */
  public static toFinding(
    evaluation: PolicyEvaluation,
    policy: GovernancePolicy
  ): GovernanceFinding | null {
    if (evaluation.status === "pass" || evaluation.status === "not_applicable") {
      return null;
    }

    return {
      id: `finding-${evaluation.id}`,
      policyId: evaluation.policyId,
      policyVersion: evaluation.policyVersion,
      title: evaluation.policyTitle,
      category: evaluation.category,
      severity: evaluation.severity,
      affectedResourceIds: evaluation.resourceId ? [evaluation.resourceId] : ["global"],
      evaluationStatus: evaluation.status,
      summary: evaluation.explanation,
      rationale: policy.description,
      remediation: evaluation.remediationGuidance,
      hasApprovedException: evaluation.hasActiveException,
      exceptionId: evaluation.exceptionId,
      evidenceIds: evaluation.evidenceIds,
      provenance: policy.provenance,
    };
  }
}

