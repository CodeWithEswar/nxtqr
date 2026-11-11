/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Master Orchestrator: ArchitectureEvolutionEngine
 */

import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";
import type {
  MigrationAnalysisResult,
  MigrationAnalysisSummary,
  MigrationEvolutionRoadmap,
  MigrationMilestone,
  MigrationProject,
  MigrationStrategyId,
} from "../contracts/evolution.types";
import { migrationAnalysisResultSchema } from "../schemas/evolution.schemas";
import { migrationStrategyRegistry } from "../registry/strategy-registry";
import { RequirementExtractor } from "../planning/requirement-extractor";
import { MigrationDependencyGraph } from "../planning/dependency-graph";
import { WavePlanner } from "../planning/wave-planner";
import { IntermediateModeler } from "../planning/intermediate-modeler";
import { RollbackFeasibilityAnalyzer } from "../analysis/rollback-feasibility-analyzer";
import { CutoverReadinessAnalyzer } from "../analysis/cutover-readiness-analyzer";
import { MigrationRiskAnalyzer } from "../analysis/migration-risk-analyzer";
import { EvolutionDriftAnalyzer } from "../analysis/evolution-drift-analyzer";

export interface PlanEvolutionOptions {
  projectId?: string;
  architectureId?: string;
  title?: string;
  description?: string;
  strategyId?: MigrationStrategyId;
  createdBy?: string;
}

export class ArchitectureEvolutionEngine {
  private static instance: ArchitectureEvolutionEngine;

  public static getInstance(): ArchitectureEvolutionEngine {
    if (!ArchitectureEvolutionEngine.instance) {
      ArchitectureEvolutionEngine.instance = new ArchitectureEvolutionEngine();
    }
    return ArchitectureEvolutionEngine.instance;
  }

