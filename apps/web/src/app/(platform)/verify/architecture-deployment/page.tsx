"use client";

/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Interactive Verification Testbed Page
 */

import React, { useState } from "react";
import type { BaseNode } from "@nxtqr/graph-schema";
import { DeploymentWorkspace } from "@/features/system-design/deployment";
import {
  architectureDeploymentEngine,
  isValidCidr,
  doCidrsOverlap,
  isCidrContained,
  TerraformImporter,
} from "@nxtqr/architecture-intelligence";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  LayersIcon,
  ActivityIcon,
} from "@nxtqr/icons";

export default function ArchitectureDeploymentVerificationPage() {
  const [activeScenario, setActiveScenario] = useState<"multi_region" | "hybrid" | "k8s_drift">(
    "multi_region"
  );
  const [verificationResults, setVerificationResults] = useState<
    Array<{ name: string; status: "passed" | "failed"; detail: string }>
  >([]);
  const [hasRunVerification, setHasRunVerification] = useState(false);

  // Logical architecture nodes for scenarios
  const logicalNodes: BaseNode[] = [
    {
      id: "node-api-gateway",
      type: "service",
      position: { x: 0, y: 0 },
      data: { label: "API Gateway Service", type: "api_gateway" },
    },
    {
      id: "node-order-service",
      type: "service",
      position: { x: 200, y: 0 },
      data: { label: "Order Processing Service", type: "microservice" },
    },
    {
      id: "node-payment-service",
      type: "service",
      position: { x: 400, y: 0 },
      data: { label: "Payment Gateway Service", type: "microservice" },
    },
    {
      id: "node-orders-db",
      type: "database",
      position: { x: 200, y: 200 },
      data: { label: "Orders PostgreSQL", type: "database_sql" },
    },
  ];

  const runAllVerifications = () => {
    const results: Array<{ name: string; status: "passed" | "failed"; detail: string }> = [];

    // 1. CIDR bitwise arithmetic & collision tests
    try {
      const vpcCidr = "10.0.0.0/16";
      const sub1 = "10.0.1.0/24";
      const sub2 = "10.0.2.0/24";
      const overlap = "10.0.1.128/25";

      const validVpc = isValidCidr(vpcCidr);
      const isContained = isCidrContained(sub1, vpcCidr);
      const noOverlap = !doCidrsOverlap(sub1, sub2);
      const hasOverlap = doCidrsOverlap(sub1, overlap);

      if (validVpc && isContained && noOverlap && hasOverlap) {
        results.push({
          name: "IPv4 CIDR Bitwise Arithmetic & Collision Detection",
          status: "passed",
          detail: "Successfully validated containment, non-overlap, and collision conditions.",
        });
      } else {
        results.push({
          name: "IPv4 CIDR Bitwise Arithmetic & Collision Detection",
          status: "failed",
          detail: "CIDR calculations returned unexpected overlap or containment results.",
        });
      }
    } catch (e: any) {
      results.push({
        name: "IPv4 CIDR Bitwise Arithmetic & Collision Detection",
        status: "failed",
        detail: e.message,
      });
    }

    // 2. Topology validation (cycles & unshielded database)
    try {
      const sampleTopo = architectureDeploymentEngine.createDefaultTopology("p1", "a1");
      sampleTopo.resources = [
        {
          id: "db-unshielded",
          name: "Public Database",
          type: "managed_db",
          provider: "aws",
          environmentId: "env-production",
          configuration: { isPublic: true },
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
      ];

      const findings = architectureDeploymentEngine.validateTopology(sampleTopo);
      const pubFinding = findings.find((f) => f.type === "public_unshielded_database");

      if (pubFinding) {
        results.push({
          name: "Topology Security Validation & Public Database Shielding",
          status: "passed",
          detail: "Flagged critical unshielded public database correctly.",
        });
      } else {
        results.push({
          name: "Topology Security Validation & Public Database Shielding",
          status: "failed",
          detail: "Failed to detect exposed public database.",
        });
      }
    } catch (e: any) {
      results.push({
        name: "Topology Security Validation & Public Database Shielding",
        status: "failed",
        detail: e.message,
      });
    }

    // 3. Network path reachability analyzer
    try {
      const netTopo = architectureDeploymentEngine.createDefaultTopology("p1", "a1");
      netTopo.resources = [
        {
          id: "sub-1",
          name: "Subnet 1",
          type: "subnet",
          provider: "aws",
          environmentId: "env-production",
          cidr: "10.0.1.0/24",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
        {
          id: "sub-2",
          name: "Subnet 2",
          type: "subnet",
          provider: "aws",
          environmentId: "env-production",
          cidr: "10.0.2.0/24",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
        {
          id: "vm-1",
          name: "App VM",
          type: "vm",
          provider: "aws",
          environmentId: "env-production",
          parentId: "sub-1",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
        {
          id: "vm-2",
          name: "Internal DB",
          type: "managed_db",
          provider: "aws",
          environmentId: "env-production",
          parentId: "sub-1",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
        {
          id: "vm-isolated",
          name: "Isolated Host",
          type: "vm",
          provider: "aws",
          environmentId: "env-production",
          parentId: "sub-2",
          configuration: {},
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
      ];

      const intraSubnet = architectureDeploymentEngine.evaluateNetworkPath(netTopo, "vm-1", "vm-2");
      const isolated = architectureDeploymentEngine.evaluateNetworkPath(netTopo, "vm-1", "vm-isolated");

      if (intraSubnet.status === "allowed" && isolated.status === "denied") {
        results.push({
          name: "Network Path Reachability & Subnet Routing Isolation",
          status: "passed",
          detail: "Intra-subnet allowed and disconnected cross-subnet traffic denied.",
        });
      } else {
        results.push({
          name: "Network Path Reachability & Subnet Routing Isolation",
          status: "failed",
          detail: `Expected allowed/denied, got ${intraSubnet.status}/${isolated.status}`,
        });
      }
    } catch (e: any) {
      results.push({
        name: "Network Path Reachability & Subnet Routing Isolation",
        status: "failed",
        detail: e.message,
      });
    }

    // 4. Safe Terraform Plan JSON Import & Credential Masking
    try {
      const tfJson = JSON.stringify({
        resource_changes: [
          {
            address: "aws_db_instance.main",
            type: "aws_db_instance",
            name: "main",
            change: {
              actions: ["create"],
              after: {
                engine: "postgres",
                password: "unmasked_password_test",
                secret_key: "ak_live_12345",
              },
            },
          },
        ],
      });

      const parsedTf = TerraformImporter.parse(tfJson, "env-prod");
      const dbRes = parsedTf.newResources[0];

      if (
        dbRes &&
        dbRes.configuration.password === "[REDACTED]" &&
        dbRes.configuration.secret_key === "[REDACTED]" &&
        parsedTf.sensitiveFieldsRedacted >= 2
      ) {
        results.push({
          name: "Safe Terraform Plan Import & Credential Masking",
          status: "passed",
          detail: `Parsed 1 resource with ${parsedTf.sensitiveFieldsRedacted} sensitive keys safely redacted.`,
        });
      } else {
        results.push({
          name: "Safe Terraform Plan Import & Credential Masking",
          status: "failed",
          detail: "Credentials were not properly redacted.",
        });
      }
    } catch (e: any) {
      results.push({
        name: "Safe Terraform Plan Import & Credential Masking",
        status: "failed",
        detail: e.message,
      });
    }

    // 5. Architecture Drift Detection
    try {
      const planned = architectureDeploymentEngine.createDefaultTopology("p1", "a1");
      planned.resources = [
        {
          id: "pod-1",
          name: "Order Pod",
          type: "k8s_workload",
          provider: "aws",
          environmentId: "env-prod",
          configuration: { replicas: 3 },
          provenance: { source: "manually_modeled", confirmationStatus: "confirmed" },
        },
      ];

      const observed = [
        {
          id: "pod-1",
          name: "Order Pod",
          type: "k8s_workload" as const,
          provider: "aws" as const,
          environmentId: "env-prod",
          configuration: { replicas: 1 },
          provenance: { source: "imported_configuration" as const, confirmationStatus: "pending_review" as const },
        },
      ];

      const drift = architectureDeploymentEngine.detectDrift(planned, observed);
      const configDrift = drift.find((d) => d.type === "configuration_drift");

      if (configDrift && configDrift.plannedValue === 3 && configDrift.actualValue === 1) {
        results.push({
          name: "Architecture Drift Detection Engine",
          status: "passed",
          detail: "Detected replica count configuration drift (planned: 3, observed: 1).",
        });
      } else {
        results.push({
          name: "Architecture Drift Detection Engine",
          status: "failed",
          detail: "Failed to detect configuration drift.",
        });
      }
    } catch (e: any) {
      results.push({
        name: "Architecture Drift Detection Engine",
        status: "failed",
        detail: e.message,
      });
    }

    setVerificationResults(results);
    setHasRunVerification(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-[#FFFFFF] overflow-hidden">
      {/* Top Testbed Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#080808] border-b border-[#262626] shrink-0">
        <div className="flex items-center gap-3">
          <LayersIcon size={18} className="text-[#FFFFFF]" />
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
              Phase 05.3.18 Verification Testbed
            </h1>
            <p className="text-[11px] font-mono text-[#858585]">
              Architecture Deployment Topology & Infrastructure Mapping Engine
            </p>
          </div>
        </div>

        {/* Scenario Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-md bg-[#0D0D0D] border border-[#202020]">
          {(
            [
              { id: "multi_region", label: "Scenario 1: Multi-Region Active-Active" },
              { id: "hybrid", label: "Scenario 2: Hybrid Cloud Interconnect" },
              { id: "k8s_drift", label: "Scenario 3: K8s Drift Detection" },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScenario(s.id)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
                activeScenario === s.id
                  ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF]"
                  : "bg-transparent border-transparent text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Automated Test Runner Action */}
        <button
          onClick={runAllVerifications}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFFFFF] border border-[#FFFFFF] text-xs font-mono font-semibold text-[#000000] hover:bg-[#E5E5E5] transition-colors"
        >
          <ActivityIcon size={13} />
          <span>Run 5 Verification Checks</span>
        </button>
      </div>

      {/* Verification Results Bar (if executed) */}
      {hasRunVerification && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#0D0D0D] border-b border-[#202020] overflow-x-auto shrink-0">
          <span className="text-[11px] font-mono font-bold text-[#FFFFFF] shrink-0">
            AUDIT OUTCOMES:
          </span>
          {verificationResults.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border shrink-0 ${
                r.status === "passed"
                  ? "bg-[#141414] border-[#333333] text-[#FFFFFF]"
                  : "bg-[#141414] border-[#551A1A] text-[#FF8080]"
              }`}
            >
              {r.status === "passed" ? (
                <CheckCircleIcon size={13} className="text-[#FFFFFF]" />
              ) : (
                <AlertCircleIcon size={13} className="text-[#FF8080]" />
              )}
              <span>{r.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Studio Workspace */}
      <div className="flex-1 min-h-0">
        <DeploymentWorkspace
          projectId="verify-deployment-project"
          architectureId={`arch-${activeScenario}`}
          logicalNodes={logicalNodes}
        />
      </div>
    </div>
  );
}

