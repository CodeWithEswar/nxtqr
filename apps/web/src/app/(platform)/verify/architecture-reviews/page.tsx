"use client";

import * as React from "react";
import Link from "next/link";
import type { ArchitectureReview } from "@nxtqr/architecture-intelligence";
import { ReviewWorkspace } from "@/features/system-design/reviews";
import { Badge } from "@nxtqr/ui";

const MOCK_SCENARIOS: Record<string, ArchitectureReview> = {
  redis_caching: {
    id: "rev-scenario-redis",
    projectId: "proj-ecommerce",
    architectureId: "arch-ecommerce-v1",
    authorId: "user-dev-alex",
    authorName: "Alex Rivera (Backend Lead)",
    title: "Introduce Redis Cache & Multi-AZ Read Replicas",
    description: "Mitigate P99 latency bottlenecks on product catalog and read traffic by introducing a Redis Cluster with LRU eviction and 2 PostgreSQL read replicas.",
    baselineSnapshot: {
      id: "snap-baseline-1",
      revision: "rev-2026.11.01",
      title: "Production Architecture Baseline",
      schemaVersion: 1,
      createdAt: "2026-11-01T10:00:00Z",
      provenance: "saved-version",
      nodes: [
        {
          id: "api_gateway",
          type: "api_gateway",
          position: { x: 50, y: 150 },
          data: { label: "Kong API Gateway", componentType: "api_gateway", rateLimitRps: 5000 },
        },
        {
          id: "checkout_svc",
          type: "service",
          position: { x: 300, y: 150 },
          data: { label: "Checkout & Catalog Service", componentType: "service", instanceCount: 4 },
        },
        {
          id: "postgres_primary",
          type: "database",
          position: { x: 580, y: 150 },
          data: { label: "PostgreSQL Primary", componentType: "database", readReplicas: 0 },
        },
      ],
      edges: [
        { id: "e1", source: "api_gateway", target: "checkout_svc", data: { protocol: "HTTPS" } },
        { id: "e2", source: "checkout_svc", target: "postgres_primary", data: { protocol: "PostgreSQL" } },
      ],
    },
    currentRevisionNumber: 1,
    revisions: [
      {
        id: "rev-item-1",
        reviewId: "rev-scenario-redis",
        revisionNumber: 1,
        contentHash: "hash-rev-redis-001",
        changeSummary: "Added Redis Cluster (3 nodes) and configured 2 read replicas on PostgreSQL Primary.",
        createdAt: "2026-11-10T14:30:00Z",
        authorId: "user-dev-alex",
        candidateSnapshot: {
          id: "snap-candidate-1",
          revision: "rev-candidate-v1",
          title: "Proposed Redis & Replicas Architecture",
          schemaVersion: 1,
          createdAt: "2026-11-10T14:30:00Z",
          provenance: "what-if-proposal",
          nodes: [
            {
              id: "api_gateway",
              type: "api_gateway",
              position: { x: 50, y: 150 },
              data: { label: "Kong API Gateway", componentType: "api_gateway", rateLimitRps: 5000 },
            },
            {
              id: "checkout_svc",
              type: "service",
              position: { x: 300, y: 150 },
              data: { label: "Checkout & Catalog Service", componentType: "service", instanceCount: 6 },
            },
            {
              id: "redis_cluster",
              type: "cache",
              position: { x: 580, y: 60 },
              data: { label: "ElastiCache Redis Cluster", componentType: "cache", instanceCount: 3 },
            },
            {
              id: "postgres_primary",
              type: "database",
              position: { x: 580, y: 220 },
              data: { label: "PostgreSQL Primary", componentType: "database", readReplicas: 2 },
            },
          ],
          edges: [
            { id: "e1", source: "api_gateway", target: "checkout_svc", data: { protocol: "HTTPS" } },
            { id: "e2", source: "checkout_svc", target: "postgres_primary", data: { protocol: "PostgreSQL" } },
            { id: "e3", source: "checkout_svc", target: "redis_cluster", data: { protocol: "Redis" } },
          ],
        },
      },
    ],
    status: "open",
    assignedReviewers: [
      {
        reviewerId: "user-reviewer",
        name: "Sarah Lead Architect",
        role: "lead_architect",
        assignedAt: "2026-11-10T14:35:00Z",
      },
      {
        reviewerId: "user-security-marcus",
        name: "Marcus SecOps",
        role: "security_reviewer",
        assignedAt: "2026-11-10T14:35:00Z",
      },
    ],
    decisions: [],
    threads: [
      {
        id: "th-redis-1",
        reviewId: "rev-scenario-redis",
        revisionNumber: 1,
        anchor: { type: "node", nodeId: "redis_cluster", nodeLabel: "ElastiCache Redis Cluster" },
        rootComment: {
          id: "c-1",
          threadId: "th-redis-1",
          reviewId: "rev-scenario-redis",
          revisionNumber: 1,
          authorId: "user-reviewer",
          authorName: "Sarah Lead Architect",
          content: "What TTL and eviction strategy are we configuring for the Redis cluster? Should we use volatile-lru to prevent cache stampedes?",
          createdAt: "2026-11-10T15:00:00Z",
          updatedAt: "2026-11-10T15:00:00Z",
        },
        replies: [
          {
            id: "c-2",
            threadId: "th-redis-1",
            reviewId: "rev-scenario-redis",
            revisionNumber: 1,
            authorId: "user-dev-alex",
            authorName: "Alex Rivera (Backend Lead)",
            content: "We configured volatile-lru with a 15-minute TTL on catalog keys and probabilistic early expiration to avoid stampedes.",
            createdAt: "2026-11-10T15:15:00Z",
            updatedAt: "2026-11-10T15:15:00Z",
          },
        ],
        status: "open",
        isBlocking: false,
        createdAt: "2026-11-10T15:00:00Z",
        updatedAt: "2026-11-10T15:15:00Z",
      },
    ],
    checks: [
      {
        id: "chk-val-1",
        ruleId: "chk-val",
        name: "Structural Graph Validation",
        category: "validation",
        status: "passed",
        severity: "info",
        message: "No orphaned nodes or circular dependency cycles found.",
        executedAt: "2026-11-10T14:31:00Z",
      },
      {
        id: "chk-health-1",
        ruleId: "chk-health",
        name: "6-Pillar Architecture Health",
        category: "health",
        status: "passed",
        severity: "info",
        message: "Health score improved from 72/100 to 86/100 (Grade B+).",
        executedAt: "2026-11-10T14:31:00Z",
      },
      {
        id: "chk-spof-1",
        ruleId: "chk-spof",
        name: "Single Points of Failure",
        category: "spof",
        status: "passed",
        severity: "low",
        message: "Read replicas eliminate single-point read failure.",
        executedAt: "2026-11-10T14:31:00Z",
      },
      {
        id: "chk-sec-1",
        ruleId: "chk-sec",
        name: "Security Architecture Check",
        category: "security",
        status: "passed",
        severity: "info",
        message: "Redis TLS enabled; no unencrypted VPC boundaries detected.",
        executedAt: "2026-11-10T14:31:00Z",
      },
    ],
    policy: {
      minApprovals: 1,
      requiredReviewerRoles: ["lead_architect"],
      requireAllChecksPassed: true,
      requireResolvedThreads: false,
      allowSelfApproval: false,
      invalidateApprovalsOnRevision: true,
    },
    auditTrail: [
      {
        id: "ev-1",
        reviewId: "rev-scenario-redis",
        revisionNumber: 1,
        action: "review.created",
        actorId: "user-dev-alex",
        actorName: "Alex Rivera",
        timestamp: "2026-11-10T14:30:00Z",
      },
    ],
    relatedAdrIds: ["ADR-004-REDIS-CACHING"],
    createdAt: "2026-11-10T14:30:00Z",
    updatedAt: "2026-11-10T15:15:00Z",
  },

  db_sharding_changes_requested: {
    id: "rev-scenario-sharding",
    projectId: "proj-fintech",
    architectureId: "arch-ledger-v1",
    authorId: "user-dev-ken",
    authorName: "Kenji Sato (Data Engineer)",
    title: "Split Relational Store into Dual Database Shards",
    description: "Attempting to horizontally scale transactional storage by routing half of user IDs to Shard A and the other half to Shard B.",
    baselineSnapshot: {
      id: "snap-baseline-shard",
      revision: "rev-2026.10.15",
      title: "Fintech Core v1 Baseline",
      schemaVersion: 1,
      createdAt: "2026-10-15T10:00:00Z",
      provenance: "saved-version",
      nodes: [
        {
          id: "ledger_gateway",
          type: "api_gateway",
          position: { x: 50, y: 150 },
          data: { label: "Ledger Gateway", componentType: "api_gateway" },
        },
        {
          id: "ledger_service",
          type: "service",
          position: { x: 300, y: 150 },
          data: { label: "Ledger Core Service", componentType: "service", instanceCount: 4 },
        },
        {
          id: "sql_primary",
          type: "database",
          position: { x: 580, y: 150 },
          data: { label: "Primary SQL DB", componentType: "database" },
        },
      ],
      edges: [
        { id: "e10", source: "ledger_gateway", target: "ledger_service", data: { protocol: "HTTPS" } },
        { id: "e11", source: "ledger_service", target: "sql_primary", data: { protocol: "PostgreSQL" } },
      ],
    },
    currentRevisionNumber: 1,
    revisions: [
      {
        id: "rev-item-shard-1",
        reviewId: "rev-scenario-sharding",
        revisionNumber: 1,
        contentHash: "hash-shard-001",
        changeSummary: "Replaced Primary SQL DB with two separate database instances without a routing proxy.",
        createdAt: "2026-11-09T10:00:00Z",
        authorId: "user-dev-ken",
        candidateSnapshot: {
          id: "snap-candidate-shard",
          revision: "rev-candidate-shard-v1",
          title: "Proposed Dual Sharding Architecture",
          schemaVersion: 1,
          createdAt: "2026-11-09T10:00:00Z",
          provenance: "what-if-proposal",
          nodes: [
            {
              id: "ledger_gateway",
              type: "api_gateway",
              position: { x: 50, y: 150 },
              data: { label: "Ledger Gateway", componentType: "api_gateway" },
            },
            {
              id: "ledger_service",
              type: "service",
              position: { x: 300, y: 150 },
              data: { label: "Ledger Core Service", componentType: "service", instanceCount: 4 },
            },
            {
              id: "sql_shard_a",
              type: "database",
              position: { x: 580, y: 80 },
              data: { label: "SQL Shard A (Users 0-499K)", componentType: "database", readReplicas: 0 },
            },
            {
              id: "sql_shard_b",
              type: "database",
              position: { x: 580, y: 220 },
              data: { label: "SQL Shard B (Users 500K+)", componentType: "database", readReplicas: 0 },
            },
          ],
          edges: [
            { id: "e10", source: "ledger_gateway", target: "ledger_service", data: { protocol: "HTTPS" } },
            { id: "e12", source: "ledger_service", target: "sql_shard_a", data: { protocol: "PostgreSQL" } },
            { id: "e13", source: "ledger_service", target: "sql_shard_b", data: { protocol: "PostgreSQL" } },
          ],
        },
      },
    ],
    status: "changes_requested",
    assignedReviewers: [
      {
        reviewerId: "user-reviewer",
        name: "Sarah Lead Architect",
        role: "lead_architect",
        assignedAt: "2026-11-09T10:05:00Z",
      },
    ],
    decisions: [
      {
        id: "dec-shard-1",
        reviewId: "rev-scenario-sharding",
        revisionNumber: 1,
        reviewerId: "user-reviewer",
        reviewerName: "Sarah Lead Architect",
        reviewerRole: "lead_architect",
        decision: "request_changes",
        explanation: "Manual client-side database sharding without Vitess or Citus will cause cross-shard transaction inconsistencies and duplicate connection pools.",
        createdAt: "2026-11-09T11:00:00Z",
      },
    ],
    threads: [
      {
        id: "th-shard-1",
        reviewId: "rev-scenario-sharding",
        revisionNumber: 1,
        anchor: { type: "node", nodeId: "sql_shard_a", nodeLabel: "SQL Shard A" },
        rootComment: {
          id: "c-shard-1",
          threadId: "th-shard-1",
          reviewId: "rev-scenario-sharding",
          revisionNumber: 1,
          authorId: "user-reviewer",
          authorName: "Sarah Lead Architect",
          content: "Critical blocker: Shard A and B have 0 replicas and no automated failover coordinator. A failure of either shard causes 50% systemic downtime.",
          createdAt: "2026-11-09T10:30:00Z",
          updatedAt: "2026-11-09T10:30:00Z",
        },
        replies: [],
        status: "open",
        isBlocking: true,
        createdAt: "2026-11-09T10:30:00Z",
        updatedAt: "2026-11-09T10:30:00Z",
      },
    ],
    checks: [
      {
        id: "chk-shard-spof",
        ruleId: "chk-spof",
        name: "Single Points of Failure",
        category: "spof",
        status: "failed",
        severity: "critical",
        message: "2 un-replicated database shards detected without automated failover.",
        executedAt: "2026-11-09T10:01:00Z",
      },
    ],
    policy: {
      minApprovals: 2,
      requiredReviewerRoles: ["lead_architect"],
      requireAllChecksPassed: true,
      requireResolvedThreads: true,
      allowSelfApproval: false,
      invalidateApprovalsOnRevision: true,
    },
    auditTrail: [],
    createdAt: "2026-11-09T10:00:00Z",
    updatedAt: "2026-11-09T11:00:00Z",
  },

  stale_baseline_scenario: {
    id: "rev-scenario-stale",
    projectId: "proj-streaming",
    architectureId: "arch-media-pipeline",
    authorId: "user-dev-elena",
    authorName: "Elena Rostova (DevOps)",
    title: "Deploy mTLS Ingress Controller & Security Sidecars",
    description: "Proposed strict mutual TLS termination and Envoy mesh sidecars on video processing pipeline.",
    baselineSnapshot: {
      id: "snap-baseline-old",
      revision: "rev-media-1.0.0",
      title: "Media Pipeline v1.0.0",
      schemaVersion: 1,
      createdAt: "2026-10-01T08:00:00Z",
      provenance: "saved-version",
      nodes: [
        {
          id: "edge_lb",
          type: "loadBalancer",
          position: { x: 50, y: 150 },
          data: { label: "Edge Ingress LB", componentType: "loadBalancer" },
        },
        {
          id: "transcoder_svc",
          type: "service",
          position: { x: 300, y: 150 },
          data: { label: "Video Transcoder Fleet", componentType: "service" },
        },
      ],
      edges: [
        { id: "e100", source: "edge_lb", target: "transcoder_svc", data: { protocol: "HTTPS" } },
      ],
    },
    currentRevisionNumber: 1,
    revisions: [
      {
        id: "rev-item-stale-1",
        reviewId: "rev-scenario-stale",
        revisionNumber: 1,
        contentHash: "hash-stale-001",
        changeSummary: "Configured mTLS policy and upgraded LB.",
        createdAt: "2026-10-05T08:00:00Z",
        authorId: "user-dev-elena",
        candidateSnapshot: {
          id: "snap-candidate-stale",
          revision: "rev-candidate-stale-v1",
          title: "Proposed mTLS Architecture",
          schemaVersion: 1,
          createdAt: "2026-10-05T08:00:00Z",
          provenance: "what-if-proposal",
          nodes: [
            {
              id: "edge_lb",
              type: "loadBalancer",
              position: { x: 50, y: 150 },
              data: { label: "Edge Ingress LB", componentType: "loadBalancer", authPolicy: "mTLS-strict" },
            },
            {
              id: "transcoder_svc",
              type: "service",
              position: { x: 300, y: 150 },
              data: { label: "Video Transcoder Fleet", componentType: "service", authPolicy: "mTLS-strict" },
            },
          ],
          edges: [
            { id: "e100", source: "edge_lb", target: "transcoder_svc", data: { protocol: "mTLS" } },
          ],
        },
      },
    ],
    status: "stale",
    assignedReviewers: [
      {
        reviewerId: "user-reviewer",
        name: "Sarah Lead Architect",
        role: "lead_architect",
        assignedAt: "2026-10-05T08:05:00Z",
      },
    ],
    decisions: [],
    threads: [],
    checks: [],
    policy: {
      minApprovals: 1,
      requiredReviewerRoles: ["lead_architect"],
      requireAllChecksPassed: true,
      requireResolvedThreads: true,
      allowSelfApproval: false,
      invalidateApprovalsOnRevision: true,
    },
    auditTrail: [],
    createdAt: "2026-10-05T08:00:00Z",
    updatedAt: "2026-10-05T08:00:00Z",
  },
};

