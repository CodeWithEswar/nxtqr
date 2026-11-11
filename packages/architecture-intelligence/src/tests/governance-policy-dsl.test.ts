import { describe, it, expect } from "vitest";
import { PolicyAstInterpreter } from "../governance/evaluator/policy-ast";
import type { PolicyRule } from "../governance/contracts/governance.types";

describe("Phase 05.3.25 — Policy-as-Code Declarative Rule AST Interpreter", () => {
  it("evaluates simple equality and inequality operators correctly", () => {
    const ruleEquals: PolicyRule = {
      id: "r-eq",
      targetProperty: "tls.version",
      operator: "equals",
      expectedValue: "TLS_1_3",
    };

    expect(PolicyAstInterpreter.evaluateRule(ruleEquals, { tls: { version: "TLS_1_3" } }).passed).toBe(true);
    expect(PolicyAstInterpreter.evaluateRule(ruleEquals, { tls: { version: "TLS_1_2" } }).passed).toBe(false);

    const ruleNotEquals: PolicyRule = {
      id: "r-neq",
      targetProperty: "network.protocol",
      operator: "not_equals",
      expectedValue: "http",
    };

    expect(PolicyAstInterpreter.evaluateRule(ruleNotEquals, { network: { protocol: "https" } }).passed).toBe(true);
    expect(PolicyAstInterpreter.evaluateRule(ruleNotEquals, { network: { protocol: "http" } }).passed).toBe(false);
  });

  it("evaluates property existence and missing operators correctly", () => {
    const ruleExists: PolicyRule = {
      id: "r-exists",
      targetProperty: "database.backupSchedule",
      operator: "exists",
    };

    expect(PolicyAstInterpreter.evaluateRule(ruleExists, { database: { backupSchedule: "0 2 * * *" } }).passed).toBe(true);
    expect(PolicyAstInterpreter.evaluateRule(ruleExists, { database: {} }).passed).toBe(false);
    expect(PolicyAstInterpreter.evaluateRule(ruleExists, {}).passed).toBe(false);

    const ruleMissing: PolicyRule = {
      id: "r-missing",
      targetProperty: "secrets.plaintextKey",
      operator: "missing",
    };

    expect(PolicyAstInterpreter.evaluateRule(ruleMissing, {}).passed).toBe(true);
    expect(PolicyAstInterpreter.evaluateRule(ruleMissing, { secrets: { plaintextKey: "supersecret" } }).passed).toBe(false);
  });

  it("evaluates numeric comparisons (greater_than, less_than)", () => {
    const ruleGt: PolicyRule = {
      id: "r-gt",
      targetProperty: "resilience.replicaCount",
      operator: "greater_than",
      expectedValue: 2,
    };

    expect(PolicyAstInterpreter.evaluateRule(ruleGt, { resilience: { replicaCount: 3 } }).passed).toBe(true);
    expect(PolicyAstInterpreter.evaluateRule(ruleGt, { resilience: { replicaCount: 2 } }).passed).toBe(false);
    expect(PolicyAstInterpreter.evaluateRule(ruleGt, { resilience: { replicaCount: 1 } }).passed).toBe(false);

    const ruleLt: PolicyRule = {
      id: "r-lt",
      targetProperty: "backup.rpoHours",
      operator: "less_than",
      expectedValue: 24,
    };

    expect(PolicyAstInterpreter.evaluateRule(ruleLt, { backup: { rpoHours: 4 } }).passed).toBe(true);
    expect(PolicyAstInterpreter.evaluateRule(ruleLt, { backup: { rpoHours: 24 } }).passed).toBe(false);
    expect(PolicyAstInterpreter.evaluateRule(ruleLt, { backup: { rpoHours: 48 } }).passed).toBe(false);
  });

  it("evaluates set membership (in_set, not_in_set)", () => {
    const ruleInSet: PolicyRule = {
      id: "r-inset",
      targetProperty: "region",
      operator: "in_set",
      expectedValue: ["eu-west-1", "eu-central-1", "eu-north-1"],
    };

    expect(PolicyAstInterpreter.evaluateRule(ruleInSet, { region: "eu-central-1" }).passed).toBe(true);
    expect(PolicyAstInterpreter.evaluateRule(ruleInSet, { region: "us-east-1" }).passed).toBe(false);

    const ruleNotInSet: PolicyRule = {
      id: "r-notinset",
      targetProperty: "database.engine",
      operator: "not_in_set",
      expectedValue: ["sqlite", "derby", "msaccess"],
    };

    expect(PolicyAstInterpreter.evaluateRule(ruleNotInSet, { database: { engine: "postgresql" } }).passed).toBe(true);
    expect(PolicyAstInterpreter.evaluateRule(ruleNotInSet, { database: { engine: "sqlite" } }).passed).toBe(false);
  });

  it("evaluates boolean composites: all (AND), any (OR), none (NOT ANY)", () => {
    const compositeRule: PolicyRule = {
      id: "r-comp",
      operator: "all",
      children: [
        {
          id: "c1",
          targetProperty: "isMultiAz",
          operator: "equals",
          expectedValue: true,
        },
        {
          id: "c2",
          operator: "any",
          children: [
            {
              id: "c2-1",
              targetProperty: "hasReadReplicas",
              operator: "equals",
              expectedValue: true,
            },
            {
              id: "c2-2",
              targetProperty: "isServerlessAutoscaling",
              operator: "equals",
              expectedValue: true,
            },
          ],
        },
      ],
    };

    // Both pass: multiAz=true and readReplicas=true
    expect(
      PolicyAstInterpreter.evaluateRule(compositeRule, {
        isMultiAz: true,
        hasReadReplicas: true,
        isServerlessAutoscaling: false,
      }).passed
    ).toBe(true);

    // Any passes via serverlessAutoscaling
    expect(
      PolicyAstInterpreter.evaluateRule(compositeRule, {
        isMultiAz: true,
        hasReadReplicas: false,
        isServerlessAutoscaling: true,
      }).passed
    ).toBe(true);

    // MultiAz fails
    expect(
      PolicyAstInterpreter.evaluateRule(compositeRule, {
        isMultiAz: false,
        hasReadReplicas: true,
      }).passed
    ).toBe(false);

    // Both OR children fail
    expect(
      PolicyAstInterpreter.evaluateRule(compositeRule, {
        isMultiAz: true,
        hasReadReplicas: false,
        isServerlessAutoscaling: false,
      }).passed
    ).toBe(false);
  });

  it("strictly enforces maximum recursion depth limit (bounded to 10)", () => {
    // Build a nesting chain of 15 levels
    let currentRule: PolicyRule = {
      id: "leaf",
      targetProperty: "leaf",
      operator: "equals",
      expectedValue: true,
    };

    for (let i = 14; i >= 1; i--) {
      currentRule = {
        id: `level-${i}`,
        operator: "all",
        children: [currentRule],
      };
    }

    const result = PolicyAstInterpreter.evaluateRule(currentRule, { leaf: true });
    expect(result.passed).toBe(false);
    expect(result.reason).toContain("maximum allowed AST depth of 10");
  });
});
