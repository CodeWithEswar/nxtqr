import type {
  GuidedWalkthrough,
  WalkthroughProgressState,
  WalkthroughStep,
} from "./template-schemas";

export class TemplateWalkthroughEngine {
  public static initialize(
    templateId: string,
    walkthrough: GuidedWalkthrough,
    initialStepIndex = 0
  ): WalkthroughProgressState {
    const clampedIdx = Math.max(
      0,
      Math.min(walkthrough.steps.length - 1, initialStepIndex)
    );
    const step = walkthrough.steps[clampedIdx];
    const completed = walkthrough.steps
      .slice(0, clampedIdx)
      .map((s) => s.id);

    return {
      walkthroughId: walkthrough.id,
      templateId,
      currentStepIndex: clampedIdx,
      completedStepIds: completed,
      selectedNodeId: step?.focusNodeId,
      selectedEdgeId: step?.highlightEdgeId,
      timelinePositionMs: clampedIdx * 120,
      status: "in_progress",
    };
  }

  public static next(
    walkthrough: GuidedWalkthrough,
    state: WalkthroughProgressState
  ): WalkthroughProgressState {
    const currStep = walkthrough.steps[state.currentStepIndex];
    const completedSet = new Set(state.completedStepIds);
    if (currStep) completedSet.add(currStep.id);

    if (state.currentStepIndex >= walkthrough.steps.length - 1) {
      return {
        ...state,
        completedStepIds: Array.from(completedSet),
        status: "completed",
      };
    }

    const nextIdx = state.currentStepIndex + 1;
    const nextStep = walkthrough.steps[nextIdx];
    return {
      ...state,
      currentStepIndex: nextIdx,
      completedStepIds: Array.from(completedSet),
      selectedNodeId: nextStep?.focusNodeId,
      selectedEdgeId: nextStep?.highlightEdgeId,
      timelinePositionMs: nextIdx * 120,
      status: "in_progress",
    };
  }

  public static previous(
    walkthrough: GuidedWalkthrough,
    state: WalkthroughProgressState
  ): WalkthroughProgressState {
    const prevIdx = Math.max(0, state.currentStepIndex - 1);
    const step = walkthrough.steps[prevIdx];
    return {
      ...state,
      currentStepIndex: prevIdx,
      selectedNodeId: step?.focusNodeId,
      selectedEdgeId: step?.highlightEdgeId,
      timelinePositionMs: prevIdx * 120,
      status: "in_progress",
    };
  }

  public static goToStep(
    walkthrough: GuidedWalkthrough,
    state: WalkthroughProgressState,
    stepIndex: number
  ): WalkthroughProgressState {
    const idx = Math.max(0, Math.min(walkthrough.steps.length - 1, stepIndex));
    const step = walkthrough.steps[idx];
    return {
      ...state,
      currentStepIndex: idx,
      selectedNodeId: step?.focusNodeId,
      selectedEdgeId: step?.highlightEdgeId,
      timelinePositionMs: idx * 120,
      status: "in_progress",
    };
  }

  public static restart(
    walkthrough: GuidedWalkthrough,
    state: WalkthroughProgressState
  ): WalkthroughProgressState {
    const first = walkthrough.steps[0];
    return {
      ...state,
      currentStepIndex: 0,
      completedStepIds: [],
      selectedNodeId: first?.focusNodeId,
      selectedEdgeId: first?.highlightEdgeId,
      timelinePositionMs: 0,
      status: "in_progress",
    };
  }

  public static exit(state: WalkthroughProgressState): WalkthroughProgressState {
    return {
      ...state,
      status: "exited",
    };
  }

  public static resume(
    walkthrough: GuidedWalkthrough,
    state: WalkthroughProgressState
  ): WalkthroughProgressState {
    const step = walkthrough.steps[state.currentStepIndex];
    return {
      ...state,
      selectedNodeId: step?.focusNodeId,
      selectedEdgeId: step?.highlightEdgeId,
      status: "in_progress",
    };
  }

  public static getCurrentStep(
    walkthrough: GuidedWalkthrough,
    state: WalkthroughProgressState
  ): WalkthroughStep | undefined {
    return walkthrough.steps[state.currentStepIndex];
  }
}
