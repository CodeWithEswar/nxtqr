import { describe, it, expect } from 'vitest';
import { RepositoryAuditor } from '../readiness/audit/repository-auditor';
import { RepositoryAuditResultSchema } from '../readiness/schemas/readiness.schemas';

describe('Phase 05.3.30: Repository Auditor', () => {
  const auditor = new RepositoryAuditor();

  it('should execute comprehensive repository audit and validate against schema', () => {
    const audit = auditor.audit();
    const parsed = RepositoryAuditResultSchema.safeParse(audit);
    expect(parsed.success).toBe(true);
  });

  it('should confirm 30 total capabilities with zero blockers', () => {
    const audit = auditor.audit();
    expect(audit.totalCapabilities).toBe(30);
    expect(audit.integratedCapabilities).toBe(30);
    expect(audit.verifiedCapabilities).toBe(30);
    expect(audit.blockedCapabilities).toBe(0);
  });

  it('should verify canonical graph compliance and Supabase RLS coverage', () => {
    const audit = auditor.audit();
    expect(audit.canonicalGraphCheck.compliant).toBe(true);
    expect(audit.canonicalGraphCheck.violations).toHaveLength(0);
    expect(audit.rlsAudit.compliant).toBe(true);
    expect(audit.rlsAudit.totalMigrations).toBe(21);
    expect(audit.boundaryAudit.cleanBoundaries).toBe(true);
  });
});
