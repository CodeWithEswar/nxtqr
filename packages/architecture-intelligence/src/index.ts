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



