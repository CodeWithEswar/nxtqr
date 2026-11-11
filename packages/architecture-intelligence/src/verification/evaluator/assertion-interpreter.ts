/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Safe Declarative Assertion AST Interpreter
 */

import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  ArchitectureAssertion,
  VerificationEvidence,
  TestSeverity,
} from "../contracts/verification.types";

export interface AssertionEvaluationContext {
  targetNode?: BaseNode;
  nodes: BaseNode[];
  edges: BaseEdge[];
  evidenceCatalog: VerificationEvidence[];
  engineFindings?: Array<{ engine: string; severity: TestSeverity; description: string }>;
}

export interface AssertionResult {
  passed: boolean;
  isUnknown?: boolean;
  reason: string;
  evidenceIds: string[];
  affectedComponentIds: string[];
}

export class AssertionInterpreter {
  private static readonly MAX_DEPTH = 10;

  /**
   * Evaluates an ArchitectureAssertion AST deterministically and safely.
   */
  public static evaluate(
    assertion: ArchitectureAssertion,
    context: AssertionEvaluationContext,
    depth = 0
  ): AssertionResult {
    if (depth > this.MAX_DEPTH) {
      return {
        passed: false,
        isUnknown: true,
        reason: `Assertion exceeded maximum nesting depth of ${this.MAX_DEPTH}`,
        evidenceIds: [],
        affectedComponentIds: context.targetNode ? [context.targetNode.id] : [],
      };
    }

    const affectedIds = context.targetNode ? [context.targetNode.id] : [];

    switch (assertion.operator) {
      case "all": {
        if (!assertion.children || assertion.children.length === 0) {
          return {
            passed: true,
            reason: "Empty composite assertion evaluated to true.",
            evidenceIds: [],
            affectedComponentIds: affectedIds,
          };
        }

        const childResults = assertion.children.map((child) =>
          this.evaluate(child, context, depth + 1)
        );

        const unknownChild = childResults.find((r) => r.isUnknown);
        if (unknownChild) {
          return {
            passed: false,
            isUnknown: true,
            reason: `Sub-assertion returned unknown: ${unknownChild.reason}`,
            evidenceIds: childResults.flatMap((r) => r.evidenceIds),
            affectedComponentIds: Array.from(
              new Set(childResults.flatMap((r) => r.affectedComponentIds))
            ),
          };
        }

        const failedChild = childResults.find((r) => !r.passed);
        if (failedChild) {
          return {
            passed: false,
            reason: failedChild.reason,
            evidenceIds: childResults.flatMap((r) => r.evidenceIds),
            affectedComponentIds: Array.from(
              new Set(childResults.flatMap((r) => r.affectedComponentIds))
            ),
          };
        }

        return {
          passed: true,
          reason: "All sub-conditions passed successfully.",
          evidenceIds: childResults.flatMap((r) => r.evidenceIds),
          affectedComponentIds: Array.from(
            new Set(childResults.flatMap((r) => r.affectedComponentIds))
          ),
        };
      }

      case "any": {
        if (!assertion.children || assertion.children.length === 0) {
          return {
            passed: false,
            reason: "Empty disjunctive assertion evaluated to false.",
            evidenceIds: [],
            affectedComponentIds: affectedIds,
          };
        }

        const childResults = assertion.children.map((child) =>
          this.evaluate(child, context, depth + 1)
        );

        const passedChild = childResults.find((r) => r.passed && !r.isUnknown);
        if (passedChild) {
          return {
            passed: true,
            reason: `Condition satisfied by: ${passedChild.reason}`,
            evidenceIds: passedChild.evidenceIds,
            affectedComponentIds: passedChild.affectedComponentIds,
          };
        }

        const unknownChild = childResults.find((r) => r.isUnknown);
        if (unknownChild) {
          return {
            passed: false,
            isUnknown: true,
            reason: `Disjunctive condition unknown: ${unknownChild.reason}`,
            evidenceIds: childResults.flatMap((r) => r.evidenceIds),
            affectedComponentIds: Array.from(
              new Set(childResults.flatMap((r) => r.affectedComponentIds))
            ),
          };
        }

        return {
          passed: false,
          reason: "None of the alternate sub-conditions were satisfied.",
          evidenceIds: childResults.flatMap((r) => r.evidenceIds),
          affectedComponentIds: Array.from(
            new Set(childResults.flatMap((r) => r.affectedComponentIds))
          ),
        };
      }

      case "none": {
        if (!assertion.children || assertion.children.length === 0) {
          return {
            passed: true,
            reason: "Empty negative assertion evaluated to true.",
            evidenceIds: [],
            affectedComponentIds: affectedIds,
          };
        }

        const childResults = assertion.children.map((child) =>
          this.evaluate(child, context, depth + 1)
        );

        const passedChild = childResults.find((r) => r.passed && !r.isUnknown);
        if (passedChild) {
          return {
            passed: false,
            reason: `Prohibited condition detected: ${passedChild.reason}`,
            evidenceIds: passedChild.evidenceIds,
            affectedComponentIds: passedChild.affectedComponentIds,
          };
        }

        return {
          passed: true,
          reason: "None of the prohibited sub-conditions occurred.",
          evidenceIds: childResults.flatMap((r) => r.evidenceIds),
          affectedComponentIds: Array.from(
            new Set(childResults.flatMap((r) => r.affectedComponentIds))
          ),
        };
      }

      case "equals": {
        const val = this.resolvePath(context.targetNode, assertion.path);
        const passed = val === assertion.targetValue;
        return {
          passed,
          reason: passed
            ? `Property ${assertion.path} strictly equals expected value (${JSON.stringify(assertion.targetValue)})`
            : `Property ${assertion.path} value (${JSON.stringify(val)}) does not match expected (${JSON.stringify(assertion.targetValue)})`,
          evidenceIds: [],
          affectedComponentIds: affectedIds,
        };
      }

      case "not_equals": {
        const val = this.resolvePath(context.targetNode, assertion.path);
        const passed = val !== assertion.targetValue;
        return {
          passed,
          reason: passed
            ? `Property ${assertion.path} strictly differs from (${JSON.stringify(assertion.targetValue)})`
            : `Property ${assertion.path} equals prohibited value (${JSON.stringify(assertion.targetValue)})`,
          evidenceIds: [],
          affectedComponentIds: affectedIds,
        };
      }

      case "exists": {
        const val = this.resolvePath(context.targetNode, assertion.path);
        const passed = val !== undefined && val !== null && val !== "";
        return {
          passed,
          reason: passed
            ? `Required property ${assertion.path} is declared`
            : `Required property ${assertion.path} is missing or undefined`,
          evidenceIds: [],
          affectedComponentIds: affectedIds,
        };
      }

      case "missing": {
        const val = this.resolvePath(context.targetNode, assertion.path);
        const passed = val === undefined || val === null || val === "";
        return {
          passed,
          reason: passed
            ? `Prohibited property ${assertion.path} is absent as required`
            : `Prohibited property ${assertion.path} is unexpectedly present`,
          evidenceIds: [],
          affectedComponentIds: affectedIds,
        };
      }

      case "greater_than": {
        const val = this.resolvePath(context.targetNode, assertion.path);
        if (typeof val !== "number" || typeof assertion.targetValue !== "number") {
          return {
            passed: false,
            isUnknown: true,
            reason: `Numeric comparison failed: ${assertion.path} is not a valid number (${JSON.stringify(val)})`,
            evidenceIds: [],
            affectedComponentIds: affectedIds,
          };
        }
        const passed = val > assertion.targetValue;
        return {
          passed,
          reason: passed
            ? `Value ${val} exceeds minimum threshold ${assertion.targetValue}`
            : `Value ${val} does not exceed minimum threshold ${assertion.targetValue}`,
          evidenceIds: [],
          affectedComponentIds: affectedIds,
        };
      }

      case "less_than": {
        const val = this.resolvePath(context.targetNode, assertion.path);
        if (typeof val !== "number" || typeof assertion.targetValue !== "number") {
          return {
            passed: false,
            isUnknown: true,
            reason: `Numeric comparison failed: ${assertion.path} is not a valid number (${JSON.stringify(val)})`,
            evidenceIds: [],
            affectedComponentIds: affectedIds,
          };
        }
        const passed = val < assertion.targetValue;
        return {
          passed,
          reason: passed
            ? `Value ${val} is below maximum ceiling ${assertion.targetValue}`
            : `Value ${val} exceeds maximum ceiling ${assertion.targetValue}`,
          evidenceIds: [],
          affectedComponentIds: affectedIds,
        };
      }

      case "in_set": {
        const val = this.resolvePath(context.targetNode, assertion.path);
        const allowed = Array.isArray(assertion.targetValue) ? assertion.targetValue : [];
        const passed = allowed.includes(val);
        return {
          passed,
          reason: passed
            ? `Property ${assertion.path} (${JSON.stringify(val)}) is within allowed set`
            : `Property ${assertion.path} (${JSON.stringify(val)}) is not in allowed set [${allowed.join(", ")}]`,
          evidenceIds: [],
          affectedComponentIds: affectedIds,
        };
      }

      case "graph_reachable":
      case "path_exists": {
        const fromId = assertion.fromNodeId || (context.targetNode ? context.targetNode.id : undefined);
        const toId = assertion.toNodeId;

        if (!fromId || !toId) {
          return {
            passed: false,
            isUnknown: true,
            reason: `Graph reachability requires both fromNodeId and toNodeId to be specified`,
            evidenceIds: [],
            affectedComponentIds: affectedIds,
          };
        }

        const isReachable = this.checkReachability(fromId, toId, context.nodes, context.edges);
        return {
          passed: isReachable,
          reason: isReachable
            ? `Verified graph path exists from ${fromId} to ${toId}`
            : `No directed path found connecting ${fromId} to ${toId}`,
          evidenceIds: [],
          affectedComponentIds: [fromId, toId],
        };
      }

      case "relationship_count": {
        const nodeId = context.targetNode?.id;
        if (!nodeId) {
          return {
            passed: false,
            isUnknown: true,
            reason: "Target component must be present for relationship count assertion",
            evidenceIds: [],
            affectedComponentIds: [],
          };
        }

        const count = context.edges.filter(
          (e) => e.source === nodeId || e.target === nodeId
        ).length;
        const expected = Number(assertion.targetValue || 0);
        const passed = count >= expected;
        return {
          passed,
          reason: passed
            ? `Component ${nodeId} has ${count} connections (expected at least ${expected})`
            : `Component ${nodeId} has only ${count} connections (required at least ${expected})`,
          evidenceIds: [],
          affectedComponentIds: [nodeId],
        };
      }

      case "evidence_present": {
        const evType = assertion.evidenceType;
        if (!evType) {
          return {
            passed: false,
            isUnknown: true,
            reason: "Evidence type must be specified for evidence_present assertion",
            evidenceIds: [],
            affectedComponentIds: affectedIds,
          };
        }

        const matching = context.evidenceCatalog.filter((e) => e.evidenceType === evType);
        if (matching.length > 0) {
          return {
            passed: true,
            reason: `Verified evidence of type '${evType}' is present (${matching.length} items)`,
            evidenceIds: matching.map((e) => e.id),
            affectedComponentIds: affectedIds,
          };
        }

        return {
          passed: false,
          isUnknown: true,
          reason: `Required verification evidence of type '${evType}' is missing from catalog`,
          evidenceIds: [],
          affectedComponentIds: affectedIds,
        };
      }

      case "evidence_fresh": {
        const evType = assertion.evidenceType;
        const maxHours = assertion.maxAgeHours || 24;

        if (!evType) {
          return {
            passed: false,
            isUnknown: true,
            reason: "Evidence type must be specified for evidence_fresh assertion",
            evidenceIds: [],
            affectedComponentIds: affectedIds,
          };
        }

        const matching = context.evidenceCatalog.filter((e) => e.evidenceType === evType);
        if (matching.length === 0) {
          return {
            passed: false,
            isUnknown: true,
            reason: `No evidence found for type '${evType}' to assess freshness`,
            evidenceIds: [],
            affectedComponentIds: affectedIds,
          };
        }

        const now = Date.now();
        const freshItems = matching.filter((e) => {
          const obsTime = Date.parse(e.observedAt);
          if (isNaN(obsTime)) return false;
          const ageHours = (now - obsTime) / (1000 * 60 * 60);
          return ageHours <= maxHours;
        });

        if (freshItems.length > 0) {
          return {
            passed: true,
            reason: `Found fresh evidence for '${evType}' within ${maxHours}h window`,
            evidenceIds: freshItems.map((e) => e.id),
            affectedComponentIds: affectedIds,
          };
        }

        return {
          passed: false,
          reason: `All evidence for '${evType}' exceeds maximum freshness window of ${maxHours}h (stale)`,
          evidenceIds: matching.map((e) => e.id),
          affectedComponentIds: affectedIds,
        };
      }

      case "engine_finding_absent": {
        const engineId = assertion.engine;
        const findings = context.engineFindings || [];
        const matching = findings.filter((f) => {
          if (engineId && f.engine !== engineId) return false;
          if (assertion.minSeverity) {
            const order: Record<TestSeverity, number> = {
              critical: 4,
              high: 3,
              medium: 2,
              low: 1,
            };
            if (order[f.severity] < order[assertion.minSeverity]) return false;
          }
          return true;
        });

        if (matching.length === 0) {
          return {
            passed: true,
            reason: `No blocking findings detected from engine '${engineId || "all"}'`,
            evidenceIds: [],
            affectedComponentIds: affectedIds,
          };
        }

        return {
          passed: false,
          reason: `Detected ${matching.length} finding(s) from engine '${engineId || "all"}': ${matching[0].description}`,
          evidenceIds: [],
          affectedComponentIds: affectedIds,
        };
      }

      default:
        return {
          passed: false,
          isUnknown: true,
          reason: `Unsupported assertion operator: ${(assertion as any).operator}`,
          evidenceIds: [],
          affectedComponentIds: affectedIds,
        };
    }
  }

  /**
   * Safe property path extractor (e.g. "data.nodeType", "data.backupPolicy.exists")
   */
  public static resolvePath(obj: any, path?: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split(".");
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  /**
   * Deterministic BFS reachability traversal with cycle protection
   */
  private static checkReachability(
    fromId: string,
    toId: string,
    _nodes: BaseNode[],
    edges: BaseEdge[]
  ): boolean {
    if (fromId === toId) return true;

    const visited = new Set<string>();
    const queue: string[] = [fromId];
    visited.add(fromId);

    // Build adjacency list
    const adj = new Map<string, string[]>();
    for (const edge of edges) {
      const list = adj.get(edge.source) || [];
      list.push(edge.target);
      adj.set(edge.source, list);
    }

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === toId) return true;

      const neighbors = adj.get(curr) || [];
      for (const nxt of neighbors) {
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push(nxt);
        }
      }
    }

    return false;
  }
}
