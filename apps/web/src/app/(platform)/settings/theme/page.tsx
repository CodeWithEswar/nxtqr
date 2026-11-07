"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  SettingsField,
} from "@nxtqr/ui";
import {
  ACCENT_PRESET_LIST,
  getContrastRatio,
  getAccessibleForeground,
  resolveEffectiveAccentHex,
} from "@nxtqr/design-system";
import { useThemeStore } from "@nxtqr/state";
import { CheckIcon, MoonIcon, SunIcon, RefreshIcon, ChevronLeftIcon } from "@nxtqr/icons";

export default function ThemeSettingsPage() {
  const {
    themeMode,
    accentPreset,
    customHex,
    setThemeMode,
    setAccentPreset,
    setCustomHex,
    resetToMonochrome,
  } = useThemeStore();

  const [hexInput, setHexInput] = React.useState(customHex || "");
  const [hexError, setHexError] = React.useState<string | null>(null);

  const effectiveHex = resolveEffectiveAccentHex({
    preset: accentPreset,
    customHex,
    isDarkMode: themeMode === "dark",
  });

  const contrastDark = getContrastRatio(effectiveHex, "#000000").toFixed(2);
  const contrastLight = getContrastRatio(effectiveHex, "#FFFFFF").toFixed(2);
  const accessibleForeground = getAccessibleForeground(effectiveHex);

  const handleHexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = hexInput.trim();
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean)) {
      setHexError("Invalid hex. Expected format #RGB or #RRGGBB (e.g. #F28C52)");
      return;
    }
    setHexError(null);
    setCustomHex(clean);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto space-y-6">
      {/* Back button and title */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="icon-sm" aria-label="Back to Overview">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Theme & User-Selected Accent
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Configure pure black monochrome foundation and dynamic custom accent color
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={resetToMonochrome}>
          <RefreshIcon className="h-3.5 w-3.5 mr-1.5" />
          Reset to Monochrome
        </Button>
      </div>

      {/* Mode selection */}
      <Card>
        <CardHeader>
          <CardTitle>Interface Appearance</CardTitle>
          <CardDescription>
            Pure Black Monochrome is the primary developer theme. Light mode infrastructure is fully
            supported.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsField
            label="Theme Mode"
            description="Toggle between pure black dark mode and neutral light mode"
          >
            <div className="flex items-center gap-1.5">
              <Button
                variant={themeMode === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setThemeMode("dark")}
              >
                <MoonIcon className="h-3.5 w-3.5 mr-1.5" />
                Dark (Default)
              </Button>
              <Button
                variant={themeMode === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setThemeMode("light")}
              >
                <SunIcon className="h-3.5 w-3.5 mr-1.5" />
                Light
              </Button>
            </div>
          </SettingsField>
        </CardContent>
      </Card>

      {/* Preset Accent Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Preset Accent Colors</CardTitle>
          <CardDescription>Select from standard calibrated accent presets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ACCENT_PRESET_LIST.map((preset) => {
              const isSelected = accentPreset === preset.id && !customHex;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setHexInput("");
                    setHexError(null);
                    setAccentPreset(preset.id);
                  }}
                  className={`flex items-center gap-2.5 p-2 rounded-md border text-left text-xs transition-all ${
                    isSelected
                      ? "border-accent bg-secondary-surface shadow-level-3 font-medium"
                      : "border-border bg-surface shadow-level-1 hover:bg-elevated-surface"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-black/20 shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && (
                      <CheckIcon
                        className="h-2.5 w-2.5"
                        style={{ color: getAccessibleForeground(preset.hex) }}
                      />
                    )}
                  </span>
                  <div className="truncate">
                    <span className="font-medium text-foreground">{preset.label}</span>
                    <span className="block text-[10px] text-muted-foreground font-mono">
                      {preset.hex}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom HEX Color Engine */}
      <Card>
        <CardHeader>
          <CardTitle>Custom HEX Accent</CardTitle>
          <CardDescription>
            Enter any valid 3 or 6 digit hex code. Contrast calculations and accessible foreground
            are automatically derived.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleHexSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="#579DFF"
                value={hexInput}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  setHexError(null);
                }}
                className="font-mono text-xs uppercase"
              />
            </div>
            <Button type="submit" size="default">
              Apply Custom Accent
            </Button>
          </form>

          {hexError && <p className="text-xs text-destructive">{hexError}</p>}

          {/* Contrast and Accessibility Metrics */}
          <div className="rounded-md border border-subtle-border bg-surface p-3 space-y-2">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Perceptual Color & Accessibility Diagnostics
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-md border border-border bg-elevated-surface">
                <span className="text-muted-foreground text-[10px] block">Effective Accent</span>
                <span className="font-mono font-medium text-accent">{effectiveHex}</span>
              </div>
              <div className="p-2 rounded-md border border-border bg-elevated-surface">
                <span className="text-muted-foreground text-[10px] block">Contrast on Black</span>
                <span className="font-mono font-medium">
                  {contrastDark}:1{" "}
                  {Number(contrastDark) >= 4.5 ? (
                    <Badge variant="secondary" className="text-[9px] py-0 px-1 ml-1 text-success">
                      AA
                    </Badge>
                  ) : null}
                </span>
              </div>
              <div className="p-2 rounded-md border border-border bg-elevated-surface">
                <span className="text-muted-foreground text-[10px] block">Contrast on White</span>
                <span className="font-mono font-medium">{contrastLight}:1</span>
              </div>
              <div className="p-2 rounded-md border border-border bg-elevated-surface">
                <span className="text-muted-foreground text-[10px] block">Auto Foreground</span>
                <span className="font-mono font-medium">{accessibleForeground}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