export default function ArchitectureReviewsVerifyPage() {
  const [selectedScenarioId, setSelectedScenarioId] = React.useState<string>("redis_caching");
  const activeReview = MOCK_SCENARIOS[selectedScenarioId] || MOCK_SCENARIOS.redis_caching;

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-white overflow-hidden">
      {/* Top Verification Suite Header */}
      <div className="h-12 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/verify"
            className="text-xs font-mono text-[#858585] hover:text-white transition-colors"
          >
            ← Verification Suites
          </Link>
          <span className="text-[#333333]">|</span>
          <span className="text-xs font-semibold text-white">
            Phase 05.3.13: Architecture Design Review & Collaboration
          </span>
          <Badge variant="outline" className="text-[10px] font-mono border-[#333333] text-[#B5B5B5]">
            Immutable Snapshots
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono border-[#333333] text-[#B5B5B5]">
            Anchored Discussions
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono border-[#333333] text-[#B5B5B5]">
            Automated Checks
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono border-[#333333] text-[#B5B5B5]">
            Atomic Application
          </Badge>
        </div>

        {/* Review Scenario Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#858585]">Review Scenario:</span>
          <div className="flex items-center gap-1 bg-[#0D0D0D] border border-[#262626] rounded-md p-0.5">
            {Object.keys(MOCK_SCENARIOS).map((key) => {
              const isSelected = selectedScenarioId === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedScenarioId(key)}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                    isSelected
                      ? "bg-[#1A1A1A] text-white font-medium shadow-sm"
                      : "text-[#858585] hover:text-[#B5B5B5]"
                  }`}
                >
                  {key === "redis_caching"
                    ? "Redis & Replicas (Open)"
                    : key === "db_sharding_changes_requested"
                    ? "Sharding (Changes Requested)"
                    : "mTLS Ingress (Stale Baseline)"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Review Workspace */}
      <div className="flex-1 overflow-hidden">
        <ReviewWorkspace
          key={activeReview.id}
          initialReview={activeReview}
          currentUserId="user-reviewer"
          currentUserName="Sarah Lead Architect"
        />
      </div>
    </div>
  );
}
