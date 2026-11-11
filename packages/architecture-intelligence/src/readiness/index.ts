/**
 * @file packages/architecture-intelligence/src/readiness/index.ts
 * Public exports for Phase 05.3.30 Production Readiness.
 */

export * from './contracts/readiness.types';
export * from './schemas/readiness.schemas';
export * from './inventory/capability-inventory';
export * from './audit/repository-auditor';
export * from './benchmarks/performance-benchmarker';
export * from './engine/readiness-engine';

import { ArchitectureReadinessEngine } from './engine/readiness-engine';
export const architectureReadinessEngine = new ArchitectureReadinessEngine();
