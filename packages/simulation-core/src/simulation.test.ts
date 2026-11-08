import { describe, it, expect } from "vitest";
import { DeterministicSimulationEngine } from "./engine";
import type { GraphDocument } from "@nxtqr/graph-schema";

describe("DeterministicSimulationEngine", () => {
  const fixtureDoc: GraphDocument = {
    id: "test_doc",
    schemaVersion: 1,
    visualizerType: "system-design",
    title: "Test Pipeline",
    nodes: [
      { id: "node_1", type: "input", position: { x: 0, y: 0 }, status: "idle", data: {} },
      { id: "node_2", type: "process", position: { x: 100, y: 0 }, status: "idle", data: {} },
      { id: "node_3", type: "output", position: { x: 200, y: 0 }, status: "idle", data: {} },
    ],
    edges: [
      { id: "e1", source: "node_1", target: "node_2", type: "bezier", status: "idle", data: {} },
      { id: "e2", source: "node_2", target: "node_3", type: "bezier", status: "idle", data: {} },
    ],
    viewport: { x: 0, y: 0, zoom: 1.0 },
    metadata: {},
  };

  it("initializes with entrypoint nodes in queue and idle status", async () => {
    const engine = new DeterministicSimulationEngine();
    await engine.initialize(fixtureDoc);
    expect(engine.getStatus()).toBe("idle");
    expect(engine.getEvents()).toHaveLength(0);
  });

  it("advances step by step through topological dependencies", async () => {
    const engine = new DeterministicSimulationEngine();
    await engine.initialize(fixtureDoc);

    const step1 = await engine.step();
    expect(step1).not.toBeNull();
    expect(step1?.targetNodeId).toBe("node_1");
    expect(step1?.step).toBe(1);

    const step2 = await engine.step();
    expect(step2).not.toBeNull();
    expect(step2?.targetNodeId).toBe("node_2");
    expect(step2?.step).toBe(2);

    const step3 = await engine.step();
    expect(step3).not.toBeNull();
    expect(step3?.targetNodeId).toBe("node_3");
    expect(step3?.step).toBe(3);

    // Queue empty
    const step4 = await engine.step();
    expect(step4).toBeNull();
  });

  it("resets execution state cleanly", async () => {
    const engine = new DeterministicSimulationEngine();
    await engine.initialize(fixtureDoc);
    await engine.step();
    expect(engine.getEvents()).toHaveLength(1);

    engine.reset();
    expect(engine.getStatus()).toBe("idle");
    expect(engine.getEvents()).toHaveLength(0);
  });
});

