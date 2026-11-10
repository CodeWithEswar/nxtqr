import type {
  InfrastructureCategoryDefinition,
  InfrastructureComponentDefinition,
} from "../types";
import {
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
  type SystemBoundaryConfig,
  type ServiceGroupConfig,
  type NetworkBoundaryConfig,
  type TrustBoundaryConfig,
  type ArchitectureNoteConfig,
  type DecisionAnnotationConfig,
  type TrafficLabelConfig,
  type ConnectionJunctionConfig,
  type ExternalDependencyConfig,
  type FailureZoneConfig,
} from "../schemas/architecture-and-diagram-utilities.schema";

export const ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID = "architecture-and-diagram-utilities";

export const architectureAndDiagramUtilitiesCategoryDefinition: InfrastructureCategoryDefinition = {
  id: ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  name: "Architecture & Diagram Utilities",
  description:
    "System boundaries, service groups, network boundaries, trust boundaries, architecture notes, decision annotations, traffic labels, connection junctions, external dependencies, and failure zones.",
  iconSlug: "system-boundary",
  order: 19,
};

// 1. System Boundary Definition
export const systemBoundaryDefinition: InfrastructureComponentDefinition<SystemBoundaryConfig> = {
  id: "system-boundary",
  version: 1,
  categoryId: ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  display: {
    name: "System Boundary",
    shortName: "System Boundary",
    description: "Structural perimeter defining system or subsystem containment boundaries with configurable isolation levels.",
    keywords: ["system-boundary", "perimeter", "container", "subsystem", "isolation", "boundary"],
    iconSlug: "system-boundary",
  },
  node: { variant: "compact", minWidth: 240, minHeight: 140 },
  capabilities: ["containment", "boundary-isolation", "header-label", "nested-elements"],
  configSchema: systemBoundaryConfigSchema,
  defaultConfig: {
    label: "Core System Perimeter",
    environment: "production",
    enabled: true,
    tags: ["boundary", "structural", "perimeter"],
    componentType: "system-boundary",
    diagramUtilityClassification: "structural-container",
    boundaryName: "Core System Perimeter",
    boundaryType: "internal-subsystem",
    containmentMode: "logical",
    strokeStyle: "dashed",
    fillColor: "transparent",
    showHeader: true,
    isolationLevel: "vpc-isolated",
    borderThickness: 2,
  },
  ports: [
    {
      id: "boundary-in",
      name: "Perimeter Ingress",
      type: "input",
      dataType: "perimeter-traffic",
      capacity: 10000,
      description: "Inbound traffic crossing the system boundary",
    },
    {
      id: "boundary-out",
      name: "Perimeter Egress",
      type: "output",
      dataType: "perimeter-traffic",
      capacity: 10000,
      description: "Outbound traffic leaving the system perimeter",
    },
    {
      id: "boundary-cross",
      name: "Cross-Boundary Bridge",
      type: "bidirectional",
      dataType: "bridged-traffic",
      capacity: 5000,
      description: "Bidirectional bridge connection for inter-system communication",
    },
  ],
  inspector: [
    {
      id: "boundary-settings",
      title: "Boundary Identification",
      fields: [
        { path: "boundaryName", label: "Boundary Name", type: "text" },
        {
          path: "boundaryType",
          label: "Boundary Type",
          type: "select",
          options: [
            { label: "Internal Subsystem", value: "internal-subsystem" },
            { label: "External Partner Perimeter", value: "external-partner" },
            { label: "Cloud Provider Boundary", value: "cloud-provider" },
            { label: "Enterprise Perimeter", value: "enterprise-perimeter" },
          ],
        },
        {
          path: "containmentMode",
          label: "Containment Mode",
          type: "select",
          options: [
            { label: "Logical Grouping", value: "logical" },
            { label: "Physical Boundary", value: "physical" },
            { label: "Organizational Unit", value: "organizational" },
          ],
        },
      ],
    },
    {
      id: "visual-styling",
      title: "Visual Appearance",
      fields: [
        {
          path: "strokeStyle",
          label: "Border Stroke Style",
          type: "select",
          options: [
            { label: "Dashed Perimeter", value: "dashed" },
            { label: "Solid Line", value: "solid" },
            { label: "Dotted Line", value: "dotted" },
          ],
        },
        {
          path: "fillColor",
          label: "Surface Fill",
          type: "select",
          options: [
            { label: "Transparent Canvas", value: "transparent" },
            { label: "Subtle Tint Surface", value: "subtle-tint" },
            { label: "Solid Neutral Base", value: "solid" },
          ],
        },
        { path: "showHeader", label: "Display Header Badge", type: "boolean" },
        { path: "borderThickness", label: "Border Thickness (px)", type: "number" },
      ],
    },
    {
      id: "isolation-level",
      title: "Security & Isolation",
      fields: [
        {
          path: "isolationLevel",
          label: "Isolation Level",
          type: "select",
          options: [
            { label: "None / Shared", value: "none" },
            { label: "DMZ Demarcation", value: "dmz" },
            { label: "VPC Isolated", value: "vpc-isolated" },
            { label: "Air-Gapped Secure", value: "air-gapped" },
          ],
        },
      ],
    },
  ],
};

