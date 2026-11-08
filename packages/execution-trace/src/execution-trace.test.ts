import { describe, it, expect } from "vitest";
import { filterTraceEvents, formatRelativeTimestamp } from "./selectors";
import type { SimulationEvent } from "@nxtqr/simulation-core";

describe("ExecutionTrace Selectors", () => {
  const events: SimulationEvent[] = [
    {
      id: "evt_1",
      step: 1,
      timestamp: 0,
      type: "INGRESS_RECEIVED",
      targetNodeId: "node_ingress",
      payload: { label: "Gateway Ingress", status: "success" },
    },
    {
      id: "evt_2",
      step: 2,
      timestamp: 45.6,
      type: "LAMBDA_EXECUTE",
      targetNodeId: "node_worker",
      payload: { label: "Worker Compute", status: "success" },
    },
    {
      id: "evt_3",
      step: 3,
      timestamp: 1200.5,
      type: "DATABASE_TIMEOUT",
      targetNodeId: "node_db",
      payload: { label: "Postgres Storage", status: "failure" },
    },
  ];

  it("formats relative timestamps in ms or seconds", () => {
    expect(formatRelativeTimestamp(0)).toBe("+0.0ms");
    expect(formatRelativeTimestamp(45.6)).toBe("+45.6ms");
    expect(formatRelativeTimestamp(1250)).toBe("+1.25s");
  });

  it("filters events by keyword", () => {
    const filtered = filterTraceEvents(events, { searchQuery: "Lambda" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("evt_2");
  });

  it("filters events by status", () => {
    const successEvents = filterTraceEvents(events, { status: "success" });
    expect(successEvents).toHaveLength(2);

    const failEvents = filterTraceEvents(events, { status: "failure" });
    expect(failEvents).toHaveLength(1);
    expect(failEvents[0].id).toBe("evt_3");
  });

  it("filters events by node ID", () => {
    const nodeEvents = filterTraceEvents(events, { nodeId: "node_db" });
    expect(nodeEvents).toHaveLength(1);
    expect(nodeEvents[0].targetNodeId).toBe("node_db");
  });
});

