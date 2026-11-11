/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Public Exports
 */

export * from "./contracts/evolution.types";
export * from "./schemas/evolution.schemas";
export * from "./registry/strategy-registry";
export * from "./planning/requirement-extractor";
export * from "./planning/dependency-graph";
export * from "./planning/wave-planner";
export * from "./planning/intermediate-modeler";
export * from "./analysis/rollback-feasibility-analyzer";
export * from "./analysis/cutover-readiness-analyzer";
export * from "./analysis/migration-risk-analyzer";
export * from "./analysis/evolution-drift-analyzer";
export * from "./engine/evolution-engine";

