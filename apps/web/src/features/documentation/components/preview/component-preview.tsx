"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@nxtqr/ui";
import { MonitorIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { CodeBlock } from "../code-block";
import { CodeCopyButton } from "../code-block/code-copy-button";
import { PreviewErrorBoundary } from "./preview-error-boundary";

export interface ComponentPreviewProps {
  name: string;
  code?: string;
  children: React.ReactNode;
  className?: string;
  align?: "center" | "start" | "end";
  filename?: string;
}

export function ComponentPreview({
  name,
  code,
  children,
  className,
  align = "center",
  filename,
}: ComponentPreviewProps) {
  const [activeTab, setActiveTab] = React.useState<"preview" | "code">("preview");
  const [viewport, setViewport] = React.useState<"desktop" | "tablet" | "mobile">("desktop");

  const viewportWidths = {
    desktop: "w-full",
    tablet: "max-w-[640px]",
    mobile: "max-w-[360px]",
  };

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1">
      <Tabs
        defaultValue="preview"
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "preview" | "code")}
      >
        {/* Preview Control Toolbar */}
        <div className="flex items-center justify-between border-b border-border bg-secondary-surface/60 px-4 py-2">
          <div className="flex items-center gap-3">
            {name && (
              <span className="font-mono text-xs font-semibold text-foreground/90 tracking-tight">
                {name}
              </span>
            )}
            <TabsList className="h-7 bg-black/60 p-0.5 border border-subtle-border">
              <TabsTrigger
                value="preview"
                className="h-6 px-3 text-xs font-mono data-[state=active]:bg-surface data-[state=active]:text-foreground"
              >
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="h-6 px-3 text-xs font-mono data-[state=active]:bg-surface data-[state=active]:text-foreground"
              >
                Code
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "preview" && (
              <div className="hidden sm:flex items-center gap-1 border border-border rounded-md p-0.5 bg-black/40">
                <Button
                  variant={viewport === "desktop" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewport("desktop")}
                  aria-label="Desktop preview width"
                  className="h-6 w-6"
                >
                  <MonitorIcon className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewport === "tablet" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewport("tablet")}
                  aria-label="Tablet preview width"
                  className="h-6 w-6 font-mono text-[9px]"
                >
                  TAB
                </Button>
                <Button
                  variant={viewport === "mobile" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewport("mobile")}
                  aria-label="Mobile preview width"
                  className="h-6 w-6 font-mono text-[9px]"
                >
                  MOB
                </Button>
              </div>
            )}

            {code && <CodeCopyButton code={code} />}
          </div>
        </div>

        {/* Live Canvas Viewport */}
        <TabsContent value="preview" className="m-0 p-0">
          <div className="min-h-[200px] w-full flex items-center justify-center p-8 bg-black overflow-x-auto scrollbar-dense transition-all">
            <PreviewErrorBoundary fallbackTitle={`${name} Preview`}>
              <div
                className={cn(
                  "transition-all flex flex-wrap gap-4 items-center w-full",
                  align === "center" && "justify-center",
                  align === "start" && "justify-start",
                  align === "end" && "justify-end",
                  viewportWidths[viewport],
                  className,
                )}
              >
                {children}
              </div>
            </PreviewErrorBoundary>
          </div>
        </TabsContent>

        {/* Source Code View */}
        <TabsContent value="code" className="m-0 p-0">
          <div className="p-4 bg-[#0A0A0A]">
            <CodeBlock
              language="tsx"
              filename={filename ?? `${name.toLowerCase().replace(/\s+/g, "-")}.tsx`}
              code={code ?? "// No source code provided"}
              className="my-0"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
