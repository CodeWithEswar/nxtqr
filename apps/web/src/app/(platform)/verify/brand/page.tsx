"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";
import { RefreshIcon } from "@nxtqr/icons";
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
    { id: "current", label: "Inherit Text Color" },
    { id: "monochrome", label: "Pure Monochrome (White)" },
    { id: "inverse", label: "Inverse (Black on White)" },
  ];

  const scales = [16, 24, 32, 48, 64, 128];

  const assetManifest = [
    {
      name: "favicon.ico",
      type: "ICO (16/32 multi-res)",
      path: "/branding/icons/favicon.ico",
      role: "Browser tab icon",
    },
    {
      name: "favicon.svg",
      type: "SVG Vector",
      path: "/branding/icons/favicon.svg",
      role: "Scalable modern browser favicon",
    },
    {
      name: "app-icon-hero.png",
      type: "PNG 512×512",
      path: "/branding/icons/app-icon-hero.png",
      role: "Large framed app icon",
    },
    {
      name: "app-icon-black.png",
      type: "PNG 256×256",
      path: "/branding/icons/app-icon-black.png",
      role: "Primary app tile",
    },
    {
      name: "app-icon-white.png",
      type: "PNG 256×256",
      path: "/branding/icons/app-icon-white.png",
      role: "Inverse export",
    },
    {
      name: "icon-16.png",
      type: "PNG 16×16",
      path: "/branding/icons/icon-16.png",
      role: "Legacy desktop bookmarks",
    },
    {
      name: "icon-32.png",
      type: "PNG 32×32",
      path: "/branding/icons/icon-32.png",
      role: "Standard desktop browser tabs",
    },
    {
      name: "icon-48.png",
      type: "PNG 48×48",
      path: "/branding/icons/icon-48.png",
      role: "Windows shortcut tiles",
    },
    {
      name: "icon-192.png",
      type: "PNG 192×192",
      path: "/branding/icons/icon-192.png",
      role: "PWA home screen",
    },
    {
      name: "icon-512.png",
      type: "PNG 512×512",
      path: "/branding/icons/icon-512.png",
      role: "PWA splash screen & high-DPI",
    },
    {
      name: "apple-touch-icon.png",
      type: "PNG 180×180",
      path: "/branding/icons/apple-touch-icon.png",
      role: "iOS Home Screen & Safari Web Clip",
    },
    {
      name: "maskable-icon-512.png",
      type: "PNG 512×512",
      path: "/branding/icons/maskable-icon-512.png",
      role: "Android adaptive icon with safe margins",
    },
    {
      name: "opengraph-image.png",
      type: "PNG 1200×630",
      path: "/branding/social/opengraph-image.png",
      role: "Social preview (Slack, Discord, LinkedIn)",
    },
    {
      name: "twitter-image.png",
      type: "PNG 1200×600",
      path: "/branding/social/twitter-image.png",
      role: "X / Twitter summary_large_image",
    },
    {
      name: "readme-banner.png",
      type: "PNG 1200×380",
      path: "/branding/banners/readme-banner.png",
      role: "GitHub README header banner",
    },
    {
      name: "social-avatar.png",
      type: "PNG 400×400",
      path: "/branding/social/social-avatar.png",
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
      />

      <main className="flex-1 w-full max-w-[2400px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6">

      {/* Main Interactive Stage */}
      <Card className="surface-raised">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-lg">Logo Verification Stage</CardTitle>
              <CardDescription className="text-xs">
                Inspect variant rendering, color modes, entrance animation, and reduced-motion
                behavior.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnimKey((k) => k + 1)}
                disabled={loadingMode || reducedMotionSim}
                className="h-8 px-2 sm:px-2.5 text-xs font-mono gap-1.5 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 shadow-level-1 active:shadow-level-3 justify-center"
              >
                <RefreshIcon className="h-3.5 w-3.5 shrink-0" />
                <span>Replay</span>
              </Button>
              <Button
                variant={loadingMode ? "default" : "outline"}
                size="sm"
                onClick={() => setLoadingMode((enabled) => !enabled)}
                aria-pressed={loadingMode}
                className="h-8 px-2 sm:px-2.5 text-xs font-mono rounded-md border-border-default shadow-level-1 active:shadow-level-3 justify-center"
              >
                {loadingMode ? "Stop Loop" : "Test Loading"}
              </Button>
              <Button
                variant={reducedMotionSim ? "default" : "outline"}
                size="sm"
                onClick={() => setReducedMotionSim((enabled) => !enabled)}
                aria-pressed={reducedMotionSim}
                className="h-8 px-2 sm:px-2.5 text-xs font-mono rounded-md border-border-default shadow-level-1 active:shadow-level-3 justify-center"
              >
                <span className="sm:hidden">Motion: {reducedMotionSim ? "Off" : "On"}</span>
                <span className="hidden sm:inline">Motion: {reducedMotionSim ? "Reduced" : "Std"}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3.5 sm:p-4 bg-surface border border-border-default rounded-md shadow-level-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
              {/* Variant Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                  Variant
                </span>
                <Select value={variant} onValueChange={(val) => setVariant(val as LogoVariant)}>
                  <SelectTrigger aria-label="Logo variant" className="h-8 w-full font-mono text-xs bg-surface-01 border-border-default hover:bg-surface-03 transition-colors shadow-level-1">
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-02 border-border-strong shadow-level-2">
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="font-mono text-xs cursor-pointer">
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Mode Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                  Color Mode
                </span>
                <Select value={colorMode} onValueChange={(val) => setColorMode(val as LogoColorMode)}>
                  <SelectTrigger aria-label="Logo color" className="h-8 w-full font-mono text-xs bg-surface-01 border-border-default hover:bg-surface-03 transition-colors shadow-level-1">
                    <SelectValue placeholder="Select color mode" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-02 border-border-strong shadow-level-2">
                    {colorModes.map((cm) => (
                      <SelectItem key={cm.id} value={cm.id} className="font-mono text-xs cursor-pointer">
                        {cm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>

          {/* Featured Canvas Presentation */}
          <div
            className={`p-3 sm:p-12 rounded-md border flex items-center justify-center transition-colors min-h-[180px] sm:min-h-[220px] overflow-x-auto ${
              colorMode === "inverse"
                ? "bg-white border-border-strong text-black shadow-level-1"
                : "bg-black border-border shadow-level-1"
            }`}
          >
            <div
              key={animKey}
              className={`min-w-0 [&_svg]:size-[clamp(40px,10vw,72px)] ${
                reducedMotionSim ? "[&_*]:!animation-none [&_*]:!transition-none" : ""
              }`}
            >
              {loadingMode ? (
                <AnimatedLogo
                  size={40}
                  variant={variant === "minimal" ? "minimal" : "symbol"}
                  colorMode={colorMode}
                  mode="loading"
                />
              ) : (
                <AppLogo
                  variant={variant}
                  size={40}
                  colorMode={colorMode}
                  animated={true}
                  animationMode="entrance"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Icon System</CardTitle>
          <CardDescription>
            The two terminals represent system components. A diagonal channel connects them inside the engineering viewport.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:gap-4">
          <figure className="flex min-w-0 flex-col items-center gap-3 rounded-md border border-border-default bg-surface-01 p-4">
            <AppIcon className="size-[clamp(48px,20vw,160px)] max-w-full" />
            <figcaption className="text-center font-mono text-xs text-muted-foreground">
              Primary app icon
            </figcaption>
          </figure>
          <figure className="flex min-w-0 flex-col items-center gap-3 rounded-md border border-border-default bg-surface-01 p-4">
            <AppIcon type="white" className="size-[clamp(48px,20vw,160px)] max-w-full" />
            <figcaption className="text-center font-mono text-xs text-muted-foreground">
              Inverse export
            </figcaption>
          </figure>
        </CardContent>
      </Card>

      {/* Multi-Scale Verification Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Scale Verification</CardTitle>
          <CardDescription>
            Ensures geometric balance, recognizable silhouette, and corner-bracket sharpness from
            16px to 128px.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-4">
            {scales.map((s) => (
              <div
                key={s}
                className="flex flex-col items-center justify-between p-4 bg-surface border border-border rounded-md shadow-level-1 min-h-48"
              >
                <span className="font-mono text-[10px] text-muted-foreground">
                  {s} × {s}px
                </span>
                <div className="flex items-center justify-center flex-1">
                  <LogoMark size={s} variant={s < 32 ? "minimal" : "symbol"} />
                </div>
                <span className="font-mono text-[9px] text-muted-foreground/60">
                  {s < 32 ? "Compact mark" : "Framed mark"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Wordmark Typography & Fallback System */}
      <Card>
        <CardHeader>
          <CardTitle>Wordmark Typography</CardTitle>
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
          <div className="border border-border rounded-md overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Deterministic Asset Inventory</CardTitle>
              <CardDescription>
                Exports generated from the shared vector geometry.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-md overflow-x-auto">
            <table className="w-full text-xs min-w-[440px]">
              <thead className="bg-elevated-surface border-b border-border text-muted-foreground font-mono">
                <tr>
                  <th className="py-2 px-3 text-left">File Name</th>
                  <th className="py-2 px-3 text-left">Format & Dimensions</th>
                  <th className="py-2 px-3 text-left">Use Case</th>
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
                    <td className="py-2 px-3 text-muted-foreground">{item.role}</td>
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
