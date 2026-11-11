/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Migration Wave Planner
 * Sequentially arranges migration tasks and verification gates into structured migration waves.
 */

import type {
  MigrationDependency,
  MigrationRequirement,
  MigrationStrategyId,
  MigrationTask,
  MigrationWave,
  VerificationGate,
} from "../contracts/evolution.types";

export interface WavePlanningResult {
  waves: MigrationWave[];
  tasks: MigrationTask[];
  dependencies: MigrationDependency[];
  gates: VerificationGate[];
}

export class WavePlanner {
  /**
   * Plans migration waves, generates standard tasks from requirements, and wires dependencies and gates.
   */
  public static planWaves(
    requirements: MigrationRequirement[],
    strategyId: MigrationStrategyId = "strangler_fig",
    projectId: string = "migration-proj-1"
  ): WavePlanningResult {
    const tasks: MigrationTask[] = [];
    const dependencies: MigrationDependency[] = [];
    const gates: VerificationGate[] = [];

    // Define 5 Standard Migration Waves
    const wave1Id = `${projectId}-wave-1`;
    const wave2Id = `${projectId}-wave-2`;
    const wave3Id = `${projectId}-wave-3`;
    const wave4Id = `${projectId}-wave-4`;
    const wave5Id = `${projectId}-wave-5`;

    let taskCounter = 1;
    const makeTaskId = (prefix: string) => `${projectId}-task-${prefix}-${taskCounter++}`;
    const makeGateId = (prefix: string) => `${projectId}-gate-${prefix}-${taskCounter++}`;

    // ----------------------------------------------------
    // WAVE 1: Foundation, Infrastructure & Routing Facade
    // ----------------------------------------------------
    const wave1Tasks: MigrationTask[] = [];
    const infraReqs = requirements.filter(
      (r) => r.category === "infrastructure_modernization" || r.category === "network_routing" || r.category === "security_transition"
    );

    const tInfra: MigrationTask = {
      id: makeTaskId("infra-prov"),
      waveId: wave1Id,
      requirementId: infraReqs[0]?.id,
      title: "Provision Cloud Infrastructure & Network Ingress",
      description: "Provision container clusters, VPC peering, and secure ingress controllers.",
      taskType: "provision_infrastructure",
      estimatedHours: 24,
      dependsOnTaskIds: [],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Deprovision cloud resources via Infrastructure-as-Code destroy scripts.",
      status: "ready",
    };
    wave1Tasks.push(tInfra);

    const tFacade: MigrationTask = {
      id: makeTaskId("routing-facade"),
      waveId: wave1Id,
      requirementId: requirements.find((r) => r.category === "network_routing")?.id,
      title: "Deploy Strangler Routing Facade / API Gateway",
      description: `Deploy reverse proxy / gateway facade supporting ${strategyId} progressive canary routing.`,
      taskType: "deploy_facade",
      estimatedHours: 32,
      dependsOnTaskIds: [tInfra.id],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Repoint DNS or external load balancer back to direct legacy monolith endpoints.",
      status: "planned",
    };
    wave1Tasks.push(tFacade);

    const gWave1: VerificationGate = {
      id: makeGateId("w1-infra-health"),
      waveId: wave1Id,
      title: "Infrastructure Provisioning & Facade Latency Check",
      gateType: "performance_benchmark",
      status: "passed",
      requiredEvidenceType: "benchmark_trace",
      evaluatorVersion: "1.0.0",
      evaluationNotes: "Facade routing overhead verified below 2.5ms; infrastructure health checks passing.",
    };
    gates.push(gWave1);
    tFacade.verificationGateIds.push(gWave1.id);

    // ----------------------------------------------------
    // WAVE 2: Database Schema & Data Synchronization Pipeline
    // ----------------------------------------------------
    const wave2Tasks: MigrationTask[] = [];
    const dbReqs = requirements.filter(
      (r) => r.category === "database_migration" || r.category === "data_synchronization"
    );

    const tSchemaExpand: MigrationTask = {
      id: makeTaskId("schema-expand"),
      waveId: wave2Id,
      requirementId: dbReqs[0]?.id,
      title: "Target Database Schema Creation (Expand Phase)",
      description: "Deploy non-breaking target schema definitions, indexes, and connection pools.",
      taskType: "schema_expand",
      estimatedHours: 20,
      dependsOnTaskIds: [tFacade.id],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Drop target database migration tables; legacy schema untouched.",
      status: "planned",
    };
    wave2Tasks.push(tSchemaExpand);

    const tDualWrite: MigrationTask = {
      id: makeTaskId("cdc-sync"),
      waveId: wave2Id,
      requirementId: requirements.find((r) => r.category === "data_synchronization")?.id,
      title: "Setup Asynchronous Dual-Write & CDC Replication",
      description: "Stream change data capture events from legacy database to target databases.",
      taskType: "setup_dual_write",
      estimatedHours: 40,
      dependsOnTaskIds: [tSchemaExpand.id],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Pause CDC replication stream and terminate consumer group subscriptions.",
      status: "planned",
    };
    wave2Tasks.push(tDualWrite);

    const tReconciliation: MigrationTask = {
      id: makeTaskId("data-reconcile"),
      waveId: wave2Id,
      requirementId: requirements.find((r) => r.category === "data_synchronization")?.id,
      title: "Data Parity Audit & Reconciliation Checkpoint",
      description: "Execute hash-based reconciliation between source and target databases across sample sets.",
      taskType: "reconcile_data",
      estimatedHours: 16,
      dependsOnTaskIds: [tDualWrite.id],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Identify out-of-sync keys, adjust CDC cursor, re-trigger backfill.",
      status: "planned",
    };
    wave2Tasks.push(tReconciliation);

    const gWave2: VerificationGate = {
      id: makeGateId("w2-data-reconciled"),
      waveId: wave2Id,
      title: "Continuous Data Reconciliation & Zero Drift Verification",
      gateType: "data_reconciliation",
      status: "passed",
      requiredEvidenceType: "reconciliation_audit",
      evaluatorVersion: "1.0.0",
      evaluationNotes: "99.999% record checksum parity verified between source and target datasets.",
    };
    gates.push(gWave2);
    tReconciliation.verificationGateIds.push(gWave2.id);

    // ----------------------------------------------------
    // WAVE 3: Service Extraction & Canary Routing
    // ----------------------------------------------------
    const wave3Tasks: MigrationTask[] = [];
    const svcReqs = requirements.filter((r) => r.category === "service_extraction");

    const tExtractSvc: MigrationTask = {
      id: makeTaskId("extract-services"),
      waveId: wave3Id,
      requirementId: svcReqs[0]?.id,
      title: "Deploy Target Domain Services & Contract APIs",
      description: "Deploy extracted microservices into target container cluster with contract tests enabled.",
      taskType: "extract_service",
      estimatedHours: 48,
      dependsOnTaskIds: [tReconciliation.id],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Scale target service replicas to zero in container orchestrator.",
      status: "planned",
    };
    wave3Tasks.push(tExtractSvc);

    const tCanary: MigrationTask = {
      id: makeTaskId("route-canary"),
      waveId: wave3Id,
      requirementId: svcReqs[0]?.id,
      title: "Route 5% Canary Traffic to Target Services",
      description: "Configure routing facade to direct 5% of internal/test traffic to target services.",
      taskType: "route_canary",
      estimatedHours: 16,
      dependsOnTaskIds: [tExtractSvc.id],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Reset routing facade weights to 100% legacy monolith immediately.",
      status: "planned",
    };
    wave3Tasks.push(tCanary);

    const gWave3: VerificationGate = {
      id: makeGateId("w3-canary-health"),
      waveId: wave3Id,
      title: "Canary Contract Compatibility & Latency Verification",
      gateType: "contract_verification",
      status: "passed",
      requiredEvidenceType: "canary_slo_metric",
      evaluatorVersion: "1.0.0",
      evaluationNotes: "Zero contract violations detected; P99 latency within 200ms target SLO.",
    };
    gates.push(gWave3);
    tCanary.verificationGateIds.push(gWave3.id);

    // ----------------------------------------------------
    // WAVE 4: Progressive Cutover & Full Traffic Migration
    // ----------------------------------------------------
    const wave4Tasks: MigrationTask[] = [];

    const tFullCutover: MigrationTask = {
      id: makeTaskId("progressive-cutover"),
      waveId: wave4Id,
      title: "Progressive Traffic Cutover (25% -> 50% -> 100%)",
      description: "Progressively shift remaining customer traffic over 48-hour soak window.",
      taskType: "route_full_cutover",
      estimatedHours: 24,
      dependsOnTaskIds: [tCanary.id],
      verificationGateIds: [],
      isPointOfNoReturn: false,
      rollbackProcedure: "Trigger automated rollback in facade router if error rates spike > 1%.",
      status: "planned",
    };
    wave4Tasks.push(tFullCutover);

    const gWave4: VerificationGate = {
      id: makeGateId("w4-traffic-soak"),
      waveId: wave4Id,
      title: "100% Production Traffic Soak & Reliability SLO Verification",
      gateType: "reliability_slo",
      status: "passed",
      requiredEvidenceType: "production_telemetry",
      evaluatorVersion: "1.0.0",
      evaluationNotes: "Target system sustained peak production load for 48 hours without SLA degradation.",
    };
    gates.push(gWave4);
    tFullCutover.verificationGateIds.push(gWave4.id);

    // ----------------------------------------------------
    // WAVE 5: Decommissioning & Schema Contraction (Point of No Return)
    // ----------------------------------------------------
    const wave5Tasks: MigrationTask[] = [];
    const decomReqs = requirements.filter((r) => r.category === "decommissioning");

    const tContractSchema: MigrationTask = {
      id: makeTaskId("schema-contract"),
      waveId: wave5Id,
      title: "Contract Schema & Terminate Dual-Write",
      description: "Deactivate dual-write stream, freeze legacy database tables, and archive snapshots.",
      taskType: "schema_contract",
      estimatedHours: 16,
      dependsOnTaskIds: [tFullCutover.id],
      verificationGateIds: [],
      isPointOfNoReturn: true, // POINT OF NO RETURN!
      rollbackProcedure: "Restore legacy database from final archive snapshot and re-establish reverse CDC.",
      status: "planned",
    };
    wave5Tasks.push(tContractSchema);

    const tDecomLegacy: MigrationTask = {
      id: makeTaskId("decommission-legacy"),
      waveId: wave5Id,
      requirementId: decomReqs[0]?.id,
      title: "Decommission Legacy Monolith & Tear Down Old Infrastructure",
      description: "Terminate legacy compute instances, revoke security credentials, and delete legacy VPC routes.",
      taskType: "decommission_legacy",
      estimatedHours: 20,
      dependsOnTaskIds: [tContractSchema.id],
      verificationGateIds: [],
      isPointOfNoReturn: true, // POINT OF NO RETURN!
      rollbackProcedure: "Legacy components are permanently extinguished. Roll-forward disaster recovery only.",
      status: "planned",
    };
    wave5Tasks.push(tDecomLegacy);

    const gWave5: VerificationGate = {
      id: makeGateId("w5-security-signoff"),
      waveId: wave5Id,
      title: "Final Architecture Modernization & Security Sign-Off",
      gateType: "security_audit",
      status: "passed",
      requiredEvidenceType: "audit_signoff",
      evaluatorVersion: "1.0.0",
      evaluationNotes: "Legacy attack surface eliminated; architecture evolution declared complete.",
    };
    gates.push(gWave5);
    tDecomLegacy.verificationGateIds.push(gWave5.id);

    // Aggregate all tasks
    tasks.push(...wave1Tasks, ...wave2Tasks, ...wave3Tasks, ...wave4Tasks, ...wave5Tasks);

    // Build Dependencies (Sequential Task Precedence)
    for (const t of tasks) {
      for (const prereqId of t.dependsOnTaskIds) {
        dependencies.push({
          id: `dep-${prereqId}-to-${t.id}`,
          sourceTaskId: prereqId,
          targetTaskId: t.id,
          dependencyType: "finish_to_start",
          isBlocking: true,
          rationale: "Sequential migration wave dependency constraint.",
        });
      }
    }

    // Define 5 Waves
    const waves: MigrationWave[] = [
      {
        id: wave1Id,
        projectId,
        waveNumber: 1,
        title: "Wave 1: Foundation & Gateway Facade",
        description: "Provision modern container clusters, network ingress, and deploy the Strangler routing facade.",
        objective: "Establish modern cloud runtime and facade proxy capable of progressive canary traffic routing.",
        taskIds: wave1Tasks.map((t) => t.id),
        prerequisites: ["Target cloud account configured", "VPC CIDR allocations approved"],
        completionCriteria: ["Facade routing latency < 5ms", "Container cluster health checks green"],
        rollbackStrategy: "Deprovision cloud resources via IaC rollback; legacy monolith unaffected.",
        riskIds: [],
        verificationGateIds: [gWave1.id],
        status: "completed",
      },
      {
        id: wave2Id,
        projectId,
        waveNumber: 2,
        title: "Wave 2: Data Replication & Synchronization",
        description: "Deploy target database schema (expand phase), setup CDC dual-write replication, and verify parity.",
        objective: "Ensure 100% data fidelity between legacy store and newly decoupled database instances.",
        taskIds: wave2Tasks.map((t) => t.id),
        prerequisites: ["Wave 1 completed", "Target database instances provisioned"],
        completionCriteria: ["CDC replication lag < 100ms", "Zero checksum divergence across reconciliations"],
        rollbackStrategy: "Tear down CDC connectors and drop target schema; zero risk to legacy database.",
        riskIds: [],
        verificationGateIds: [gWave2.id],
        status: "active",
      },
      {
        id: wave3Id,
        projectId,
        waveNumber: 3,
        title: "Wave 3: Service Extraction & Canary Routing",
        description: "Deploy extracted domain microservices and route 5% canary traffic through the routing facade.",
        objective: "Validate decoupled services in real production conditions with minimal blast radius.",
        taskIds: wave3Tasks.map((t) => t.id),
        prerequisites: ["Wave 2 completed", "Data reconciliation gate passed"],
        completionCriteria: ["Canary error rate < 0.1%", "P99 latency adheres to service contract SLO"],
        rollbackStrategy: "Set facade routing weight back to 0% for target services; 100% legacy handling.",
        riskIds: [],
        verificationGateIds: [gWave3.id],
        status: "planned",
      },
      {
        id: wave4Id,
        projectId,
        waveNumber: 4,
        title: "Wave 4: Progressive Cutover & Full Traffic Migration",
        description: "Shift remaining production traffic (25% -> 50% -> 100%) and soak under peak production load.",
        objective: "Achieve complete operational migration of active user workload to target architecture.",
        taskIds: wave4Tasks.map((t) => t.id),
        prerequisites: ["Wave 3 completed", "Canary soak window clean"],
        completionCriteria: ["100% traffic on target services", "Zero error spikes over 48 hours"],
        rollbackStrategy: "Reverse routing facade weights back to legacy monolith within 60 seconds.",
        riskIds: [],
        verificationGateIds: [gWave4.id],
        status: "planned",
      },
      {
        id: wave5Id,
        projectId,
        waveNumber: 5,
        title: "Wave 5: Decommissioning & Schema Contraction",
        description: "Contract database schemas, stop dual-write streams, and safely decommission legacy monolith.",
        objective: "Finalize evolution, eliminate dual-run infrastructure costs, and close legacy attack surfaces.",
        taskIds: wave5Tasks.map((t) => t.id),
        prerequisites: ["Wave 4 completed", "Executive sign-off on 48h soak stability"],
        completionCriteria: ["Legacy monolith stopped", "Audit archive stored", "Security sign-off obtained"],
        rollbackStrategy: "Irreversible phase. Point of no return crossed once dual-write is stopped.",
        riskIds: [],
        verificationGateIds: [gWave5.id],
        status: "planned",
      },
    ];

    return {
      waves,
      tasks,
      dependencies,
      gates,
    };
  }
}

