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
    await expect(page).toHaveURL(/.*\/docs\/components\/scroll-area/);
    await expect(page.locator("h1")).toContainText("Scroll Area");
  });

  test("renders responsive mobile drawer navigation on small viewports", async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/docs/getting-started/introduction");

    // On mobile, desktop sidebars are hidden
    const desktopSidebar = page.locator(".hidden.md\\:flex");
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
  });
});
