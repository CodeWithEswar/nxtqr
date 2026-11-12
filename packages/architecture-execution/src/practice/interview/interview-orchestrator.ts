import { z } from "zod";
import type { AnalysisComponentConfig, AnalysisEdgeConfig } from "../../analysis/analysis-schemas";
import type {
  HintDefinition,
  HintReveal,
  InterviewQuestion,
  PracticeInterviewPhase,
  PracticeMode,
  PracticePressureMode,
  SystemDesignChallenge,
} from "../practice-schemas";
import { getPressureModePolicy } from "../sessions/session-state-machine";

export const InterviewFollowUpSchema = z.object({
  prompt: z.string().min(1),
  focusArea: z.string().min(1),
  aiGenerated: z.boolean(),
});
export type InterviewFollowUp = z.infer<typeof InterviewFollowUpSchema>;

export const QualitativeFeedbackSchema = z.object({
  summary: z.string().min(1),
  communicationNote: z.string().min(1),
  qualitativeOnly: z.literal(true),
});
export type QualitativeFeedback = z.infer<typeof QualitativeFeedbackSchema>;

export interface InterviewAssistantContext {
  challengeTitle: string;
  phase: PracticeInterviewPhase;
  candidateNote: string;
  maxTokens?: number;
}

export interface InterviewAssistantProvider {
  readonly providerId: string;
  generateFollowUp(input: InterviewAssistantContext): Promise<InterviewFollowUp>;
  provideQualitativeFeedback(input: InterviewAssistantContext): Promise<QualitativeFeedback>;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all|previous)\s+instructions/gi,
  /reveal\s+(hidden|answer|rubric|key)/gi,
  /system\s+prompt/gi,
];

export function sanitizeCandidateText(raw: string): string {
  let clean = raw.slice(0, 4000);
  for (const pat of INJECTION_PATTERNS) {
    clean = clean.replace(pat, "[redacted_instruction]");
  }
  return clean.trim();
}

export class DeterministicInterviewAssistant implements InterviewAssistantProvider {
  public readonly providerId = "deterministic_rules_interviewer";

  public async generateFollowUp(
    input: InterviewAssistantContext
  ): Promise<InterviewFollowUp> {
    sanitizeCandidateText(input.candidateNote);
    return InterviewFollowUpSchema.parse({
      prompt: `Walk through how ${input.challengeTitle} behaves during peak contention in the ${input.phase.replace(/_/g, " ")} stage, and what trade-off you chose to sacrifice.`,
      focusArea: input.phase,
      aiGenerated: false,
    });
  }

  public async provideQualitativeFeedback(
    input: InterviewAssistantContext
  ): Promise<QualitativeFeedback> {
    const clean = sanitizeCandidateText(input.candidateNote);
    const hasTradeoffWords =
      clean.toLowerCase().includes("trade-off") ||
      clean.toLowerCase().includes("sacrifice") ||
      clean.toLowerCase().includes("latency") ||
      clean.toLowerCase().includes("cost");

    return QualitativeFeedbackSchema.parse({
      summary: hasTradeoffWords
        ? "Communication notes articulate latency/cost trade-offs; confirm quantitative metrics match simulation output."
        : "Consider explicitly stating which nonfunctional metric you prioritized and what operational simplicity or cost you traded off.",
      communicationNote:
        "Deterministic qualitative observation only; does not alter numeric rubric checks.",
      qualitativeOnly: true,
    });
  }
}

