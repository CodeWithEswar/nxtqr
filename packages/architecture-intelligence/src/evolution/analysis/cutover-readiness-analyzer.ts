/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Cutover Readiness & Progressive Traffic Shifting Analyzer
 * Formulates multi-step progressive traffic cutovers and evaluates operational readiness gates.
 */

import type {
  CutoverPlan,
  CutoverType,
  MigrationWave,
  TrafficShiftStep,
  VerificationGate,
} from "../contracts/evolution.types";

export interface CutoverReadinessAssessment {
  isReadyForCutover: boolean;
  blockingReasons: string[];
  passedPrerequisites: string[];
  recommendedCutoverType: CutoverType;
  plans: CutoverPlan[];
}

export class CutoverReadinessAnalyzer {
  /**
   * Plans cutover steps and assesses cutover readiness against verification gates.
   */
  public static planCutover(
    waves: MigrationWave[],
    gates: VerificationGate[],
    projectId: string = "migration-proj-1"
  ): CutoverReadinessAssessment {
    const cutoverWave = waves.find((w) => w.waveNumber === 4) || waves[waves.length - 1];
    const blockingReasons: string[] = [];
    const passedPrerequisites: string[] = [];

    // Verify prerequisite gates from prior waves
    const w1Gates = gates.filter((g) => g.waveId?.includes("wave-1") || g.id.includes("w1"));
    const w2Gates = gates.filter((g) => g.waveId?.includes("wave-2") || g.id.includes("w2"));
    const w3Gates = gates.filter((g) => g.waveId?.includes("wave-3") || g.id.includes("w3"));

    const allPriorGates = [...w1Gates, ...w2Gates, ...w3Gates];
    for (const gate of allPriorGates) {
      if (gate.status === "passed") {
        passedPrerequisites.push(`Gate passed: ${gate.title}`);
      } else if (gate.status === "failed") {
        blockingReasons.push(`Blocking Gate Failed: ${gate.title} - ${gate.evaluationNotes}`);
      } else if (gate.status === "unknown") {
        blockingReasons.push(`Blocking Gate Unverified: ${gate.title} requires explicit evidence verification.`);
      }
    }

    if (allPriorGates.length === 0) {
      passedPrerequisites.push("Default architecture verification checks satisfied.");
    }

    // 4 Progressive Traffic Shifting Steps
    const steps: TrafficShiftStep[] = [
      {
        stepNumber: 1,
        weightPercent: 5,
        soakDurationMinutes: 60,
        healthCriteria: "HTTP 5xx error rate < 0.05%, P99 latency < 200ms, zero panic logs",
      },
      {
        stepNumber: 2,
        weightPercent: 25,
        soakDurationMinutes: 180,
        healthCriteria: "Target CPU utilization < 50%, DB connection pool utilization < 40%",
      },
      {
        stepNumber: 3,
        weightPercent: 50,
        soakDurationMinutes: 360,
        healthCriteria: "Sustained traffic parity, zero unhandled exceptions, zero data drift",
      },
      {
        stepNumber: 4,
        weightPercent: 100,
        soakDurationMinutes: 1440,
        healthCriteria: "Full production load soak for 24-48 hours with zero SLO breaches",
      },
    ];

    const cutoverPlan: CutoverPlan = {
      id: `${projectId}-cutover-plan-primary`,
      waveId: cutoverWave.id,
      cutoverType: "weighted_shift",
      sourceTarget: "legacy-monolith-billing",
      destinationTarget: "target-microservices-cluster",
      trafficScope: "All production API ingress endpoints",
      steps,
      rollbackTriggers: [
        "Aggregate error rate > 1.0% over 5-minute window",
        "P99 latency > 300ms or 2x baseline",
        "Downstream database replication lag > 5000ms",
        "CDC reverse replication pipeline failure",
      ],
      owner: "Engineering Studio Cutover Commander",
    };

    const isReadyForCutover = blockingReasons.length === 0;

    return {
      isReadyForCutover,
      blockingReasons,
      passedPrerequisites,
      recommendedCutoverType: "weighted_shift",
      plans: [cutoverPlan],
    };
  }
}

