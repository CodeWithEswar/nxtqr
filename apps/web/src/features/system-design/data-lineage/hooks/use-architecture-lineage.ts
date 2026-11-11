"use client";

/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * useArchitectureLineage Hook
 */

import { useState, useMemo, useCallback } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  architectureDataLineageEngine,
  type ArchitectureDataLineageModel,
  type DataAsset,
  type DataFlow,
  type DataTransformation,
  type DataSensitivityLevel,
  type PrivacyDataCategory,
  type LineageTraversalResult,
  type DeletionPropagationImpact,
  type PrivacyFinding,
  type CrossBorderTransferFinding,
  type StorageBinding,
  type DataRetentionPolicy,
  type DataDeletionPolicy,
  OpenApiImporter,
} from "@nxtqr/architecture-intelligence";

export type LineageFilterMode =
  | "all"
  | "confidential_restricted"
  | "third_party"
  | "uncovered_retention"
  | "uncovered_deletion";

export interface UseArchitectureLineageOptions {
  projectId?: string;
  architectureId?: string;
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialModel?: ArchitectureDataLineageModel;
}

export function useArchitectureLineage(options: UseArchitectureLineageOptions = {}) {
  const {
    projectId = "current-project",
    architectureId = "arch-lineage-1",
    nodes: _nodes = [],
    edges: _edges = [],
    initialModel,
  } = options;

  const now = new Date().toISOString();

  // Default Initial Model if none provided
  const defaultModel: ArchitectureDataLineageModel = useMemo(() => {
    if (initialModel) return initialModel;

    const sampleCustomerAsset: DataAsset = {
      id: "asset-customer-pii",
      projectId,
      architectureId,
      name: "Customer Account Profile",
      description: "Primary user identity, login records, billing credentials, and contact info.",
      classification: {
        id: "class-customer-pii",
        level: "confidential",
        categories: ["personal_data"],
        name: "Customer PII Classification",
        isLegalDetermination: false,
        provenance: { source: "modeled", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
      owner: {
        id: "owner-identity",
        businessOwner: "Identity & Trust Group",
        technicalOwner: "Auth Team",
        dataSteward: "Chief Privacy Officer",
        responsibleServiceId: "auth-service",
      },
      fields: [
        {
          id: "f-email",
          name: "email",
          logicalType: "string",
          isRequired: true,
          classification: {
            id: "class-f-email",
            level: "confidential",
            categories: ["personal_data"],
            name: "Email",
            isLegalDetermination: false,
            provenance: { source: "modeled", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        },
        {
          id: "f-name",
          name: "full_name",
          logicalType: "string",
          isRequired: true,
          classification: {
            id: "class-f-name",
            level: "confidential",
            categories: ["personal_data"],
            name: "Full Name",
            isLegalDetermination: false,
            provenance: { source: "modeled", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        },
      ],
      storageBindings: [
        {
          componentId: "db-primary",
          componentName: "Postgres Primary",
          storeType: "relational_db",
          copyType: "primary",
          isTransient: false,
          jurisdictionCountry: "US",
          regionId: "us-east-1",
        },
        {
          componentId: "db-replica",
          componentName: "Postgres Read Replica",
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
        id: "ret-cust-365",
        name: "Standard Account Retention Policy",
        durationDays: 365,
        trigger: "account_closure",
        deletionMethod: "hard_delete",
        hasBackupExemption: true,
      },
      deletionPolicy: {
        id: "del-cust-rtbf",
        name: "Customer Right-to-be-Forgotten Cascade",
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
          name: "Account Authentication",
          category: "authentication",
        },
      ],
      provenance: { source: "modeled", timestamp: now, graphRevision: "rev-1", confirmed: true },
      createdAt: now,
      updatedAt: now,
    };

    const samplePaymentAsset: DataAsset = {
      id: "asset-payment-card",
      projectId,
      architectureId,
      name: "Credit Card Payment Details",
      description: "Sensitive PCI cardholder data, PAN, and payment authorization tokens.",
      classification: {
        id: "class-card",
        level: "restricted",
        categories: ["payment", "financial"],
        name: "Restricted Payment Data",
        isLegalDetermination: false,
        provenance: { source: "modeled", timestamp: now, graphRevision: "rev-1", confirmed: true },
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
      provenance: { source: "modeled", timestamp: now, graphRevision: "rev-1", confirmed: true },
      createdAt: now,
      updatedAt: now,
    };

    const sampleFlows: DataFlow[] = [
      {
        id: "flow-ingress",
        architectureId,
        name: "Web Ingress -> Auth Service",
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
        provenance: { source: "modeled", timestamp: now, graphRevision: "rev-1", confirmed: true },
        confirmed: true,
      },
      {
        id: "flow-auth-db",
        architectureId,
        name: "Auth Service -> Primary DB",
        sourceComponentId: "auth-service",
        destinationComponentId: "db-primary",
        dataAssetIds: ["asset-customer-pii"],
        direction: "forward",
        protocol: "PostgreSQL Wire",
        encryptionInTransit: { configured: true, tlsVersion: "TLS 1.3" },
        crossesTrustBoundary: false,
        isThirdPartyTransfer: false,
        purposes: [],
        provenance: { source: "modeled", timestamp: now, graphRevision: "rev-1", confirmed: true },
        confirmed: true,
      },
      {
        id: "flow-auth-cache",
        architectureId,
        name: "Auth Service -> Redis Cache",
        sourceComponentId: "auth-service",
        destinationComponentId: "redis-cache",
        dataAssetIds: ["asset-customer-pii"],
        direction: "forward",
        protocol: "RESP",
        crossesTrustBoundary: false,
        isThirdPartyTransfer: false,
        purposes: [],
        provenance: { source: "modeled", timestamp: now, graphRevision: "rev-1", confirmed: true },
        confirmed: true,
      },
      {
        id: "flow-checkout-stripe",
        architectureId,
        name: "Checkout Service -> Stripe Gateway",
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
        provenance: { source: "modeled", timestamp: now, graphRevision: "rev-1", confirmed: true },
        confirmed: true,
      },
    ];

    const sampleTransformations: DataTransformation[] = [
      {
        id: "trans-tokenize-card",
        type: "tokenization",
        componentId: "checkout-service",
        name: "Tokenize Card Numbers",
        inputAssetIds: ["asset-payment-card"],
        outputAssetIds: ["asset-tokenized-card"],
        resultingSensitivity: "internal",
        provenance: { source: "modeled", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ];

    return {
      id: "model-lineage-master",
      projectId,
      architectureId,
      graphRevision: "rev-1",
      version: 1,
      assets: [sampleCustomerAsset, samplePaymentAsset],
      flows: sampleFlows,
      transformations: sampleTransformations,
      retentionPolicies: [sampleCustomerAsset.retentionPolicy!],
      purposes: [...sampleCustomerAsset.purposes, ...samplePaymentAsset.purposes],
      createdAt: now,
      updatedAt: now,
    };
  }, [projectId, architectureId, initialModel, now]);

  const [model, setModel] = useState<ArchitectureDataLineageModel>(defaultModel);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(defaultModel.assets[0]?.id || "");
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<LineageFilterMode>("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRetentionModalOpen, setIsRetentionModalOpen] = useState(false);

  // Active Asset
  const selectedAsset = useMemo(() => {
    return model.assets.find((a) => a.id === selectedAssetId) || model.assets[0] || null;
  }, [model.assets, selectedAssetId]);

  // Active Lineage Traversal
  const traversalResult = useMemo<LineageTraversalResult | null>(() => {
    if (!selectedAsset) return null;
    try {
      return architectureDataLineageEngine.traverseAsset(selectedAsset.id, model);
    } catch {
      return null;
    }
  }, [selectedAsset, model]);

  // Deletion Propagation Impact
  const deletionImpact = useMemo<DeletionPropagationImpact | null>(() => {
    if (!selectedAsset) return null;
    try {
      return architectureDataLineageEngine.analyzeDeletionImpact(selectedAsset.id, model);
    } catch {
      return null;
    }
  }, [selectedAsset, model]);

  // Retention Report
  const retentionReport = useMemo(() => {
    return architectureDataLineageEngine.evaluateRetentionCoverage(model);
  }, [model]);

  // Cross-Border Transfers
  const transfers = useMemo<CrossBorderTransferFinding[]>(() => {
    return architectureDataLineageEngine.analyzeTransfers(model);
  }, [model]);

  // Privacy Findings
  const privacyFindings = useMemo<PrivacyFinding[]>(() => {
    return architectureDataLineageEngine.analyzePrivacyRisks(model);
  }, [model]);

  // Filtered Assets based on filterMode
  const filteredAssets = useMemo(() => {
    return model.assets.filter((asset) => {
      if (filterMode === "confidential_restricted") {
        return asset.classification.level === "confidential" || asset.classification.level === "restricted";
      }
      if (filterMode === "third_party") {
        return model.flows.some(
          (f) => f.dataAssetIds.includes(asset.id) && (f.isThirdPartyTransfer || Boolean(f.recipientOrganization))
        );
      }
      if (filterMode === "uncovered_retention") {
        return !asset.retentionPolicy || asset.retentionPolicy.durationDays <= 0;
      }
      if (filterMode === "uncovered_deletion") {
        if (!asset.deletionPolicy) return true;
        return !asset.deletionPolicy.cascadesToDestinations || !asset.deletionPolicy.invalidatesCaches;
      }
      return true;
    });
  }, [model.assets, model.flows, filterMode]);

  // Actions
  const updateAssetClassification = useCallback(
    (assetId: string, level: DataSensitivityLevel, categories: PrivacyDataCategory[]) => {
      setModel((prev) => ({
        ...prev,
        assets: prev.assets.map((asset) => {
          if (asset.id !== assetId) return asset;
          return {
            ...asset,
            classification: {
              ...asset.classification,
              level,
              categories,
            },
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    []
  );

  const addStorageBinding = useCallback((assetId: string, binding: StorageBinding) => {
    setModel((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) => {
        if (asset.id !== assetId) return asset;
        const exists = asset.storageBindings.some((b) => b.componentId === binding.componentId);
        if (exists) return asset;
        return {
          ...asset,
          storageBindings: [...asset.storageBindings, binding],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const updateRetentionPolicy = useCallback((assetId: string, policy: DataRetentionPolicy) => {
    setModel((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) => {
        if (asset.id !== assetId) return asset;
        return {
          ...asset,
          retentionPolicy: policy,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const updateDeletionPolicy = useCallback((assetId: string, policy: DataDeletionPolicy) => {
    setModel((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) => {
        if (asset.id !== assetId) return asset;
        return {
          ...asset,
          deletionPolicy: policy,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const importOpenApiSpec = useCallback(
    (specContent: string, sourceComponentId: string, defaultConsumerId: string) => {
      const result = OpenApiImporter.parse(
        specContent,
        sourceComponentId,
        defaultConsumerId,
        architectureId,
        projectId
      );

      if (result.assets.length > 0) {
        setModel((prev) => ({
          ...prev,
          assets: [...prev.assets, ...result.assets],
          flows: [...prev.flows, ...result.flows],
          updatedAt: new Date().toISOString(),
        }));
        setSelectedAssetId(result.assets[0].id);
      }
      return result;
    },
    [architectureId, projectId]
  );

  return {
    model,
    selectedAssetId,
    selectedAsset,
    selectedFlowId,
    filterMode,
    filteredAssets,
    traversalResult,
    deletionImpact,
    retentionReport,
    transfers,
    privacyFindings,
    isImportModalOpen,
    isRetentionModalOpen,
    setSelectedAssetId,
    setSelectedFlowId,
    setFilterMode,
    setIsImportModalOpen,
    setIsRetentionModalOpen,
    updateAssetClassification,
    addStorageBinding,
    updateRetentionPolicy,
    updateDeletionPolicy,
    importOpenApiSpec,
  };
}

