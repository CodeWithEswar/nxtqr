import { VirtualClock } from "../engine/virtual-clock";
import type { ExecutionTrace, VisualizationFrame } from "../domain/execution-trace";
import { RuntimeStateHelper } from "../domain/runtime-state";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";
import type { TemplateExecutionEvent } from "./template-events";
import {
  compareTemplateDesigns,
  createTemplateVariant,
  instantiateTemplate,
} from "./template-instantiation";
import { templateRegistry } from "./template-registry";
import { runTemplateScenarioIsolated } from "./template-scenarios";
import type {
  ArchitectureTemplate,
  ModeledTemplateRuntimeState,
  TemplateInvariantResult,
  TemplateScenarioRunInput,
} from "./template-schemas";
import {
  computeTemplateContentHash,
  validateTemplateDefinition,
} from "./template-validation";
import { TemplateWalkthroughEngine } from "./template-walkthroughs";

export class TemplateInvariantMonitor {
  public static verify(params: {
    template: ArchitectureTemplate;
    scenarioId: string;
    state: ModeledTemplateRuntimeState;
  }): TemplateInvariantResult {
    const violations: TemplateInvariantResult["violations"] = [];

    if (!params.state.validation.valid) {
      violations.push({
        code: "TEMPLATE_VALIDATION_FAILED",
        message:
          params.state.validation.errors.join("; ") ||
          "Template failed validation.",
        severity: "critical",
      });
    }

    if (params.state.scenarioResult.scenarioId !== params.scenarioId) {
      violations.push({
        code: "SCENARIO_ID_MISMATCH",
        message:
          "Executed scenario result ID does not match requested scenario ID.",
        severity: "critical",
      });
    }

    if (
      params.state.walkthrough.steps.length > 0 &&
      (params.state.walkthroughProgress.currentStepIndex < 0 ||
        params.state.walkthroughProgress.currentStepIndex >=
          params.state.walkthrough.steps.length)
    ) {
      violations.push({
        code: "WALKTHROUGH_OUT_OF_BOUNDS",
        message: "Walkthrough step index fell outside valid bounds.",
        severity: "warning",
      });
    }

    return {
      passed: violations.filter((v) => v.severity === "critical").length === 0,
      violations,
    };
  }
}

export class TemplateExecutionEngine {
  public static runScenario(
    input: TemplateScenarioRunInput,
    customTemplate?: ArchitectureTemplate
  ): {
    trace: ExecutionTrace;
    state: ModeledTemplateRuntimeState;
  } {
    const template =
      customTemplate ||
      templateRegistry.getById(input.templateId, input.templateVersion) ||
      templateRegistry.listAll()[0];

    if (!template) {
      throw new Error(`Template "${input.templateId}" not found.`);
    }

    const validation = validateTemplateDefinition(template);
    const activeScenario =
      template.scenarios.find((s) => s.id === input.scenarioId) ||
      template.scenarios[0];
    if (!activeScenario) {
      throw new Error(
        `Template "${template.manifest.slug}" has no runnable scenario matching "${input.scenarioId}".`
      );
    }

    const walkthrough =
      template.walkthroughs.find((w) => w.id === input.walkthroughId) ||
      template.walkthroughs[0];

    const seed = input.seed ?? activeScenario.seed;
    const clock = new VirtualClock();
    const events: TemplateExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];
    const baseState = RuntimeStateHelper.createInitialState();
    const fixedIso = new Date(Date.UTC(2026, 10, 12, 12, 0, 0)).toISOString();
    const sessionId = `tpl_sess_${input.id}_${seed}`;
    let seq = 0;

    const pushEvent = (built: TemplateExecutionEvent) => {
      events.push(built);
      return built;
    };

    const baseMeta = (explanation: string) => {
      seq += 1;
      return {
        id: `tev_${seq}`,
        sequence: seq,
        atMs: clock.now(),
        durationMs: 25,
        sessionId,
        payloadVersion: 1 as const,
        templateId: template.manifest.id,
        templateVersion: template.versionRecord.version,
        explanation,
      };
    };

    const recordFrame = (
      activeNodeId: string,
      stepTitle: string,
      stepExplanation: string,
      activeEdgeId?: string
    ) => {
      const lastEv = events[events.length - 1];
      frames.push({
        frameIndex: frames.length,
        virtualTimeMs: clock.now(),
        activeNodeIds: activeNodeId ? [activeNodeId] : [],
        activeEdgeIds: activeEdgeId ? [activeEdgeId] : [],
        activeEvent: lastEv,
        direction: "request",
        stepTitle,
        stepExplanation,
        runtimeState: RuntimeStateHelper.cloneState(baseState),
      });
    };

