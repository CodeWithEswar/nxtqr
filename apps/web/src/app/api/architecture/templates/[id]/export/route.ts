import { NextResponse, type NextRequest } from "next/server";
import {
  evaluateTemplatePermission,
  exportTemplateToPayload,
} from "@nxtqr/architecture-execution";
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
  const version = request.nextUrl.searchParams.get("version") || undefined;
  const schemaParam = Number(request.nextUrl.searchParams.get("schemaVersion") || 1);
  const schemaVersion = schemaParam === 2 ? 2 : 1;

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
  if (!perm.canExport) {
    return jsonError("Access denied.", 403);
  }

  const payload = exportTemplateToPayload(template, schemaVersion);
  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": `attachment; filename="${template.manifest.slug}-v${template.versionRecord.version}.json"`,
    },
  });
}
