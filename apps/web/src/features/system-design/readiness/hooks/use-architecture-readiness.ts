/**
 * @file apps/web/src/features/system-design/readiness/hooks/use-architecture-readiness.ts
 * Hook for managing Architecture Intelligence Production Readiness & Final Integration state.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  ProductionReadinessAssessment,
  RepositoryAuditResult,
  PerformanceBenchmarkMetrics,
  ReleaseReadinessPillar,
  ReleaseGateItem,
  CapabilityInventoryItem,
  architectureReadinessEngine,
  RepositoryAuditor,
  PerformanceBenchmarker,
  CAPABILITY_INVENTORY,
} from '@nxtqr/architecture-intelligence';

export interface UseArchitectureReadinessOptions {
  projectId: string;
  revisionId?: string;
  nodes?: any[];
  edges?: any[];
  autoAssess?: boolean;
}

export function useArchitectureReadiness({
  projectId,
  revisionId = 'rev-head',
  nodes = [],
  edges = [],
  autoAssess = true,
}: UseArchitectureReadinessOptions) {
  const [assessment, setAssessment] = useState<ProductionReadinessAssessment | null>(null);
  const [auditResult, setAuditResult] = useState<RepositoryAuditResult | null>(null);
  const [benchmarks, setBenchmarks] = useState<PerformanceBenchmarkMetrics | null>(null);
  const [capabilities] = useState<CapabilityInventoryItem[]>(CAPABILITY_INVENTORY);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedPillar, setSelectedPillar] = useState<ReleaseReadinessPillar | 'all'>('all');
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const runAssessment = useCallback(async () => {
    setIsRunning(true);
    try {
      const res = await architectureReadinessEngine.assessProductionReadiness({
        projectId,
        revisionId,
        nodes,
        edges,
      });
      setAssessment(res);
      setBenchmarks(res.benchmarks);
    } catch (err) {
      console.error('Failed to run production readiness assessment:', err);
    } finally {
      setIsRunning(false);
    }
  }, [projectId, revisionId, nodes, edges]);

  const runAudit = useCallback(() => {
    const auditor = new RepositoryAuditor();
    const result = auditor.audit();
    setAuditResult(result);
    return result;
  }, []);

  const runBenchmark = useCallback(async () => {
    setIsRunning(true);
    try {
      const benchmarker = new PerformanceBenchmarker();
      const metrics = await benchmarker.benchmarkWorkload({
        nodeCount: nodes.length > 0 ? nodes.length : 20,
        edgeDensity: 1.4,
      });
      setBenchmarks(metrics);
      if (assessment) {
        setAssessment({
          ...assessment,
          benchmarks: metrics,
        });
      }
    } catch (err) {
      console.error('Failed to run performance benchmark:', err);
    } finally {
      setIsRunning(false);
    }
  }, [nodes, assessment]);

  const toggleGate = useCallback(
    (gateId: string, newStatus: ReleaseGateItem['status']) => {
      if (!assessment) return;
      const updatedGates = assessment.gates.map((g) =>
        g.id === gateId ? { ...g, status: newStatus } : g
      );
      // Re-evaluate assessment with the new gate status
      architectureReadinessEngine
        .assessProductionReadiness({
          projectId,
          revisionId,
          nodes,
          edges,
          customGates: updatedGates,
        })
        .then((updated) => setAssessment(updated));
    },
    [assessment, projectId, revisionId, nodes, edges]
  );

  useEffect(() => {
    runAudit();
    if (autoAssess) {
      runAssessment();
    }
  }, [autoAssess, runAudit, runAssessment]);

  const filteredCapabilities = capabilities.filter((c) => {
    const matchesSearch =
      searchQuery === '' ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.modulePath.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return {
    assessment,
    auditResult,
    benchmarks,
    capabilities: filteredCapabilities,
    allCapabilitiesCount: capabilities.length,
    isRunning,
    selectedPillar,
    selectedGateId,
    searchQuery,
    categoryFilter,
    statusFilter,
    setSelectedPillar,
    setSelectedGateId,
    setSearchQuery,
    setCategoryFilter,
    setStatusFilter,
    runAssessment,
    runAudit,
    runBenchmark,
    toggleGate,
  };
}
