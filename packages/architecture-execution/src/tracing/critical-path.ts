import type { TraceSpan } from "../schemas/distributed.schemas";

export class CriticalPathAnalyzer {
  /**
   * Calculates the critical path (longest causally dependent sequence of operations in virtual time).
   * Spans on parallel branches that complete sooner do not dictate the overall duration.
   * Returns array of span IDs forming the critical path.
   */
  public static calculateCriticalPath(spans: TraceSpan[]): string[] {
    if (!spans || spans.length === 0) return [];

    const spanMap = new Map<string, TraceSpan>(spans.map((s) => [s.spanId, s]));
    const childrenMap = new Map<string, string[]>();

    for (const span of spans) {
      if (span.parentSpanId && spanMap.has(span.parentSpanId)) {
        if (!childrenMap.has(span.parentSpanId)) {
          childrenMap.set(span.parentSpanId, []);
        }
        childrenMap.get(span.parentSpanId)!.push(span.spanId);
      }
    }

    // Identify root spans
    const rootSpans = spans.filter((s) => !s.parentSpanId || !spanMap.has(s.parentSpanId));
    if (rootSpans.length === 0) return [spans[0].spanId];

    // DFS with memoization to find path with max endMs
    const memo = new Map<string, { maxDuration: number; path: string[] }>();

    const getLongestPath = (spanId: string): { maxDuration: number; path: string[] } => {
      if (memo.has(spanId)) return memo.get(spanId)!;

      const span = spanMap.get(spanId)!;
      const selfDuration = (span.endMs !== undefined ? span.endMs : span.startMs) - span.startMs;
      const children = childrenMap.get(spanId) || [];

      if (children.length === 0) {
        const res = { maxDuration: selfDuration, path: [spanId] };
        memo.set(spanId, res);
        return res;
      }

      let bestChildPath: string[] = [];
      let bestChildDuration = 0;

      for (const childId of children) {
        const childRes = getLongestPath(childId);
        if (childRes.maxDuration > bestChildDuration) {
          bestChildDuration = childRes.maxDuration;
          bestChildPath = childRes.path;
        }
      }

      const res = {
        maxDuration: selfDuration + bestChildDuration,
        path: [spanId, ...bestChildPath],
      };
      memo.set(spanId, res);
      return res;
    };

    let bestRootPath: string[] = [];
    let bestRootDuration = -1;

    for (const root of rootSpans) {
      const pathRes = getLongestPath(root.spanId);
      if (pathRes.maxDuration > bestRootDuration) {
        bestRootDuration = pathRes.maxDuration;
        bestRootPath = pathRes.path;
      }
    }

    return bestRootPath;
  }
}
