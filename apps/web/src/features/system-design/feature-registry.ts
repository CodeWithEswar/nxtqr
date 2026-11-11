/**
 * NXTQR — Interactive Visual Engineering Studio
 * Architecture Intelligence Suite: Complete Feature Registry (30 Production Engines)
 */

export type ArchitectureFeatureCategory =
  | "diagnostics"
  | "infrastructure"
  | "governance"
  | "operations"
  | "intelligence";

export interface ArchitectureFeature {
  id: string;
  name: string;
  shortName: string;
  category: ArchitectureFeatureCategory;
  phase: string;
  description: string;
  badgeLabel: string;
  badgeTag: "ANALYZER" | "GATE" | "SIMULATION" | "FINOPS" | "COPILOT" | "TOPOLOGY";
  iconName: string;
  isPrimaryToolbarBadge?: boolean;
}

export const ARCHITECTURE_FEATURE_CATEGORIES: Array<{
  id: ArchitectureFeatureCategory | "all";
  label: string;
  count: number;
}> = [
  { id: "all", label: "All Engines", count: 30 },
  { id: "diagnostics", label: "Diagnostics & Health", count: 7 },
  { id: "infrastructure", label: "Cloud & Topology", count: 7 },
  { id: "governance", label: "Governance & Quality", count: 6 },
  { id: "operations", label: "Operations & Modernization", count: 7 },
  { id: "intelligence", label: "Intelligence & AI", count: 3 },
];

