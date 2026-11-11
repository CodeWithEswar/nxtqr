/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Core Domain Contracts and Types
 */

export type ContractProtocol =
  | "rest"
  | "graphql"
  | "grpc"
  | "async_event"
  | "webhook";

export type SpecificationFormat =
  | "openapi_3x"
  | "graphql_sdl"
  | "graphql_introspection"
  | "protobuf"
  | "asyncapi_2x"
  | "asyncapi_3x"
  | "json_schema"
  | "custom";

export type ContractLifecycleStatus =
  | "draft"
  | "proposed"
  | "active"
  | "deprecated"
  | "retired"
  | "archived";

export type InterfaceExposure =
  | "public"
  | "partner"
  | "internal"
  | "private_network"
  | "unknown";

export type ContractEvidenceSource =
  | "declared"     // Defined by specification or author
  | "implemented"  // Confirmed by source code or build artifacts
  | "observed"     // Supported by runtime telemetry (OpenTelemetry, envoy logs)
  | "inferred"     // Suggested by architecture analysis or AI heuristic
  | "unknown";     // Indeterminate evidence

export interface ContractProvenance {
  source: ContractEvidenceSource;
  sourceIdentifier?: string; // e.g. "openapi:v1/orders.json"
  author?: string;
  timestamp: string;
  graphRevision: string;
  confidence?: number; // 0.0 - 1.0
  confirmed: boolean;
}

export type CompatibilityMode =
  | "backward"           // New provider works with old consumer (consumers don't break)
  | "forward"            // Old provider works with new consumer
  | "full"               // Both backward and forward compatible
  | "consumer_specific"  // Evaluated specifically against registered consumer usages
  | "protocol_specific"; // Uses native protocol rules (e.g. Protobuf wire rules)

export interface CompatibilityPolicy {
  id: string;
  name: string;
  mode: CompatibilityMode;
  allowAdditiveSafeChanges: boolean;
  requireDeprecationPeriod: boolean;
  minDeprecationDays?: number;
  strictNullability: boolean;
  checkEnumExhaustiveness: boolean;
  treatMissingConsumerAsRisky: boolean;
}

export type CompatibilityClassification =
  | "breaking"              // Concrete break for existing consumers
  | "potentially_breaking"  // Break depending on consumer usage
  | "non_breaking"          // Safe under active compatibility policy
  | "informational"         // Documentation or metadata change
  | "unknown";              // Insufficient schema details

export interface NormalizedSchema {
  id: string;
  name?: string;
  type:
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "array"
    | "object"
    | "union"
    | "enum"
    | "null"
    | "any";
  format?: string;
  description?: string;
  requiredProperties?: string[];
  properties?: Record<string, NormalizedSchema>;
  items?: NormalizedSchema;
  enumValues?: Array<string | number>;
  isNullable: boolean;
  fieldNumber?: number; // Protobuf wire tag
  wireType?: "varint" | "64-bit" | "length-delimited" | "32-bit"; // Protobuf wire representation
  dataAssetRef?: string; // Link to Phase 05.3.19 Data Lineage asset
  sensitivityLevel?: "public" | "internal" | "confidential" | "restricted";
  rawSourceLocation?: string;
}

export interface OperationParameter {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  required: boolean;
  schema: NormalizedSchema;
  description?: string;
}

export interface SecurityRequirement {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect" | "mutualTLS" | "custom";
  scheme?: string; // "bearer", "basic"
  name?: string;   // e.g. "X-API-KEY"
  in?: "header" | "query" | "cookie";
  scopes?: string[];
  description?: string;
}

export interface DeprecationNotice {
  deprecatedAt: string;
  plannedRetirementDate?: string;
  replacementOperationId?: string;
  migrationGuidance?: string;
  isEnforced: boolean;
}

export interface ContractOperation {
  id: string;
  operationId: string;
  protocol: ContractProtocol;
  method?: string;          // REST HTTP method (GET, POST, PUT, DELETE, PATCH)
  path?: string;            // REST endpoint path
  rpcName?: string;         // gRPC RPC method
  queryType?: "query" | "mutation" | "subscription"; // GraphQL
  channelName?: string;     // AsyncAPI topic / queue
  summary?: string;
  description?: string;
  parameters?: OperationParameter[];
  requestSchemaRef?: string;
  responseSchemas?: Record<string, string>; // key = statusCode (e.g. "200") or "default" -> schema ID
  securityRequirements?: SecurityRequirement[];
  isDeprecated: boolean;
  deprecationNotice?: DeprecationNotice;
  provenance: ContractProvenance;
}

