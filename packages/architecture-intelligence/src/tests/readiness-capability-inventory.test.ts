import { describe, it, expect } from 'vitest';
import { CAPABILITY_INVENTORY } from '../readiness/inventory/capability-inventory';
import { CapabilityInventoryItemSchema } from '../readiness/schemas/readiness.schemas';

describe('Phase 05.3.30: Capability Inventory Audit', () => {
  it('should contain all 30 planned capabilities from 05.3.1 to 05.3.30', () => {
    expect(CAPABILITY_INVENTORY).toHaveLength(30);

    const phases = CAPABILITY_INVENTORY.map((c) => c.phase);
    for (let i = 1; i <= 30; i++) {
      const expectedPhase = `05.3.${i}`;
      expect(phases).toContain(expectedPhase);
    }
  });

  it('should ensure each capability has unique phases and valid schemas', () => {
    const phaseSet = new Set<string>();
    for (const item of CAPABILITY_INVENTORY) {
      expect(phaseSet.has(item.phase)).toBe(false);
      phaseSet.add(item.phase);

      const parsed = CapabilityInventoryItemSchema.safeParse(item);
      expect(parsed.success).toBe(true);
    }
  });

  it('should verify all capabilities have non-empty interfaces, dependencies, and security notes', () => {
    for (const item of CAPABILITY_INVENTORY) {
      expect(item.publicInterfaces.length).toBeGreaterThan(0);
      expect(item.securityNotes.length).toBeGreaterThan(10);
      expect(item.performanceNotes.length).toBeGreaterThan(10);
      expect(item.status).toBe('integrated');
      expect(item.testCoverageVerified).toBe(true);
    }
  });
});
