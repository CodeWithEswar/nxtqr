import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  MEDIA_AND_REAL_TIME_COMMUNICATION_CATEGORY_ID,
  ALL_MEDIA_AND_REAL_TIME_COMMUNICATION_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.14 — Infrastructure Component Registry (Media & Real-Time Communication)", () => {
  it("registers the canonical Media & Real-Time Communication category", () => {
    const cat = infrastructureRegistry.getCategory(MEDIA_AND_REAL_TIME_COMMUNICATION_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Media & Real-Time Communication");
    expect(cat?.order).toBe(14);
  });

  it("registers exactly 10 production Media & Real-Time Communication components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      MEDIA_AND_REAL_TIME_COMMUNICATION_CATEGORY_ID
    );
    expect(components).toHaveLength(10);
    expect(ALL_MEDIA_AND_REAL_TIME_COMMUNICATION_DEFINITIONS).toHaveLength(10);
  });

  it("ensures all 10 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_MEDIA_AND_REAL_TIME_COMMUNICATION_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(MEDIA_AND_REAL_TIME_COMMUNICATION_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_MEDIA_AND_REAL_TIME_COMMUNICATION_DEFINITIONS) {
      const parsed = comp.configSchema.safeParse(comp.defaultConfig);
      expect(
        parsed.success,
        `defaultConfig for "${comp.id}" failed schema validation: ${
          !parsed.success ? JSON.stringify(parsed.error) : ""
        }`
      ).toBe(true);

      const valResult = infrastructureRegistry.validateConfiguration(
        comp.id,
        comp.defaultConfig
      );
      expect(
        valResult.success,
        `validateConfiguration for "${comp.id}" failed: ${valResult.errors?.join(", ")}`
      ).toBe(true);
      expect(valResult.errors).toBeUndefined();
    }
  });

  it("ensures all components have valid typed input and output ports with positive capacity", () => {
    for (const comp of ALL_MEDIA_AND_REAL_TIME_COMMUNICATION_DEFINITIONS) {
      expect(comp.ports.length).toBeGreaterThanOrEqual(2);
      for (const port of comp.ports) {
        expect(["input", "output"]).toContain(port.type);
        expect(port.id).toBeTruthy();
        expect(port.name).toBeTruthy();
        expect(port.dataType).toBeTruthy();
        expect(port.capacity).toBeGreaterThan(0);
      }
    }
  });

  it("creates fully-typed BaseNode instances via createInfrastructureNode", () => {
    for (const comp of ALL_MEDIA_AND_REAL_TIME_COMMUNICATION_DEFINITIONS) {
      const node = infrastructureRegistry.createInfrastructureNode(comp.id, {
        position: { x: 300, y: 400 },
        label: `Test ${comp.display.name}`,
        environment: "production",
      });

      expect(node.id).toContain(comp.id);
      expect(node.type).toBe(comp.id);
      expect(node.position).toEqual({ x: 300, y: 400 });
      expect(node.status).toBe("idle");
      expect(node.data.label).toBe(`Test ${comp.display.name}`);
      expect(node.data.componentType).toBe(comp.id);
      expect(node.data.environment).toBe("production");

      const schemaResult = BaseNodeSchema.safeParse(node);
      expect(
        schemaResult.success,
        `BaseNode validation failed for "${comp.id}": ${
          !schemaResult.success ? JSON.stringify(schemaResult.error) : ""
        }`
      ).toBe(true);
    }
  });

  it("rejects invalid configurations with informative error messages", () => {
    const invalidWs = infrastructureRegistry.validateConfiguration("websocket-server", {
      ...ALL_MEDIA_AND_REAL_TIME_COMMUNICATION_DEFINITIONS[0].defaultConfig,
      heartbeatIntervalSeconds: -10, // Invalid: min 1
    });
    expect(invalidWs.success).toBe(false);
    expect(invalidWs.errors).toBeDefined();

    const invalidTranscoder = infrastructureRegistry.validateConfiguration("video-transcoder", {
      ...ALL_MEDIA_AND_REAL_TIME_COMMUNICATION_DEFINITIONS[3].defaultConfig,
      chunkDurationSeconds: 100, // Invalid: max 30
    });
    expect(invalidTranscoder.success).toBe(false);
    expect(invalidTranscoder.errors).toBeDefined();
  });
});

