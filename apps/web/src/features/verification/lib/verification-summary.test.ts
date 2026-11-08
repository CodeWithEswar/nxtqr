import { describe, it, expect } from "vitest";
import { calculateSummary, formatStatusLabel, formatDuration, formatRelativeTime } from "./verification-summary";
import type { VerificationCheck } from "../schemas/verification.schema";

describe("Verification Summary Calculations", () => {
  const mockChecks: VerificationCheck[] = [
    {
      id: "check_1",
      category: "architecture",
      title: "Monorepo Boundaries",
      description: "Package bounds",
      verificationType: "contract_check",
      status: "passed",
      durationMs: 4.2,
      checkedAt: "2026-11-08T10:00:00.000Z",
    },
    {
      id: "check_2",
      category: "infrastructure",
      title: "Live Database Ping",
      description: "Postgres connection",
      verificationType: "runtime_test",
      status: "warning",
      durationMs: 12.5,
      checkedAt: "2026-11-08T10:00:01.000Z",
    },
    {
      id: "check_3",
      category: "frontend",
      title: "Zod Schema Parse",
      description: "Validation check",
      verificationType: "contract_check",
      status: "failed",
      durationMs: 1.1,
    },
    {
      id: "check_4",
      category: "design-system",
      title: "Motion Provider",
      description: "Context check",
      verificationType: "client_state",
      status: "not_run",
    },
  ];

  it("calculates accurate derived summary metrics", () => {
    const summary = calculateSummary(mockChecks, 17.8);
    expect(summary.total).toBe(4);
    expect(summary.passed).toBe(1);
    expect(summary.warning).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.notRun).toBe(1);
    expect(summary.durationMs).toBe(17.8);
    expect(summary.lastCheckedAt).toBe("2026-11-08T10:00:01.000Z");
  });

  it("formats status labels accurately", () => {
    expect(formatStatusLabel("passed")).toBe("Verified");
    expect(formatStatusLabel("warning")).toBe("Warning");
    expect(formatStatusLabel("failed")).toBe("Failed");
    expect(formatStatusLabel("not_run")).toBe("Not Run");
    expect(formatStatusLabel("running")).toBe("Running...");
  });

  it("formats execution durations", () => {
    expect(formatDuration(undefined)).toBe("—");
    expect(formatDuration(0.4)).toBe("< 1ms");
    expect(formatDuration(42.34)).toBe("42.3ms");
    expect(formatDuration(1500)).toBe("1.50s");
  });

  it("formats relative timestamps", () => {
    expect(formatRelativeTime(undefined)).toBe("Never");
    const justNow = new Date().toISOString();
    expect(formatRelativeTime(justNow)).toBe("Just now");
  });
});

