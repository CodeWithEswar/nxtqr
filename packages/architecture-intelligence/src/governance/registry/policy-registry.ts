/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Enterprise Architecture Policy Registry & Standard Bundles
 */

import type {
  GovernancePolicy,
  PolicyBundle,
  GovernanceProvenance,
} from "../contracts/governance.types";

const now = new Date().toISOString();

const defaultProvenance: GovernanceProvenance = {
  source: "system_guardrail",
  author: "NXTQR Architecture Governance Engine",
  timestamp: now,
  confirmed: true,
};

export class PolicyRegistry {
  private static instance: PolicyRegistry;
  private policies: Map<string, GovernancePolicy> = new Map();
  private bundles: Map<string, PolicyBundle> = new Map();

  constructor() {
    this.registerDefaultPolicies();
    this.registerDefaultBundles();
  }

  public static getInstance(): PolicyRegistry {
    if (!PolicyRegistry.instance) {
      PolicyRegistry.instance = new PolicyRegistry();
    }
    return PolicyRegistry.instance;
  }

  public static getAllPolicies(): GovernancePolicy[] {
    return PolicyRegistry.getInstance().getAllPolicies();
  }

  public static getAllBundles(): PolicyBundle[] {
    return PolicyRegistry.getInstance().getAllBundles();
  }

  public static getPolicy(id: string): GovernancePolicy | undefined {
    return PolicyRegistry.getInstance().getPolicy(id);
  }

  public static getBundle(id: string): PolicyBundle | undefined {
    return PolicyRegistry.getInstance().getBundle(id);
  }

