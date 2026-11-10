import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  STORAGE_AND_FILE_SYSTEMS_CATEGORY_ID,
  ALL_STORAGE_AND_FILE_SYSTEMS_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.8 — Infrastructure Component Registry (Storage & File Systems)", () => {
  it("registers the canonical Storage & File Systems category", () => {
    const cat = infrastructureRegistry.getCategory(STORAGE_AND_FILE_SYSTEMS_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Storage & File Systems");
    expect(cat?.order).toBe(8);
  });

  it("registers exactly 10 production Storage & File Systems components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      STORAGE_AND_FILE_SYSTEMS_CATEGORY_ID
    );
    expect(components).toHaveLength(10);
    expect(ALL_STORAGE_AND_FILE_SYSTEMS_DEFINITIONS).toHaveLength(10);
  });

  it("ensures all 10 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_STORAGE_AND_FILE_SYSTEMS_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(STORAGE_AND_FILE_SYSTEMS_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_STORAGE_AND_FILE_SYSTEMS_DEFINITIONS) {
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
    // 1. Invalid Block Storage config (capacityGb 0, negative provisioned IOPS)
    const badBlockConfig = {
      label: "Bad Block Volume",
      capacityGb: 0, // min is 1
      provisionedIops: -100, // min is 100
    };
    const blockValidation = infrastructureRegistry.validateConfiguration(
      "block-storage",
      badBlockConfig
    );
    expect(blockValidation.success).toBe(false);
    expect(blockValidation.errors && blockValidation.errors.length).toBeGreaterThan(0);

    // 2. Invalid Distributed File System config (nodeCount below 3)
    const badDfsConfig = {
      label: "Bad Cluster",
      nodeCount: 1, // min is 3
    };
    const dfsValidation = infrastructureRegistry.validateConfiguration(
      "distributed-file-system",
      badDfsConfig
    );
    expect(dfsValidation.success).toBe(false);

    // 3. Invalid Backup Storage config (negative retention)
    const badBackupConfig = {
      label: "Bad Backup",
      retentionDays: -5,
    };
    const backupValidation = infrastructureRegistry.validateConfiguration(
      "backup-storage",
      badBackupConfig
    );
    expect(backupValidation.success).toBe(false);
  });

  it("verifies that all ports have unique IDs, valid types, dataTypes, and positive capacity", () => {
    for (const comp of ALL_STORAGE_AND_FILE_SYSTEMS_DEFINITIONS) {
      expect(comp.ports.length).toBeGreaterThanOrEqual(2);
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
    for (const comp of ALL_STORAGE_AND_FILE_SYSTEMS_DEFINITIONS) {
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
    for (const comp of ALL_STORAGE_AND_FILE_SYSTEMS_DEFINITIONS) {
      const node = infrastructureRegistry.createInfrastructureNode(comp.id, {
        position: { x: 100, y: 200 },
        label: `Custom ${comp.display.name}`,
      });

      expect(node.id).toBeTruthy();
      expect(node.type).toBe(comp.id);
      expect(node.position).toEqual({ x: 100, y: 200 });
      expect(node.data.label).toBe(`Custom ${comp.display.name}`);
      expect(node.data.componentType).toBe(comp.id);
      expect(node.ports).toBeDefined();
      expect(node.ports?.length).toBe(comp.ports.length);

      // Verify node satisfies BaseNodeSchema
      const result = BaseNodeSchema.safeParse(node);
      expect(
        result.success,
        `Node "${node.id}" (${comp.id}) must satisfy BaseNodeSchema`
      ).toBe(true);
    }
  });
});

