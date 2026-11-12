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
} from "../_lib";

const PatchTemplateSchema = z.object({
  action: z.enum(["publish", "deprecate"]),
  deprecationReason: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const version = request.nextUrl.searchParams.get("version") || undefined;
  const { userId, workspaceIds } = await resolveAuthenticatedUser(request);

  const template = resolveTemplateByIdOrSlug(id, version);
  if (!template) {
    return jsonError(`Template "${id}" not found.`, 404);
  }

  const perm = evaluateTemplatePermission({
    template,
    userId: userId ?? undefined,
    workspaceIds,
  });
  if (!perm.canView) {
    return jsonError("Access denied for private or workspace-scoped template.", 403);
  }

  templateRegistry.recordUsage(template.manifest.id, "opensCount");
  const validation = templateRegistry.validateById(template.manifest.id);
  const versions = templateRegistry
    .listVersions(template.manifest.id)
    .map((v) => v.versionRecord);

  return NextResponse.json({
    template,
    permission: perm,
    validation,
    versions,
    usage: templateRegistry.getUsageMetrics(template.manifest.id),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { userId, workspaceIds } = await resolveAuthenticatedUser(request);
  if (!userId) {
    return jsonError("Authentication required.", 401);
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
      "System or non-owned templates cannot be mutated directly.",
      403
    );
  }

  const parsed = PatchTemplateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("Invalid lifecycle update payload.", 400);
  }

  try {
    const updated =
      parsed.data.action === "publish"
        ? templateRegistry.publishTemplate(template.manifest.id)
        : templateRegistry.deprecateTemplate(
            template.manifest.id,
            parsed.data.deprecationReason || "Deprecated by template owner."
          );
    return NextResponse.json({ template: updated });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Failed lifecycle transition.",
      400
    );
  }
}