export function generateContextualFollowUpQuestions(params: {
  challenge: SystemDesignChallenge;
  phase: PracticeInterviewPhase;
  discoveredRequirementIds: string[];
  components: AnalysisComponentConfig[];
  edges: AnalysisEdgeConfig[];
  alreadyAskedIds: string[];
}): InterviewQuestion[] {
  const {
    challenge,
    phase,
    discoveredRequirementIds,
    components,
    edges,
    alreadyAskedIds,
  } = params;

  const asked = new Set(alreadyAskedIds);
  const questions: InterviewQuestion[] = [];

  const pushUnique = (q: InterviewQuestion) => {
    if (!asked.has(q.id)) {
      asked.add(q.id);
      questions.push(q);
    }
  };

  if (discoveredRequirementIds.length < challenge.requirements.length) {
    pushUnique({
      id: `${challenge.id}_q_req`,
      phase: "requirements_discovery",
      prompt:
        "Before committing to components, which peak scale, read/write ratio, or failure-recovery numbers still need clarification?",
      targetCriterion: "requirements_discovery",
      difficulty: challenge.difficulty,
      reason: "Undiscovered requirements remain in session.",
    });
  }

  const dbComp = components.find((c) => c.kind === "database");
  if (dbComp && dbComp.replicas <= 1) {
    pushUnique({
      id: `${challenge.id}_q_db_spof`,
      phase: phase === "problem_understanding" ? "reliability_analysis" : phase,
      prompt: `Your "${dbComp.label}" component has ${dbComp.replicas} replica. What happens to writes and reads if that node or its AZ goes down?`,
      targetCriterion: "reliability",
      difficulty: challenge.difficulty,
      reason: "Single-replica stateful database detected in topology.",
    });
  }

  const hasRetryRisk = edges.some((e) => e.retryFactor > 2);
  if (hasRetryRisk) {
    pushUnique({
      id: `${challenge.id}_q_retry_amp`,
      phase: "reliability_analysis",
      prompt:
        "An upstream edge has a retry multiplier above 2x. How do you prevent retry storms from amplifying partial database slowdowns?",
      targetCriterion: "reliability",
      difficulty: challenge.difficulty,
      reason: "High retry multiplier configured on architecture edge.",
    });
  }

  pushUnique({
    id: `${challenge.id}_q_10x`,
    phase: "scalability_analysis",
    prompt: `If incoming traffic spikes 10x for ${challenge.title}, which component saturates first and how do you scale it without blowing up monthly cost?`,
    targetCriterion: "scalability",
    difficulty: challenge.difficulty,
    reason: "Core scalability stress check.",
  });

  pushUnique({
    id: `${challenge.id}_q_tradeoff`,
    phase: "tradeoff_discussion",
    prompt:
      "Why is your storage & caching topology appropriate here, and what simplicity or strong-consistency guarantee did you intentionally trade off?",
    targetCriterion: "tradeoff_reasoning",
    difficulty: challenge.difficulty,
    reason: "Evaluates engineering reasoning rather than technology buzzwords.",
  });

  return questions.slice(0, 4);
}

export function revealProgressiveHint(params: {
  challenge: SystemDesignChallenge;
  hintId: string;
  alreadyRevealed: HintReveal[];
  mode: PracticeMode;
  pressureMode: PracticePressureMode;
  atMs: number;
}): { ok: true; reveal: HintReveal; hint: HintDefinition } | { ok: false; reason: string } {
  const { challenge, hintId, alreadyRevealed, mode, pressureMode, atMs } = params;
  const hint = challenge.hints.find((h) => h.id === hintId);
  if (!hint) {
    return { ok: false, reason: `Hint "${hintId}" does not belong to challenge "${challenge.id}".` };
  }

  const existing = alreadyRevealed.find((r) => r.hintId === hintId);
  if (existing) {
    return { ok: true, reveal: existing, hint };
  }

  const policy = getPressureModePolicy(mode, pressureMode);
  if (alreadyRevealed.length >= policy.maxHintsAllowed) {
    return {
      ok: false,
      reason: `Pressure mode "${pressureMode}" limits reveals to ${policy.maxHintsAllowed} hints.`,
    };
  }

  const revealedSet = new Set(alreadyRevealed.map((r) => r.hintId));
  for (const prereq of hint.prerequisiteHintIds) {
    if (!revealedSet.has(prereq)) {
      return {
        ok: false,
        reason: `Progressive unlock requires revealing prerequisite hint "${prereq}" first.`,
      };
    }
  }

  const reveal: HintReveal = {
    hintId: hint.id,
    level: hint.level,
    revealedAtMs: atMs,
    mode,
  };
  return { ok: true, reveal, hint };
}

