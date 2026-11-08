"use client";

import * as React from "react";
import { focusRingClasses } from "@nxtqr/design-system";
import {
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@nxtqr/ui";
import { CheckIcon, CloseIcon, RefreshIcon, MoreHorizontalIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";
import { ContrastMeter } from "../components/contrast-meter";
import { cn } from "@nxtqr/utils";

export function AccessibilityLab() {
  const [activeTab, setActiveTab] = React.useState<"focus" | "touch" | "contrast" | "keyboard">("focus");
  const [showTouchTargets, setShowTouchTargets] = React.useState<boolean>(true);
  const [rovingIndex, setRovingIndex] = React.useState<number>(0);

  const toolbarButtons = ["Select", "Pan", "Connect", "Cut", "Props"];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setRovingIndex((prev) => (prev + 1) % toolbarButtons.length);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setRovingIndex((prev) => (prev - 1 + toolbarButtons.length) % toolbarButtons.length);
    }
  };

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div>
          <h3 className="text-sm font-semibold font-sans text-foreground">
            Accessibility & WCAG 2.1 Laboratory
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluate high-contrast focus rings, 44×44px touch targets, roving tabindex keyboard traversal, and contrast compliance.
          </p>
        </div>

        {/* Responsive Tab Navigation & Three-Dots Dropdown Menu */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary-surface border border-border rounded-md self-start sm:self-auto shrink-0 flex-nowrap">
          {/* Mobile Single Tab Pill (< sm) */}
          <div className="flex sm:hidden items-center gap-1">
            <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-surface border border-subtle-border rounded text-foreground capitalize">
              {activeTab}
            </span>
          </div>

          {/* Primary View Tabs (Visible on >= sm) */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { id: "focus" as const, label: "Focus" },
              { id: "touch" as const, label: "Touch" },
              { id: "keyboard" as const, label: "Keyboard" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? "bg-surface text-foreground font-semibold border border-subtle-border shadow-level-1"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}

            {/* Contrast Tab (Only visible on wide desktop >= lg to prevent tablet header collision) */}
            <button
              type="button"
              onClick={() => setActiveTab("contrast")}
              className={cn(
                "hidden lg:inline-block px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors",
                activeTab === "contrast"
                  ? "bg-surface text-foreground font-semibold border border-subtle-border shadow-level-1"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Contrast
            </button>
          </div>

          {/* Three-Dots Dropdown Menu (Always accessible for compact overflow & quick lab actions) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "px-2 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer",
                  activeTab === "contrast"
                    ? "bg-surface text-foreground font-semibold border border-subtle-border shadow-level-1"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/50",
                )}
                aria-label="More laboratory options"
              >
                {/* On tablet where Contrast is hidden from main row, show its label when selected */}
                {activeTab === "contrast" && (
                  <span className="lg:hidden text-foreground font-semibold">Contrast</span>
                )}
                <MoreHorizontalIcon className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 font-mono text-xs">
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-wider">
                Laboratory Views
              </DropdownMenuLabel>
              {[
                { id: "focus" as const, label: "Focus Rings" },
                { id: "touch" as const, label: "Touch Targets" },
                { id: "keyboard" as const, label: "Keyboard Matrix" },
                { id: "contrast" as const, label: "Contrast Inspector" },
              ].map((tab) => (
                <DropdownMenuItem
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className={cn(activeTab === tab.id && "text-accent font-semibold")}>
                    {tab.label}
                  </span>
                  {activeTab === tab.id && <CheckIcon className="h-3.5 w-3.5 text-accent" />}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-wider">
                Laboratory Actions
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setShowTouchTargets((prev) => !prev)}
                className="cursor-pointer flex items-center justify-between"
              >
                <span>44px Bounds Overlay</span>
                <span className="text-[10px] font-mono text-accent">
                  {showTouchTargets ? "ON" : "OFF"}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveTab("focus");
                  setShowTouchTargets(true);
                  setRovingIndex(0);
                }}
                className="cursor-pointer flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RefreshIcon className="h-3 w-3" />
                <span>Reset Laboratory</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stage */}
      {activeTab === "focus" && (
        <div className="space-y-4">
          <div className="p-6 bg-black border border-subtle-border rounded-md space-y-6">
            <div className="text-xs font-mono text-muted-foreground">
              TRY PRESSING <kbd className="px-1.5 py-0.5 bg-secondary-surface border border-border rounded text-foreground">TAB</kbd> TO TEST ACCESSIBLE FOCUS RINGS
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Compliant NXTQR Focus Ring */}
              <div className="p-4 rounded-md border border-border bg-elevated-surface space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CheckIcon className="h-3.5 w-3.5 text-accent" />
                    Standard Focus Ring (Compliant)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono text-accent">1px Ring + Offset</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Visible across pure black and elevated surfaces with a dedicated 1px offset.
                </p>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    className={cn(
                      "px-3 py-2 text-xs font-sans rounded-md border border-border bg-surface text-foreground text-left",
                      focusRingClasses
                    )}
                  >
                    Interactive Button (Tab to focus me)
                  </button>
                  <input
                    type="text"
                    placeholder="Input field with focus ring..."
                    className={cn(
                      "px-3 py-2 text-xs font-mono rounded-md border border-border bg-black text-foreground",
                      focusRingClasses
                    )}
                  />
                </div>
              </div>

              {/* Prohibited Inaccessible Outlines */}
              <div className="p-4 rounded-md border border-border bg-elevated-surface space-y-3 opacity-80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CloseIcon className="h-3.5 w-3.5 text-red-500" />
                    Removed Outline (Prohibited)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono text-red-500">Fails WCAG 2.4.7</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Using <code className="text-foreground">outline-none</code> without a custom ring leaves keyboard users stranded.
                </p>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    className="px-3 py-2 text-xs font-sans rounded-md border border-border bg-surface text-foreground text-left outline-none"
                  >
                    No focus ring (Inaccessible)
                  </button>
                  <input
                    type="text"
                    placeholder="Input without focus ring..."
                    className="px-3 py-2 text-xs font-mono rounded-md border border-border bg-black text-foreground outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-secondary-surface border border-border rounded-md font-mono text-xs text-foreground">
            <span className="text-muted-foreground">Standard Utility: </span>
            <code className="text-accent">{focusRingClasses}</code>
          </div>
        </div>
      )}

      {activeTab === "touch" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              WCAG 2.5.5 / 2.5.8 requires a minimum target size of 44×44px (or 24×24px with spacing) for pointer inputs.
            </div>
            <button
              onClick={() => setShowTouchTargets(!showTouchTargets)}
              className="text-xs font-mono text-accent hover:underline"
            >
              Toggle 44px Bounds ({showTouchTargets ? "Visible" : "Hidden"})
            </button>
          </div>

          <div className="p-8 bg-black border border-subtle-border rounded-md flex flex-wrap items-center justify-center gap-8">
            {/* 28px Icon Button with 44px Touch Target */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "relative flex items-center justify-center",
                  showTouchTargets && "border-2 border-dashed border-accent/60 bg-accent/5"
                )}
                style={{ width: "44px", height: "44px" }}
              >
                <button
                  aria-label="Refresh node"
                  className="w-7 h-7 rounded-md border border-border bg-elevated-surface flex items-center justify-center text-foreground hover:bg-surface"
                >
                  <RefreshIcon className="h-3.5 w-3.5" />
                </button>
                {showTouchTargets && (
                  <span className="absolute -bottom-5 text-[9px] font-mono text-accent">44×44px</span>
                )}
              </div>
              <span className="text-xs font-mono text-muted-foreground mt-4">Compact Icon Button</span>
            </div>

            {/* Standard 36px Button with 44px Touch Envelope */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "relative flex items-center justify-center px-2",
                  showTouchTargets && "border-2 border-dashed border-accent/60 bg-accent/5"
                )}
                style={{ minHeight: "44px" }}
              >
                <button
                  className="h-9 px-4 rounded-md bg-accent text-accent-foreground text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Commit Changes
                </button>
                {showTouchTargets && (
                  <span className="absolute -bottom-5 text-[9px] font-mono text-accent">≥ 44px target</span>
                )}
              </div>
              <span className="text-xs font-mono text-muted-foreground mt-4">Standard Action Button</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "keyboard" && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Toolbars and tabs use the <strong>Roving tabindex</strong> pattern: Only one item is in the tab sequence (<code className="text-foreground">tabIndex={0}</code>), and arrow keys cycle through members.
          </div>

          <div className="p-6 bg-black border border-subtle-border rounded-md space-y-4">
            <div className="text-xs font-mono text-muted-foreground">
              CLICK INSIDE TOOLBAR AND USE <kbd className="px-1 bg-secondary-surface border border-border rounded text-foreground">←</kbd> <kbd className="px-1 bg-secondary-surface border border-border rounded text-foreground">→</kbd> ARROW KEYS
            </div>

            <div
              role="toolbar"
              aria-label="Engineering canvas tools"
              className="flex flex-wrap items-center p-1.5 rounded-md border border-border bg-elevated-surface gap-1.5"
            >
              {toolbarButtons.map((btn, idx) => {
                const isSelected = rovingIndex === idx;
                return (
                  <button
                    key={btn}
                    role="button"
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setRovingIndex(idx)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "px-3 py-1.5 text-xs font-mono rounded-md whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                      isSelected
                        ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary-surface"
                    )}
                  >
                    {btn}
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-mono text-muted-foreground">
              Currently focused index: <span className="text-accent font-bold">{rovingIndex}</span> ({toolbarButtons[rovingIndex]})
            </div>
          </div>
        </div>
      )}

      {activeTab === "contrast" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContrastMeter
              foreground="#FFFFFF"
              background="#000000"
              sampleText="White / Canvas"
            />
            <ContrastMeter
              foreground="#A3A3A3"
              background="#000000"
              sampleText="Muted / Canvas"
            />
            <ContrastMeter
              foreground="#FFFFFF"
              background="#FF0000"
              sampleText="White / Red"
            />
            <ContrastMeter
              foreground="#000000"
              background="#FF6600"
              sampleText="Black / Orange"
            />
          </div>
        </div>
      )}

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Focus Ring & Accessible Control Implementation
        </div>
        <CodeBlock
          code={`import { focusRingClasses } from "@nxtqr/design-system";

// Standard accessible button with guaranteed 1px ring and offset
<button
  className={cn(
    "rounded-md border border-border bg-surface px-4 py-2",
    focusRingClasses
  )}
>
  Accessible Control
</button>`}
          language="tsx"
          filename="accessible-control.tsx"
        />
      </div>
    </div>
  );
}
