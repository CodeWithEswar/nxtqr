import { test, expect } from "@playwright/test";

test.describe("NXTQR Foundation & Design System", () => {
  test("renders root verification page in pure black dark theme", async ({ page }) => {
    await page.goto("/");

    // Verify page title
    await expect(page).toHaveTitle(/NXTQR/);

    // Verify pure black dark theme is applied on root
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Verify header exists
    await expect(page.locator("h1")).toContainText("NXTQR — Engineering Foundation");
  });

  test("navigates to theme settings and applies user-selected accent", async ({ page }) => {
    await page.goto("/settings/theme");

    // Verify title
    await expect(page.locator("h1")).toContainText("Theme & User-Selected Accent");

    // Click Red preset
    const redPresetBtn = page.getByRole("button", { name: /Red/i });
    await redPresetBtn.click();

    // Verify CSS variable was updated on root document (Pure Red: #FF0000 with white foreground)
    const rootStyle = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue("--accent");
    });
    expect(rootStyle).toBe("#FF0000");

    const fgStyle = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue("--accent-foreground");
    });
    expect(fgStyle).toBe("#FFFFFF");
  });

  test("health check API returns 200 OK", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.status).toBe("ok");
    expect(json.platform).toBe("NXTQR Studio");
  });

  test("renders brand review gate and validates interactive logo system", async ({ page }) => {
    await page.goto("/verify/brand");

    await expect(page.locator("h1")).toContainText(
      "NXTQR — Brand Identity & Concrete Logo Review Gate",
    );

    // Verify SVG logo presence
    const logoSymbol = page.locator("svg").first();
    await expect(logoSymbol).toBeVisible();

    // Verify asset table contains verified production assets
    await expect(page.locator("body")).toContainText("favicon.ico");
    await expect(page.locator("body")).toContainText("opengraph-image.png");
  });

  test("renders scrollbar review gate and validates precision rail system", async ({ page }) => {
    await page.goto("/verify/scrollbar");

    await expect(page.locator("h1")).toContainText(
      "NXTQR — Precision Rail Custom Scrollbar System Review Gate",
    );

    // Verify all 4 variants exist on the page
    await expect(page.locator(".scrollbar-default")).toBeVisible();
    await expect(page.locator(".scrollbar-compact").first()).toBeVisible();
    await expect(page.locator(".scrollbar-canvas")).toBeVisible();
    await expect(page.locator(".scrollbar-dense").first()).toBeVisible();

    // Verify dynamic accent switching updates container style
    const orangeBtn = page.getByRole("button", { name: /Pure Orange/i });
    await orangeBtn.click();

    const mainStyle = await page.locator("main").getAttribute("style");
    expect(mainStyle).toContain("--accent: #FF6600");
  });
});
