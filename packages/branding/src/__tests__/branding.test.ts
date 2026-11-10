import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  LOGO_GEOMETRY,
  BRAND_CONSTANTS,
  WORDMARK_TYPOGRAPHY,
  generateSvgMarkup,
  LogoMark,
  LogoWordmark,
  AppLogo,
  AnimatedLogo,
  AppIcon,
} from "../index";

describe("NXTQR Brand Identity System", () => {
  describe("Brand Constants & Tokens", () => {
    it("defines exact brand naming and positioning", () => {
      expect(BRAND_CONSTANTS.name).toBe("NXTQR");
      expect(BRAND_CONSTANTS.category).toBe("Interactive Visual Engineering Studio");
      expect(BRAND_CONSTANTS.tagline).toBe("Design. Visualize. Simulate. Understand.");
    });

    it("maintains mathematically centered 128x128 coordinate space", () => {
      expect(LOGO_GEOMETRY.viewBox).toBe("0 0 128 128");
      expect(LOGO_GEOMETRY.center.x).toBe(64);
      expect(LOGO_GEOMETRY.center.y).toBe(64);
      expect(LOGO_GEOMETRY.cornerFraming.radius).toBe(6);
      expect(LOGO_GEOMETRY.cornerFraming.strokeWidth).toBe(3.5);
    });

    it("defines the aperture as a silhouette with a cutout", () => {
      expect(LOGO_GEOMETRY.aperturePath.match(/M /g)).toHaveLength(2);
    });
  });

  describe("Wordmark Typography Fallback Rules", () => {
    it("specifies Geist Sans as primary with strict system fallback stack", () => {
      expect(WORDMARK_TYPOGRAPHY.primaryFont).toBe("Geist Sans");
      expect(WORDMARK_TYPOGRAPHY.fallbackStack).toContain("Geist Sans");
      expect(WORDMARK_TYPOGRAPHY.fallbackStack).toContain("-apple-system");
      expect(WORDMARK_TYPOGRAPHY.fallbackStack).toContain("'Segoe UI'");
      expect(WORDMARK_TYPOGRAPHY.fallbackStack).toContain("sans-serif");
    });

    it("enforces bold font weight and optical tracking", () => {
      expect(WORDMARK_TYPOGRAPHY.fontWeight).toBe(700);
      expect(WORDMARK_TYPOGRAPHY.letterSpacing).toBe("-0.04em");
    });

    it("defines strict optical kerning adjustments", () => {
      expect(WORDMARK_TYPOGRAPHY.kerningRules["N-X"]).toBe("-0.02em");
      expect(WORDMARK_TYPOGRAPHY.kerningRules["X-T"]).toBe("-0.04em");
      expect(WORDMARK_TYPOGRAPHY.kerningRules["T-Q"]).toBe("-0.05em");
      expect(WORDMARK_TYPOGRAPHY.kerningRules["Q-R"]).toBe("-0.03em");
    });
  });

  describe("SVG Generation Utilities", () => {
    it("exports the same single path and cutout as the React mark", () => {
      const svg = generateSvgMarkup({ showFraming: false });
      const html = renderToString(React.createElement(LogoMark, { variant: "minimal" }));
      for (const markup of [svg, html]) {
        expect(markup).toContain('viewBox="12 12 104 104"');
        expect(markup.match(/<path /g)).toHaveLength(1);
        expect(markup).toContain(LOGO_GEOMETRY.aperturePath);
        expect(markup).toContain('fill-rule="evenodd"');
      }
    });

    it("generates full horizontal lockup SVG with wordmark", () => {
      const svg = generateSvgMarkup({ includeWordmark: true });
      expect(svg).toContain('viewBox="0 0 380 96"');
      expect(svg).toContain("NXTQR");
      expect(svg).toContain("INTERACTIVE VISUAL ENGINEERING STUDIO");
    });
  });

  describe("React Brand Components", () => {
    it("renders LogoMark with accessible role and title", () => {
      const html = renderToString(React.createElement(LogoMark, { title: "NXTQR Studio" }));
      expect(html).toContain('role="img"');
      expect(html).toContain('aria-label="NXTQR Studio"');
      expect(html).toContain("<title>NXTQR Studio</title>");
      expect(html).toContain('stroke-width="3.5"');
    });

    it("renders LogoMark as presentation when unlabelled", () => {
      const html = renderToString(React.createElement(LogoMark, {}));
      expect(html).toContain('role="presentation"');
      expect(html).toContain('aria-hidden="true"');
    });

    it("renders LogoWordmark with category subtitle", () => {
      const html = renderToString(React.createElement(LogoWordmark, { showCategory: true }));
      expect(html).toContain("NXTQR");
      expect(html).toContain("Interactive Visual Engineering Studio");
    });

    it("renders AppLogo in full lockup mode", () => {
      const html = renderToString(React.createElement(AppLogo, { variant: "full" }));
      expect(html).toContain("<svg");
      expect(html).toContain("NXTQR");
    });

    it("renders AppLogo in stacked lockup mode", () => {
      const html = renderToString(React.createElement(AppLogo, { variant: "stacked" }));
      expect(html).toContain("flex-col");
      expect(html).toContain("items-center");
    });

    it("renders AnimatedLogo with keyframe style definitions and reduced motion queries", () => {
      const html = renderToString(React.createElement(AnimatedLogo, { mode: "entrance" }));
      expect(html).toContain('data-nxtqr-motion="entrance"');
      expect(html).toContain("nxtqrSettle");
      expect(html).toContain("prefers-reduced-motion: no-preference");
    });

    it("renders the same aperture on both monochrome icon tiles", () => {
      const black = renderToString(React.createElement(AppIcon));
      expect(black).toContain('viewBox="12 12 104 104"');
      expect(black).toMatch(/<rect[^>]+fill="#000000"/);
      expect(black).toMatch(/<path[^>]+fill="#FFFFFF"/);

      const white = renderToString(React.createElement(AppIcon, { type: "white" }));
      expect(white).toMatch(/<rect[^>]+fill="#FFFFFF"/);
      expect(white).toMatch(/<path[^>]+fill="#000000"/);
    });
  });
});
