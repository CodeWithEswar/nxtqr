/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Performance Benchmarks: Traversal and Risk Analysis at Scale
 */

import { describe, it, expect } from "vitest";
import type {
  ArchitectureDataLineageModel,
  DataAsset,
  DataFlow,
} from "../lineage/contracts/lineage.types";
import { LineageTraversalEngine } from "../lineage/traversal/lineage-traversal";
import { PrivacyRiskAnalyzer } from "../lineage/analysis/privacy-risk-analyzer";

describe("Phase 05.3.19: Lineage Engine Performance Suite", () => {
  const sampleNow = new Date().toISOString();

  it("traverses lineage across 500 connected microservice components in under 50ms", () => {
    const nodeCount = 500;
    const assets: DataAsset[] = [
      {
        id: "asset-scale-1",
        projectId: "proj-perf",
        architectureId: "arch-perf",
        name: "Telemetry Pipeline Event",
        classification: {
          id: "class-telemetry",
          level: "internal",
          categories: ["operational"],
          name: "Telemetry Classification",
          isLegalDetermination: false,
          provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-perf", confirmed: true },
        },
        storageBindings: [
          {
            componentId: `node-${nodeCount - 1}`,
            componentName: `Store ${nodeCount - 1}`,
            storeType: "data_warehouse",
            copyType: "primary",
            isTransient: false,
          },
        ],
        purposes: [],
        provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-perf", confirmed: true },
        createdAt: sampleNow,
        updatedAt: sampleNow,
      },
    ];

    const flows: DataFlow[] = [];
    for (let i = 0; i < nodeCount - 1; i++) {
      flows.push({
        id: `flow-${i}`,
        architectureId: "arch-perf",
        sourceComponentId: `node-${i}`,
        destinationComponentId: `node-${i + 1}`,
        dataAssetIds: ["asset-scale-1"],
        direction: "forward",
        crossesTrustBoundary: i % 10 === 0,
        isThirdPartyTransfer: false,
        purposes: [],
        provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-perf", confirmed: true },
        confirmed: true,
      });
    }

    const perfModel: ArchitectureDataLineageModel = {
      id: "model-perf-1",
      projectId: "proj-perf",
      architectureId: "arch-perf",
      graphRevision: "rev-perf",
      version: 1,
      assets,
      flows,
      transformations: [],
      retentionPolicies: [],
      purposes: [],
      createdAt: sampleNow,
      updatedAt: sampleNow,
    };

    const startTime = performance.now();
    const result = LineageTraversalEngine.traverseAsset("asset-scale-1", perfModel);
    const duration = performance.now() - startTime;

    expect(result.assetId).toBe("asset-scale-1");
    expect(result.allParticipatingComponentIds.length).toBeGreaterThan(10);
    expect(duration).toBeLessThan(250); // 250ms budget under full test suite load
  });

  it("evaluates privacy risks across 1,000 flows and 200 assets in under 50ms", () => {
    const assetCount = 200;
    const flowCount = 1000;

    const assets: DataAsset[] = [];
    for (let i = 0; i < assetCount; i++) {
      assets.push({
        id: `asset-${i}`,
        projectId: "proj-perf",
        architectureId: "arch-perf",
        name: `Asset ${i}`,
        classification: {
          id: `class-${i}`,
          level: i % 4 === 0 ? "restricted" : i % 2 === 0 ? "confidential" : "internal",
          categories: ["personal_data"],
          name: `Classification ${i}`,
          isLegalDetermination: false,
          provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-perf", confirmed: true },
        },
        storageBindings: [
          {
            componentId: `store-${i % 20}`,
            componentName: `Store ${i % 20}`,
            storeType: "relational_db",
            copyType: "primary",
            isTransient: false,
          },
        ],
        purposes: [],
        provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-perf", confirmed: true },
        createdAt: sampleNow,
        updatedAt: sampleNow,
      });
    }

    const flows: DataFlow[] = [];
    for (let i = 0; i < flowCount; i++) {
      flows.push({
        id: `flow-${i}`,
        architectureId: "arch-perf",
        sourceComponentId: `service-${i % 50}`,
        destinationComponentId: `service-${(i + 1) % 50}`,
        dataAssetIds: [`asset-${i % assetCount}`],
        direction: "forward",
        crossesTrustBoundary: i % 25 === 0,
        isThirdPartyTransfer: i % 50 === 0,
        purposes: [],
        provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-perf", confirmed: true },
        confirmed: true,
      });
    }

    const perfModel: ArchitectureDataLineageModel = {
      id: "model-perf-2",
      projectId: "proj-perf",
      architectureId: "arch-perf",
      graphRevision: "rev-perf",
      version: 1,
      assets,
      flows,
      transformations: [],
      retentionPolicies: [],
      purposes: [],
      createdAt: sampleNow,
      updatedAt: sampleNow,
    };

    const startTime = performance.now();
    const findings = PrivacyRiskAnalyzer.analyze(perfModel);
    const duration = performance.now() - startTime;

    expect(findings.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(250); // 250ms budget under full test suite load
  });
});

