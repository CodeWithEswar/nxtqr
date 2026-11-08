"use client";

import * as React from "react";
import type { VerificationCheck, VerificationStatus, VerificationSummary } from "../schemas/verification.schema";
import { INITIAL_VERIFICATION_CHECKS } from "../checks/registry";
import { executeCheck } from "../lib/verification-runner";
import { calculateSummary } from "../lib/verification-summary";

export type FilterStatus = "all" | "passed" | "warning" | "failed" | "not_run";

export function useVerification() {
  const [checks, setChecks] = React.useState<VerificationCheck[]>(INITIAL_VERIFICATION_CHECKS);
  const [isRunning, setIsRunning] = React.useState<boolean>(false);
  const [selectedCheckId, setSelectedCheckId] = React.useState<string | null>(INITIAL_VERIFICATION_CHECKS[0].id);
  const [filter, setFilter] = React.useState<FilterStatus>("all");
  const [search, setSearch] = React.useState<string>("");
  const [totalDuration, setTotalDuration] = React.useState<number>(0);

  const runAllChecks = React.useCallback(async () => {
    setIsRunning(true);
    const startTime = performance.now();

    // Mark all as running
    setChecks((prev) => prev.map((c) => ({ ...c, status: "running" as VerificationStatus })));

    const updatedChecks: VerificationCheck[] = [];

    for (const check of INITIAL_VERIFICATION_CHECKS) {
      // Small tick between checks for visual responsiveness
      await new Promise((resolve) => setTimeout(resolve, 30));
      const result = await executeCheck(check);
      updatedChecks.push(result);

      // Progressively update state
      setChecks((prev) => prev.map((c) => (c.id === result.id ? result : c)));
    }

    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    setTotalDuration(elapsed);
    setIsRunning(false);
  }, []);

  const runSingleCheck = React.useCallback(async (id: string) => {
    const target = checks.find((c) => c.id === id);
    if (!target) return;

    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "running" as VerificationStatus } : c))
    );

    const result = await executeCheck(target);
    setChecks((prev) => prev.map((c) => (c.id === id ? result : c)));
  }, [checks]);

  // Execute on initial client mount
  React.useEffect(() => {
    runAllChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary: VerificationSummary = React.useMemo(() => {
    return calculateSummary(checks, totalDuration);
  }, [checks, totalDuration]);

  const filteredChecks = React.useMemo(() => {
    return checks.filter((c) => {
      // Status filter
      if (filter !== "all") {
        if (filter === "not_run" && (c.status !== "not_run" && c.status !== "running")) return false;
        if (filter !== "not_run" && c.status !== filter) return false;
      }

      // Search query filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        const matchesCategory = c.category.toLowerCase().includes(q);
        const matchesId = c.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesId) return false;
      }

      return true;
    });
  }, [checks, filter, search]);

  const selectedCheck = React.useMemo(() => {
    const inFiltered = filteredChecks.find((c) => c.id === selectedCheckId);
    return inFiltered ?? filteredChecks[0] ?? checks[0];
  }, [checks, selectedCheckId, filteredChecks]);

  return {
    checks,
    filteredChecks,
    selectedCheck,
    selectedCheckId,
    setSelectedCheckId,
    summary,
    isRunning,
    filter,
    setFilter,
    search,
    setSearch,
    runAllChecks,
    runSingleCheck,
  };
}

