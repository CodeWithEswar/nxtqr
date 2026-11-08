import { describe, it, expect, beforeEach } from "vitest";
import { nodeRegistry } from "./registry";

describe("NodeRegistry", () => {
  beforeEach(() => {
    nodeRegistry.resetToDefaults();
  });

  it("loads standard node archetypes by default", () => {
    const list = nodeRegistry.listForVisualizer("system-design");
    expect(list.length).toBeGreaterThanOrEqual(7);

    const inputNode = nodeRegistry.get("system-design", "input");
    expect(inputNode).toBeDefined();
    expect(inputNode?.label).toContain("Ingress");
  });

  it("retrieves specific node definitions by visualizer and type", () => {
    const dbNode = nodeRegistry.get("system-design", "database");
    expect(dbNode).toBeDefined();
    expect(dbNode?.category).toBe("Persistence");
    expect(dbNode?.ports).toHaveLength(2);
  });

  it("prevents duplicate registration of the same type", () => {
    expect(() => {
      nodeRegistry.register({
        type: "input",
        visualizerType: "system-design",
        label: "Duplicate",
        category: "Test",
        description: "Test",
        defaultData: {},
        ports: [],
      });
    }).toThrow();
  });
});

