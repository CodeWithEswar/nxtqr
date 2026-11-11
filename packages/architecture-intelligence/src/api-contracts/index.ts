/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * API Contracts Module Entry Point
 */

export * from "./contracts/contract.types";
export * from "./schemas/contract.schemas";
export * from "./adapters/adapter.interface";
export * from "./adapters/openapi-adapter";
export * from "./adapters/graphql-adapter";
export * from "./adapters/protobuf-adapter";
export * from "./adapters/asyncapi-adapter";
export * from "./adapters/adapter-registry";
export * from "./compatibility/contract-diff";
export * from "./compatibility/consumer-impact";
export * from "./analysis/contract-coverage";
export * from "./analysis/contract-drift";
export * from "./analysis/migration-planner";
export * from "./engine/contract-engine";

