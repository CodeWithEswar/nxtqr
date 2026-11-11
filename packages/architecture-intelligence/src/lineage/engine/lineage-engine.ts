/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Master Facade Engine
 */

import type {
  ArchitectureDataLineageModel,
  CrossBorderTransferFinding,
  DeletionPropagationImpact,
  LineageDriftFinding,
  LineageTraversalResult,
  PrivacyFinding,
} from "../contracts/lineage.types";
import { ArchitectureDataLineageModelSchema } from "../schemas/lineage.schemas";
import { LineageTraversalEngine } from "../traversal/lineage-traversal";
import {
  ClassificationPropagationEngine,
  type ModelClassificationPropagationResult,
} from "../analysis/classification-propagation";
import { PrivacyRiskAnalyzer } from "../analysis/privacy-risk-analyzer";
import { DeletionPropagationAnalyzer } from "../analysis/deletion-propagation";
import {
  RetentionCoverageAnalyzer,
  type ArchitectureRetentionReport,
} from "../analysis/retention-coverage";
import { TransferAnalyzer } from "../analysis/transfer-analyzer";
import { LineageDriftDetector, type ObservedTrafficFlow } from "../analysis/drift-detector";
import { OpenApiImporter, type OpenApiImportResult } from "../imports/openapi-importer";

export class ArchitectureDataLineageEngine {
  /**
   * Validates a complete lineage model against domain schemas.
   */
  public validateModel(model: unknown): ArchitectureDataLineageModel {
    return ArchitectureDataLineageModelSchema.parse(model);
  }

  /**
   * Traverses upstream and downstream data lineage for a specific asset.
   */
  public traverseAsset(assetId: string, model: ArchitectureDataLineageModel): LineageTraversalResult {
    return LineageTraversalEngine.traverseAsset(assetId, model);
  }

  /**
   * Propagates data classifications along all flows and transformations conservatively.
   */
  public propagateClassifications(model: ArchitectureDataLineageModel): ModelClassificationPropagationResult {
    return ClassificationPropagationEngine.propagate(model);
  }

  /**
   * Performs deterministic privacy and data governance risk analysis.
   */
  public analyzePrivacyRisks(model: ArchitectureDataLineageModel): PrivacyFinding[] {
    return PrivacyRiskAnalyzer.analyze(model);
  }

  /**
   * Evaluates deletion propagation impact and "Right-to-be-Forgotten" readiness.
   */
  public analyzeDeletionImpact(
    assetId: string,
    model: ArchitectureDataLineageModel
  ): DeletionPropagationImpact {
    const asset = model.assets.find((a) => a.id === assetId);
    if (!asset) {
      throw new Error(`Data asset with ID "${assetId}" not found in architecture lineage model.`);
    }
    return DeletionPropagationAnalyzer.analyzeAsset(asset, model);
  }

  /**
   * Evaluates retention schedule coverage across all assets and durable stores.
   */
  public evaluateRetentionCoverage(model: ArchitectureDataLineageModel): ArchitectureRetentionReport {
    return RetentionCoverageAnalyzer.evaluateModel(model);
  }

  /**
   * Identifies cross-border, cross-jurisdiction, and third-party data flows.
   */
  public analyzeTransfers(model: ArchitectureDataLineageModel): CrossBorderTransferFinding[] {
    return TransferAnalyzer.analyzeTransfers(model);
  }

  /**
   * Detects lineage drift between modeled architecture and observed traffic telemetry.
   */
  public detectDrift(
    model: ArchitectureDataLineageModel,
    observedFlows: ObservedTrafficFlow[]
  ): LineageDriftFinding[] {
    return LineageDriftDetector.detectDrift(model, observedFlows);
  }

  /**
   * Safely parses OpenAPI 3.x specifications into assets and flows.
   */
  public importOpenApi(
    specContent: string | Record<string, unknown>,
    sourceComponentId: string,
    defaultConsumerId: string,
    architectureId: string,
    projectId: string
  ): OpenApiImportResult {
    return OpenApiImporter.parse(specContent, sourceComponentId, defaultConsumerId, architectureId, projectId);
  }
}

export const architectureDataLineageEngine = new ArchitectureDataLineageEngine();
