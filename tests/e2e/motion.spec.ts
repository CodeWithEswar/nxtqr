import { test, expect } from "@playwright/test";

test.describe("NXTQR Motion Design System (Phase 04)", () => {
  test("renders motion foundations documentation with duration tokens and easing curves", async ({
    page,
  }) => {
    await page.goto("/docs/foundations/motion");
    await expect(page).toHaveURL(/.*\/docs\/foundations\/motion/);

    const heading = page.locator("h1");
    await expect(heading).toContainText("Motion & Keyframes");

    // Verify duration scale table is present
    const table = page.locator("table").first();
    await expect(table).toBeVisible();
    await expect(table).toContainText("instant");
    await expect(table).toContainText("80ms");
    await expect(table).toContainText("panel");
    await expect(table).toContainText("340ms");
  });

  test("sidebar navigation groups toggle smoothly with aria-expanded", async ({ page }) => {
    await page.goto("/docs/foundations/motion");

    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();

    // Toggle Foundations group
    const foundationsBtn = sidebar.locator("button:has-text('Foundations')");
    await expect(foundationsBtn).toBeVisible();
    await expect(foundationsBtn).toHaveAttribute("aria-expanded", "true");

    // Collapse
    await foundationsBtn.click();
    await expect(foundationsBtn).toHaveAttribute("aria-expanded", "false");

    // Re-expand
    await foundationsBtn.click();
    await expect(foundationsBtn).toHaveAttribute("aria-expanded", "true");
  });

  test("command palette dialog opens with animated scale and closes on Escape", async ({ page }) => {
    await page.goto("/docs/foundations/motion");

    // Trigger search dialog via ⌘K button
    const searchTrigger = page.locator("button:has-text('Search docs...')").first();
    await searchTrigger.click();

    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveClass(/animate-dialog-in/);

    // Press Escape to dismiss
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("mobile navigation sheet opens with controlled slide and closes cleanly", async ({
    page,
  }) => {
    // Set mobile viewport width
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/docs/foundations/motion");

    const menuBtn = page.locator("button[aria-label='Open documentation navigation']");
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    const sheetContent = page.locator("[role='dialog']");
    await expect(sheetContent).toBeVisible();
    await expect(sheetContent).toHaveAttribute("data-state", "open");

    // Close mobile sheet
    const closeBtn = sheetContent.locator("button:has-text('Close')");
    await closeBtn.click();
    await expect(sheetContent).toBeHidden();
  });

  test("respects prefers-reduced-motion media query", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/docs/foundations/motion");

    // Trigger search dialog in reduced motion mode
    const searchTrigger = page.locator("button:has-text('Search docs...')").first();
    await searchTrigger.click();

    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible();
    // Class contains motion-reduce utility
    await expect(dialog).toHaveClass(/motion-reduce:animate-none/);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
