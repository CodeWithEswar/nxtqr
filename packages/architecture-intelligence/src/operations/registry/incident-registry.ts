/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Incident Scenario Registry & Catalog
 */

import type { IncidentScenario, IncidentCategory, IncidentSeverity } from "../contracts/operations.types";

export class IncidentScenarioRegistry {
  private static instance: IncidentScenarioRegistry;
  private readonly scenarios = new Map<string, IncidentScenario>();

  constructor() {
    this.registerStandardScenarios();
  }

  public static getInstance(): IncidentScenarioRegistry {
    if (!IncidentScenarioRegistry.instance) {
      IncidentScenarioRegistry.instance = new IncidentScenarioRegistry();
    }
    return IncidentScenarioRegistry.instance;
  }

  public registerScenario(scenario: IncidentScenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  public getScenario(id: string): IncidentScenario | undefined {
    return this.scenarios.get(id);
  }

  public getAllScenarios(): IncidentScenario[] {
    return Array.from(this.scenarios.values());
  }

  public getScenariosByCategory(category: IncidentCategory): IncidentScenario[] {
    return this.getAllScenarios().filter((s) => s.category === category);
  }

  public getScenariosBySeverity(severity: IncidentSeverity): IncidentScenario[] {
    return this.getAllScenarios().filter((s) => s.severity === severity);
  }

  public getScenariosForComponent(componentId: string): IncidentScenario[] {
    return this.getAllScenarios().filter((s) => s.affectedComponentIds.includes(componentId));
  }

  private registerStandardScenarios(): void {
    const standardScenarios: IncidentScenario[] = [
      {
        id: "SCN-DB-FAILOVER-001",
        architectureId: "arch-default",
        architectureRevisionId: "rev-baseline",
        title: "Primary Relational Database Crash with Delayed Read Replica Promotion",
        description: "Primary database node crashes under high write pressure. Semi-sync replication lag delays secondary election and causes connection pool exhaustion.",
        category: "database_outage",
        affectedComponentIds: ["primary-db", "order-service", "payment-service"],
        affectedJourneyIds: ["journey-checkout", "journey-order-placement"],
        severity: "SEV1",
        assumptions: [
          { id: "asm-1", description: "Secondary replica is in warm standby state in paired zone", isVerified: true },
          { id: "asm-2", description: "Automatic DNS switchover TTL is under 30 seconds", isVerified: false },
        ],
        triggerCondition: "Primary database heartbeat misses 3 consecutive probes (15s)",
        expectedFailureMode: "Connection timeouts on dependent microservices, circuit breakers trip, read-only degraded mode",
        ownerRole: "recovery_engineer",
        playbookId: "PB-DB-RECOVERY",
        recoveryStrategyId: "warm_standby",
        evidenceIds: ["ev-drill-q3-db"],
        createdAt: "2026-11-01T00:00:00Z",
      },
      {
        id: "SCN-GW-INGRESS-002",
        architectureId: "arch-default",
        architectureRevisionId: "rev-baseline",
        title: "API Gateway Edge TLS Termination Failure & Ingress Spike",
        description: "Edge gateway certificate expiration or rate-limiting buffer saturation causes 502/504 gateway timeouts for all external traffic.",
        category: "api_gateway_failure",
        affectedComponentIds: ["api-gateway"],
        affectedJourneyIds: ["journey-authentication", "journey-checkout", "journey-portal"],
        severity: "SEV1",
        assumptions: [
          { id: "asm-3", description: "Secondary redundant gateway cluster deployed in secondary AZ", isVerified: true },
          { id: "asm-4", description: "DNS global routing policy can steer 100% ingress", isVerified: true },
        ],
        triggerCondition: "Gateway error rate > 5% for 60 seconds",
        expectedFailureMode: "Complete external ingress disruption, zero client traffic reaching downstream services",
        ownerRole: "technical_lead",
        playbookId: "PB-GW-INGRESS",
        recoveryStrategyId: "active_passive",
        evidenceIds: ["ev-gw-cert-audit"],
        createdAt: "2026-11-01T00:00:00Z",
      },
      {
        id: "SCN-AUTH-OUTAGE-003",
        architectureId: "arch-default",
        architectureRevisionId: "rev-baseline",
        title: "Identity Provider & Token Validation Service Blackout",
        description: "OAuth/OIDC centralized identity provider returns HTTP 500 or becomes unreachable, preventing JWT validation and session issuance.",
        category: "authentication_outage",
        affectedComponentIds: ["auth-service", "api-gateway"],
        affectedJourneyIds: ["journey-authentication", "journey-user-login"],
        severity: "SEV1",
        assumptions: [
          { id: "asm-5", description: "Cached public JWKS keys allow short-lived offline validation (15 mins)", isVerified: true },
        ],
        triggerCondition: "Identity provider error rate > 10% or JWKS refresh failure",
        expectedFailureMode: "New logins rejected with 401 Unauthorized; existing sessions expire within 15 minutes",
        ownerRole: "incident_commander",
        playbookId: "PB-AUTH-FAILOVER",
        recoveryStrategyId: "hot_standby",
        evidenceIds: [],
        createdAt: "2026-11-01T00:00:00Z",
      },
      {
        id: "SCN-QUEUE-BACKLOG-004",
        architectureId: "arch-default",
        architectureRevisionId: "rev-baseline",
        title: "Distributed Message Broker Partition & Dead-Letter Queue Flooding",
        description: "Message broker partition leads to unacknowledged message backlog, slow consumers, and poison-pill messages flooding dead-letter queues.",
        category: "queue_backlog",
        affectedComponentIds: ["message-broker", "notification-worker", "analytics-consumer"],
        affectedJourneyIds: ["journey-notifications", "journey-async-fulfillment"],
        severity: "SEV2",
        assumptions: [
          { id: "asm-6", description: "Dead-letter queues have 7-day retention and persistent disk buffers", isVerified: true },
        ],
        triggerCondition: "Queue consumer lag exceeds 50,000 messages or DLQ arrival rate > 100 msg/s",
        expectedFailureMode: "Asynchronous processing delay, notifications stalled, background batch queues stalled",
        ownerRole: "recovery_engineer",
        playbookId: "PB-MSG-REPLAY",
        recoveryStrategyId: "backup_restore",
        evidenceIds: ["ev-dlq-replay-test"],
        createdAt: "2026-11-01T00:00:00Z",
      },
      {
        id: "SCN-STORAGE-EXHAUST-005",
        architectureId: "arch-default",
        architectureRevisionId: "rev-baseline",
        title: "Object Storage IOPS Throttling & Volume Capacity Exhaustion",
        description: "Shared file storage or database log volume exceeds 95% disk usage, triggering filesystem read-only locks.",
        category: "storage_exhaustion",
        affectedComponentIds: ["blob-storage", "reporting-service"],
        affectedJourneyIds: ["journey-file-upload", "journey-reporting"],
        severity: "SEV2",
        assumptions: [
          { id: "asm-7", description: "Volume auto-expansion policy configured with 20% growth increment", isVerified: false },
        ],
        triggerCondition: "Volume free space < 10% or IOPS throttle credits exhausted",
        expectedFailureMode: "File uploads fail with 507 Insufficient Storage; transactional WAL writes suspended",
        ownerRole: "technical_lead",
        playbookId: "PB-STORAGE-EXPAND",
        recoveryStrategyId: "backup_restore",
        evidenceIds: [],
        createdAt: "2026-11-01T00:00:00Z",
      },
      {
        id: "SCN-REGION-OUTAGE-006",
        architectureId: "arch-default",
        architectureRevisionId: "rev-baseline",
        title: "Primary Cloud Region Complete Outage & Cross-Region Disaster Recovery",
        description: "Complete loss of primary cloud region. Requires DNS redirect, cross-region database promotion, and cold start of container pools in secondary region.",
        category: "regional_outage",
        affectedComponentIds: ["api-gateway", "order-service", "billing-service", "primary-db"],
        affectedJourneyIds: ["journey-checkout", "journey-order-placement", "journey-portal"],
        severity: "SEV1",
        assumptions: [
          { id: "asm-8", description: "Secondary region maintains warm standby pilot light cluster", isVerified: false },
          { id: "asm-9", description: "Asynchronous replication lag between regions is under 60 seconds", isVerified: true },
        ],
        triggerCondition: "Regional control plane unreachable for > 5 minutes across multiple availability zones",
        expectedFailureMode: "Complete service blackout in primary region until cross-region DNS failover finishes",
        ownerRole: "incident_commander",
        playbookId: "PB-REGION-FAILOVER",
        recoveryStrategyId: "multi_region_failover",
        evidenceIds: ["ev-tabletop-q2-regional"],
        createdAt: "2026-11-01T00:00:00Z",
      },
    ];

    for (const sc of standardScenarios) {
      this.scenarios.set(sc.id, sc);
    }
  }
}

export const incidentScenarioRegistry = IncidentScenarioRegistry.getInstance();

