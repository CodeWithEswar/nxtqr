import { z } from "zod";

// Base shared infrastructure fields
const baseInfrastructureFields = {
  label: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  environment: z.enum(["development", "staging", "production", "edge", "local"]).default("production"),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1024).optional(),
  enabled: z.boolean().default(true),
};

// Reusable classification for architecture and diagram utilities
export const diagramUtilityClassificationSchema = z.enum([
  "structural-container",
  "logical-group",
  "security-boundary",
  "annotation",
  "edge-annotation",
  "routing-junction",
  "dependency-reference",
  "failure-domain",
]);
export type DiagramUtilityClassification = z.infer<typeof diagramUtilityClassificationSchema>;

// Common diagram metadata
export const diagramUtilityMetadataSchema = z.object({
  diagramUtilityClassification: diagramUtilityClassificationSchema.default("structural-container"),
  visualTier: z.enum(["canvas-backdrop", "boundary-perimeter", "logical-tier", "annotation-card", "connector-hub"]).default("boundary-perimeter"),
  exportableToDoc: z.boolean().default(true),
  docSection: z.enum(["architecture-overview", "security-trust-boundaries", "network-topology", "decisions-and-notes", "failure-domains"]).default("architecture-overview"),
});
export type DiagramUtilityMetadata = z.infer<typeof diagramUtilityMetadataSchema>;

// 1. System Boundary Schema
export const systemBoundaryConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("system-boundary").default("system-boundary"),
  diagramUtilityClassification: z.literal("structural-container").default("structural-container"),
  boundaryName: z.string().min(1).max(64).default("Core System Perimeter"),
  boundaryType: z.enum(["internal-subsystem", "external-partner", "cloud-provider", "enterprise-perimeter"]).default("internal-subsystem"),
  containmentMode: z.enum(["logical", "physical", "organizational"]).default("logical"),
  strokeStyle: z.enum(["dashed", "solid", "dotted"]).default("dashed"),
  fillColor: z.enum(["transparent", "subtle-tint", "solid"]).default("transparent"),
  showHeader: z.boolean().default(true),
  isolationLevel: z.enum(["none", "dmz", "vpc-isolated", "air-gapped"]).default("vpc-isolated"),
  borderThickness: z.number().int().min(1).max(5).default(2),
});
export type SystemBoundaryConfig = z.infer<typeof systemBoundaryConfigSchema>;

// 2. Service Group Schema
export const serviceGroupConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("service-group").default("service-group"),
  diagramUtilityClassification: z.literal("logical-group").default("logical-group"),
  groupName: z.string().min(1).max(64).default("Order Processing Services"),
  domainContext: z.string().max(128).default("Commerce Domain"),
  groupType: z.enum(["microservice-cluster", "data-domain", "frontend-tier", "worker-pool"]).default("microservice-cluster"),
  tierLevel: z.enum(["presentation", "application", "data", "edge"]).default("application"),
  sharedNetwork: z.boolean().default(true),
  serviceCountTarget: z.number().int().min(1).max(50).default(5),
  autoCollapse: z.boolean().default(false),
});
export type ServiceGroupConfig = z.infer<typeof serviceGroupConfigSchema>;

// 3. Network Boundary Schema
export const networkBoundaryConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("network-boundary").default("network-boundary"),
  diagramUtilityClassification: z.literal("structural-container").default("structural-container"),
  networkName: z.string().min(1).max(64).default("Production VPC"),
  cidrBlock: z.string().min(7).max(32).default("10.0.0.0/16"),
  networkType: z.enum(["vpc", "subnet-private", "subnet-public", "mesh-network"]).default("vpc"),
  routingMode: z.enum(["direct-route", "nat-gateway", "transit-gateway", "peered"]).default("direct-route"),
  ingressRuleSummary: z.string().max(128).default("Allow 443 from Load Balancer"),
  egressRuleSummary: z.string().max(128).default("Allow NAT egress to external APIs"),
  enableDnsResolution: z.boolean().default(true),
});
export type NetworkBoundaryConfig = z.infer<typeof networkBoundaryConfigSchema>;

// 4. Trust Boundary Schema
export const trustBoundaryConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("trust-boundary").default("trust-boundary"),
  diagramUtilityClassification: z.literal("security-boundary").default("security-boundary"),
  trustLevelFrom: z.enum(["untrusted-public", "authenticated-user", "internal-workload"]).default("untrusted-public"),
  trustLevelTo: z.enum(["dmz-protected", "high-security-vault", "root-isolated"]).default("dmz-protected"),
  enforcementMechanism: z.enum(["mtls-and-jwt", "api-gateway-auth", "firewall-inspection", "zero-trust-proxy"]).default("mtls-and-jwt"),
  complianceStandard: z.enum(["soc2-type-2", "pci-dss-4.0", "hipaa", "fedramp-high", "none"]).default("soc2-type-2"),
  requiresAuditLog: z.boolean().default(true),
  threatModelZone: z.enum(["internet", "perimeter", "core-data", "management"]).default("perimeter"),
});
export type TrustBoundaryConfig = z.infer<typeof trustBoundaryConfigSchema>;

// 5. Architecture Note Schema
export const architectureNoteConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("architecture-note").default("architecture-note"),
  diagramUtilityClassification: z.literal("annotation").default("annotation"),
  noteTitle: z.string().min(1).max(64).default("Asynchronous Ingestion Note"),
  noteContent: z.string().max(2048).default("Ingestion queue provides 4-hour durability during downstream database maintenance windows."),
  noteType: z.enum(["general", "operational-runbook", "assumptions", "security-notice"]).default("general"),
  author: z.string().max(64).default("Platform Architecture Team"),
  priority: z.enum(["info", "warning", "critical"]).default("info"),
  pinned: z.boolean().default(true),
});
export type ArchitectureNoteConfig = z.infer<typeof architectureNoteConfigSchema>;