  /**
   * Plans the complete architecture evolution from source snapshot to target snapshot.
   */
  public planEvolution(
    sourceSnapshot: ArchitectureSnapshot,
    targetSnapshot: ArchitectureSnapshot,
    options: PlanEvolutionOptions = {}
  ): MigrationAnalysisResult {
    const projectId = options.projectId || `proj-${Date.now()}`;
    const architectureId = options.architectureId || "arch-system-design";
    const title = options.title || "Architecture Modernization & Evolution Plan";
    const description = options.description || "Systematic evolution plan transitioning from legacy topology to cloud-native microservices.";
    const createdBy = options.createdBy || "nxtqr-evolution-engine";

    // 1. Determine or recommend Migration Strategy
    let strategyId = options.strategyId;
    if (!strategyId) {
      const recommendation = migrationStrategyRegistry.recommendStrategy(sourceSnapshot, targetSnapshot);
      strategyId = recommendation.recommendedStrategyId;
    }

    // 2. Extract Requirements from Semantic Diff
    const requirements = RequirementExtractor.extractRequirements(
      sourceSnapshot,
      targetSnapshot,
      projectId
    );

    // 3. Plan Waves, Tasks, Dependencies & Gates
    const wavePlan = WavePlanner.planWaves(requirements, strategyId, projectId);
    const { waves, tasks, dependencies, gates } = wavePlan;

    // 4. Analyze Dependency DAG, Cycle Detection & Critical Path
    const depGraph = new MigrationDependencyGraph(tasks, dependencies);
    const depAnalysis = depGraph.analyze();

    // 5. Generate Intermediate Architecture Snapshots
    const intermediateStates = IntermediateModeler.generateIntermediateSnapshots(
      sourceSnapshot,
      targetSnapshot,
      waves,
      projectId
    );

    // 6. Analyze Rollback Feasibility & Points of No Return
    const rollbackPlans = RollbackFeasibilityAnalyzer.analyzeRollbackPlans(waves, tasks);

    // 7. Plan Cutover & Verify Gate Readiness
    const cutoverAssessment = CutoverReadinessAnalyzer.planCutover(waves, gates, projectId);
    const cutoverPlans = cutoverAssessment.plans;

    // 8. Analyze Migration Risks & Blast Radius
    const risks = MigrationRiskAnalyzer.analyzeRisks(
      sourceSnapshot,
      targetSnapshot,
      waves,
      tasks,
      projectId
    );

    // 9. Build Evolution Roadmap & Milestones
    const milestones: MigrationMilestone[] = waves.map((w) => ({
      id: `${projectId}-milestone-w${w.waveNumber}`,
      title: `Milestone: ${w.title}`,
      waveId: w.id,
      targetStateDescription: w.objective,
      isDelivered: w.status === "completed",
    }));

    const roadmap: MigrationEvolutionRoadmap = {
      id: `${projectId}-roadmap`,
      projectId,
      totalWaves: waves.length,
      milestones,
      criticalPathTaskIds: depAnalysis.criticalPathTaskIds,
      estimatedTotalHours: depAnalysis.estimatedTotalHours,
      hasScheduleGaps: depAnalysis.hasCycle,
    };

    // 10. Assemble Migration Project
    const nowIso = new Date().toISOString();
    const project: MigrationProject = {
      id: projectId,
      architectureId,
      title,
      description,
      sourceRevisionId: sourceSnapshot.revision,
      targetRevisionId: targetSnapshot.revision,
      strategyId,
      status: "planning",
      sourceSnapshot,
      targetSnapshot,
      waves,
      tasks,
      dependencies,
      requirements,
      gates,
      cutoverPlans,
      rollbackPlans,
      risks,
      intermediateStates,
      createdBy,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 11. Compile Aggregate Summary
    const acceptedReqs = requirements.filter((r) => r.status === "accepted" || r.status === "verified").length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
    const criticalRisks = risks.filter((r) => r.severity === "critical").length;
    const highRisks = risks.filter((r) => r.severity === "high").length;
    const irreversibleWaves = rollbackPlans.filter((p) => p.feasibilityStatus === "irreversible").length;
    const passedGates = gates.filter((g) => g.status === "passed").length;
    const failedGates = gates.filter((g) => g.status === "failed").length;
    const unknownGates = gates.filter((g) => g.status === "unknown").length;

    const summary: MigrationAnalysisSummary = {
      totalRequirementsCount: requirements.length,
      acceptedRequirementsCount: acceptedReqs,
      totalTasksCount: tasks.length,
      totalWavesCount: waves.length,
      completedTasksCount: completedTasks,
      blockedTasksCount: blockedTasks,
      criticalRisksCount: criticalRisks,
      highRisksCount: highRisks,
      irreversibleWavesCount: irreversibleWaves,
      passedGatesCount: passedGates,
      failedGatesCount: failedGates,
      unknownGatesCount: unknownGates,
      estimatedTotalEffortHours: depAnalysis.estimatedTotalHours,
      hasBlockingIssues: depAnalysis.hasCycle || failedGates > 0,
    };

    const result: MigrationAnalysisResult = {
      projectId,
      summary,
      project,
      roadmap,
      analyzedAt: nowIso,
    };

    // Validate runtime contract through Zod
    return migrationAnalysisResultSchema.parse(result) as unknown as MigrationAnalysisResult;
  }

  /**
   * Evaluates drift between a baseline project plan and an observed architecture snapshot.
   */
  public detectDrift(
    baselineProject: MigrationProject,
    currentSnapshot: ArchitectureSnapshot
  ) {
    return EvolutionDriftAnalyzer.analyzeDrift(baselineProject, currentSnapshot);
  }

  /**
   * Simulates What-If evolutionary scenarios (e.g., failed canary, sudden rollback trigger).
   */
  public simulateWhatIf(
    baselineResult: MigrationAnalysisResult,
    scenario: "failed_canary_gate" | "cutover_abort_rollback" | "cdc_sync_lag_spike"
  ): MigrationAnalysisResult {
    const cloned = JSON.parse(JSON.stringify(baselineResult)) as MigrationAnalysisResult;

    if (scenario === "failed_canary_gate") {
      const canaryGate = cloned.project.gates.find((g) => g.gateType === "contract_verification");
      if (canaryGate) {
        canaryGate.status = "failed";
        canaryGate.evaluationNotes = "SIMULATED WHAT-IF: Canary error rate reached 2.4%, exceeding 0.1% SLO limit.";
      }
      cloned.summary.failedGatesCount++;
      cloned.summary.passedGatesCount--;
      cloned.summary.hasBlockingIssues = true;

      const wave4 = cloned.project.waves.find((w) => w.waveNumber === 4);
      if (wave4) {
        wave4.status = "planned";
      }
    } else if (scenario === "cutover_abort_rollback") {
      const wave4 = cloned.project.waves.find((w) => w.waveNumber === 4);
      if (wave4) {
        wave4.status = "rolled_back";
      }
      const cutoverPlan = cloned.project.cutoverPlans[0];
      if (cutoverPlan) {
        cutoverPlan.trafficScope = "ABORTED: 100% traffic rerouted back to legacy monolith.";
      }
    } else if (scenario === "cdc_sync_lag_spike") {
      const dualWriteRisk = cloned.project.risks.find((r) => r.category === "dual_write_inconsistency");
      if (dualWriteRisk) {
        dualWriteRisk.severity = "critical";
        dualWriteRisk.failureMode = "SIMULATED WHAT-IF: CDC stream lag reached 12,000ms. Immediate reconciliation freeze recommended.";
      }
    }

    cloned.analyzedAt = new Date().toISOString();
    return migrationAnalysisResultSchema.parse(cloned) as unknown as MigrationAnalysisResult;
  }
}

export const architectureEvolutionEngine = ArchitectureEvolutionEngine.getInstance();
