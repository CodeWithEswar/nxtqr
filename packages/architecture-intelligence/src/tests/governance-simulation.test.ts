import { describe, it, expect } from "vitest";
import { PolicySimulator } from "../governance/analysis/policy-simulator";
import type {
  GovernancePolicy,
  PolicyEvaluation,
  PolicySimulationCandidate,
} from "../governance/contracts/governance.types";

describe("Phase 05.3.25 — What-If Policy Simulation & Remediation Planning", () => {
  const policyMultiAz: GovernancePolicy = {
    id: "POL-REL-001",
    organizationId: "org-1",
    version: "1.0.0",
    title: "Multi-AZ Deployment Required for Production Databases",
    description: "Databases must have active standby in multiple availability zones.",
    category: "reliability",
    severity: "critical",
    status: "active",
    scope: {
      level: "organization",
      organizationId: "org-1",
      environments: ["production"],
      componentTypes: ["database"],
    },
    rule: {
      id: "r-multi-az",
      targetProperty: "isMultiAz",
      operator: "equals",
      expectedValue: true,
    },
    requiredEvidenceTypes: [],
    remediationGuidance: "Enable Multi-AZ failover replica in database cluster configuration.",
    provenance: {
      source: "system_guardrail",
      author: "Test",
      timestamp: new Date().toISOString(),
      confirmed: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialEvaluation: PolicyEvaluation = {
    id: "eval-1",
    policyId: "POL-REL-001",
    policyVersion: "1.0.0",
    policyTitle: "Multi-AZ Deployment Required for Production Databases",
    category: "reliability",
    severity: "critical",
    resourceId: "prod-db-1",
    status: "fail", // Currently failing
    isApplicable: true,
    evidenceIds: [],
    missingEvidenceTypes: [],
    explanation: "isMultiAz is false",
    remediationGuidance: "Enable Multi-AZ",
    hasActiveException: false,
    evaluatedAt: new Date().toISOString(),
    evaluatorVersion: "1.0.0",
  };

  it("simulates proposed attribute modification and reports improved compliance impact", () => {
    const candidate: PolicySimulationCandidate = {
      candidateGraphDiff: {
        modifiedAttributes: {
          "prod-db-1": {
            isMultiAz: true, // Candidate fix: enabling multi-AZ
          },
        },
      },
    };

    const simResult = PolicySimulator.simulate(candidate, {
      baseEvaluations: [initialEvaluation],
      policies: [policyMultiAz],
      evidence: [],
      exceptions: [],
      resourceAttributesMap: {
        "prod-db-1": {
          id: "prod-db-1",
          name: "Main Production DB",
          environment: "production",
          componentType: "database",
          isMultiAz: false,
        },
      },
    });

    expect(simResult.netComplianceImpact).toBe("improved");
    expect(simResult.resolvedViolationsCount).toBe(1);
    expect(simResult.newViolationsCount).toBe(0);
    expect(simResult.simulatedEvaluations[0].status).toBe("pass");
  });

  it("generates prioritized step-by-step remediation plan for failing evaluations", () => {
    const evaluations: PolicyEvaluation[] = [
      {
        ...initialEvaluation,
        id: "eval-crit",
        severity: "critical",
        policyTitle: "Critical DB Multi-AZ",
      },
      {
        ...initialEvaluation,
        id: "eval-med",
        severity: "medium",
        policyTitle: "Medium Observability",
      },
      {
        ...initialEvaluation,
        id: "eval-high",
        severity: "high",
        policyTitle: "High Encryption",
      },
    ];

    const plan = PolicySimulator.generateRemediationPlan(evaluations, [policyMultiAz]);

    expect(plan.length).toBe(3);
    // Severity order: critical -> high -> medium
    expect(plan[0].severity).toBe("critical");
    expect(plan[1].severity).toBe("high");
    expect(plan[2].severity).toBe("medium");
    expect(plan[0].step).toBe(1);
    expect(plan[1].step).toBe(2);
    expect(plan[2].step).toBe(3);
  });
});

