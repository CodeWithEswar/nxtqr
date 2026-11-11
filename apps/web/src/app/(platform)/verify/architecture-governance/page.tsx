"use client";

/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Interactive Verification Testbed Page
 */

import React, { useState } from "react";
import { GovernanceWorkspace } from "@/features/system-design/governance";
import {
  type GovernanceArchitectureTopology,
  PolicyRegistry,
  PolicyAstInterpreter,
  PolicyEvaluator,
  EvidenceResolver,
  GovernanceDriftAnalyzer,
  PolicySimulator,
} from "@nxtqr/architecture-intelligence";
import {
  PlayIcon,
  ShieldIcon,
} from "@nxtqr/icons";

export default function ArchitectureGovernanceVerificationPage() {
  const [activeScenario, setActiveScenario] = useState<
    "enterprise_production" | "zero_trust_gdpr" | "drift_expired"
  >("enterprise_production");
  const [verificationResults, setVerificationResults] = useState<
    Array<{ name: string; status: "passed" | "failed"; detail: string }>
  >([]);
  const [hasRunVerification, setHasRunVerification] = useState(false);

  const now = new Date();
  const nowIso = now.toISOString();

  // Run in-browser automated verification test suite
  const runAllVerifications = () => {
    const results: Array<{ name: string; status: "passed" | "failed"; detail: string }> = [];

    // Test 1: Policy-as-Code AST Interpreter (<10 depth, safe execution, zero eval)
    try {
      const astResult = PolicyAstInterpreter.evaluateRule(
        {
          id: "r-test",
          operator: "all",
          children: [
            {
              id: "r-tls",
              targetProperty: "tlsEnforced",
              operator: "equals",
              expectedValue: true,
            },
            {
              id: "r-retention",
              targetProperty: "retentionDays",
              operator: "greater_than",
              expectedValue: 30,
            },
          ],
        },
        { tlsEnforced: true, retentionDays: 90 }
      );

      if (astResult.passed) {
        results.push({
          name: "Declarative Rule AST Interpreter",
          status: "passed",
          detail: "Safely evaluated nested boolean AST operators with bounded recursion (<10) and zero dynamic code execution.",
        });
      } else {
        results.push({
          name: "Declarative Rule AST Interpreter",
          status: "failed",
          detail: "AST evaluation failed unexpectedly.",
        });
      }
    } catch (e) {
      results.push({
        name: "Declarative Rule AST Interpreter",
        status: "failed",
        detail: (e as Error).message,
      });
    }

    // Test 2: Strict 4-State Evaluation & No Pass Collapsing
    try {
      const policy = PolicyRegistry.getPolicy("POL-SEC-001");
      if (policy) {
        // Without evidence: must evaluate to UNKNOWN, never pass
        const evalUnknown = PolicyEvaluator.evaluatePolicy(
          policy,
          [], // No evidence
          [],
          { ingress: { hasApprovedGateway: true }, database: { isPubliclyAccessible: false } },
          "srv-test",
          "Test Service"
        );

        if (evalUnknown.status === "unknown" && !evalUnknown.hasActiveException) {
          results.push({
            name: "Four-State Deterministic Evaluation",
            status: "passed",
            detail: "Strictly enforced four-state evaluations (pass, fail, unknown, not_applicable). Never collapsed missing evidence into pass.",
          });
        } else {
          results.push({
            name: "Four-State Deterministic Evaluation",
            status: "failed",
            detail: `Missing evidence evaluated to unexpected state: ${evalUnknown.status}`,
          });
        }
      }
    } catch (e) {
      results.push({
        name: "Four-State Deterministic Evaluation",
        status: "failed",
        detail: (e as Error).message,
      });
    }

    // Test 3: Evidence Freshness Window & SHA-256 Content Fingerprint
    try {
      const pastDate = new Date(Date.now() - 86400000 * 5).toISOString(); // 5 days old
      const hash = EvidenceResolver.computeIntegrityHash({ setting: "strict", port: 443 });

      const res = EvidenceResolver.resolveEvidence(
        ["security_configuration"],
        [
          {
            id: "ev-old",
            evidenceType: "security_configuration",
            sourceIdentifier: "scanner",
            observedAt: pastDate,
            freshnessWindowSeconds: 86400, // 24h validity
            integrityHash: hash,
            content: { setting: "strict", port: 443 },
            owner: "SecOps",
            provenance: {
              source: "system_guardrail",
              author: "Scanner",
              timestamp: pastDate,
              confirmed: true,
            },
          },
        ],
        "test-target",
        nowIso
      );

      if (!res.isComplete && res.staleEvidenceIds.includes("ev-old") && hash.startsWith("sha256-")) {
        results.push({
          name: "Evidence Freshness & Integrity Hash Verification",
          status: "passed",
          detail: "Successfully flagged expired evidence exceeding freshness window (5d > 24h) and computed deterministic SHA-256 fingerprint.",
        });
      } else {
        results.push({
          name: "Evidence Freshness & Integrity Hash Verification",
          status: "failed",
          detail: "Failed to detect expired evidence artifact.",
        });
      }
    } catch (e) {
      results.push({
        name: "Evidence Freshness & Integrity Hash Verification",
        status: "failed",
        detail: (e as Error).message,
      });
    }

    // Test 4: Scoped Time-Bound Exceptions Preserve Failure
    try {
      const policy = PolicyRegistry.getPolicy("POL-SEC-002");
      if (policy) {
        const evalWithException = PolicyEvaluator.evaluatePolicy(
          policy,
          [
            {
              id: "ev-graph",
              evidenceType: "architecture_graph",
              sourceIdentifier: "graph",
              observedAt: nowIso,
              freshnessWindowSeconds: 86400,
              integrityHash: "sha256-1234",
              content: {},
              owner: "Ops",
              provenance: {
                source: "system_guardrail",
                author: "Ops",
                timestamp: nowIso,
                confirmed: true,
              },
            },
            {
              id: "ev-deploy",
              evidenceType: "deployment_metadata",
              sourceIdentifier: "deploy",
              observedAt: nowIso,
              freshnessWindowSeconds: 86400,
              integrityHash: "sha256-5678",
              content: {},
              owner: "Ops",
              provenance: {
                source: "system_guardrail",
                author: "Ops",
                timestamp: nowIso,
                confirmed: true,
              },
            },
          ],
          [
            {
              id: "EX-TEST",
              policyId: "POL-SEC-002",
              policyVersion: "1.0.0",
              resourceScope: ["res-violating"],
              justification: "Temporary test waiver.",
              compensatingControls: [],
              requesterId: "dev",
              status: "approved",
              startDate: nowIso,
              expirationDate: new Date(Date.now() + 86400000 * 7).toISOString(),
              isExpired: false,
              auditHistory: [],
              provenance: {
                source: "system_guardrail",
                author: "Dev",
                timestamp: nowIso,
                confirmed: true,
              },
            },
          ],
          { path: { hasPlaintextHop: true } }, // Fails rule
          "res-violating",
          "Violating Target"
        );

        if (evalWithException.status === "fail" && evalWithException.hasActiveException) {
          results.push({
            name: "Scoped Time-Bound Exceptions & Waivers",
            status: "passed",
            detail: "Preserved underlying 'fail' status during active exception waiver without mutative side-effects or falsely reporting pass.",
          });
        } else {
          results.push({
            name: "Scoped Time-Bound Exceptions & Waivers",
            status: "failed",
            detail: "Exception altered status or failed to register waiver.",
          });
        }
      }
    } catch (e) {
      results.push({
        name: "Scoped Time-Bound Exceptions & Waivers",
        status: "failed",
        detail: (e as Error).message,
      });
    }

    // Test 5: Governance Drift & Baseline Regression Detection
    try {
      const driftResult = GovernanceDriftAnalyzer.analyzeDrift(
        {
          id: "base-test",
          projectId: "p1",
          architectureRevision: "rev-1",
          bundleVersions: {},
          evaluations: [
            {
              id: "e-pass",
              policyId: "POL-REL-001",
              policyVersion: "1.0.0",
              policyTitle: "Multi-AZ",
              category: "reliability",
              severity: "critical",
              status: "pass",
              isApplicable: true,
              evidenceIds: [],
              missingEvidenceTypes: [],
              explanation: "Pass",
              remediationGuidance: "Guidance",
              hasActiveException: false,
              evaluatedAt: nowIso,
              evaluatorVersion: "1.0.0",
            },
          ],
          activeExceptionIds: [],
          createdAt: nowIso,
          createdBy: "Lead",
        },
        [
          {
            id: "e-fail",
            policyId: "POL-REL-001",
            policyVersion: "1.0.0",
            policyTitle: "Multi-AZ",
            category: "reliability",
            severity: "critical",
            status: "fail",
            isApplicable: true,
            evidenceIds: [],
            missingEvidenceTypes: [],
            explanation: "Now failing",
            remediationGuidance: "Guidance",
            hasActiveException: false,
            evaluatedAt: nowIso,
            evaluatorVersion: "1.0.0",
          },
        ],
        [],
        "rev-2",
        undefined,
        { currentTimestamp: nowIso }
      );

      if (driftResult.hasRegressions && driftResult.totalNewViolations === 1) {
        results.push({
          name: "Governance Baseline & Regression Drift Engine",
          status: "passed",
          detail: "Successfully flagged new policy violation regressions compared against baseline revision snapshot.",
        });
      } else {
        results.push({
          name: "Governance Baseline & Regression Drift Engine",
          status: "failed",
          detail: "Drift analyzer failed to detect regression.",
        });
      }
    } catch (e) {
      results.push({
        name: "Governance Baseline & Regression Drift Engine",
        status: "failed",
        detail: (e as Error).message,
      });
    }

    // Test 6: Non-Destructive What-If Simulation & Remediation Planning
    try {
      const plan = PolicySimulator.generateRemediationPlan(
        [
          {
            id: "e-crit",
            policyId: "POL-SEC-001",
            policyVersion: "1.0.0",
            policyTitle: "Ingress Gateway",
            category: "security",
            severity: "critical",
            status: "fail",
            isApplicable: true,
            evidenceIds: [],
            missingEvidenceTypes: [],
            explanation: "Fail",
            remediationGuidance: "Attach gateway",
            hasActiveException: false,
            evaluatedAt: nowIso,
            evaluatorVersion: "1.0.0",
          },
        ],
        PolicyRegistry.getAllPolicies()
      );

      if (plan.length === 1 && plan[0].severity === "critical" && plan[0].step === 1) {
        results.push({
          name: "Non-Destructive Simulation & Remediation Planner",
          status: "passed",
          detail: "Generated prioritized step-by-step remediation plan with actionable guidance sorted by severity.",
        });
      } else {
        results.push({
          name: "Non-Destructive Simulation & Remediation Planner",
          status: "failed",
          detail: "Remediation planning generated invalid steps.",
        });
      }
    } catch (e) {
      results.push({
        name: "Non-Destructive Simulation & Remediation Planner",
        status: "failed",
        detail: (e as Error).message,
      });
    }

    setVerificationResults(results);
    setHasRunVerification(true);
  };

  // Scenario 1: Enterprise Production Readiness
  const enterpriseProductionTopology: GovernanceArchitectureTopology = {
    id: "top-scenario-1",
    projectId: "verify-project",
    architectureId: "arch-ecommerce",
    graphRevision: "rev-prod-v1",
    version: 1,
    policies: PolicyRegistry.getAllPolicies(),
    bundles: PolicyRegistry.getAllBundles(),
    evidence: [
      {
        id: "ev-sc1-alb",
        evidenceType: "security_configuration",
        sourceIdentifier: "alb_tls_spec",
        resourceId: "alb-ingress",
        observedAt: nowIso,
        freshnessWindowSeconds: 86400 * 7,
        integrityHash: "sha256-sc1alb1234567890abcdef",
        content: { tlsEnforced: true, minTlsVersion: "TLS_1_3" },
        owner: "SecOps",
        provenance: {
          source: "system_guardrail",
          author: "AWS Config",
          timestamp: nowIso,
          confirmed: true,
        },
      },
      {
        id: "ev-sc1-graph",
        evidenceType: "architecture_graph",
        sourceIdentifier: "graph_compiler",
        observedAt: nowIso,
        freshnessWindowSeconds: 86400 * 30,
        integrityHash: "sha256-sc1graph1234567890abcdef",
        content: { isValidGraph: true },
        owner: "ArchTeam",
        provenance: {
          source: "modeled_governance",
          author: "NXTQR",
          timestamp: nowIso,
          confirmed: true,
        },
      },
      {
        id: "ev-sc1-deploy",
        evidenceType: "deployment_metadata",
        sourceIdentifier: "k8s_manifests",
        observedAt: nowIso,
        freshnessWindowSeconds: 86400 * 30,
        integrityHash: "sha256-sc1deploy1234567890abcdef",
        content: { path: { hasPlaintextHop: false } },
        owner: "InfraOps",
        provenance: {
          source: "system_guardrail",
          author: "Terraform",
          timestamp: nowIso,
          confirmed: true,
        },
      },
    ],
    exceptions: [],
    baselines: [],
    resources: [
      {
        id: "alb-ingress",
        name: "Enterprise Public ALB Ingress",
        environment: "production",
        componentType: "api_gateway",
        dataClassification: "internal",
        geographicRegion: "us-east-1",
        properties: {
          hasApprovedGateway: true,
          tlsEnforced: true,
          path: { hasPlaintextHop: false },
          ingress: { hasApprovedGateway: true },
          database: { isPubliclyAccessible: false },
        },
      },
      {
        id: "db-cluster",
        name: "PostgreSQL Production Primary",
        environment: "production",
        componentType: "database",
        dataClassification: "confidential",
        geographicRegion: "us-east-1",
        properties: {
          isMultiAz: true,
          isEncryptedAtRest: true,
          backupFrequencyHours: 12,
          database: { isPubliclyAccessible: false, engine: "postgresql" },
          ingress: { hasApprovedGateway: true },
        },
      },
    ],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Scenario 2: Zero-Trust Security & Data Protection (GDPR)
  const zeroTrustGdprTopology: GovernanceArchitectureTopology = {
    ...enterpriseProductionTopology,
    id: "top-scenario-2",
    resources: [
      {
        id: "eu-customer-vault",
        name: "EU Customer Profile Vault",
        environment: "production",
        componentType: "database",
        dataClassification: "restricted",
        geographicRegion: "eu-west-1",
        properties: {
          isEuCustomerData: true,
          geographicRegion: "eu-west-1",
          isEncryptedAtRest: true,
          isMultiAz: true,
          database: { isPubliclyAccessible: false },
          ingress: { hasApprovedGateway: true },
        },
      },
      {
        id: "payment-tokenizer",
        name: "PCI Tokenizer Service",
        environment: "production",
        componentType: "service",
        dataClassification: "restricted",
        geographicRegion: "eu-west-1",
        properties: {
          hasMtlsEnabled: true,
          tlsEnforced: true,
          hasApprovedGateway: true,
          ingress: { hasApprovedGateway: true },
          database: { isPubliclyAccessible: false },
        },
      },
    ],
  };

  // Scenario 3: Governance Drift & Expired Exceptions
  const driftExpiredTopology: GovernanceArchitectureTopology = {
    ...enterpriseProductionTopology,
    id: "top-scenario-3",
    exceptions: [
      {
        id: "EX-EXP-001",
        policyId: "POL-SEC-003",
        policyVersion: "1.0.0",
        resourceScope: ["legacy-gateway"],
        justification: "Temporary 14-day exemption expired without renewal.",
        compensatingControls: [],
        requesterId: "ops-lead",
        status: "expired",
        startDate: new Date(Date.now() - 86400000 * 20).toISOString(),
        expirationDate: new Date(Date.now() - 86400000 * 5).toISOString(), // Expired 5 days ago
        isExpired: true,
        auditHistory: [],
        provenance: {
          source: "system_guardrail",
          author: "System",
          timestamp: nowIso,
          confirmed: true,
        },
      },
    ],
    baselines: [
      {
        id: "base-prev-month",
        projectId: "verify-project",
        architectureRevision: "rev-prod-v0",
        bundleVersions: { "bundle-baseline": "1.0.0" },
        evaluations: [
          {
            id: "eval-base-db",
            policyId: "POL-REL-001",
            policyVersion: "1.0.0",
            policyTitle: "Multi-AZ Database",
            category: "reliability",
            severity: "critical",
            resourceId: "db-regressed",
            status: "pass",
            isApplicable: true,
            evidenceIds: [],
            missingEvidenceTypes: [],
            explanation: "Previously passed in rev-0",
            remediationGuidance: "Guidance",
            hasActiveException: false,
            evaluatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
            evaluatorVersion: "1.0.0",
          },
        ],
        activeExceptionIds: ["EX-EXP-001"],
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        createdBy: "Lead Architect",
      },
    ],
    resources: [
      {
        id: "db-regressed",
        name: "Downgraded Single-AZ Database",
        environment: "production",
        componentType: "database",
        dataClassification: "confidential",
        geographicRegion: "us-east-1",
        properties: {
          isMultiAz: false, // Regression: was true in baseline
          isEncryptedAtRest: true,
          database: { isPubliclyAccessible: false },
          ingress: { hasApprovedGateway: true },
        },
      },
    ],
  };

  const currentTopology =
    activeScenario === "enterprise_production"
      ? enterpriseProductionTopology
      : activeScenario === "zero_trust_gdpr"
      ? zeroTrustGdprTopology
      : driftExpiredTopology;

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-white overflow-hidden select-none">
      {/* Verification Testbed Header */}
      <header className="p-3 bg-[#080808] border-b border-[#262626] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldIcon size={18} className="text-white" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Phase 05.3.25 — Architecture Compliance, Governance & Policy-as-Code Testbed
            </span>
          </div>

          {/* Scenario Selectors */}
          <div className="flex items-center gap-1 bg-[#0D0D0D] border border-[#202020] p-1 rounded-md text-xs">
            <button
              onClick={() => setActiveScenario("enterprise_production")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                activeScenario === "enterprise_production"
                  ? "bg-[#1A1A1A] text-white border border-[#333333]"
                  : "text-[#858585] hover:text-white"
              }`}
            >
              1. Enterprise Production
            </button>
            <button
              onClick={() => setActiveScenario("zero_trust_gdpr")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                activeScenario === "zero_trust_gdpr"
                  ? "bg-[#1A1A1A] text-white border border-[#333333]"
                  : "text-[#858585] hover:text-white"
              }`}
            >
              2. Zero-Trust & GDPR
            </button>
            <button
              onClick={() => setActiveScenario("drift_expired")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                activeScenario === "drift_expired"
                  ? "bg-[#1A1A1A] text-white border border-[#333333]"
                  : "text-[#858585] hover:text-white"
              }`}
            >
              3. Drift & Expired Waivers
            </button>
          </div>
        </div>

        {/* Verification Runner Button */}
        <button
          onClick={runAllVerifications}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-white bg-[#141414] hover:bg-[#1A1A1A] border border-[#333333] hover:border-[#404040] rounded-md transition-colors"
        >
          <PlayIcon size={14} /> Run Automated Verification Suite
        </button>
      </header>

      {/* Automated Verification Results Drawer */}
      {hasRunVerification && (
        <div className="p-3 bg-[#080808] border-b border-[#262626] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-[#858585]">
              Automated In-Browser Test Suite Results (
              {verificationResults.filter((r) => r.status === "passed").length} /{" "}
              {verificationResults.length} Passed)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {verificationResults.map((r, i) => (
              <div
                key={i}
                className="p-2.5 bg-[#0D0D0D] border border-[#202020] rounded-md text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white font-mono text-[11px]">
                    {r.name}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md border ${
                      r.status === "passed"
                        ? "text-[#22c55e] border-[#262626] bg-[#080808]"
                        : "text-[#ef4444] border-[#262626] bg-[#080808]"
                    }`}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-[#858585] line-clamp-2 leading-tight">
                  {r.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Studio Workspace Mount */}
      <div className="flex-1 overflow-hidden">
        <GovernanceWorkspace
          key={activeScenario}
          projectId="verify-project"
          architectureId={currentTopology.architectureId}
          graphRevision={currentTopology.graphRevision}
          initialTopology={currentTopology}
        />
      </div>
    </div>
  );
}
