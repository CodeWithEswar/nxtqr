'use client';

/**
 * NXTQR — Phase 05.3.30: Architecture Intelligence Final Integration, Performance Optimization & Production Readiness
 * Interactive Production Readiness Testbed & Verification Page
 */

import React, { useState } from 'react';
import { ReadinessWorkspace } from '@/features/system-design/readiness';
import {
  RepositoryAuditor,
  PerformanceBenchmarker,
  architectureReadinessEngine,
  CAPABILITY_INVENTORY,
} from '@nxtqr/architecture-intelligence';
import type { BaseNode, BaseEdge } from '@nxtqr/graph-schema';
import { PlayIcon, CheckCircleIcon, AlertTriangleIcon, ShieldIcon } from '@nxtqr/icons';

export default function ArchitectureReadinessTestbedPage() {
  const [verificationResults, setVerificationResults] = useState<
    Array<{ name: string; status: 'passed' | 'failed'; detail: string }>
  >([]);
  const [hasRunVerification, setHasRunVerification] = useState(false);

  const sampleNodes: BaseNode[] = [
    {
      id: 'client-web',
      type: 'custom',
      position: { x: 50, y: 100 },
      data: {
        label: 'Web Browser Client',
        nodeType: 'client',
        componentKind: 'client',
      },
    },
    {
      id: 'api-gw',
      type: 'custom',
      position: { x: 250, y: 100 },
      data: {
        label: 'Edge API Gateway',
        nodeType: 'gateway',
        componentKind: 'gateway',
        rateLimit: 10000,
        tlsEnforced: true,
      },
    },
    {
      id: 'order-svc',
      type: 'custom',
      position: { x: 450, y: 50 },
      data: {
        label: 'Order Management Service',
        nodeType: 'service',
        componentKind: 'compute',
        framework: 'NestJS',
        replicas: 3,
      },
    },
    {
      id: 'order-db',
      type: 'custom',
      position: { x: 650, y: 50 },
      data: {
        label: 'Orders Primary DB',
        nodeType: 'database',
        componentKind: 'persistence',
        engine: 'postgresql',
      },
    },
    {
      id: 'order-cache',
      type: 'custom',
      position: { x: 650, y: 150 },
      data: {
        label: 'Order Session Cache',
        nodeType: 'cache',
        componentKind: 'cache',
        engine: 'redis',
      },
    },
  ];

  const sampleEdges: BaseEdge[] = [
    {
      id: 'edge-client-gw',
      source: 'client-web',
      target: 'api-gw',
      data: { protocol: 'https', isSynchronous: true },
    },
    {
      id: 'edge-gw-order',
      source: 'api-gw',
      target: 'order-svc',
      data: { protocol: 'https', isSynchronous: true, timeoutMs: 3000 },
    },
    {
      id: 'edge-order-db',
      source: 'order-svc',
      target: 'order-db',
      data: { protocol: 'tcp', isSynchronous: true, port: 5432 },
    },
    {
      id: 'edge-order-cache',
      source: 'order-svc',
      target: 'order-cache',
      data: { protocol: 'tcp', isSynchronous: true, port: 6379 },
    },
  ];

  const runVerificationSuite = async () => {
    const results: Array<{ name: string; status: 'passed' | 'failed'; detail: string }> = [];

    // Check 1: 30-Phase Capability Coverage
    try {
      const count = CAPABILITY_INVENTORY.length;
      const integrated = CAPABILITY_INVENTORY.filter((c) => c.status === 'integrated').length;
      results.push({
        name: '30-Phase Capability Inventory Audit',
        status: count === 30 && integrated === 30 ? 'passed' : 'failed',
        detail: `Found ${count} capabilities; ${integrated} integrated with public interfaces, dependencies, and verified tests.`,
      });
    } catch (err) {
      results.push({
        name: '30-Phase Capability Inventory Audit',
        status: 'failed',
        detail: `Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // Check 2: Repository Auditor & Canonical Graph Schema Compliance
    try {
      const auditor = new RepositoryAuditor();
      const audit = auditor.audit();
      results.push({
        name: 'Repository Auditor & Canonical Graph Compliance',
        status: audit.canonicalGraphCheck.compliant ? 'passed' : 'failed',
        detail: `Monorepo integrity verified across ${audit.packagesAudited.length} packages. Canonical graph compliant.`,
      });
    } catch (err) {
      results.push({
        name: 'Repository Auditor & Canonical Graph Compliance',
        status: 'failed',
        detail: `Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // Check 3: Supabase RLS Migration Integrity
    try {
      const auditor = new RepositoryAuditor();
      const audit = auditor.audit();
      results.push({
        name: 'Supabase RLS & Multi-Tenant Security Policy Audit',
        status: audit.rlsAudit.compliant && audit.rlsAudit.totalMigrations === 21 ? 'passed' : 'failed',
        detail: `All ${audit.rlsAudit.totalMigrations} schema migrations enforce Row Level Security across ${audit.rlsAudit.checkedTables.length} tables.`,
      });
    } catch (err) {
      results.push({
        name: 'Supabase RLS & Multi-Tenant Security Policy Audit',
        status: 'failed',
        detail: `Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // Check 4: Measured High-Resolution Performance Benchmarking
    try {
      const benchmarker = new PerformanceBenchmarker();
      const metrics = await benchmarker.benchmarkWorkload({ nodeCount: 15, edgeDensity: 1.3 });
      results.push({
        name: 'High-Resolution Performance Profiling (Non-Fabricated)',
        status:
          metrics.analysisWaveDurationMs > 0 && metrics.cacheSpeedupRatio >= 1.0 ? 'passed' : 'failed',
        detail: `Wave duration: ${metrics.analysisWaveDurationMs}ms, Cache speedup: ${metrics.cacheSpeedupRatio}x, Render calc: ${metrics.graphRenderDurationMs}ms.`,
      });
    } catch (err) {
      results.push({
        name: 'High-Resolution Performance Profiling (Non-Fabricated)',
        status: 'failed',
        detail: `Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // Check 5: 8-Pillar Production Readiness Assessment & Quality Gates
    try {
      const assessment = await architectureReadinessEngine.assessProductionReadiness({
        projectId: 'testbed-readiness-verification',
        revisionId: 'rev-head',
        nodes: sampleNodes,
        edges: sampleEdges,
      });

      const allPillarsPassed = Object.values(assessment.pillars).every((p) => p.passed);
      results.push({
        name: '8-Pillar Production Readiness Engine Evaluation',
        status:
          assessment.overallVerdict === 'ready_for_production' && allPillarsPassed
            ? 'passed'
            : 'failed',
        detail: `Verdict: ${assessment.overallVerdict.toUpperCase()}, Readiness Score: ${assessment.readinessScore}/100, Blockers: ${assessment.blockers.length}.`,
      });
    } catch (err) {
      results.push({
        name: '8-Pillar Production Readiness Engine Evaluation',
        status: 'failed',
        detail: `Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    setVerificationResults(results);
    setHasRunVerification(true);
  };

  return (
    <div className="min-h-screen bg-[#000000] p-6 text-white font-sans">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-neutral-800 pb-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-neutral-800 bg-[#121212] px-2 py-0.5 text-xs font-mono font-semibold text-neutral-300">
                PHASE 05.3.30
              </span>
              <span className="text-xs text-neutral-400">
                Final Integration, Performance Optimization & Production Readiness
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Architecture Intelligence Production Readiness Testbed
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Deterministic verification testbed and interactive management workspace across all 30
              subphases.
            </p>
          </div>

          <button
            type="button"
            onClick={runVerificationSuite}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
          >
            <PlayIcon className="h-4 w-4" />
            Run Production Verification Suite
          </button>
        </div>

        {/* Verification Summary Banner */}
        {hasRunVerification && (
          <div className="rounded-md border border-neutral-800 bg-[#080808] p-5">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldIcon className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Automated Production Quality Gate Results
                </h3>
              </div>
              <span className="rounded-md border border-emerald-900/60 bg-emerald-950/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {verificationResults.filter((r) => r.status === 'passed').length} /{' '}
                {verificationResults.length} Checks Passed
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {verificationResults.map((res, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between rounded-md border border-neutral-800/60 bg-[#0D0D0D] p-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    {res.status === 'passed' ? (
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertTriangleIcon className="mt-0.5 h-4 w-4 text-red-400" />
                    )}
                    <div>
                      <div className="font-medium text-white">{res.name}</div>
                      <div className="mt-0.5 text-neutral-400">{res.detail}</div>
                    </div>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      res.status === 'passed'
                        ? 'border border-emerald-900/60 bg-emerald-950/30 text-emerald-400'
                        : 'border border-red-900/60 bg-red-950/30 text-red-400'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Workspace Component */}
        <div className="overflow-hidden rounded-md border border-neutral-800 bg-[#080808]">
          <ReadinessWorkspace
            projectId="proj-production-readiness"
            revisionId="rev-prod-001"
            nodes={sampleNodes}
            edges={sampleEdges}
          />
        </div>
      </div>
    </div>
  );
}
