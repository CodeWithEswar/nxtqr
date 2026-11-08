import { test, expect } from "@playwright/test";

test.describe("NXTQR Visualizer Components & Graph Engineering (Phase 07)", () => {
  test("renders Graph Canvas with interactive playground and toolbar", async ({ page }) => {
    await page.goto("/docs/visualizer/canvas");
    await expect(page.locator("h1")).toContainText("Graph Canvas");

    // Playground header
    await expect(
      page.getByText("Graph Canvas Interactive Workspace", { exact: false })
    ).toBeVisible();

    // Verify React Flow canvas is mounted
    const flowContainer = page.locator(".react-flow");
    await expect(flowContainer.first()).toBeVisible();

    // Verify toolbar controls
    await expect(page.getByText("Fit", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Auto-Layout", { exact: false }).first()).toBeVisible();
  });

  test("renders Graph Nodes with interactive type switcher and status preview", async ({
    page,
  }) => {
    await page.goto("/docs/visualizer/nodes");
    await expect(page.locator("h1")).toContainText("Graph Nodes");

    await expect(
      page.getByText("Graph Nodes Architecture Laboratory", { exact: false })
    ).toBeVisible();

    // Click 'database' node type
    const dbTypeBtn = page.getByRole("button", { name: /database/i }).first();
    await dbTypeBtn.click();

    // Verify node component is rendered
    await expect(page.getByText("State Storage", { exact: false }).first()).toBeVisible();
  });

  test("renders Graph Edges with routing curves and execution pulse", async ({ page }) => {
    await page.goto("/docs/visualizer/edges");
    await expect(page.locator("h1")).toContainText("Graph Edges");

    await expect(
      page.getByText("Graph Edges Connection Laboratory", { exact: false })
    ).toBeVisible();

    // Verify SVG path preview
    const edgeSvg = page.locator("svg path").first();
    await expect(edgeSvg).toBeVisible();
  });

  test("renders Node Inspector with live properties form and selection tabs", async ({
    page,
  }) => {
    await page.goto("/docs/visualizer/inspector");
    await expect(page.locator("h1")).toContainText("Node Inspector");

    await expect(
      page.getByText("Node Inspector Laboratory", { exact: false })
    ).toBeVisible();

    // Select a node
    const selectNodeBtn = page.getByRole("button", { name: "Edge Gateway", exact: false }).first();
    await selectNodeBtn.click();

    // Verify form tabs exist
    await expect(page.getByRole("button", { name: /general/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /config/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /connections/i }).first()).toBeVisible();
  });

  test("renders Simulation Controls with state transitions and transport buttons", async ({
    page,
  }) => {
    await page.goto("/docs/visualizer/simulation-controls");
    await expect(page.locator("h1")).toContainText("Simulation Controls");

    await expect(
      page.getByText("Simulation Controls Execution Laboratory", { exact: false })
    ).toBeVisible();

    // Verify transport controls
    const startBtn = page.getByRole("button", { name: "Start", exact: true }).first();
    await expect(startBtn).toBeVisible();

    const stepBtn = page.getByRole("button", { name: /Step/i }).first();
    await expect(stepBtn).toBeVisible();

    // Click Step
    await stepBtn.click();
    await expect(page.getByText("STEP:").first()).toBeVisible();
  });

  test("renders Execution Trace Viewer with chronological event stream and search", async ({
    page,
  }) => {
    await page.goto("/docs/visualizer/trace-viewer");
    await expect(page.locator("h1")).toContainText("Execution Trace Viewer");

    await expect(
      page.getByText("Execution Trace Viewer Laboratory", { exact: false })
    ).toBeVisible();

    // Click load sample stream
    const loadSampleBtn = page.getByRole("button", { name: "Load Sample Stream", exact: true });
    await loadSampleBtn.click();

    // Verify event records are listed
    await expect(page.getByText("INGRESS_RECEIVED", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("DATABASE_WRITE", { exact: false }).first()).toBeVisible();
  });
});

