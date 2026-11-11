/**
 * @file packages/architecture-intelligence/src/readiness/contracts/readiness.types.ts
 * Domain contracts for Phase 05.3.30 - Architecture Intelligence Production Readiness & Final Integration.
 */

export type CapabilityPhase =
  | '05.3.1'
  | '05.3.2'
  | '05.3.3'
  | '05.3.4'
  | '05.3.5'
  | '05.3.6'
  | '05.3.7'
  | '05.3.8'
  | '05.3.9'
  | '05.3.10'
  | '05.3.11'
  | '05.3.12'
  | '05.3.13'
  | '05.3.14'
  | '05.3.15'
  | '05.3.16'
  | '05.3.17'
  | '05.3.18'
  | '05.3.19'
  | '05.3.20'
  | '05.3.21'
  | '05.3.22'
  | '05.3.23'
  | '05.3.24'
  | '05.3.25'
  | '05.3.26'
  | '05.3.27'
  | '05.3.28'
  | '05.3.29'
  | '05.3.30';

export type CapabilityStatus =
  | 'not_implemented'
  | 'partially_implemented'
  | 'implemented_untested'
  | 'implemented_tested'
  | 'integrated'
  | 'blocked'
  | 'deprecated';

export interface CapabilityInventoryItem {
  phase: CapabilityPhase;
  title: string;
  category: 'core_analysis' | 'specialized_intelligence' | 'planning_operations' | 'orchestration_readiness';
  modulePath: string;
  status: CapabilityStatus;
  publicInterfaces: string[];
  dependencies: string[];
  testSuites: string[];
  testCoverageVerified: boolean;
  securityNotes: string;
  performanceNotes: string;
  evidenceNotes: string;
}

export interface RepositoryAuditResult {
  timestamp: string;
  totalCapabilities: number;
  verifiedCapabilities: number;
  integratedCapabilities: number;
  blockedCapabilities: number;
  packagesAudited: string[];
  canonicalGraphCheck: {
    compliant: boolean;
    violations: string[];
  };
  rlsAudit: {
    totalMigrations: number;
    compliant: boolean;
    checkedTables: string[];
  };
  boundaryAudit: {
    cleanBoundaries: boolean;
    circularImportsDetected: number;
  };
  findings: Array<{
    severity: 'info' | 'warning' | 'critical';
    category: string;
    description: string;
    file?: string;
  }>;
}

export interface PerformanceBenchmarkMetrics {
  graphLoadDurationMs: number;
  graphRenderDurationMs: number;
  analysisWaveDurationMs: number;
  cacheSpeedupRatio: number;
  memoryUsageEstimateMb: number;
  reportGenerationDurationMs: number;
  nodesEvaluated: number;
  edgesEvaluated: number;
  analyzersRan: number;
  timestamp: string;
}

export type ReleaseReadinessPillar =
  | 'correctness'
  | 'security'
  | 'reliability'
  | 'performance'
  | 'accessibility'
  | 'operability'
  | 'governance'
  | 'release_gates';

export interface ReleaseGateItem {
  id: string;
  pillar: ReleaseReadinessPillar;
  title: string;
  description: string;
  status: 'passed' | 'failed' | 'unknown' | 'blocked' | 'waived';
  evidenceRef: string;
  blocker: boolean;
  reason?: string;
}

export interface PillarEvaluation {
  score: number;
  passed: boolean;
  gateCount: number;
  passedGates: number;
  blockers: number;
}

export interface ProductionReadinessAssessment {
  assessmentId: string;
  projectId: string;
  revisionId: string;
  timestamp: string;
  overallVerdict: 'ready_for_production' | 'conditionally_ready' | 'not_ready' | 'blocked';
  readinessScore: number;
  summary: string;
  pillars: Record<ReleaseReadinessPillar, PillarEvaluation>;
  gates: ReleaseGateItem[];
  benchmarks: PerformanceBenchmarkMetrics;
  capabilityStats: {
    total: number;
    integrated: number;
    tested: number;
    blocked: number;
  };
  blockers: string[];
  signOffRequired: boolean;
  signedOffBy?: string;
  signedOffAt?: string;
  nonFabricationVerified: boolean;
}

