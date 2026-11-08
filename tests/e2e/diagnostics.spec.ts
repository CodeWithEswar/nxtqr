import { test, expect } from "@playwright/test";

test.describe("NXTQR Architecture & Infrastructure Diagnostics Console (/verify)", () => {
  test("renders diagnostics console with wide desktop layout and real derived summary", async ({
    page,
  }) => {
    await page.goto("/verify");

    // Header title and subtitle
    await expect(page.locator("h1")).toContainText("Architecture & Infrastructure Diagnostics");
    await expect(
      page.getByText("Production verification console", { exact: false })
    ).toBeVisible();

    // Verify derived summary metrics are present
    await expect(page.getByText("Total Checks:", { exact: false })).toBeVisible();
    await expect(page.getByText("Verified", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Warnings", { exact: false }).first()).toBeVisible();

    // Verify categorized groups exist
    await expect(page.getByText("Monorepo & Architecture Foundation", { exact: false })).toBeVisible();
    await expect(page.getByText("Design System & Theming Tokens", { exact: false })).toBeVisible();
    await expect(page.getByText("Data & Infrastructure Services", { exact: false })).toBeVisible();
    await expect(page.getByText("Frontend & Shared State Systems", { exact: false })).toBeVisible();

    // Verify Review Gates dropdown
    const reviewGatesBtn = page.getByRole("button", { name: "Review Gates" });
    await expect(reviewGatesBtn).toBeVisible();
    await reviewGatesBtn.click();
    await expect(page.getByRole("menuitem", { name: "Scrollbar Review Gate" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Brand Review Gate" })).toBeVisible();

    // Close dropdown
    await page.keyboard.press("Escape");
  });

  test("filters checks by status and search query", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("button", { name: /Run Diagnostics/i })).toBeEnabled({ timeout: 15000 });

    // Click 'Warnings' filter
    const warningsFilterBtn = page.getByRole("button", { name: /Warnings/i });
    await warningsFilterBtn.click();

    // Confirm Database Connectivity warning is visible in list
    await expect(page.locator("section").getByText("Database Connectivity (Live Daemon Ping)").first()).toBeVisible();

    // Confirm passed checks like Monorepo Architecture are hidden under warnings filter
    await expect(page.locator("section").getByText("pnpm & Turborepo Workspace Architecture")).not.toBeVisible();

    // Switch back to 'All Checks'
    const allFilterBtn = page.getByRole("button", { name: /All Checks/i });
    await allFilterBtn.click();
    await expect(page.locator("section").getByText("pnpm & Turborepo Workspace Architecture")).toBeVisible();

    // Test Search input
    const searchInput = page.getByPlaceholder("Filter checks or groups...");
    await searchInput.fill("Supabase");

    await expect(page.locator("section").getByText("Supabase Client & Auth Configuration")).toBeVisible();
    await expect(page.locator("section").getByText("Precision Rail Scrollbar Engine")).not.toBeVisible();
  });

  test("inspects diagnostic evidence and remediation guidance on row selection", async ({
    page,
  }) => {
    await page.goto("/verify");
    await expect(page.getByRole("button", { name: /Run Diagnostics/i })).toBeEnabled({ timeout: 15000 });

    // Click on Database Connectivity check row
    const dbRow = page.locator("section").getByText("Database Connectivity (Live Daemon Ping)").first();
    await dbRow.click();

    // Verify details panel updates with warning and remediation
    await expect(page.getByText("Remediation Guidance")).toBeVisible();
    await expect(page.getByText("npx supabase start", { exact: false })).toBeVisible();
    await expect(page.getByText("Technical Evidence")).toBeVisible();

    // Click on Monorepo architecture check row
    const monorepoRow = page.locator("section").getByText("pnpm & Turborepo Workspace Architecture").first();
    await monorepoRow.click();

    // Verify diagnostics output updates
    await expect(page.getByText("Diagnostic Telemetry Output")).toBeVisible();
    await expect(page.getByText("29 monorepo workspaces resolved", { exact: false })).toBeVisible();
  });

  test("executes on-demand diagnostics run", async ({ page }) => {
    await page.goto("/verify");

    const runBtn = page.getByRole("button", { name: /Run Diagnostics/i });
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // After clicking, button should become re-enabled after run completes
    await expect(page.getByRole("button", { name: /Run Diagnostics/i })).toBeEnabled({
      timeout: 15000,
    });
  });

  test("maintains responsive presentation without horizontal scroll on mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/verify");

    // Title should be visible and not horizontally overflow
    await expect(page.locator("h1")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allowing minor subpixel rounding
  });
});

