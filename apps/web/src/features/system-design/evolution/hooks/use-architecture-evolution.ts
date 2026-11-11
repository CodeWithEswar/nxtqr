"use client";

/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * React Hook: useArchitectureEvolution
 */

import { useState, useMemo, useCallback } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ArchitectureSnapshot } from "@nxtqr/architecture-intelligence";
import {
  architectureEvolutionEngine,
  migrationStrategyRegistry,
  type MigrationStrategyId,
  type MigrationWave,
  type MigrationTask,
  type RollbackPlan,
  type IntermediateArchitecture,
} from "@nxtqr/architecture-intelligence";

export interface EvolutionScenario {
  id: string;
  name: string;
  strategyId: MigrationStrategyId;
  description: string;
  sourceSnapshot: ArchitectureSnapshot;
  targetSnapshot: ArchitectureSnapshot;
}

// 1. Production Scenario 1: E-Commerce Monolith to Microservices Strangler Fig
const MONOLITH_SOURCE: ArchitectureSnapshot = {
  id: "snap-legacy-monolith-v1",
  title: "Legacy Monolith Architecture",
  schemaVersion: 1,
  provenance: "current-draft",
  revision: "rev-legacy-monolith-v1",
  createdAt: "2026-11-11T00:00:00Z",
  nodes: [
    {
      id: "mono-web-app",
      type: "custom",
      position: { x: 100, y: 120 },
      data: { label: "Legacy Monolithic Web App", nodeType: "service", tier: "application", status: "active" },
    } as BaseNode,
    {
      id: "mono-oracle-db",
      type: "custom",
      position: { x: 380, y: 120 },
      data: { label: "Legacy Monolithic Oracle DB", nodeType: "database", tier: "database", status: "active" },
    } as BaseNode,
  ],
  edges: [
    { id: "e-mono-db", source: "mono-web-app", target: "mono-oracle-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
  ],
  metadata: { environment: "datacenter-legacy", version: "1.4.2" },
};

const MICROSERVICES_TARGET: ArchitectureSnapshot = {
  id: "snap-cloud-microservices-v2",
  title: "Cloud Microservices Architecture",
  schemaVersion: 1,
  provenance: "what-if-proposal",
  revision: "rev-cloud-microservices-v2",
  createdAt: "2026-11-11T00:00:00Z",
  nodes: [
    {
      id: "api-gw-facade",
      type: "custom",
      position: { x: 50, y: 120 },
      data: { label: "Cloud API Gateway Facade", nodeType: "gateway", tier: "edge", status: "active" },
    } as BaseNode,
    {
      id: "order-svc",
      type: "custom",
      position: { x: 260, y: 40 },
      data: { label: "Order Microservice", nodeType: "service", tier: "application", status: "active" },
    } as BaseNode,
    {
      id: "payment-svc",
      type: "custom",
      position: { x: 260, y: 140 },
      data: { label: "Payment Microservice", nodeType: "service", tier: "application", status: "active" },
    } as BaseNode,
    {
      id: "catalog-svc",
      type: "custom",
      position: { x: 260, y: 240 },
      data: { label: "Catalog Microservice", nodeType: "service", tier: "application", status: "active" },
    } as BaseNode,
    {
      id: "order-db",
      type: "custom",
      position: { x: 480, y: 40 },
      data: { label: "Order PostgreSQL DB", nodeType: "database", tier: "database", status: "active" },
    } as BaseNode,
    {
      id: "payment-db",
      type: "custom",
      position: { x: 480, y: 140 },
      data: { label: "Payment Aurora DB", nodeType: "database", tier: "database", status: "active" },
    } as BaseNode,
    {
      id: "kafka-event-bus",
      type: "custom",
      position: { x: 260, y: 340 },
      data: { label: "Kafka Event Streaming Bus", nodeType: "queue", tier: "integration", status: "active" },
    } as BaseNode,
  ],
  edges: [
    { id: "e-gw-order", source: "api-gw-facade", target: "order-svc", type: "smoothstep", data: {} } as unknown as BaseEdge,
    { id: "e-gw-payment", source: "api-gw-facade", target: "payment-svc", type: "smoothstep", data: {} } as unknown as BaseEdge,
    { id: "e-gw-catalog", source: "api-gw-facade", target: "catalog-svc", type: "smoothstep", data: {} } as unknown as BaseEdge,
    { id: "e-order-db", source: "order-svc", target: "order-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
    { id: "e-payment-db", source: "payment-svc", target: "payment-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
    { id: "e-order-kafka", source: "order-svc", target: "kafka-event-bus", type: "smoothstep", data: {} } as unknown as BaseEdge,
  ],
  metadata: { environment: "cloud-native-prod", version: "2.0.0" },
};

// 2. Production Scenario 2: Multi-Region Cloud & Database Modernization
const REGIONAL_CLOUD_TARGET: ArchitectureSnapshot = {
  id: "snap-multi-region-v2",
  title: "Multi-Region Cloud Target",
  schemaVersion: 1,
  provenance: "what-if-proposal",
  revision: "rev-multi-region-v2",
  createdAt: "2026-11-11T00:00:00Z",
  nodes: [
    {
      id: "global-dns-gw",
      type: "custom",
      position: { x: 50, y: 100 },
      data: { label: "Route53 Global Anycast Gateway", nodeType: "gateway", tier: "edge", status: "active" },
    } as BaseNode,
    {
      id: "svc-us-east",
      type: "custom",
      position: { x: 260, y: 50 },
      data: { label: "Core Service (US-East)", nodeType: "service", tier: "application", status: "active" },
    } as BaseNode,
    {
      id: "svc-eu-west",
      type: "custom",
      position: { x: 260, y: 170 },
      data: { label: "Core Service (EU-West)", nodeType: "service", tier: "application", status: "active" },
    } as BaseNode,
    {
      id: "global-spanner-db",
      type: "custom",
      position: { x: 500, y: 110 },
      data: { label: "Global Distributed Multi-Region Spanner", nodeType: "database", tier: "database", status: "active" },
    } as BaseNode,
  ],
  edges: [
    { id: "e-dns-us", source: "global-dns-gw", target: "svc-us-east", type: "smoothstep", data: {} } as unknown as BaseEdge,
    { id: "e-dns-eu", source: "global-dns-gw", target: "svc-eu-west", type: "smoothstep", data: {} } as unknown as BaseEdge,
    { id: "e-us-db", source: "svc-us-east", target: "global-spanner-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
    { id: "e-eu-db", source: "svc-eu-west", target: "global-spanner-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
  ],
  metadata: { environment: "multi-region-cloud", version: "2.0.0" },
};

export const EVOLUTION_SCENARIOS: EvolutionScenario[] = [
  {
    id: "strangler-microservices",
    name: "Monolith to Microservices (Strangler Fig)",
    strategyId: "strangler_fig",
    description: "Progressively carve out domain services from an e-commerce monolith with CDC replication and canary traffic routing.",
    sourceSnapshot: MONOLITH_SOURCE,
    targetSnapshot: MICROSERVICES_TARGET,
  },
  {
    id: "multi-region-cloud",
    name: "Multi-Region Cloud & Database Modernization",
    strategyId: "replatform",
    description: "Replatform datacenter compute into multi-region cloud services backed by globally distributed transactional storage.",
    sourceSnapshot: MONOLITH_SOURCE,
    targetSnapshot: REGIONAL_CLOUD_TARGET,
  },
  {
    id: "progressive-cutover-canary",
    name: "High-Risk Point of No Return & Progressive Cutover",
    strategyId: "progressive_cutover",
    description: "Rigorous 4-step canary cutover with automated error-budget rollback triggers and explicit Wave 5 decommissioning.",
    sourceSnapshot: MONOLITH_SOURCE,
    targetSnapshot: MICROSERVICES_TARGET,
  },
];

export function useArchitectureEvolution(initialScenarioId: string = "strangler-microservices") {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId);
  const [selectedStrategyId, setSelectedStrategyId] = useState<MigrationStrategyId | null>(null);
  const [activeWaveNumber, setActiveWaveNumber] = useState<number>(1);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [simulationScenario, setSimulationScenario] = useState<
    "failed_canary_gate" | "cutover_abort_rollback" | "cdc_sync_lag_spike" | null
  >(null);

  const activeScenario = useMemo(() => {
    return EVOLUTION_SCENARIOS.find((s) => s.id === selectedScenarioId) || EVOLUTION_SCENARIOS[0];
  }, [selectedScenarioId]);

  const effectiveStrategyId = selectedStrategyId || activeScenario.strategyId;

  // Compute baseline analysis result
  const baselineResult = useMemo(() => {
    return architectureEvolutionEngine.planEvolution(
      activeScenario.sourceSnapshot,
      activeScenario.targetSnapshot,
      {
        projectId: `proj-${activeScenario.id}`,
        title: activeScenario.name,
        strategyId: effectiveStrategyId,
      }
    );
  }, [activeScenario, effectiveStrategyId]);

  // Apply What-If simulation if active
  const analysisResult = useMemo(() => {
    if (!simulationScenario) return baselineResult;
    return architectureEvolutionEngine.simulateWhatIf(baselineResult, simulationScenario);
  }, [baselineResult, simulationScenario]);

  const activeWave = useMemo<MigrationWave | undefined>(() => {
    return analysisResult.project.waves.find((w) => w.waveNumber === activeWaveNumber) || analysisResult.project.waves[0];
  }, [analysisResult, activeWaveNumber]);

  const activeWaveTasks = useMemo<MigrationTask[]>(() => {
    if (!activeWave) return [];
    return analysisResult.project.tasks.filter((t) => t.waveId === activeWave.id);
  }, [analysisResult, activeWave]);

  const activeRollbackPlan = useMemo<RollbackPlan | undefined>(() => {
    if (!activeWave) return undefined;
    return analysisResult.project.rollbackPlans.find((p) => p.waveId === activeWave.id);
  }, [analysisResult, activeWave]);

  const activeIntermediate = useMemo<IntermediateArchitecture | undefined>(() => {
    if (!activeWave) return undefined;
    return analysisResult.project.intermediateStates.find((i) => i.waveNumber === activeWave.waveNumber);
  }, [analysisResult, activeWave]);

  const selectedTask = useMemo<MigrationTask | undefined>(() => {
    if (!selectedTaskId) return activeWaveTasks[0];
    return analysisResult.project.tasks.find((t) => t.id === selectedTaskId);
  }, [analysisResult, selectedTaskId, activeWaveTasks]);

  const allStrategies = useMemo(() => {
    return migrationStrategyRegistry.getAllStrategies();
  }, []);

  const switchScenario = useCallback((scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setSelectedStrategyId(null);
    setSimulationScenario(null);
    setActiveWaveNumber(1);
    setSelectedTaskId(null);
  }, []);

  const switchStrategy = useCallback((stratId: MigrationStrategyId) => {
    setSelectedStrategyId(stratId);
  }, []);

  const triggerSimulation = useCallback(
    (sim: "failed_canary_gate" | "cutover_abort_rollback" | "cdc_sync_lag_spike" | null) => {
      setSimulationScenario(sim);
    },
    []
  );

  return {
    scenarios: EVOLUTION_SCENARIOS,
    activeScenario,
    allStrategies,
    effectiveStrategyId,
    analysisResult,
    activeWave,
    activeWaveNumber,
    activeWaveTasks,
    activeRollbackPlan,
    activeIntermediate,
    selectedTask,
    selectedTaskId,
    simulationScenario,
    switchScenario,
    switchStrategy,
    setActiveWaveNumber,
    setSelectedTaskId,
    triggerSimulation,
  };
}
