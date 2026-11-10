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

    await expect(page.locator("h1")).toContainText("Brand Review Gate");

    const aperture = page.locator("[data-nxtqr-motion] [data-nxtqr-aperture]");
    await expect(aperture).toHaveCSS("animation-name", "nxtqrBrandReveal");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(aperture).toHaveCSS("animation-name", "none");
    await expect(aperture).toHaveCSS("opacity", "1");

    await page.emulateMedia({ reducedMotion: "no-preference" });
    const reveal = page.locator("[data-nxtqr-reveal]");
    await expect(async () => {
      if ((await reveal.count()) === 0) {
        await page.getByRole("button", { name: "Test Loading" }).click();
      }
      await expect(reveal).toHaveCount(1, { timeout: 1000 });
    }).toPass({ timeout: 10000 });
    await expect(reveal).toHaveCSS("animation-name", "nxtqrLoadingReveal");
    await expect(aperture).toHaveCSS("transform", "none");

    const motionToggle = page.getByRole("button", { name: /Motion:/ });
    await motionToggle.click();
    await expect(reveal).toHaveCSS("animation-name", "none");
    await expect(aperture).toHaveCSS("opacity", "1");
    await motionToggle.click();

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(reveal).toHaveCSS("animation-name", "none");
    await expect(reveal).toHaveCSS("opacity", "0");
    await expect(aperture).toHaveCSS("opacity", "1");

    await expect(page.locator("body")).toContainText("favicon.ico");
    await expect(page.locator("body")).toContainText("opengraph-image.png");
  });

  test("renders scrollbar review gate and validates precision rail system", async ({ page }) => {
    await page.goto("/verify/scrollbar");

    await expect(page.locator("h1")).toContainText("Scrollbar");

    // Verify all 4 variants exist on the page
    await expect(page.locator(".scrollbar-default")).toBeVisible();
    await expect(page.locator(".scrollbar-compact").first()).toBeVisible();
    await expect(page.locator(".scrollbar-canvas")).toBeVisible();
    await expect(page.locator(".scrollbar-dense").first()).toBeVisible();

    // Verify monochrome thumb state selector
    const activeBtn = page.getByRole("button", { name: /Active Drag/i });
    await activeBtn.click();
    await expect(activeBtn).toBeVisible();
  });
});
