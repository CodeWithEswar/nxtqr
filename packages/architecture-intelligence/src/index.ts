// Contracts & Types
export * from "./contracts/health.types";
export * from "./contracts/health.schemas";

// Graph Algorithms
export * from "./algorithms/reachability";
export * from "./algorithms/cycles";
export * from "./algorithms/articulation-points";
export * from "./algorithms/critical-paths";
export * from "./algorithms/failure-domains";

// Core Engine & Indexes
export { GraphIndex, type EdgeConnectionInfo } from "./core/graph-index";
export { FindingAggregator } from "./core/finding-aggregator";
export {
  ArchitectureHealthEngine,
  architectureHealthEngine,
} from "./core/assessment-engine";

// Analyzers
export * from "./analyzers/analyzer-interface";
export { ReliabilityAnalyzer } from "./analyzers/reliability";
export { ScalabilityAnalyzer } from "./analyzers/scalability";
export { SecurityAnalyzer } from "./analyzers/security";
export { PerformanceAnalyzer } from "./analyzers/performance";
export { MaintainabilityAnalyzer } from "./analyzers/maintainability";
export { OperationsAnalyzer } from "./analyzers/operations";

// Scoring
export * from "./scoring/scoring-policy";
export * from "./scoring/score-calculator";

// Rules & Recommendations
export * from "./rules/rule-registry";

// Bottleneck Detection Engine (Phase 05.3.3)
export * from "./bottlenecks";

// Single Point of Failure (SPOF) Detection Engine (Phase 05.3.4)
export * from "./failure-analysis";

// Security Architecture Analysis Engine (Phase 05.3.5)
export * from "./security-analysis";

// Scalability Recommendations Engine (Phase 05.3.6)
export * from "./scalability";

// Reliability & Resilience Analysis Engine (Phase 05.3.7)
export * from "./reliability";

// Disambiguate exports between submodules
export type { EvidenceReference } from "./contracts/health.types";
export { EvidenceReferenceSchema } from "./contracts/health.schemas";
export type { RecommendationFeasibility } from "./scalability";
export type { CloudProviderId } from "./cost";
export { CloudProviderIdSchema } from "./cost";
export type { CloudProviderId as DeploymentCloudProviderId } from "./deployment/contracts/deployment.types";
export { CloudProviderIdSchema as DeploymentCloudProviderIdSchema } from "./deployment/schemas/deployment.schemas";

// Unified Intelligent Architecture Recommendations Engine (Phase 05.3.8)
export * from "./recommendations";

// Architecture Comparison & Change Intelligence Engine (Phase 05.3.9)
export * from "./comparison";

// AI Architecture Assistant & Engineering Copilot (Phase 05.3.10)
export * from "./ai-assistant";

// Capacity Planning & Workload Forecasting Engine (Phase 05.3.11)
export * from "./capacity-planning";

// Architecture Cost Estimation & Optimization Engine (Phase 05.3.14)
export * from "./cost";

// Architecture Reports & Technical Documentation Generator (Phase 05.3.12)
export * from "./reports";

// Architecture Design Review & Collaboration Engine (Phase 05.3.13)
export * from "./reviews";

// Architecture Simulation & Failure Testing Engine (Phase 05.3.15)
export * from "./simulation";

// Architecture Observability & Telemetry Mapping Engine (Phase 05.3.16)
export * from "./observability";

// Architecture Performance Benchmarking & Load Testing Planner (Phase 05.3.17)
export * from "./performance";

// Architecture Deployment Topology & Infrastructure Mapping Engine (Phase 05.3.18)
export * from "./deployment";

// Architecture Data Flow, Lineage & Privacy Analysis Engine (Phase 05.3.19)
export * from "./lineage";

// Architecture API Contracts & Service Interface Intelligence Engine (Phase 05.3.20)
export * from "./api-contracts";

// Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine (Phase 05.3.21)
export * from "./messaging";

// Architecture Caching, Data Consistency & State Management Intelligence Engine (Phase 05.3.22)
export * from "./cache-state";

// Architecture Database Design, Query Performance & Storage Intelligence Engine (Phase 05.3.23)
export * from "./database";

// Architecture Network, API Gateway & Traffic Engineering Intelligence Engine (Phase 05.3.24)
export * from "./network";


