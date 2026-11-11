/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Core Domain Contracts and Types
 */

export type DeploymentEnvironmentCategory =
  | "development"
  | "testing"
  | "staging"
  | "production"
  | "disaster_recovery"
  | "custom";

export interface DeploymentEnvironment {
  id: string;
  name: string;
  category: DeploymentEnvironmentCategory;
  description?: string;
  isolationLevel: "separate_account" | "separate_vpc" | "shared_cluster" | "shared_infrastructure";
}

export type CloudProviderId =
  | "aws"
  | "azure"
  | "gcp"
  | "cloudflare"
  | "on_premises"
  | "custom";

export interface CloudProvider {
  id: CloudProviderId;
  name: string;
  capabilities: string[];
}

export type ResourceSource =
  | "manually_modeled"
  | "imported_configuration"
  | "provider_discovered"
  | "user_confirmed"
  | "unknown";

export interface ResourceProvenance {
  source: ResourceSource;
  sourceIdentifier?: string; // e.g. "terraform:aws_instance.api_server"
  importTimestamp?: string;
  accountRef?: string;
  version?: string;
  confirmationStatus: "confirmed" | "pending_review" | "unconfirmed";
}

export type InfrastructureResourceType =
  // Compute & Workloads
  | "vm"
  | "bare_metal"
  | "container_host"
  | "k8s_cluster"
  | "k8s_namespace"
  | "k8s_nodepool"
  | "k8s_workload"
  | "serverless_function"
  | "edge_worker"
  // Networking & Placement
  | "cloud_account"
  | "region"
  | "availability_zone"
  | "vpc"
  | "subnet"
  | "route_table"
  | "nat_gateway"
  | "internet_gateway"
  | "load_balancer"
  | "api_gateway"
  | "firewall_rule"
  // Data, Caching & Messaging
  | "managed_db"
  | "db_replica"
  | "cache_cluster"
  | "message_broker"
  | "queue"
  | "object_storage"
  | "block_storage"
  // Edge & DNS
  | "cdn_distribution"
  | "dns_zone";

export interface InfrastructureResource {
  id: string;
  name: string;
  type: InfrastructureResourceType;
  provider: CloudProviderId;
  environmentId: string;
  regionId?: string;
  zoneId?: string;
  parentId?: string; // Hierarchical containment (e.g. Subnet -> VPC -> Region -> CloudAccount)
  externalId?: string; // Cloud ARN or resource URI
  cidr?: string; // e.g. "10.0.1.0/24"
  configuration: Record<string, unknown>; // Typed attributes per resource type
  provenance: ResourceProvenance;
  tags?: Record<string, string>;
}

export type InfrastructureRelationshipType =
  | "contains" // Hierarchical parent-child containment
  | "deployed_on" // Workload deployed onto physical/virtual host
  | "hosted_by" // Container hosted by pod, pod by nodepool
  | "connected_to" // Direct network attachment / peering
  | "routes_to" // Route table / gateway destination
  | "replicates_to" // Database primary to replica replication
  | "depends_on" // Runtime infrastructure dependency
  | "exposes" // Ingress / LB exposing a workload
  | "protected_by" // Security group / firewall rule protecting a resource
  | "attached_to" // Storage or network interface attachment
  | "belongs_to_failure_domain";

export interface InfrastructureRelationship {
  id: string;
  sourceResourceId: string;
  targetResourceId: string;
  relationshipType: InfrastructureRelationshipType;
  protocol?: string;
  portRange?: string; // e.g. "443", "80-8080"
  direction?: "inbound" | "outbound" | "bidirectional";
  isEncrypted?: boolean;
  evidence?: string;
}

export type DeploymentMappingType =
  | "runs_on" // Service runs on compute VM / Kubernetes workload
  | "implemented_by" // Logical queue implemented by Kafka/SQS broker
  | "stored_in" // Logical database stored in RDS/Postgres instance
  | "served_by" // Logical gateway served by Cloudflare / ALB
  | "depends_on";

export interface DeploymentMapping {
  id: string;
  logicalComponentId: string; // ID of BaseNode from architecture graph
  infrastructureResourceId: string; // ID of InfrastructureResource
  environmentId: string;
  mappingType: DeploymentMappingType;
  replicas?: number;
  provenance: ResourceProvenance;
  confirmed: boolean;
}

export interface DeploymentTopology {
  id: string;
  projectId: string;
  architectureId: string;
  graphRevision: string;
  environment: DeploymentEnvironment;
  version: number;
  resources: InfrastructureResource[];
  relationships: InfrastructureRelationship[];
  mappings: DeploymentMapping[];
  createdAt: string;
  updatedAt: string;
}

export interface NetworkPathEvaluationResult {
  sourceResourceId: string;
  targetResourceId: string;
  status: "allowed" | "denied" | "unknown";
  path: string[];
  reasons: string[];
  portsAllowed?: string[];
}

export interface FailureDomainItem {
  domainId: string;
  domainType:
    | "shared_host"
    | "shared_node"
    | "shared_cluster"
    | "shared_zone"
    | "shared_region"
    | "shared_storage"
    | "shared_network";
  name: string;
  resourceIds: string[];
  logicalComponentIds: string[];
  riskLevel: "critical" | "high" | "medium" | "low";
  description: string;
}

export interface TopologyValidationFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  type: string;
  title: string;
  description: string;
  affectedResourceIds: string[];
  affectedLogicalComponentIds?: string[];
  remediation: string;
}

export interface DriftFinding {
  id: string;
  type:
    | "missing_resource"
    | "unexpected_resource"
    | "configuration_drift"
    | "placement_drift"
    | "unmapped_workload";
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  resourceId?: string;
  plannedValue?: unknown;
  actualValue?: unknown;
}

export interface ImportPreviewResult {
  sourceFormat: "terraform" | "kubernetes" | "docker_compose" | "custom";
  totalParsed: number;
  newResources: InfrastructureResource[];
  updatedResources: InfrastructureResource[];
  conflicts: string[];
  detectedMappings: DeploymentMapping[];
  sensitiveFieldsRedacted: number;
  notes: string[];
}

