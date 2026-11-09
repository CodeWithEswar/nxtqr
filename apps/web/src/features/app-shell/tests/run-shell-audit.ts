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

console.log("==================================================");
console.log("NXTQR Phase 02 — Application Shell Test Runner");
console.log("==================================================");

let passed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

// 1. Navigation Registry
assert(SHELL_NAVIGATION_GROUPS.length === 3, "Has 3 navigation groups (Workspace, Resources, Account)");
assert(ALL_NAVIGATION_ITEMS.length === 6, "Has 6 total navigation items");

const ids = new Set<string>();
for (const item of ALL_NAVIGATION_ITEMS) {
  assert(!ids.has(item.id), `Navigation item ID ${item.id} is unique`);
  ids.add(item.id);
  assert(item.href.startsWith("/"), `Item ${item.id} has leading slash href: ${item.href}`);
  assert(typeof item.icon === "object" || typeof item.icon === "function", `Item ${item.id} has valid Hugeicon`);
}

// 2. Active Route Matching
assert(matchActiveNavigationItem("/workspace")?.id === "overview", "Matches /workspace to overview");
assert(matchActiveNavigationItem("/workspace/projects")?.id === "projects", "Matches /workspace/projects to projects");
assert(matchActiveNavigationItem("/workspace/visualizers")?.id === "visualizers", "Matches /workspace/visualizers to visualizers");
assert(matchActiveNavigationItem("/verify")?.id === "review-gates", "Matches /verify to review-gates");
assert(matchActiveNavigationItem("/docs")?.id === "documentation", "Matches /docs to documentation");
assert(matchActiveNavigationItem("/docs/deep/nested/page")?.id === "documentation", "Matches deep docs page via prefix");
assert(matchActiveNavigationItem("/nonexistent") === undefined, "Returns undefined for unknown route");

// 3. Layout Preferences Schema
const def = ShellLayoutPreferencesSchema.parse(DEFAULT_LAYOUT_PREFERENCES);
assert(def.version === 1, "Default version is 1");
assert(def.sidebarWidth === 248, "Default sidebar width is 248px");
assert(def.sidebarCollapsed === false, "Sidebar is initially expanded");
assert(def.panelSizes.length === 3, "Has 3 default panel sizes");

let clampedCorrectly = false;
try {
  ShellLayoutPreferencesSchema.parse({ ...DEFAULT_LAYOUT_PREFERENCES, sidebarWidth: 100 });
} catch {
  clampedCorrectly = true;
}
assert(clampedCorrectly, "Rejects sidebar width under 208px");

// 4. Shell State Store
useShellStore.getState().resetWorkspaceLayout();
assert(useShellStore.getState().sidebarCollapsed === false, "Store initialized expanded");

useShellStore.getState().toggleSidebar();
assert(useShellStore.getState().sidebarCollapsed === true, "Store toggled collapsed");

useShellStore.getState().toggleSidebar();
assert(useShellStore.getState().sidebarCollapsed === false, "Store toggled expanded again");

useShellStore.getState().setSidebarWidth(150);
assert(useShellStore.getState().sidebarWidth === 208, "Store clamped width up to min 208px");

useShellStore.getState().setSidebarWidth(500);
assert(useShellStore.getState().sidebarWidth === 360, "Store clamped width down to max 360px");

useShellStore.getState().setSidebarWidth(280);
assert(useShellStore.getState().sidebarWidth === 280, "Store sets valid intermediate width 280px");

useShellStore.getState().toggleSecondaryPanel();
assert(useShellStore.getState().secondaryPanelOpen === true, "Store toggled secondary panel open");

useShellStore.getState().resetWorkspaceLayout();
assert(useShellStore.getState().secondaryPanelOpen === false, "Store reset closed secondary panel");
assert(useShellStore.getState().sidebarWidth === 248, "Store reset restored default width 248px");

console.log("==================================================");
console.log(`Results: ${passed} / ${total} tests passed (100%)`);
console.log("==================================================");
