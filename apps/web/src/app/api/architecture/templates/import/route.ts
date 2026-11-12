import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  TEMPLATE_IMPORT_LIMITS,
  importTemplateFromJson,
  previewTemplateImportJson,
  templateRegistry,
} from "@nxtqr/architecture-execution";
import { assertPayloadSize, PayloadTooLargeError } from "@nxtqr/security";
import { jsonError, resolveAuthenticatedUser } from "../_lib";

const ImportRequestSchema = z.object({
  rawJson: z.string().min(2),
  mode: z.enum(["preview", "import"]).default("preview"),
  idempotencyKey: z.string().max(128).optional(),
});

export async function POST(request: NextRequest) {
  const { userId } = await resolveAuthenticatedUser(request);
  try {
    const raw = await request.text();
    assertPayloadSize(raw, TEMPLATE_IMPORT_LIMITS.maxFileBytes + 8192);
    const parsed = ImportRequestSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return jsonError("Invalid import request body.", 400, {
        issues: parsed.error.issues,
      });
    }

    if (parsed.data.mode === "preview") {
      const preview = previewTemplateImportJson(parsed.data.rawJson);
      return NextResponse.json({ preview }, { status: preview.valid ? 200 : 422 });
    }

    if (!userId) {
      return jsonError("Authentication required to import templates.", 401);
    }

    const result = importTemplateFromJson({
      rawJson: parsed.data.rawJson,
      ownerId: userId,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    if (!result.accepted || !result.template) {
      return NextResponse.json({ result }, { status: 422 });
    }

    templateRegistry.register(result.template);
    return NextResponse.json({ result }, { status: 201 });
  } catch (err) {
    if (err instanceof PayloadTooLargeError) {
      return jsonError(err.message, 413);
    }
    return jsonError(
      err instanceof Error ? err.message : "Failed to process template import.",
      400
    );
  }
}
