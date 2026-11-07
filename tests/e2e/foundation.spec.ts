import { test, expect } from "@playwright/test";

test.describe("NXTQR Foundation & Design System", () => {
  test("renders root verification page in pure black dark theme", async ({ page }) => {
    await page.goto("/");

    // Verify page title
    await expect(page).toHaveTitle(/NXTQR — Engineering Platform/);

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
});
