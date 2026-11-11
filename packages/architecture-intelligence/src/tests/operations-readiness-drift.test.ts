import { describe, it, expect } from "vitest";
import type { BaseNode } from "@nxtqr/graph-schema";
import {
  TabletopEngine,
  OperationalDriftAnalyzer,
  incidentScenarioRegistry,
  type OperationalProject,
} from "../operations";

describe("Phase 05.3.27: Tabletop Exercises & Operational Drift Analyzer", () => {
  it("generates structured tabletop exercise with timed failure injects", () => {
    const scenario = incidentScenarioRegistry.getScenario("SCN-DB-FAILOVER-001")!;
    const exercise = TabletopEngine.generateExercisePlan(scenario);

    expect(exercise.scenarioId).toBe("SCN-DB-FAILOVER-001");
    expect(exercise.injects.length).toBe(5);
    expect(exercise.injects[0].minuteOffset).toBe(0);
    expect(exercise.injects[4].minuteOffset).toBe(60);
    expect(exercise.participants.some((p) => p.role === "incident_commander")).toBe(true);
  });

  it("records observations and evaluates unexpected failure findings during tabletop", () => {
    const scenario = incidentScenarioRegistry.getScenario("SCN-DB-FAILOVER-001")!;
    const exercise = TabletopEngine.generateExercisePlan(scenario);

    const { updatedExercise, newFindings } = TabletopEngine.recordObservation(
      exercise,
      30,
      "Lead Scribe",
      "Secondary database replica failed authentication due to rotated credentials",
      false, // wasExpected = false
      exercise.injects[2].id
    );

    expect(updatedExercise.observations.length).toBe(1);
    expect(newFindings.length).toBe(1);
    expect(newFindings[0].title).toContain("Unexpected Bottleneck Observed in Tabletop");
  });

  it("detects operational drift: unmapped services and missing ownership", () => {
    const nodes: BaseNode[] = [
      { id: "active-gateway", type: "custom", position: { x: 0, y: 0 }, data: { label: "Active Gateway", nodeType: "gateway" } },
      { id: "new-unmapped-service", type: "custom", position: { x: 100, y: 0 }, data: { label: "New Unmapped Microservice", nodeType: "service" } },
    ];

    const project: OperationalProject = {
      id: "proj-1",
      architectureId: "arch-1",
      architectureRevisionId: "rev-1",
      title: "Test Project",
      scenarios: [],
      journeys: [],
      ownerships: [
        { id: "own-1", serviceId: "active-gateway", primaryOwner: "alice@nxtqr.internal", team: "Core", escalationPolicyId: "esc-1" },
        // new-unmapped-service has no ownership!
      ],
      escalationPolicies: [],
      runbooks: [
        {
          id: "rb-1",
          title: "Gateway Runbook",
          purpose: "Triage",
          applicableComponentIds: ["active-gateway"], // new-unmapped-service not covered!
          incidentScenarioIds: [],
          revision: "1.0.0",
          steps: [],
          safetyWarnings: [],
          prerequisites: [],
          rollbackGuidance: "revert",
          owner: "alice",
          reviewDate: new Date().toISOString(),
          isApproved: true,
        },
      ],
      objectives: [],
      dependencies: [],
      backupCapabilities: [],
      failoverProcedures: [],
      tabletopExercises: [],
      evidence: [],
    };

    const drift = OperationalDriftAnalyzer.analyzeDrift(project, nodes);

    expect(drift.hasDrift).toBe(true);
    expect(drift.unmappedServicesCount).toBe(1);
    expect(drift.driftItems.some((d) => d.itemType === "unmapped_service" && d.affectedComponentId === "new-unmapped-service")).toBe(true);
    expect(drift.driftItems.some((d) => d.itemType === "missing_owner" && d.affectedComponentId === "new-unmapped-service")).toBe(true);
  });
});

