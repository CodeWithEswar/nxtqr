/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Policy Scope & Applicability Evaluator
 */

import type { GovernanceScope } from "../contracts/governance.types";

export interface ApplicabilityContext {
  environment?: string;
  componentType?: string;
  dataClassification?: string;
  geographicRegion?: string;
  tags?: string[];
  organizationId?: string;
  workspaceId?: string;
  projectId?: string;
}

export interface ApplicabilityResult {
  isApplicable: boolean;
  reason: string;
}

export class ApplicabilityEvaluator {
  /**
   * Deterministically evaluates whether a governance policy scope matches a given resource context.
   */
  public static evaluateApplicability(
    scope: GovernanceScope,
    context: ApplicabilityContext
  ): ApplicabilityResult {
    // 1. Organization Level Check
    if (scope.organizationId && context.organizationId && scope.organizationId !== context.organizationId) {
      return {
        isApplicable: false,
        reason: `Policy applies exclusively to organization '${scope.organizationId}', but target belongs to '${context.organizationId}'.`,
      };
    }

    // 2. Workspace Level Check
    if (scope.level === "workspace" && scope.workspaceId && context.workspaceId && scope.workspaceId !== context.workspaceId) {
      return {
        isApplicable: false,
        reason: `Policy applies to workspace '${scope.workspaceId}', but target resides in '${context.workspaceId}'.`,
      };
    }

    // 3. Project Level Check
    if (scope.level === "project" && scope.projectId && context.projectId && scope.projectId !== context.projectId) {
      return {
        isApplicable: false,
        reason: `Policy applies to project '${scope.projectId}', but target resides in '${context.projectId}'.`,
      };
    }

    // 4. Environment Filter
    if (scope.environments && scope.environments.length > 0 && !scope.environments.includes("all")) {
      const targetEnv = (context.environment || "development").toLowerCase();
      const envMatches = scope.environments.some((env) => env.toLowerCase() === targetEnv);
      if (!envMatches) {
        return {
          isApplicable: false,
          reason: `Policy targets environments [${scope.environments.join(", ")}], but resource is in '${context.environment}'.`,
        };
      }
    }

    // 5. Component Type Filter
    if (scope.componentTypes && scope.componentTypes.length > 0) {
      const targetType = (context.componentType || "").toLowerCase();
      const typeMatches = scope.componentTypes.some((t) => t.toLowerCase() === targetType);
      if (!typeMatches) {
        return {
          isApplicable: false,
          reason: `Policy targets component types [${scope.componentTypes.join(", ")}], but resource is of type '${context.componentType}'.`,
        };
      }
    }

    // 6. Data Classification Filter
    if (scope.dataClassifications && scope.dataClassifications.length > 0) {
      const targetClassification = (context.dataClassification || "internal").toLowerCase();
      const classMatches = scope.dataClassifications.some((dc) => dc.toLowerCase() === targetClassification);
      if (!classMatches) {
        return {
          isApplicable: false,
          reason: `Policy applies to data classifications [${scope.dataClassifications.join(", ")}], but resource is classified as '${context.dataClassification}'.`,
        };
      }
    }

    // 7. Geographic Region Filter
    if (scope.regions && scope.regions.length > 0) {
      const targetRegion = (context.geographicRegion || "").toLowerCase();
      const regionMatches = scope.regions.some((r) => r.toLowerCase() === targetRegion);
      if (!regionMatches) {
        return {
          isApplicable: false,
          reason: `Policy targets regions [${scope.regions.join(", ")}], but resource is deployed in '${context.geographicRegion}'.`,
        };
      }
    }

    // 8. Tags Filter
    if (scope.tags && scope.tags.length > 0) {
      const targetTags = (context.tags || []).map((t) => t.toLowerCase());
      const hasMatchingTag = scope.tags.some((tag) => targetTags.includes(tag.toLowerCase()));
      if (!hasMatchingTag) {
        return {
          isApplicable: false,
          reason: `Policy requires one of tags [${scope.tags.join(", ")}], which were not present on resource.`,
        };
      }
    }

    return {
      isApplicable: true,
      reason: "All scope criteria satisfied.",
    };
  }
}
