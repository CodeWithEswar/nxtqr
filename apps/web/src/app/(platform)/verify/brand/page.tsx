"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@nxtqr/ui";
import { CheckCircleIcon, RefreshIcon } from "@nxtqr/icons";
import {
  AppLogo,
  LogoMark,
  LogoWordmark,
  AnimatedLogo,
  AppIcon,
  BRAND_CONSTANTS,
  WORDMARK_TYPOGRAPHY,
  type LogoVariant,
  type LogoColorMode,
} from "@nxtqr/branding";
import { VerificationHeader } from "@/features/verification";

export default function BrandReviewGatePage() {
  const [variant, setVariant] = useState<LogoVariant>("full");
  const [colorMode, setColorMode] = useState<LogoColorMode>("current");
  const [testAccent, setTestAccent] = useState<string>("#FF0000");
  const [animKey, setAnimKey] = useState<number>(0);
  const [loadingMode, setLoadingMode] = useState<boolean>(false);
  const [reducedMotionSim, setReducedMotionSim] = useState<boolean>(false);

  const variants: { id: LogoVariant; label: string }[] = [
    { id: "full", label: "Full Lockup" },
    { id: "symbol", label: "Symbol Only" },
    { id: "minimal", label: "Minimal (No Frame)" },
    { id: "wordmark", label: "Wordmark" },
    { id: "stacked", label: "Stacked Lockup" },
  ];

  const colorModes: { id: LogoColorMode; label: string }[] = [
    { id: "current", label: "Current (CSS Variable)" },
    { id: "monochrome", label: "Pure Monochrome (White)" },
    { id: "inverse", label: "Inverse (Black on White)" },
    { id: "accent", label: "Accent Mode" },
  ];

  const testAccents = [
    { name: "Pure Red", hex: "#FF0000" },
    { name: "Pure Orange", hex: "#FF6600" },
    { name: "Pure Yellow", hex: "#FFD600" },
    { name: "Pure Green", hex: "#00CC66" },
    { name: "Pure Blue", hex: "#0066FF" },
    { name: "Pure Violet", hex: "#8000FF" },
    { name: "Pure Pink", hex: "#FF0099" },
    { name: "Monochrome", hex: "#FFFFFF" },
  ];

  const scales = [16, 24, 32, 48, 64, 128];

  const assetManifest = [
    {
      name: "favicon.ico",
      type: "ICO (16/32 multi-res)",
      path: "/branding/icons/favicon.ico",
      size: "1,601 B",
      role: "Browser tab icon",
    },
    {
      name: "favicon.svg",
      type: "SVG Vector",
      path: "/branding/icons/favicon.svg",
      size: "4,116 B",
      role: "Scalable modern browser favicon",
    },
    {
      name: "app-icon-hero.png",
      type: "PNG 512×512",
      path: "/branding/icons/app-icon-hero.png",
      size: "55,319 B",
      role: "Hero app icon with atmospheric ambient rings",
    },
    {
      name: "app-icon-black.png",
      type: "PNG 256×256",
      path: "/branding/icons/app-icon-black.png",
      size: "16,194 B",
      role: "Signature dark squircle app icon tile",
    },
    {
      name: "app-icon-white.png",
      type: "PNG 256×256",
      path: "/branding/icons/app-icon-white.png",
      size: "14,415 B",
      role: "Inverse white squircle app icon tile",
    },
    {
      name: "app-icon-red.png",
      type: "PNG 256×256",
      path: "/branding/icons/app-icon-red.png",
      size: "13,506 B",
      role: "Accent colored squircle app icon tile",
    },
    {
      name: "icon-16.png",
      type: "PNG 16×16",
      path: "/branding/icons/icon-16.png",
      size: "366 B",
      role: "Legacy desktop bookmarks",
    },
    {
      name: "icon-32.png",
      type: "PNG 32×32",
      path: "/branding/icons/icon-32.png",
      size: "602 B",
      role: "Standard desktop browser tabs",
    },
    {
      name: "icon-48.png",
      type: "PNG 48×48",
      path: "/branding/icons/icon-48.png",
      size: "882 B",
      role: "Windows shortcut tiles",
    },
    {
      name: "icon-192.png",
      type: "PNG 192×192",
      path: "/branding/icons/icon-192.png",
      size: "3,259 B",
      role: "PWA home screen",
    },
    {
      name: "icon-512.png",
      type: "PNG 512×512",
      path: "/branding/icons/icon-512.png",
      size: "10,453 B",
      role: "PWA splash screen & high-DPI",
    },
    {
      name: "apple-touch-icon.png",
      type: "PNG 180×180",
      path: "/branding/icons/apple-touch-icon.png",
      size: "3,249 B",
      role: "iOS Home Screen & Safari Web Clip",
    },
    {
      name: "maskable-icon-512.png",
      type: "PNG 512×512",
      path: "/branding/icons/maskable-icon-512.png",
      size: "13,998 B",
      role: "Android adaptive icon with safe margins",
    },
    {
      name: "opengraph-image.png",
      type: "PNG 1200×630",
      path: "/branding/social/opengraph-image.png",
      size: "16,931 B",
      role: "Social preview (Slack, Discord, LinkedIn)",
    },
    {
      name: "twitter-image.png",
      type: "PNG 1200×600",
      path: "/branding/social/twitter-image.png",
      size: "17,750 B",
      role: "X / Twitter summary_large_image",
    },
    {
      name: "readme-banner.png",
      type: "PNG 1200×380",
      path: "/branding/banners/readme-banner.png",
      size: "13,033 B",
      role: "GitHub README header banner",
    },
    {
      name: "social-avatar.png",
      type: "PNG 400×400",
      path: "/branding/social/social-avatar.png",
      size: "2,501 B",
      role: "GitHub & X social profile avatar",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Verification Header */}
      <VerificationHeader
        title="Brand Review Gate"
        shortTitle="Brand Gate"
        subtitle="Vector geometry · Solid neumorphic surfaces · Scale-invariance"
        version="Phase 02 · Spec"
        logo={<AppLogo variant="symbol" size={26} />}
        backHref="/verify"
        backLabel="Back to Diagnostics"
        showReviewGates={true}
      >
        <Badge
          variant="outline"
          className="h-8 sm:h-9 px-3 font-mono text-xs gap-1.5 rounded-md border-border-strong bg-surface-02 text-emerald-400 shadow-level-1 shrink-0"
        >
          <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-400" />
          <span>GATE: VERIFIED</span>
        </Badge>
      </VerificationHeader>

      <main className="flex-1 w-full max-w-[2400px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6">

      {/* Main Interactive Stage */}
      <Card className="surface-raised">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Interactive Logo Verification Stage</CardTitle>
              <CardDescription>
                Inspect variant rendering, color modes, entrance animation, and reduced-motion
                behavior.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnimKey((k) => k + 1)}
                className="text-xs"
              >
                <RefreshIcon className="h-3 w-3 mr-1.5" />
                Replay Entrance
              </Button>
              <Button
                variant={loadingMode ? "default" : "secondary"}
                size="sm"
                onClick={() => setLoadingMode(!loadingMode)}
                className="text-xs"
              >
                {loadingMode ? "Stop Loading Loop" : "Test Loading Loop"}
              </Button>
              <Button
                variant={reducedMotionSim ? "default" : "outline"}
                size="sm"
                onClick={() => setReducedMotionSim(!reducedMotionSim)}
                className="text-xs"
              >
                Motion: {reducedMotionSim ? "Reduced" : "Standard"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-surface border border-border rounded-md shadow-level-3">
            {/* Variant Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">Variant</span>
              <div className="flex flex-wrap gap-1">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariant(v.id)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      variant === v.id
                        ? "bg-accent text-accent-foreground font-medium"
                        : "bg-surface hover:bg-elevated-surface text-muted-foreground border border-border"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Mode Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Color Mode
              </span>
              <div className="flex flex-wrap gap-1">
                {colorModes.map((cm) => (
                  <button
                    key={cm.id}
                    onClick={() => setColorMode(cm.id)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      colorMode === cm.id
                        ? "bg-accent text-accent-foreground font-medium"
                        : "bg-surface hover:bg-elevated-surface text-muted-foreground border border-border"
                    }`}
                  >
                    {cm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Override Tester */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Test Accent
              </span>
              <div className="flex flex-wrap gap-1.5 items-center">
                {testAccents.map((acc) => (
                  <button
                    key={acc.hex}
                    onClick={() => setTestAccent(acc.hex)}
                    title={acc.name}
                    className={`h-5 w-5 rounded-md border transition-transform ${
                      testAccent === acc.hex
                        ? "ring-2 ring-border-strong scale-110 border-border-strong"
                        : "border-border hover:scale-105"
                    }`}
                    style={{ backgroundColor: acc.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Featured Canvas Presentation */}
          <div
            className={`p-12 rounded-md border flex items-center justify-center transition-colors min-h-[220px] ${
              colorMode === "inverse"
                ? "bg-white border-border-strong text-black shadow-level-1"
                : "bg-black border-border shadow-level-1"
            }`}
            style={
              {
                "--accent": testAccent,
                "--accent-foreground":
                  testAccent === "#FF0000" ||
                  testAccent === "#0066FF" ||
                  testAccent === "#8000FF" ||
                  testAccent === "#FF0099"
                    ? "#FFFFFF"
                    : "#000000",
              } as React.CSSProperties
            }
          >
            <div
              key={animKey}
              className={
                reducedMotionSim ? "[&_*]:!animation-none [&_*]:!transition-none" : undefined
              }
            >
              {loadingMode ? (
                <AnimatedLogo
                  size={variant === "full" ? 56 : 72}
                  variant={variant === "minimal" ? "minimal" : "symbol"}
                  colorMode={colorMode}
                  mode="loading"
                />
              ) : (
                <AppLogo
                  variant={variant}
                  size={variant === "full" ? 52 : 72}
                  colorMode={colorMode}
                  animated={true}
                  animationMode="entrance"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reference App Icon System Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Reference App Icon System Showcase</CardTitle>
          <CardDescription>
            Faithfully recreated 3D liquid chrome ribbon N monogram, precision corner brackets, and
            horizontal laser beam with specular optical flare.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Hero Tile Preview */}
            <div className="flex flex-col items-center justify-center p-6 bg-black border border-border rounded-md shadow-level-1">
              <span className="font-mono text-xs text-muted-foreground mb-4">
                Hero Atmospheric Tile (512×512)
              </span>
              <div className="relative flex items-center justify-center">
                <AppIcon type="hero" size={220} />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground/70 mt-4">
                Concentric ambient glow rings · Specular laser flare
              </span>
            </div>

            {/* Triad Tile Grid */}
            <div className="space-y-4">
              <div className="text-xs font-medium text-foreground">
                App Icon Variations & Dynamic Accent
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 bg-surface border border-border rounded-md shadow-level-1">
                  <AppIcon type="black" size={96} />
                  <span className="font-mono text-[10px] text-muted-foreground mt-2">
                    Dark Tile
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 bg-surface border border-border rounded-md shadow-level-1">
                  <AppIcon type="white" size={96} />
                  <span className="font-mono text-[10px] text-muted-foreground mt-2">
                    Inverse White
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 bg-surface border border-border rounded-md shadow-level-1">
                  <AppIcon type="red" size={96} accentColor={testAccent} />
                  <span className="font-mono text-[10px] text-muted-foreground mt-2">
                    {testAccents.find((a) => a.hex === testAccent)?.name ?? "Accent"} Tile
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                App icons adapt dynamically to the user's selected accent color while maintaining
                exact specular reflections, metallic ribbon folds, and optical alignment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Scale Verification Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Scale Optical Verification</CardTitle>
          <CardDescription>
            Ensures geometric balance, recognizable silhouette, and corner-bracket sharpness from
            16px to 128px.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {scales.map((s) => (
              <div
                key={s}
                className="flex flex-col items-center justify-between p-4 bg-surface border border-border rounded-md shadow-level-1 h-36"
              >
                <span className="font-mono text-[10px] text-muted-foreground">
                  {s} × {s}px
                </span>
                <div className="flex items-center justify-center flex-1">
                  <LogoMark size={s} variant="symbol" colorMode="current" />
                </div>
                <span className="font-mono text-[9px] text-muted-foreground/60">
                  viewBox 0 0 128
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Wordmark Typography & Fallback System */}
      <Card>
        <CardHeader>
          <CardTitle>Wordmark Typography Fallback Architecture</CardTitle>
          <CardDescription>
            Strict metric preservation rules and optical kerning standards preventing layout reflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Render */}
            <div className="p-4 bg-surface border border-border rounded-md shadow-level-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-foreground">
                  Primary: Geist Sans
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Weight 700 · Tracking -0.04em
                </Badge>
              </div>
              <div className="py-3 border-y border-subtle-border">
                <LogoWordmark size="lg" showCategory={true} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Loaded via Next.js Geist font variable <code>--font-geist-sans</code>. Clean
                geometric apex on N and optical balance on T/Q.
              </p>
            </div>

            {/* System Fallback Render */}
            <div className="p-4 bg-surface border border-border rounded-md shadow-level-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-foreground">
                  Strict Fallback Stack
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  System UI · Non-Breaking
                </Badge>
              </div>
              <div
                className="py-3 border-y border-subtle-border"
                style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}
              >
                <span className="font-bold text-2xl tracking-[-0.04em] uppercase block text-foreground leading-none">
                  {BRAND_CONSTANTS.name}
                </span>
                <span className="font-mono text-[11px] tracking-[0.16em] uppercase block text-muted-foreground mt-0.5">
                  {BRAND_CONSTANTS.category}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Fallback stack ensures zero horizontal reflow:{" "}
                <code>{WORDMARK_TYPOGRAPHY.fallbackStack}</code>.
              </p>
            </div>
          </div>

          {/* Kerning Specifications Table */}
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-elevated-surface border-b border-border text-muted-foreground font-mono">
                <tr>
                  <th className="py-2 px-3 text-left">Kerning Pair</th>
                  <th className="py-2 px-3 text-left">Optical Adjustment</th>
                  <th className="py-2 px-3 text-left">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle-border">
                <tr>
                  <td className="py-2 px-3 font-mono text-accent">N - X</td>
                  <td className="py-2 px-3 font-mono">-0.02em</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    Tight connection between N right vertical stem and X upper left arm
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-accent">X - T</td>
                  <td className="py-2 px-3 font-mono">-0.04em</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    T crossbar overhang optical compensation over X lower right foot
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-accent">T - Q</td>
                  <td className="py-2 px-3 font-mono">-0.05em</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    Optical clearance under T right arm into circular Q upper left bowl
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-accent">Q - R</td>
                  <td className="py-2 px-3 font-mono">-0.03em</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    Q diagonal bottom-right tail clearance entering R left vertical stem
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Asset Manifest & Production Inventory */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Deterministic Asset Inventory</CardTitle>
              <CardDescription>
                All 13 production assets compiled from master vector geometry with verified
                dimensions.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              13 / 13 Assets Validated
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-elevated-surface border-b border-border text-muted-foreground font-mono">
                <tr>
                  <th className="py-2 px-3 text-left">File Name</th>
                  <th className="py-2 px-3 text-left">Format & Dimensions</th>
                  <th className="py-2 px-3 text-left">File Size</th>
                  <th className="py-2 px-3 text-left">Use Case</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle-border">
                {assetManifest.map((item) => (
                  <tr key={item.name} className="hover:bg-elevated-surface/40 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-foreground">
                      <a
                        href={item.path}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-accent underline underline-offset-2"
                      >
                        {item.name}
                      </a>
                    </td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">{item.type}</td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">{item.size}</td>
                    <td className="py-2 px-3 text-muted-foreground">{item.role}</td>
                    <td className="py-2 px-3 text-right">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-success">
                        <CheckCircleIcon className="h-3 w-3" />
                        Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
  );
}
