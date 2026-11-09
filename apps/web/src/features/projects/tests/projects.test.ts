import { describe, it, expect } from "vitest";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectFilterSchema,
  ProjectStatusSchema,
  VISUALIZER_TYPE_METADATA,
} from "../schemas/project.schema";

describe("NXTQR Phase 03: Project Management Infrastructure", () => {
  describe("Project Validation Schemas", () => {
    it("validates valid project creation inputs", () => {
      const valid = {
        name: "Distributed Event Bus",
        description: "Kafka streaming cluster with schema registry",
        visualizerType: "system-design" as const,
      };

      const parsed = CreateProjectSchema.parse(valid);
      expect(parsed.name).toBe("Distributed Event Bus");
      expect(parsed.visualizerType).toBe("system-design");
    });

    it("rejects project names shorter than 2 characters", () => {
      expect(() =>
        CreateProjectSchema.parse({
          name: "A",
          visualizerType: "database",
        }),
      ).toThrow();
    });

    it("rejects invalid visualizer types", () => {
      expect(() =>
        CreateProjectSchema.parse({
          name: "Valid Project Name",
          visualizerType: "crypto-trading-bot" as any,
        }),
      ).toThrow();
    });

    it("validates project updates with status changes", () => {
      expect(ProjectStatusSchema.parse("active")).toBe("active");
      expect(ProjectStatusSchema.parse("archived")).toBe("archived");

      const update = {
        name: "Renamed Project",
        status: "archived" as const,
      };

      const parsed = UpdateProjectSchema.parse(update);
      expect(parsed.name).toBe("Renamed Project");
      expect(parsed.status).toBe("archived");
    });

    it("validates project filter and pagination defaults", () => {
      const filter = ProjectFilterSchema.parse({});
      expect(filter.limit).toBe(20);
      expect(filter.offset).toBe(0);
      expect(filter.status).toBeUndefined();

      const filtered = ProjectFilterSchema.parse({
        status: "active",
        search: "Telemetry",
        limit: 10,
        offset: 20,
      });
      expect(filtered.status).toBe("active");
      expect(filtered.search).toBe("Telemetry");
      expect(filtered.limit).toBe(10);
    });

    it("has complete visualizer metadata for all registered engines", () => {
      const engines = [
        "system-design",
        "rag",
        "ai-agents",
        "database",
        "algorithms",
        "networking",
        "cloud",
        "cicd",
        "operating-systems",
      ];

      for (const eng of engines) {
        expect(VISUALIZER_TYPE_METADATA[eng]).toBeDefined();
        expect(VISUALIZER_TYPE_METADATA[eng].label.length).toBeGreaterThan(0);
        expect(VISUALIZER_TYPE_METADATA[eng].description.length).toBeGreaterThan(0);
      }
    });
  });
});

