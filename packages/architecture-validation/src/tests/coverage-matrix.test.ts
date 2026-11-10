import { describe, it, expect } from "vitest";
import { generateRuleCoverageMatrix } from "../core/coverage-matrix";

describe("Rule Coverage Matrix", () => {
  it("generates coverage matrix across all 20 categories and 223 components", () => {
    const report = generateRuleCoverageMatrix();

    expect(report.totalComponents).toBe(223);
    expect(report.categories.length).toBe(20);
    expect(report.implementedCount).toBe(223);
    expect(report.coveragePercentage).toBe(100);

    for (const cat of report.categories) {
      expect(cat.implementedComponents).toBe(cat.totalComponents);
      expect(cat.percentage).toBe(100);
    }

    for (const entry of report.entries) {
      expect(entry.registryDefinitionExists).toBe(true);
      expect(entry.documentationPath).toContain("/tutorial/system-design/components/");
    }
  });
});
