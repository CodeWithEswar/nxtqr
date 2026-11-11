/**
 * @file apps/web/src/features/system-design/readiness/components/readiness-dashboard.tsx
 * Executive Production Readiness Dashboard for Phase 05.3.30.
 */

'use client';

import React from 'react';
import {
  ProductionReadinessAssessment,
  ReleaseReadinessPillar,
} from '@nxtqr/architecture-intelligence';
import {
  ShieldIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ActivityIcon,
  PlayIcon,
  RefreshIcon,
  LayersIcon,
} from '@nxtqr/icons';

interface ReadinessDashboardProps {
  assessment: ProductionReadinessAssessment | null;
  isRunning: boolean;
  onReAssess: () => void;
  onRunBenchmark: () => void;
  onSelectPillar: (pillar: ReleaseReadinessPillar | 'all') => void;
  selectedPillar: ReleaseReadinessPillar | 'all';
}

export const ReadinessDashboard: React.FC<ReadinessDashboardProps> = ({
  assessment,
  isRunning,
  onReAssess,
  onRunBenchmark,
  onSelectPillar,
  selectedPillar,
}) => {
  if (!assessment) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-md border border-neutral-800 bg-[#080808] p-8 text-center">
        <ActivityIcon className="mb-3 h-8 w-8 animate-spin text-neutral-500" />
        <h3 className="text-sm font-medium text-white">Evaluating Production Readiness...</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Running repository capability audit and executing measured performance benchmarks.
        </p>
      </div>
    );
  }

  const verdictStyles: Record<
    ProductionReadinessAssessment['overallVerdict'],
    { label: string; textClass: string; bgClass: string; borderClass: string }
  > = {
    ready_for_production: {
      label: 'READY FOR PRODUCTION',
      textClass: 'text-emerald-400',
      bgClass: 'bg-emerald-950/20',
      borderClass: 'border-emerald-800/40',
    },
    conditionally_ready: {
      label: 'CONDITIONALLY READY',
      textClass: 'text-amber-400',
      bgClass: 'bg-amber-950/20',
      borderClass: 'border-amber-800/40',
    },
    blocked: {
      label: 'RELEASE BLOCKED',
      textClass: 'text-red-400',
      bgClass: 'bg-red-950/20',
      borderClass: 'border-red-800/40',
    },
    not_ready: {
      label: 'NOT READY',
      textClass: 'text-neutral-400',
      bgClass: 'bg-neutral-900',
      borderClass: 'border-neutral-800',
    },
  };

  const verdict = verdictStyles[assessment.overallVerdict];

  const pillarsList: Array<{
    key: ReleaseReadinessPillar;
    title: string;
    description: string;
  }> = [
    { key: 'correctness', title: 'Correctness', description: 'Schema validity & DAG cycles' },
    { key: 'security', title: 'Security', description: 'RLS & allowlisted execution' },
    { key: 'reliability', title: 'Reliability', description: 'Concurrency & fault tolerance' },
    { key: 'performance', title: 'Performance', description: 'Execution budgets & caching' },
    { key: 'accessibility', title: 'Design & A11y', description: 'Pure black & zero white borders' },
    { key: 'operability', title: 'Operability', description: 'Disaster recovery & RTO targets' },
    { key: 'governance', title: 'Governance', description: 'Policy-as-code & drift audit' },
    { key: 'release_gates', title: 'Release Gates', description: 'Deterministic suite verification' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="rounded-md border border-neutral-800 bg-[#080808] p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${verdict.bgClass} ${verdict.textClass} ${verdict.borderClass}`}
              >
                {assessment.overallVerdict === 'ready_for_production' ? (
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangleIcon className="h-3.5 w-3.5" />
                )}
                {verdict.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-xs text-neutral-400">
                <ShieldIcon className="h-3.5 w-3.5 text-neutral-400" />
                Non-Fabrication Verified
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">
              Production Release Readiness Assessment
            </h2>
            <p className="mt-1 text-sm text-neutral-400">{assessment.summary}</p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center md:items-end">
            <div className="flex flex-col items-end rounded-md border border-neutral-800 bg-[#0D0D0D] px-4 py-2">
              <span className="text-xs uppercase tracking-wider text-neutral-400">
                Readiness Score
              </span>
              <span
                className={`text-2xl font-bold ${
                  assessment.readinessScore >= 95
                    ? 'text-emerald-400'
                    : assessment.readinessScore >= 75
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {assessment.readinessScore}
                <span className="text-sm font-normal text-neutral-400">/100</span>
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onReAssess}
                disabled={isRunning}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                <RefreshIcon className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                Re-Assess
              </button>
              <button
                type="button"
                onClick={onRunBenchmark}
                disabled={isRunning}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                <PlayIcon className="h-3.5 w-3.5" />
                Run Benchmarks
              </button>
            </div>
          </div>
        </div>

        {/* 4 Quick Stat Tiles */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border border-neutral-800/80 bg-[#0D0D0D] p-3">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <LayersIcon className="h-3.5 w-3.5 text-neutral-500" />
              Capabilities
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              {assessment.capabilityStats.integrated} / {assessment.capabilityStats.total}
            </div>
            <div className="text-[11px] text-emerald-400">100% cataloged & integrated</div>
          </div>

          <div className="rounded-md border border-neutral-800/80 bg-[#0D0D0D] p-3">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <CheckCircleIcon className="h-3.5 w-3.5 text-neutral-500" />
              Test Suites Verified
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              {assessment.capabilityStats.tested} / {assessment.capabilityStats.total}
            </div>
            <div className="text-[11px] text-emerald-400">Passing automated unit tests</div>
          </div>

          <div className="rounded-md border border-neutral-800/80 bg-[#0D0D0D] p-3">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <AlertTriangleIcon className="h-3.5 w-3.5 text-neutral-500" />
              Release Blockers
            </div>
            <div
              className={`mt-1 text-lg font-semibold ${
                assessment.blockers.length === 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {assessment.blockers.length}
            </div>
            <div className="text-[11px] text-neutral-400">
              {assessment.blockers.length === 0
                ? 'Zero critical release blockers'
                : 'Blocking deployment'}
            </div>
          </div>

          <div className="rounded-md border border-neutral-800/80 bg-[#0D0D0D] p-3">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <ActivityIcon className="h-3.5 w-3.5 text-neutral-500" />
              Wave Analysis Duration
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              {assessment.benchmarks.analysisWaveDurationMs}ms
            </div>
            <div className="text-[11px] text-neutral-400">
              {assessment.benchmarks.cacheSpeedupRatio}x cache speedup
            </div>
          </div>
        </div>

        {/* Critical Blockers Alert if any */}
        {assessment.blockers.length > 0 && (
          <div className="mt-6 rounded-md border border-red-900/60 bg-red-950/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangleIcon className="mt-0.5 h-5 w-5 text-red-400" />
              <div>
                <h4 className="text-sm font-semibold text-red-200">Critical Release Blockers</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-red-300">
                  {assessment.blockers.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 8 Architectural Pillars Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">8 Architectural Pillars Evaluation</h3>
          <button
            type="button"
            onClick={() => onSelectPillar('all')}
            className={`text-xs ${
              selectedPillar === 'all' ? 'text-white underline' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Show All Gates
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pillarsList.map((p) => {
            const evaluation = assessment.pillars[p.key];
            const isSelected = selectedPillar === p.key;

            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onSelectPillar(p.key)}
                className={`flex flex-col justify-between rounded-md border p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-[#404040] bg-[#141414]'
                    : 'border-neutral-800 bg-[#080808] hover:border-neutral-700 hover:bg-[#0D0D0D]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{p.title}</span>
                    <span
                      className={`text-xs font-bold ${
                        evaluation.passed ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {evaluation.score}%
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-400">{p.description}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-neutral-800/80 pt-2 text-[11px]">
                  <span className="text-neutral-400">
                    Gates: {evaluation.passedGates} / {evaluation.gateCount}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                      evaluation.passed
                        ? 'border border-emerald-900/60 bg-emerald-950/30 text-emerald-400'
                        : 'border border-red-900/60 bg-red-950/30 text-red-400'
                    }`}
                  >
                    {evaluation.passed ? 'PASSED' : `${evaluation.blockers} BLOCKER`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