// 2. Service Group Definition
export const serviceGroupDefinition: InfrastructureComponentDefinition<ServiceGroupConfig> = {
  id: "service-group",
  version: 1,
  categoryId: ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  display: {
    name: "Service Group",
    shortName: "Service Group",
    description: "Logical grouping of cooperating microservices, worker processes, or data components sharing common domain context.",
    keywords: ["service-group", "cluster", "logical-group", "domain", "tier", "microservices"],
    iconSlug: "service-group",
  },
  node: { variant: "compact", minWidth: 220, minHeight: 120 },
  capabilities: ["grouping", "domain-boundary", "tier-classification", "multi-service"],
  configSchema: serviceGroupConfigSchema,
  defaultConfig: {
    label: "Order Processing Services",
    environment: "production",
    enabled: true,
    tags: ["group", "microservices", "domain"],
    componentType: "service-group",
    diagramUtilityClassification: "logical-group",
    groupName: "Order Processing Services",
    domainContext: "Commerce Domain",
    groupType: "microservice-cluster",
    tierLevel: "application",
    sharedNetwork: true,
    serviceCountTarget: 5,
    autoCollapse: false,
  },
  ports: [
    {
      id: "group-ingress",
      name: "Group Ingress",
      type: "input",
      dataType: "grouped-traffic",
      capacity: 5000,
      description: "Entry traffic directed to services within the group",
    },
    {
      id: "group-egress",
      name: "Group Egress",
      type: "output",
      dataType: "grouped-traffic",
      capacity: 5000,
      description: "Outbound requests produced by services in this group",
    },
  ],
  inspector: [
    {
      id: "group-identity",
      title: "Group Identity & Domain",
      fields: [
        { path: "groupName", label: "Group Display Name", type: "text" },
        { path: "domainContext", label: "Domain Bounded Context", type: "text" },
        {
          path: "groupType",
          label: "Group Classification",
          type: "select",
          options: [
            { label: "Microservice Cluster", value: "microservice-cluster" },
            { label: "Data Domain", value: "data-domain" },
            { label: "Frontend Tier", value: "frontend-tier" },
            { label: "Worker Pool", value: "worker-pool" },
          ],
        },
      ],
    },
    {
      id: "tier-network",
      title: "Architecture Tier & Capacity",
      fields: [
        {
          path: "tierLevel",
          label: "Architectural Tier",
          type: "select",
          options: [
            { label: "Presentation Tier", value: "presentation" },
            { label: "Application Logic Tier", value: "application" },
            { label: "Data Persistence Tier", value: "data" },
            { label: "Edge Infrastructure Tier", value: "edge" },
          ],
        },
        { path: "sharedNetwork", label: "Enforce Shared Network Namespace", type: "boolean" },
        { path: "serviceCountTarget", label: "Target Service Count", type: "number" },
        { path: "autoCollapse", label: "Enable Collapsible Container View", type: "boolean" },
      ],
    },
  ],
};

