/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Migration Strategy Registry (The 7 R's + Modern Cloud & Evolutionary Patterns)
 */

import type { MigrationStrategy, MigrationStrategyId } from "../contracts/evolution.types";
import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";

export class MigrationStrategyRegistry {
  private static instance: MigrationStrategyRegistry;
  private readonly strategies: Map<MigrationStrategyId, MigrationStrategy> = new Map();

  private constructor() {
    this.registerStandardStrategies();
  }

  public static getInstance(): MigrationStrategyRegistry {
    if (!MigrationStrategyRegistry.instance) {
      MigrationStrategyRegistry.instance = new MigrationStrategyRegistry();
    }
    return MigrationStrategyRegistry.instance;
  }

  private registerStandardStrategies(): void {
    const defaultStrategies: MigrationStrategy[] = [
      {
        id: "rehost",
        name: "Rehost (Lift and Shift)",
        description: "Move applications and systems from on-premise or legacy hosts to modern cloud infrastructure with zero or minimal architectural and code modifications.",
        complexity: "low",
        suitableScenarios: [
          "Urgent datacenter lease expirations",
          "Rapid cloud migration initiatives with constrained engineering timelines",
          "Legacy commercial off-the-shelf (COTS) software without source access",
        ],
        tradeOffs: {
          advantages: [
            "Fastest time-to-cloud execution",
            "Minimal code modifications and low developer regression risk",
            "Preserves existing application runtime behavior and configurations",
          ],
          disadvantages: [
            "Does not capitalize on cloud-native scalability, elastic auto-scaling, or serverless cost efficiencies",
            "May carry forward technical debt, monolithic coupling, and legacy OS patching overhead",
          ],
        },
        recommendedPatterns: ["VM image replication", "Direct containerization", "VPN/Direct Connect transit"],
      },
      {
        id: "replatform",
        name: "Replatform (Lift, Tinker and Shift)",
        description: "Migrate applications to the cloud while replacing underlying runtime platforms, databases, or message brokers with managed cloud services without altering core application logic.",
        complexity: "medium",
        suitableScenarios: [
          "Self-hosted database migrations to managed RDS/Cloud SQL",
          "Moving VMs to managed Kubernetes (EKS/GKE) or PaaS",
          "Replacing self-hosted message brokers with managed Kafka or SQS",
        ],
        tradeOffs: {
          advantages: [
            "Reduces database and OS operational maintenance toil",
            "Immediate benefits in managed backup, automated failover, and observability",
            "Requires modest application reconfiguration rather than major code rewrites",
          ],
          disadvantages: [
            "Risk of behavioral discrepancies in managed cloud storage or connection pool limits",
            "Requires regression testing of driver versions and platform features",
          ],
        },
        recommendedPatterns: ["Managed DB replication", "Container packaging", "Configuration externalization"],
      },
      {
        id: "refactor",
        name: "Refactor / Repackage",
        description: "Restructure and optimize existing application code to run effectively in cloud-native containerized or serverless environments, removing anti-patterns like local filesystem storage and stateful memory sessions.",
        complexity: "medium",
        suitableScenarios: [
          "Modernizing 12-factor apps for container orchestration",
          "Externalizing in-memory session states to Redis clusters",
          "Refactoring synchronous disk I/O to object storage (S3/GCS)",
        ],
        tradeOffs: {
          advantages: [
            "Enables horizontal elasticity and zero-downtime rolling updates",
            "Improves cloud resource utilization and testability",
          ],
          disadvantages: [
            "Requires code reviews, unit and regression testing across impacted modules",
            "May surface latent state synchronization bugs",
          ],
        },
        recommendedPatterns: ["12-factor application compliance", "Stateless service refactoring", "Distributed caching"],
      },
      {
        id: "rearchitect",
        name: "Rearchitect",
        description: "Fundamentally redesign and decompose the system architecture into microservices, event-driven components, or serverless functions to meet high scalability, agility, or multi-tenant domain boundaries.",
        complexity: "high",
        suitableScenarios: [
          "Monolithic systems bottlenecked by deployment coupling or conflicting scaling requirements",
          "Domain-driven design (DDD) transformations with dedicated bounded contexts",
          "Transitions to distributed event streaming (Kafka/Pulsar) for asynchronous high-throughput workloads",
        ],
        tradeOffs: {
          advantages: [
            "Independent service scalability, fault isolation, and autonomous team deployment cadences",
            "Domain boundary purity and targeted technology selection",
          ],
          disadvantages: [
            "Substantially higher operational complexity, distributed tracing needs, and dual-write data hazards",
            "Longest engineering lead time and highest requirement coordination overhead",
          ],
        },
        recommendedPatterns: ["Strangler Fig", "Change Data Capture (CDC)", "Outbox Pattern", "Saga Pattern"],
      },
      {
        id: "replace",
        name: "Replace (Repurchase / Drop and Shop)",
        description: "Decommission bespoke in-house legacy software and transition business capabilities to specialized third-party SaaS solutions or off-the-shelf modern products.",
        complexity: "medium",
        suitableScenarios: [
          "Legacy bespoke billing or authentication systems replaced by Stripe or Auth0",
          "Custom ERP/CRM tools replaced by industry SaaS platforms",
        ],
        tradeOffs: {
          advantages: [
            "Eliminates bespoke maintenance and infrastructure burden",
            "Leverages industry-standard compliance and continuous SaaS feature releases",
          ],
          disadvantages: [
            "Vendor lock-in and potential monthly licensing recurring costs",
            "Requires historical data transformation, ingestion, and identity migration",
          ],
        },
        recommendedPatterns: ["Data extract-transform-load (ETL)", "OAuth/OIDC federation", "Webhook event bridge"],
      },
      {
        id: "retire",
        name: "Retire",
        description: "Identify and systematically decommission obsolete services, dead endpoints, redundant shadow databases, and unsupported legacy dependencies.",
        complexity: "low",
        suitableScenarios: [
          "Legacy API v1 versions with zero observed production traffic over 90 days",
          "Decommissioned product lines and deprecated cron workers",
        ],
        tradeOffs: {
          advantages: [
            "Reduces attack surface, maintenance cost, and architectural cognitive overhead",
            "Recovers infrastructure costs immediately",
          ],
          disadvantages: [
            "Risk of breaking hidden or undocumented consumers if traffic audit was incomplete",
          ],
        },
        recommendedPatterns: ["Traffic black-holing with logging", "Audit access gates", "Controlled graceful shutdown"],
      },
      {
        id: "retain",
        name: "Retain (Revisit)",
        description: "Keep the component or subsystem in its current operational state without migration at this time, deferring until higher-priority modernization phases complete.",
        complexity: "low",
        suitableScenarios: [
          "Recently modernized subsystems that already meet performance SLAs",
          "High-risk legacy mainframes slated for future multi-year roadmaps",
        ],
        tradeOffs: {
          advantages: [
            "Zero migration risk and zero immediate migration resource allocation",
            "Allows engineering focus on critical bottlenecked components",
          ],
          disadvantages: [
            "Temporary hybrid connectivity overhead between cloud and retained legacy components",
          ],
        },
        recommendedPatterns: ["Hybrid VPN interconnect", "API Gateway facade proxy"],
      },
      {
        id: "strangler_fig",
        name: "Strangler Fig Application",
        description: "Incrementally migrate a monolithic application by creating a facade that intercepts requests and progressively routes traffic to newly extracted microservices until the monolith is extinguished.",
        complexity: "high",
        suitableScenarios: [
          "High-traffic production monoliths that cannot undergo high-risk big-bang rewrites",
          "Domain-by-domain service extraction with continuous production verification",
        ],
        tradeOffs: {
          advantages: [
            "Minimizes downtime and catastrophic deployment risk with incremental releases",
            "Continuous business value delivery and rapid feedback loops",
            "Immediate rollback capability per extracted endpoint or route",
          ],
          disadvantages: [
            "Requires maintaining interim routing facades and dual-write data replication pipelines",
            "Extended period of architectural duality and hybrid operational tooling",
          ],
        },
        recommendedPatterns: ["API Gateway / Reverse Proxy routing", "CDC Dual-Run", "Feature Flag toggles"],
      },
      {
        id: "parallel_run",
        name: "Parallel Run / Shadow Dual-Run",
        description: "Run both legacy and target systems concurrently, duplicating production traffic to both, and verifying output consistency before declaring the new system authoritative.",
        complexity: "high",
        suitableScenarios: [
          "Mission-critical financial calculation engines, ledger systems, and regulatory reporting",
          "Core payment processing or pricing algorithms where discrepancies are unacceptable",
        ],
        tradeOffs: {
          advantages: [
            "Zero customer impact during evaluation with live real-world production workload",
            "Objective mathematical validation of parity and latency differences",
          ],
          disadvantages: [
            "Doubled infrastructure resource costs during the verification period",
            "Must ensure shadow requests do not trigger unintended side-effects (e.g., duplicate charges or external notifications)",
          ],
        },
        recommendedPatterns: ["Traffic mirroring", "Asynchronous comparator worker", "Dry-run execution modes"],
      },
      {
        id: "blue_green",
        name: "Blue-Green Cutover",
        description: "Deploy two identical production environments (Blue = live, Green = new release), route all traffic to Green once smoke testing passes, and retain Blue for instant rollback if anomalies emerge.",
        complexity: "medium",
        suitableScenarios: [
          "Infrastructure cluster upgrades (e.g., Kubernetes version upgrades)",
          "Monolithic full-stack deployments where traffic shift must be instantaneous",
        ],
        tradeOffs: {
          advantages: [
            "Near-zero downtime cutover via DNS or load balancer target group switches",
            "Instantaneous rollback capability by repointing the router back to Blue",
          ],
          disadvantages: [
            "Requires 2x peak capacity infrastructure during cutover window",
            "Database schema compatibility must support both Blue and Green simultaneously (Expand/Contract)",
          ],
        },
        recommendedPatterns: ["DNS weighted routing", "ALB target group switching", "Non-breaking DB migrations"],
      },
      {
        id: "progressive_cutover",
        name: "Progressive / Canary Cutover",
        description: "Incrementally route production traffic from legacy to target system in gradual percentage increments (e.g. 1% -> 5% -> 25% -> 50% -> 100%) with automated health gate monitoring at each step.",
        complexity: "medium",
        suitableScenarios: [
          "Large-scale distributed systems where unanticipated load or caching issues could overwhelm new services",
          "Public API migrations with global consumer bases",
        ],
        tradeOffs: {
          advantages: [
            "Limits the blast radius of unexpected defects or performance regressions to a tiny fraction of traffic",
            "Provides empirical proof of target system capacity and resource stability under live loads",
          ],
          disadvantages: [
            "Requires sticky sessions or partitioned dual-state storage to prevent inconsistent user experiences",
            "Requires automated metric triggers and responsive rollback automation",
          ],
        },
        recommendedPatterns: ["Weighted API gateway routing", "Canary soak intervals", "Automated error rate circuit breakers"],
      },
    ];

    for (const strat of defaultStrategies) {
      this.strategies.set(strat.id, strat);
    }
  }

  public getStrategy(id: MigrationStrategyId): MigrationStrategy {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      // Fallback default
      return this.strategies.get("strangler_fig")!;
    }
    return strategy;
  }

  public getAllStrategies(): MigrationStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Recommends the optimal migration strategy based on source vs target architecture topology.
   */
  public recommendStrategy(
    source: ArchitectureSnapshot,
    target: ArchitectureSnapshot
  ): {
    recommendedStrategyId: MigrationStrategyId;
    rationale: string;
    secondaryStrategyId?: MigrationStrategyId;
  } {
    const sourceNodeCount = source.nodes.length;
    const targetNodeCount = target.nodes.length;
    const hasMonolithSource = source.nodes.some(
      (n) => n.data.nodeType === "service" && ((n.data.label as string | undefined)?.toLowerCase().includes("monolith") || sourceNodeCount <= 4)
    );
    const hasMicroservicesTarget = targetNodeCount > sourceNodeCount * 1.5 && targetNodeCount >= 6;
    const hasDatabaseChange = target.nodes.some(
      (tn) => tn.data.nodeType === "database" && !source.nodes.some((sn) => sn.id === tn.id)
    );

    if (hasMonolithSource && hasMicroservicesTarget) {
      return {
        recommendedStrategyId: "strangler_fig",
        rationale: "Target architecture decomposes monolithic services into multiple independent services. The Strangler Fig pattern provides safe, incremental migration with zero downtime.",
        secondaryStrategyId: "progressive_cutover",
      };
    }

    if (hasDatabaseChange && sourceNodeCount === targetNodeCount) {
      return {
        recommendedStrategyId: "replatform",
        rationale: "Service topology is predominantly retained while database or messaging infrastructure components are upgraded or migrated.",
        secondaryStrategyId: "parallel_run",
      };
    }

    if (targetNodeCount < sourceNodeCount && sourceNodeCount > 3) {
      return {
        recommendedStrategyId: "replace",
        rationale: "Target topology consolidates or eliminates custom services, suggesting transition to managed or SaaS replacements.",
        secondaryStrategyId: "retire",
      };
    }

    return {
      recommendedStrategyId: "progressive_cutover",
      rationale: "Incremental traffic shifting and health verification minimizes blast radius across architectural boundaries.",
      secondaryStrategyId: "blue_green",
    };
  }
}

export const migrationStrategyRegistry = MigrationStrategyRegistry.getInstance();

