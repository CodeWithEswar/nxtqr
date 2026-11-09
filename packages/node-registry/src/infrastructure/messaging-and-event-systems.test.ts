import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID,
  ALL_MESSAGING_AND_EVENT_SYSTEMS_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.7 — Infrastructure Component Registry (Messaging & Event Systems)", () => {
  it("registers the canonical Messaging & Event Systems category", () => {
    const cat = infrastructureRegistry.getCategory(MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Messaging & Event Systems");
    expect(cat?.order).toBe(7);
  });

  it("registers exactly 14 production Messaging & Event Systems components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID
    );
    expect(components).toHaveLength(14);
    expect(ALL_MESSAGING_AND_EVENT_SYSTEMS_DEFINITIONS).toHaveLength(14);
  });

  it("ensures all 14 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_MESSAGING_AND_EVENT_SYSTEMS_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_MESSAGING_AND_EVENT_SYSTEMS_DEFINITIONS) {
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

  it("rejects invalid configurations with informative error messages", () => {
    // 1. Invalid Message Queue config (visibility timeout too low / negative throughput)
    const badQueueConfig = {
      label: "Test Queue",
      queueType: "invalid-type",
      visibilityTimeoutSeconds: 0, // min is 1
      assumedThroughputMsgSec: -100,
    };
    const queueValidation = infrastructureRegistry.validateConfiguration(
      "message-queue",
      badQueueConfig
    );
    expect(queueValidation.success).toBe(false);
    expect(queueValidation.errors && queueValidation.errors.length).toBeGreaterThan(0);

    // 2. Invalid Kafka Broker config (brokerId negative, minInsyncReplicas 0)
    const badKafkaConfig = {
      label: "Bad Kafka",
      brokerId: -5,
      minInsyncReplicas: 0,
    };
    const kafkaValidation = infrastructureRegistry.validateConfiguration(
      "kafka-broker",
      badKafkaConfig
    );
    expect(kafkaValidation.success).toBe(false);

    // 3. Invalid Event Stream config (partitionCount 0)
    const badStreamConfig = {
      label: "Bad Stream",
      partitionCount: 0,
    };
    const streamValidation = infrastructureRegistry.validateConfiguration(
      "event-stream",
      badStreamConfig
    );
    expect(streamValidation.success).toBe(false);
  });

  it("verifies that all ports have unique IDs, valid types, dataTypes, and positive capacity", () => {
    for (const comp of ALL_MESSAGING_AND_EVENT_SYSTEMS_DEFINITIONS) {
      expect(comp.ports.length).toBeGreaterThanOrEqual(3);
      const portIds = new Set<string>();

      for (const port of comp.ports) {
        expect(portIds.has(port.id), `Duplicate port ID "${port.id}" on "${comp.id}"`).toBe(
          false
        );
        portIds.add(port.id);

        expect(port.name).toBeTruthy();
        expect(["input", "output", "bidirectional"]).toContain(port.type);
        expect(port.dataType).toBeTruthy();
        expect(port.capacity).toBeGreaterThan(0);
      }
    }
  });

  it("verifies that all inspector sections have valid fields mapping to default config paths", () => {
    for (const comp of ALL_MESSAGING_AND_EVENT_SYSTEMS_DEFINITIONS) {
      expect(comp.inspector.length).toBeGreaterThan(0);

      for (const section of comp.inspector) {
        expect(section.id).toBeTruthy();
        expect(section.title).toBeTruthy();
        expect(section.fields.length).toBeGreaterThan(0);

        for (const field of section.fields) {
          expect(field.path).toBeTruthy();
          expect(field.label).toBeTruthy();
          expect(["text", "number", "boolean", "select"]).toContain(field.type);

          if (field.type === "select") {
            expect(field.options).toBeDefined();
            expect(field.options?.length).toBeGreaterThan(0);
          }

          // Verify path exists in defaultConfig
          expect(
            (comp.defaultConfig as any)[field.path],
            `Inspector field "${field.path}" must exist in defaultConfig of "${comp.id}"`
          ).toBeDefined();
        }
      }
    }
  });

  it("creates valid BaseNodes compliant with BaseNodeSchema using createInfrastructureNode", () => {
    ALL_MESSAGING_AND_EVENT_SYSTEMS_DEFINITIONS.forEach((comp, idx) => {
      const node = infrastructureRegistry.createInfrastructureNode(comp.id, {
        position: { x: 100 + idx * 50, y: 150 + idx * 30 },
      });

      expect(node.id).toMatch(new RegExp(`^infra_${comp.id}_`));
      expect(node.type).toBe(comp.id);
      expect(node.data.isInfrastructure).toBe(true);
      expect(node.data.categoryId).toBe(MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID);
      expect(node.data.componentType).toBe(comp.id);
      expect(node.ports).toEqual(comp.ports);

      const parsed = BaseNodeSchema.safeParse(node);
      expect(
        parsed.success,
        `Node for "${comp.id}" failed BaseNodeSchema validation: ${
          !parsed.success ? JSON.stringify(parsed.error) : ""
        }`
      ).toBe(true);
    });
  });
});