// 3. Network Boundary Definition
export const networkBoundaryDefinition: InfrastructureComponentDefinition<NetworkBoundaryConfig> = {
  id: "network-boundary",
  version: 1,
  categoryId: ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  display: {
    name: "Network Boundary",
    shortName: "Network Boundary",
    description: "Network topology container representing VPCs, public/private subnets, or mesh network partitions with routing policies.",
    keywords: ["network-boundary", "vpc", "subnet", "cidr", "routing", "network-partition"],
    iconSlug: "network-boundary",
  },
  node: { variant: "compact", minWidth: 240, minHeight: 140 },
  capabilities: ["network-containment", "cidr-allocation", "routing-policy", "rule-enforcement"],
  configSchema: networkBoundaryConfigSchema,
  defaultConfig: {
    label: "Production VPC",
    environment: "production",
    enabled: true,
    tags: ["network", "vpc", "cidr", "boundary"],
    componentType: "network-boundary",
    diagramUtilityClassification: "structural-container",
    networkName: "Production VPC",
    cidrBlock: "10.0.0.0/16",
    networkType: "vpc",
    routingMode: "direct-route",
    ingressRuleSummary: "Allow 443 from Load Balancer",
    egressRuleSummary: "Allow NAT egress to external APIs",
    enableDnsResolution: true,
  },
  ports: [
    {
      id: "net-in",
      name: "Network Ingress",
      type: "input",
      dataType: "ip-traffic",
      capacity: 10000,
      description: "Inbound IP traffic directed to subnet/VPC resources",
    },
    {
      id: "net-out",
      name: "Network Egress",
      type: "output",
      dataType: "ip-traffic",
      capacity: 10000,
      description: "Outbound packets egressing through gateways",
    },
    {
      id: "peering",
      name: "VPC Peering / Gateway",
      type: "bidirectional",
      dataType: "routed-traffic",
      capacity: 10000,
      description: "Peered connection between network boundaries",
    },
  ],
  inspector: [
    {
      id: "network-addressing",
      title: "Network Addressing & Subnet",
      fields: [
        { path: "networkName", label: "Network Name", type: "text" },
        { path: "cidrBlock", label: "CIDR IP Block", type: "text" },
        {
          path: "networkType",
          label: "Network Partition Type",
          type: "select",
          options: [
            { label: "Virtual Private Cloud (VPC)", value: "vpc" },
            { label: "Private Subnet", value: "subnet-private" },
            { label: "Public Subnet", value: "subnet-public" },
            { label: "Service Mesh Network", value: "mesh-network" },
          ],
        },
      ],
    },
    {
      id: "routing-security",
      title: "Routing & Gateways",
      fields: [
        {
          path: "routingMode",
          label: "Routing Mode",
          type: "select",
          options: [
            { label: "Direct Route Table", value: "direct-route" },
            { label: "NAT Gateway Egress", value: "nat-gateway" },
            { label: "Transit Gateway Hub", value: "transit-gateway" },
            { label: "VPC Peered Connection", value: "peered" },
          ],
        },
        { path: "ingressRuleSummary", label: "Ingress Security Rules", type: "text" },
        { path: "egressRuleSummary", label: "Egress Security Rules", type: "text" },
        { path: "enableDnsResolution", label: "Enable Private DNS Resolution", type: "boolean" },
      ],
    },
  ],
};

// 4. Trust Boundary Definition
export const trustBoundaryDefinition: InfrastructureComponentDefinition<TrustBoundaryConfig> = {
  id: "trust-boundary",
  version: 1,
  categoryId: ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  display: {
    name: "Trust Boundary",
    shortName: "Trust Boundary",
    description: "Security demarcation indicating change in privilege, trust level, and cryptographic verification requirements.",
    keywords: ["trust-boundary", "security-boundary", "zero-trust", "mtls", "threat-modeling", "pci-dss"],
    iconSlug: "trust-boundary",
  },
  node: { variant: "compact", minWidth: 220, minHeight: 120 },
  capabilities: ["trust-demarcation", "threat-modeling", "mtls-enforcement", "compliance-tagging"],
  configSchema: trustBoundaryConfigSchema,
  defaultConfig: {
    label: "Zero-Trust Perimeter",
    environment: "production",
    enabled: true,
    tags: ["security", "trust-boundary", "zero-trust", "mtls"],
    componentType: "trust-boundary",
    diagramUtilityClassification: "security-boundary",
    trustLevelFrom: "untrusted-public",
    trustLevelTo: "dmz-protected",
    enforcementMechanism: "mtls-and-jwt",
    complianceStandard: "soc2-type-2",
    requiresAuditLog: true,
    threatModelZone: "perimeter",
  },
  ports: [
    {
      id: "untrusted-in",
      name: "Untrusted Flow In",
      type: "input",
      dataType: "unverified-request",
      capacity: 5000,
      description: "Low-trust requests arriving at the boundary",
    },
    {
      id: "trusted-out",
      name: "Trusted Flow Out",
      type: "output",
      dataType: "authenticated-request",
      capacity: 5000,
      description: "Cryptographically authenticated requests entering the secure zone",
    },
    {
      id: "audit-events",
      name: "Audit Log Stream",
      type: "output",
      dataType: "security-audit-event",
      capacity: 2000,
      description: "Boundary crossing telemetry and authentication audit events",
    },
  ],
  inspector: [
    {
      id: "trust-levels",
      title: "Trust Levels & Zones",
      fields: [
        {
          path: "trustLevelFrom",
          label: "Source Trust Level",
          type: "select",
          options: [
            { label: "Untrusted Public Internet", value: "untrusted-public" },
            { label: "Authenticated User Session", value: "authenticated-user" },
            { label: "Internal Workload Service", value: "internal-workload" },
          ],
        },
        {
          path: "trustLevelTo",
          label: "Destination Security Level",
          type: "select",
          options: [
            { label: "DMZ Protected Tier", value: "dmz-protected" },
            { label: "High-Security Data Vault", value: "high-security-vault" },
            { label: "Root-Isolated Control Plane", value: "root-isolated" },
          ],
        },
        {
          path: "threatModelZone",
          label: "Threat Model Zone",
          type: "select",
          options: [
            { label: "Public Internet Zone", value: "internet" },
            { label: "Perimeter Ingress Zone", value: "perimeter" },
            { label: "Core Data Storage Zone", value: "core-data" },
            { label: "Management Admin Zone", value: "management" },
          ],
        },
      ],
    },
    {
      id: "enforcement-compliance",
      title: "Enforcement & Compliance",
      fields: [
        {
          path: "enforcementMechanism",
          label: "Verification Mechanism",
          type: "select",
          options: [
            { label: "mTLS + JWT Attestation", value: "mtls-and-jwt" },
            { label: "API Gateway Auth Policy", value: "api-gateway-auth" },
            { label: "Stateful Firewall Inspection", value: "firewall-inspection" },
            { label: "Zero-Trust Identity Proxy", value: "zero-trust-proxy" },
          ],
        },
        {
          path: "complianceStandard",
          label: "Compliance Benchmark",
          type: "select",
          options: [
            { label: "SOC2 Type II", value: "soc2-type-2" },
            { label: "PCI-DSS v4.0", value: "pci-dss-4.0" },
            { label: "HIPAA Security Rule", value: "hipaa" },
            { label: "FedRAMP High Baseline", value: "fedramp-high" },
            { label: "None / Internal Standard", value: "none" },
          ],
        },
        { path: "requiresAuditLog", label: "Mandatory Boundary Audit Logging", type: "boolean" },
      ],
    },
  ],
};

