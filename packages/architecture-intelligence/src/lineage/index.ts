/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Lineage Module Entry Point
 */

export * from "./contracts/lineage.types";
export * from "./schemas/lineage.schemas";
export * from "./traversal/lineage-indexes";
export * from "./traversal/lineage-traversal";
export * from "./analysis/classification-propagation";
export * from "./analysis/privacy-risk-analyzer";
export * from "./analysis/retention-coverage";
export * from "./analysis/deletion-propagation";
export * from "./analysis/transfer-analyzer";
export * from "./analysis/drift-detector";
export * from "./imports/openapi-importer";
export * from "./imports/import-registry";
export * from "./engine/lineage-engine";

