import { z } from "zod";

export const DeploymentEnvironmentCategorySchema = z.enum([
  "development",
  "testing",
  "staging",
  "production",
  "disaster_recovery",
  "custom",
]);

export const DeploymentEnvironmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: DeploymentEnvironmentCategorySchema,
  description: z.string().optional(),
  isolationLevel: z.enum([
    "separate_account",
    "separate_vpc",
    "shared_cluster",
    "shared_infrastructure",
  ]),
});

export const CloudProviderIdSchema = z.enum([
  "aws",
  "azure",
  "gcp",
  "cloudflare",
  "on_premises",
  "custom",
]);

export const CloudProviderSchema = z.object({
  id: CloudProviderIdSchema,
  name: z.string().min(1),
  capabilities: z.array(z.string()),
});

export const ResourceSourceSchema = z.enum([
  "manually_modeled",
  "imported_configuration",
  "provider_discovered",
  "user_confirmed",
  "unknown",
]);

export const ResourceProvenanceSchema = z.object({
  source: ResourceSourceSchema,
  sourceIdentifier: z.string().optional(),
  importTimestamp: z.string().optional(),
  accountRef: z.string().optional(),
  version: z.string().optional(),
  confirmationStatus: z.enum(["confirmed", "pending_review", "unconfirmed"]),
});

export const InfrastructureResourceTypeSchema = z.enum([
  // Compute & Workloads
  "vm",
  "bare_metal",
  "container_host",
  "k8s_cluster",
  "k8s_namespace",
  "k8s_nodepool",
  "k8s_workload",
  "serverless_function",
  "edge_worker",
  // Networking & Placement
  "cloud_account",
  "region",
  "availability_zone",
  "vpc",
  "subnet",
  "route_table",
  "nat_gateway",
  "internet_gateway",
  "load_balancer",
  "api_gateway",
  "firewall_rule",
  // Data, Caching & Messaging
  "managed_db",
  "db_replica",
  "cache_cluster",
  "message_broker",
  "queue",
  "object_storage",
  "block_storage",
  // Edge & DNS
  "cdn_distribution",
  "dns_zone",
]);

export const InfrastructureResourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: InfrastructureResourceTypeSchema,
  provider: CloudProviderIdSchema,
  environmentId: z.string().min(1),
  regionId: z.string().optional(),
  zoneId: z.string().optional(),
  parentId: z.string().optional(),
  externalId: z.string().optional(),
  cidr: z.string().optional(),
  configuration: z.record(z.unknown()),
  provenance: ResourceProvenanceSchema,
  tags: z.record(z.string()).optional(),
});

export const InfrastructureRelationshipTypeSchema = z.enum([
  "contains",
  "deployed_on",
  "hosted_by",
  "connected_to",
  "routes_to",
  "replicates_to",
  "depends_on",
  "exposes",
  "protected_by",
  "attached_to",
  "belongs_to_failure_domain",
]);

export const InfrastructureRelationshipSchema = z.object({
  id: z.string().min(1),
  sourceResourceId: z.string().min(1),
  targetResourceId: z.string().min(1),
  relationshipType: InfrastructureRelationshipTypeSchema,
  protocol: z.string().optional(),
  portRange: z.string().optional(),
  direction: z.enum(["inbound", "outbound", "bidirectional"]).optional(),
  isEncrypted: z.boolean().optional(),
  evidence: z.string().optional(),
});

export const DeploymentMappingTypeSchema = z.enum([
  "runs_on",
  "implemented_by",
  "stored_in",
  "served_by",
  "depends_on",
]);

export const DeploymentMappingSchema = z.object({
  id: z.string().min(1),
  logicalComponentId: z.string().min(1),
  infrastructureResourceId: z.string().min(1),
  environmentId: z.string().min(1),
  mappingType: DeploymentMappingTypeSchema,
  replicas: z.number().int().positive().optional(),
  provenance: ResourceProvenanceSchema,
  confirmed: z.boolean(),
});

export const DeploymentTopologySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  graphRevision: z.string().min(1),
  environment: DeploymentEnvironmentSchema,
  version: z.number().int().positive(),
  resources: z.array(InfrastructureResourceSchema),
  relationships: z.array(InfrastructureRelationshipSchema),
  mappings: z.array(DeploymentMappingSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