    const firstNodeId = template.topology.nodes[0]?.id ?? "entry";

    // 1. Resolve template
    clock.advance(10);
    const resolvedMsg = `Loaded reference architecture "${template.manifest.title}" v${template.manifest.version}.`;
    pushEvent({
      ...baseMeta(resolvedMsg),
      type: "template.resolved",
      actor: "system",
      slug: template.manifest.slug,
      contentHash: computeTemplateContentHash({
        manifest: template.manifest,
        nodes: template.topology.nodes,
        edges: template.topology.edges,
        scenarios: template.scenarios,
        walkthroughs: template.walkthroughs,
      }),
    });
    recordFrame(firstNodeId, "Template Resolved", resolvedMsg);

    // 2. Validate template & publication gate
    clock.advance(15);
    const validatedMsg = `Verified ${template.topology.nodes.length} nodes, ${template.topology.edges.length} edges, and configuration constraints.`;
    pushEvent({
      ...baseMeta(validatedMsg),
      type: "template.validated",
      actor: "validator",
      valid: validation.valid,
      publicationStatus: template.publication.status,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
    });
    recordFrame(firstNodeId, "Template Validated", validatedMsg);

    // 3. Optional instantiation preview
    let instantiation = undefined;
    if (input.instantiateIntoProjectId) {
      clock.advance(20);
      instantiation = instantiateTemplate({
        template,
        userId: input.userId || "system-preview-user",
        targetProjectId: input.instantiateIntoProjectId,
        idempotencyKey: input.id,
      });
      const instMsg = `Cloned immutable revision into project "${instantiation.targetProjectId}".`;
      pushEvent({
        ...baseMeta(instMsg),
        type: "template.instantiated",
        actor: "user",
        instantiationId: instantiation.instantiationId,
        targetProjectId: instantiation.targetProjectId,
        targetRevisionId: instantiation.architectureRevisionId,
      });
      recordFrame(firstNodeId, "Template Instantiated", instMsg);
    }

    // 4. Isolated deterministic scenario simulation
    clock.advance(15);
    const startMsg = `Running isolated workload at ${activeScenario.workloadConfig.workloadRps} req/s (seed ${seed}).`;
    pushEvent({
      ...baseMeta(startMsg),
      type: "template.scenario.started",
      actor: "simulator",
      scenarioId: activeScenario.id,
      workloadRps: activeScenario.workloadConfig.workloadRps,
      seed,
    });
    recordFrame(firstNodeId, `Scenario Started: ${activeScenario.title}`, startMsg);

    for (const fault of activeScenario.faultSchedule) {
      if (fault.type !== "none") {
        clock.advance(20);
        const faultMsg = `Injected ${fault.type} fault targeting ${fault.targetId || firstNodeId}.`;
        pushEvent({
          ...baseMeta(faultMsg),
          type: "template.scenario.fault_injected",
          actor: "simulator",
          scenarioId: activeScenario.id,
          faultType: fault.type,
          targetId: fault.targetId,
        });
        recordFrame(
          fault.targetId || firstNodeId,
          `Fault Injected: ${fault.type}`,
          faultMsg
        );
      }
    }

    const scenarioResult = runTemplateScenarioIsolated({
      template,
      scenario: activeScenario,
      seedOverride: seed,
      variantComponentOverrides: input.variantComponentOverrides,
    });
    templateRegistry.recordUsage(template.manifest.id, "scenarioRunsCount");

    const matchedObservations = scenarioResult.observations.filter(
      (c) => c.status === "matched"
    ).length;

    clock.advance(40);
    const compMsg = `Observed p95 ${scenarioResult.summary.p95LatencyMs}ms, availability ${(scenarioResult.summary.simulatedAvailability * 100).toFixed(2)}%.`;
    pushEvent({
      ...baseMeta(compMsg),
      type: "template.scenario.completed",
      actor: "simulator",
      scenarioId: activeScenario.id,
      p95LatencyMs: scenarioResult.summary.p95LatencyMs,
      availability: scenarioResult.summary.simulatedAvailability,
      matchedObservations,
      totalObservations: scenarioResult.observations.length,
    });
    recordFrame(firstNodeId, "Scenario Simulation Completed", compMsg);

