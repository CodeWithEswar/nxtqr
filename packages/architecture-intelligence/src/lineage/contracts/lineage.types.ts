/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Core Domain Contracts and Types
 */

export type LineageProvenanceSource =
  | "modeled"    // Explicitly defined by user in NXTQR
  | "imported"   // Derived from authorized schema or OpenAPI/AsyncAPI specification
  | "observed"   // Supported by runtime telemetry / OpenTelemetry spans
  | "inferred"   // Suggested by deterministic analysis or AI heuristic
  | "unknown";   // Unverified origin

export interface LineageProvenance {
  source: LineageProvenanceSource;
  sourceIdentifier?: string; // e.g. "openapi:POST /v1/orders" or "manual"
  author?: string;
  timestamp: string;
  graphRevision: string;
  confidence?: number; // 0.0 - 1.0 (for inferred/observed)
  confirmed: boolean;
}

export type DataSensitivityLevel =
  | "public"
  | "internal"
  | "confidential"
  | "restricted";

export type PrivacyDataCategory =
  | "personal_data"     // PII: Name, email, address, phone
  | "financial"         // Bank details, credit scores, earnings
  | "payment"           // Credit card PAN, CVV, billing tokens
  | "health"            // Medical history, biometric, fitness
  | "authentication"    // Passwords, hashes, session tokens, API keys
  | "behavioral"        // Tracking, search history, clickstream
  | "operational"       // Logs, telemetry, diagnostics
  | "custom";

export interface DataClassification {
  id: string;
  level: DataSensitivityLevel;
  categories: PrivacyDataCategory[];
  name: string;
  description?: string;
  isLegalDetermination: boolean; // Must always be false (architecture intelligence, not legal counsel)
  provenance: LineageProvenance;
}

export interface DataField {
  id: string;
  name: string;
  logicalType: string; // e.g. "string", "uuid", "integer", "email"
  classification: DataClassification;
  isRequired: boolean;
  schemaReference?: string;
  description?: string;
}

export interface DataOwner {
  id: string;
  businessOwner?: string; // e.g. "Payments Product Group"
  technicalOwner?: string; // e.g. "Checkout Engineering Team"
  dataSteward?: string;   // e.g. "Data Governance Lead"
  responsibleServiceId?: string; // Component ID of authoritative service
  contactEmail?: string;
}

export type ProcessingPurposeCategory =
  | "authentication"
  | "transaction_processing"
  | "fraud_prevention"
  | "analytics"
  | "notifications"
  | "customer_support"
  | "marketing"
  | "legal_compliance"
  | "custom";

export interface ProcessingPurpose {
  id: string;
  name: string;
  category: ProcessingPurposeCategory;
  description?: string;
  lawfulBasisNotice?: string; // Informational note, not a legal certification
}

export type StorageCopyType =
  | "primary"
  | "read_replica"
  | "cache_copy"
  | "backup_copy"
  | "analytics_copy"
  | "export_archive";

export interface StorageBinding {
  componentId: string; // ID of database, cache, or bucket node in architecture graph
  componentName: string;
  storeType:
    | "relational_db"
    | "nosql_db"
    | "cache"
    | "queue"
    | "object_storage"
    | "data_warehouse"
    | "search_index"
    | "backup"
    | "external_provider";
  copyType: StorageCopyType;
  isTransient: boolean; // true if memory/cache/stream, false if durable disk
  encryptionAtRest?: {
    configured: boolean;
    mechanism?: string; // e.g. "AES-256-GCM", "KMS-Customer-Managed"
    evidence?: string;
  };
  regionId?: string;
  jurisdictionCountry?: string; // e.g. "US", "EU", "DE"
}

export interface DataRetentionPolicy {
  id: string;
  name: string;
  durationDays: number; // -1 indicates indefinite / unconfigured
  trigger:
    | "creation_time"
    | "account_closure"
    | "transaction_completion"
    | "inactivity_period"
    | "explicit_request";
  deletionMethod:
    | "hard_delete"
    | "soft_delete"
    | "anonymization"
    | "crypto_shredding"
    | "manual_purge";
  hasBackupExemption: boolean; // Backups may retain data beyond standard purge window
  policyOwner?: string;
  description?: string;
}

export interface DataDeletionPolicy {
  id: string;
  name: string;
  targetAssetId: string;
  authoritativeComponentId: string;
  cascadesToDestinations: boolean;
  invalidatesCaches: boolean;
  propagatesToReplicas: boolean;
  notifiesThirdParties: boolean;
  backupRetentionNote?: string;
  verificationEvidence?: string;
}

export interface DataAsset {
  id: string;
  projectId: string;
  architectureId: string;
  name: string;
  description?: string;
  classification: DataClassification;
  owner?: DataOwner;
  fields?: DataField[];
  storageBindings: StorageBinding[];
  retentionPolicy?: DataRetentionPolicy;
  deletionPolicy?: DataDeletionPolicy;
  purposes: ProcessingPurpose[];
  provenance: LineageProvenance;
  createdAt: string;
  updatedAt: string;
}