// 5. Architecture Note Definition
export const architectureNoteDefinition: InfrastructureComponentDefinition<ArchitectureNoteConfig> = {
  id: "architecture-note",
  version: 1,
  categoryId: ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  display: {
    name: "Architecture Note",
    shortName: "Arch Note",
    description: "Contextual sticky documentation card for architectural trade-offs, operational notes, and system assumptions.",
    keywords: ["architecture-note", "sticky-note", "documentation", "assumptions", "runbook", "annotation"],
    iconSlug: "architecture-note",
  },
  node: { variant: "compact", minWidth: 200, minHeight: 100 },
  capabilities: ["annotation", "markdown-text", "priority-tagging", "sticky-pinning"],
  configSchema: architectureNoteConfigSchema,
  defaultConfig: {
    label: "Asynchronous Ingestion Note",
    environment: "production",
    enabled: true,
    tags: ["annotation", "note", "documentation"],
    componentType: "architecture-note",
    diagramUtilityClassification: "annotation",
    noteTitle: "Asynchronous Ingestion Note",
    noteContent: "Ingestion queue provides 4-hour durability during downstream database maintenance windows.",
    noteType: "general",
    author: "Platform Architecture Team",
    priority: "info",
    pinned: true,
  },
  ports: [
    {
      id: "ref-target",
      name: "Referenced Node Target",
      type: "input",
      dataType: "node-reference",
      capacity: 5,
      description: "Reference link connected to target architecture node",
    },
    {
      id: "ref-source",
      name: "Note Anchor Out",
      type: "output",
      dataType: "annotation-link",
      capacity: 5,
      description: "Note callout pointing to relevant system component",
    },
  ],
  inspector: [
    {
      id: "note-header",
      title: "Note Metadata & Severity",
      fields: [
        { path: "noteTitle", label: "Note Title", type: "text" },
        {
          path: "noteType",
          label: "Note Classification",
          type: "select",
          options: [
            { label: "General Architecture Note", value: "general" },
            { label: "Operational Runbook Step", value: "operational-runbook" },
            { label: "Technical Assumptions", value: "assumptions" },
            { label: "Security & Vulnerability Notice", value: "security-notice" },
          ],
        },
        {
          path: "priority",
          label: "Importance Level",
          type: "select",
          options: [
            { label: "Informational (Info)", value: "info" },
            { label: "Operational Warning", value: "warning" },
            { label: "Critical Constraint", value: "critical" },
          ],
        },
      ],
    },
    {
      id: "note-body",
      title: "Documentation Content",
      fields: [
        { path: "noteContent", label: "Note Markdown / Plain Text", type: "textarea" },
        { path: "author", label: "Author / Owning Team", type: "text" },
        { path: "pinned", label: "Pin Note on Canvas", type: "boolean" },
      ],
    },
  ],
};

