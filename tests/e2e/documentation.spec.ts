import { test, expect } from "@playwright/test";

test.describe("NXTQR Documentation Platform (Phase 03)", () => {
  test("navigating to /docs redirects to /docs/getting-started/introduction", async ({ page }) => {
    await page.goto("/docs");
    await expect(page).toHaveURL(/.*\/docs\/getting-started\/introduction/);
    await expect(page.locator("h1")).toContainText("Introduction");
  });

  test("renders 3-column layout shell with fixed sidebars and independent central scroll", async ({
    page,
  }) => {
    // Set desktop viewport width
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/docs/getting-started/introduction");

    // Header validation
    const topHeader = page.locator("header").first();
    await expect(topHeader).toBeVisible();
    await expect(topHeader).toContainText("NXTQR");
    await expect(topHeader).toContainText("/ Design System");

    // Left Navigation Sidebar
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText("Getting Started");
    await expect(sidebar).toContainText("Components");
    await expect(sidebar).toContainText("Foundations");

    // Central Reading Area
    const mainContent = page.locator("#docs-content");
    await expect(mainContent).toBeVisible();
    await expect(mainContent.locator("h1")).toContainText("Introduction");

    // Right Table of Contents (visible on desktop >= 1280px)
    const toc = page.locator("aside").last();
    await expect(toc).toBeVisible();
    await expect(toc).toContainText("On This Page");
  });

  test("header remains pinned to top of viewport when scrolling central content", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/docs/components/button");

    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    // Verify initial y-offset is 0
    const initialBox = await header.boundingBox();
    expect(initialBox?.y).toBe(0);

    // Scroll the main content container down by 800px
    const mainContent = page.locator("#docs-content");
    await mainContent.evaluate((el) => el.scrollTo(0, 800));

    // Wait for scroll stabilization
    await page.waitForTimeout(100);

    // Verify header remains pinned at y=0
    const scrolledBox = await header.boundingBox();
    expect(scrolledBox?.y).toBe(0);
    await expect(header).toBeVisible();
  });

  test("navigates to Button documentation and validates interactive preview and playground", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/docs/components/button");

    await expect(page.locator("h1")).toContainText("Button");

    // Verify Interactive Preview is visible
    const preview = page.locator(".prose-container");
    await expect(preview).toContainText("Primary Action");

    // Verify Button Playground is present
    await expect(page.locator("text=Interactive Button Playground")).toBeVisible();
    const playgroundBtn = page
      .locator(".prose-container button")
      .filter({ hasText: "Execute Command" });
    await expect(playgroundBtn).toBeVisible();

    // Verify Props Table is present
    await expect(page.locator("#props-and-attributes")).toBeVisible();
    await expect(page.locator("text=variant").first()).toBeVisible();
    await expect(page.locator("text=isLoading").first()).toBeVisible();
  });

  test("opens command search palette and searches for components", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/docs/getting-started/introduction");

    // Click search trigger in header
    const searchBtn = page.getByRole("button", { name: /Quick search/i });
    await searchBtn.click();

    // Verify command dialog opens
    const searchInput = page.getByPlaceholder("Search documentation, components, foundations...");
    await expect(searchInput).toBeVisible();

    // Type query
    await searchInput.fill("Scroll Area");

    // Verify matching search results
    const resultItem = page.locator("[cmdk-item]").filter({ hasText: "Scroll Area" }).first();
    await expect(resultItem).toBeVisible();

    // Click item to navigate
    await resultItem.click();
    await expect(page).toHaveURL(/.*\/docs\/components\/scroll-area/, { timeout: 15000 });
    await expect(page.locator("h1")).toContainText("Scroll Area");
  });

  test("renders responsive mobile drawer navigation on small viewports", async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/docs/getting-started/introduction");

    // On mobile, desktop sidebars are hidden
    const desktopSidebar = page.locator("aside.hidden.md\\:flex");
    await expect(desktopSidebar).toBeHidden();

    // Mobile trigger button is visible
    const mobileMenuTrigger = page.getByRole("button", { name: "Open documentation navigation" });
    await expect(mobileMenuTrigger).toBeVisible();

    // Open mobile navigation sheet
    await mobileMenuTrigger.click();

    // Verify sheet drawer contains navigation links
    const drawer = page.locator("[role='dialog']");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("NXTQR Documentation");
    await expect(drawer).toContainText("Button");

    // Expanding viewport to desktop (>= 768px) automatically closes the mobile drawer
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(drawer).toBeHidden();
  });

  test("validates syntax-highlighted code block, language indicator, copy feedback, and word wrap toggle", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/docs/components/button");

    // Locate copy button on code block
    const copyBtn = page.getByRole("button", { name: /Copy code/i }).first();
    await expect(copyBtn).toBeVisible();

    // Click copy and verify brief "Copied" feedback
    await copyBtn.click();
    await expect(page.locator("text=Copied").first()).toBeVisible();

    // Locate and toggle word wrap button
    const wrapBtn = page.getByRole("button", { name: /word wrap/i }).first();
    await expect(wrapBtn).toBeVisible();
    await expect(wrapBtn).toHaveAttribute("aria-pressed", "false");

    await wrapBtn.click();
    await expect(wrapBtn).toHaveAttribute("aria-pressed", "true");

    await wrapBtn.click();
    await expect(wrapBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("renders real component previews without placeholder text across catalog", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1400, height: 900 });

    // Test Dialog documentation
    await page.goto("/docs/components/dialog", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Dialog");
    await expect(page.locator("text=Component Ready")).toBeHidden();
    await expect(page.locator("text=Preview Coming Soon")).toBeHidden();

    // Test Select documentation
    await page.goto("/docs/components/select", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Select");
    await expect(page.locator("text=Component Ready")).toBeHidden();

    // Test Switch documentation
    await page.goto("/docs/components/switch", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Switch");
    await expect(page.locator("text=Component Ready")).toBeHidden();

    // Test Card documentation: verify real source code under Code tab and InstallationCommand syntax highlighting
    await page.goto("/docs/components/card", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Card");
    const codeTab = page.getByRole("tab", { name: "Code" }).first();
    await codeTab.click();
    await expect(page.getByText("No source code provided")).toBeHidden();
    await expect(page.locator("code").filter({ hasText: "CardHeader" }).first()).toBeVisible();

    // Verify syntax highlighting on InstallationCommand
    const installBlock = page.locator("code").filter({ hasText: "pnpm" }).first();
    await expect(installBlock).toBeVisible();
    await expect(installBlock.locator("span").first()).toContainText("pnpm");
  });
});
