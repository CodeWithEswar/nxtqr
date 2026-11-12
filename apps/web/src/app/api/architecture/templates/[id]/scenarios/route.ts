import { NextResponse, type NextRequest } from "next/server";
import { evaluateTemplatePermission } from "@nxtqr/architecture-execution";
import {
  jsonError,
  resolveAuthenticatedUser,
  resolveTemplateByIdOrSlug,
} from "../../_lib";

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

  return NextResponse.json({
    templateId: template.manifest.id,
    scenarios: template.scenarios,
  });
}