// 6. Decision Annotation Schema
export const decisionAnnotationConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("decision-annotation").default("decision-annotation"),
  diagramUtilityClassification: z.literal("annotation").default("annotation"),
  adrNumber: z.string().min(1).max(32).default("ADR-0042"),
  adrTitle: z.string().min(1).max(128).default("Adopt Event-Driven Microservices"),
  decisionStatus: z.enum(["proposed", "accepted", "deprecated", "superseded"]).default("accepted"),
  deciders: z.string().max(128).default("Lead Architect, SecOps, Core Platform Team"),
  consequencesSummary: z.string().max(512).default("Requires Kafka event broker and schema registry; increases eventual consistency handling in frontend."),
  contextAndProblem: z.string().max(512).default("Monolithic RPC causes cascading latency spikes during flash sales."),
  dateAdopted: z.string().max(32).default("2026-03-15"),
});
export type DecisionAnnotationConfig = z.infer<typeof decisionAnnotationConfigSchema>;

// 7. Traffic Label Schema
export const trafficLabelConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("traffic-label").default("traffic-label"),
  diagramUtilityClassification: z.literal("edge-annotation").default("edge-annotation"),
  trafficDescription: z.string().min(1).max(64).default("User Checkout Flow"),
  protocol: z.enum(["HTTPS/REST", "gRPC/HTTP2", "WebSocket", "Kafka/TCP", "GraphQL"]).default("gRPC/HTTP2"),
  bandwidthEst: z.enum(["<100 rps", "1k-10k rps", "10k-100k rps", ">100k rps"]).default("1k-10k rps"),
  payloadFormat: z.enum(["JSON", "Protobuf", "Avro", "Binary"]).default("Protobuf"),
  targetLatencyP99Ms: z.number().int().min(1).max(5000).default(50),
  encryptionInTransit: z.boolean().default(true),
  qosPriority: z.enum(["low", "standard", "high", "realtime"]).default("high"),
});
export type TrafficLabelConfig = z.infer<typeof trafficLabelConfigSchema>;

// 8. Connection Junction Schema
export const connectionJunctionConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("connection-junction").default("connection-junction"),
  diagramUtilityClassification: z.literal("routing-junction").default("routing-junction"),
  junctionLabel: z.string().min(1).max(64).default("Event Distribution Hub"),
  junctionType: z.enum(["orthogonal-tee", "cross-bus", "splitter", "aggregator"]).default("splitter"),
  routingDirection: z.enum(["bidirectional", "ingress-fanout", "egress-merge"]).default("ingress-fanout"),
  maxConnections: z.number().int().min(2).max(16).default(6),
  passThroughLatencyMs: z.number().int().min(0).max(50).default(1),
  labelVisible: z.boolean().default(true),
});
export type ConnectionJunctionConfig = z.infer<typeof connectionJunctionConfigSchema>;

// 9. External Dependency Schema
export const externalDependencyConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("external-dependency").default("external-dependency"),
  diagramUtilityClassification: z.literal("dependency-reference").default("dependency-reference"),
  dependencyName: z.string().min(1).max(64).default("Stripe Payment Processing"),
  vendorName: z.string().min(1).max(64).default("Stripe, Inc."),
  dependencyType: z.enum(["saas-api", "third-party-sdk", "cloud-managed-paas", "legacy-core-system"]).default("saas-api"),
  criticality: z.enum(["tier-0-fatal", "tier-1-degraded", "tier-2-inconvenient"]).default("tier-1-degraded"),
  slaUptimePercent: z.number().min(90.0).max(99.999).default(99.99),
  failoverStrategy: z.enum(["fallback-cache", "graceful-degrade", "fail-fast", "secondary-provider"]).default("fallback-cache"),
  contactTeam: z.string().max(64).default("Billing & Payments Guild"),
});
export type ExternalDependencyConfig = z.infer<typeof externalDependencyConfigSchema>;

// 10. Failure Zone Schema
export const failureZoneConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("failure-zone").default("failure-zone"),
  diagramUtilityClassification: z.literal("failure-domain").default("failure-domain"),
  zoneName: z.string().min(1).max(64).default("Primary AZ Failure Domain"),
  zoneType: z.enum(["cloud-region-outage", "availability-zone", "rack-failure", "network-partition", "power-domain"]).default("availability-zone"),
  blastRadiusPercent: z.number().int().min(1).max(100).default(33),
  recoveryRtoMinutes: z.number().int().min(1).max(1440).default(15),
  recoveryRpoMinutes: z.number().int().min(0).max(1440).default(0),
  chaosEngineeringTested: z.boolean().default(true),
  mitigationStrategy: z.enum(["multi-region-active-active", "read-replica-promotion", "circuit-breaker-shedding", "manual-dr-playbook"]).default("read-replica-promotion"),
});
export type FailureZoneConfig = z.infer<typeof failureZoneConfigSchema>;

// Discriminated union of all 10 Architecture & Diagram Utility configs
export const architectureAndDiagramUtilitiesConfigSchema = z.discriminatedUnion("componentType", [
  systemBoundaryConfigSchema,
  serviceGroupConfigSchema,
  networkBoundaryConfigSchema,
  trustBoundaryConfigSchema,
  architectureNoteConfigSchema,
  decisionAnnotationConfigSchema,
  trafficLabelConfigSchema,
  connectionJunctionConfigSchema,
  externalDependencyConfigSchema,
  failureZoneConfigSchema,
]);

export type ArchitectureAndDiagramUtilitiesConfig = z.infer<typeof architectureAndDiagramUtilitiesConfigSchema>;
