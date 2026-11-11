/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Safe Declarative Policy Rule AST Interpreter
 */

import type { PolicyRule, RuleOperator } from "../contracts/governance.types";

export interface AstEvaluationResult {
  passed: boolean;
  reason: string;
}

export class PolicyAstInterpreter {
  private static readonly MAX_AST_DEPTH = 10;

  /**
   * Evaluates a declarative PolicyRule AST against target property context.
   * Completely safe and deterministic with bounded depth and zero dynamic code execution.
   */
  public static evaluateRule(
    rule: PolicyRule,
    context: Record<string, any>,
    depth = 0
  ): AstEvaluationResult {
    if (depth > this.MAX_AST_DEPTH) {
      return {
        passed: false,
        reason: `Rule evaluation exceeded maximum allowed AST depth of ${this.MAX_AST_DEPTH}.`,
      };
    }

    let result = false;
    let reason = "";

    switch (rule.operator) {
      case "all": {
        if (!rule.children || rule.children.length === 0) {
          result = true;
          reason = "Empty composite rule evaluated to true.";
        } else {
          const childResults = rule.children.map((c) =>
            this.evaluateRule(c, context, depth + 1)
          );
          const failedChild = childResults.find((r) => !r.passed);
          if (failedChild) {
            result = false;
            reason = failedChild.reason;
          } else {
            result = true;
            reason = "All sub-conditions passed.";
          }
        }
        break;
      }

      case "any": {
        if (!rule.children || rule.children.length === 0) {
          result = false;
          reason = "Empty disjunctive rule evaluated to false.";
        } else {
          const childResults = rule.children.map((c) =>
            this.evaluateRule(c, context, depth + 1)
          );
          const passedChild = childResults.find((r) => r.passed);
          if (passedChild) {
            result = true;
            reason = passedChild.reason;
          } else {
            result = false;
            reason = "None of the required alternate conditions were satisfied.";
          }
        }
        break;
      }

      case "none": {
        if (!rule.children || rule.children.length === 0) {
          result = true;
          reason = "Empty negation condition evaluated to true.";
        } else {
          const childResults = rule.children.map((c) =>
            this.evaluateRule(c, context, depth + 1)
          );
          const passedChild = childResults.find((r) => r.passed);
          if (passedChild) {
            result = false;
            reason = `Prohibited condition detected: ${passedChild.reason}`;
          } else {
            result = true;
            reason = "None of the prohibited conditions were present.";
          }
        }
        break;
      }

      default: {
        const val = this.extractValue(context, rule.targetProperty);
        const evalOp = this.evaluateOperator(
          rule.operator,
          val,
          rule.expectedValue,
          rule.targetProperty || "property"
        );
        result = evalOp.passed;
        reason = evalOp.reason;
      }
    }

    if (rule.negate) {
      result = !result;
      reason = `Negated: ${reason}`;
    }

    return { passed: result, reason };
  }

  private static evaluateOperator(
    op: RuleOperator,
    actualValue: any,
    expectedValue: any,
    propName: string
  ): AstEvaluationResult {
    switch (op) {
      case "equals": {
        const passed = actualValue === expectedValue;
        return {
          passed,
          reason: passed
            ? `'${propName}' matches required value '${String(expectedValue)}'.`
            : `'${propName}' is '${String(actualValue)}', but required '${String(expectedValue)}'.`,
        };
      }

      case "not_equals": {
        const passed = actualValue !== expectedValue;
        return {
          passed,
          reason: passed
            ? `'${propName}' is correctly not equal to '${String(expectedValue)}'.`
            : `'${propName}' has prohibited value '${String(expectedValue)}'.`,
        };
      }

      case "exists": {
        const passed = actualValue !== undefined && actualValue !== null && actualValue !== "";
        return {
          passed,
          reason: passed
            ? `Required property '${propName}' is defined.`
            : `Required property '${propName}' is missing or undefined.`,
        };
      }

      case "missing": {
        const passed = actualValue === undefined || actualValue === null || actualValue === "";
        return {
          passed,
          reason: passed
            ? `'${propName}' is correctly omitted.`
            : `'${propName}' was unexpectedly present with value '${String(actualValue)}'.`,
        };
      }

      case "greater_than": {
        const numActual = Number(actualValue);
        const numExpected = Number(expectedValue);
        const passed = !isNaN(numActual) && !isNaN(numExpected) && numActual > numExpected;
        return {
          passed,
          reason: passed
            ? `'${propName}' (${numActual}) is greater than required threshold (${numExpected}).`
            : `'${propName}' (${numActual}) is not greater than threshold (${numExpected}).`,
        };
      }

      case "less_than": {
        const numActual = Number(actualValue);
        const numExpected = Number(expectedValue);
        const passed = !isNaN(numActual) && !isNaN(numExpected) && numActual < numExpected;
        return {
          passed,
          reason: passed
            ? `'${propName}' (${numActual}) is below maximum ceiling (${numExpected}).`
            : `'${propName}' (${numActual}) exceeds maximum allowed threshold (${numExpected}).`,
        };
      }

      case "in_set": {
        if (!Array.isArray(expectedValue)) {
          return { passed: false, reason: "Expected set is not an array." };
        }
        const passed = expectedValue.includes(actualValue);
        return {
          passed,
          reason: passed
            ? `'${propName}' ('${String(actualValue)}') is a member of approved set [${expectedValue.join(", ")}].`
            : `'${propName}' ('${String(actualValue)}') is not within approved set [${expectedValue.join(", ")}].`,
        };
      }

      case "not_in_set": {
        if (!Array.isArray(expectedValue)) {
          return { passed: true, reason: "Expected set is empty." };
        }
        const passed = !expectedValue.includes(actualValue);
        return {
          passed,
          reason: passed
            ? `'${propName}' is not in prohibited set.`
            : `'${propName}' ('${String(actualValue)}') is in prohibited set [${expectedValue.join(", ")}].`,
        };
      }

      case "relationship_count": {
        const count = Array.isArray(actualValue) ? actualValue.length : Number(actualValue) || 0;
        const required = Number(expectedValue) || 1;
        const passed = count >= required;
        return {
          passed,
          reason: passed
            ? `Relationship count for '${propName}' (${count}) satisfies minimum requirement (${required}).`
            : `Relationship count for '${propName}' (${count}) is below minimum requirement (${required}).`,
        };
      }

      case "attribute_matches": {
        const strActual = String(actualValue ?? "");
        const pattern = String(expectedValue ?? "");
        let passed = false;
        try {
          const regex = new RegExp(pattern);
          passed = regex.test(strActual);
        } catch {
          passed = strActual.includes(pattern);
        }
        return {
          passed,
          reason: passed
            ? `'${propName}' matches required pattern '${pattern}'.`
            : `'${propName}' ('${strActual}') failed pattern match '${pattern}'.`,
        };
      }

      default:
        return {
          passed: false,
          reason: `Unsupported rule operator: '${String(op)}'.`,
        };
    }
  }

  private static extractValue(context: Record<string, any>, path?: string): any {
    if (!path) return undefined;
    const parts = path.split(".");
    let current = context;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }
}
