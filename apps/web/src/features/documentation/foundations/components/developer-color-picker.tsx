"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  getContrastRatio,
  getAccessibleForeground,
  type RgbColor,
  type HslColor,
} from "@nxtqr/design-system";
import {
  EyedropperIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
} from "@nxtqr/icons";

export interface DeveloperColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
  className?: string;
  onReset?: () => void;
  defaultColor?: string;
}

type ColorFormat = "HEX" | "RGB" | "HSL";

export function DeveloperColorPicker({
  color,
  onChange,
  className,
  onReset,
  defaultColor = "#0066FF",
}: DeveloperColorPickerProps) {
  const [format, setFormat] = React.useState<ColorFormat>("HEX");
  const [copied, setCopied] = React.useState(false);
  const [inputVal, setInputVal] = React.useState(color.toUpperCase());
  const [hasEyeDropper, setHasEyeDropper] = React.useState(false);

  // Sync internal input state when prop changes externally
  React.useEffect(() => {
    setInputVal(color.toUpperCase());
  }, [color]);

  // Check if browser supports native EyeDropper API
  React.useEffect(() => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      setHasEyeDropper(true);
    }
  }, []);

  // Compute Color representations
  const rgb: RgbColor = React.useMemo(() => {
    return hexToRgb(color) ?? { r: 0, g: 102, b: 255 };
  }, [color]);

  const hsl: HslColor = React.useMemo(() => {
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  }, [rgb]);

  const contrastRatio = React.useMemo(() => {
    return getContrastRatio(color, "#000000");
  }, [color]);

  const derivedForeground = React.useMemo(() => {
    return getAccessibleForeground(color);
  }, [color]);

  // Format string for display & copying
  const formattedString = React.useMemo(() => {
    switch (format) {
      case "RGB":
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      case "HSL":
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      case "HEX":
      default:
        return color.toUpperCase();
    }
  }, [format, color, rgb, hsl]);

  // Handle Hex typing with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputVal(raw);

    const clean = raw.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)) {
      let fullHex = clean;
      if (clean.length === 3) {
        fullHex = clean
          .split("")
          .map((c) => c + c)
          .join("");
      }
      onChange(`#${fullHex.toUpperCase()}`);
    }
  };

  // Handle Hue slider change
  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value, 10);
    const newRgb = hslToRgb(newHue, Math.max(hsl.s, 60), Math.max(hsl.l, 30));
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    onChange(newHex);
  };

  // Handle Lightness slider change
  const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLightness = parseInt(e.target.value, 10);
    const newRgb = hslToRgb(hsl.h, hsl.s, newLightness);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    onChange(newHex);
  };

  // Handle EyeDropper tool click
  const handleEyeDropper = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onChange(result.sRGBHex.toUpperCase());
        }
      } catch {
        // User canceled eyedropper selection
      }
    }
  };

  // Handle copy
  const handleCopy = () => {
    navigator.clipboard.writeText(formattedString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Safe 6-character hex for native input
  const safeNativeHex = React.useMemo(() => {
    const clean = color.trim().replace(/^#/, "");
    if (clean.length === 3) {
      return (
        "#" +
        clean
          .split("")
          .map((c) => c + c)
          .join("")
      );
    }
    if (clean.length === 6) {
      return `#${clean}`;
    }
    return "#0066FF";
  }, [color]);

  return (
    <div
      className={cn(
        "p-4 rounded-md border border-border bg-black/60 shadow-level-1 space-y-4 font-mono text-xs",
        className,
      )}
    >
      {/* Top Strip: Swatch + Native Picker + Hex Input + Format Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Swatch button with native picker overlay & Hex input */}
        <div className="flex items-center gap-2">
          {/* Interactive Swatch Pill */}
          <div
            className="relative w-8 h-8 rounded-md border border-subtle-border shadow-level-1 shrink-0 overflow-hidden cursor-pointer group"
            title="Click to open system color picker"
          >
            <div
              className="w-full h-full"
              style={{ backgroundColor: color }}
            />
            {/* Native OS Color Input overlay */}
            <input
              type="color"
              value={safeNativeHex}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              aria-label="Pick custom color"
            />
          </div>

          {/* Hex / Value Field */}
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-muted-foreground select-none text-xs">
              #
            </span>
            <input
              type="text"
              value={inputVal.replace(/^#/, "")}
              onChange={handleInputChange}
              maxLength={6}
              placeholder="0066FF"
              className="h-8 w-24 pl-6 pr-2 rounded-md border border-border bg-surface text-foreground font-mono text-xs uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent shadow-level-1"
              aria-label="Custom Hex Value"
            />
          </div>

          {/* Eyedropper Tool (when supported) */}
          {hasEyeDropper && (
            <button
              type="button"
              onClick={handleEyeDropper}
              className="h-8 w-8 rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-secondary-surface flex items-center justify-center transition-colors cursor-pointer shadow-level-1 shrink-0"
              title="Sample color from screen (Eyedropper)"
              aria-label="Sample color from screen"
            >
              <EyedropperIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right: Format Selector & Copy Value Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center p-0.5 rounded-md bg-secondary-surface border border-subtle-border">
            {(["HEX", "RGB", "HSL"] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormat(fmt)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono transition-colors",
                  format === fmt
                    ? "bg-surface text-foreground font-semibold border border-subtle-border shadow-level-1"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {fmt}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="h-7 px-2.5 rounded border border-border bg-surface text-foreground hover:bg-secondary-surface flex items-center gap-1.5 transition-colors cursor-pointer shadow-level-1 text-[11px]"
            title={`Copy ${formattedString}`}
          >
            {copied ? (
              <>
                <CheckIcon className="h-3 w-3 text-success shrink-0" />
                <span className="text-success font-semibold">Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="hidden xs:inline sm:inline">Copy</span>
              </>
            )}
          </button>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="h-7 px-2 rounded border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-secondary-surface flex items-center gap-1 transition-colors cursor-pointer shadow-level-1 text-[11px]"
              title={`Reset to default (${defaultColor})`}
              aria-label="Reset color"
            >
              <RefreshIcon className="h-3 w-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Middle Strip: Hue Spectrum Slider & Lightness Slider */}
      <div className="space-y-2.5 pt-1 border-t border-subtle-border/60">
        {/* Hue Spectrum */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>HUE SPECTRUM</span>
            <span className="text-foreground font-mono">{hsl.h}°</span>
          </div>
          <div className="relative flex items-center h-4">
            <input
              type="range"
              min={0}
              max={360}
              value={hsl.h}
              onChange={handleHueChange}
              className="w-full h-2 rounded-md appearance-none cursor-pointer outline-none"
              style={{
                background:
                  "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
              }}
              aria-label="Adjust Hue"
            />
          </div>
        </div>

        {/* Lightness Spectrum */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>LIGHTNESS</span>
            <span className="text-foreground font-mono">{hsl.l}%</span>
          </div>
          <div className="relative flex items-center h-4">
            <input
              type="range"
              min={10}
              max={95}
              value={hsl.l}
              onChange={handleLightnessChange}
              className="w-full h-2 rounded-md appearance-none cursor-pointer outline-none"
              style={{
                background: `linear-gradient(to right, #000000 0%, hsl(${hsl.h}, ${hsl.s}%, 50%) 50%, #ffffff 100%)`,
              }}
              aria-label="Adjust Lightness"
            />
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Strip: Readout + Contrast vs Canvas + Foreground Text */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-subtle-border/60 text-[10px]">
        {/* Active Value */}
        <div className="p-2 rounded bg-surface border border-subtle-border flex items-center justify-between">
          <span className="text-muted-foreground">{format} VALUE</span>
          <span className="text-foreground font-bold">{formattedString}</span>
        </div>

        {/* WCAG Contrast vs Canvas */}
        <div className="p-2 rounded bg-surface border border-subtle-border flex items-center justify-between">
          <span className="text-muted-foreground">CONTRAST VS CANVAS</span>
          <span
            className={cn(
              "font-bold",
              contrastRatio >= 4.5 ? "text-success" : contrastRatio >= 3.0 ? "text-amber-400" : "text-destructive",
            )}
          >
            {contrastRatio.toFixed(2)}:1 ({contrastRatio >= 4.5 ? "AAA" : contrastRatio >= 3.0 ? "AA" : "FAIL"})
          </span>
        </div>

        {/* Resolved Foreground */}
        <div className="p-2 rounded bg-surface border border-subtle-border flex items-center justify-between">
          <span className="text-muted-foreground">DERIVED TEXT</span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border border-border"
              style={{ backgroundColor: derivedForeground }}
            />
            <span className="text-foreground font-bold">
              {derivedForeground === "#FFFFFF" ? "White (#FFFFFF)" : "Black (#000000)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
