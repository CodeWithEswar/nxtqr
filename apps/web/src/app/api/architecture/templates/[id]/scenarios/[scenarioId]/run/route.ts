import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  TemplateExecutionEngine,
  evaluateTemplatePermission,
} from "@nxtqr/architecture-execution";
import {
  jsonError,
  resolveAuthenticatedUser,
  resolveTemplateByIdOrSlug,
} from "../../../../_lib";

const RunScenarioSchema = z.object({
  seed: z.number().int().min(0).max(999999).optional(),
  walkthroughId: z.string().optional(),
  walkthroughStepIndex: z.number().int().min(0).optional(),
  variantComponentOverrides: z
    .array(
      z.object({
        componentId: z.string().min(1),
        replicas: z.number().int().min(1).max(500).optional(),
        capacityPerReplicaRps: z.number().positive().max(1_000_000).optional(),
        cacheHitRatio: z.number().min(0).max(0.99).optional(),
      })
    )
    .optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; scenarioId: string }> }
) {
  const { id, scenarioId } = await context.params;
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

  const rawBody = await request.json().catch(() => ({}));
  const parsed = RunScenarioSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError("Invalid scenario execution request.", 400, {
      issues: parsed.error.issues,
    });
  }

  const result = TemplateExecutionEngine.runScenario(
    {
      id: `api_run_${template.manifest.id}_${scenarioId}`,
      templateId: template.manifest.id,
      templateVersion: template.versionRecord.version,
      scenarioId,
      walkthroughId: parsed.data.walkthroughId,
      walkthroughStepIndex: parsed.data.walkthroughStepIndex,
      seed: parsed.data.seed,
      variantComponentOverrides: parsed.data.variantComponentOverrides,
      userId: userId ?? undefined,
    },
    template
  );

  return NextResponse.json({
    trace: result.trace,
    scenarioResult: result.state.scenarioResult,
    validation: result.state.validation,
    comparisonWithBaseline: result.state.comparisonWithBaseline,
    invariants: result.state.invariants,
  });
}
