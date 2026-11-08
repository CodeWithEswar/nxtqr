import { describe, it, expect } from "vitest";
import { DOCS_REGISTRY } from "./docs-registry";
import { getComponentDemo } from "./demo-registry";
import { getDocsNavigation } from "./navigation";
import { getDocBySlug } from "../mdx/loader";

const FORBIDDEN_PLACEHOLDERS = [
  "Component Ready",
  "Preview Coming Soon",
  "Demo Placeholder",
  "TODO: Preview",
];

describe("Documentation Quality & CI Audit", () => {
  it("has unique slugs across all registry entries", () => {
    const slugs = DOCS_REGISTRY.map((e) => e.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  it("ensures every ready component has an interactive demo, valid source, and props", () => {
    const readyComponents = DOCS_REGISTRY.filter(
      (entry) => entry.category === "Components" && entry.status === "ready",
    );

    expect(readyComponents.length).toBeGreaterThan(30);

    for (const comp of readyComponents) {
      const slugKey = comp.slug.replace(/^components\//, "");
      const demo = getComponentDemo(slugKey);

      expect(
        demo,
        `Component "${comp.slug}" marked ready but missing in COMPONENT_DEMO_REGISTRY`,
      ).toBeDefined();

      if (demo) {
        expect(
          typeof demo.component,
          `Component "${comp.slug}" demo.component must be a renderable component`,
        ).toBe("function");

        expect(
          demo.code.trim().length,
          `Component "${comp.slug}" demo.code must not be empty`,
        ).toBeGreaterThan(10);
      }

      expect(
        comp.props && comp.props.length > 0,
        `Component "${comp.slug}" must have documented public props`,
      ).toBe(true);
    }
  });

  it("ensures zero placeholder phrases exist in rendered documentation content", async () => {
    const readyComponents = DOCS_REGISTRY.filter(
      (entry) => entry.category === "Components" && entry.status === "ready",
    );

    for (const comp of readyComponents) {
      const slugParts = comp.slug.split("/");
      const loaded = await getDocBySlug(slugParts);

      expect(loaded, `Loaded doc for "${comp.slug}" must not be null`).toBeDefined();

      if (loaded) {
        for (const placeholder of FORBIDDEN_PLACEHOLDERS) {
          expect(
            loaded.content.includes(placeholder),
            `Found forbidden placeholder "${placeholder}" in doc "${comp.slug}"`,
          ).toBe(false);
        }
      }
    }
  });

  it("ensures documentation navigation groups all ready components without duplicates", () => {
    const navGroups = getDocsNavigation();
    const componentGroup = navGroups.find((g) => g.category === "Components");

    expect(componentGroup).toBeDefined();
    if (componentGroup) {
      const slugs = componentGroup.items.map((i) => i.slug);
      const unique = new Set(slugs);
      expect(slugs.length).toBe(unique.size);
      expect(componentGroup.items.length).toBeGreaterThanOrEqual(40);
    }
  });
});