// 6. Decision Annotation Definition
export const decisionAnnotationDefinition: InfrastructureComponentDefinition<DecisionAnnotationConfig> = {
  id: "decision-annotation",
  version: 1,
  categoryId: ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  display: {
    name: "Decision Annotation",
    shortName: "ADR Annotation",
    description: "Formal Architecture Decision Record (ADR) reference linking diagram elements to governance decisions.",
    keywords: ["decision-annotation", "adr", "architecture-decision", "governance", "trade-off", "consequences"],
    iconSlug: "decision-annotation",
  },
  node: { variant: "compact", minWidth: 220, minHeight: 110 },
  capabilities: ["decision-tracking", "adr-linkage", "governance-record", "consequences-analysis"],
  configSchema: decisionAnnotationConfigSchema,
  defaultConfig: {
    label: "ADR-0042: Event-Driven Microservices",
    environment: "production",
    enabled: true,
    tags: ["adr", "decision", "governance", "architecture"],
    componentType: "decision-annotation",
    diagramUtilityClassification: "annotation",
    adrNumber: "ADR-0042",
    adrTitle: "Adopt Event-Driven Microservices",
    decisionStatus: "accepted",
    deciders: "Lead Architect, SecOps, Core Platform Team",
    consequencesSummary: "Requires Kafka event broker and schema registry; increases eventual consistency handling in frontend.",
    contextAndProblem: "Monolithic RPC causes cascading latency spikes during flash sales.",
    dateAdopted: "2026-03-15",
  },
  ports: [
    {
      id: "decision-target",
      name: "Affected Component",
      type: "output",
      dataType: "adr-association",
      capacity: 10,
      description: "Visual association link connecting ADR to impacted component",
    },
    {
      id: "context-in",
      name: "Context Inflow",
      type: "input",
      dataType: "architecture-context",
      capacity: 5,
      description: "Context requirement incoming from system requirement nodes",
    },
  ],
  inspector: [
    {
      id: "adr-identity",
      title: "ADR Identification & Status",
      fields: [
        { path: "adrNumber", label: "ADR Identifier", type: "text" },
        { path: "adrTitle", label: "Decision Title", type: "text" },
        {
          path: "decisionStatus",
          label: "Lifecycle Status",
          type: "select",
          options: [
            { label: "Proposed / RFC", value: "proposed" },
            { label: "Accepted & Ratified", value: "accepted" },
            { label: "Deprecated", value: "deprecated" },
            { label: "Superseded by Later ADR", value: "superseded" },
          ],
        },
        { path: "dateAdopted", label: "Adoption Date (YYYY-MM-DD)", type: "text" },
      ],
    },
    {
      id: "adr-rationale",
      title: "Context & Trade-Offs",
      fields: [
        { path: "contextAndProblem", label: "Context & Problem Statement", type: "textarea" },
        { path: "consequencesSummary", label: "Consequences & Known Trade-offs", type: "textarea" },
        { path: "deciders", label: "Decision Sign-off Group", type: "text" },
      ],
    },
  ],
};

