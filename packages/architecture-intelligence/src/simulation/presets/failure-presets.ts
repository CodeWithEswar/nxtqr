import type { FailureScenario, CriticalUserJourney } from "../contracts/simulation.types";

export interface SimulationPresetTemplate {
  id: string;
  name: string;
  description: string;
  category: "service" | "database" | "cache" | "queue" | "network" | "infrastructure";
  buildScenario(params: {
    architectureId: string;
    graphRevision: string;
    targetNodeId: string;
    targetNodeLabel?: string;
    secondaryNodeId?: string;
    criticalJourneys?: CriticalUserJourney[];
  }): FailureScenario;
}

export const SIMULATION_PRESETS: Record<string, SimulationPresetTemplate> = {
  primary_database_outage: {
    id: "primary_database_outage",
    name: "Primary Database Hardware Outage",
    description: "Simulates sudden compute/disk hardware failure on primary database, testing replica promotion and failover lag.",
    category: "database",
    buildScenario: ({ architectureId, graphRevision, targetNodeId, targetNodeLabel, criticalJourneys = [] }) => ({
      id: `sc-db-outage-${Date.now()}`,
      architectureId,
      graphRevision,
      name: `Primary DB Outage: ${targetNodeLabel || targetNodeId}`,
      description: "Primary database crashes at T=5s. Tests whether read replicas and failover mechanisms maintain service.",
      durationMs: 60_000,
      injections: [
        {
          id: "inj-db-crash",
          name: "Database Instance Failure",
          type: "database_outage",
          targetId: targetNodeId,
          targetType: "node",
          startMs: 5_000,
          durationMs: 40_000,
          severity: "critical",
          parameters: { failoverDelayMs: 15_000, recoveryTimeMs: 40_000 },
          recoveryBehavior: "automatic",
        },
      ],
      criticalJourneys,
      targetRtoMs: 30_000,
      targetRpoMs: 0,
      assumptions: [
        "Primary database hardware becomes unresponsive at T=5s.",
        "Read replicas survive if configured in a separate availability zone.",
        "Database proxy or client DNS failover delay is modeled at 15s.",
      ],
    }),
  },

  cache_outage: {
    id: "cache_outage",
    name: "In-Memory Cache Cluster Outage",
    description: "Simulates Redis cache cluster crash, testing cache stampede, circuit breakers, and database query load amplification.",
    category: "cache",
    buildScenario: ({ architectureId, graphRevision, targetNodeId, targetNodeLabel, criticalJourneys = [] }) => ({
      id: `sc-cache-outage-${Date.now()}`,
      architectureId,
      graphRevision,
      name: `Cache Outage: ${targetNodeLabel || targetNodeId}`,
      description: "Cache cluster fails at T=10s. Evaluates direct backend database read surge.",
      durationMs: 45_000,
      injections: [
        {
          id: "inj-cache-fail",
          name: "Cache Cluster Failure",
          type: "cache_outage",
          targetId: targetNodeId,
          targetType: "node",
          startMs: 10_000,
          durationMs: 25_000,
          severity: "high",
          parameters: { recoveryTimeMs: 25_000 },
          recoveryBehavior: "automatic",
        },
      ],
      criticalJourneys,
      targetRtoMs: 15_000,
      targetRpoMs: 0,
      assumptions: [
        "In-memory Redis cache cluster becomes completely unreachable at T=10s.",
        "100% of read traffic bypasses cache and hits downstream relational store.",
      ],
    }),
  },

  external_api_timeout: {
    id: "external_api_timeout",
    name: "External Dependency Timeout & Circuit Breaker",
    description: "Simulates third-party payment/auth gateway latency surge and timeouts, testing caller circuit breaker isolation.",
    category: "service",
    buildScenario: ({ architectureId, graphRevision, targetNodeId, targetNodeLabel, criticalJourneys = [] }) => ({
      id: `sc-ext-timeout-${Date.now()}`,
      architectureId,
      graphRevision,
      name: `API Timeout: ${targetNodeLabel || targetNodeId}`,
      description: "External API incurs 5,000ms latency spike and 80% error rate at T=5s. Tests circuit breaker tripping.",
      durationMs: 50_000,
      injections: [
        {
          id: "inj-api-timeout",
          name: "External API Degradation",
          type: "external_dependency_timeout",
          targetId: targetNodeId,
          targetType: "node",
          startMs: 5_000,
          durationMs: 30_000,
          severity: "high",
          parameters: { latencyMs: 5_000, errorRatePct: 80 },
          recoveryBehavior: "automatic",
        },
      ],
      criticalJourneys,
      targetRtoMs: 20_000,
      assumptions: [
        "Third-party API experiences network latency exceeding standard timeout limits.",
        "Callers with circuit breakers trip to open state to prevent thread pool exhaustion.",
      ],
    }),
  },

  availability_zone_outage: {
    id: "availability_zone_outage",
    name: "Availability Zone Multi-Service Outage",
    description: "Simulates complete loss of an entire datacenter availability zone, testing multi-AZ redundancy and remaining capacity.",
    category: "infrastructure",
    buildScenario: ({ architectureId, graphRevision, targetNodeId, targetNodeLabel, criticalJourneys = [] }) => ({
      id: `sc-az-outage-${Date.now()}`,
      architectureId,
      graphRevision,
      name: `AZ Failure: ${targetNodeLabel || targetNodeId}`,
      description: "Availability Zone A experiences utility power loss. Evaluates surviving AZ instances.",
      durationMs: 60_000,
      injections: [
        {
          id: "inj-az-outage",
          name: "AZ Power Failure",
          type: "availability_zone_outage",
          targetId: targetNodeId,
          targetType: "failure_domain",
          startMs: 8_000,
          durationMs: 40_000,
          severity: "critical",
          parameters: { availabilityZone: "us-east-1a" },
          recoveryBehavior: "manual",
        },
      ],
      criticalJourneys,
      targetRtoMs: 45_000,
      assumptions: [
        "All instances deployed strictly in Zone A are immediately unreachable.",
        "Multi-AZ components in Zone B and C assume 100% of incoming production load.",
      ],
    }),
  },
};
