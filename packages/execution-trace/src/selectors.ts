import type { SimulationEvent } from "@nxtqr/simulation-core";

export interface TraceFilterOptions {
  searchQuery?: string;
  status?: "all" | "success" | "failure" | "pending";
  nodeId?: string;
}

export function filterTraceEvents(
  events: SimulationEvent[],
  options: TraceFilterOptions = {}
): SimulationEvent[] {
  const { searchQuery = "", status = "all", nodeId } = options;
  const q = searchQuery.toLowerCase().trim();

  return events.filter((evt) => {
    // Node filter
    if (nodeId && evt.targetNodeId !== nodeId && evt.sourceNodeId !== nodeId) {
      return false;
    }

    // Status filter
    const evtStatus = (evt.payload as any)?.status ?? "success";
    if (status !== "all" && evtStatus !== status) {
      return false;
    }

    // Search query filter
    if (q) {
      const label = (evt.payload as any)?.label ?? "";
      const type = evt.type ?? "";
      const target = evt.targetNodeId ?? "";
      const matches =
        label.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        target.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });
}

export function formatRelativeTimestamp(ms: number): string {
  if (ms < 1000) {
    return `+${ms.toFixed(1)}ms`;
  }
  return `+${(ms / 1000).toFixed(2)}s`;
}