export type TransformationType =
  | "filtering"
  | "aggregation"
  | "tokenization"
  | "hashing"
  | "encryption"
  | "decryption"
  | "masking"
  | "pseudonymization"
  | "anonymization"
  | "enrichment"
  | "schema_mapping"
  | "pass_through";

export interface DataTransformation {
  id: string;
  type: TransformationType;
  componentId: string; // The service performing the transformation
  name: string;
  inputAssetIds: string[];
  outputAssetIds: string[];
  resultingSensitivity?: DataSensitivityLevel; // May elevate, reduce, or preserve
  configurationReference?: string;
  provenance: LineageProvenance;
}

export interface DataFlow {
  id: string;
  architectureId: string;
  name?: string;
  sourceComponentId: string;
  destinationComponentId: string;
  dataAssetIds: string[];
  transformationIds?: string[];
  protocol?: string; // e.g. "HTTPS", "gRPC", "AMQP", "Kafka"
  direction: "forward" | "bidirectional";
  encryptionInTransit?: {
    configured: boolean;
    tlsVersion?: string; // e.g. "TLS 1.3"
    evidence?: string;
  };
  crossesTrustBoundary: boolean;
  trustBoundaryDetails?: string; // e.g. "Public Internet -> Private VPC"
  isThirdPartyTransfer: boolean;
  recipientOrganization?: string; // e.g. "Stripe", "Datadog", "Segment"
  sourceRegion?: string;
  destinationRegion?: string;
  sourceJurisdiction?: string;
  destinationJurisdiction?: string;
  purposes: ProcessingPurpose[];
  provenance: LineageProvenance;
  confirmed: boolean;
}

export type PrivacyRiskCategory =
  | "unreviewed_trust_boundary"
  | "external_sharing_unknown_purpose"
  | "missing_retention_policy"
  | "incomplete_deletion_propagation"
  | "unknown_storage_residency"
  | "unencrypted_sensitive_flow"
  | "missing_data_ownership"
  | "data_minimization_violation"
  | "cross_border_unreviewed_transfer"
  | "unclassified_asset";

export interface PrivacyFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: PrivacyRiskCategory;
  title: string;
  description: string;
  affectedAssetIds: string[];
  affectedFlowIds?: string[];
  affectedComponentIds: string[];
  remediation: string;
  isConfirmedRisk: boolean; // true = concrete violation, false = documentation/control gap
}

export interface LineagePathNode {
  componentId: string;
  componentName: string;
  componentType: string;
  action: "originate" | "process" | "transform" | "store" | "consume" | "export";
  transformationType?: TransformationType;
  storageBinding?: StorageBinding;
}

export interface LineagePath {
  pathId: string;
  dataAssetId: string;
  dataAssetName: string;
  nodes: LineagePathNode[];
  edges: string[]; // Flow IDs connecting nodes
  crossesTrustBoundary: boolean;
  crossesBorder: boolean;
  reachesThirdParty: boolean;
}

export interface LineageTraversalResult {
  assetId: string;
  assetName: string;
  classificationLevel: DataSensitivityLevel;
  upstreamPaths: LineagePath[];
  downstreamPaths: LineagePath[];
  allParticipatingComponentIds: string[];
  dataStoresReached: StorageBinding[];
  thirdPartiesReached: string[];
  transformationsEncountered: DataTransformation[];
  isCycleDetected: boolean;
  truncatedDueToLimit: boolean;
}

export interface DeletionPropagationImpact {
  assetId: string;
  assetName: string;
  authoritativeStoreId?: string;
  coveredDestinations: Array<{ componentId: string; componentName: string; storeType: string }>;
  uncoveredDestinations: Array<{ componentId: string; componentName: string; storeType: string; risk: string }>;
  backupExemptions: Array<{ componentId: string; componentName: string; retentionNote: string }>;
  thirdPartyPurgesRequired: string[];
  propagationReadinessPct: number; // 0 - 100
}

export interface CrossBorderTransferFinding {
  flowId: string;
  assetId: string;
  sourceComponentId: string;
  sourceRegion?: string;
  sourceCountry?: string;
  destinationComponentId: string;
  destinationRegion?: string;
  destinationCountry?: string;
  isThirdParty: boolean;
  recipientName?: string;
  requiresReview: boolean;
  notes: string;
}

export interface LineageDriftFinding {
  id: string;
  type: "unexpected_flow" | "missing_flow" | "unclassified_flow" | "storage_drift";
  title: string;
  severity: "high" | "medium" | "low";
  description: string;
  flowId?: string;
  componentId?: string;
}

export interface ArchitectureDataLineageModel {
  id: string;
  projectId: string;
  architectureId: string;
  graphRevision: string;
  version: number;
  assets: DataAsset[];
  flows: DataFlow[];
  transformations: DataTransformation[];
  retentionPolicies: DataRetentionPolicy[];
  purposes: ProcessingPurpose[];
  createdAt: string;
  updatedAt: string;
}

