import type { VerificationCheck, VerificationSummary, VerificationStatus } from "../schemas/verification.schema";

export function calculateSummary(checks: VerificationCheck[], totalDurationMs: number = 0): VerificationSummary {
  const summary: VerificationSummary = {
    total: checks.length,
    passed: 0,
    warning: 0,
    failed: 0,
    notRun: 0,
    durationMs: Math.round(totalDurationMs * 10) / 10,
    lastCheckedAt: undefined,
  };

  let latestTimestamp: number | null = null;

  for (const check of checks) {
    if (check.status === "passed") summary.passed++;
    else if (check.status === "warning") summary.warning++;
    else if (check.status === "failed") summary.failed++;
    else if (check.status === "not_run" || check.status === "running") summary.notRun++;

    if (check.checkedAt) {
      const time = new Date(check.checkedAt).getTime();
      if (!isNaN(time) && (latestTimestamp === null || time > latestTimestamp)) {
        latestTimestamp = time;
      }
    }
  }

  if (latestTimestamp) {
    summary.lastCheckedAt = new Date(latestTimestamp).toISOString();
  }

  return summary;
}

export function formatStatusLabel(status: VerificationStatus): string {
  switch (status) {
    case "passed":
      return "Verified";
    case "warning":
      return "Warning";
    case "failed":
      return "Failed";
    case "running":
      return "Running...";
    case "not_run":
      return "Not Run";
    case "skipped":
      return "Skipped";
    case "unavailable":
      return "Unavailable";
    default:
      return status;
  }
}

export function formatDuration(ms?: number): string {
  if (ms === undefined || ms === null) return "—";
  if (ms < 1) return "< 1ms";
  if (ms < 1000) return `${Math.round(ms * 10) / 10}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 5) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

