"use client";

import * as React from "react";
import Link from "next/link";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  SnapshotResolver,
  type ArchitectureSnapshot,
} from "@nxtqr/architecture-intelligence";
import { ComparisonWorkspace } from "@/features/system-design/comparison";
import { CopyIcon, CheckIcon } from "@nxtqr/icons";
import { Button, Badge } from "@nxtqr/ui";

interface TopologyScenario {
  name: string;
  description: string;
  baselineNodes: BaseNode[];
  baselineEdges: BaseEdge[];
  candidateNodes: BaseNode[];
  candidateEdges: BaseEdge[];
}

const PRESET_SCENARIOS: Record<string, TopologyScenario> = {
  scaling_cache: {
    name: "Scaling with Lookaside Cache",
    description: "Evaluates horizontal scaling and addition of Redis cache to relieve read pressure on the primary database.",
    baselineNodes: [
      {
        id: "api_gateway",
        type: "infrastructure",
        position: { x: 50, y: 100 },
        label: "Public API Gateway",
        data: { componentType: "api-gateway", authPolicy: "oauth2-jwt", rateLimitRps: 1000 },
      },
      {
        id: "core_api",
        type: "infrastructure",
        position: { x: 250, y: 100 },
        label: "Core Compute Service",
        data: { componentType: "compute-instance", instanceCount: 2, timeoutMs: 5000 },
      },
      {
        id: "orders_db",
        type: "infrastructure",
        position: { x: 500, y: 100 },
        label: "PostgreSQL Database",
        data: { componentType: "relational-database", multiAz: true, readReplicas: 0 },
      },
    ],
    baselineEdges: [
      { id: "e1", source: "api_gateway", target: "core_api", data: { protocol: "https", isSynchronous: true } },
      { id: "e2", source: "core_api", target: "orders_db", data: { protocol: "tcp", isSynchronous: true } },
    ],
    candidateNodes: [
      {
        id: "api_gateway",
        type: "infrastructure",
        position: { x: 50, y: 100 },
        label: "Public API Gateway",
        data: { componentType: "api-gateway", authPolicy: "oauth2-jwt", rateLimitRps: 1500 },
      },
      {
        id: "core_api",
        type: "infrastructure",
        position: { x: 250, y: 100 },
        label: "Core Compute Service",
        data: { componentType: "compute-instance", instanceCount: 4, timeoutMs: 3000 },
      },
      {
        id: "redis_cache",
        type: "infrastructure",
        position: { x: 380, y: 40 },
        label: "Redis Cache Layer",
        data: { componentType: "in-memory-cache", memoryMb: 8192, ttlSeconds: 300 },
      },
      {
        id: "orders_db",
        type: "infrastructure",
        position: { x: 500, y: 100 },
        label: "PostgreSQL Database",
        data: { componentType: "relational-database", multiAz: true, readReplicas: 2 },
      },
    ],
    candidateEdges: [
      { id: "e1", source: "api_gateway", target: "core_api", data: { protocol: "https", isSynchronous: true } },
      { id: "e_cache", source: "core_api", target: "redis_cache", data: { protocol: "tcp", isSynchronous: true } },
      { id: "e2", source: "core_api", target: "orders_db", data: { protocol: "tcp", isSynchronous: true } },
    ],
  },
  security_regression: {
    name: "Security Regression (Direct Public Exposure)",
    description: "Detects regression when a database is directly exposed to the internet and auth policy is relaxed to anonymous.",
    baselineNodes: [
      {
        id: "api_gw",
        type: "infrastructure",
        position: { x: 100, y: 100 },
        label: "Secure Gateway",
        data: { componentType: "api-gateway", authPolicy: "oauth2-jwt" },
      },
      {
        id: "customer_db",
        type: "infrastructure",
        position: { x: 400, y: 100 },
        label: "Customer Records Database",
        data: { componentType: "relational-database", publiclyAccessible: false },
      },
    ],
    baselineEdges: [
      { id: "e_gw_db", source: "api_gw", target: "customer_db", data: { protocol: "tcp" } },
    ],
    candidateNodes: [
      {
        id: "api_gw",
        type: "infrastructure",
        position: { x: 100, y: 100 },
        label: "Secure Gateway",
        data: { componentType: "api-gateway", authPolicy: "anonymous" }, // Regression!
      },
      {
        id: "customer_db",
        type: "infrastructure",
        position: { x: 400, y: 100 },
        label: "Customer Records Database",
        data: { componentType: "relational-database", publiclyAccessible: true }, // Regression!
      },
    ],
    candidateEdges: [
      { id: "e_gw_db", source: "api_gw", target: "customer_db", data: { protocol: "tcp" } },
    ],
  },
  resilience_upgrade: {
    name: "Resilience Upgrade (Queue Decoupling & Retries)",
    description: "Evaluates introduction of asynchronous message buffer and bounded retries with jitter to prevent cascading collapse.",
    baselineNodes: [
      {
        id: "ingress_api",
        type: "infrastructure",
        position: { x: 100, y: 100 },
        label: "Ingress Service",
        data: { componentType: "compute-instance", retries: 0 },
      },
      {
        id: "payment_worker",
        type: "infrastructure",
        position: { x: 400, y: 100 },
        label: "Payment Processor",
        data: { componentType: "compute-instance" },
      },
    ],
    baselineEdges: [
      { id: "e_pay", source: "ingress_api", target: "payment_worker", data: { isSynchronous: true } },
    ],
    candidateNodes: [
      {
        id: "ingress_api",
        type: "infrastructure",
        position: { x: 100, y: 100 },
        label: "Ingress Service",
        data: { componentType: "compute-instance", retries: 2, backoffStrategy: "exponential-jitter" },
      },
      {
        id: "payment_queue",
        type: "infrastructure",
        position: { x: 260, y: 100 },
        label: "Payment Ingestion Queue",
        data: { componentType: "message-queue", deadLetterQueueEnabled: true },
      },
      {
        id: "payment_worker",
        type: "infrastructure",
        position: { x: 450, y: 100 },
        label: "Payment Processor",
        data: { componentType: "compute-instance" },
      },
    ],
    candidateEdges: [
      { id: "e_to_queue", source: "ingress_api", target: "payment_queue", data: { isSynchronous: false } },
      { id: "e_from_queue", source: "payment_queue", target: "payment_worker", data: { isSynchronous: false } },
    ],
  },
};

