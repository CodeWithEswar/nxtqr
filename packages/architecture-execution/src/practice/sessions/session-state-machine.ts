import type {
  InterviewSession,
  PracticeInterviewPhase,
  PracticeMode,
  PracticePressureMode,
  PracticeSessionStatus,
} from "../practice-schemas";

const VALID_TRANSITIONS: Record<PracticeSessionStatus, PracticeSessionStatus[]> = {
  created: ["active", "abandoned"],
  active: ["paused", "submitted", "abandoned"],
  paused: ["active", "abandoned", "submitted"],
  submitted: ["evaluating", "abandoned"],
  evaluating: ["completed", "evaluation_failed"],
  completed: [],
  evaluation_failed: ["evaluating", "abandoned"],
  abandoned: [],
};

export interface PressureModePolicy {
  pressureMode: PracticePressureMode;
  allowPause: boolean;
  maxHintsAllowed: number;
  allowPostSubmitRevision: boolean;
  autoSubmitOnExpire: boolean;
  hintPenaltyDisclosedPerHintPct: number;
}

export function getPressureModePolicy(
  mode: PracticeMode,
  pressureMode: PracticePressureMode
): PressureModePolicy {
  if (mode === "learn" || mode === "engineering-lab") {
    return {
      pressureMode,
      allowPause: true,
      maxHintsAllowed: 5,
      allowPostSubmitRevision: true,
      autoSubmitOnExpire: false,
      // Section 77: Learning mode prioritizes understanding rather than scoring penalties
      hintPenaltyDisclosedPerHintPct: 0,
    };
  }
  if (pressureMode === "strict") {
    return {
      pressureMode: "strict",
      allowPause: false,
      maxHintsAllowed: 2,
      allowPostSubmitRevision: false,
      autoSubmitOnExpire: true,
      hintPenaltyDisclosedPerHintPct: 3,
    };
  }
  if (pressureMode === "standard") {
    return {
      pressureMode: "standard",
      allowPause: true,
      maxHintsAllowed: 3,
      allowPostSubmitRevision: true,
      autoSubmitOnExpire: false,
      hintPenaltyDisclosedPerHintPct: 2,
    };
  }
  return {
    pressureMode: "relaxed",
    allowPause: true,
    maxHintsAllowed: 5,
    allowPostSubmitRevision: true,
    autoSubmitOnExpire: false,
    hintPenaltyDisclosedPerHintPct: 0,
  };
}

export class PracticeSessionStateMachine {
  public static canTransition(
    from: PracticeSessionStatus,
    to: PracticeSessionStatus
  ): boolean {
    return VALID_TRANSITIONS[from].includes(to);
  }

  public static transition(
    session: InterviewSession,
    targetStatus: PracticeSessionStatus,
    timestampIso: string
  ): { ok: true; session: InterviewSession } | { ok: false; reason: string } {
    if (session.status === targetStatus) {
      return {
        ok: false,
        reason: `Duplicate transition blocked: session "${session.id}" is already in "${targetStatus}" state.`,
      };
    }
    if (!this.canTransition(session.status, targetStatus)) {
      return {
        ok: false,
        reason: `Illegal session transition from "${session.status}" to "${targetStatus}".`,
      };
    }

    const policy = getPressureModePolicy(session.mode, session.pressureMode);
    if (targetStatus === "paused" && !policy.allowPause) {
      return {
        ok: false,
        reason: `Strict pressure mode prohibits pausing once an interview is active.`,
      };
    }

    const updated: InterviewSession = {
      ...session,
      status: targetStatus,
    };
    if (targetStatus === "submitted" && !updated.submittedAtIso) {
      updated.submittedAtIso = timestampIso;
    }
    if (targetStatus === "completed" && !updated.completedAtIso) {
      updated.completedAtIso = timestampIso;
    }

    return { ok: true, session: updated };
  }

  public static transitionPhase(
    session: InterviewSession,
    nextPhase: PracticeInterviewPhase
  ): InterviewSession {
    return {
      ...session,
      currentPhase: nextPhase,
    };
  }
}

export interface TimerReconciliationResult {
  elapsedMs: number;
  remainingMs: number;
  expired: boolean;
  shouldAutoSubmit: boolean;
}

/**
 * Reconciles monotonic interview elapsed duration against server/authoritative persisted limit.
 * Intentionally separated from simulation VirtualClock.
 */
export function reconcileInterviewTimer(params: {
  priorElapsedMs: number;
  activeSliceMs: number;
  durationLimitMinutes: number;
  mode: PracticeMode;
  pressureMode: PracticePressureMode;
}): TimerReconciliationResult {
  const safePrior = Math.max(0, params.priorElapsedMs);
  const safeSlice = Math.max(0, params.activeSliceMs);
  const limitMs = Math.max(1, params.durationLimitMinutes) * 60_000;
  const elapsedMs = safePrior + safeSlice;
  const remainingMs = Math.max(0, limitMs - elapsedMs);
  const expired = params.mode === "mock-interview" && elapsedMs >= limitMs;
  const policy = getPressureModePolicy(params.mode, params.pressureMode);

  return {
    elapsedMs,
    remainingMs,
    expired,
    shouldAutoSubmit: expired && policy.autoSubmitOnExpire,
  };
}

