"use client";

import * as React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  architecturePerformanceEngine,
  type BenchmarkDefinition,
  type BenchmarkRun,
  type BenchmarkComparisonResult,
  type PerformanceFinding,
  type PerformanceTarget,
  type WorkloadStage,
  type BenchmarkOperation,
  type BottleneckValidation,
  type ModelCalibrationProposal,
  type WorkloadProfile,
  type BenchmarkEnvironment,
} from "@nxtqr/architecture-intelligence";

export interface UseArchitecturePerformanceOptions {
  nodes: BaseNode[];
  edges: BaseEdge[];
  architectureId: string;
  projectId: string;
}

export function useArchitecturePerformance({
  nodes,
  edges: _edges,
  architectureId,
  projectId,
}: UseArchitecturePerformanceOptions) {
  // 1. Initial Default Environment
  const defaultEnvironment: BenchmarkEnvironment = React.useMemo(
    () => ({
      id: "env-staging-k8s",
      name: "Staging Kubernetes Cluster (us-east-1)",
      category: "staging",
      region: "us-east-1",
      computeSpec: "4x c6i.2xlarge worker nodes (16 vCPU, 32GB RAM)",
      generatorSpec: "k6 v0.48.0 distributed (2 runners)",
    }),
    []
  );

  // 2. Initial Operations derived from nodes or defaults
  const initialOperations = React.useMemo<BenchmarkOperation[]>(() => {
    if (nodes.length === 0) {
      return [
        { id: "op-ingress", name: "GET /api/v1/health", method: "GET", path: "/api/v1/health", weight: 50, expectedStatus: 200 },
        { id: "op-order", name: "POST /api/v1/orders", method: "POST", path: "/api/v1/orders", weight: 50, expectedStatus: 201 },
      ];
    }

    const serviceNodes = nodes.filter((n) => n.type === "service" || n.type === "api_gateway");
    if (serviceNodes.length === 0) {
      return [
        {
          id: `op-${nodes[0].id}`,
          name: `Call ${(nodes[0].data?.label as string) || nodes[0].id}`,
          method: "GET",
          path: `/api/${nodes[0].id}`,
          weight: 100,
          expectedStatus: 200,
          targetComponentId: nodes[0].id,
        },
      ];
    }

    const weightPerNode = Math.floor(100 / serviceNodes.length);
    return serviceNodes.map((node, i) => {
      const label = (node.data?.label as string) || node.id;
      const isMutating = label.toLowerCase().includes("order") || label.toLowerCase().includes("payment") || label.toLowerCase().includes("create");
      return {
        id: `op-${node.id}`,
        name: isMutating ? `POST /api/${node.id}` : `GET /api/${node.id}`,
        method: isMutating ? "POST" : "GET",
        path: `/api/v1/${node.id.replace(/_/g, "-")}`,
        weight: i === serviceNodes.length - 1 ? 100 - weightPerNode * (serviceNodes.length - 1) : weightPerNode,
        expectedStatus: isMutating ? 201 : 200,
        targetComponentId: node.id,
      };
    });
  }, [nodes]);

  // 3. Initial Targets
  const initialTargets: PerformanceTarget[] = React.useMemo(
    () => [
      { id: "tgt-p95", name: "P95 Latency SLA", metric: "p95_latency", operator: "lt", thresholdValue: 120, warningThresholdValue: 180, unit: "ms", scope: "global" },
      { id: "tgt-p99", name: "Tail P99 Latency SLA", metric: "p99_latency", operator: "lt", thresholdValue: 250, unit: "ms", scope: "global" },
      { id: "tgt-rps", name: "Peak Throughput Capacity", metric: "throughput_rps", operator: "gte", thresholdValue: 800, unit: "rps", scope: "global" },
      { id: "tgt-err", name: "Error Rate Budget", metric: "error_rate_pct", operator: "lt", thresholdValue: 0.1, warningThresholdValue: 0.5, unit: "%", scope: "global" },
    ],
    []
  );

  // 4. Initial Workload Profile (Closed-Loop by default)
  const [workloadProfile, setWorkloadProfile] = React.useState<WorkloadProfile>({
    modelType: "closed_loop",
    initialVUs: 20,
    maxVUs: 150,
    stages: [
      { id: "stg-warmup", name: "Cache Warmup", stageType: "warmup", durationSeconds: 30, targetVUs: 30 },
      { id: "stg-ramp", name: "Ramp-up to Peak", stageType: "ramp_up", durationSeconds: 60, targetVUs: 150 },
      { id: "stg-steady", name: "Sustained Peak", stageType: "steady", durationSeconds: 120, targetVUs: 150 },
      { id: "stg-cooldown", name: "Graceful Drain", stageType: "cooldown", durationSeconds: 30, targetVUs: 10 },
    ],
    thinkTimeMs: { min: 20, max: 100 },
  });

  const [operations, setOperations] = React.useState<BenchmarkOperation[]>(initialOperations);
  const [targets, setTargets] = React.useState<PerformanceTarget[]>(initialTargets);
  const [targetHost, setTargetHost] = React.useState<string>("https://staging-benchmark.nxtqr.internal");

  // Synchronize operations if nodes change
  React.useEffect(() => {
    setOperations(initialOperations);
  }, [initialOperations]);

  // Active Definition Object
  const definition: BenchmarkDefinition = React.useMemo(
    () => ({
      id: `def-${architectureId}`,
      projectId,
      architectureId,
      name: "Staging Architecture Performance Benchmark",
      description: "Automated workload simulation and load testing profile for system design verification.",
      testType: "load",
      workloadProfile,
      operations,
      targets,
      targetHost,
      environment: defaultEnvironment,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [architectureId, defaultEnvironment, operations, projectId, targetHost, targets, workloadProfile]
  );

  // 5. Initial Benchmark Runs History (Baseline Run #1)
  const initialBaselineRun = React.useMemo<BenchmarkRun>(() => {
    const rawK6 = {
      metrics: {
        http_req_duration: {
          values: {
            "p(50)": 28.4,
            "p(90)": 52.1,
            "p(95)": 68.5,
            "p(99)": 112.0,
            min: 5.2,
            max: 240.0,
            avg: 32.1,
          },
        },
        http_reqs: { values: { count: 180000, rate: 850.0 } },
        http_req_failed: { values: { count: 12, passes: 12, fails: 179988, rate: 0.000067 } },
        iterations: { values: { count: 180000, rate: 850.0 } },
        dropped_iterations: { values: { count: 0 } },
      },
      state: { testRunDurationMs: 240000 },
    };

    return architecturePerformanceEngine.importK6Result(rawK6, {
      definitionId: `def-${architectureId}`,
      architectureId,
      projectId,
      environment: defaultEnvironment,
      workloadProfile,
      runNumber: 1,
      targets: initialTargets,
    });
  }, [architectureId, defaultEnvironment, initialTargets, projectId, workloadProfile]);

  const [runs, setRuns] = React.useState<BenchmarkRun[]>([initialBaselineRun]);
  const [activeRunId, setActiveRunId] = React.useState<string>(initialBaselineRun.id);
  const [baselineRunId, setBaselineRunId] = React.useState<string>(initialBaselineRun.id);
  const [candidateRunId, setCandidateRunId] = React.useState<string>(initialBaselineRun.id);
  const [isComparing, setIsComparing] = React.useState<boolean>(false);

  const activeRun = React.useMemo(
    () => runs.find((r) => r.id === activeRunId) || runs[0] || initialBaselineRun,
    [activeRunId, initialBaselineRun, runs]
  );

  const baselineRun = React.useMemo(
    () => runs.find((r) => r.id === baselineRunId) || runs[0],
    [baselineRunId, runs]
  );

  const candidateRun = React.useMemo(
    () => runs.find((r) => r.id === candidateRunId) || activeRun,
    [activeRun, candidateRunId, runs]
  );

  // 6. Regression Comparison
  const comparisonResult = React.useMemo<BenchmarkComparisonResult | undefined>(() => {
    if (!baselineRun || !candidateRun || baselineRun.id === candidateRun.id) {
      return undefined;
    }
    return architecturePerformanceEngine.compareRuns(baselineRun, candidateRun);
  }, [baselineRun, candidateRun]);

  // 7. Bottleneck Validations
  const bottleneckValidations = React.useMemo<BottleneckValidation[]>(() => {
    const predictions = nodes.slice(0, 4).map((node) => ({
      nodeId: node.id,
      nodeLabel: (node.data?.label as string) || node.id,
      predictedSaturationRps: 750,
    }));
    return architecturePerformanceEngine.validateBottlenecks(nodes, predictions, activeRun);
  }, [activeRun, nodes]);

  // 8. Model Calibration Proposals
  const calibrationProposals = React.useMemo<ModelCalibrationProposal[]>(() => {
    return architecturePerformanceEngine.proposeCalibrations(nodes, activeRun);
  }, [activeRun, nodes]);

  // 9. Performance Findings
  const findings = React.useMemo<PerformanceFinding[]>(() => {
    return architecturePerformanceEngine.generateFindings(activeRun, comparisonResult);
  }, [activeRun, comparisonResult]);

  // Actions
  const setModelType = React.useCallback(
    (type: "closed_loop" | "open_loop") => {
      if (type === "closed_loop") {
        setWorkloadProfile({
          modelType: "closed_loop",
          initialVUs: 20,
          maxVUs: 150,
          stages: [
            { id: "stg-warmup", name: "Warmup", stageType: "warmup", durationSeconds: 30, targetVUs: 30 },
            { id: "stg-ramp", name: "Ramp-up", stageType: "ramp_up", durationSeconds: 60, targetVUs: 150 },
            { id: "stg-steady", name: "Peak Steady", stageType: "steady", durationSeconds: 120, targetVUs: 150 },
            { id: "stg-cooldown", name: "Cooldown", stageType: "cooldown", durationSeconds: 30, targetVUs: 10 },
          ],
          thinkTimeMs: { min: 20, max: 100 },
        });
      } else {
        setWorkloadProfile({
          modelType: "open_loop",
          targetRps: 1200,
          maxExecutionCapacityVUs: 400,
          allocatedVUs: 100,
          droppedIterationBehavior: "drop",
          stages: [
            { id: "stg-warmup", name: "Warmup", stageType: "warmup", durationSeconds: 30, targetRps: 300 },
            { id: "stg-ramp", name: "Ramp-up", stageType: "ramp_up", durationSeconds: 60, targetRps: 1200 },
            { id: "stg-peak", name: "Peak Arrival", stageType: "steady", durationSeconds: 120, targetRps: 1200 },
            { id: "stg-cooldown", name: "Cooldown", stageType: "cooldown", durationSeconds: 30, targetRps: 200 },
          ],
        });
      }
    },
    []
  );

  const updateStage = React.useCallback((stageId: string, updates: Partial<WorkloadStage>) => {
    setWorkloadProfile((prev) => ({
      ...prev,
      stages: prev.stages.map((s) => (s.id === stageId ? { ...s, ...updates } : s)),
    }));
  }, []);

  const addStage = React.useCallback((stage: WorkloadStage) => {
    setWorkloadProfile((prev) => ({
      ...prev,
      stages: [...prev.stages, stage],
    }));
  }, []);

  const removeStage = React.useCallback((stageId: string) => {
    setWorkloadProfile((prev) => {
      if (prev.stages.length <= 1) return prev;
      return {
        ...prev,
        stages: prev.stages.filter((s) => s.id !== stageId),
      };
    });
  }, []);

  const updateOperation = React.useCallback((opId: string, updates: Partial<BenchmarkOperation>) => {
    setOperations((prev) => prev.map((op) => (op.id === opId ? { ...op, ...updates } : op)));
  }, []);

  const addOperation = React.useCallback((op: BenchmarkOperation) => {
    setOperations((prev) => [...prev, op]);
  }, []);

  const removeOperation = React.useCallback((opId: string) => {
    setOperations((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((o) => o.id !== opId);
    });
  }, []);

  const addTarget = React.useCallback((tgt: PerformanceTarget) => {
    setTargets((prev) => [...prev, tgt]);
  }, []);

  const removeTarget = React.useCallback((tgtId: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== tgtId));
  }, []);

  const exportK6Script = React.useCallback(() => {
    return architecturePerformanceEngine.exportK6Script(definition);
  }, [definition]);

  const importK6Json = React.useCallback(
    (rawJson: string | Record<string, any>) => {
      const newRunNumber = runs.length + 1;
      const newRun = architecturePerformanceEngine.importK6Result(rawJson, {
        definitionId: definition.id,
        architectureId,
        projectId,
        environment: defaultEnvironment,
        workloadProfile,
        runNumber: newRunNumber,
        targets,
      });

      setRuns((prev) => [newRun, ...prev]);
      setActiveRunId(newRun.id);
      setCandidateRunId(newRun.id);
      return newRun;
    },
    [architectureId, defaultEnvironment, definition.id, projectId, runs.length, targets, workloadProfile]
  );

  const runSimulatedBenchmark = React.useCallback(
    (stressMultiplier: number = 1.0) => {
      const newRunNumber = runs.length + 1;
      const isOpenLoop = workloadProfile.modelType === "open_loop";
      const baseRps = isOpenLoop ? (workloadProfile.targetRps || 1000) * stressMultiplier : 850 * stressMultiplier;

      // Realistic response times based on stressMultiplier
      const p50 = Number((24 + stressMultiplier * 6).toFixed(1));
      const p90 = Number((45 + stressMultiplier * 15).toFixed(1));
      const p95 = Number((65 + stressMultiplier * 25).toFixed(1));
      const p99 = Number((110 + stressMultiplier * 50).toFixed(1));
      const errors = stressMultiplier > 1.4 ? Math.round(stressMultiplier * 45) : Math.round(stressMultiplier * 8);
      const dropped = isOpenLoop && stressMultiplier > 1.3 ? Math.round((stressMultiplier - 1.2) * 80) : 0;
      const totalReqs = Math.round(baseRps * 180);

      const syntheticK6 = {
        metrics: {
          http_req_duration: {
            values: { "p(50)": p50, "p(90)": p90, "p(95)": p95, "p(99)": p99, min: 4.5, max: p99 * 2.2, avg: p50 * 1.2 },
          },
          http_reqs: { values: { count: totalReqs, rate: baseRps } },
          http_req_failed: { values: { count: errors, passes: errors, fails: totalReqs - errors, rate: errors / totalReqs } },
          iterations: { values: { count: totalReqs, rate: baseRps } },
          dropped_iterations: { values: { count: dropped } },
        },
        state: { testRunDurationMs: 180000 },
      };

      const newRun = architecturePerformanceEngine.importK6Result(syntheticK6, {
        definitionId: definition.id,
        architectureId,
        projectId,
        environment: defaultEnvironment,
        workloadProfile,
        runNumber: newRunNumber,
        targets,
      });

      setRuns((prev) => [newRun, ...prev]);
      setActiveRunId(newRun.id);
      setCandidateRunId(newRun.id);
      return newRun;
    },
    [architectureId, defaultEnvironment, definition.id, projectId, runs.length, targets, workloadProfile]
  );

  return {
    definition,
    workloadProfile,
    operations,
    targets,
    targetHost,
    runs,
    activeRun,
    activeRunId,
    baselineRun,
    candidateRun,
    isComparing,
    comparisonResult,
    bottleneckValidations,
    calibrationProposals,
    findings,
    // Setters & Actions
    setTargetHost,
    setModelType,
    updateStage,
    addStage,
    removeStage,
    updateOperation,
    addOperation,
    removeOperation,
    addTarget,
    removeTarget,
    setActiveRunId,
    setBaselineRunId,
    setCandidateRunId,
    setIsComparing,
    exportK6Script,
    importK6Json,
    runSimulatedBenchmark,
  };
}