export default function ArchitectureComparisonVerifyPage() {
  const [selectedKey, setSelectedKey] = React.useState<string>("scaling_cache");
  const [copied, setCopied] = React.useState(false);

  const scenario = PRESET_SCENARIOS[selectedKey];

  const baselineSnapshot: ArchitectureSnapshot = React.useMemo(() => {
    return SnapshotResolver.createSnapshot({
      title: `${scenario.name} (Baseline)`,
      nodes: scenario.baselineNodes,
      edges: scenario.baselineEdges,
      provenance: "saved-version",
    });
  }, [scenario]);

  const candidateSnapshot: ArchitectureSnapshot = React.useMemo(() => {
    return SnapshotResolver.createSnapshot({
      title: `${scenario.name} (Candidate)`,
      nodes: scenario.candidateNodes,
      edges: scenario.candidateEdges,
      provenance: "what-if-proposal",
    });
  }, [scenario]);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(`${baselineSnapshot.revision} vs ${candidateSnapshot.revision}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black text-foreground overflow-hidden font-sans">
      {/* 1. Header Navigation Bar */}
      <div className="h-14 px-4 bg-surface-01 border-b border-border-default flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/workspace"
            className="text-xs font-mono text-text-muted hover:text-foreground flex items-center gap-1"
          >
            ← Back to Visualizer
          </Link>
          <div className="h-4 w-[1px] bg-border-subtle" />
          <h1 className="text-sm font-semibold text-foreground">
            Architecture Comparison & Change Intelligence (Phase 05.3.9)
          </h1>
          <Badge variant="outline" className="text-[10px] font-mono border-border-default">
            v1.0.0
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyHash}
            className="h-7 text-xs font-mono bg-surface-02 border-border-default"
          >
            {copied ? (
              <>
                <CheckIcon className="w-3 h-3 mr-1 text-emerald-400" />
                Hashes Copied
              </>
            ) : (
              <>
                <CopyIcon className="w-3 h-3 mr-1 text-text-muted" />
                Copy Revisions
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 2. Preset Scenario Selector */}
      <div className="h-10 px-4 bg-surface-01 border-b border-border-subtle flex items-center gap-2 overflow-x-auto shrink-0 font-mono text-xs">
        <span className="text-text-muted text-[11px] uppercase mr-1">Preset Scenarios:</span>
        {Object.entries(PRESET_SCENARIOS).map(([key, sc]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedKey(key)}
            className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
              selectedKey === key
                ? "bg-surface-03 border border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border border-border-subtle text-text-muted hover:text-foreground"
            }`}
          >
            {sc.name}
          </button>
        ))}
      </div>

      {/* 3. Main Workspace Split View */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ComparisonWorkspace
          key={selectedKey}
          initialBaseline={baselineSnapshot}
          initialCandidate={candidateSnapshot}
          className="h-full"
        />
      </div>
    </div>
  );
}
