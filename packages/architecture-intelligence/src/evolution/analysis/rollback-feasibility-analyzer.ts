/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Rollback Feasibility & Point-of-No-Return Analyzer
 * Evaluates reversibility, identifies points of no return, and builds recovery procedures.
 */

import type {
  MigrationTask,
  MigrationWave,
  RollbackFeasibilityStatus,
  RollbackPlan,
} from "../contracts/evolution.types";

export class RollbackFeasibilityAnalyzer {
  /**
   * Analyzes rollback feasibility for each migration wave and generates structured rollback plans.
   */
  public static analyzeRollbackPlans(
    waves: MigrationWave[],
    tasks: MigrationTask[]
  ): RollbackPlan[] {
    const plans: RollbackPlan[] = [];
    const taskMap = new Map<string, MigrationTask>(tasks.map((t) => [t.id, t]));

    for (const wave of waves) {
      const waveTasks = wave.taskIds.map((id) => taskMap.get(id)).filter(Boolean) as MigrationTask[];
      const hasPointOfNoReturn = waveTasks.some((t) => t.isPointOfNoReturn);
      const pointOfNoReturnIndex = waveTasks.findIndex((t) => t.isPointOfNoReturn);

      let feasibilityStatus: RollbackFeasibilityStatus = "fully_reversible";
      let isFeasible = true;
      let warning: string | undefined = undefined;

      if (hasPointOfNoReturn) {
        if (wave.waveNumber >= 5 || waveTasks.every((t) => t.isPointOfNoReturn)) {
          feasibilityStatus = "irreversible";
          isFeasible = false;
          warning = `Wave ${wave.waveNumber} contains permanent schema contraction or legacy decommissioning tasks. Once executed, rollback to the legacy monolith is impossible; this is the point of no return. Recovery requires roll-forward or full disaster backup restoration.`;
        } else {
          feasibilityStatus = "partially_reversible";
          isFeasible = true;
          warning = `Task '${waveTasks[pointOfNoReturnIndex].title}' marks the point of no return. Steps prior to this index can be rolled back automatically; steps after this point require explicit data restoration.`;
        }
      } else if (wave.waveNumber === 4) {
        // Cutover wave is reversible provided dual-write or standby monolith is maintained
        feasibilityStatus = "fully_reversible";
        isFeasible = true;
        warning = "Cutover rollback is feasible within the 48-hour soak window while legacy hot-standby remains active.";
      }

      const recoverySteps: string[] = [];
      const dataReconciliationSteps: string[] = [];
      const trafficRestorationSteps: string[] = [];
      const rollbackTriggers: string[] = [
        "HTTP 5xx error rate exceeds 1.0% over a 5-minute rolling window",
        "P99 request latency exceeds 250ms or degrades by > 50% vs baseline",
        "Data reconciliation detects unresolvable checksum divergence between stores",
        "Critical downstream consumer reports breaking interface contract errors",
      ];

      // Formulate specific steps per wave type
      if (wave.waveNumber === 1) {
        trafficRestorationSteps.push("Repoint external DNS or primary ingress load balancer directly to legacy endpoints.");
        recoverySteps.push("Deprovision newly created API gateway routing facade.");
        recoverySteps.push("Drain and shut down auxiliary container ingress nodes.");
      } else if (wave.waveNumber === 2) {
        trafficRestorationSteps.push("Traffic is untouched; legacy database remains authoritative master.");
        dataReconciliationSteps.push("Stop CDC replication connectors and purge intermediate Kafka mirror topics.");
        recoverySteps.push("Drop target database schemas and release provisioned storage volumes.");
      } else if (wave.waveNumber === 3) {
        trafficRestorationSteps.push("In routing facade, update canary rule weight from 5% to 0% target microservice.");
        trafficRestorationSteps.push("Route 100% of incoming production traffic to legacy monolith.");
        dataReconciliationSteps.push("Drain pending in-flight transactions from target microservice database.");
        recoverySteps.push("Scale down target microservice container replicas to zero.");
      } else if (wave.waveNumber === 4) {
        trafficRestorationSteps.push("Initiate emergency routing flip: shift 100% traffic back to legacy monolith target group.");
        trafficRestorationSteps.push("Flush edge CDN and API gateway route caches.");
        dataReconciliationSteps.push("Trigger reverse CDC stream to backfill writes accepted by target services back into legacy DB.");
        recoverySteps.push("Place target microservices into maintenance read-only mode.");
      } else {
        // Wave 5: Irreversible decommissioning
        trafficRestorationSteps.push("Rollback impossible via traffic routing; legacy monolith has been terminated.");
        dataReconciliationSteps.push("Mount and inspect cold backup snapshots if catastrophic data loss occurs.");
        recoverySteps.push("Execute Roll-Forward disaster recovery playbook; do not attempt to resurrect old monolith.");
      }

      plans.push({
        id: `rollback-plan-w${wave.waveNumber}`,
        waveId: wave.id,
        isFeasible,
        feasibilityStatus,
        rollbackTriggerConditions: rollbackTriggers,
        recoveryProcedureSteps: recoverySteps,
        dataReconciliationSteps,
        trafficRestorationSteps,
        pointOfNoReturnStepIndex: hasPointOfNoReturn ? pointOfNoReturnIndex : undefined,
        pointOfNoReturnWarning: warning,
        responsibleOwner: "Architecture Migration SRE Team",
        notes: `Structured rollback analysis for Wave ${wave.waveNumber}: ${wave.title}.`,
      });
    }

    return plans;
  }
}
