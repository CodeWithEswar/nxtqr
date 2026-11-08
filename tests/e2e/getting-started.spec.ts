import { test, expect } from "@playwright/test";

test.describe("NXTQR Phase 08 — Getting Started Documentation & Onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("1. Introduction page renders architecture overview and switches pipeline stages", async ({ page }) => {
    await page.goto("/docs/getting-started/introduction");
    await expect(page.locator("h1")).toContainText("Introduction");

    // Architecture Overview interactive component
    await expect(page.getByText("NXTQR Platform Architecture Lifecycle").first()).toBeVisible();

    // Verify initial stage is Stage 1 (Graph Definition)
    await expect(page.getByText("Graph Definition").first()).toBeVisible();

    // Click on Stage 4 (Deterministic Engine)
    const stage4Button = page.getByRole("button", { name: /Deterministic Engine/i });
    await expect(stage4Button).toBeVisible();
    await stage4Button.click();
    await expect(page.getByText("Topological stepping").first()).toBeVisible();
  });

  test("2. Installation page renders step-by-step orchestrator and troubleshooting drawers", async ({ page }) => {
    await page.goto("/docs/getting-started/installation");
    await expect(page.locator("h1")).toContainText("Installation");

    // Verify Orchestrator component
    await expect(page.getByText("NXTQR Installation & Environment Orchestration").first()).toBeVisible();

    // Step 1 initial state
    await expect(page.getByText("Step 1: System Prerequisites").first()).toBeVisible();

    // Switch to Step 2
    const step2Btn = page.getByRole("button", { name: /STEP 02 Clone & Install/i });
    await expect(step2Btn).toBeVisible();
    await step2Btn.click();
    await expect(page.getByText("Step 2: Clone & Install Dependencies").first()).toBeVisible();

    // Switch to Step 3
    const step3Btn = page.getByRole("button", { name: /STEP 03 Environment/i });
    await expect(step3Btn).toBeVisible();
    await step3Btn.click();
    await expect(page.getByText("Step 3: Environment Variables Configuration").first()).toBeVisible();

    // Expand troubleshooting drawer
    const troubleItem = page.getByRole("button", { name: /Port 3000 already in use/i }).first();
    await expect(troubleItem).toBeVisible();
    await troubleItem.click();
    await expect(page.getByText("pnpm --filter @nxtqr/web dev -- -p 3001").first()).toBeVisible();
  });

  test("3. Quick Start page executes topological simulation stepping and displays telemetry", async ({ page }) => {
    await page.goto("/docs/getting-started/quick-start");
    await expect(page.locator("h1")).toContainText("Quick Start");

    // Interactive Quick Start Studio component
    const studioHeading = page.locator("#docs-content").getByRole("heading", { name: /Interactive Quick Start Studio/i }).first();
    await expect(studioHeading).toBeVisible();

    // Jump to Phase 5: Run Simulation
    const step5Nav = page.getByRole("button", { name: /5\. Run Simulation/i });
    await expect(step5Nav).toBeVisible();
    await step5Nav.click();

    // Find the Step button and advance simulation
    const stepBtn = page.getByRole("button", { name: /Step \(0\/3\)/i });
    await expect(stepBtn).toBeVisible();
    await stepBtn.click();

    // Check that telemetry event was emitted
    await expect(page.getByText("Emitted Execution Telemetry Trace").first()).toBeVisible();
    await expect(page.getByText("INGRESS_RECEIVED").first()).toBeVisible();
  });

  test("4. Project Structure renders repository tree and dependency layers", async ({ page }) => {
    await page.goto("/docs/getting-started/project-structure");
    await expect(page.locator("h1")).toContainText("Project Structure");

    // Verify Repository Explorer
    await expect(page.getByText("NXTQR Monorepo Architecture Explorer").first()).toBeVisible();

    // Test search filter in repository tree
    const searchInput = page.getByPlaceholder("Search packages, folders, or files...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("icons");

    await expect(page.getByText("@nxtqr/icons").first()).toBeVisible();

    // Verify Layered Dependency Architecture
    await expect(page.getByText("Monorepo Layered Dependency Architecture").first()).toBeVisible();
    await expect(page.getByText("Application Shell").first()).toBeVisible();
  });

  test("5. Theming & Accents renders accent playground and previews color presets", async ({ page }) => {
    await page.goto("/docs/getting-started/theming");
    await expect(page.locator("h1")).toContainText("Theming & Accents");

    // Dynamic User Accent & Contrast Laboratory
    await expect(page.getByText("Dynamic User Accent & Contrast Laboratory").first()).toBeVisible();

    // Click Pure Green Preset
    const greenSwatch = page.getByRole("button", { name: /Pure Green/i }).first();
    await expect(greenSwatch).toBeVisible();
    await greenSwatch.click();

    // Check that active preview displays #00CC66 and black text
    await expect(page.getByText("#00CC66 · Text: #000000").first()).toBeVisible();

    // Click Pure Blue Preset
    const blueSwatch = page.getByRole("button", { name: /Pure Blue/i }).first();
    await expect(blueSwatch).toBeVisible();
    await blueSwatch.click();

    // Check that active preview displays #0066FF and white text
    await expect(page.getByText("#0066FF · Text: #FFFFFF").first()).toBeVisible();
  });

  test("6. Responsive mobile viewport layout check", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/docs/getting-started/quick-start");

    // Header visible on mobile
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    // Heading rendered cleanly
    await expect(page.locator("h1")).toContainText("Quick Start");

    // Content container visible
    await expect(page.locator("#docs-content")).toBeVisible();
  });
});
