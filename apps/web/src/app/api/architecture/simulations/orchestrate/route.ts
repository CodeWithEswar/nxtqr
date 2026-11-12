import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { BaseEdgeSchema, BaseNodeSchema } from "@nxtqr/graph-schema";
import { assertPayloadSize, PayloadTooLargeError } from "@nxtqr/security";
import {
  CapabilityRegistry,
  CrossModuleExecutionPipeline,
  SimulationOrchestrator,
  SimulationRunConfigSchema,
} from "@nxtqr/architecture-execution";
import { jsonError, resolveAuthenticatedUser } from "../../templates/_lib";

const MAX_ORCHESTRATION_BODY_BYTES = 512 * 1024; // 512 KB guard

const OrchestrateRequestSchema = z.object({
  mode: z.enum(["inspect", "run", "pipeline"]).default("pipeline"),
  nodes: z.array(BaseNodeSchema).max(1000),
  edges: z.array(BaseEdgeSchema).max(4000).default([]),
  config: SimulationRunConfigSchema.partial().optional(),
});

/**
 * POST /api/architecture/simulations/orchestrate
 * Hardened Phase 05.4.25 unified simulation API endpoint:
 * - Authentication required
 * - Payload size guard (512 KB)
 * - Strict Zod validation on nodes, edges & run config
 * - Isolated per-request orchestrator instance (zero shared mutable state across requests)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthenticatedUser(request);
    if (!auth.userId) {
      return jsonError("Authentication required to orchestrate architecture simulations.", 401);
    }

    const rawBody = await request.text();
    assertPayloadSize(rawBody, MAX_ORCHESTRATION_BODY_BYTES, "Simulation orchestration request");

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return jsonError("Malformed JSON payload.", 400);
    }

    const validated = OrchestrateRequestSchema.safeParse(parsedJson);
    if (!validated.success) {
      return jsonError("Invalid simulation orchestration payload.", 400, {
        details: validated.error.flatten(),
      });
    }

    const { mode, nodes, edges, config } = validated.data;

    if (mode === "inspect") {
      const inspection = CapabilityRegistry.inspectTopology(nodes, edges);
      return NextResponse.json({ mode, inspection }, { status: 200 });
    }

    if (mode === "pipeline") {
      const parsedConfig = SimulationRunConfigSchema.parse(config || {});
      const result = CrossModuleExecutionPipeline.execute({
        nodes,
        edges,
        config: parsedConfig,
      });
      return NextResponse.json(
        {
          mode,
          runId: result.runId,
          correlationId: result.correlationId,
          outcome: result.outcome,
          shortCircuitedAtLayer: result.shortCircuitedAtLayer,
          terminalStatusCode: result.terminalStatusCode,
          requestedRps: result.requestedRps,
          deliveredRps: result.deliveredRps,
          bottleneckNodeId: result.bottleneckNodeId,
          bottleneckEffectiveRps: result.bottleneckEffectiveRps,
          hops: result.hops,
          findings: result.findings,
          metrics: result.metrics,
          integrity: result.integrity,
        },
        { status: 200 }
      );
    }

    const isolatedOrchestrator = new SimulationOrchestrator();
    const run = isolatedOrchestrator.createRun(nodes, edges, config || {});
    const executed = isolatedOrchestrator.executeRun(run.runId);
    const fingerprint = isolatedOrchestrator.computeRunFingerprint(run.runId);
    isolatedOrchestrator.disposeRun(run.runId);

    return NextResponse.json(
      {
        mode,
        runId: executed.runId,
        state: executed.state,
        fingerprint,
        virtualTimeMs: executed.virtualTimeMs,
        checkpointCount: executed.checkpoints.length,
        findings: executed.findings,
        metrics: executed.metrics,
        integrity: executed.integrity,
        capabilityInspection: executed.capabilityInspection,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return jsonError(error.message, 413);
    }
    const message = error instanceof Error ? error.message : "Orchestration failed.";
    return jsonError(message, 500);
  }
}

