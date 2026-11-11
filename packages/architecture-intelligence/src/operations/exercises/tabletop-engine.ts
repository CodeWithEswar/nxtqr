/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Tabletop Exercise Engine & Timeline Inject Simulator
 */

import type {
  TabletopExercise,
  TabletopInject,
  TabletopObservation,
  IncidentScenario,
  OperationalFinding,
  IncidentRole,
} from "../contracts/operations.types";

export class TabletopEngine {
  /**
   * Generates a template tabletop exercise plan based on a given incident scenario.
   */
  public static generateExercisePlan(
    scenario: IncidentScenario,
    facilitator: string = "Operational Readiness Lead"
  ): TabletopExercise {
    const defaultParticipants: Array<{ name: string; role: IncidentRole }> = [
      { name: "Incident Commander", role: "incident_commander" },
      { name: "Primary Technical Lead", role: "technical_lead" },
      { name: "Database/Infra Engineer", role: "recovery_engineer" },
      { name: "Communications Lead", role: "communications_lead" },
      { name: "Observer / Scribe", role: "scribe" },
    ];

    const injects: TabletopInject[] = [
      {
        id: `inj-${scenario.id}-0`,
        minuteOffset: 0,
        title: "Triage Alert & Initial Anomaly Detection",
        eventDescription: `Automated alert triggers: ${scenario.triggerCondition}. P1 triage channel instantiated.`,
        injectedFailure: scenario.expectedFailureMode,
        expectedResponseRole: "incident_commander",
      },
      {
        id: `inj-${scenario.id}-15`,
        minuteOffset: 15,
        title: "Diagnostic Investigation & Blast Radius Scoping",
        eventDescription: `Responders inspect service dashboards. Affected components identified: [${scenario.affectedComponentIds.join(", ")}].`,
        injectedFailure: "Upstream callers begin timing out; circuit breakers open.",
        expectedResponseRole: "technical_lead",
      },
      {
        id: `inj-${scenario.id}-30`,
        minuteOffset: 30,
        title: "Containment & Traffic Isolation",
        eventDescription: "Incident commander reviews runbook options. Decision required on whether to initiate failover or rate-limiting quarantine.",
        injectedFailure: "Latency spikes exceed SLO target threshold.",
        expectedResponseRole: "incident_commander",
      },
      {
        id: `inj-${scenario.id}-45`,
        minuteOffset: 45,
        title: "Disaster Recovery Execution & Data Sync Verification",
        eventDescription: "Recovery engineer executes recovery sequence. Data synchronization lag and replication integrity checked.",
        injectedFailure: "Secondary replica initial health probe returns warning.",
        expectedResponseRole: "recovery_engineer",
      },
      {
        id: `inj-${scenario.id}-60`,
        minuteOffset: 60,
        title: "Verification, Stakeholder Communication & Stand-Down",
        eventDescription: "External client health checks recover to 100%. Communications lead drafts post-incident customer notice.",
        injectedFailure: "Residual stale cache keys require targeted cache purge.",
        expectedResponseRole: "communications_lead",
      },
    ];

    return {
      id: `TTX-${scenario.id}-${Date.now().toString().slice(-4)}`,
      title: `Tabletop Exercise: ${scenario.title}`,
      scenarioId: scenario.id,
      facilitator,
      participants: defaultParticipants,
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: "scheduled",
      assumptions: scenario.assumptions.map((a) => a.description),
      injects,
      observations: [],
      findings: [],
      actionItems: [],
    };
  }

  /**
   * Records an observation or inject response in an active exercise, evaluating findings.
   */
  public static recordObservation(
    exercise: TabletopExercise,
    timestampMinute: number,
    observer: string,
    note: string,
    wasExpected: boolean,
    associatedInjectId?: string
  ): {
    updatedExercise: TabletopExercise;
    newFindings: OperationalFinding[];
  } {
    const observation: TabletopObservation = {
      id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestampMinute,
      observer,
      note,
      wasExpected,
      associatedInjectId,
    };

    const newFindings: OperationalFinding[] = [];
    if (!wasExpected) {
      newFindings.push({
        id: `FND-TTX-UNEXPECTED-${observation.id}`,
        category: "untested_recovery",
        severity: "high",
        title: `Unexpected Bottleneck Observed in Tabletop: Minute ${timestampMinute}`,
        description: `During exercise '${exercise.title}', observer '${observer}' recorded unexpected behavior: "${note}"`,
        affectedComponentIds: [],
        remediationRecommendation: "Update runbook diagnostic steps and schedule a re-test exercise focusing on this branch.",
      });
    }

    const updatedExercise: TabletopExercise = {
      ...exercise,
      observations: [...exercise.observations, observation],
      findings: [...exercise.findings, ...newFindings.map((f) => f.title)],
    };

    return {
      updatedExercise,
      newFindings,
    };
  }
}

