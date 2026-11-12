import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { templateRegistry } from "@nxtqr/architecture-execution";
import {
  jsonError,
  resolveAuthenticatedUser,
  resolveTemplateByIdOrSlug,
} from "../../_lib";

const DuplicateBodySchema = z.object({
  newId: z.string().min(3).max(96),
  newSlug: z
    .string()
    .min(3)
    .max(96)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(160).optional(),
  visibility: z.enum(["private", "workspace"]).optional(),
  workspaceId: z.string().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { userId, workspaceIds } = await resolveAuthenticatedUser(request);
  if (!userId) {
    return jsonError("Authentication required to duplicate templates.", 401);
  }

  const source = resolveTemplateByIdOrSlug(id);
  if (!source) {
    return jsonError(`Template "${id}" not found.`, 404);
  }

  const parsed = DuplicateBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("Invalid duplication payload.", 400, {
      issues: parsed.error.issues,
    });
  }

  if (
    parsed.data.visibility === "workspace" &&
    parsed.data.workspaceId &&
    !workspaceIds.includes(parsed.data.workspaceId)
  ) {
    return jsonError("Not a member of the target workspace.", 403);
  }

  try {
    const duplicated = templateRegistry.duplicateAsPersonalTemplate({
      sourceTemplateId: source.manifest.id,
      userId,
      newId: parsed.data.newId,
      newSlug: parsed.data.newSlug,
      title: parsed.data.title,
      visibility: parsed.data.visibility ?? "private",
      workspaceId: parsed.data.workspaceId ?? null,
    });
    return NextResponse.json({ template: duplicated }, { status: 201 });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Failed to duplicate template.",
      400
    );
  }
}