  private registerDefaultPolicies(): void {
    const defaultPolicies: GovernancePolicy[] = [
      {
        id: "POL-SEC-001",
        organizationId: "org-global",
        version: "1.0.0",
        title: "No Public Ingress Without Approved API Gateway",
        description: "Direct internet access to backend workloads or databases is strictly prohibited. All public ingress must terminate at an approved API Gateway or reverse proxy.",
        category: "security",
        severity: "critical",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          environments: ["production", "staging"],
        },
        rule: {
          id: "rule-sec-001",
          operator: "all",
          children: [
            {
              id: "r1-no-direct-public-db",
              targetProperty: "database.isPubliclyAccessible",
              operator: "equals",
              expectedValue: false,
              description: "Databases must not have public IP bindings.",
            },
            {
              id: "r1-public-ingress-via-gateway",
              targetProperty: "ingress.hasApprovedGateway",
              operator: "equals",
              expectedValue: true,
              description: "Public ingress must pass through a managed gateway.",
            },
          ],
        },
        requiredEvidenceTypes: ["architecture_graph", "security_configuration"],
        remediationGuidance: "Route external traffic through an approved API Gateway (e.g. Envoy, AWS API Gateway) and place databases inside a private VPC subnet.",
        controlMappings: [
          {
            framework: {
              frameworkId: "nist_800_53_r5",
              frameworkName: "NIST SP 800-53 Rev 5",
              frameworkVersion: "Rev 5",
              controlId: "AC-3",
              controlTitle: "Access Enforcement",
              sourceUrl: "https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final",
            },
            supportStrength: "direct_technical_support",
            coverageNotes: "Enforces ingress boundary perimeter restrictions on public API and database endpoints.",
            disclaimer: "Non-Certification: Technical architecture verification only. Does not constitute regulatory or legal compliance certification.",
          },
        ],
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-SEC-002",
        organizationId: "org-global",
        version: "1.0.0",
        title: "Strict TLS/HTTPS Encryption on All Ingress Routes",
        description: "Unencrypted HTTP or plaintext ingress traffic across public networks is prohibited. All endpoints must terminate TLS 1.2+ or redirect HTTP to HTTPS.",
        category: "security",
        severity: "critical",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          environments: ["production", "staging"],
        },
        rule: {
          id: "rule-sec-002",
          targetProperty: "path.hasPlaintextHop",
          operator: "equals",
          expectedValue: false,
          description: "Ingress path traversal must not contain unencrypted plaintext hops.",
        },
        requiredEvidenceTypes: ["architecture_graph", "deployment_metadata"],
        remediationGuidance: "Enable TLS termination on all gateway listeners and configure automatic 301 redirects for HTTP requests.",
        controlMappings: [
          {
            framework: {
              frameworkId: "owasp_asvs_4",
              frameworkName: "OWASP ASVS",
              frameworkVersion: "4.0.3",
              controlId: "V9.1.1",
              controlTitle: "Communications Security — TLS Enforcement",
            },
            supportStrength: "direct_technical_support",
            coverageNotes: "Validates elimination of plaintext transport channels across public network boundaries.",
            disclaimer: "Non-Certification: Technical architecture verification only. Does not constitute regulatory or legal compliance certification.",
          },
        ],
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-SEC-003",
        organizationId: "org-global",
        version: "1.0.0",
        title: "Strict Mutual TLS (mTLS) Between Microservices",
        description: "Zero-Trust network architecture standard: all internal service-to-service communication within VPC boundaries must enforce strict mTLS identity verification.",
        category: "network",
        severity: "high",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          environments: ["production"],
        },
        rule: {
          id: "rule-sec-003",
          targetProperty: "serviceMesh.mtlsMode",
          operator: "equals",
          expectedValue: "mtls_strict",
          description: "Service mesh must operate in strict mTLS mode.",
        },
        requiredEvidenceTypes: ["deployment_metadata", "security_configuration"],
        remediationGuidance: "Deploy Istio or Linkerd service mesh in STRICT mTLS mode to cryptographically authenticate inter-service traffic.",
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-REL-001",
        organizationId: "org-global",
        version: "1.0.0",
        title: "Critical Production Services Must Have Multi-AZ Redundancy",
        description: "All tier-1 business-critical services and databases must be provisioned across at least 2 independent Availability Zones to withstand data center loss.",
        category: "reliability",
        severity: "critical",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          environments: ["production"],
        },
        rule: {
          id: "rule-rel-001",
          targetProperty: "resource.availabilityZoneCount",
          operator: "greater_than",
          expectedValue: 1,
          description: "Resource must span 2 or more availability zones.",
        },
        requiredEvidenceTypes: ["deployment_metadata"],
        remediationGuidance: "Configure multi-AZ deployments with auto-scaling replicas across distinct availability zones.",
        controlMappings: [
          {
            framework: {
              frameworkId: "soc_2_tsc_2017",
              frameworkName: "SOC 2 Trust Services Criteria",
              frameworkVersion: "2017",
              controlId: "A1.2",
              controlTitle: "Availability — Redundancy & Recovery",
            },
            supportStrength: "partial_technical_support",
            coverageNotes: "Validates architectural infrastructure redundancy across isolated failure domains.",
            disclaimer: "Non-Certification: Technical architecture verification only. Does not constitute regulatory or legal compliance certification.",
          },
        ],
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-REL-002",
        organizationId: "org-global",
        version: "1.0.0",
        title: "Upstream Pools Must Declare Active Health Check Probes",
        description: "Every load balancer upstream pool and Kubernetes backend service must configure active HTTP/TCP health checks to prune failing instances from traffic routing.",
        category: "reliability",
        severity: "high",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          environments: ["production", "staging"],
        },
        rule: {
          id: "rule-rel-002",
          targetProperty: "upstreamPool.hasHealthCheck",
          operator: "equals",
          expectedValue: true,
          description: "Upstream pool must have an active probe configuration.",
        },
        requiredEvidenceTypes: ["architecture_graph", "deployment_metadata"],
        remediationGuidance: "Attach an active health check policy (`/healthz` or `/actuator/health`) with realistic intervals and threshold counts.",
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-REL-003",
        organizationId: "org-global",
        version: "1.0.0",
        title: "Synchronous Service-to-Service Calls Must Configure Circuit Breakers",
        description: "To prevent cascading failure cascades, synchronous HTTP/gRPC downstream dependencies must configure outlier detection circuit breakers.",
        category: "reliability",
        severity: "medium",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          environments: ["production"],
        },
        rule: {
          id: "rule-rel-003",
          targetProperty: "route.hasCircuitBreaker",
          operator: "equals",
          expectedValue: true,
          description: "Route must have an outlier detection circuit breaker configured.",
        },
        requiredEvidenceTypes: ["architecture_graph", "deployment_metadata"],
        remediationGuidance: "Define consecutive error thresholds and recovery timeouts on gateway routes or service mesh policies.",
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-DAT-001",
        organizationId: "org-global",
        version: "1.0.0",
        title: "Production Databases Must Have Declared Automated Backup Policies",
        description: "Stateful databases in production environments must declare automated daily snapshot policies and point-in-time recovery (PITR) with retention >= 7 days.",
        category: "database",
        severity: "critical",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          environments: ["production"],
          componentTypes: ["database"],
        },
        rule: {
          id: "rule-dat-001",
          targetProperty: "database.hasBackupPolicy",
          operator: "equals",
          expectedValue: true,
          description: "Database must configure automated backup and point-in-time recovery.",
        },
        requiredEvidenceTypes: ["database_schema", "backup_verification"],
        remediationGuidance: "Enable automated daily backups with continuous write-ahead log archiving (WAL-G, AWS Backup, or native RDS PITR).",
        controlMappings: [
          {
            framework: {
              frameworkId: "iso_27001_2022",
              frameworkName: "ISO/IEC 27001:2022",
              frameworkVersion: "2022",
              controlId: "A.8.13",
              controlTitle: "Information Backup",
            },
            supportStrength: "partial_technical_support",
            coverageNotes: "Validates declared backup schedules and automated recovery point capabilities.",
            disclaimer: "Non-Certification: Technical architecture verification only. Does not constitute regulatory or legal compliance certification.",
          },
        ],
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-DAT-002",
        organizationId: "org-global",
        version: "1.0.0",
        title: "Confidential Data Stores Must Enforce Encryption at Rest",
        description: "All databases, caches, and storage volumes storing confidential or restricted data must be protected with hardware-accelerated AES-256 or KMS encryption.",
        category: "data_protection",
        severity: "critical",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          dataClassifications: ["confidential", "restricted"],
        },
        rule: {
          id: "rule-dat-002",
          targetProperty: "storage.isEncryptedAtRest",
          operator: "equals",
          expectedValue: true,
          description: "Storage must have encryption at rest enabled.",
        },
        requiredEvidenceTypes: ["security_configuration", "database_schema"],
        remediationGuidance: "Enable transparent data encryption (TDE) or cloud volume encryption (AWS KMS / GCP Cloud KMS) on all disk volumes.",
        controlMappings: [
          {
            framework: {
              frameworkId: "pci_dss_4",
              frameworkName: "PCI DSS v4.0",
              frameworkVersion: "4.0",
              controlId: "Req 3.4",
              controlTitle: "Protect Stored Account Data",
            },
            supportStrength: "direct_technical_support",
            coverageNotes: "Enforces strong cryptography at rest for cardholder and confidential databases.",
            disclaimer: "Non-Certification: Technical architecture verification only. Does not constitute regulatory or legal compliance certification.",
          },
        ],
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-DAT-003",
        organizationId: "org-global",
        version: "1.0.0",
        title: "EU Customer Data Residency Enforced (No Unauthorized US Transfers)",
        description: "Customer personal identifiable information (PII) belonging to European Union subjects must remain stored and processed within EU regions (e.g. eu-west-1, eu-central-1).",
        category: "data_protection",
        severity: "high",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          dataClassifications: ["confidential", "restricted"],
          tags: ["gdpr", "eu_residents"],
        },
        rule: {
          id: "rule-dat-003",
          targetProperty: "resource.geographicRegion",
          operator: "in_set",
          expectedValue: ["eu-west-1", "eu-central-1", "eu-west-2", "eu-north-1"],
          description: "Storage and processing nodes must reside in approved EU cloud regions.",
        },
        requiredEvidenceTypes: ["data_classification", "deployment_metadata"],
        remediationGuidance: "Migrate primary storage and processing workloads for EU user datasets to European data centers.",
        controlMappings: [
          {
            framework: {
              frameworkId: "gdpr",
              frameworkName: "General Data Protection Regulation (GDPR)",
              frameworkVersion: "2016/679",
              controlId: "Art. 44-49",
              controlTitle: "Transfers of Personal Data to Third Countries",
            },
            supportStrength: "supporting_evidence",
            coverageNotes: "Validates technical boundary isolation of EU personal data stores.",
            disclaimer: "Non-Certification: Technical architecture verification only. Does not constitute regulatory or legal compliance certification.",
          },
        ],
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-API-001",
        organizationId: "org-global",
        version: "1.0.0",
        title: "Public APIs Must Enforce Token-Bucket Rate Limiting",
        description: "Publicly accessible API gateway routes must configure rate limiters to defend against resource exhaustion, credential stuffing, and brute force attacks.",
        category: "api_governance",
        severity: "high",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          environments: ["production"],
        },
        rule: {
          id: "rule-api-001",
          targetProperty: "route.hasRateLimiting",
          operator: "equals",
          expectedValue: true,
          description: "Route must have an active rate limit policy.",
        },
        requiredEvidenceTypes: ["architecture_graph", "api_contract"],
        remediationGuidance: "Configure rate limiting on gateway routes with appropriate per-IP or per-token window quotas.",
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-OBS-001",
        organizationId: "org-global",
        version: "1.0.0",
        title: "All Production Workloads Must Export Telemetry Metrics & Distributed Traces",
        description: "Production services must be instrumented with OpenTelemetry or Prometheus agents to export golden signals (latency, errors, throughput, saturation).",
        category: "observability",
        severity: "medium",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          environments: ["production"],
        },
        rule: {
          id: "rule-obs-001",
          targetProperty: "service.hasTelemetryExport",
          operator: "equals",
          expectedValue: true,
          description: "Service must export metrics and tracing telemetry.",
        },
        requiredEvidenceTypes: ["telemetry_metric", "deployment_metadata"],
        remediationGuidance: "Inject the OpenTelemetry collector sidecar or Prometheus exporter into service deployments.",
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-TEC-001",
        organizationId: "org-global",
        version: "1.0.0",
        title: "Prohibit Deprecated Database Engines",
        description: "Outdated and unsupported database engines (MySQL <= 5.7, PostgreSQL <= 12) have known unpatched CVEs and are strictly prohibited in all environments.",
        category: "technology_standards",
        severity: "high",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
          componentTypes: ["database"],
        },
        rule: {
          id: "rule-tec-001",
          targetProperty: "database.isEngineVersionSupported",
          operator: "equals",
          expectedValue: true,
          description: "Database engine version must be actively supported by upstream maintainers.",
        },
        requiredEvidenceTypes: ["database_schema", "deployment_metadata"],
        remediationGuidance: "Upgrade database instances to supported LTS releases (PostgreSQL 14+, MySQL 8.0+).",
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "POL-CST-001",
        organizationId: "org-global",
        version: "1.0.0",
        title: "Provisioned Workloads Must Have Declared Ownership & Cost Budgets",
        description: "Every cloud resource, database, and service cluster must declare an engineering owner tag and approved monthly budget allocation.",
        category: "cost",
        severity: "medium",
        status: "active",
        scope: {
          level: "organization",
          organizationId: "org-global",
        },
        rule: {
          id: "rule-cst-001",
          targetProperty: "resource.hasOwnerTag",
          operator: "equals",
          expectedValue: true,
          description: "Resource must have an ownership team tag assigned.",
        },
        requiredEvidenceTypes: ["deployment_metadata", "architecture_graph"],
        remediationGuidance: "Tag all architecture nodes with `owner: <team-slug>` and register monthly budget caps in Cost Intelligence.",
        provenance: defaultProvenance,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const policy of defaultPolicies) {
      this.policies.set(policy.id, policy);
    }
  }

  private registerDefaultBundles(): void {
    const defaultBundles: PolicyBundle[] = [
      {
        id: "bundle-baseline",
        bundleType: "baseline_architecture",
        name: "Baseline Architecture Standards",
        description: "Foundational engineering guardrails: ownership tags, telemetry instrumentation, and engine currency.",
        version: "1.0.0",
        policyIds: ["POL-OBS-001", "POL-TEC-001", "POL-CST-001"],
        isMandatory: true,
        provenance: defaultProvenance,
      },
      {
        id: "bundle-production-readiness",
        bundleType: "production_readiness",
        name: "Production Readiness Guardrails",
        description: "Mandatory pre-production release gates: multi-AZ resilience, automated backups, and health checks.",
        version: "1.0.0",
        policyIds: ["POL-REL-001", "POL-REL-002", "POL-REL-003", "POL-DAT-001", "POL-SEC-001", "POL-SEC-002"],
        isMandatory: true,
        provenance: defaultProvenance,
      },
      {
        id: "bundle-zero-trust",
        bundleType: "zero_trust_network",
        name: "Zero-Trust Network & Ingress Security",
        description: "Perimeter enforcement, API gateway ingress, TLS termination, and internal strict mTLS service mesh.",
        version: "1.0.0",
        policyIds: ["POL-SEC-001", "POL-SEC-002", "POL-SEC-003", "POL-API-001"],
        isMandatory: false,
        provenance: defaultProvenance,
      },
      {
        id: "bundle-data-privacy-gdpr",
        bundleType: "data_privacy_gdpr",
        name: "Data Protection & Privacy Architecture",
        description: "Storage encryption at rest, data classification, and EU customer residency boundaries.",
        version: "1.0.0",
        policyIds: ["POL-DAT-002", "POL-DAT-003"],
        isMandatory: false,
        provenance: defaultProvenance,
      },
      {
        id: "bundle-financial-compliance",
        bundleType: "financial_compliance",
        name: "Financial & High-Assurance Enclave Guardrails",
        description: "Strict isolation, mTLS, confidential data encryption, and continuous automated backup enforcement.",
        version: "1.0.0",
        policyIds: ["POL-SEC-001", "POL-SEC-002", "POL-SEC-003", "POL-DAT-001", "POL-DAT-002", "POL-API-001"],
        isMandatory: false,
        provenance: defaultProvenance,
      },
    ];

    for (const bundle of defaultBundles) {
      this.bundles.set(bundle.id, bundle);
    }
  }

  public getPolicy(id: string): GovernancePolicy | undefined {
    return this.policies.get(id);
  }

  public getAllPolicies(): GovernancePolicy[] {
    return Array.from(this.policies.values());
  }

  public registerPolicy(policy: GovernancePolicy): void {
    this.policies.set(policy.id, policy);
  }

  public getBundle(id: string): PolicyBundle | undefined {
    return this.bundles.get(id);
  }

  public getAllBundles(): PolicyBundle[] {
    return Array.from(this.bundles.values());
  }

  public registerBundle(bundle: PolicyBundle): void {
    this.bundles.set(bundle.id, bundle);
  }

  public getPoliciesForBundle(bundleId: string): GovernancePolicy[] {
    const bundle = this.bundles.get(bundleId);
    if (!bundle) return [];
    return bundle.policyIds
      .map((id) => this.policies.get(id))
      .filter((p): p is GovernancePolicy => p !== undefined);
  }
}

export const policyRegistry = PolicyRegistry.getInstance();
