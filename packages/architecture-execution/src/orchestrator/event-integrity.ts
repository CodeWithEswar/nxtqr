import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type { ExecutionTrace } from "../domain/execution-trace";
import type { CausalIntegrityIssue, EventIntegrityReport } from "./orchestrator-schemas";

/**
 * Verifies deterministic causal & temporal integrity of an ExecutionTrace.
 * Reports structured diagnostics without crashing on corrupt or partial streams.
 */
export class EventIntegrityVerifier {
  public static verifyTrace(
    trace: ExecutionTrace | null | undefined,
    nodes: BaseNode[] = [],
    edges: BaseEdge[] = []
  ): EventIntegrityReport {
    const issues: CausalIntegrityIssue[] = [];

    if (!trace || !Array.isArray(trace.events) || trace.events.length === 0) {
      issues.push({
        code: "EMPTY_TRACE",
        severity: "error",
        message: "Execution trace has zero events.",
      });
      return {
        valid: false,
        checkedEvents: 0,
        checkedSpans: trace?.spans?.length || 0,
        checkedFrames: trace?.frames?.length || 0,
        issues,
      };
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edgeIds = new Set(edges.map((e) => e.id));

    let prevSeq = -1;
    let prevAtMs = -1;

    for (const evt of trace.events) {
      if (evt.sequence <= prevSeq) {
        issues.push({
          code: "NON_MONOTONIC_SEQUENCE",
          severity: "error",
          message: `Event "${evt.id}" sequence ${evt.sequence} is not strictly greater than previous sequence ${prevSeq}.`,
          eventSequence: evt.sequence,
          eventId: evt.id,
        });
      }
      prevSeq = evt.sequence;

      if (evt.atMs < prevAtMs) {
        issues.push({
          code: "NON_MONOTONIC_TIMESTAMP",
          severity: "error",
          message: `Event "${evt.id}" virtual timestamp ${evt.atMs}ms decreased below ${prevAtMs}ms.`,
          eventSequence: evt.sequence,
          eventId: evt.id,
        });
      }
      prevAtMs = evt.atMs;

      if (nodeIds.size > 0) {
        const rec = evt as unknown as Record<string, unknown>;
        const candidateNodeIds = [
          rec.nodeId,
          rec.sourceNodeId,
          rec.targetNodeId,
          rec.fromNodeId,
          rec.toNodeId,
        ].filter((v): v is string => typeof v === "string" && v.length > 0 && !v.startsWith("virtual_"));

        for (const nid of candidateNodeIds) {
          if (!nodeIds.has(nid)) {
            issues.push({
              code: "UNKNOWN_NODE_REFERENCE",
              severity: "warning",
              message: `Event "${evt.id}" references node "${nid}" absent from snapshot.`,
              eventSequence: evt.sequence,
              eventId: evt.id,
            });
          }
        }
      }

      if (edgeIds.size > 0) {
        const rec = evt as unknown as Record<string, unknown>;
        if (
          typeof rec.edgeId === "string" &&
          rec.edgeId.length > 0 &&
          !rec.edgeId.startsWith("edge_virtual_") &&
          !edgeIds.has(rec.edgeId)
        ) {
          issues.push({
            code: "UNKNOWN_EDGE_REFERENCE",
            severity: "warning",
            message: `Event "${evt.id}" references edge "${rec.edgeId}" absent from snapshot.`,
            eventSequence: evt.sequence,
            eventId: evt.id,
          });
        }
      }
    }

    const spans = trace.spans || [];
    const spanIdSet = new Set(spans.map((s) => s.spanId));
    for (const span of spans) {
      if (span.parentSpanId && !spanIdSet.has(span.parentSpanId) && !span.parentSpanId.startsWith("span_root")) {
        issues.push({
          code: "ORPHAN_SPAN_PARENT",
          severity: "warning",
          message: `Trace span "${span.spanId}" references missing parentSpanId "${span.parentSpanId}".`,
        });
      }
    }

    const frames = trace.frames || [];
    if (frames.length > 0 && frames.length !== trace.events.length) {
      issues.push({
        code: "FRAME_COUNT_MISMATCH",
        severity: "warning",
        message: `Trace frames count (${frames.length}) differs from events count (${trace.events.length}).`,
      });
    }

    const hasError = issues.some((i) => i.severity === "error");
    return {
      valid: !hasError,
      checkedEvents: trace.events.length,
      checkedSpans: spans.length,
      checkedFrames: frames.length,
      issues,
    };
  }
}

