import {
  SystemDesignChallengeSchema,
  type ChallengeAuthoringStatus,
  type ChallengeCategory,
  type ChallengeDifficulty,
  type EvaluationRubric,
  type LearningProgress,
  type PublicSystemDesignChallenge,
  type SystemDesignChallenge,
} from "../practice-schemas";
import { EVALUATION_RUBRICS, SYSTEM_DESIGN_CHALLENGES } from "./challenge-library";

export function validateRubricWeights(rubric: EvaluationRubric): {
  valid: boolean;
  totalWeight: number;
  error?: string;
} {
  const totalWeight = rubric.criteria.reduce((sum, c) => sum + c.weight, 0);
  if (rubric.normalized && Math.abs(totalWeight - 100) > 1e-6) {
    return {
      valid: false,
      totalWeight,
      error: `Normalized rubric "${rubric.id}" must sum to 100%, got ${totalWeight}% (never silently auto-normalized).`,
    };
  }
  return { valid: true, totalWeight };
}

export function validateChallengeDefinition(challenge: SystemDesignChallenge): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const parsed = SystemDesignChallengeSchema.safeParse(challenge);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${issue.path.join(".")}: ${issue.message}`);
    }
  }
  const rubric = EVALUATION_RUBRICS.find((r) => r.id === challenge.rubricId);
  if (!rubric) {
    errors.push(`Unknown rubricId "${challenge.rubricId}"`);
  } else {
    const rw = validateRubricWeights(rubric);
    if (!rw.valid && rw.error) errors.push(rw.error);
  }
  if (challenge.evaluatorOnly.expectedPeakRpsMin > challenge.evaluatorOnly.expectedPeakRpsMax) {
    errors.push("expectedPeakRpsMin cannot exceed expectedPeakRpsMax");
  }
  const reqIds = new Set(challenge.requirements.map((r) => r.id));
  for (const rule of challenge.discoveryRules) {
    for (const target of rule.revealsRequirementIds) {
      if (!reqIds.has(target)) {
        errors.push(`Discovery rule "${rule.id}" references missing requirement "${target}"`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function getChallengeById(
  challengeId: string,
  version?: number
): SystemDesignChallenge | undefined {
  return SYSTEM_DESIGN_CHALLENGES.find(
    (c) => c.id === challengeId && (version === undefined || c.version === version)
  );
}

export function getChallengeBySlug(slug: string): SystemDesignChallenge | undefined {
  return SYSTEM_DESIGN_CHALLENGES.find((c) => c.slug === slug);
}

export function getRubricById(rubricId: string): EvaluationRubric | undefined {
  return EVALUATION_RUBRICS.find((r) => r.id === rubricId);
}

/**
 * Strips evaluator-only targets & unrevealed hidden requirements so learners never receive
 * hidden answer keys or unrevealed requirement details in public payloads.
 */
export function toPublicChallenge(
  challenge: SystemDesignChallenge,
  discoveredRequirementIds: string[] = []
): PublicSystemDesignChallenge {
  const unlocked = new Set(discoveredRequirementIds);
  const visibleRequirements = challenge.requirements.filter(
    (r) => r.discoveredByDefault || unlocked.has(r.id)
  );

  return {
    version: challenge.version,
    id: challenge.id,
    slug: challenge.slug,
    title: challenge.title,
    description: challenge.description,
    difficulty: challenge.difficulty,
    categories: [...challenge.categories],
    estimatedMinutes: challenge.estimatedMinutes,
    publicPrompt: challenge.publicPrompt,
    concepts: [...challenge.concepts],
    visibleRequirements,
    constraints: [...challenge.constraints],
    scenarios: [...challenge.scenarios],
    rubricId: challenge.rubricId,
    starterArchitectureId: challenge.starterArchitectureId,
    sampleClarificationPrompts: challenge.discoveryRules.map((d) => d.promptSample),
    learningObjectives: [...challenge.learningObjectives],
  };
}

export interface ChallengeCatalogQuery {
  search?: string;
  difficulty?: ChallengeDifficulty | "all";
  category?: ChallengeCategory | "all";
  maxMinutes?: number;
  completionFilter?: "all" | "completed" | "incomplete";
  progressMap?: Record<string, LearningProgress>;
  page?: number;
  pageSize?: number;
}

export function searchChallengeCatalog(query: ChallengeCatalogQuery = {}): {
  items: PublicSystemDesignChallenge[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const {
    search = "",
    difficulty = "all",
    category = "all",
    maxMinutes,
    completionFilter = "all",
    progressMap = {},
    page = 1,
    pageSize = 12,
  } = query;

  const q = search.trim().toLowerCase();
  const filtered = SYSTEM_DESIGN_CHALLENGES.filter((ch) => {
    if (ch.status !== "published") return false;
    if (difficulty !== "all" && ch.difficulty !== difficulty) return false;
    if (category !== "all" && !ch.categories.includes(category)) return false;
    if (typeof maxMinutes === "number" && ch.estimatedMinutes > maxMinutes) return false;
    if (completionFilter !== "all") {
      const done = Boolean(progressMap[ch.id]?.completed);
      if (completionFilter === "completed" && !done) return false;
      if (completionFilter === "incomplete" && done) return false;
    }
    if (q.length > 0) {
      const hay = `${ch.title} ${ch.description} ${ch.concepts.join(" ")} ${ch.categories.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const safePageSize = Math.max(1, Math.min(50, pageSize));
  const totalPages = Math.max(1, Math.ceil(filtered.length / safePageSize));
  const safePage = Math.max(1, Math.min(totalPages, page));
  const start = (safePage - 1) * safePageSize;

  return {
    items: filtered.slice(start, start + safePageSize).map((ch) => toPublicChallenge(ch, [])),
    total: filtered.length,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

export function validateChallengeDraft(
  draft: SystemDesignChallenge,
  targetStatus: ChallengeAuthoringStatus
): { allowed: boolean; status: ChallengeAuthoringStatus; errors: string[] } {
  const validation = validateChallengeDefinition(draft);
  if (!validation.valid && (targetStatus === "validated" || targetStatus === "published")) {
    return { allowed: false, status: "draft", errors: validation.errors };
  }
  return { allowed: true, status: targetStatus, errors: validation.errors };
}

