/**
 * @file packages/architecture-intelligence/src/readiness/schemas/readiness.schemas.ts
 * Zod validation schemas for Phase 05.3.30 Production Readiness.
 */

import { z } from 'zod';

export const CapabilityPhaseSchema = z.enum([
  '05.3.1',
  '05.3.2',
  '05.3.3',
  '05.3.4',
  '05.3.5',
  '05.3.6',
  '05.3.7',
  '05.3.8',
  '05.3.9',
  '05.3.10',
  '05.3.11',
  '05.3.12',
  '05.3.13',
  '05.3.14',
  '05.3.15',
  '05.3.16',
  '05.3.17',
  '05.3.18',
  '05.3.19',
  '05.3.20',
  '05.3.21',
  '05.3.22',
  '05.3.23',
  '05.3.24',
  '05.3.25',
  '05.3.26',
  '05.3.27',
  '05.3.28',
  '05.3.29',
  '05.3.30',
]);

export const CapabilityStatusSchema = z.enum([
  'not_implemented',
  'partially_implemented',
  'implemented_untested',
  'implemented_tested',
  'integrated',
  'blocked',
  'deprecated',
]);

export const CapabilityInventoryItemSchema = z.object({
  phase: CapabilityPhaseSchema,
  title: z.string().min(1),
  category: z.enum([
    'core_analysis',
    'specialized_intelligence',
    'planning_operations',
    'orchestration_readiness',
  ]),
  modulePath: z.string().min(1),
  status: CapabilityStatusSchema,
  publicInterfaces: z.array(z.string()),
  dependencies: z.array(z.string()),
  testSuites: z.array(z.string()),
  testCoverageVerified: z.boolean(),
  securityNotes: z.string(),
  performanceNotes: z.string(),
  evidenceNotes: z.string(),
});

export const RepositoryAuditResultSchema = z.object({
  timestamp: z.string(),
  totalCapabilities: z.number().int().nonnegative(),
  verifiedCapabilities: z.number().int().nonnegative(),
  integratedCapabilities: z.number().int().nonnegative(),
  blockedCapabilities: z.number().int().nonnegative(),
  packagesAudited: z.array(z.string()),
  canonicalGraphCheck: z.object({
    compliant: z.boolean(),
    violations: z.array(z.string()),
  }),
  rlsAudit: z.object({
    totalMigrations: z.number().int().nonnegative(),
    compliant: z.boolean(),
    checkedTables: z.array(z.string()),
  }),
  boundaryAudit: z.object({
    cleanBoundaries: z.boolean(),
    circularImportsDetected: z.number().int().nonnegative(),
  }),
  findings: z.array(
    z.object({
      severity: z.enum(['info', 'warning', 'critical']),
      category: z.string(),
      description: z.string(),
      file: z.string().optional(),
    })
  ),
});

export const PerformanceBenchmarkMetricsSchema = z.object({
  graphLoadDurationMs: z.number().nonnegative(),
  graphRenderDurationMs: z.number().nonnegative(),
  analysisWaveDurationMs: z.number().nonnegative(),
  cacheSpeedupRatio: z.number().nonnegative(),
  memoryUsageEstimateMb: z.number().nonnegative(),
  reportGenerationDurationMs: z.number().nonnegative(),
  nodesEvaluated: z.number().int().nonnegative(),
  edgesEvaluated: z.number().int().nonnegative(),
  analyzersRan: z.number().int().nonnegative(),
  timestamp: z.string(),
});

export const ReleaseReadinessPillarSchema = z.enum([
  'correctness',
  'security',
  'reliability',
  'performance',
  'accessibility',
  'operability',
  'governance',
  'release_gates',
]);

export const ReleaseGateItemSchema = z.object({
  id: z.string().min(1),
  pillar: ReleaseReadinessPillarSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['passed', 'failed', 'unknown', 'blocked', 'waived']),
  evidenceRef: z.string().min(1),
  blocker: z.boolean(),
  reason: z.string().optional(),
});

export const PillarEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  gateCount: z.number().int().nonnegative(),
  passedGates: z.number().int().nonnegative(),
  blockers: z.number().int().nonnegative(),
});

export const ProductionReadinessAssessmentSchema = z.object({
  assessmentId: z.string().uuid().or(z.string().min(1)),
  projectId: z.string().min(1),
  revisionId: z.string().min(1),
  timestamp: z.string(),
  overallVerdict: z.enum([
    'ready_for_production',
    'conditionally_ready',
    'not_ready',
    'blocked',
  ]),
  readinessScore: z.number().min(0).max(100),
  summary: z.string(),
  pillars: z.record(ReleaseReadinessPillarSchema, PillarEvaluationSchema),
  gates: z.array(ReleaseGateItemSchema),
  benchmarks: PerformanceBenchmarkMetricsSchema,
  capabilityStats: z.object({
    total: z.number().int().nonnegative(),
    integrated: z.number().int().nonnegative(),
    tested: z.number().int().nonnegative(),
    blocked: z.number().int().nonnegative(),
  }),
  blockers: z.array(z.string()),
  signOffRequired: z.boolean(),
  signedOffBy: z.string().optional(),
  signedOffAt: z.string().optional(),
  nonFabricationVerified: z.boolean(),
});