export const ARCHITECTURE_FEATURES: ArchitectureFeature[] = [
  // 1. Diagnostics & Health (7)
  {
    id: "validation",
    name: "Architecture Validation & Topology Linting",
    shortName: "Validation",
    category: "diagnostics",
    phase: "Phase 05.1",
    description: "Deterministic graph linting, disconnected node detection, and invalid edge contracts.",
    badgeLabel: "Lint Clean",
    badgeTag: "ANALYZER",
    iconName: "CheckCircleIcon",
    isPrimaryToolbarBadge: true,
  },
  {
    id: "health",
    name: "Architecture Health Radar & Scoring",
    shortName: "Health",
    category: "diagnostics",
    phase: "Phase 05.2",
    description: "Holistic multi-pillar architecture health rating (A-F), radar metrics, and risk indicators.",
    badgeLabel: "Health A·96",
    badgeTag: "ANALYZER",
    iconName: "ActivityIcon",
    isPrimaryToolbarBadge: true,
  },
  {
    id: "bottlenecks",
    name: "Capacity & Bottleneck Detection Engine",
    shortName: "Bottlenecks",
    category: "diagnostics",
    phase: "Phase 05.3.1",
    description: "Queuing models, throughput saturation thresholds, and link contention warnings.",
    badgeLabel: "0 Sat",
    badgeTag: "ANALYZER",
    iconName: "CpuIcon",
    isPrimaryToolbarBadge: true,
  },
  {
    id: "failure-analysis",
    name: "SPOF & Resiliency Analysis Engine",
    shortName: "Resiliency",
    category: "diagnostics",
    phase: "Phase 05.3.2",
    description: "Single points of failure, cascading blast radius isolation, and recovery domains.",
    badgeLabel: "0 SPOF",
    badgeTag: "ANALYZER",
    iconName: "ShieldIcon",
    isPrimaryToolbarBadge: true,
  },
  {
    id: "security-analysis",
    name: "Security Architecture & Threat Modeling",
    shortName: "Security",
    category: "diagnostics",
    phase: "Phase 05.3.3",
    description: "Trust boundaries, attack vectors, unencrypted transit paths, and least-privilege analysis.",
    badgeLabel: "Clean",
    badgeTag: "ANALYZER",
    iconName: "LockIcon",
    isPrimaryToolbarBadge: true,
  },
  {
    id: "scalability",
    name: "Scalability Recommendations & What-If Planner",
    shortName: "Scalability",
    category: "diagnostics",
    phase: "Phase 05.3.4",
    description: "Automated scaling proposals, horizontal/vertical remedies, and live what-if simulation.",
    badgeLabel: "Optimized",
    badgeTag: "ANALYZER",
    iconName: "SlidersIcon",
    isPrimaryToolbarBadge: true,
  },
  {
    id: "capacity-planning",
    name: "Capacity Planning & Demand Forecasting",
    shortName: "Capacity",
    category: "diagnostics",
    phase: "Phase 05.3.10",
    description: "Growth forecasting, traffic surge simulation, saturation horizons, and resource runway.",
    badgeLabel: "Runway OK",
    badgeTag: "ANALYZER",
    iconName: "ActivityIcon",
  },

  // 2. Cloud Infrastructure & Platform Topology (7)
  {
    id: "deployment",
    name: "Deployment Topology & Infra Mapping",
    shortName: "Deployment",
    category: "infrastructure",
    phase: "Phase 05.3.18",
    description: "Terraform/K8s infrastructure mapping, VPC boundaries, regional topologies, and drift records.",
    badgeLabel: "Infra Synced",
    badgeTag: "TOPOLOGY",
    iconName: "LayersIcon",
  },
  {
    id: "network",
    name: "Network, API Gateway & Traffic Engineering",
    shortName: "Network",
    category: "infrastructure",
    phase: "Phase 05.3.24",
    description: "DNS resolution failover, CDN edge routing, API gateway policies, and service meshes.",
    badgeLabel: "Routes OK",
    badgeTag: "TOPOLOGY",
    iconName: "NetworkIcon",
  },
  {
    id: "database",
    name: "Database Design, Query & Storage Intelligence",
    shortName: "Database",
    category: "infrastructure",
    phase: "Phase 05.3.23",
    description: "Schema designer, query plan inspector, index advisor, transaction locks, and replication.",
    badgeLabel: "Schema Valid",
    badgeTag: "TOPOLOGY",
    iconName: "DatabaseIcon",
  },
  {
    id: "messaging",
    name: "Distributed Messaging & Event Systems",
    shortName: "Messaging",
    category: "infrastructure",
    phase: "Phase 05.3.21",
    description: "Kafka/RabbitMQ topology, event flow tracing, transactional outbox, and DLQ monitoring.",
    badgeLabel: "Events Flowing",
    badgeTag: "TOPOLOGY",
    iconName: "ActivityIcon",
  },
  {
    id: "cache-state",
    name: "Caching, Consistency & State Management",
    shortName: "Cache & State",
    category: "infrastructure",
    phase: "Phase 05.3.22",
    description: "Cache stampede prevention, invalidation policies, consistency models, and session stores.",
    badgeLabel: "Cache Warm",
    badgeTag: "TOPOLOGY",
    iconName: "DatabaseIcon",
  },
  {
    id: "data-lineage",
    name: "Data Lineage & Privacy Governance Engine",
    shortName: "Data Lineage",
    category: "infrastructure",
    phase: "Phase 05.3.19",
    description: "Source-to-sink data asset flows, GDPR/HIPAA compliance, and PII protection tracking.",
    badgeLabel: "Lineage Mapped",
    badgeTag: "TOPOLOGY",
    iconName: "LayersIcon",
  },
  {
    id: "api-contracts",
    name: "API Contracts & Service Interface Evolution",
    shortName: "API Contracts",
    category: "infrastructure",
    phase: "Phase 05.3.20",
    description: "OpenAPI/Protobuf interface validation, breaking change detection, and consumer dependencies.",
    badgeLabel: "Contracts Valid",
    badgeTag: "TOPOLOGY",
    iconName: "FileTextIcon",
  },

  // 3. Governance, Quality & Release Gates (6)
  {
    id: "governance",
    name: "Architecture Compliance & Policy-as-Code",
    shortName: "Governance",
    category: "governance",
    phase: "Phase 05.3.25",
    description: "Rego/OPA guardrails, organizational engineering standards, drift alerts, and exceptions.",
    badgeLabel: "Compliant",
    badgeTag: "GATE",
    iconName: "ShieldIcon",
  },
  {
    id: "verification",
    name: "Architecture Testing & Readiness Gates Engine",
    shortName: "Verification",
    category: "governance",
    phase: "Phase 05.3.28",
    description: "Architecture test suites, assertions, regression baselines, and release readiness gates.",
    badgeLabel: "Tests Passed",
    badgeTag: "GATE",
    iconName: "CheckCircleIcon",
  },
  {
    id: "readiness",
    name: "Production Readiness & Release Sign-Off",
    shortName: "Readiness",
    category: "governance",
    phase: "Phase 05.3.30",
    description: "Unified 30-feature production release gate, capability matrix, and non-fabrication verified release.",
    badgeLabel: "Release Ready",
    badgeTag: "GATE",
    iconName: "ShieldIcon",
  },
  {
    id: "reviews",
    name: "Architecture Reviews & Approval Workflows",
    shortName: "Reviews",
    category: "governance",
    phase: "Phase 05.3.13",
    description: "Design review sessions, revision comparisons, threaded RFC comments, and sign-off decisions.",
    badgeLabel: "In Review",
    badgeTag: "GATE",
    iconName: "CheckCircleIcon",
  },
  {
    id: "reports",
    name: "Architecture Reports & ADR Publisher",
    shortName: "Reports & ADRs",
    category: "governance",
    phase: "Phase 05.3.12",
    description: "Executive architecture reports, Architecture Decision Records, and Markdown/PDF export.",
    badgeLabel: "ADRs Ready",
    badgeTag: "GATE",
    iconName: "FileTextIcon",
  },
  {
    id: "cost",
    name: "Cost Intelligence & FinOps Engine",
    shortName: "Cost Intelligence",
    category: "governance",
    phase: "Phase 05.3.11",
    description: "Real-time AWS/GCP/Azure billable cost projection, FinOps breakdowns, and rightsizing.",
    badgeLabel: "FinOps Live",
    badgeTag: "FINOPS",
    iconName: "SlidersIcon",
  },

  // 4. Operations, Resilience & Modernization (6)
  {
    id: "simulation",
    name: "Chaos Engineering & Failure Simulation",
    shortName: "Chaos Simulation",
    category: "operations",
    phase: "Phase 05.3.15",
    description: "Failure injection, degradation propagation timeline, and chaos experiment verification.",
    badgeLabel: "Chaos Ready",
    badgeTag: "SIMULATION",
    iconName: "PlayIcon",
  },
  {
    id: "observability",
    name: "Observability & OpenTelemetry Mapping",
    shortName: "Observability",
    category: "operations",
    phase: "Phase 05.3.16",
    description: "OTel trace waterfall, service-to-node telemetry mapping, and real-time SLO monitoring.",
    badgeLabel: "OTel Connected",
    badgeTag: "SIMULATION",
    iconName: "ActivityIcon",
  },
  {
    id: "performance",
    name: "Performance Benchmarking & Load Testing",
    shortName: "Performance",
    category: "operations",
    phase: "Phase 05.3.17",
    description: "k6/JMeter automated load testing planner, latency budgets, and RPS degradation curves.",
    badgeLabel: "Benchmark OK",
    badgeTag: "SIMULATION",
    iconName: "ActivityIcon",
  },
  {
    id: "operations",
    name: "Incident Response & Disaster Recovery",
    shortName: "Incident & DR",
    category: "operations",
    phase: "Phase 05.3.27",
    description: "RTO/RPO calculator, recovery dependencies, tabletop drill simulator, and runbook library.",
    badgeLabel: "DR Prepared",
    badgeTag: "SIMULATION",
    iconName: "ShieldIcon",
  },
  {
    id: "evolution",
    name: "Architecture Evolution & Modernization Planner",
    shortName: "Evolution",
    category: "operations",
    phase: "Phase 05.3.26",
    description: "Monolith-to-microservices migration waves, strangler fig patterns, and rollback blueprints.",
    badgeLabel: "Migration Plan",
    badgeTag: "SIMULATION",
    iconName: "LayersIcon",
  },
  {
    id: "comparison",
    name: "Architecture Diff & Version Comparison",
    shortName: "Comparison",
    category: "operations",
    phase: "Phase 05.3.14",
    description: "Semantic topology diffing, structural delta inspection, and revision comparison.",
    badgeLabel: "Diff Viewer",
    badgeTag: "SIMULATION",
    iconName: "SlidersIcon",
  },
  {
    id: "execution",
    name: "Interactive Architecture Execution & Run Visualizer",
    shortName: "Execution",
    category: "operations",
    phase: "Phase 05.4.1",
    description: "Step-by-step model-based execution flows, animated packets, virtual timing, and contextual inspectors.",
    badgeLabel: "Flow Active",
    badgeTag: "SIMULATION",
    iconName: "PlayIcon",
  },

  // 5. Intelligence, Orchestration & AI (3)
  {
    id: "orchestration",
    name: "Unified Intelligence Orchestration & DAG",
    shortName: "Orchestration",
    category: "intelligence",
    phase: "Phase 05.3.29",
    description: "Cross-analyzer DAG scheduler, finding correlation, root cause analysis, and contradiction resolution.",
    badgeLabel: "DAG Synced",
    badgeTag: "ANALYZER",
    iconName: "LayersIcon",
  },
  {
    id: "ai-assistant",
    name: "Architecture Copilot & AI Assistant",
    shortName: "AI Copilot",
    category: "intelligence",
    phase: "Phase 05.3.1",
    description: "Natural language graph editing, architecture reasoning, and automated structural proposals.",
    badgeLabel: "AI Active",
    badgeTag: "COPILOT",
    iconName: "CpuIcon",
  },
  {
    id: "recommendations",
    name: "Unified Architecture Recommendations Feed",
    shortName: "Recommendations",
    category: "intelligence",
    phase: "Phase 05.3.5",
    description: "Ranked remediation actions across security, performance, cost, and reliability.",
    badgeLabel: "Actions Available",
    badgeTag: "COPILOT",
    iconName: "SlidersIcon",
  },
];

export function getFeatureById(id: string): ArchitectureFeature | undefined {
  return ARCHITECTURE_FEATURES.find((f) => f.id === id);
}

export function getFeaturesByCategory(category: ArchitectureFeatureCategory): ArchitectureFeature[] {
  return ARCHITECTURE_FEATURES.filter((f) => f.category === category);
}

