import { describe, it, expect } from "vitest";
import { SuiteRegistry } from "../verification/registry/suite-registry";
import type { ArchitectureTestSuite } from "../verification/contracts/verification.types";

describe("Phase 05.3.28: Test Suite Acyclicity Validation", () => {
  it("validates acyclic test suites without error", () => {
    const suites: ArchitectureTestSuite[] = [
      {
        id: "SUITE-A",
        projectId: "p1",
        version: "1.0.0",
        title: "Suite A",
        description: "Base suite",
        category: "base",
        testIds: ["TEST-01"],
        dependencySuiteIds: [],
        status: "active",
        createdBy: "architect",
        createdAt: new Date().toISOString(),
      },
      {
        id: "SUITE-B",
        projectId: "p1",
        version: "1.0.0",
        title: "Suite B",
        description: "Depends on A",
        category: "derived",
        testIds: ["TEST-02"],
        dependencySuiteIds: ["SUITE-A"],
        status: "active",
        createdBy: "architect",
        createdAt: new Date().toISOString(),
      },
    ];

    const result = SuiteRegistry.validateSuiteAcyclicity(suites);
    expect(result.hasCycles).toBe(false);
  });

  it("detects cyclic suite dependencies (A -> B -> A)", () => {
    const cyclicSuites: ArchitectureTestSuite[] = [
      {
        id: "SUITE-A",
        projectId: "p1",
        version: "1.0.0",
        title: "Suite A",
        description: "Depends on B",
        category: "base",
        testIds: ["TEST-01"],
        dependencySuiteIds: ["SUITE-B"],
        status: "active",
        createdBy: "architect",
        createdAt: new Date().toISOString(),
      },
      {
        id: "SUITE-B",
        projectId: "p1",
        version: "1.0.0",
        title: "Suite B",
        description: "Depends on A (cycle)",
        category: "derived",
        testIds: ["TEST-02"],
        dependencySuiteIds: ["SUITE-A"],
        status: "active",
        createdBy: "architect",
        createdAt: new Date().toISOString(),
      },
    ];

    const result = SuiteRegistry.validateSuiteAcyclicity(cyclicSuites);
    expect(result.hasCycles).toBe(true);
    expect(result.cyclePath).toBeDefined();
    expect(result.cyclePath).toContain("SUITE-A");
  });
});