export interface ContractChannel {
  id: string;
  name: string; // e.g. "orders.v1.checkout-completed"
  direction: "publish" | "subscribe" | "bidirectional";
  messageSchemaRef: string;
  protocolType: "kafka" | "amqp" | "sqs" | "mqtt" | "sns" | "nats" | "custom";
  partitionKeyField?: string;
  deliveryGuarantee?: "at_least_once" | "at_most_once" | "exactly_once";
}

export interface ContractRevision {
  id: string;
  contractId: string;
  revisionHash: string;
  versionLabel: string; // e.g. "v1.2.0" or "2026-11-11"
  specificationVersion: string; // e.g. "OpenAPI 3.1.0", "proto3", "AsyncAPI 2.6.0"
  author?: string;
  sourceArtifactHash?: string;
  operations: ContractOperation[];
  schemas: Record<string, NormalizedSchema>;
  channels?: ContractChannel[];
  validationStatus: "valid" | "warning" | "error";
  validationErrors?: string[];
  createdAt: string;
}

export interface APIContract {
  id: string;
  projectId: string;
  architectureId: string;
  name: string;
  protocol: ContractProtocol;
  specificationFormat: SpecificationFormat;
  providerServiceId: string; // Graph Node ID of provider service
  currentRevisionId: string;
  lifecycleStatus: ContractLifecycleStatus;
  exposure: InterfaceExposure;
  description?: string;
  owner?: {
    technicalOwner?: string;
    businessOwner?: string;
    team?: string;
    contact?: string;
  };
  revisions: ContractRevision[];
  provenance: ContractProvenance;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceInterface {
  id: string;
  serviceId: string; // Architecture Graph Node ID
  interfaceName: string;
  protocol: ContractProtocol;
  exposure: InterfaceExposure;
  contractId?: string;
  currentRevisionId?: string;
  port?: number | string;
  pathPrefix?: string;
  environmentIds?: string[];
  provenance: ContractProvenance;
}

export interface ConsumerDependency {
  id: string;
  providerServiceId: string;
  consumerServiceId: string;
  contractId: string;
  operationIds: string[]; // Granular operations actually consumed
  expectedSchemaVersion?: string;
  environmentId?: string;
  source: ContractEvidenceSource;
  confirmed: boolean;
}

export interface CompatibilityFinding {
  id: string;
  contractId: string;
  baselineRevisionId: string;
  candidateRevisionId: string;
  classification: CompatibilityClassification;
  ruleId: string;
  affectedOperationIds: string[];
  affectedConsumerIds: string[];
  evidence: string[];
  explanation: string;
  remediation: string;
}

export interface SemanticContractDiff {
  contractId: string;
  baselineRevisionId: string;
  candidateRevisionId: string;
  addedOperations: ContractOperation[];
  removedOperations: ContractOperation[];
  modifiedOperations: Array<{
    operationId: string;
    changes: string[];
    isBreaking: boolean;
  }>;
  addedSchemas: string[];
  removedSchemas: string[];
  modifiedSchemas: Array<{
    schemaId: string;
    changes: string[];
    isBreaking: boolean;
  }>;
  securityChanges: string[];
  deprecationChanges: string[];
  findings: CompatibilityFinding[];
}

export interface ConsumerImpactReport {
  contractId: string;
  totalConsumers: number;
  impactedConsumers: Array<{
    consumerServiceId: string;
    consumerServiceName: string;
    usedOperations: string[];
    breakingOperationIds: string[];
    isConfirmedBreak: boolean;
    transitiveDownstreamCount: number;
  }>;
  unknownConsumerRisk: boolean;
  recommendations: string[];
}

export interface ContractCoverageReport {
  totalServices: number;
  servicesWithContracts: number;
  servicesWithoutContracts: string[];
  totalOperations: number;
  operationsWithoutConsumers: string[];
  coveragePercentage: number; // 0 - 100
  unversionedInterfaces: string[];
}

export interface ContractDriftFinding {
  id: string;
  contractId: string;
  serviceId: string;
  driftType:
    | "unimplemented_declared_operation"
    | "undeclared_observed_operation"
    | "schema_payload_drift"
    | "security_drift";
  severity: "high" | "medium" | "low";
  description: string;
  operationId?: string;
}

export interface MigrationStep {
  stepNumber: number;
  action: string;
  targetServiceId: string;
  description: string;
  verificationCriteria: string;
}

export interface MigrationPlan {
  id: string;
  contractId: string;
  contractName: string;
  fromRevisionId: string;
  toRevisionId: string;
  breakingChangesCount: number;
  affectedConsumersCount: number;
  steps: MigrationStep[];
  rollbackConsiderations: string[];
  compatibilityWindowDays?: number;
}