// 7. Traffic Label Definition
export const trafficLabelDefinition: InfrastructureComponentDefinition<TrafficLabelConfig> = {
  id: "traffic-label",
  version: 1,
  categoryId: ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  display: {
    name: "Traffic Label",
    shortName: "Traffic Label",
    description: "Edge-associated annotation detailing protocol, payload serialization, throughput rates, and latency SLA assumptions.",
    keywords: ["traffic-label", "protocol", "throughput", "latency", "edge-label", "bandwidth"],
    iconSlug: "traffic-label",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  capabilities: ["traffic-metadata", "protocol-specification", "latency-sla", "edge-attachment"],
  configSchema: trafficLabelConfigSchema,
  defaultConfig: {
    label: "User Checkout Flow",
    environment: "production",
    enabled: true,
    tags: ["traffic", "edge-annotation", "sla", "protocol"],
    componentType: "traffic-label",
    diagramUtilityClassification: "edge-annotation",
    trafficDescription: "User Checkout Flow",
    protocol: "gRPC/HTTP2",
    bandwidthEst: "1k-10k rps",
    payloadFormat: "Protobuf",
    targetLatencyP99Ms: 50,
    encryptionInTransit: true,
    qosPriority: "high",
  },
  ports: [
    {
      id: "traffic-in",
      name: "Traffic In",
      type: "input",
      dataType: "monitored-flow",
      capacity: 10000,
      description: "Upstream edge connector arriving at label annotation",
    },
    {
      id: "traffic-out",
      name: "Traffic Out",
      type: "output",
      dataType: "monitored-flow",
      capacity: 10000,
      description: "Downstream edge connector leading to destination target",
    },
  ],
  inspector: [
    {
      id: "traffic-protocol",
      title: "Protocol & Wire Serialization",
      fields: [
        { path: "trafficDescription", label: "Flow Description", type: "text" },
        {
          path: "protocol",
          label: "Transport Protocol",
          type: "select",
          options: [
            { label: "HTTPS / REST JSON", value: "HTTPS/REST" },
            { label: "gRPC over HTTP/2", value: "gRPC/HTTP2" },
            { label: "WebSocket Bidirectional", value: "WebSocket" },
            { label: "Kafka TCP Binary", value: "Kafka/TCP" },
            { label: "GraphQL over HTTPS", value: "GraphQL" },
          ],
        },
        {
          path: "payloadFormat",
          label: "Payload Serialization",
          type: "select",
          options: [
            { label: "JSON (RFC 8259)", value: "JSON" },
            { label: "Protobuf v3 Binary", value: "Protobuf" },
            { label: "Apache Avro Schema", value: "Avro" },
            { label: "Raw Octet-Stream / Binary", value: "Binary" },
          ],
        },
      ],
    },
    {
      id: "traffic-performance",
      title: "Throughput & Latency Target",
      fields: [
        {
          path: "bandwidthEst",
          label: "Estimated Request Rate",
          type: "select",
          options: [
            { label: "< 100 req/sec", value: "<100 rps" },
            { label: "1,000 - 10,000 req/sec", value: "1k-10k rps" },
            { label: "10,000 - 100,000 req/sec", value: "10k-100k rps" },
            { label: "> 100,000 req/sec (High Scale)", value: ">100k rps" },
          ],
        },
        { path: "targetLatencyP99Ms", label: "p99 Target Latency (ms)", type: "number" },
        {
          path: "qosPriority",
          label: "Quality of Service (QoS)",
          type: "select",
          options: [
            { label: "Low Priority / Batch", value: "low" },
            { label: "Standard Application Traffic", value: "standard" },
            { label: "High Priority Interactive", value: "high" },
            { label: "Realtime Telemetry / Audio", value: "realtime" },
          ],
        },
        { path: "encryptionInTransit", label: "Enforce TLS In-Transit Encryption", type: "boolean" },
      ],
    },
  ],
};

// 8. Connection Junction Definition
export const connectionJunctionDefinition: InfrastructureComponentDefinition<ConnectionJunctionConfig> = {
  id: "connection-junction",
  version: 1,
  categoryId: ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  display: {
    name: "Connection Junction",
    shortName: "Junction Hub",
    description: "Compact routing point and orthogonal bus splitter for organizing multi-branch connections cleanly.",
    keywords: ["connection-junction", "bus", "splitter", "aggregator", "orthogonal-routing", "hub"],
    iconSlug: "connection-junction",
  },
  node: { variant: "compact", minWidth: 140, minHeight: 70 },
  capabilities: ["orthogonal-routing", "fanout-branching", "bus-aggregation", "wire-management"],
  configSchema: connectionJunctionConfigSchema,
  defaultConfig: {
    label: "Event Distribution Hub",
    environment: "production",
    enabled: true,
    tags: ["junction", "routing", "splitter", "hub"],
    componentType: "connection-junction",
    diagramUtilityClassification: "routing-junction",
    junctionLabel: "Event Distribution Hub",
    junctionType: "splitter",
    routingDirection: "ingress-fanout",
    maxConnections: 6,
    passThroughLatencyMs: 1,
    labelVisible: true,
  },
  ports: [
    {
      id: "hub-in",
      name: "Bus In",
      type: "input",
      dataType: "generic-signal",
      capacity: 16,
      description: "Primary incoming route or trunk bus",
    },
    {
      id: "hub-out-1",
      name: "Branch Out 1",
      type: "output",
      dataType: "generic-signal",
      capacity: 16,
      description: "First orthogonal routing branch",
    },
    {
      id: "hub-out-2",
      name: "Branch Out 2",
      type: "output",
      dataType: "generic-signal",
      capacity: 16,
      description: "Second orthogonal routing branch",
    },
    {
      id: "hub-tap",
      name: "Tap / Monitor Out",
      type: "output",
      dataType: "generic-signal",
      capacity: 16,
      description: "Monitoring tap or secondary collector connection",
    },
  ],
  inspector: [
    {
      id: "junction-type",
      title: "Junction Topology",
      fields: [
        { path: "junctionLabel", label: "Junction Tag", type: "text" },
        {
          path: "junctionType",
          label: "Junction Topology",
          type: "select",
          options: [
            { label: "Orthogonal T-Splitter", value: "orthogonal-tee" },
            { label: "Cross-Bus Junction", value: "cross-bus" },
            { label: "Ingress Splitter Hub", value: "splitter" },
            { label: "Egress Aggregator", value: "aggregator" },
          ],
        },
        {
          path: "routingDirection",
          label: "Routing Direction",
          type: "select",
          options: [
            { label: "Bidirectional Bus", value: "bidirectional" },
            { label: "Ingress Fanout (1-to-N)", value: "ingress-fanout" },
            { label: "Egress Merge (N-to-1)", value: "egress-merge" },
          ],
        },
      ],
    },
    {
      id: "junction-limits",
      title: "Routing Limits",
      fields: [
        { path: "maxConnections", label: "Max Allowed Connections", type: "number" },
        { path: "passThroughLatencyMs", label: "Pass-Through Overhead (ms)", type: "number" },
        { path: "labelVisible", label: "Show Junction Label", type: "boolean" },
      ],
    },
  ],
};

// 9. External Dependency Definition
export const externalDependencyDefinition: InfrastructureComponentDefinition<ExternalDependencyConfig> = {
  id: "external-dependency",
  version: 1,
  categoryId: ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  display: {
    name: "External Dependency",
    shortName: "External Dep",
    description: "Third-party SaaS API, cloud-managed dependency, or partner system with tracked SLA and failover policies.",
    keywords: ["external-dependency", "third-party", "vendor", "saas", "sla", "failover"],
    iconSlug: "external-dependency",
  },
  node: { variant: "compact", minWidth: 190, minHeight: 90 },
  capabilities: ["vendor-tracking", "sla-monitoring", "failover-policy", "external-integration"],
  configSchema: externalDependencyConfigSchema,
  defaultConfig: {
    label: "Stripe Payment Processing",
    environment: "production",
    enabled: true,
    tags: ["external", "dependency", "vendor", "third-party"],
    componentType: "external-dependency",
    diagramUtilityClassification: "dependency-reference",
    dependencyName: "Stripe Payment Processing",
    vendorName: "Stripe, Inc.",
    dependencyType: "saas-api",
    criticality: "tier-1-degraded",
    slaUptimePercent: 99.99,
    failoverStrategy: "fallback-cache",
    contactTeam: "Billing & Payments Guild",
  },
  ports: [
    {
      id: "ext-api-in",
      name: "API Calls In",
      type: "input",
      dataType: "external-request",
      capacity: 5000,
      description: "Application outbound calls into the third-party dependency",
    },
    {
      id: "ext-api-out",
      name: "Vendor Responses",
      type: "output",
      dataType: "vendor-response",
      capacity: 5000,
      description: "Responses or callbacks received from external vendor",
    },
    {
      id: "fallback-route",
      name: "Fallback Failover Route",
      type: "output",
      dataType: "fallback-traffic",
      capacity: 2000,
      description: "Rerouted traffic when primary vendor SLA degrades",
    },
  ],
  inspector: [
    {
      id: "vendor-profile",
      title: "Vendor & System Profile",
      fields: [
        { path: "dependencyName", label: "Dependency Name", type: "text" },
        { path: "vendorName", label: "Vendor Organization", type: "text" },
        {
          path: "dependencyType",
          label: "Dependency Classification",
          type: "select",
          options: [
            { label: "Third-Party SaaS API", value: "saas-api" },
            { label: "Proprietary SDK / Binary", value: "third-party-sdk" },
            { label: "Cloud Managed PaaS", value: "cloud-managed-paas" },
            { label: "Legacy Core Enterprise System", value: "legacy-core-system" },
          ],
        },
        { path: "contactTeam", label: "Internal Owner / Escalation Team", type: "text" },
      ],
    },
    {
      id: "sla-resilience",
      title: "SLA & Outage Resilience",
      fields: [
        {
          path: "criticality",
          label: "Failure Impact Criticality",
          type: "select",
          options: [
            { label: "Tier 0: Business Outage / Fatal", value: "tier-0-fatal" },
            { label: "Tier 1: Degraded Service", value: "tier-1-degraded" },
            { label: "Tier 2: Inconvenient / Non-blocking", value: "tier-2-inconvenient" },
          ],
        },
        { path: "slaUptimePercent", label: "Contractual SLA Uptime (%)", type: "number" },
        {
          path: "failoverStrategy",
          label: "Degraded Failover Policy",
          type: "select",
          options: [
            { label: "Serve from Cached Fallback", value: "fallback-cache" },
            { label: "Graceful Degraded Feature Mode", value: "graceful-degrade" },
            { label: "Fail-Fast Immediate 503", value: "fail-fast" },
            { label: "Switch to Secondary Provider", value: "secondary-provider" },
          ],
        },
      ],
    },
  ],
};

// 10. Failure Zone Definition
export const failureZoneDefinition: InfrastructureComponentDefinition<FailureZoneConfig> = {
  id: "failure-zone",
  version: 1,
  categoryId: ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  display: {
    name: "Failure Zone",
    shortName: "Failure Zone",
    description: "Failure domain boundary visualizing blast radiuses, AZ outages, recovery targets (RTO/RPO), and partition resilience.",
    keywords: ["failure-zone", "blast-radius", "rto", "rpo", "chaos-engineering", "partition-tolerance"],
    iconSlug: "failure-zone",
  },
  node: { variant: "compact", minWidth: 240, minHeight: 140 },
  capabilities: ["blast-radius-modeling", "rto-rpo-tracking", "chaos-testing", "disaster-recovery"],
  configSchema: failureZoneConfigSchema,
  defaultConfig: {
    label: "Primary AZ Failure Domain",
    environment: "production",
    enabled: true,
    tags: ["failure-zone", "blast-radius", "rto", "rpo", "chaos"],
    componentType: "failure-zone",
    diagramUtilityClassification: "failure-domain",
    zoneName: "Primary AZ Failure Domain",
    zoneType: "availability-zone",
    blastRadiusPercent: 33,
    recoveryRtoMinutes: 15,
    recoveryRpoMinutes: 0,
    chaosEngineeringTested: true,
    mitigationStrategy: "read-replica-promotion",
  },
  ports: [
    {
      id: "zone-ingress",
      name: "Zone Traffic In",
      type: "input",
      dataType: "isolated-traffic",
      capacity: 10000,
      description: "Traffic entering this specific failure domain",
    },
    {
      id: "zone-egress",
      name: "Zone Traffic Out",
      type: "output",
      dataType: "isolated-traffic",
      capacity: 10000,
      description: "Traffic egressing before partition isolation occurs",
    },
    {
      id: "dr-failover",
      name: "DR Failover Out",
      type: "output",
      dataType: "dr-replicated-traffic",
      capacity: 10000,
      description: "Failover route activated during disaster recovery",
    },
  ],
  inspector: [
    {
      id: "failure-domain-scope",
      title: "Failure Domain Scope",
      fields: [
        { path: "zoneName", label: "Zone Display Name", type: "text" },
        {
          path: "zoneType",
          label: "Failure Domain Category",
          type: "select",
          options: [
            { label: "Cloud Region Outage", value: "cloud-region-outage" },
            { label: "Single Availability Zone (AZ)", value: "availability-zone" },
            { label: "Data Center Rack Failure", value: "rack-failure" },
            { label: "Network Partition / Split Brain", value: "network-partition" },
            { label: "Power & Facility Failure", value: "power-domain" },
          ],
        },
        { path: "blastRadiusPercent", label: "Estimated Blast Radius (% of traffic)", type: "number" },
      ],
    },
    {
      id: "recovery-resilience",
      title: "RTO / RPO & Mitigation",
      fields: [
        { path: "recoveryRtoMinutes", label: "Recovery Time Objective (RTO min)", type: "number" },
        { path: "recoveryRpoMinutes", label: "Recovery Point Objective (RPO min)", type: "number" },
        { path: "chaosEngineeringTested", label: "Validated via Chaos GameDays", type: "boolean" },
        {
          path: "mitigationStrategy",
          label: "Automated Mitigation Strategy",
          type: "select",
          options: [
            { label: "Multi-Region Active-Active Failover", value: "multi-region-active-active" },
            { label: "Automated Read-Replica Promotion", value: "read-replica-promotion" },
            { label: "Circuit Breaker Shedding", value: "circuit-breaker-shedding" },
            { label: "Manual Runbook DR Playbook", value: "manual-dr-playbook" },
          ],
        },
      ],
    },
  ],
};

// All 10 Category 19 component definitions
export const ALL_ARCHITECTURE_AND_DIAGRAM_UTILITIES_DEFINITIONS: readonly InfrastructureComponentDefinition[] = [
  systemBoundaryDefinition,
  serviceGroupDefinition,
  networkBoundaryDefinition,
  trustBoundaryDefinition,
  architectureNoteDefinition,
  decisionAnnotationDefinition,
  trafficLabelDefinition,
  connectionJunctionDefinition,
  externalDependencyDefinition,
  failureZoneDefinition,
] as const;
