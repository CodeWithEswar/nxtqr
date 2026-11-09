import { describe, it, expect, beforeEach } from "vitest";
import {
  SHELL_NAVIGATION_GROUPS,
  ALL_NAVIGATION_ITEMS,
  matchActiveNavigationItem,
} from "../config/navigation";
import {
  ShellLayoutPreferencesSchema,
  DEFAULT_LAYOUT_PREFERENCES,
} from "../schemas/layout-preferences.schema";
import { useShellStore } from "../store/shell-store";

describe("NXTQR Phase 02 — Navigation Registry", () => {
  it("provides non-empty navigation groups with required metadata", () => {
    expect(SHELL_NAVIGATION_GROUPS.length).toBeGreaterThan(0);
    expect(ALL_NAVIGATION_ITEMS.length).toBeGreaterThan(0);

    const ids = new Set<string>();
    const hrefs = new Set<string>();

    for (const group of SHELL_NAVIGATION_GROUPS) {
      expect(group.id).toBeDefined();
      expect(group.label).toBeDefined();
      expect(group.items.length).toBeGreaterThan(0);

      for (const item of group.items) {
        expect(ids.has(item.id)).toBe(false); // Unique ID
        ids.add(item.id);

        expect(hrefs.has(item.href)).toBe(false); // Unique route
        hrefs.add(item.href);

        expect(item.label.length).toBeGreaterThan(0);
        expect(item.href.startsWith("/")).toBe(true);
        expect(item.icon).toBeDefined();
      }
    }
  });

  it("matches active navigation item accurately by pathname", () => {
    // Exact match
    const workspace = matchActiveNavigationItem("/workspace");
    expect(workspace?.id).toBe("overview");

    const projects = matchActiveNavigationItem("/workspace/projects");
    expect(projects?.id).toBe("projects");

    const visualizers = matchActiveNavigationItem("/workspace/visualizers");
    expect(visualizers?.id).toBe("visualizers");

    const docs = matchActiveNavigationItem("/docs");
    expect(docs?.id).toBe("documentation");

    // Prefix match
    const docsDeeper = matchActiveNavigationItem("/docs/getting-started/design-system");
    expect(docsDeeper?.id).toBe("documentation");

    // Unknown route
    const unknown = matchActiveNavigationItem("/unknown/nonexistent/route");
    expect(unknown).toBeUndefined();
  });
});

describe("NXTQR Phase 02 — Layout Preferences Schema", () => {
  it("validates default preferences accurately", () => {
    const parsed = ShellLayoutPreferencesSchema.parse(DEFAULT_LAYOUT_PREFERENCES);
    expect(parsed.version).toBe(1);
    expect(parsed.sidebarWidth).toBe(248);
    expect(parsed.sidebarCollapsed).toBe(false);
    expect(parsed.panelSizes).toEqual([20, 60, 20]);
  });

  it("clamps and rejects out-of-bounds sidebar widths", () => {
    // Width below minimum (208)
    const tooNarrow = {
      ...DEFAULT_LAYOUT_PREFERENCES,
      sidebarWidth: 150,
    };
    expect(() => ShellLayoutPreferencesSchema.parse(tooNarrow)).toThrow();

    // Width above maximum (360)
    const tooWide = {
      ...DEFAULT_LAYOUT_PREFERENCES,
      sidebarWidth: 500,
    };
    expect(() => ShellLayoutPreferencesSchema.parse(tooWide)).toThrow();

    // Valid intermediate width
    const valid = {
      ...DEFAULT_LAYOUT_PREFERENCES,
      sidebarWidth: 300,
    };
    expect(ShellLayoutPreferencesSchema.parse(valid).sidebarWidth).toBe(300);
  });
});

describe("NXTQR Phase 02 — Shell Store State Machine", () => {
  beforeEach(() => {
    useShellStore.getState().resetWorkspaceLayout();
  });

  it("toggles sidebar collapsed state correctly", () => {
    const store = useShellStore.getState();
    expect(store.sidebarCollapsed).toBe(false);

    store.toggleSidebar();
    expect(useShellStore.getState().sidebarCollapsed).toBe(true);

    store.toggleSidebar();
    expect(useShellStore.getState().sidebarCollapsed).toBe(false);
  });

  it("strictly enforces sidebar width boundaries (208px - 360px)", () => {
    const store = useShellStore.getState();

    // Attempt to set below min width
    store.setSidebarWidth(100);
    expect(useShellStore.getState().sidebarWidth).toBe(208);

    // Attempt to set above max width
    store.setSidebarWidth(999);
    expect(useShellStore.getState().sidebarWidth).toBe(360);

    // Set valid width
    store.setSidebarWidth(280);
    expect(useShellStore.getState().sidebarWidth).toBe(280);
  });

  it("toggles secondary panel and resets layout cleanly", () => {
    const store = useShellStore.getState();
    expect(store.secondaryPanelOpen).toBe(false);

    store.toggleSecondaryPanel();
    expect(useShellStore.getState().secondaryPanelOpen).toBe(true);

    store.resetWorkspaceLayout();
    expect(useShellStore.getState().secondaryPanelOpen).toBe(false);
    expect(useShellStore.getState().sidebarWidth).toBe(248);
    expect(useShellStore.getState().sidebarCollapsed).toBe(false);
  });
});
