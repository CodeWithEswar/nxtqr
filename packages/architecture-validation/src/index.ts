// Contracts & Types
export * from "./contracts/validation.types";
export * from "./contracts/validation.schemas";

// Core Resolvers & Validators
export { CapabilityResolver, capabilityResolver } from "./core/capability-resolver";
export { PortResolver, portResolver } from "./core/port-resolver";
export { ConnectionValidator, connectionValidator } from "./core/connection-validator";
export { GraphValidator, graphValidator } from "./core/graph-validator";
export { FindingAggregator } from "./core/finding-aggregator";
export {
  generateRuleCoverageMatrix,
  type ComponentCoverageEntry,
  type CategoryCoverageSummary,
  type RuleCoverageMatrixReport,
} from "./core/coverage-matrix";
export {
  ArchitectureValidationEngine,
  architectureValidationEngine,
} from "./core/validation-engine";

// Rules
export * from "./rules";

// Messages & Documentation Mappings
export * from "./messages/validation-messages";
