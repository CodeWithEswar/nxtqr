"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@nxtqr/ui";
import { CopyIcon, CheckIcon, MonitorIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { CodeBlock } from "./code-block";

export interface ComponentPreviewProps {
  name: string;
  code?: string;
  children: React.ReactNode;
  className?: string;
  align?: "center" | "start" | "end";
}

export function ComponentPreview({
  name,
  code,
  children,
  className,
  align = "center",
}: ComponentPreviewProps) {
  const [activeTab, setActiveTab] = React.useState<"preview" | "code">("preview");
  const [viewport, setViewport] = React.useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copied, setCopied] = React.useState(false);

  const viewportWidths = {
    desktop: "w-full",
    tablet: "max-w-[640px]",
    mobile: "max-w-[360px]",
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1">
      <Tabs
        defaultValue="preview"
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "preview" | "code")}
      >
        {/* Preview Control Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary-surface/50 px-4 py-2">
          <div className="flex items-center gap-3">
            {name && (
              <span className="font-mono text-xs font-semibold text-foreground/80">{name}</span>
            )}
            <TabsList className="h-7 bg-black/60 p-0.5">
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

            {code && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                aria-label="Copy component snippet"
                className="h-7 px-2 font-mono text-[10px] bg-black/40 border-border"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-3 w-3 mr-1 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Preview Content */}
        <TabsContent value="preview" className="m-0 p-0">
          <div className="min-h-[200px] w-full flex items-center justify-center p-8 bg-black/70 overflow-x-auto scrollbar-dense transition-all">
            <div
              className={cn(
                "transition-all flex flex-wrap gap-4 items-center",
                align === "center" && "justify-center",
                align === "start" && "justify-start",
                align === "end" && "justify-end",
                viewportWidths[viewport],
                className,
              )}
            >
              {children}
            </div>
          </div>
        </TabsContent>

        {/* Source Code Content */}
        <TabsContent value="code" className="m-0 p-0">
          <div className="p-4 bg-[#0A0A0A]">
            <CodeBlock language="tsx" code={code}>
              {code ?? "// No source code provided"}
            </CodeBlock>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
