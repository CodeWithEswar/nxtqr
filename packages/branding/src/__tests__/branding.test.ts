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
      expect(LOGO_GEOMETRY.cornerFraming.radius).toBe(7);
      expect(LOGO_GEOMETRY.cornerFraming.strokeWidth).toBe(4.5);
    });

    it("defines the exact folded chrome N ribbon paths", () => {
      expect(LOGO_GEOMETRY.monogram.leftPillarPath).toBeDefined();
      expect(LOGO_GEOMETRY.monogram.innerShadowPath).toBeDefined();
      expect(LOGO_GEOMETRY.monogram.mainRibbonPath).toBeDefined();
      expect(LOGO_GEOMETRY.monogram.rightPillarPath).toBeDefined();
      expect(LOGO_GEOMETRY.monogram.laserBeam.y1).toBe(64);
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
    it("generates valid XML SVG string with liquid chrome gradients", () => {
      const svg = generateSvgMarkup({ colorMode: "accent", showFraming: true });
      expect(svg).toContain('<svg width="128" height="128" viewBox="0 0 128 128"');
      expect(svg).toContain("nxtqrChromeDiag");
      expect(svg).toContain("nxtqrLaserStreak");
      expect(svg).toContain("nxtqrFlareCore");
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
      expect(html).toContain("nxtqrChromeDiag");
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
      expect(html).toContain("nxtqrBracketDraw");
      expect(html).toContain("nxtqrBodyReveal");
      expect(html).toContain("nxtqrTracePulse");
      expect(html).toContain("nxtqrFlareBurst");
      expect(html).toContain("prefers-reduced-motion: no-preference");
    });

    it("renders AppIcon in hero, black, white, and red squircle modes", () => {
      const heroHtml = renderToString(React.createElement(AppIcon, { type: "hero" }));
      expect(heroHtml).toContain('viewBox="0 0 256 256"');
      expect(heroHtml).toContain("appIconSquircleBody");

      const blackHtml = renderToString(React.createElement(AppIcon, { type: "black" }));
      expect(blackHtml).toContain('fill="#0A0A0A"');

      const whiteHtml = renderToString(React.createElement(AppIcon, { type: "white" }));
      expect(whiteHtml).toContain('fill="#FFFFFF"');

      const redHtml = renderToString(
        React.createElement(AppIcon, { type: "red", accentColor: "#FF0000" }),
      );
      expect(redHtml).toContain('fill="#FF0000"');
    });
  });
});