    // 5. Guided walkthrough progression sync
    const walkthroughProgress = TemplateWalkthroughEngine.initialize(
      template.manifest.id,
      walkthrough,
      input.walkthroughStepIndex ?? 0
    );
    const activeStep = TemplateWalkthroughEngine.getCurrentStep(
      walkthrough,
      walkthroughProgress
    );
    if (activeStep) {
      clock.advance(15);
      pushEvent({
        ...baseMeta(activeStep.explanation),
        type: "template.walkthrough.step",
        actor: "walkthrough",
        walkthroughId: walkthrough.id,
        stepId: activeStep.id,
        stepOrder: activeStep.order,
        focusNodeId: activeStep.focusNodeId,
        highlightEdgeId: activeStep.highlightEdgeId,
      });
      recordFrame(
        activeStep.focusNodeId || firstNodeId,
        activeStep.title,
        activeStep.explanation,
        activeStep.highlightEdgeId
      );
    }

    // 6. Optional variant design diff & trade-off comparison
    let comparisonWithBaseline = undefined;
    if (
      input.variantComponentOverrides &&
      input.variantComponentOverrides.length > 0
    ) {
      clock.advance(20);
      const variant = createTemplateVariant({
        baseTemplate: template,
        name: `${template.manifest.title} — Tuned Variant`,
        ownerId: input.userId || "system-preview-user",
      });
      variant.analysisRevision = {
        ...variant.analysisRevision,
        components: variant.analysisRevision.components.map((c) => {
          const ov = input.variantComponentOverrides?.find(
            (o) => o.componentId === c.id
          );
          if (!ov) return c;
          return {
            ...c,
            replicas: ov.replicas ?? c.replicas,
            capacityPerReplicaRps:
              ov.capacityPerReplicaRps ?? c.capacityPerReplicaRps,
            cacheHitRatio: ov.cacheHitRatio ?? c.cacheHitRatio,
          };
        }),
      };
      comparisonWithBaseline = compareTemplateDesigns({
        baselineLabel: `${template.manifest.title} v${template.manifest.version}`,
        baselineRevision: template.topology.analysisRevision,
        candidateLabel: variant.name,
        candidateRevision: variant.analysisRevision,
      });
      pushEvent({
        ...baseMeta(comparisonWithBaseline.summary),
        type: "template.variant.compared",
        actor: "user",
        baselineLabel: comparisonWithBaseline.baselineLabel,
        candidateLabel: comparisonWithBaseline.candidateLabel,
        complexityDelta: comparisonWithBaseline.complexityDelta,
      });
      recordFrame(
        firstNodeId,
        "Variant Trade-Off Compared",
        comparisonWithBaseline.summary
      );
    }

    const templateState: ModeledTemplateRuntimeState = {
      runId: input.id,
      template,
      validation,
      activeScenario,
      scenarioResult,
      walkthrough,
      walkthroughProgress,
      instantiation,
      comparisonWithBaseline,
      invariants: { passed: true, violations: [] },
    };

    const invariants = TemplateInvariantMonitor.verify({
      template,
      scenarioId: activeScenario.id,
      state: templateState,
    });
    templateState.invariants = invariants;
    baseState.templateState = templateState;
    recordFrame(
      firstNodeId,
      "Template Run Verified",
      `Completed ${template.manifest.title} [${activeScenario.title}] invariant & scenario verification.`
    );

    const cfg: ExecutionConfiguration = {
      version: 1,
      entryNodeId: firstNodeId,
      request: {
        id: `req_tpl_${input.id}`,
        method: "POST",
        path: `/templates/${template.manifest.slug}/scenarios/${activeScenario.id}`,
        headers: {},
        body: {
          templateId: template.manifest.id,
          scenarioId: activeScenario.id,
          seed,
        },
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: 500,
        maxHops: 50,
        maxDurationMs: 5000,
      },
      timing: {
        nodeDurationMs: 20,
        edgeDurationMs: 10,
      },
      presetId: "custom",
    };

    const trace: ExecutionTrace = {
      runId: `tpl_run_${input.id}_${seed}`,
      architectureId: `arch_tpl_${template.manifest.id}`,
      architectureRevisionId: template.manifest.architectureRevisionId,
      snapshotHash: template.versionRecord.contentHash,
      createdAt: fixedIso,
      visitedNodeIds: template.topology.nodes.map((n) => n.id),
      traversedEdgeIds: template.topology.edges.map((e) => e.id),
      configuration: cfg,
      events,
      totalDurationMs: Math.max(50, clock.now()),
      totalEvents: events.length,
      totalHops: template.topology.nodes.length + events.length,
      outcome: invariants.passed ? "success" : "failure",
      terminalReason: `${template.manifest.title} [${activeScenario.title}]: p95 ${scenarioResult.summary.p95LatencyMs}ms, availability ${(scenarioResult.summary.simulatedAvailability * 100).toFixed(2)}%, cost $${scenarioResult.summary.estimatedMonthlyCostUsd}/mo.`,
      frames,
    };

    return { trace, state: templateState };
  }
}
