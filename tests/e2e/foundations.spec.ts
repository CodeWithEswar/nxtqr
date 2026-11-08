import { test, expect } from "@playwright/test";

test.describe("NXTQR Design System Foundations (Phase 06)", () => {
  const foundations = [
    {
      slug: "colors",
      title: "Colors",
      expectedHeading: "Interactive Color Laboratory",
    },
    {
      slug: "typography",
      title: "Typography",
      expectedHeading: "Interactive Typography Laboratory",
    },
    {
      slug: "spacing",
      title: "Spacing & Density",
      expectedHeading: "Interactive Spacing & Density Laboratory",
    },
    {
      slug: "radius",
      title: "Border Radius",
      expectedHeading: "Interactive Border Radius Laboratory",
    },
    {
      slug: "elevation",
      title: "Elevation & Shadows",
      expectedHeading: "Interactive Elevation & Shadow Laboratory",
    },
    {
      slug: "solid-neumorphism",
      title: "Solid Neumorphism",
      expectedHeading: "Solid Neumorphism Hardware Laboratory",
    },
    {
      slug: "iconography",
      title: "Iconography",
      expectedHeading: "Hugeicons Iconography System",
    },
    {
      slug: "motion",
      title: "Motion & Keyframes",
      expectedHeading: "Interactive Motion & Physics Laboratory",
    },
    {
      slug: "accessibility",
      title: "Accessibility",
      expectedHeading: "Accessibility & WCAG 2.1 Laboratory",
    },
    {
      slug: "responsive",
      title: "Responsive Design",
      expectedHeading: "Responsive Viewport Simulation Laboratory",
    },
    {
      slug: "scrollbars",
      title: "Precision Rail Scrollbars",
      expectedHeading: "Precision Rail Scrollbar Laboratory",
    },
  ];

  for (const foundation of foundations) {
    test(`renders ${foundation.title} with interactive laboratory and zero placeholder text`, async ({
      page,
    }) => {
      await page.goto(`/docs/foundations/${foundation.slug}`);

      // Verify page title
      const h1 = page.locator("h1");
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(foundation.title);

      // Verify interactive playground laboratory is mounted
      const labHeading = page.getByText(foundation.expectedHeading, { exact: false }).first();
      await expect(labHeading).toBeVisible();

      // Ensure NO generic placeholder text from loader.ts exists
      const bodyText = await page.locator("#docs-content").innerText();
      expect(bodyText).not.toContain("Theme Baseline: Pure Black (#000000)");
      expect(bodyText).not.toContain("// No source code provided");
    });
  }
});

