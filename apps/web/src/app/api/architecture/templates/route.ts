import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  TemplateCategoryIdSchema,
  TemplateDifficultySchema,
  templateRegistry,
  type ArchitectureTemplate,
} from "@nxtqr/architecture-execution";
import { assertPayloadSize, PayloadTooLargeError } from "@nxtqr/security";
import { jsonError, resolveAuthenticatedUser } from "./_lib";

const CreateTemplateBodySchema = z.object({
  template: z.record(z.unknown()),
  publish: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const { userId, workspaceIds } = await resolveAuthenticatedUser(request);
  const sp = request.nextUrl.searchParams;

  const rawCategory = sp.get("categoryId") || "all";
  const categoryParsed =
    rawCategory === "all"
      ? ("all" as const)
      : TemplateCategoryIdSchema.safeParse(rawCategory).success
        ? (rawCategory as z.infer<typeof TemplateCategoryIdSchema>)
        : ("all" as const);

  const rawDiff = sp.get("difficulty") || "all";
  const difficultyParsed =
    rawDiff === "all"
      ? ("all" as const)
      : TemplateDifficultySchema.safeParse(rawDiff).success
        ? (rawDiff as z.infer<typeof TemplateDifficultySchema>)
        : ("all" as const);

  const maxLearningMinutesParam = sp.get("maxLearningMinutes");
  const maxLearningMinutes = maxLearningMinutesParam
    ? Number(maxLearningMinutesParam)
    : undefined;

  const ownership = (sp.get("ownership") || "all") as
    | "all"
    | "system"
    | "personal"
    | "workspace";
  const sortBy = (sp.get("sortBy") || "recommended") as
    | "recommended"
    | "recent"
    | "alphabetical"
    | "difficulty"
    | "duration";

  const result = templateRegistry.search({
    query: sp.get("query") || undefined,
    categoryId: categoryParsed,
    difficulty: difficultyParsed,
    patternConcept: sp.get("patternConcept") || undefined,
    componentType: sp.get("componentType") || undefined,
    simulationCapability: sp.get("simulationCapability") || undefined,
    maxLearningMinutes:
      typeof maxLearningMinutes === "number" && Number.isFinite(maxLearningMinutes)
        ? maxLearningMinutes
        : undefined,
    ownership,
    sortBy,
    offset: Math.max(0, Number(sp.get("offset") || 0) || 0),
    limit: Math.min(200, Math.max(1, Number(sp.get("limit") || 50) || 50)),
    userId: userId ?? undefined,
    workspaceIds,
  });

  return NextResponse.json({
    ...result,
    categories: templateRegistry.getCategories(),
    learningPaths: templateRegistry.getLearningPaths(),
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await resolveAuthenticatedUser(request);
  if (!userId) {
    return jsonError("Authentication required to create a custom template.", 401);
  }

  try {
    const raw = await request.text();
    assertPayloadSize(raw, 512 * 1024);
    const parsed = CreateTemplateBodySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return jsonError("Invalid template creation payload.", 400, {
        issues: parsed.error.issues,
      });
    }

    const candidate = parsed.data.template as unknown as ArchitectureTemplate;
    if (candidate.source === "builtin" || candidate.manifest?.visibility === "system") {
      return jsonError("Cannot create or override builtin system templates.", 403);
    }

    candidate.ownerId = userId;
    const validation = templateRegistry.register(candidate);
    if (!validation.valid) {
      return jsonError("Template failed quality validation gates.", 422, {
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const saved = parsed.data.publish
      ? templateRegistry.publishTemplate(candidate.manifest.id)
      : templateRegistry.getById(candidate.manifest.id)!;

    return NextResponse.json({ template: saved, validation }, { status: 201 });
  } catch (err) {
    if (err instanceof PayloadTooLargeError) {
      return jsonError(err.message, 413);
    }
    return jsonError(
      err instanceof Error ? err.message : "Failed to save template.",
      400
    );
  }
}
