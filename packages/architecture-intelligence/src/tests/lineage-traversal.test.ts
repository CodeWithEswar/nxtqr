/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Unit Tests: Traversal, Propagation, Retention, Deletion, and Privacy Rules
 */

import { describe, it, expect } from "vitest";
import type {
  ArchitectureDataLineageModel,
  DataAsset,
  DataFlow,
  DataTransformation,
} from "../lineage/contracts/lineage.types";
import { architectureDataLineageEngine } from "../lineage/engine/lineage-engine";
import { LineageTraversalEngine } from "../lineage/traversal/lineage-traversal";
import { ClassificationPropagationEngine } from "../lineage/analysis/classification-propagation";
import { PrivacyRiskAnalyzer } from "../lineage/analysis/privacy-risk-analyzer";
import { DeletionPropagationAnalyzer } from "../lineage/analysis/deletion-propagation";
import { RetentionCoverageAnalyzer } from "../lineage/analysis/retention-coverage";
import { TransferAnalyzer } from "../lineage/analysis/transfer-analyzer";
import { LineageDriftDetector } from "../lineage/analysis/drift-detector";

describe("Phase 05.3.19: Data Flow, Lineage & Privacy Analysis Engine", () => {
  const sampleNow = new Date().toISOString();

  const customerAsset: DataAsset = {
    id: "asset-customer-pii",
    projectId: "proj-1",
    architectureId: "arch-1",
    name: "Customer Account Profile",
    classification: {
      id: "class-pii",
      level: "confidential",
      categories: ["personal_data"],
      name: "Customer PII Classification",
      isLegalDetermination: false,
      provenance: {
        source: "modeled",
        timestamp: sampleNow,
        graphRevision: "rev-1",
        confirmed: true,
      },
    },
    owner: {
      id: "owner-1",
      businessOwner: "Identity Team",
      technicalOwner: "Auth Eng",
      responsibleServiceId: "auth-service",
    },
    fields: [
      {
        id: "f-1",
        name: "email",
        logicalType: "string",
        isRequired: true,
        classification: {
          id: "class-f1",
          level: "confidential",
          categories: ["personal_data"],
          name: "Email Classification",
          isLegalDetermination: false,
          provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
        },
      },
    ],
    storageBindings: [
      {
        componentId: "db-primary",
        componentName: "PostgreSQL Primary",
        storeType: "relational_db",
        copyType: "primary",
        isTransient: false,
        jurisdictionCountry: "US",
        regionId: "us-east-1",
      },
      {
        componentId: "db-replica",
        componentName: "PostgreSQL Read Replica",
        storeType: "relational_db",
        copyType: "read_replica",
        isTransient: false,
        jurisdictionCountry: "US",
        regionId: "us-east-1",
      },
      {
        componentId: "redis-cache",
        componentName: "Redis Session Cache",
        storeType: "cache",
        copyType: "cache_copy",
        isTransient: true,
      },
      {
        componentId: "analytics-dw",
        componentName: "Snowflake Warehouse",
        storeType: "data_warehouse",
        copyType: "analytics_copy",
        isTransient: false,
      },
    ],
    retentionPolicy: {
      id: "ret-1",
      name: "Customer Data Retention Policy",
      durationDays: 365,
      trigger: "account_closure",
      deletionMethod: "hard_delete",
      hasBackupExemption: true,
    },
    deletionPolicy: {
      id: "del-1",
      name: "GDPR RTBF Cascade Policy",
      targetAssetId: "asset-customer-pii",
      authoritativeComponentId: "db-primary",
      cascadesToDestinations: true,
      invalidatesCaches: true,
      propagatesToReplicas: true,
      notifiesThirdParties: true,
    },
    purposes: [
      {
        id: "purp-auth",
        name: "Authentication & Identity Management",
        category: "authentication",
      },
    ],
    provenance: {
      source: "modeled",
      timestamp: sampleNow,
      graphRevision: "rev-1",
      confirmed: true,
    },
    createdAt: sampleNow,
    updatedAt: sampleNow,
  };

  const paymentAsset: DataAsset = {
    id: "asset-payment-card",
    projectId: "proj-1",
    architectureId: "arch-1",
    name: "Credit Card Payment Details",
    classification: {
      id: "class-card",
      level: "restricted",
      categories: ["payment", "financial"],
      name: "Restricted Payment Data",
      isLegalDetermination: false,
      provenance: {
        source: "modeled",
        timestamp: sampleNow,
        graphRevision: "rev-1",
        confirmed: true,
      },
    },
    storageBindings: [
      {
        componentId: "vault-db",
        componentName: "PCI Secure Vault",
        storeType: "relational_db",
        copyType: "primary",
        isTransient: false,
      },
    ],
    purposes: [
      {
        id: "purp-pay",
        name: "Order Processing",
        category: "transaction_processing",
      },
    ],
    provenance: {
      source: "modeled",
      timestamp: sampleNow,
      graphRevision: "rev-1",
      confirmed: true,
    },
    createdAt: sampleNow,
    updatedAt: sampleNow,
  };

  const sampleFlows: DataFlow[] = [
    {
      id: "flow-1",
      architectureId: "arch-1",
      name: "API Ingress to Auth Service",
      sourceComponentId: "api-gateway",
      destinationComponentId: "auth-service",
      dataAssetIds: ["asset-customer-pii"],
      direction: "forward",
      protocol: "HTTPS",
      encryptionInTransit: { configured: true, tlsVersion: "TLS 1.3" },
      crossesTrustBoundary: true,
      trustBoundaryDetails: "Public Internet -> Private VPC",
      isThirdPartyTransfer: false,
      purposes: [],
      provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
      confirmed: true,
    },
    {
      id: "flow-2",
      architectureId: "arch-1",
      name: "Auth Service to Primary Database",
      sourceComponentId: "auth-service",
      destinationComponentId: "db-primary",
      dataAssetIds: ["asset-customer-pii"],
      direction: "forward",
      protocol: "PostgreSQL Wire",
      encryptionInTransit: { configured: true, tlsVersion: "TLS 1.3" },
      crossesTrustBoundary: false,
      isThirdPartyTransfer: false,
      purposes: [],
      provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
      confirmed: true,
    },
    {
      id: "flow-3",
      architectureId: "arch-1",
      name: "Auth Service to Redis Cache",
      sourceComponentId: "auth-service",
      destinationComponentId: "redis-cache",
      dataAssetIds: ["asset-customer-pii"],
      direction: "forward",
      protocol: "RESP",
      crossesTrustBoundary: false,
      isThirdPartyTransfer: false,
      purposes: [],
      provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
      confirmed: true,
    },
    {
      id: "flow-4",
      architectureId: "arch-1",
      name: "Checkout Service to Payment Gateway",
      sourceComponentId: "checkout-service",
      destinationComponentId: "stripe-provider",
      dataAssetIds: ["asset-payment-card"],
      direction: "forward",
      protocol: "HTTPS",
      encryptionInTransit: { configured: true, tlsVersion: "TLS 1.3" },
      crossesTrustBoundary: true,
      isThirdPartyTransfer: true,
      recipientOrganization: "Stripe Inc",
      sourceJurisdiction: "EU",
      destinationJurisdiction: "US",
      purposes: [],
      provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
      confirmed: true,
    },
  ];

  const sampleTransformations: DataTransformation[] = [
    {
      id: "trans-tokenize",
      type: "tokenization",
      componentId: "checkout-service",
      name: "Tokenize Card Numbers",
      inputAssetIds: ["asset-payment-card"],
      outputAssetIds: ["asset-tokenized-card"],
      resultingSensitivity: "internal",
      provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
    },
  ];

  const sampleModel: ArchitectureDataLineageModel = {
    id: "model-1",
    projectId: "proj-1",
    architectureId: "arch-1",
    graphRevision: "rev-1",
    version: 1,
    assets: [customerAsset, paymentAsset],
    flows: sampleFlows,
    transformations: sampleTransformations,
    retentionPolicies: [customerAsset.retentionPolicy!],
    purposes: [...customerAsset.purposes, ...paymentAsset.purposes],
    createdAt: sampleNow,
    updatedAt: sampleNow,
  };

  it("validates lineage model schema correctly", () => {
    const validated = architectureDataLineageEngine.validateModel(sampleModel);
    expect(validated.assets.length).toBe(2);
    expect(validated.flows.length).toBe(4);
  });

  it("traverses downstream paths correctly from origin to storage", () => {
    const result = LineageTraversalEngine.traverseAsset("asset-customer-pii", sampleModel);
    expect(result.assetId).toBe("asset-customer-pii");
    expect(result.classificationLevel).toBe("confidential");
    expect(result.downstreamPaths.length).toBeGreaterThan(0);
    expect(result.isCycleDetected).toBe(false);

    // Should reach storage bindings
    const storeIds = result.dataStoresReached.map((s) => s.componentId);
    expect(storeIds).toContain("db-primary");
    expect(storeIds).toContain("redis-cache");
  });

  it("detects cyclic data flows without infinite looping or memory exhaustion", () => {
    const cyclicFlows: DataFlow[] = [
      {
        id: "c-1",
        architectureId: "arch-1",
        sourceComponentId: "service-a",
        destinationComponentId: "service-b",
        dataAssetIds: ["asset-cyclic"],
        direction: "forward",
        crossesTrustBoundary: false,
        isThirdPartyTransfer: false,
        purposes: [],
        provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
        confirmed: true,
      },
      {
        id: "c-2",
        architectureId: "arch-1",
        sourceComponentId: "service-b",
        destinationComponentId: "service-c",
        dataAssetIds: ["asset-cyclic"],
        direction: "forward",
        crossesTrustBoundary: false,
        isThirdPartyTransfer: false,
        purposes: [],
        provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
        confirmed: true,
      },
      {
        id: "c-3",
        architectureId: "arch-1",
        sourceComponentId: "service-c",
        destinationComponentId: "service-a",
        dataAssetIds: ["asset-cyclic"],
        direction: "forward",
        crossesTrustBoundary: false,
        isThirdPartyTransfer: false,
        purposes: [],
        provenance: { source: "modeled", timestamp: sampleNow, graphRevision: "rev-1", confirmed: true },
        confirmed: true,
      },
    ];

    const cyclicModel: ArchitectureDataLineageModel = {
      ...sampleModel,
      assets: [
        {
          ...customerAsset,
          id: "asset-cyclic",
          name: "Cyclic Asset",
          storageBindings: [],
        },
      ],
      flows: cyclicFlows,
    };

    const result = LineageTraversalEngine.traverseAsset("asset-cyclic", cyclicModel);
    expect(result.isCycleDetected).toBe(true);
    expect(result.downstreamPaths.length).toBeGreaterThan(0);
  });

  it("propagates classifications conservatively and respects tokenization downgrade", () => {
    const propagation = ClassificationPropagationEngine.propagate(sampleModel);
    expect(propagation.flowsEvaluated).toBe(sampleModel.flows.length);

    // Node "api-gateway" and "auth-service" handle confidential customer PII
    expect(propagation.effectiveNodeSensitivity["auth-service"]).toBe("confidential");

    // Checkout service handles restricted payment data
    expect(propagation.effectiveNodeSensitivity["checkout-service"]).toBe("restricted");
  });

  it("evaluates deletion propagation impact accurately", () => {
    const impact = DeletionPropagationAnalyzer.analyzeAsset(customerAsset, sampleModel);
    expect(impact.assetId).toBe("asset-customer-pii");
    expect(impact.authoritativeStoreId).toBe("db-primary");
    expect(impact.coveredDestinations.length).toBe(4); // db-primary, replica, cache, analytics all configured
    expect(impact.propagationReadinessPct).toBe(100);
  });

  it("detects deletion gaps when cache invalidation or cascade is disabled", () => {
    const unmanagedAsset: DataAsset = {
      ...customerAsset,
      id: "asset-unmanaged",
      deletionPolicy: {
        id: "del-unmanaged",
        name: "Unmanaged Deletion Policy",
        targetAssetId: "asset-unmanaged",
        authoritativeComponentId: "db-primary",
        cascadesToDestinations: false,
        invalidatesCaches: false,
        propagatesToReplicas: true,
        notifiesThirdParties: false,
      },
    };

    const modelWithUnmanaged: ArchitectureDataLineageModel = {
      ...sampleModel,
      assets: [...sampleModel.assets, unmanagedAsset],
    };

    const impact = DeletionPropagationAnalyzer.analyzeAsset(unmanagedAsset, modelWithUnmanaged);
    expect(impact.uncoveredDestinations.length).toBeGreaterThan(0);
    expect(impact.propagationReadinessPct).toBeLessThan(100);
  });

  it("evaluates retention coverage across model", () => {
    const report = RetentionCoverageAnalyzer.evaluateModel(sampleModel);
    expect(report.totalAssets).toBe(2);
    // customerAsset has retention; paymentAsset has none
    expect(report.coveredAssets).toBe(1);
    expect(report.uncoveredAssets).toBe(1);
    expect(report.criticalGaps.length).toBeGreaterThan(0);
  });

  it("detects cross-border and third-party data transfers", () => {
    const transfers = TransferAnalyzer.analyzeTransfers(sampleModel);
    expect(transfers.length).toBeGreaterThan(0);

    const stripeTransfer = transfers.find((t) => t.isThirdParty);
    expect(stripeTransfer).toBeDefined();
    expect(stripeTransfer?.recipientName).toBe("Stripe Inc");
    expect(stripeTransfer?.sourceCountry).toBe("EU");
    expect(stripeTransfer?.destinationCountry).toBe("US");
    expect(stripeTransfer?.requiresReview).toBe(true);
  });

  it("detects shadow data flows via lineage drift detector", () => {
    const observed = [
      {
        sourceComponentId: "auth-service",
        destinationComponentId: "unauthorized-telemetry-collector",
        requestCount: 450,
        lastObservedAt: sampleNow,
      },
    ];

    const driftFindings = LineageDriftDetector.detectDrift(sampleModel, observed);
    expect(driftFindings.length).toBeGreaterThan(0);

    const unexpected = driftFindings.find((d) => d.type === "unexpected_flow");
    expect(unexpected).toBeDefined();
    expect(unexpected?.title).toContain("Shadow Data Flow");
  });

  it("identifies privacy governance risks through deterministic risk analyzer", () => {
    const findings = PrivacyRiskAnalyzer.analyze(sampleModel);
    expect(findings.length).toBeGreaterThan(0);

    // Missing retention policy on paymentAsset
    const missingRetention = findings.find((f) => f.category === "missing_retention_policy");
    expect(missingRetention).toBeDefined();

    // Cross border transfer on flow-4
    const crossBorder = findings.find((f) => f.category === "cross_border_unreviewed_transfer");
    expect(crossBorder).toBeDefined();
  });
});
