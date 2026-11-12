import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  evaluateTemplatePermission,
  templateRegistry,
} from "@nxtqr/architecture-execution";
import {
  jsonError,
  resolveAuthenticatedUser,
  resolveTemplateByIdOrSlug,
} from "../../_lib";

const CreateVersionSchema = z.object({
  nextVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  changelog: z.string().min(3).max(1000),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { userId, workspaceIds } = await resolveAuthenticatedUser(request);
  const template = resolveTemplateByIdOrSlug(id);
  if (!template) {
    return jsonError(`Template "${id}" not found.`, 404);
  }

  const perm = evaluateTemplatePermission({
    template,
    userId: userId ?? undefined,
    workspaceIds,
  });
  if (!perm.canView) {
    return jsonError("Access denied.", 403);
  }

  const versions = templateRegistry.listVersions(template.manifest.id);
  return NextResponse.json({
    templateId: template.manifest.id,
    versions: versions.map((v) => v.versionRecord),
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { userId, workspaceIds } = await resolveAuthenticatedUser(request);
  if (!userId) {
    return jsonError("Authentication required to create a new template version.", 401);
  }

  const template = resolveTemplateByIdOrSlug(id);
  if (!template) {
    return jsonError(`Template "${id}" not found.`, 404);
  }

  const perm = evaluateTemplatePermission({
    template,
    userId,
    workspaceIds,
  });
  if (!perm.canPublish) {
    return jsonError(
      "Cannot modify builtin templates directly; duplicate into a personal template first.",
      403
    );
  }

  const parsed = CreateVersionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("Invalid version draft payload.", 400, {
      issues: parsed.error.issues,
    });
  }

  try {
    const draft = templateRegistry.createNewVersionDraft({
      templateId: template.manifest.id,
      nextVersion: parsed.data.nextVersion,
      changelog: parsed.data.changelog,
      ownerId: userId,
    });
    return NextResponse.json({ version: draft.versionRecord, template: draft }, { status: 201 });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Failed to create template version.",
      400
    );
  }
}
