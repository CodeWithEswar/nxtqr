import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  instantiationToGraphDocument,
  templateRegistry,
} from "@nxtqr/architecture-execution";
import {
  jsonError,
  resolveAuthenticatedUser,
  resolveTemplateByIdOrSlug,
} from "../../_lib";

const InstantiateBodySchema = z.object({
  targetProjectId: z.string().min(1).max(128),
  version: z.string().optional(),
  title: z.string().max(160).optional(),
  idempotencyKey: z.string().max(128).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { userId } = await resolveAuthenticatedUser(request);
  const template = resolveTemplateByIdOrSlug(id);
  if (!template) {
    return jsonError(`Template "${id}" not found.`, 404);
  }

  if (template.manifest.visibility !== "system" && !userId) {
    return jsonError("Authentication required to instantiate non-system templates.", 401);
  }

  const parsed = InstantiateBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("Invalid instantiation payload.", 400, {
      issues: parsed.error.issues,
    });
  }

  try {
    const instantiation = templateRegistry.instantiate({
      templateId: template.manifest.id,
      version: parsed.data.version,
      userId: userId || "anonymous-studio-user",
      targetProjectId: parsed.data.targetProjectId,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    const document = instantiationToGraphDocument(
      instantiation,
      parsed.data.title
    );
    return NextResponse.json({ instantiation, document }, { status: 201 });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Failed to instantiate template.",
      400
    );
  }
}
