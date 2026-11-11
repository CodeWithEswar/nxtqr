import { describe, it, expect } from 'vitest';
import { ArchitectureReadinessEngine } from '../readiness/engine/readiness-engine';
import { ProductionReadinessAssessmentSchema } from '../readiness/schemas/readiness.schemas';

describe('Phase 05.3.30: Architecture Readiness Engine & Release Gates', () => {
  const engine = new ArchitectureReadinessEngine();

  it('should evaluate production readiness and satisfy schema requirements', async () => {
    const assessment = await engine.assessProductionReadiness({
      projectId: 'proj-readiness-test',
      revisionId: 'rev-001',
    });

    const parsed = ProductionReadinessAssessmentSchema.safeParse(assessment);
    expect(parsed.success).toBe(true);
    expect(assessment.overallVerdict).toBe('ready_for_production');
    expect(assessment.readinessScore).toBeGreaterThanOrEqual(95);
    expect(assessment.blockers).toHaveLength(0);
    expect(assessment.nonFabricationVerified).toBe(true);
  });

  it('should correctly flag blocked verdict when a critical blocker gate fails', async () => {
    const assessment = await engine.assessProductionReadiness({
      projectId: 'proj-blocked-test',
      revisionId: 'rev-002',
      customGates: [
        {
          id: 'custom-critical-blocker',
          pillar: 'security',
          title: 'Simulated Security Blocker',
          description: 'Unencrypted plaintext credential leak in public API gateway.',
          status: 'failed',
          evidenceRef: 'security:credential-leak-violation',
          blocker: true,
        },
      ],
    });

    expect(assessment.overallVerdict).toBe('blocked');
    expect(assessment.blockers.length).toBeGreaterThan(0);
    expect(assessment.blockers[0]).toContain('Simulated Security Blocker');
    expect(assessment.pillars.security.passed).toBe(false);
  });

  it('should verify all 8 pillars are explicitly evaluated', async () => {
    const assessment = await engine.assessProductionReadiness({
      projectId: 'proj-pillars-test',
      revisionId: 'rev-003',
    });

    const expectedPillars = [
      'correctness',
      'security',
      'reliability',
      'performance',
      'accessibility',
      'operability',
      'governance',
      'release_gates',
    ];

    for (const pillar of expectedPillars) {
      expect(assessment.pillars).toHaveProperty(pillar);
      expect(assessment.pillars[pillar as keyof typeof assessment.pillars].score).toBeGreaterThan(0);
      expect(assessment.pillars[pillar as keyof typeof assessment.pillars].gateCount).toBeGreaterThan(0);
    }
  });
});

