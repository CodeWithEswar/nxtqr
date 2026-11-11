/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Test Applicability Evaluator
 */

import type { BaseNode } from "@nxtqr/graph-schema";
import type { ArchitectureTest, TestScope } from "../contracts/verification.types";

export interface VerificationApplicabilityResult {
  isApplicable: boolean | "unknown";
  reason: string;
  targetNodes: BaseNode[];
}

export class VerificationApplicabilityEvaluator {
  /**
   * Determines whether an ArchitectureTest is applicable to the current architecture context.
   * Four-state friendly: never collapses unknown applicability into not-applicable.
   */
  public static evaluateApplicability(
    test: ArchitectureTest,
    nodes: BaseNode[],
    currentEnvironment: string = "production"
  ): VerificationApplicabilityResult {
    const scope: TestScope = test.scope;

    // 1. Environment check
    if (scope.environment && scope.environment !== "all") {
      if (scope.environment !== currentEnvironment) {
        return {
          isApplicable: false,
          reason: `Test is scoped for '${scope.environment}' environment, but active environment is '${currentEnvironment}'.`,
          targetNodes: [],
        };
      }
    }

    // 2. Scope Level check
    switch (scope.level) {
      case "organization":
      case "workspace":
      case "project":
      case "architecture":
        return {
          isApplicable: true,
          reason: `Test applies globally to active architecture snapshot (${nodes.length} nodes).`,
          targetNodes: nodes,
        };

      case "environment":
        return {
          isApplicable: true,
          reason: `Test applies to environment '${currentEnvironment}'.`,
          targetNodes: nodes,
        };

      case "component": {
        if (!scope.targetIds || scope.targetIds.length === 0) {
          // If no specific IDs given, applies to all nodes matching category
          const matchingNodes = nodes.filter((n) => {
            if (test.category === "database") return (n.data as any)?.nodeType === "database";
            if (test.category === "messaging") return (n.data as any)?.nodeType === "queue" || (n.data as any)?.nodeType === "topic";
            if (test.category === "network") return (n.data as any)?.nodeType === "gateway";
            if (test.category === "caching") return (n.data as any)?.nodeType === "cache";
            return true;
          });

          if (matchingNodes.length === 0) {
            return {
              isApplicable: false,
              reason: `No components matching test category '${test.category}' found in architecture.`,
              targetNodes: [],
            };
          }

          return {
            isApplicable: true,
            reason: `Applies to ${matchingNodes.length} component(s) matching category '${test.category}'.`,
            targetNodes: matchingNodes,
          };
        }

        const foundNodes = nodes.filter((n) => scope.targetIds?.includes(n.id));
        if (foundNodes.length === 0) {
          return {
            isApplicable: false,
            reason: `Target component(s) [${scope.targetIds.join(", ")}] not present in architecture.`,
            targetNodes: [],
          };
        }

        return {
          isApplicable: true,
          reason: `Target component(s) [${foundNodes.map((n) => n.id).join(", ")}] found.`,
          targetNodes: foundNodes,
        };
      }

      case "critical_journey": {
        if (!scope.targetIds || scope.targetIds.length === 0) {
          return {
            isApplicable: "unknown",
            reason: "Critical journey scope defined without explicit journey target IDs.",
            targetNodes: [],
          };
        }

        return {
          isApplicable: true,
          reason: `Scoped to critical journey targets [${scope.targetIds.join(", ")}].`,
          targetNodes: nodes.filter((n) => scope.targetIds?.includes(n.id)),
        };
      }

      case "region": {
        if (!scope.targetIds || scope.targetIds.length === 0) {
          return {
            isApplicable: "unknown",
            reason: "Region scope declared without specific region IDs.",
            targetNodes: [],
          };
        }

        const regionalNodes = nodes.filter((n) =>
          scope.targetIds?.includes((n.data as any)?.region)
        );

        if (regionalNodes.length === 0) {
          return {
            isApplicable: false,
            reason: `No components deployed in target region(s) [${scope.targetIds.join(", ")}].`,
            targetNodes: [],
          };
        }

        return {
          isApplicable: true,
          reason: `Applies to ${regionalNodes.length} component(s) in region(s) [${scope.targetIds.join(", ")}].`,
          targetNodes: regionalNodes,
        };
      }

      case "api":
      case "data_asset":
        return {
          isApplicable: true,
          reason: `Applies to asset scope '${scope.level}'.`,
          targetNodes: nodes,
        };

      default:
        return {
          isApplicable: "unknown",
          reason: `Unrecognized test scope level: ${(scope as any).level}`,
          targetNodes: [],
        };
    }
  }
}
