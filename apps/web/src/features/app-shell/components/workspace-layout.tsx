"use client";

import * as React from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@nxtqr/ui";
import { useShellStore } from "../store/shell-store";
import { cn } from "@nxtqr/utils";

export interface WorkspaceLayoutProps {
  leftPanel?: React.ReactNode;
  leftPanelDefaultSize?: number;
  leftPanelMinSize?: number;
  leftPanelMaxSize?: number;

  mainContent: React.ReactNode;

  rightPanel?: React.ReactNode;
  rightPanelDefaultSize?: number;
  rightPanelMinSize?: number;
  rightPanelMaxSize?: number;

  bottomPanel?: React.ReactNode;
  bottomPanelDefaultSize?: number;
  bottomPanelMinSize?: number;

  className?: string;
}

export function WorkspaceLayout({
  leftPanel,
  leftPanelDefaultSize = 20,
  leftPanelMinSize = 15,
  leftPanelMaxSize = 35,

  mainContent,

  rightPanel,
  rightPanelDefaultSize = 25,
  rightPanelMinSize = 18,
  rightPanelMaxSize = 40,

  bottomPanel,
  bottomPanelDefaultSize = 25,
  bottomPanelMinSize = 15,

  className,
}: WorkspaceLayoutProps) {
  const secondaryPanelOpen = useShellStore((s) => s.secondaryPanelOpen);
  const bottomPanelOpen = useShellStore((s) => s.bottomPanelOpen);
  const setPanelSizes = useShellStore((s) => s.setWorkspacePanelSizes);

  // Responsive state detection
  const [isDesktop, setIsDesktop] = React.useState(true);

  React.useEffect(() => {
    const checkWidth = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // When on mobile/tablet, render a clean vertical stack with primary content focused
  if (!isDesktop) {
    return (
      <div className={cn("flex flex-col h-full w-full bg-background overflow-hidden", className)}>
        {/* Main interactive content */}
        <main className="flex-1 min-h-0 overflow-hidden">{mainContent}</main>

        {/* Secondary panels converted to mobile tabs/drawer if active */}
        {secondaryPanelOpen && rightPanel && (
          <div className="h-64 border-t border-border-default bg-surface-01 shrink-0 overflow-hidden">
            {rightPanel}
          </div>
        )}

        {bottomPanelOpen && bottomPanel && (
          <div className="h-48 border-t border-border-default bg-surface-01 shrink-0 overflow-hidden">
            {bottomPanel}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Multi-column Resizable Panel System
  return (
    <div className={cn("h-full w-full bg-background overflow-hidden", className)}>
      <ResizablePanelGroup
        direction="vertical"
        className="h-full w-full"
      >
        {/* Top Horizontal Section (Left, Main, Right) */}
        <ResizablePanel defaultSize={bottomPanel && bottomPanelOpen ? 75 : 100} minSize={50}>
          <ResizablePanelGroup
            direction="horizontal"
            onLayout={(sizes) => setPanelSizes(sizes)}
            className="h-full w-full"
          >
            {/* 1. Left Panel (Palette / Explorer) */}
            {leftPanel && (
              <>
                <ResizablePanel
                  defaultSize={leftPanelDefaultSize}
                  minSize={leftPanelMinSize}
                  maxSize={leftPanelMaxSize}
                  collapsible={true}
                  className="bg-surface-01"
                >
                  {leftPanel}
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            {/* 2. Main Central Canvas / Editor */}
            <ResizablePanel defaultSize={60} minSize={30} className="bg-background">
              <main className="h-full w-full overflow-hidden flex flex-col">
                {mainContent}
              </main>
            </ResizablePanel>

            {/* 3. Right Panel (Telemetry / Inspector) */}
            {rightPanel && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel
                  defaultSize={rightPanelDefaultSize}
                  minSize={rightPanelMinSize}
                  maxSize={rightPanelMaxSize}
                  collapsible={true}
                  className="bg-surface-01"
                >
                  {rightPanel}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>

        {/* Bottom Section (Execution Trace / Logs / Terminal) */}
        {bottomPanel && bottomPanelOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={bottomPanelDefaultSize}
              minSize={bottomPanelMinSize}
              collapsible={true}
              className="bg-surface-01"
            >
              {bottomPanel}
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

